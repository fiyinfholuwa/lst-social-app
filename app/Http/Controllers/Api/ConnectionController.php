<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Chat;
use App\Models\User;
use App\Repositories\ConnectionRepository;
use App\Services\ConnectionService;
use Illuminate\Http\Request;

class ConnectionController extends Controller
{
    public function __construct(private ConnectionRepository $repo, private ConnectionService $service) {}

    public function friendships(Request $r)
    {
        return response()->json($this->repo->friendshipState($r->user()));
    }

    public function request(Request $r, User $user)
    {
        $this->repo->request($r->user(), $user);

        return response()->json($this->repo->friendshipState($r->user()));
    }

    public function act(Request $r, User $user)
    {
        $d = $r->validate(['action' => 'required|in:accept,decline,cancel,remove,block,unblock']);
        $this->repo->act($r->user(), $user, $d['action']);

        return response()->json($this->repo->friendshipState($r->user()));
    }

    public function chats(Request $r)
    {
        return response()->json($this->service->chats($r->user()));
    }

    public function chat(Request $r, Chat $chat)
    {
        return response()->json($this->service->chat($r->user(), $chat));
    }

    public function createChat(Request $r, User $user)
    {
        return response()->json($this->service->chat($r->user(), $this->repo->getOrCreateChat($r->user(), $user)));
    }

    public function messages(Request $r, Chat $chat)
    {
        return response()->json($this->repo->messages($r->user(), $chat)->map(fn ($m) => ['id' => (string) $m->id, 'senderId' => (string) $m->sender_id, 'text' => $m->text, 'type' => $m->type, 'audioUri' => $m->audio_uri, 'duration' => $m->duration, 'timestamp' => $m->created_at->diffForHumans()]));
    }

    public function send(Request $r, Chat $chat)
    {
        $d = $r->validate(['text' => 'nullable|string|max:5000', 'type' => 'nullable|in:text,voice', 'audioUri' => 'nullable|string', 'duration' => 'nullable|integer']);
        $m = $this->repo->send($r->user(), $chat, ['text' => $d['text'] ?? null, 'type' => $d['type'] ?? 'text', 'audio_uri' => $d['audioUri'] ?? null, 'duration' => $d['duration'] ?? null]);

        return response()->json(['id' => (string) $m->id, 'senderId' => (string) $m->sender_id, 'text' => $m->text, 'type' => $m->type, 'audioUri' => $m->audio_uri, 'duration' => $m->duration, 'timestamp' => $m->created_at->diffForHumans()], 201);
    }
}
