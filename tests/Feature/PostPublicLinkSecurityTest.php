<?php

namespace Tests\Feature;

use App\Models\Comment;
use App\Models\Post;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class PostPublicLinkSecurityTest extends TestCase
{
    use RefreshDatabase;

    public function test_public_links_use_opaque_ids_and_keep_numeric_links_compatible(): void
    {
        $author = User::factory()->create();
        $post = Post::create([
            'user_id' => $author->id,
            'content' => 'A private post body that must not appear on the landing page.',
            'audience' => 'Friends',
            'status' => 'approved',
        ]);

        $this->assertMatchesRegularExpression('/^[0-9A-HJKMNP-TV-Z]{26}$/', $post->public_id);

        foreach ([$post->public_id, (string) $post->id] as $token) {
            $this->get("/posts/{$token}")
                ->assertOk()
                ->assertSee('Open in LST Social')
                ->assertSee("lstsocial://posts/{$post->public_id}", false)
                ->assertDontSee('A private post body');
        }

        $this->get('/posts/01K00000000000000000000000')
            ->assertNotFound()
            ->assertSee('This moment isn’t here');
    }

    public function test_a_guessed_post_id_cannot_read_or_mutate_an_inaccessible_post(): void
    {
        $author = User::factory()->create();
        $stranger = User::factory()->create();
        $post = Post::create([
            'user_id' => $author->id,
            'content' => 'Friends only',
            'audience' => 'Friends',
            'status' => 'approved',
        ]);
        $comment = Comment::create(['post_id' => $post->id, 'user_id' => $author->id, 'text' => 'Private comment']);

        $this->actingAs($stranger)->getJson("/api/posts/{$post->public_id}")->assertNotFound();
        $this->actingAs($stranger)->getJson("/api/posts/{$post->id}/comments")->assertNotFound();
        $this->actingAs($stranger)->postJson("/api/posts/{$post->id}/like")->assertNotFound();
        $this->actingAs($stranger)->postJson("/api/posts/{$post->id}/comments", ['text' => 'Should fail'])->assertNotFound();
        $this->actingAs($stranger)->postJson("/api/posts/{$post->id}/save")->assertNotFound();
        $this->actingAs($stranger)->postJson("/api/comments/{$comment->id}/like")->assertNotFound();

        $this->assertDatabaseCount('post_likes', 0);
        $this->assertDatabaseCount('saved_posts', 0);
        $this->assertDatabaseCount('comment_likes', 0);
        $this->assertDatabaseCount('comments', 1);
    }
}
