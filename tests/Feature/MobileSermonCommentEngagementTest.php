<?php

namespace Tests\Feature;

use App\Models\Sermon;
use App\Models\SermonCategory;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class MobileSermonCommentEngagementTest extends TestCase
{
    use RefreshDatabase;

    public function test_members_can_reply_once_and_load_replies(): void
    {
        $author = User::factory()->create();
        $member = User::factory()->create();
        $sermon = $this->sermon();
        $parent = $this->actingAs($author)->postJson("/api/sermons/{$sermon->id}/comments", ['text' => 'What stood out?'])
            ->assertCreated()->json();

        $reply = $this->actingAs($member)->postJson("/api/sermons/{$sermon->id}/comments", ['text' => 'The message on grace.', 'parent_id' => $parent['id']])
            ->assertCreated()->assertJsonPath('parentId', $parent['id'])->json();

        $this->actingAs($member)->postJson("/api/sermons/{$sermon->id}/comments", ['text' => 'A second reply', 'parent_id' => $parent['id']])
            ->assertUnprocessable()->assertJsonPath('message', 'You have already replied to this comment.');

        $this->actingAs($member)->getJson("/api/sermons/{$sermon->id}/comments/{$parent['id']}/replies")
            ->assertOk()->assertJsonPath('data.0.id', $reply['id'])->assertJsonPath('data.0.text', 'The message on grace.');

        $this->actingAs($member)->getJson("/api/sermons/{$sermon->id}/comments")
            ->assertOk()->assertJsonPath('data.0.repliesCount', 1)->assertJsonPath('data.0.repliedByCurrentUser', true);
        $this->assertDatabaseHas('notifications', ['user_id' => $author->id, 'title' => 'New sermon reply']);
    }

    public function test_members_can_toggle_a_sermon_comment_like(): void
    {
        $author = User::factory()->create();
        $member = User::factory()->create();
        $sermon = $this->sermon();
        $commentId = $this->actingAs($author)->postJson("/api/sermons/{$sermon->id}/comments", ['text' => 'Amen'])->json('id');

        $this->actingAs($member)->postJson("/api/sermon-comments/{$commentId}/like")
            ->assertOk()->assertJsonPath('likedByCurrentUser', true)->assertJsonPath('likes', 1);
        $this->actingAs($member)->postJson("/api/sermon-comments/{$commentId}/like")
            ->assertOk()->assertJsonPath('likedByCurrentUser', false)->assertJsonPath('likes', 0);
        $this->assertDatabaseCount('notifications', 1);
        $this->assertDatabaseHas('notifications', ['user_id' => $author->id, 'title' => 'Sermon comment liked']);
    }

    private function sermon(): Sermon
    {
        $category = SermonCategory::firstOrCreate(['name' => 'Test Messages'], ['position' => 100]);
        return Sermon::create(['sermon_category_id' => $category->id, 'title' => 'Grace', 'speaker' => 'LST', 'url' => 'https://youtu.be/example', 'is_published' => true]);
    }
}
