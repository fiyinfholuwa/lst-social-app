<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Auth\Notifications\VerifyEmail;
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
            ->assertJsonPath('message', 'A verification link has been sent to your email.');
        Notification::assertSentTo($user, VerifyEmail::class);

        $this->actingAs($user)->postJson('/api/support-requests', [
            'type' => 'issue',
            'subject' => 'Something is not working',
            'message' => 'A clear description of the problem.',
        ])->assertCreated();
        $this->assertDatabaseHas('support_requests', ['user_id' => $user->id, 'type' => 'issue', 'status' => 'open']);
    }
}
