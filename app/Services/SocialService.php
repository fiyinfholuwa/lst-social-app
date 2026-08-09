<?php

namespace App\Services;

use App\Models\Community;
use App\Models\Post;
use App\Models\User;
use App\Repositories\SocialRepository;
use Illuminate\Support\Str;

class SocialService
{
    public function __construct(private SocialRepository $repo, private CacheService $cache) {}

    public function postData(Post $post, bool $includeOriginal = true): array
    {
        $images = collect($post->images ?: ($post->image ? [$post->image] : []))
            ->map(fn ($image) => $this->mediaUrl($image))
            ->filter()
            ->values()
            ->all();
        $shareSource = $post->originalPost ?: $post;

        return ['id' => (string) $post->id, 'userId' => (string) $post->user_id, 'userName' => $post->user->name, 'userAvatar' => $this->mediaUrl($post->user->avatar), 'content' => $post->content, 'images' => $images, 'image' => $images[0] ?? null, 'likes' => $post->likes_count ?? $post->likes()->count(), 'likedByCurrentUser' => $post->likes->isNotEmpty(), 'comments' => [], 'commentsCount' => $post->comments_count ?? $post->comments()->count(), 'shareCount' => $shareSource->shares_count ?? $shareSource->shares()->count(), 'originalPost' => $includeOriginal && $post->relationLoaded('originalPost') && $post->originalPost ? $this->postData($post->originalPost, false) : null, 'timestamp' => $post->created_at->diffForHumans(), 'communityId' => $post->community_id ? (string) $post->community_id : null, 'type' => $post->type, 'audience' => $post->audience, 'status' => $post->status, 'verified' => $post->user->role === 'Community leader'];
    }

    public function commentData($comment): array
    {
        return ['id' => (string) $comment->id, 'userId' => (string) $comment->user_id, 'userName' => $comment->user->name, 'userAvatar' => $this->mediaUrl($comment->user->avatar), 'text' => $comment->text, 'parentId' => $comment->parent_id ? (string) $comment->parent_id : null, 'likes' => $comment->likes_count ?? $comment->likes()->count(), 'repliesCount' => $comment->replies_count ?? $comment->replies()->count(), 'repliedByCurrentUser' => (bool) ($comment->replied_by_current_user ?? false), 'likedByCurrentUser' => $comment->relationLoaded('likes') && $comment->likes->isNotEmpty(), 'timestamp' => $comment->created_at->diffForHumans()];
    }

    public function posts(User $viewer)
    {
        return $this->repo->posts($viewer)->map(fn ($p) => $this->postData($p))->all();
    }

    public function postsPage(User $viewer): array
    {
        $page = $this->repo->postsPage($viewer);

        return [
            'data' => $page->getCollection()->map(fn ($post) => $this->postData($post))->values()->all(),
            'currentPage' => $page->currentPage(),
            'lastPage' => $page->lastPage(),
            'hasMorePages' => $page->hasMorePages(),
        ];
    }

    public function post(int $id, User $viewer): array
    {
        return $this->postData($this->repo->post($id, $viewer));
    }

    public function create(User $user, array $data): array
    {
        $post = $this->repo->createPost($user, $data);
        $scopes = ['posts', "user:{$user->id}"];
        if ($post->original_post_id) {
            $scopes[] = "post:{$post->original_post_id}";
        }
        if ($post->community_id) {
            $scopes[] = "community:{$post->community_id}";
        }
        $this->cache->invalidate(...$scopes);

        return $this->post($post->id, $user);
    }

    public function invalidatePost(Post $post): void
    {
        $scopes = ['posts', "post:{$post->id}", "user:{$post->user_id}"];
        if ($post->community_id) {
            $scopes[] = "community:{$post->community_id}";
        }
        $this->cache->invalidate(...$scopes);
    }

    public function communityData(Community $c): array
    {
        $viewer = request()->user();
        $requirementKeys = [
            'Virgins & Sexual Puritans' => 'comm1',
            'Addiction Recovery' => 'comm2',
            'Marriage Healing' => 'comm3',
            'Quick Marital Settlement' => 'comm4',
            'Courtship Mentorship & Marriage Preparation' => 'comm5',
            'Special Discipleship' => 'comm6',
            'All-Round Wholeness for Singles' => 'comm7',
        ];

        return ['id' => (string) $c->id, 'requirementKey' => $requirementKeys[$c->name] ?? null, 'name' => $c->name, 'description' => $c->description, 'rules' => $c->rules, 'image' => $this->mediaUrl($c->image), 'admin' => $c->admin?->name, 'canModerate' => $viewer && ((int) $c->admin_id === (int) $viewer->id || $viewer->role === 'super_admin'), 'memberCount' => $c->members_count ?? $c->members()->count(), 'postCount' => $c->posts_count ?? $c->posts()->where('status', 'approved')->count(), 'memberIds' => $c->relationLoaded('members') ? $c->members->pluck('id')->map(fn ($id) => (string) $id) : []];
    }

    public function mediaUrl(?string $url): ?string
    {
        if (! $url) {
            return null;
        }

        $path = parse_url($url, PHP_URL_PATH);
        if ($path && (Str::startsWith($path, '/storage/') || Str::startsWith($path, '/custom_folder/'))) {
            return request()->getSchemeAndHttpHost().$path;
        }

        return $url;
    }
}
