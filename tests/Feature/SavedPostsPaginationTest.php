<?php

namespace Tests\Feature;

use App\Models\Post;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class SavedPostsPaginationTest extends TestCase
{
    use RefreshDatabase;

    public function test_saved_posts_can_be_paginated_in_most_recently_saved_order(): void
    {
        $user = User::factory()->create();
        $author = User::factory()->create();
        $olderPost = Post::create(['user_id' => $author->id, 'content' => 'Older', 'status' => 'approved']);
        $newerPost = Post::create(['user_id' => $author->id, 'content' => 'Newer', 'status' => 'approved']);

        $user->belongsToMany(Post::class, 'saved_posts')->attach($olderPost->id, [
            'created_at' => now()->subMinute(),
            'updated_at' => now()->subMinute(),
        ]);
        $user->belongsToMany(Post::class, 'saved_posts')->attach($newerPost->id, [
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $this->actingAs($user)
            ->getJson('/api/saved-posts?page=1')
            ->assertOk()
            ->assertJsonPath('data.0.id', (string) $newerPost->id)
            ->assertJsonPath('data.1.id', (string) $olderPost->id)
            ->assertJsonPath('currentPage', 1);
    }
}
