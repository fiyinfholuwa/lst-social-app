<?php

namespace Tests\Feature;

use App\Models\Comment;
use App\Models\Post;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class EngagementNotificationTest extends TestCase
{
    use RefreshDatabase;

    public function test_reply_notifies_the_commenter_without_duplicating_the_post_owner_notification(): void
    {
        $owner = User::factory()->create();
        $commenter = User::factory()->create();
        $replier = User::factory()->create();
        $post = Post::create(['user_id' => $owner->id, 'content' => 'A public thought', 'audience' => 'Everyone', 'status' => 'approved']);
        $parent = Comment::create(['post_id' => $post->id, 'user_id' => $commenter->id, 'text' => 'A thoughtful comment']);

        $this->actingAs($replier)->postJson("/api/posts/{$post->id}/comments", ['text' => 'I agree', 'parent_id' => $parent->id])->assertCreated();

        $this->assertDatabaseHas('notifications', ['user_id' => $owner->id, 'title' => 'New comment']);
        $this->assertDatabaseHas('notifications', ['user_id' => $commenter->id, 'title' => 'New reply']);
    }

    public function test_liking_a_post_comment_notifies_its_author_only_when_liked(): void
    {
        $author = User::factory()->create();
        $member = User::factory()->create();
        $post = Post::create(['user_id' => $author->id, 'content' => 'A public thought', 'audience' => 'Everyone', 'status' => 'approved']);
        $comment = Comment::create(['post_id' => $post->id, 'user_id' => $author->id, 'text' => 'A comment']);

        $this->actingAs($member)->postJson("/api/comments/{$comment->id}/like")->assertOk()->assertJsonPath('liked', true);
        $this->actingAs($member)->postJson("/api/comments/{$comment->id}/like")->assertOk()->assertJsonPath('liked', false);

        $this->assertDatabaseCount('notifications', 1);
        $this->assertDatabaseHas('notifications', ['user_id' => $author->id, 'title' => 'Comment liked']);
    }

    public function test_sharing_a_post_notifies_the_original_author(): void
    {
        $author = User::factory()->create();
        $member = User::factory()->create();
        $post = Post::create(['user_id' => $author->id, 'content' => 'Worth sharing', 'audience' => 'Everyone', 'status' => 'approved']);

        $this->actingAs($member)->postJson("/api/posts/{$post->id}/share", ['note' => 'This encouraged me'])->assertCreated();

        $this->assertDatabaseHas('notifications', ['user_id' => $author->id, 'title' => 'Your post was shared']);
    }
}
