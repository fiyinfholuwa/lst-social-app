<?php

namespace App\Repositories;

use App\Models\Chat;
use App\Models\Friendship;
use App\Models\Message;
use App\Models\User;
use Illuminate\Support\Facades\DB;

class ConnectionRepository
{
    public function friendshipState(User $user): array
    {
        $accepted = Friendship::where('status', 'accepted')->where(fn ($q) => $q->where('sender_id', $user->id)->orWhere('receiver_id', $user->id))->get();

        return [
            'friendIds' => $accepted->map(fn ($f) => (string) ($f->sender_id === $user->id ? $f->receiver_id : $f->sender_id))->values(),
            'outgoingRequestIds' => Friendship::where('sender_id', $user->id)->where('status', 'pending')->pluck('receiver_id')->map(fn ($id) => (string) $id),
            'incomingRequestIds' => Friendship::where('receiver_id', $user->id)->where('status', 'pending')->pluck('sender_id')->map(fn ($id) => (string) $id),
            'blockedUserIds' => DB::table('user_blocks')->where('user_id', $user->id)->pluck('blocked_user_id')->map(fn ($id) => (string) $id),
        ];
    }

    public function request(User $user, User $other): void
    {
        Friendship::updateOrCreate(['sender_id' => $user->id, 'receiver_id' => $other->id], ['status' => 'pending']);
    }

    public function act(User $user, User $other, string $action): void
    {
        $query = Friendship::where(fn ($q) => $q->where(['sender_id' => $user->id, 'receiver_id' => $other->id])->orWhere(fn ($x) => $x->where(['sender_id' => $other->id, 'receiver_id' => $user->id])));
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

    public function chats(User $user)
    {
        return $user->belongsToMany(Chat::class)->with(['users', 'messages' => fn ($q) => $q->latest()->limit(1)])->latest('chats.updated_at')->get();
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

        return $chat->messages()->oldest()->get();
    }

    public function send(User $user, Chat $chat, array $data): Message
    {
        $this->chat($user, $chat);
        $chat->touch();

        return $chat->messages()->create($data + ['sender_id' => $user->id]);
    }
}
