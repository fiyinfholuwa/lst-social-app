<?php

namespace App\Repositories;

use App\Models\Comment;
use App\Models\Community;
use App\Models\CommunityApplication;
use App\Models\Friendship;
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
        $query = Post::with(['user', 'likes' => fn ($query) => $query->whereKey($viewer->id), 'originalPost.user'])
            ->where(function ($query) use ($viewer) {
                $query->where('status', 'approved')->orWhere('user_id', $viewer->id);
            })
            ->where(function ($scope) use ($viewer) {
                $scope->whereNull('community_id')
                    ->orWhereHas('community.members', fn ($members) => $members->whereKey($viewer->id));
                if ($viewer->role === 'super_admin') {
                    $scope->orWhereNotNull('community_id');
                }
            })
            ->withCount(['likes', 'comments', 'shares']);

        return $this->visibleTo($query, $viewer)->findOrFail($id);
    }

    private function postsQuery(User $viewer)
    {
        $query = Post::with(['user', 'likes' => fn ($query) => $query->whereKey($viewer->id), 'originalPost.user'])
            ->whereNull('community_id')
            ->where('status', 'approved')
            ->withCount(['likes', 'comments', 'shares'])
            ->orderByDesc('created_at')
            ->orderByDesc('id');

        return $this->visibleTo($query, $viewer);
    }

    private function visibleTo($query, User $viewer)
    {
        $audienceColumn = $query->getModel()->qualifyColumn('audience');
        $userIdColumn = $query->getModel()->qualifyColumn('user_id');
        $friendIds = Friendship::where('status', 'accepted')
            ->where(fn ($friendship) => $friendship->where('sender_id', $viewer->id)->orWhere('receiver_id', $viewer->id))
            ->get(['sender_id', 'receiver_id'])
            ->toBase()
            ->map(fn ($friendship) => (int) ($friendship->sender_id === $viewer->id ? $friendship->receiver_id : $friendship->sender_id))
            ->push((int) $viewer->id)
            ->unique()
            ->values();

        return $query->where(fn ($visibility) => $visibility
            ->where($audienceColumn, '!=', 'Friends')
            ->orWhereIn($userIdColumn, $friendIds));
    }

    public function createPost(User $user, array $data): Post
    {
        return $user->posts()->create($data);
    }

    public function commentsPage(Post $post, User $viewer, int $perPage = 20)
    {
        return $post->comments()->whereNull('parent_id')
            ->with(['user', 'likes' => fn ($query) => $query->whereKey($viewer->id)])
            ->withExists(['replies as replied_by_current_user' => fn ($query) => $query->where('user_id', $viewer->id)])
            ->withCount(['likes', 'replies'])->oldest()->paginate($perPage);
    }

    public function repliesPage(Post $post, Comment $comment, User $viewer, int $perPage = 10)
    {
        abort_unless($comment->post_id === $post->id && $comment->parent_id === null, 404);

        return $comment->replies()
            ->with(['user', 'likes' => fn ($query) => $query->whereKey($viewer->id)])
            ->withExists(['replies as replied_by_current_user' => fn ($query) => $query->where('user_id', $viewer->id)])
            ->withCount(['likes', 'replies'])->oldest()->paginate($perPage);
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

    public function savedPostsPage(User $user, User $viewer, int $perPage = 10)
    {
        $query = $user->belongsToMany(Post::class, 'saved_posts')
            ->with(['user', 'likes' => fn ($query) => $query->whereKey($viewer->id), 'originalPost.user'])
            ->withCount(['likes', 'comments', 'shares'])
            ->where(fn ($posts) => $posts->where('posts.status', 'approved')->orWhere('posts.user_id', $viewer->id))
            ->where(fn ($scope) => $scope->whereNull('posts.community_id')
                ->orWhereHas('community.members', fn ($members) => $members->whereKey($viewer->id)))
            ->orderByPivot('created_at', 'desc');

        return $this->visibleTo($query, $viewer)->paginate($perPage);
    }

    public function userPostsPage(User $profile, User $viewer, int $perPage = 10)
    {
        $query = Post::with(['user', 'likes' => fn ($likes) => $likes->whereKey($viewer->id), 'originalPost.user'])
            ->withCount(['likes', 'comments', 'shares'])
            ->where('user_id', $profile->id)
            ->whereNull('community_id')
            ->where('status', 'approved')
            ->latest();

        return $this->visibleTo($query, $viewer)->paginate($perPage);
    }

    public function communities()
    {
        return Community::with('admin')->withCount('members')->get();
    }

    public function communitiesPage(int $perPage = 20)
    {
        return Community::with('admin')->withCount('members')->orderBy('name')->paginate($perPage);
    }

    public function community(int $id, ?User $viewer = null): Community
    {
        return Community::with([
            'admin',
            'members',
        ])->withCount(['members', 'posts' => fn ($query) => $query->where('status', 'approved')])->findOrFail($id);
    }

    public function communityPostsPage(Community $community, User $viewer, int $perPage = 10)
    {
        return $community->posts()
            ->with([
                'user',
                    'likes' => fn ($likes) => $likes->whereKey($viewer->id),
                ])
            ->withCount(['likes', 'comments'])
            ->where(fn ($posts) => $posts
                ->where('status', 'approved')
                ->orWhere(fn ($own) => $own->where('user_id', $viewer->id)->where('status', 'pending')))
            ->latest()
            ->paginate($perPage);
    }

    public function apply(User $user, Community $community, array $answers): CommunityApplication
    {
        return CommunityApplication::updateOrCreate(['user_id' => $user->id, 'community_id' => $community->id], ['answers' => $answers, 'status' => 'pending']);
    }
}
