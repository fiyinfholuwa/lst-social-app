<?php

namespace Tests\Feature;

use App\Models\User;
use App\Notifications\PasswordOtp;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Notification;
use Tests\TestCase;

class PasswordFlowTest extends TestCase
{
    use RefreshDatabase;

    public function test_user_can_reset_forgotten_password_with_emailed_otp(): void
    {
        Notification::fake();
        $user = User::factory()->create(['email' => 'member@example.com', 'password' => 'old-password']);
        $user->createToken('existing-session');

        $this->postJson('/api/forgot-password/otp', ['email' => $user->email])->assertOk();
        $code = $this->passwordCodeSentTo($user);

        $this->postJson('/api/forgot-password/reset', [
            'email' => $user->email,
            'code' => $code,
            'password' => 'new-secure-password',
            'password_confirmation' => 'new-secure-password',
        ])->assertOk();

        $this->assertTrue(Hash::check('new-secure-password', $user->fresh()->password));
        $this->assertDatabaseCount('personal_access_tokens', 0);
    }

    public function test_authenticated_user_needs_current_password_and_otp_to_change_password(): void
    {
        Notification::fake();
        $user = User::factory()->create(['password' => 'old-password']);

        $this->actingAs($user)->postJson('/api/user/password/otp', ['current_password' => 'wrong'])
            ->assertUnprocessable();
        $this->actingAs($user)->postJson('/api/user/password/otp', ['current_password' => 'old-password'])
            ->assertOk();
        $code = $this->passwordCodeSentTo($user);

        $this->actingAs($user)->patchJson('/api/user/password', [
            'current_password' => 'old-password',
            'code' => $code,
            'password' => 'changed-password',
            'password_confirmation' => 'changed-password',
        ])->assertOk();

        $this->assertTrue(Hash::check('changed-password', $user->fresh()->password));
    }

    private function passwordCodeSentTo(User $user): string
    {
        $code = '';
        Notification::assertSentTo($user, PasswordOtp::class, function (PasswordOtp $notification) use (&$code) {
            $code = $notification->code;
            return true;
        });
        return $code;
    }
}
