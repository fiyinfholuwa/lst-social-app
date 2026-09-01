<?php

namespace Tests\Feature;

use App\Jobs\BroadcastAdminNotificationJob;
use App\Jobs\SendPushNotificationJob;
use App\Models\User;
use App\Repositories\NotificationRepository;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Queue;
use Tests\TestCase;

class AdminPushBroadcastTest extends TestCase
{
    use RefreshDatabase;

    public function test_admin_can_queue_a_notification_broadcast(): void
    {
        Queue::fake();
        $admin = User::factory()->create(['role' => 'super_admin']);

        $this->actingAs($admin)->post('/admin/notifications/broadcast', [
            'audience' => 'all',
            'title' => 'Service update',
            'message' => 'The app will be briefly unavailable tonight.',
        ])->assertRedirect()->assertSessionHas('status', 'Notification queued for delivery.');

        Queue::assertPushed(BroadcastAdminNotificationJob::class, fn ($job) => $job->title === 'Service update'
            && $job->message === 'The app will be briefly unavailable tonight.'
            && $job->audience === 'all');
    }

    public function test_verified_broadcast_excludes_unverified_and_suspended_members(): void
    {
        Queue::fake([SendPushNotificationJob::class]);
        $verified = User::factory()->create(['email_verified_at' => now()]);
        User::factory()->create(['email_verified_at' => null]);
        User::factory()->create(['email_verified_at' => now(), 'suspended_at' => now()]);

        (new BroadcastAdminNotificationJob('Welcome', 'Thanks for being here.', 'verified'))
            ->handle(app(NotificationRepository::class));

        $this->assertDatabaseCount('notifications', 1);
        $this->assertDatabaseHas('notifications', [
            'user_id' => $verified->id,
            'title' => 'Welcome',
            'message' => 'Thanks for being here.',
        ]);
        Queue::assertPushed(SendPushNotificationJob::class, 1);
    }

    public function test_notification_admin_page_is_available(): void
    {
        $admin = User::factory()->create(['role' => 'super_admin']);

        $this->actingAs($admin)->get('/admin/notifications')
            ->assertOk()
            ->assertSee('Compose notification')
            ->assertSee('Send notification');
    }
}
