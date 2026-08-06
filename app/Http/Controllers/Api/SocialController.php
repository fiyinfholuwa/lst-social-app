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
use App\Services\CacheService;
use App\Services\SocialService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class SocialController extends Controller
{
    public function __construct(private SocialRepository $repo, private SocialService $service, private CacheService $cache) {}

    public function posts(Request $r)
    {
        if ($r->has('page')) {
            return response()->json($this->service->postsPage($r->user()));
        }

        return response()->json($this->service->posts($r->user()));
    }

    public function post(Request $r, Post $post)
    {
        return response()->json($this->service->post($post->id, $r->user()));
    }

    public function createPost(Request $r)
    {
        $d = $r->validate([
            'content' => 'required|string|max:10000',
            'images' => 'nullable|array|max:6',
            'images.*' => 'image|max:2048',
        ]);
        if (count($d['existing_images'] ?? []) + count($r->file('images', [])) > 6) {
            throw ValidationException::withMessages(['images' => 'A post can have up to 6 photos.']);
        }

        $images = collect($r->file('images', []))->map(function ($image) use ($r) {
            $path = $image->store('posts', 'public');

            return $r->getSchemeAndHttpHost().Storage::url($path);
        })->values()->all();

        return response()->json($this->service->create($r->user(), ['content' => $d['content'], 'images' => $images ?: null, 'image' => $images[0] ?? null, 'community_id' => null, 'type' => 'Post', 'audience' => 'Everyone']), 201);
    }

    public function updatePost(Request $r, Post $post)
    {
        abort_unless((int) $post->user_id === (int) $r->user()->id, 403, 'You can only edit your own posts.');
        $d = $r->validate([
            'content' => 'required|string|max:10000',
            'existing_images' => 'nullable|array|max:6',
            'existing_images.*' => 'string|max:2048',
            'images' => 'nullable|array|max:6',
            'images.*' => 'image|max:2048',
        ]);

        $currentImages = $post->images ?: ($post->image ? [$post->image] : []);
        $keptImages = collect($d['existing_images'] ?? [])
            ->filter(fn ($image) => in_array($image, $currentImages, true))
            ->unique()
            ->values();
        $newImages = collect($r->file('images', []))->map(function ($image) use ($r) {
            $path = $image->store('posts', 'public');

            return $r->getSchemeAndHttpHost().Storage::url($path);
        });
        $images = $keptImages->concat($newImages)->take(6)->values()->all();

        foreach (array_diff($currentImages, $keptImages->all()) as $image) {
            $path = parse_url($image, PHP_URL_PATH);
            if ($path && Str::contains($path, '/storage/posts/')) {
                Storage::disk('public')->delete(Str::after($path, '/storage/'));
            }
        }

        $post->update([
            'content' => trim($d['content']),
            'images' => $images ?: null,
            'image' => $images[0] ?? null,
        ]);
        $this->service->invalidatePost($post);

        return response()->json($this->service->post($post->id, $r->user()));
    }

    public function deletePost(Request $r, Post $post)
    {
        abort_unless((int) $post->user_id === (int) $r->user()->id, 403, 'You can only delete your own posts.');

        $postId = $post->id;
        $userId = $post->user_id;
        $communityId = $post->community_id;
        $savedByUserIds = DB::table('saved_posts')->where('post_id', $postId)->pluck('user_id');
        $images = $post->images ?: ($post->image ? [$post->image] : []);
        $post->delete();

        foreach ($images as $image) {
            $path = parse_url($image, PHP_URL_PATH);
            if ($path && Str::contains($path, '/storage/posts/')) {
                Storage::disk('public')->delete(Str::after($path, '/storage/'));
            }
        }

        $scopes = ['posts', "post:{$postId}", "user:{$userId}"];
        foreach ($savedByUserIds as $savedByUserId) {
            $scopes[] = "saved:{$savedByUserId}";
        }
        if ($communityId) {
            $scopes[] = "community:{$communityId}";
        }
        $this->cache->invalidate(...$scopes);

        return response()->json(['message' => 'Post deleted.']);
    }

    public function like(Request $r, Post $post)
    {
        $this->repo->toggleLike($r->user(), $post);
        $this->service->invalidatePost($post);

        return response()->json($this->service->post($post->id, $r->user()));
    }

    public function comment(Request $r, Post $post)
    {
        $d = $r->validate(['text' => 'required|string|max:2000']);
        $c = $this->repo->addComment($r->user(), $post, $d['text'])->load('user');
        $this->service->invalidatePost($post);

        return response()->json(['id' => (string) $c->id, 'userId' => (string) $c->user_id, 'userName' => $c->user->name, 'text' => $c->text, 'timestamp' => $c->created_at->diffForHumans()], 201);
    }

    public function saved(Request $r)
    {
        $ids = $this->cache->remember("saved:{$r->user()->id}", 'ids', CacheService::MEDIUM,
            fn () => $this->repo->savedIds($r->user()));

        return response()->json(['savedPostIds' => $ids]);
    }

    public function toggleSaved(Request $r, Post $post)
    {
        $saved = $this->repo->toggleSave($r->user(), $post);
        $this->cache->invalidate("saved:{$r->user()->id}");

        return response()->json(['saved' => $saved]);
    }

    public function communities()
    {
        return response()->json($this->cache->remember('communities', 'list', CacheService::LONG,
            fn () => $this->repo->communities()->map(fn ($c) => $this->service->communityData($c))->all()));
    }

    public function community(Community $community)
    {
        return response()->json($this->cache->remember("community:{$community->id}", 'detail', CacheService::MEDIUM,
            fn () => $this->service->communityData($this->repo->community($community->id))));
    }

    public function members(Community $community)
    {
        $members = $this->cache->remember("community:{$community->id}", 'members', CacheService::MEDIUM,
            fn () => UserResource::collection($community->members()->get())->resolve());

        return response()->json(['data' => $members]);
    }

    public function join(Request $r, Community $community)
    {
        $community->members()->syncWithoutDetaching($r->user()->id);
        $this->cache->invalidate('communities', "community:{$community->id}", "user:{$r->user()->id}");

        return response()->json(['success' => true]);
    }

    public function applications(Request $r)
    {
        $apps = $this->cache->remember("applications:{$r->user()->id}", 'list', CacheService::MEDIUM,
            fn () => CommunityApplication::where('user_id', $r->user()->id)->get()->mapWithKeys(fn ($a) => [(string) $a->community_id => ['communityId' => (string) $a->community_id, 'answers' => $a->answers, 'status' => $a->status, 'submittedAt' => $a->created_at]])->all());

        return response()->json(['applications' => $apps]);
    }

    public function apply(Request $r, Community $community)
    {
        $d = $r->validate(['answers' => 'required']);

        $application = $this->repo->apply($r->user(), $community, $d['answers']);
        $this->cache->invalidate("applications:{$r->user()->id}");

        return response()->json($application, 201);
    }

    public function withdraw(Request $r, Community $community)
    {
        CommunityApplication::where(['user_id' => $r->user()->id, 'community_id' => $community->id])->delete();
        $this->cache->invalidate("applications:{$r->user()->id}");

        return response()->json(['success' => true]);
    }

    public function user(Request $request, User $user)
    {
        return response()->json($this->cache->remember("user:{$user->id}", 'profile', CacheService::LONG,
            fn () => (new UserResource($user->load('communities')))->resolve($request)));
    }

    public function updateProfile(Request $r)
    {
        $d = $r->validate(['name' => 'sometimes|string|max:255', 'bio' => 'nullable|string|max:2000', 'avatar' => 'nullable|string|max:2048']);
        $r->user()->update($d);
        $this->cache->invalidate("user:{$r->user()->id}", 'posts');

        return new UserResource($r->user()->load('communities'));
    }

    public function notifications(Request $r)
    {
        return response()->json($this->cache->remember("notifications:{$r->user()->id}", 'list', CacheService::SHORT,
            fn () => $r->user()->notifications()->latest()->get()->map(fn ($n) => ['id' => (string) $n->id, 'icon' => $n->icon, 'title' => $n->title, 'message' => $n->message, 'time' => $n->created_at->diffForHumans(), 'unread' => $n->read_at === null, 'screen' => $n->screen])->all()));
    }

    public function readNotification(Request $r, Notification $notification)
    {
        abort_unless($notification->user_id === $r->user()->id, 403);
        $notification->forceFill(['read_at' => now()])->save();
        $this->cache->invalidate("notifications:{$r->user()->id}");

        return response()->json(['success' => true]);
    }

    public function readAll(Request $r)
    {
        $r->user()->notifications()->whereNull('read_at')->update(['read_at' => now()]);
        $this->cache->invalidate("notifications:{$r->user()->id}");

        return response()->json(['success' => true]);
    }
}
