<?php

namespace App\Repositories;

use App\Models\Comment;
use App\Models\Community;
use App\Models\CommunityApplication;
use App\Models\Post;
use App\Models\User;

class SocialRepository
{
    public function posts(User $viewer)
    {
        return $this->postsQuery($viewer)->get();
    }

    public function postsPage(User $viewer, int $perPage = 10)
    {
        return $this->postsQuery($viewer)->paginate($perPage);
    }

    public function post(int $id, User $viewer): Post
    {
        return Post::with(['user', 'comments.user', 'comments.likes' => fn ($query) => $query->whereKey($viewer->id), 'likes' => fn ($query) => $query->whereKey($viewer->id)])
            ->where(function ($query) use ($viewer) {
                $query->where('status', 'approved')->orWhere('user_id', $viewer->id);
            })
            ->withCount('likes')->findOrFail($id);
    }

    private function postsQuery(User $viewer)
    {
        return Post::with(['user', 'comments.user', 'comments.likes' => fn ($query) => $query->whereKey($viewer->id), 'likes' => fn ($query) => $query->whereKey($viewer->id)])
            ->where('status', 'approved')->withCount('likes')->latest();
    }

    public function createPost(User $user, array $data): Post
    {
        return $user->posts()->create($data);
    }

    public function addComment(User $user, Post $post, string $text, ?int $parentId = null): Comment
    {
        return $post->comments()->create(['user_id' => $user->id, 'parent_id' => $parentId, 'text' => $text]);
    }

    public function toggleCommentLike(User $user, Comment $comment): void
    {
        $comment->likes()->toggle($user->id);
    }

    public function toggleLike(User $user, Post $post): void
    {
        $post->likes()->toggle($user->id);
    }

    public function toggleSave(User $user, Post $post): bool
    {
        $result = $user->belongsToMany(Post::class, 'saved_posts')->withTimestamps()->toggle($post->id);

        return count($result['attached']) > 0;
    }

    public function savedIds(User $user): array
    {
        return $user->belongsToMany(Post::class, 'saved_posts')->pluck('posts.id')->map(fn ($id) => (string) $id)->all();
    }

    public function communities()
    {
        return Community::with('admin')->withCount('members')->get();
    }

    public function community(int $id, ?User $viewer = null): Community
    {
        return Community::with([
            'admin',
            'members',
            'posts' => fn ($query) => $query
                ->with([
                    'user',
                    'comments.user',
                    'comments.likes' => fn ($likes) => $viewer ? $likes->whereKey($viewer->id) : $likes->whereRaw('1 = 0'),
                    'likes' => fn ($likes) => $viewer ? $likes->whereKey($viewer->id) : $likes->whereRaw('1 = 0'),
                ])
                ->withCount('likes')
                ->where(function ($posts) use ($viewer) {
                    $posts->where('status', 'approved');
                    if ($viewer) {
                        $posts->orWhere(fn ($own) => $own->where('user_id', $viewer->id)->where('status', 'pending'));
                    }
                })->latest(),
        ])->withCount('members')->findOrFail($id);
    }

    public function apply(User $user, Community $community, array $answers): CommunityApplication
    {
        return CommunityApplication::updateOrCreate(['user_id' => $user->id, 'community_id' => $community->id], ['answers' => $answers, 'status' => 'pending']);
    }
}
