<?php

namespace App\Services;

use App\Models\Community;
use App\Models\Post;
use App\Models\User;
use App\Repositories\SocialRepository;

class SocialService
{
    public function __construct(private SocialRepository $repo) {}

    public function postData(Post $post): array
    {
        return ['id' => (string) $post->id, 'userId' => (string) $post->user_id, 'userName' => $post->user->name, 'userAvatar' => $post->user->avatar, 'content' => $post->content, 'image' => $post->image, 'likes' => $post->likes_count ?? $post->likes()->count(), 'comments' => $post->comments->map(fn ($c) => ['id' => (string) $c->id, 'userId' => (string) $c->user_id, 'userName' => $c->user->name, 'text' => $c->text, 'timestamp' => $c->created_at->diffForHumans()])->values(), 'timestamp' => $post->created_at->diffForHumans(), 'communityId' => $post->community_id ? (string) $post->community_id : null, 'type' => $post->type, 'audience' => $post->audience, 'verified' => $post->user->role === 'Community leader'];
    }

    public function posts()
    {
        return $this->repo->posts()->map(fn ($p) => $this->postData($p));
    }

    public function post(int $id): array
    {
        return $this->postData($this->repo->post($id));
    }

    public function create(User $user, array $data): array
    {
        return $this->post($this->repo->createPost($user, $data)->id);
    }

    public function communityData(Community $c): array
    {
        return ['id' => (string) $c->id, 'name' => $c->name, 'description' => $c->description, 'rules' => $c->rules, 'image' => $c->image, 'admin' => $c->admin?->name, 'memberCount' => $c->members_count ?? $c->members()->count(), 'memberIds' => $c->relationLoaded('members') ? $c->members->pluck('id')->map(fn ($id) => (string) $id) : [], 'posts' => $c->relationLoaded('posts') ? $c->posts->map(fn ($p) => ['id' => (string) $p->id, 'content' => $p->content, 'timestamp' => $p->created_at->diffForHumans()]) : []];
    }
}
