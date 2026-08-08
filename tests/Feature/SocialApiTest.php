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

    public function test_member_can_submit_a_moderated_community_post_and_leave(): void
    {
        $user = User::factory()->create();
        $community = Community::create(['name' => 'Moderated circle']);
        $community->members()->attach($user);
        $headers = ['Authorization' => 'Bearer '.$user->createToken('test')->plainTextToken];

        $postId = $this->withHeaders($headers)
            ->postJson("/api/communities/{$community->id}/posts", ['content' => 'Please review this testimony.'])
            ->assertCreated()
            ->assertJsonPath('status', 'pending')
            ->json('id');

        $this->withHeaders($headers)
            ->getJson("/api/communities/{$community->id}")
            ->assertJsonFragment(['id' => $postId, 'status' => 'pending']);
        $other = User::factory()->create();
        $otherHeaders = ['Authorization' => 'Bearer '.$other->createToken('test')->plainTextToken];
        auth()->forgetGuards();
        $this->flushHeaders()->withHeaders($otherHeaders)
            ->getJson("/api/communities/{$community->id}")
            ->assertJsonCount(0, 'posts');

        auth()->forgetGuards();
        $this->flushHeaders()->withHeaders($headers)->getJson('/api/posts')->assertJsonMissing(['id' => $postId]);
        $this->post("/admin/posts/{$postId}/review", ['action' => 'approve'])->assertRedirect();
        $this->withHeaders($headers)->getJson('/api/posts')->assertJsonFragment(['id' => $postId]);

        $this->withHeaders($headers)->deleteJson("/api/communities/{$community->id}/leave")->assertOk();
        $this->assertDatabaseMissing('community_user', ['community_id' => $community->id, 'user_id' => $user->id]);
        $this->withHeaders($headers)
            ->postJson("/api/communities/{$community->id}/posts", ['content' => 'Not allowed now.'])
            ->assertForbidden();
    }

    public function test_user_can_search_for_people_and_send_a_friend_request(): void
    {
        $user = User::factory()->create(['name' => 'Current User']);
        $match = User::factory()->create(['name' => 'Ada Friend']);
        User::factory()->create(['name' => 'Someone Else']);
        $headers = ['Authorization' => 'Bearer '.$user->createToken('test')->plainTextToken];

        $this->withHeaders($headers)
            ->getJson('/api/users/search?q=Ada')
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.id', (string) $match->id)
            ->assertJsonMissing(['email' => $match->email]);

        $this->withHeaders($headers)
            ->postJson("/api/users/{$match->id}/friend-request")
            ->assertOk()
            ->assertJsonPath('outgoingRequestIds.0', (string) $match->id);

        $this->withHeaders($headers)
            ->getJson('/api/friendships')
            ->assertOk()
            ->assertJsonPath('outgoingRequestIds.0', (string) $match->id);

        $this->withHeaders($headers)
            ->postJson("/api/users/{$match->id}/relationship", ['action' => 'cancel'])
            ->assertOk()
            ->assertJsonCount(0, 'outgoingRequestIds');

        $this->assertDatabaseMissing('friendships', [
            'sender_id' => $user->id,
            'receiver_id' => $match->id,
        ]);
    }
}
