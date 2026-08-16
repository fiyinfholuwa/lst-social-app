<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Chat;
use App\Models\Message;
use App\Models\MessageReaction;
use App\Models\MessageDeletion;
use App\Models\User;
use App\Http\Resources\UserResource;
use App\Repositories\ConnectionRepository;
use App\Repositories\NotificationRepository;
use App\Services\ConnectionService;
use App\Services\UploadService;
use Illuminate\Http\Request;

class ConnectionController extends Controller
{
    public function __construct(private ConnectionRepository $repo, private ConnectionService $service, private UploadService $uploads, private NotificationRepository $notifications) {}

    public function friendships(Request $r)
    {
        return response()->json($this->service->friendshipState($r->user()));
    }

    public function friends(Request $r)
    {
        $page = $this->repo->friendsPage($r->user());

        return response()->json([
            'data' => $page->getCollection()->map(fn (User $user) => (new UserResource($user))->resolve($r))->values(),
            'currentPage' => $page->currentPage(),
            'lastPage' => $page->lastPage(),
            'hasMorePages' => $page->hasMorePages(),
            'total' => $page->total(),
        ]);
    }

    public function searchUsers(Request $r)
    {
        $data = $r->validate(['q' => 'required|string|min:2|max:100', 'page' => 'nullable|integer|min:1']);
        $page = $this->repo->searchUsers($r->user(), $data['q']);

        return response()->json($this->userPageData($page, $r));
    }

    public function friendRequests(Request $r)
    {
        $data = $r->validate(['direction' => 'nullable|in:incoming,outgoing', 'page' => 'nullable|integer|min:1']);

        return response()->json($this->userPageData($this->repo->friendRequestsPage($r->user(), $data['direction'] ?? 'incoming'), $r));
    }

    public function blockedUsers(Request $r)
    {
        return response()->json($this->userPageData($this->repo->blockedUsersPage($r->user()), $r));
    }

    public function request(Request $r, User $user)
    {
        abort_if($r->user()->is($user), 422, 'You cannot send a friend request to yourself.');
        $this->repo->request($r->user(), $user);
        $this->service->invalidateFriendships($r->user(), $user);
        $this->notifications->createFor($user, [
            'icon' => 'person-add', 'title' => 'New friend request',
            'message' => $r->user()->name.' sent you a friend request.',
            'screen' => 'UserProfile', 'route_params' => ['userId' => (string) $r->user()->id],
        ]);

        return response()->json($this->service->friendshipState($r->user()));
    }

    public function act(Request $r, User $user)
    {
        $d = $r->validate(['action' => 'required|in:accept,decline,cancel,remove,block,unblock']);
        $this->repo->act($r->user(), $user, $d['action']);
        $this->service->invalidateFriendships($r->user(), $user);
        if ($d['action'] === 'accept') {
            $this->notifications->createFor($user, [
                'icon' => 'people', 'title' => 'Friend request accepted',
                'message' => $r->user()->name.' accepted your friend request.',
                'screen' => 'UserProfile', 'route_params' => ['userId' => (string) $r->user()->id],
            ]);
        }

        return response()->json($this->service->friendshipState($r->user()));
    }

    public function chats(Request $r)
    {
        $data = $r->validate(['q' => 'nullable|string|max:100']);

        return response()->json($this->service->chatsPage($r->user(), trim($data['q'] ?? '')));
    }

    public function unreadChatCount(Request $r)
    {
        return response()->json(['count' => $this->service->unreadChatCount($r->user())]);
    }

    public function chat(Request $r, Chat $chat)
    {
        return response()->json($this->service->chat($r->user(), $chat));
    }

    public function createChat(Request $r, User $user)
    {
        $chat = $this->repo->getOrCreateChat($r->user(), $user);
        $this->service->invalidateChat($chat);

        return response()->json($this->service->chat($r->user(), $chat));
    }

    public function messages(Request $r, Chat $chat)
    {
        if ($r->has('page')) {
            $page = $this->repo->messagesPage($r->user(), $chat);
            $this->service->invalidateChat($chat);

            return response()->json([
                'data' => $page->getCollection()->map(fn (Message $message) => $this->messageData($message))->values(),
                'currentPage' => $page->currentPage(),
                'lastPage' => $page->lastPage(),
                'hasMorePages' => $page->hasMorePages(),
                'total' => $page->total(),
            ]);
        }

        $messages = $this->repo->messages($r->user(), $chat);
        $this->service->invalidateChat($chat);

        return response()->json($messages->map(fn (Message $message) => $this->messageData($message)));
    }

    public function send(Request $r, Chat $chat)
    {
        $d = $r->validate([
            'text' => 'nullable|required_if:type,text|string|max:5000',
            'type' => 'nullable|in:text,voice',
            'audio' => 'nullable|required_if:type,voice|file|extensions:m4a,mp4,caf,wav,mp3,aac|max:15360',
            'duration' => 'nullable|required_if:type,voice|integer|min:500|max:600000',
        ]);

        $audioPath = $r->hasFile('audio')
            ? $this->uploads->store($r->file('audio'), 'voice-notes')
            : null;

        $m = $this->repo->send($r->user(), $chat, [
            'text' => $d['text'] ?? null,
            'type' => $d['type'] ?? 'text',
            'audio_uri' => $audioPath,
            'duration' => $d['duration'] ?? null,
        ]);
        $this->service->invalidateChat($chat);
        $recipient = $chat->users->first(fn (User $participant) => ! $participant->is($r->user()));
        if ($recipient) {
            $preview = ($d['type'] ?? 'text') === 'voice' ? 'sent you a voice message.' : ': '.str($d['text'])->limit(100);
            $this->notifications->createFor($recipient, [
                'icon' => 'chatbubble', 'title' => $r->user()->name,
                'message' => ($d['type'] ?? 'text') === 'voice' ? $r->user()->name.' '.$preview : $r->user()->name.$preview,
                'screen' => 'ChatDetail', 'route_params' => ['chatId' => (string) $chat->id, 'userName' => $r->user()->name],
            ]);
        }

        return response()->json($this->messageData($m), 201);
    }

    public function updateMessage(Request $r, Chat $chat, Message $message)
    {
        $this->authorizeMessageEdit($r, $chat, $message);
        abort_unless($message->type === 'text', 422, 'Only text messages can be edited.');
        $data = $r->validate(['text' => 'required|string|max:5000']);
        $message->update(['text' => trim($data['text']), 'edited_at' => now()]);
        $this->service->invalidateChat($chat);

        return response()->json($this->messageData($message->load('reactions')));
    }

    public function deleteMessage(Request $r, Chat $chat, Message $message)
    {
        $this->repo->chat($r->user(), $chat);
        abort_unless($message->chat_id === $chat->id, 404);
        $data = $r->validate(['scope' => 'required|in:me,everyone']);

        if ($data['scope'] === 'everyone') {
            abort_unless($message->sender_id === $r->user()->id, 403, 'You can only delete your own messages for everyone.');
            $message->delete();
            $chat->touch();
        } else {
            MessageDeletion::firstOrCreate(['message_id' => $message->id, 'user_id' => $r->user()->id]);
        }
        $this->service->invalidateChat($chat);

        return response()->json(['message' => $data['scope'] === 'everyone' ? 'Message deleted for everyone.' : 'Message deleted for you.']);
    }

    public function reactToMessage(Request $r, Chat $chat, Message $message)
    {
        $this->repo->chat($r->user(), $chat);
        abort_unless($message->chat_id === $chat->id, 404);
        $data = $r->validate(['emoji' => 'nullable|in:❤️,👍,😂,😮,😢,🙏']);
        $emoji = $data['emoji'] ?? null;

        if ($emoji === null) {
            MessageReaction::where(['message_id' => $message->id, 'user_id' => $r->user()->id])->delete();
        } else {
            MessageReaction::updateOrCreate(
                ['message_id' => $message->id, 'user_id' => $r->user()->id],
                ['emoji' => $emoji],
            );
        }

        return response()->json($this->messageData($message->load('reactions')));
    }

    private function authorizeMessageEdit(Request $request, Chat $chat, Message $message): void
    {
        $this->repo->chat($request->user(), $chat);
        abort_unless($message->chat_id === $chat->id, 404);
        abort_unless($message->sender_id === $request->user()->id, 403, 'You can only change your own messages.');
        abort_if($message->created_at->lte(now()->subMinutes(15)), 422, 'Messages can only be edited or deleted within 15 minutes.');
    }

    private function messageData(Message $message): array
    {
        $reactions = $message->relationLoaded('reactions') ? $message->reactions : $message->reactions()->get();

        return [
            'id' => (string) $message->id,
            'senderId' => (string) $message->sender_id,
            'text' => $message->text,
            'type' => $message->type,
            'audioUri' => $message->audio_uri
                ? $this->uploads->url($message->audio_uri)
                : null,
            'duration' => $message->duration,
            'read' => $message->read_at !== null,
            'timestamp' => $message->created_at->diffForHumans(),
            'createdAt' => $message->created_at->toIso8601String(),
            'edited' => $message->edited_at !== null,
            'reactions' => $reactions->groupBy('emoji')->map(fn ($items, $emoji) => [
                'emoji' => $emoji,
                'count' => $items->count(),
                'reactedByCurrentUser' => $items->contains('user_id', request()->user()?->id),
            ])->values()->all(),
        ];
    }

    private function userPageData($page, Request $request): array
    {
        return [
            'data' => $page->getCollection()->map(fn (User $user) => (new UserResource($user))->resolve($request))->values(),
            'currentPage' => $page->currentPage(),
            'lastPage' => $page->lastPage(),
            'hasMorePages' => $page->hasMorePages(),
            'total' => $page->total(),
        ];
    }
}
