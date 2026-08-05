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

        return ['id' => (string) $chat->id, 'withUser' => ['id' => (string) $other->id, 'name' => $other->name, 'avatar' => $other->avatar], 'lastMessage' => $last?->text ?? ($last ? 'Voice message' : 'Start a conversation'), 'timestamp' => $last?->created_at?->diffForHumans() ?? 'New'];
    }

    public function chats(User $u)
    {
        return $this->cache->remember("chats:{$u->id}", 'list', CacheService::SHORT,
            fn () => $this->repo->chats($u)->map(fn ($c) => $this->chatData($u, $c))->all());
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
