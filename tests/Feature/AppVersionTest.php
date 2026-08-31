<?php

namespace Tests\Feature;

use App\Models\PlatformSetting;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AppVersionTest extends TestCase
{
    use RefreshDatabase;

    public function test_mobile_app_can_fetch_android_update_policy_without_authentication(): void
    {
        PlatformSetting::put('android_latest_version', '1.3.0');
        PlatformSetting::put('android_minimum_version', '1.2.0');

        $this->getJson('/api/app-version?platform=android')
            ->assertOk()
            ->assertJsonPath('latestVersion', '1.3.0')
            ->assertJsonPath('minimumVersion', '1.2.0')
            ->assertJsonPath('storeUrl', 'https://play.google.com/store/apps/details?id=com.lstsocial.com');
    }

    public function test_admin_can_update_mobile_version_policy(): void
    {
        $admin = User::factory()->create(['role' => 'super_admin']);

        $this->actingAs($admin)->patch('/admin/settings/app-update', [
            'ios_latest_version' => '1.4.0',
            'ios_minimum_version' => '1.2.0',
            'android_latest_version' => '1.5.0',
            'android_minimum_version' => '1.3.0',
            'app_update_message' => 'Install the newest improvements.',
        ])->assertRedirect()->assertSessionHas('status', 'Mobile update policy saved.');

        $this->assertSame('1.5.0', PlatformSetting::valueFor('android_latest_version'));
        $this->assertSame('Install the newest improvements.', PlatformSetting::valueFor('app_update_message'));
    }
}
