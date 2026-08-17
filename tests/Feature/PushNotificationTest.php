<?php

namespace Tests\Feature;

use App\Models\PushToken;
use App\Models\User;
use App\Repositories\NotificationRepository;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

class PushNotificationTest extends TestCase
{
    use RefreshDatabase;

    public function test_user_can_register_and_remove_a_device_token(): void
    {
        $user = User::factory()->create();
        $token = 'ExponentPushToken[test-device-token]';

        $this->actingAs($user)->postJson('/api/push-tokens', [
            'token' => $token, 'platform' => 'android', 'device_name' => 'Test phone',
        ])->assertOk();

        $this->assertDatabaseHas('push_tokens', ['user_id' => $user->id, 'token' => $token]);

        $this->actingAs($user)->deleteJson('/api/push-tokens', ['token' => $token])->assertOk();
        $this->assertDatabaseMissing('push_tokens', ['token' => $token]);
    }

    public function test_creating_an_in_app_notification_sends_an_expo_push(): void
    {
        Http::fake(['exp.host/*' => Http::response(['data' => [['status' => 'ok']]])]);
        $user = User::factory()->create();
        PushToken::create(['user_id' => $user->id, 'token' => 'ExponentPushToken[test-push]', 'platform' => 'ios']);

        $notification = app(NotificationRepository::class)->createFor($user, [
            'title' => 'New comment', 'message' => 'Someone commented on your post.',
            'screen' => 'PostDetail', 'route_params' => ['postId' => '42'],
        ]);

        Http::assertSent(fn ($request) => $request->url() === config('services.expo.push_url')
            && $request[0]['to'] === 'ExponentPushToken[test-push]'
            && $request[0]['data']['routeParams']['postId'] === '42');
    }

    public function test_accepting_a_friend_request_immediately_pushes_the_requester(): void
    {
        Http::fake(['exp.host/*' => Http::response(['data' => [['status' => 'ok']]])]);
        $requester = User::factory()->create(['name' => 'Ada']);
        $recipient = User::factory()->create(['name' => 'Grace']);
        PushToken::create(['user_id' => $requester->id, 'token' => 'ExponentPushToken[requester-device]', 'platform' => 'android']);

        $this->actingAs($requester)->postJson("/api/users/{$recipient->id}/friend-request")->assertOk();
        $this->actingAs($recipient)->postJson("/api/users/{$requester->id}/relationship", ['action' => 'accept'])->assertOk();

        $this->assertDatabaseHas('notifications', ['user_id' => $requester->id, 'title' => 'Friend request accepted']);
        Http::assertSent(fn ($request) => $request[0]['to'] === 'ExponentPushToken[requester-device]'
            && $request[0]['title'] === 'Friend request accepted');
    }
}
