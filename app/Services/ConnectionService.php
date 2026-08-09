<?php

namespace App\Services;

use App\Models\Chat;
use App\Models\User;
use App\Repositories\ConnectionRepository;

class ConnectionService
{
    public function __construct(private ConnectionRepository $repo, private CacheService $cache) {}

    public function friendshipState(User $user): array
    {
        return $this->cache->remember("friendships:{$user->id}", 'state', CacheService::MEDIUM,
            fn () => $this->repo->friendshipState($user));
    }

    public function invalidateFriendships(User $first, User $second): void
    {
        $this->cache->invalidate("friendships:{$first->id}", "friendships:{$second->id}");
    }

    public function chatData(User $me, Chat $chat): array
    {
        $other = $chat->users->firstWhere('id', '!=', $me->id);
        $last = $chat->messages->first() ?? $chat->messages()->latest()->first();

        return ['id' => (string) $chat->id, 'withUser' => ['id' => (string) $other->id, 'name' => $other->name, 'avatar' => $other->avatar], 'lastMessage' => $last?->text ?? ($last ? 'Voice message' : 'Start a conversation'), 'lastMessageMine' => $last && (int) $last->sender_id === (int) $me->id, 'lastMessageRead' => $last?->read_at !== null, 'timestamp' => $last?->created_at?->diffForHumans() ?? 'New', 'unreadCount' => $chat->messages()->where('sender_id', '!=', $me->id)->whereNull('read_at')->count()];
    }

    public function chatsPage(User $user, string $term = ''): array
    {
        $page = $this->repo->chatsPage($user, $term);

        return [
            'data' => $page->getCollection()->map(fn (Chat $chat) => $this->chatData($user, $chat))->values(),
            'currentPage' => $page->currentPage(),
            'lastPage' => $page->lastPage(),
            'hasMorePages' => $page->hasMorePages(),
            'total' => $page->total(),
            'unreadTotal' => $this->repo->unreadChatCount($user),
        ];
    }

    public function unreadChatCount(User $user): int
    {
        return $this->repo->unreadChatCount($user);
    }

    public function chat(User $u, Chat $c)
    {
        return $this->chatData($u, $this->repo->chat($u, $c));
    }

    public function invalidateChat(Chat $chat): void
    {
        $chat->users()->pluck('users.id')->each(fn ($id) => $this->cache->invalidate("chats:{$id}"));
    }
}
