<?php

namespace App\Services;

use App\Models\Chat;
use App\Models\User;
use App\Repositories\ConnectionRepository;

class ConnectionService
{
    public function __construct(private ConnectionRepository $repo) {}

    public function chatData(User $me, Chat $chat): array
    {
        $other = $chat->users->firstWhere('id', '!=', $me->id);
        $last = $chat->messages->first() ?? $chat->messages()->latest()->first();

        return ['id' => (string) $chat->id, 'withUser' => ['id' => (string) $other->id, 'name' => $other->name, 'avatar' => $other->avatar], 'lastMessage' => $last?->text ?? ($last ? 'Voice message' : 'Start a conversation'), 'timestamp' => $last?->created_at?->diffForHumans() ?? 'New'];
    }

    public function chats(User $u)
    {
        return $this->repo->chats($u)->map(fn ($c) => $this->chatData($u, $c));
    }

    public function chat(User $u, Chat $c)
    {
        return $this->chatData($u, $this->repo->chat($u, $c));
    }
}
