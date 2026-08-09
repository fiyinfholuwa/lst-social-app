<?php

namespace App\Repositories;

use App\Models\Chat;
use App\Models\Friendship;
use App\Models\Message;
use App\Models\User;
use Illuminate\Support\Facades\DB;

class ConnectionRepository
{
    public function searchUsers(User $user, string $term)
    {
        $term = trim($term);

        return User::query()
            ->select(['id', 'name', 'avatar', 'bio'])
            ->whereKeyNot($user->id)
            ->where(function ($query) use ($term) {
                $query->where('name', 'like', "%{$term}%")
                    ->orWhere('first_name', 'like', "%{$term}%")
                    ->orWhere('last_name', 'like', "%{$term}%");
            })
            ->whereNotExists(fn ($query) => $query->selectRaw('1')
                ->from('user_blocks')
                ->where(function ($blocks) use ($user) {
                    $blocks->where(fn ($block) => $block
                        ->whereColumn('user_blocks.blocked_user_id', 'users.id')
                        ->where('user_blocks.user_id', $user->id))
                        ->orWhere(fn ($block) => $block
                            ->whereColumn('user_blocks.user_id', 'users.id')
                            ->where('user_blocks.blocked_user_id', $user->id));
                }))
            ->orderBy('name')
            ->limit(20)
            ->get();
    }

    public function friendshipState(User $user): array
    {
        $accepted = Friendship::where('status', 'accepted')->where(fn ($q) => $q->where('sender_id', $user->id)->orWhere('receiver_id', $user->id))->get();

        return [
            'friendIds' => $accepted->map(fn ($f) => (string) ($f->sender_id === $user->id ? $f->receiver_id : $f->sender_id))->values()->all(),
            'outgoingRequestIds' => Friendship::where('sender_id', $user->id)->where('status', 'pending')->pluck('receiver_id')->map(fn ($id) => (string) $id)->values()->all(),
            'incomingRequestIds' => Friendship::where('receiver_id', $user->id)->where('status', 'pending')->pluck('sender_id')->map(fn ($id) => (string) $id)->values()->all(),
            'blockedUserIds' => DB::table('user_blocks')->where('user_id', $user->id)->pluck('blocked_user_id')->map(fn ($id) => (string) $id)->values()->all(),
        ];
    }

    public function friendsPage(User $user, int $perPage = 30)
    {
        return User::query()
            ->whereKeyNot($user->id)
            ->whereExists(fn ($query) => $query->selectRaw('1')
                ->from('friendships')
                ->where('status', 'accepted')
                ->where(fn ($friendship) => $friendship
                    ->where(fn ($pair) => $pair
                        ->where('sender_id', $user->id)
                        ->whereColumn('receiver_id', 'users.id'))
                    ->orWhere(fn ($pair) => $pair
                        ->where('receiver_id', $user->id)
                        ->whereColumn('sender_id', 'users.id'))))
            ->orderBy('name')
            ->paginate($perPage);
    }

    public function request(User $user, User $other): void
    {
        Friendship::updateOrCreate(['sender_id' => $user->id, 'receiver_id' => $other->id], ['status' => 'pending']);
    }

    public function act(User $user, User $other, string $action): void
    {
        $query = Friendship::where(fn ($q) => $q->where(['sender_id' => $user->id, 'receiver_id' => $other->id])->orWhere(fn ($x) => $x->where(['sender_id' => $other->id, 'receiver_id' => $user->id])));
        if ($action === 'block') {
            abort_unless((clone $query)->where('status', 'accepted')->exists(), 422, 'You can only block an account that is currently your friend.');
        }
        if ($action === 'accept') {
            $query->update(['status' => 'accepted']);
        } else {
            $query->delete();
        }
        if ($action === 'block') {
            DB::table('user_blocks')->insertOrIgnore(['user_id' => $user->id, 'blocked_user_id' => $other->id, 'created_at' => now(), 'updated_at' => now()]);
        }
        if ($action === 'unblock') {
            DB::table('user_blocks')->where(['user_id' => $user->id, 'blocked_user_id' => $other->id])->delete();
        }
    }

    public function chatsPage(User $user, string $term = '', int $perPage = 20)
    {
        return $user->belongsToMany(Chat::class)
            ->with(['users', 'messages' => fn ($q) => $q->latest()->limit(1)])
            ->when($term !== '', fn ($query) => $query->where(fn ($search) => $search
                ->whereHas('users', fn ($users) => $users->whereKeyNot($user->id)->where('name', 'like', "%{$term}%"))
                ->orWhereHas('messages', fn ($messages) => $messages->where('text', 'like', "%{$term}%"))))
            ->latest('chats.updated_at')
            ->paginate($perPage);
    }

    public function unreadChatCount(User $user): int
    {
        return Chat::whereHas('users', fn ($users) => $users->whereKey($user->id))
            ->whereHas('messages', fn ($messages) => $messages->where('sender_id', '!=', $user->id)->whereNull('read_at'))
            ->count();
    }

    public function chat(User $user, Chat $chat): Chat
    {
        abort_unless($chat->users()->whereKey($user->id)->exists(), 403);

        return $chat->load('users');
    }

    public function getOrCreateChat(User $user, User $other): Chat
    {
        $chat = Chat::whereHas('users', fn ($q) => $q->whereKey($user->id))->whereHas('users', fn ($q) => $q->whereKey($other->id))->withCount('users')->get()->firstWhere('users_count', 2);
        if (! $chat) {
            $chat = Chat::create();
            $chat->users()->attach([$user->id, $other->id]);
        }

        return $chat->load('users');
    }

    public function messages(User $user, Chat $chat)
    {
        $this->chat($user, $chat);
        $chat->messages()->where('sender_id', '!=', $user->id)->whereNull('read_at')->update(['read_at' => now()]);

        return $chat->messages()->oldest()->get();
    }

    public function send(User $user, Chat $chat, array $data): Message
    {
        $this->chat($user, $chat);
        $chat->touch();

        return $chat->messages()->create($data + ['sender_id' => $user->id]);
    }

}
