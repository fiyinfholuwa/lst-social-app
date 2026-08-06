<?php

namespace Tests\Feature;

use App\Models\Post;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class PostManagementTest extends TestCase
{
    use RefreshDatabase;

    public function test_owner_can_edit_a_post_but_another_user_cannot(): void
    {
        $owner = User::factory()->create();
        $other = User::factory()->create();
        $post = Post::create(['user_id' => $owner->id, 'content' => 'Original']);

        $this->actingAs($other)->patchJson("/api/posts/{$post->id}", ['content' => 'Hijacked'])
            ->assertForbidden();

        $this->actingAs($owner)->patchJson("/api/posts/{$post->id}", ['content' => 'Updated'])
            ->assertOk()
            ->assertJsonPath('content', 'Updated');

        $this->assertDatabaseHas('posts', ['id' => $post->id, 'content' => 'Updated']);
    }

    public function test_deleting_a_post_cascades_dependent_records_and_rejects_non_owner(): void
    {
        $owner = User::factory()->create();
        $other = User::factory()->create();
        $post = Post::create(['user_id' => $owner->id, 'content' => 'Delete me']);
        $post->comments()->create(['user_id' => $other->id, 'text' => 'A comment']);
        $post->likes()->attach($other->id);
        $other->belongsToMany(Post::class, 'saved_posts')->attach($post->id);

        $this->actingAs($other)->deleteJson("/api/posts/{$post->id}")->assertForbidden();
        $this->actingAs($owner)->deleteJson("/api/posts/{$post->id}")
            ->assertOk()
            ->assertJson(['message' => 'Post deleted.']);

        $this->assertDatabaseMissing('posts', ['id' => $post->id]);
        $this->assertDatabaseMissing('comments', ['post_id' => $post->id]);
        $this->assertDatabaseMissing('post_likes', ['post_id' => $post->id]);
        $this->assertDatabaseMissing('saved_posts', ['post_id' => $post->id]);
    }
}
