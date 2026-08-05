<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\UserResource;
use App\Models\Community;
use App\Models\CommunityApplication;
use App\Models\Notification;
use App\Models\Post;
use App\Models\User;
use App\Repositories\SocialRepository;
use App\Services\SocialService;
use Illuminate\Http\Request;

class SocialController extends Controller
{
    public function __construct(private SocialRepository $repo, private SocialService $service) {}

    public function posts()
    {
        return response()->json($this->service->posts());
    }

    public function post(Post $post)
    {
        return response()->json($this->service->post($post->id));
    }

    public function createPost(Request $r)
    {
        $d = $r->validate(['content' => 'required|string|max:10000', 'image' => 'nullable|string', 'communityId' => 'nullable|exists:communities,id', 'type' => 'nullable|string|max:40', 'audience' => 'nullable|string|max:80']);

        return response()->json($this->service->create($r->user(), ['content' => $d['content'], 'image' => $d['image'] ?? null, 'community_id' => $d['communityId'] ?? null, 'type' => $d['type'] ?? 'Encouragement', 'audience' => $d['audience'] ?? 'Everyone']), 201);
    }

    public function like(Request $r, Post $post)
    {
        $this->repo->toggleLike($r->user(), $post);

        return response()->json($this->service->post($post->id));
    }

    public function comment(Request $r, Post $post)
    {
        $d = $r->validate(['text' => 'required|string|max:2000']);
        $c = $this->repo->addComment($r->user(), $post, $d['text'])->load('user');

        return response()->json(['id' => (string) $c->id, 'userId' => (string) $c->user_id, 'userName' => $c->user->name, 'text' => $c->text, 'timestamp' => $c->created_at->diffForHumans()], 201);
    }

    public function saved(Request $r)
    {
        return response()->json(['savedPostIds' => $this->repo->savedIds($r->user())]);
    }

    public function toggleSaved(Request $r, Post $post)
    {
        return response()->json(['saved' => $this->repo->toggleSave($r->user(), $post)]);
    }

    public function communities()
    {
        return response()->json($this->repo->communities()->map(fn ($c) => $this->service->communityData($c)));
    }

    public function community(Community $community)
    {
        return response()->json($this->service->communityData($this->repo->community($community->id)));
    }

    public function members(Community $community)
    {
        return UserResource::collection($community->members()->get());
    }

    public function join(Request $r, Community $community)
    {
        $community->members()->syncWithoutDetaching($r->user()->id);

        return response()->json(['success' => true]);
    }

    public function applications(Request $r)
    {
        $apps = CommunityApplication::where('user_id', $r->user()->id)->get()->mapWithKeys(fn ($a) => [(string) $a->community_id => ['communityId' => (string) $a->community_id, 'answers' => $a->answers, 'status' => $a->status, 'submittedAt' => $a->created_at]]);

        return response()->json(['applications' => $apps]);
    }

    public function apply(Request $r, Community $community)
    {
        $d = $r->validate(['answers' => 'required']);

        return response()->json($this->repo->apply($r->user(), $community, $d['answers']), 201);
    }

    public function withdraw(Request $r, Community $community)
    {
        CommunityApplication::where(['user_id' => $r->user()->id, 'community_id' => $community->id])->delete();

        return response()->json(['success' => true]);
    }

    public function user(User $user)
    {
        return new UserResource($user->load('communities'));
    }

    public function updateProfile(Request $r)
    {
        $d = $r->validate(['name' => 'sometimes|string|max:255', 'bio' => 'nullable|string|max:2000', 'avatar' => 'nullable|string|max:2048']);
        $r->user()->update($d);

        return new UserResource($r->user()->load('communities'));
    }

    public function notifications(Request $r)
    {
        return response()->json($r->user()->notifications()->latest()->get()->map(fn ($n) => ['id' => (string) $n->id, 'icon' => $n->icon, 'title' => $n->title, 'message' => $n->message, 'time' => $n->created_at->diffForHumans(), 'unread' => $n->read_at === null, 'screen' => $n->screen]));
    }

    public function readNotification(Request $r, Notification $notification)
    {
        abort_unless($notification->user_id === $r->user()->id, 403);
        $notification->forceFill(['read_at' => now()])->save();

        return response()->json(['success' => true]);
    }

    public function readAll(Request $r)
    {
        $r->user()->notifications()->whereNull('read_at')->update(['read_at' => now()]);

        return response()->json(['success' => true]);
    }
}
