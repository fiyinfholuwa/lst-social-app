<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\UserResource;
use App\Models\Community;
use App\Models\CommunityApplication;
use App\Models\Comment;
use App\Models\Notification;
use App\Models\Post;
use App\Models\SupportRequest;
use App\Models\User;
use App\Repositories\SocialRepository;
use App\Services\CacheService;
use App\Services\SocialService;
use App\Services\UploadService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;
use Illuminate\Validation\Rule;

class SocialController extends Controller
{
    public function __construct(private SocialRepository $repo, private SocialService $service, private CacheService $cache, private UploadService $uploads) {}

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
        abort_unless($r->user()->hasVerifiedEmail(), 403, 'Verify your email before posting to the timeline.');
        $d = $r->validate([
            'content' => 'required|string|max:10000',
            'images' => 'nullable|array|max:6',
            'images.*' => 'image|max:2048',
        ]);
        if (count($d['existing_images'] ?? []) + count($r->file('images', [])) > 6) {
            throw ValidationException::withMessages(['images' => 'A post can have up to 6 photos.']);
        }

        $images = collect($r->file('images', []))->map(fn ($image) => $this->storePostImage($image))->values()->all();

        $isAdmin = in_array($r->user()->role, ['admin', 'super_admin'], true);

        return response()->json($this->service->create($r->user(), ['content' => $d['content'], 'images' => $images ?: null, 'image' => $images[0] ?? null, 'community_id' => null, 'type' => 'Post', 'audience' => $isAdmin ? 'Everyone' : 'Friends', 'status' => 'approved']), 201);
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
        $currentImagesByPath = collect($currentImages)->keyBy(fn ($image) => parse_url($image, PHP_URL_PATH));
        $keptImages = collect($d['existing_images'] ?? [])
            ->map(fn ($image) => $currentImagesByPath->get(parse_url($image, PHP_URL_PATH)))
            ->filter()
            ->unique()
            ->values();
        $newImages = collect($r->file('images', []))->map(fn ($image) => $this->storePostImage($image));
        $images = $keptImages->concat($newImages)->take(6)->values()->all();

        foreach (array_diff($currentImages, $keptImages->all()) as $image) {
            $this->deletePostImage($image);
        }

        $post->update([
            'content' => trim($d['content']),
            'images' => $images ?: null,
            'image' => $images[0] ?? null,
            'status' => $post->community_id ? 'pending' : $post->status,
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
            $this->deletePostImage($image);
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

    public function sharePost(Request $r, Post $post)
    {
        abort_unless($r->user()->hasVerifiedEmail(), 403, 'Verify your email before sharing a post.');
        $post = $this->repo->post($post->id, $r->user());
        abort_unless($post->community_id === null && $post->status === 'approved', 422, 'Only posts from the general feed can be shared.');
        $data = $r->validate(['note' => 'nullable|string|max:5000']);
        $original = $post->originalPost ?: $post;

        return response()->json($this->service->create($r->user(), [
            'content' => trim($data['note'] ?? ''),
            'original_post_id' => $original->id,
            'community_id' => null,
            'type' => 'Shared post',
            'audience' => 'Friends',
            'status' => 'approved',
        ]), 201);
    }

    public function comment(Request $r, Post $post)
    {
        $d = $r->validate(['text' => 'required|string|max:2000', 'parent_id' => 'nullable|integer']);
        if (!empty($d['parent_id'])) {
            abort_unless($post->comments()->whereNull('parent_id')->whereKey($d['parent_id'])->exists(), 422, 'Replies can only be added to a main comment.');
            abort_if(
                $post->comments()->where('parent_id', $d['parent_id'])->where('user_id', $r->user()->id)->exists(),
                422,
                'You have already replied to this comment.'
            );
        }
        $c = $this->repo->addComment($r->user(), $post, $d['text'], $d['parent_id'] ?? null)->load(['user', 'likes']);
        $this->service->invalidatePost($post);

        return response()->json($this->service->commentData($c), 201);
    }

    public function comments(Request $r, Post $post)
    {
        $page = $this->repo->commentsPage($post, $r->user());

        return response()->json($this->commentPageData($page));
    }

    public function replies(Request $r, Post $post, Comment $comment)
    {
        $page = $this->repo->repliesPage($post, $comment, $r->user());

        return response()->json($this->commentPageData($page));
    }

    public function likeComment(Request $r, Comment $comment)
    {
        $this->repo->toggleCommentLike($r->user(), $comment);
        $this->service->invalidatePost($comment->post);

        return response()->json(['liked' => $comment->likes()->whereKey($r->user()->id)->exists(), 'likes' => $comment->likes()->count()]);
    }

    public function updateComment(Request $r, Comment $comment)
    {
        abort_unless((int) $comment->user_id === (int) $r->user()->id, 403, 'You can only edit your own comment.');
        $data = $r->validate(['text' => 'required|string|max:2000']);
        $comment->update(['text' => trim($data['text'])]);
        $this->service->invalidatePost($comment->post);

        return response()->json($this->service->commentData($comment->load(['user', 'likes'])->loadCount(['likes', 'replies'])));
    }

    public function deleteComment(Request $r, Comment $comment)
    {
        abort_unless((int) $comment->user_id === (int) $r->user()->id, 403, 'You can only delete your own comment.');
        $post = $comment->post;
        $comment->delete();
        $this->service->invalidatePost($post);

        return response()->json(['message' => 'Comment deleted.']);
    }

    public function saved(Request $r)
    {
        if ($r->has('page')) {
            $page = $this->repo->savedPostsPage($r->user(), $r->user());

            return response()->json($this->postPageData($page));
        }

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

    public function communities(Request $request)
    {
        if ($request->has('page')) {
            $page = $this->repo->communitiesPage();

            return response()->json([
                'data' => $page->getCollection()->map(fn ($community) => $this->service->communityData($community))->values(),
                'currentPage' => $page->currentPage(),
                'lastPage' => $page->lastPage(),
                'hasMorePages' => $page->hasMorePages(),
                'total' => $page->total(),
            ]);
        }

        return response()->json($this->cache->remember('communities', 'list', CacheService::LONG,
            fn () => $this->repo->communities()->map(fn ($c) => $this->service->communityData($c))->all()));
    }

    public function userPosts(Request $request, User $user)
    {
        return response()->json($this->postPageData($this->repo->userPostsPage($user, $request->user())));
    }

    public function community(Request $r, Community $community)
    {
        return response()->json($this->service->communityData($this->repo->community($community->id, $r->user())));
    }

    public function communityPosts(Request $r, Community $community)
    {
        abort_unless(
            $community->members()->whereKey($r->user()->id)->exists(),
            403,
            'Join this community to view member posts.'
        );
        $page = $this->repo->communityPostsPage($community, $r->user());

        return response()->json([
            'data' => $page->getCollection()->map(fn (Post $post) => $this->service->postData($post))->values(),
            'currentPage' => $page->currentPage(),
            'lastPage' => $page->lastPage(),
            'hasMorePages' => $page->hasMorePages(),
        ]);
    }

    public function members(Request $r, Community $community)
    {
        abort_unless(
            $community->members()->whereKey($r->user()->id)->exists(),
            403,
            'Join this community to view its members.'
        );
        $preview = $this->cache->remember("community:{$community->id}", 'members-preview-v2', CacheService::MEDIUM, function () use ($community) {
            $query = $community->members();
            $total = (clone $query)->count();

            return [
                'data' => UserResource::collection($query->orderBy('community_user.created_at')->limit(20)->get())->resolve(),
                'total' => $total,
            ];
        });

        return response()->json([
            ...$preview,
            'hasMore' => $preview['total'] > count($preview['data']),
        ]);
    }

    public function memberDirectory(Request $r, Community $community)
    {
        abort_unless(
            $community->members()->whereKey($r->user()->id)->exists(),
            403,
            'Join this community to view its members.'
        );
        $filters = $r->validate([
            'q' => 'nullable|string|max:100',
            'page' => 'nullable|integer|min:1',
        ]);
        $search = trim($filters['q'] ?? '');
        $members = $community->members()
            ->whereKeyNot($r->user()->id)
            ->when($search !== '', fn ($query) => $query->where('name', 'like', "%{$search}%"))
            ->orderBy('name')
            ->paginate(30);

        return response()->json([
            'data' => $members->getCollection()->map(fn (User $user) => [
                'id' => (string) $user->id,
                'name' => $user->name,
                'avatar' => $this->service->mediaUrl($user->avatar),
                'bio' => $user->bio,
            ])->values(),
            'currentPage' => $members->currentPage(),
            'lastPage' => $members->lastPage(),
            'hasMorePages' => $members->hasMorePages(),
            'total' => $members->total(),
        ]);
    }

    public function join(Request $r, Community $community)
    {
        abort_unless($r->user()->hasVerifiedEmail(), 403, 'Verify your email before joining a community.');
        $community->members()->syncWithoutDetaching($r->user()->id);
        $this->cache->invalidate('communities', "community:{$community->id}", "user:{$r->user()->id}");

        return response()->json(['success' => true]);
    }

    public function leave(Request $r, Community $community)
    {
        $community->members()->detach($r->user()->id);
        $this->cache->invalidate('communities', "community:{$community->id}", "user:{$r->user()->id}");

        return response()->json(['success' => true]);
    }

    public function createCommunityPost(Request $r, Community $community)
    {
        abort_unless($r->user()->hasVerifiedEmail(), 403, 'Verify your email before posting in a community.');
        abort_unless($community->members()->whereKey($r->user()->id)->exists(), 403, 'Only community members can submit posts.');
        $data = $r->validate([
            'content' => 'required|string|max:10000',
            'images' => 'nullable|array|max:6',
            'images.*' => 'image|max:2048',
        ]);
        $images = collect($r->file('images', []))->map(fn ($image) => $this->storePostImage($image))->values()->all();
        $canPublishDirectly = (int) $community->admin_id === (int) $r->user()->id || $r->user()->role === 'super_admin';
        $post = $this->repo->createPost($r->user(), [
            'community_id' => $community->id,
            'content' => trim($data['content']),
            'type' => 'Community post',
            'audience' => $community->name,
            'status' => $canPublishDirectly ? 'approved' : 'pending',
            'images' => $images ?: null,
            'image' => $images[0] ?? null,
        ]);

        return response()->json(['id' => (string) $post->id, 'status' => $post->status, 'message' => $canPublishDirectly ? 'Your post is now live in the community.' : 'Your post was submitted for approval.'], 201);
    }

    public function applications(Request $r)
    {
        $apps = $this->cache->remember("applications:{$r->user()->id}", 'list', CacheService::MEDIUM,
            fn () => CommunityApplication::where('user_id', $r->user()->id)->get()->mapWithKeys(fn ($a) => [(string) $a->community_id => ['communityId' => (string) $a->community_id, 'answers' => $a->answers, 'status' => $a->status, 'submittedAt' => $a->created_at]])->all());

        return response()->json(['applications' => $apps]);
    }

    public function apply(Request $r, Community $community)
    {
        abort_unless($r->user()->hasVerifiedEmail(), 403, 'Verify your email before applying to join a community.');
        $d = $r->validate(['answers' => 'required|array|min:1']);

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

    public function moderationQueue(Request $r, Community $community)
    {
        $this->authorizeCommunityModerator($r, $community);
        $data = $r->validate(['type' => ['nullable', Rule::in(['applications', 'posts'])]]);
        $type = $data['type'] ?? 'applications';
        $counts = [
            'applications' => $community->applications()->where('status', 'pending')->count(),
            'posts' => $community->posts()->where('status', 'pending')->count(),
        ];

        if ($type === 'applications') {
            $page = $community->applications()->where('status', 'pending')
                ->with('user:id,name,email,avatar,bio')
                ->oldest()
                ->paginate(15);
            $items = $page->getCollection()->map(fn (CommunityApplication $application) => [
                'id' => (string) $application->id,
                'submittedAt' => $application->created_at->diffForHumans(),
                'submittedAtFull' => $application->created_at->format('M j, Y \a\t g:i A'),
                'answers' => $this->cleanApplicationAnswers($application->answers),
                'user' => [
                    'id' => (string) $application->user->id,
                    'name' => $application->user->name,
                    'email' => $application->user->email,
                    'avatar' => $this->service->mediaUrl($application->user->avatar),
                    'bio' => $application->user->bio,
                ],
            ])->values();
        } else {
            $page = $community->posts()->where('status', 'pending')
                ->with(['user', 'likes' => fn ($query) => $query->whereKey($r->user()->id)])
                ->withCount(['likes', 'comments'])
                ->oldest()
                ->paginate(15);
            $items = $page->getCollection()->map(fn (Post $post) => $this->service->postData($post))->values();
        }

        return response()->json([
            'type' => $type,
            'data' => $items,
            'counts' => $counts,
            'currentPage' => $page->currentPage(),
            'lastPage' => $page->lastPage(),
            'hasMorePages' => $page->hasMorePages(),
            'total' => $page->total(),
        ]);
    }

    public function reviewCommunityApplication(Request $r, Community $community, CommunityApplication $application)
    {
        $this->authorizeCommunityModerator($r, $community);
        abort_unless((int) $application->community_id === (int) $community->id, 404);
        $data = $r->validate(['action' => ['required', Rule::in(['approve', 'reject'])]]);
        $status = $data['action'] === 'approve' ? 'approved' : 'rejected';
        $application->update(['status' => $status]);
        if ($status === 'approved') {
            $community->members()->syncWithoutDetaching([$application->user_id]);
        } else {
            $community->members()->detach($application->user_id);
        }
        $this->cache->invalidate('communities', "community:{$community->id}", "applications:{$application->user_id}", "user:{$application->user_id}");

        return response()->json(['message' => "Application {$status}.", 'status' => $status]);
    }

    public function reviewCommunityPost(Request $r, Community $community, Post $post)
    {
        $this->authorizeCommunityModerator($r, $community);
        abort_unless((int) $post->community_id === (int) $community->id, 404);
        $data = $r->validate(['action' => ['required', Rule::in(['approve', 'reject'])]]);
        $status = $data['action'] === 'approve' ? 'approved' : 'rejected';
        $post->update(['status' => $status]);
        $this->cache->invalidate('posts', "post:{$post->id}", "user:{$post->user_id}", "community:{$community->id}");

        return response()->json(['message' => "Post {$status}.", 'status' => $status]);
    }

    public function user(Request $request, User $user)
    {
        $profileView = (int) $request->user()->id === (int) $user->id ? 'owner' : 'visitor';

        return response()->json($this->cache->remember("user:{$user->id}", "profile:{$profileView}", CacheService::LONG,
            fn () => (new UserResource($user->load('communities')))->resolve($request)));
    }

    public function updateProfile(Request $r)
    {
        $d = $r->validate([
            'first_name' => 'sometimes|required|string|max:100',
            'last_name' => 'sometimes|required|string|max:100',
            'phone_number' => ['nullable', 'string', 'max:30', 'regex:/^\+?[0-9 ()-]{7,30}$/'],
            'bio' => 'nullable|string|max:5000',
            'hobbies' => 'nullable|string|max:1000',
            'marital_status' => 'nullable|in:single,married,divorced,widowed,separated,prefer_not_to_say',
            'date_of_birth' => 'nullable|date|before:today',
            'workplace' => 'nullable|string|max:255',
            'occupation' => 'nullable|string|max:255',
            'is_profile_private' => 'sometimes|boolean',
            'avatar_image' => 'nullable|image|mimes:jpg,jpeg,png,webp|max:4096',
        ]);
        if (array_key_exists('first_name', $d) || array_key_exists('last_name', $d)) {
            $d['first_name'] = trim($d['first_name'] ?? $r->user()->first_name ?? '');
            $d['last_name'] = trim($d['last_name'] ?? $r->user()->last_name ?? '');
            $d['name'] = trim($d['first_name'].' '.$d['last_name']);
        }
        if ($r->hasFile('avatar_image')) {
            $this->uploads->delete($r->user()->avatar, 'profiles');
            $d['avatar'] = $this->uploads->store($r->file('avatar_image'), 'profiles');
        }
        unset($d['avatar_image']);
        $r->user()->update($d);
        $this->cache->invalidate("user:{$r->user()->id}", 'posts');

        return new UserResource($r->user()->load('communities'));
    }

    public function notifications(Request $r)
    {
        if ($r->has('page')) {
            $page = $r->user()->notifications()->latest()->paginate(20);

            return response()->json([
                'data' => $page->getCollection()->map(fn ($n) => $this->notificationData($n))->values(),
                'currentPage' => $page->currentPage(),
                'lastPage' => $page->lastPage(),
                'hasMorePages' => $page->hasMorePages(),
                'total' => $page->total(),
                'unreadTotal' => $r->user()->notifications()->whereNull('read_at')->count(),
            ]);
        }

        return response()->json($this->cache->remember("notifications:{$r->user()->id}", 'list', CacheService::SHORT,
            fn () => $r->user()->notifications()->latest()->get()->map(fn ($n) => $this->notificationData($n))->all()));
    }

    private function notificationData(Notification $notification): array
    {
        return ['id' => (string) $notification->id, 'icon' => $notification->icon, 'title' => $notification->title, 'message' => $notification->message, 'time' => $notification->created_at->diffForHumans(), 'unread' => $notification->read_at === null, 'screen' => $notification->screen];
    }

    private function postPageData($page): array
    {
        return [
            'data' => $page->getCollection()->map(fn (Post $post) => $this->service->postData($post))->values(),
            'currentPage' => $page->currentPage(),
            'lastPage' => $page->lastPage(),
            'hasMorePages' => $page->hasMorePages(),
            'total' => $page->total(),
        ];
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

    public function submitSupportRequest(Request $r)
    {
        $data = $r->validate([
            'type' => 'required|in:feedback,issue,support',
            'subject' => 'required|string|max:150',
            'message' => 'required|string|max:5000',
        ]);
        $supportRequest = SupportRequest::create([...$data, 'user_id' => $r->user()->id, 'status' => 'open']);

        return response()->json([
            'message' => 'Your message has been received.',
            'reference' => 'LST-'.str_pad((string) $supportRequest->id, 6, '0', STR_PAD_LEFT),
            'status' => $supportRequest->status,
        ], 201);
    }

    private function storePostImage($image): string
    {
        return $this->uploads->store($image, 'posts');
    }

    private function deletePostImage(string $image): void
    {
        $this->uploads->delete($image, 'posts');
    }

    private function authorizeCommunityModerator(Request $request, Community $community): void
    {
        abort_unless(
            (int) $community->admin_id === (int) $request->user()->id || $request->user()->role === 'super_admin',
            403,
            'Only this community’s administrator can review requests.'
        );
    }

    private function cleanApplicationAnswers(?array $answers): array
    {
        return collect($answers ?? [])->reject(fn ($value) =>
            $value === null || $value === '' || (is_array($value) && $value === [])
        )->all();
    }

    private function commentPageData($page): array
    {
        return [
            'data' => $page->getCollection()->map(fn (Comment $comment) => $this->service->commentData($comment))->values(),
            'currentPage' => $page->currentPage(),
            'lastPage' => $page->lastPage(),
            'hasMorePages' => $page->hasMorePages(),
            'total' => $page->total(),
        ];
    }
}
