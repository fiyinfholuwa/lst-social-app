<?php

namespace Tests\Feature;

use App\Models\Chat;
use App\Models\ContentReport;
use App\Models\Message;
use App\Models\Post;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ContentReportTest extends TestCase
{
    use RefreshDatabase;

    public function test_member_can_report_a_post_user_and_accessible_message(): void
    {
        $reporter = User::factory()->create();
        $reported = User::factory()->create();
        $post = Post::create(['user_id' => $reported->id, 'content' => 'Reported post', 'audience' => 'Everyone', 'status' => 'approved']);
        $chat = Chat::create();
        $chat->users()->attach([$reporter->id, $reported->id]);
        $message = Message::create(['chat_id' => $chat->id, 'sender_id' => $reported->id, 'type' => 'text', 'text' => 'Reported message']);

        $this->actingAs($reporter)->postJson('/api/reports', [
            'targetType' => 'post', 'targetId' => $post->id, 'reason' => 'harassment', 'details' => 'Please review this.',
        ])->assertCreated()->assertJsonPath('message', 'Report submitted for review.');

        $this->actingAs($reporter)->postJson('/api/reports', [
            'targetType' => 'user', 'targetId' => $reported->id, 'reason' => 'impersonation',
        ])->assertCreated();

        $this->actingAs($reporter)->postJson('/api/reports', [
            'targetType' => 'message', 'targetId' => $message->id, 'reason' => 'spam',
        ])->assertCreated();

        $this->assertDatabaseCount('content_reports', 3);
        $this->assertDatabaseHas('content_reports', ['target_type' => 'message', 'target_id' => $message->id, 'reported_user_id' => $reported->id]);
    }

    public function test_member_cannot_report_self_duplicate_or_inaccessible_message(): void
    {
        $reporter = User::factory()->create();
        $reported = User::factory()->create();
        $outsider = User::factory()->create();
        $chat = Chat::create();
        $chat->users()->attach([$reported->id, $outsider->id]);
        $message = Message::create(['chat_id' => $chat->id, 'sender_id' => $reported->id, 'type' => 'text', 'text' => 'Private']);

        $this->actingAs($reporter)->postJson('/api/reports', [
            'targetType' => 'user', 'targetId' => $reporter->id, 'reason' => 'other',
        ])->assertUnprocessable();

        $this->actingAs($reporter)->postJson('/api/reports', [
            'targetType' => 'message', 'targetId' => $message->id, 'reason' => 'privacy',
        ])->assertForbidden();

        ContentReport::create(['reporter_id' => $reporter->id, 'reported_user_id' => $reported->id, 'target_type' => 'user', 'target_id' => $reported->id, 'reason' => 'spam']);
        $this->actingAs($reporter)->postJson('/api/reports', [
            'targetType' => 'user', 'targetId' => $reported->id, 'reason' => 'spam',
        ])->assertUnprocessable()->assertJsonPath('message', 'You have already reported this item.');
    }

    public function test_admin_can_review_a_report(): void
    {
        $admin = User::factory()->create(['role' => 'super_admin']);
        $reporter = User::factory()->create();
        $reported = User::factory()->create();
        $report = ContentReport::create(['reporter_id' => $reporter->id, 'reported_user_id' => $reported->id, 'target_type' => 'user', 'target_id' => $reported->id, 'reason' => 'spam']);

        $this->actingAs($admin)->get('/admin/moderation')
            ->assertOk()
            ->assertSee('Loading report history')
            ->assertDontSee('Pending applications')
            ->assertDontSee('Pending posts');
        $this->actingAs($admin)->get('/admin/moderation/reports/history', ['X-Requested-With' => 'XMLHttpRequest'])
            ->assertOk()
            ->assertSee('Report history')
            ->assertSee('Spam');
        $this->actingAs($admin)->patch("/admin/content-reports/{$report->id}", ['status' => 'actioned'])->assertRedirect();

        $this->assertDatabaseHas('content_reports', ['id' => $report->id, 'status' => 'actioned', 'reviewed_by' => $admin->id]);
    }

    public function test_report_history_supports_ajax_filters_and_pagination(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);
        $reporter = User::factory()->create();
        $reported = User::factory()->create();
        foreach (range(1, 13) as $number) {
            ContentReport::create([
                'reporter_id' => $reporter->id,
                'reported_user_id' => $reported->id,
                'target_type' => $number === 13 ? 'message' : 'post',
                'target_id' => $number,
                'reason' => 'spam',
                'status' => $number === 13 ? 'reviewed' : 'pending',
                'content_excerpt' => "Reported content {$number}",
            ]);
        }

        $this->actingAs($admin)->get('/admin/moderation/reports/history?status=pending&type=post', ['X-Requested-With' => 'XMLHttpRequest'])
            ->assertOk()
            ->assertViewHas('reports', fn ($reports) => $reports->total() === 12 && $reports->count() === 12)
            ->assertSee('Reported content');

        $this->actingAs($admin)->get('/admin/moderation/reports/history?page=2', ['X-Requested-With' => 'XMLHttpRequest'])
            ->assertOk()
            ->assertViewHas('reports', fn ($reports) => $reports->currentPage() === 2 && $reports->count() === 1)
            ->assertSee('Showing 13–13 of 13');
    }
}
