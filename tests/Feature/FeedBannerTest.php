<?php

namespace Tests\Feature;

use App\Models\PlatformSetting;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class FeedBannerTest extends TestCase
{
    use RefreshDatabase;

    public function test_feed_uses_a_daily_encouragement_by_default(): void
    {
        $user = User::factory()->create();

        $this->actingAs($user)->getJson('/api/feed-banner')
            ->assertOk()
            ->assertJsonPath('mode', 'encouragement')
            ->assertJsonPath('label', "TODAY'S ENCOURAGEMENT")
            ->assertJsonStructure(['text', 'reference', 'source']);
    }

    public function test_enabled_announcement_overrides_the_encouragement(): void
    {
        $user = User::factory()->create();
        PlatformSetting::put('feed_banner_mode', 'announcement');
        PlatformSetting::put('announcement_title', 'Community event');
        PlatformSetting::put('announcement_text', 'Join us this Saturday.');
        PlatformSetting::put('announcement_action_url', 'https://example.com/event');

        $this->actingAs($user)->getJson('/api/feed-banner')
            ->assertOk()
            ->assertJson([
                'mode' => 'announcement',
                'title' => 'Community event',
                'text' => 'Join us this Saturday.',
                'actionLabel' => 'Click here to continue',
                'actionUrl' => 'https://example.com/event',
            ]);
    }

    public function test_admin_can_publish_and_disable_an_announcement(): void
    {
        $admin = User::factory()->create(['role' => 'super_admin']);

        $this->actingAs($admin)->patch('/admin/settings/feed-banner', [
            'feed_banner_mode' => 'announcement',
            'announcement_title' => 'Maintenance',
            'announcement_text' => 'The service will be briefly unavailable.',
            'announcement_action_url' => 'https://example.com/status',
        ])->assertRedirect();

        $this->assertSame('announcement', PlatformSetting::valueFor('feed_banner_mode'));
        $this->assertSame('Maintenance', PlatformSetting::valueFor('announcement_title'));

        $this->actingAs($admin)->patch('/admin/settings/feed-banner', [
            'feed_banner_mode' => 'encouragement',
            'announcement_title' => 'Maintenance',
            'announcement_text' => 'The service will be briefly unavailable.',
        ])->assertRedirect();

        $this->assertSame('encouragement', PlatformSetting::valueFor('feed_banner_mode'));
    }

    public function test_enabled_announcement_requires_text_and_rejects_insecure_links(): void
    {
        $admin = User::factory()->create(['role' => 'super_admin']);

        $this->actingAs($admin)->from('/admin/settings')->patch('/admin/settings/feed-banner', [
            'feed_banner_mode' => 'announcement',
            'announcement_action_url' => 'http://example.com/status',
        ])->assertRedirect('/admin/settings')->assertSessionHasErrors(['announcement_text', 'announcement_action_url']);
    }

    public function test_admin_can_hide_the_home_feed_banner_completely(): void
    {
        $admin = User::factory()->create(['role' => 'super_admin']);
        $member = User::factory()->create();

        $this->actingAs($admin)->patch('/admin/settings/feed-banner', [
            'feed_banner_mode' => 'hidden',
        ])->assertRedirect()->assertSessionHas('status', 'Home feed banner hidden.');

        $this->assertSame('hidden', PlatformSetting::valueFor('feed_banner_mode'));
        $this->actingAs($member)->getJson('/api/feed-banner')->assertOk()->assertExactJson([]);
    }
}
