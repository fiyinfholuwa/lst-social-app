<?php

namespace Tests\Feature;

use App\Jobs\SendPushNotificationJob;
use App\Models\Friendship;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Queue;
use Tests\TestCase;

class BirthdayWishTest extends TestCase
{
    use RefreshDatabase;

    public function test_friend_can_send_a_birthday_wish_as_a_chat_message(): void
    {
        Queue::fake();
        $sender = User::factory()->create(['name' => 'Ada']);
        $birthdayUser = User::factory()->create(['name' => 'Grace', 'date_of_birth' => now()->subYears(30)]);
        Friendship::create(['sender_id' => $sender->id, 'receiver_id' => $birthdayUser->id, 'status' => 'accepted']);

        $response = $this->actingAs($sender)->postJson("/api/users/{$birthdayUser->id}/birthday-wish")
            ->assertOk();

        $this->assertDatabaseCount('messages', 0);

        $this->actingAs($sender)->postJson("/api/chats/{$response->json('chat.id')}/messages", [
            'text' => 'Have a wonderful birthday, Grace!',
            'occasion' => 'birthday_wish',
        ])->assertCreated()->assertJsonPath('occasion', 'birthday_wish');

        $this->assertDatabaseHas('messages', [
            'chat_id' => $response->json('chat.id'),
            'sender_id' => $sender->id,
            'text' => 'Have a wonderful birthday, Grace!',
            'occasion' => 'birthday_wish',
        ]);
        $this->assertDatabaseHas('notifications', [
            'user_id' => $birthdayUser->id,
            'title' => 'Ada',
            'screen' => 'ChatDetail',
        ]);
        Queue::assertPushed(SendPushNotificationJob::class);
    }

    public function test_birthday_wish_requires_a_friend_whose_birthday_is_today(): void
    {
        $sender = User::factory()->create();
        $notBirthdayUser = User::factory()->create(['date_of_birth' => now()->subYears(30)->subDay()]);

        $this->actingAs($sender)->postJson("/api/users/{$notBirthdayUser->id}/birthday-wish")
            ->assertUnprocessable();
    }
}
