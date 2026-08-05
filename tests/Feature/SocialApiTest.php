<?php

namespace Tests\Feature;

use App\Models\Community;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class SocialApiTest extends TestCase
{
    use RefreshDatabase;

    public function test_authenticated_social_flow_uses_persisted_data(): void
    {
        $user = User::factory()->create();
        $other = User::factory()->create();
        $community = Community::create(['name' => 'Test community']);

        $token = $user->createToken('test')->plainTextToken;
        $headers = ['Authorization' => "Bearer {$token}"];

        $post = $this->withHeaders($headers)->postJson('/api/posts', [
            'content' => 'A persisted encouragement',
            'communityId' => $community->id,
        ])->assertCreated()->json();

        $this->withHeaders($headers)->postJson("/api/posts/{$post['id']}/like")->assertOk()->assertJsonPath('likes', 1);
        $this->withHeaders($headers)->postJson("/api/posts/{$post['id']}/comments", ['text' => 'Amen'])->assertCreated();
        $this->withHeaders($headers)->postJson("/api/posts/{$post['id']}/save")->assertOk()->assertJsonPath('saved', true);
        $this->withHeaders($headers)->getJson('/api/saved-posts')->assertOk()->assertJsonPath('savedPostIds.0', (string) $post['id']);

        $this->withHeaders($headers)->postJson("/api/users/{$other->id}/friend-request")->assertOk()->assertJsonPath('outgoingRequestIds.0', (string) $other->id);
        $chat = $this->withHeaders($headers)->postJson("/api/chats/with/{$other->id}")->assertOk()->json();
        $this->withHeaders($headers)->postJson("/api/chats/{$chat['id']}/messages", ['text' => 'Hello'])->assertCreated()->assertJsonPath('text', 'Hello');

        $this->assertDatabaseHas('posts', ['content' => 'A persisted encouragement']);
        $this->assertDatabaseHas('messages', ['text' => 'Hello']);
    }
}
