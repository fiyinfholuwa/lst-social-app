<?php

namespace Tests\Feature;

use App\Jobs\BroadcastSermonUpdateJob;
use App\Jobs\SendPushNotificationJob;
use App\Models\Sermon;
use App\Models\SermonCategory;
use App\Models\User;
use App\Repositories\NotificationRepository;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Queue;
use Tests\TestCase;

class AdminSermonNotificationTest extends TestCase
{
    use RefreshDatabase;

    public function test_updating_a_published_sermon_queues_a_notification_broadcast(): void
    {
        Queue::fake();
        $admin = User::factory()->create(['role' => 'super_admin']);
        $sermon = $this->sermon();

        $this->actingAs($admin)->patch("/admin/sermons/{$sermon->id}", [
            'sermon_category_id' => $sermon->sermon_category_id,
            'title' => 'Updated message',
            'speaker' => 'LST',
            'url' => 'https://example.com/updated-sermon',
            'is_published' => '1',
        ])->assertRedirect()->assertSessionHas('status', 'Sermon updated. Notifications are being sent to all members.');

        Queue::assertPushed(BroadcastSermonUpdateJob::class, fn ($job) => $job->sermonId === $sermon->id);
    }

    public function test_hidden_sermon_updates_do_not_queue_a_broadcast(): void
    {
        Queue::fake();
        $admin = User::factory()->create(['role' => 'super_admin']);
        $sermon = $this->sermon();

        $this->actingAs($admin)->patch("/admin/sermons/{$sermon->id}", [
            'sermon_category_id' => $sermon->sermon_category_id,
            'title' => 'Hidden message',
            'url' => 'https://example.com/hidden-sermon',
        ])->assertRedirect()->assertSessionHas('status', 'Sermon updated. No notifications were sent because it is hidden.');

        Queue::assertNotPushed(BroadcastSermonUpdateJob::class);
    }

    public function test_broadcast_creates_a_routed_notification_for_every_user(): void
    {
        Queue::fake([SendPushNotificationJob::class]);
        User::factory()->count(3)->create();
        $sermon = $this->sermon();

        (new BroadcastSermonUpdateJob($sermon->id))->handle(app(NotificationRepository::class));

        $this->assertDatabaseCount('notifications', 3);
        $this->assertDatabaseHas('notifications', [
            'title' => 'Sermon updated',
            'screen' => 'SermonDetail',
        ]);
        Queue::assertPushed(SendPushNotificationJob::class, 3);
    }

    private function sermon(): Sermon
    {
        $category = SermonCategory::create(['name' => 'Messages', 'position' => 1]);

        return Sermon::create([
            'sermon_category_id' => $category->id,
            'title' => 'Original message',
            'speaker' => 'LST',
            'url' => 'https://example.com/sermon',
            'is_published' => true,
        ]);
    }
}
