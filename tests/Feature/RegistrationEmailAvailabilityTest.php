<?php

namespace Tests\Feature;

use App\Models\PlatformSetting;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class RegistrationEmailAvailabilityTest extends TestCase
{
    use RefreshDatabase;

    public function test_new_registration_requires_email_verification(): void
    {
        $response = $this->postJson('/api/register', [
            'first_name' => 'New',
            'last_name' => 'Member',
            'email' => 'verified-on-registration@example.com',
            'password' => 'password123',
            'password_confirmation' => 'password123',
        ]);

        $response->assertCreated();
        $response->assertJsonPath('user.emailVerified', false);
        $this->assertNull(User::where('email', 'verified-on-registration@example.com')->firstOrFail()->email_verified_at);
    }

    public function test_admin_can_make_new_registrations_verified_immediately(): void
    {
        PlatformSetting::put('email_verification_mode', 'automatic');

        $this->postJson('/api/register', [
            'first_name' => 'Automatic',
            'last_name' => 'Member',
            'email' => 'automatic@example.com',
            'password' => 'password123',
            'password_confirmation' => 'password123',
        ])->assertCreated()->assertJsonPath('user.emailVerified', true);

        $this->assertNotNull(User::where('email', 'automatic@example.com')->firstOrFail()->email_verified_at);
    }

    public function test_admin_can_change_the_email_verification_policy(): void
    {
        $admin = User::factory()->create(['role' => 'super_admin']);

        $this->actingAs($admin)->patch('/admin/settings/email-verification', [
            'email_verification_mode' => 'automatic',
        ])->assertRedirect()->assertSessionHas('status', 'New members will now be verified immediately.');

        $this->assertSame('automatic', PlatformSetting::valueFor('email_verification_mode'));
    }

    public function test_it_reports_an_unused_email_as_available(): void
    {
        $this->postJson('/api/register/check-email', ['email' => 'new@example.com'])
            ->assertOk()
            ->assertJson(['available' => true]);
    }

    public function test_login_response_includes_the_current_verification_state(): void
    {
        User::factory()->create([
            'email' => 'verified@example.com',
            'password' => bcrypt('password123'),
            'email_verified_at' => now(),
        ]);

        $this->postJson('/api/login', [
            'email' => 'verified@example.com',
            'password' => 'password123',
        ])->assertOk()->assertJsonPath('user.emailVerified', true);
    }

    public function test_it_stops_registration_when_email_already_exists(): void
    {
        User::factory()->create(['email' => 'member@example.com']);

        $this->postJson('/api/register/check-email', ['email' => 'MEMBER@example.com'])
            ->assertOk()
            ->assertJson([
                'available' => false,
                'message' => 'An account with this email already exists.',
            ]);

        $this->postJson('/api/register', [
            'first_name' => 'Another',
            'last_name' => 'Member',
            'email' => 'MEMBER@example.com',
            'password' => 'password123',
            'password_confirmation' => 'password123',
        ])->assertUnprocessable()->assertJsonValidationErrors('email');
    }
}
