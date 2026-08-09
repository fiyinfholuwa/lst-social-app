<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use App\Notifications\VerifyEmailOtp;
use Illuminate\Support\Facades\Notification;
use Tests\TestCase;

class ProfilePrivacyTest extends TestCase
{
    use RefreshDatabase;

    public function test_user_can_update_details_and_private_visitors_cannot_receive_them(): void
    {
        $owner = User::factory()->create();
        $visitor = User::factory()->create();

        $this->actingAs($owner)->patchJson('/api/user', [
            'first_name' => 'Amara',
            'last_name' => 'Okafor',
            'phone_number' => '+234 801 234 5678',
            'bio' => 'A detailed private biography.',
            'hobbies' => 'Reading and music',
            'marital_status' => 'single',
            'date_of_birth' => '1995-04-12',
            'workplace' => 'Example Company',
            'occupation' => 'Designer',
            'is_profile_private' => true,
        ])->assertOk()
            ->assertJsonPath('data.hobbies', 'Reading and music')
            ->assertJsonPath('data.name', 'Amara Okafor')
            ->assertJsonPath('data.phoneNumber', '+234 801 234 5678')
            ->assertJsonPath('data.isProfilePrivate', true);

        // Warm the owner's profile cache before a different account views it.
        $this->actingAs($owner)->getJson("/api/users/{$owner->id}")
            ->assertOk()
            ->assertJsonPath('phoneNumber', '+234 801 234 5678');

        auth()->forgetGuards();
        $this->actingAs($visitor)->getJson("/api/users/{$owner->id}")
            ->assertOk()
            ->assertJsonPath('isProfilePrivate', true)
            ->assertJsonPath('canSeePrivateDetails', false)
            ->assertJsonMissingPath('email')
            ->assertJsonMissingPath('phoneNumber')
            ->assertJsonMissingPath('bio')
            ->assertJsonMissingPath('hobbies')
            ->assertJsonMissingPath('dateOfBirth')
            ->assertJsonMissingPath('workplace')
            ->assertJsonMissingPath('occupation')
            ->assertJsonMissingPath('joinedCommunities');
    }

    public function test_unverified_user_can_request_verification_and_submit_support(): void
    {
        Notification::fake();
        $user = User::factory()->unverified()->create();

        $this->actingAs($user)->postJson('/api/email/verification-notification')
            ->assertOk()
            ->assertJsonPath('message', 'A six-digit verification code has been sent to your email.');
        $code = null;
        Notification::assertSentTo($user, VerifyEmailOtp::class, function (VerifyEmailOtp $notification) use (&$code) {
            $code = $notification->code;
            return true;
        });
        $this->actingAs($user)->postJson('/api/email/verify-otp', ['code' => '000000'])
            ->assertUnprocessable();
        $this->actingAs($user)->postJson('/api/email/verify-otp', ['code' => $code])
            ->assertOk()
            ->assertJsonPath('message', 'Your email has been verified.');
        $this->assertNotNull($user->fresh()->email_verified_at);

        $this->actingAs($user)->postJson('/api/support-requests', [
            'type' => 'issue',
            'subject' => 'Something is not working',
            'message' => 'A clear description of the problem.',
        ])->assertCreated();
        $this->assertDatabaseHas('support_requests', ['user_id' => $user->id, 'type' => 'issue', 'status' => 'open']);
    }

    public function test_user_must_confirm_password_to_delete_account(): void
    {
        $user = User::factory()->create(['password' => 'correct-password']);

        $this->actingAs($user)->deleteJson('/api/user', ['password' => 'wrong-password'])
            ->assertUnprocessable();
        $this->assertDatabaseHas('users', ['id' => $user->id]);

        $this->actingAs($user)->deleteJson('/api/user', ['password' => 'correct-password'])
            ->assertOk()
            ->assertJsonPath('message', 'Your account has been permanently deleted.');
        $this->assertDatabaseMissing('users', ['id' => $user->id]);
    }
}
