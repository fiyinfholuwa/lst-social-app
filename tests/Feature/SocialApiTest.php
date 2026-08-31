<?php

namespace Tests\Feature;

use App\Models\Community;
use App\Models\Comment;
use App\Models\Post;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

class SocialApiTest extends TestCase
{
    use RefreshDatabase;

    public function test_community_api_returns_a_safe_admin_name_when_unassigned(): void
    {
        $user = User::factory()->create();
        $community = Community::create(['name' => 'Unassigned circle', 'admin_id' => null]);

        $this->actingAs($user)
            ->getJson("/api/communities/{$community->id}")
            ->assertOk()
            ->assertJsonPath('admin', 'LST Team');
    }

    public function test_unverified_user_cannot_post_or_join_a_community(): void
    {
        $user = User::factory()->unverified()->create();
        $community = Community::create(['name' => 'Verified members']);

        $this->actingAs($user)->postJson('/api/posts', ['content' => 'Not allowed'])
            ->assertForbidden()
            ->assertJsonPath('message', 'Verify your email before posting to the timeline.');
        $this->actingAs($user)->postJson("/api/communities/{$community->id}/join")
            ->assertForbidden()
            ->assertJsonPath('message', 'Verify your email before joining a community.');
        $this->actingAs($user)->postJson("/api/communities/{$community->id}/applications", ['answers' => ['answer']])
            ->assertForbidden()
            ->assertJsonPath('message', 'Verify your email before applying to join a community.');
        $this->actingAs($user)->getJson("/api/communities/{$community->id}/members")
            ->assertForbidden()
            ->assertJsonPath('message', 'Join this community to view its members.');

        $this->assertDatabaseMissing('posts', ['user_id' => $user->id]);
        $this->assertDatabaseMissing('community_user', ['user_id' => $user->id, 'community_id' => $community->id]);
    }

    public function test_authenticated_social_flow_uses_persisted_data(): void
    {
        $user = User::factory()->create();
        $other = User::factory()->create(['last_seen_at' => now()->subMinutes(5)]);
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
        $this->withHeaders($headers)->getJson('/api/saved-posts?page=1')->assertOk();

        $this->withHeaders($headers)->postJson("/api/users/{$other->id}/friend-request")->assertOk()->assertJsonPath('outgoingRequestIds.0', (string) $other->id);
        $chat = $this->withHeaders($headers)->postJson("/api/chats/with/{$other->id}")
            ->assertOk()
            ->assertJsonPath('withUser.isOnline', false)
            ->assertJsonPath('withUser.lastSeenAt', $other->last_seen_at->toIso8601String())
            ->json();
        $this->withHeaders($headers)->postJson("/api/chats/{$chat['id']}/messages", ['text' => 'Hello'])->assertCreated()->assertJsonPath('text', 'Hello');

        $this->assertDatabaseHas('posts', ['content' => 'A persisted encouragement']);
        $this->assertDatabaseHas('messages', ['text' => 'Hello']);
        $this->assertDatabaseHas('users', ['id' => $user->id]);
        $this->assertNotNull($user->fresh()->last_seen_at);
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
            ->getJson("/api/communities/{$community->id}/posts")
            ->assertJsonFragment(['id' => $postId, 'status' => 'pending']);
        $other = User::factory()->create();
        $otherHeaders = ['Authorization' => 'Bearer '.$other->createToken('test')->plainTextToken];
        auth()->forgetGuards();
        $this->flushHeaders()->withHeaders($otherHeaders)
            ->getJson("/api/communities/{$community->id}/posts")
            ->assertForbidden()
            ->assertJsonPath('message', 'Join this community to view member posts.');

        auth()->forgetGuards();
        $this->flushHeaders()->withHeaders($headers)->getJson('/api/posts')->assertJsonMissing(['id' => $postId]);
        $admin = User::factory()->create(['role' => 'super_admin']);
        $this->actingAs($admin)->post("/admin/posts/{$postId}/review", ['action' => 'approve'])->assertRedirect();
        auth()->forgetGuards();
        $this->withHeaders($headers)->getJson('/api/posts')->assertJsonMissing(['id' => $postId]);
        $this->withHeaders($headers)->getJson("/api/communities/{$community->id}/posts")
            ->assertJsonFragment(['id' => $postId, 'status' => 'approved']);

        $this->withHeaders($headers)->deleteJson("/api/communities/{$community->id}/leave")->assertOk();
        $this->assertDatabaseMissing('community_user', ['community_id' => $community->id, 'user_id' => $user->id]);
        $this->withHeaders($headers)
            ->postJson("/api/communities/{$community->id}/posts", ['content' => 'Not allowed now.'])
            ->assertForbidden();
    }

    public function test_community_member_endpoint_returns_a_bounded_preview(): void
    {
        $viewer = User::factory()->create();
        $community = Community::create(['name' => 'Large circle']);
        $community->members()->attach(User::factory()->count(25)->create());
        $community->members()->attach($viewer);
        $headers = ['Authorization' => 'Bearer '.$viewer->createToken('test')->plainTextToken];

        $this->withHeaders($headers)
            ->getJson("/api/communities/{$community->id}/members")
            ->assertOk()
            ->assertJsonCount(20, 'data')
            ->assertJsonPath('total', 26)
            ->assertJsonPath('hasMore', true);
    }

    public function test_community_member_directory_supports_name_search(): void
    {
        $viewer = User::factory()->create(['name' => 'Current Member']);
        $ada = User::factory()->create(['name' => 'Ada Community Friend']);
        $other = User::factory()->create(['name' => 'Different Person']);
        $community = Community::create(['name' => 'Searchable circle']);
        $community->members()->attach([$viewer->id, $ada->id, $other->id]);
        $headers = ['Authorization' => 'Bearer '.$viewer->createToken('test')->plainTextToken];

        $this->withHeaders($headers)
            ->getJson("/api/communities/{$community->id}/member-directory?q=Ada")
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.id', (string) $ada->id)
            ->assertJsonPath('total', 1);
    }

    public function test_community_posts_are_paginated(): void
    {
        $user = User::factory()->create();
        $community = Community::create(['name' => 'Busy circle']);
        $community->members()->attach($user);
        foreach (range(1, 15) as $number) {
            Post::create(['user_id' => $user->id, 'community_id' => $community->id, 'content' => "Post {$number}", 'status' => 'approved']);
        }
        $headers = ['Authorization' => 'Bearer '.$user->createToken('test')->plainTextToken];

        $this->withHeaders($headers)->getJson("/api/communities/{$community->id}/posts?page=1")
            ->assertOk()->assertJsonCount(10, 'data')->assertJsonPath('hasMorePages', true);
        $this->withHeaders($headers)->getJson("/api/communities/{$community->id}/posts?page=2")
            ->assertOk()->assertJsonCount(5, 'data')->assertJsonPath('hasMorePages', false);
    }

    public function test_comments_and_replies_are_paginated_separately(): void
    {
        $user = User::factory()->create();
        $post = Post::create(['user_id' => $user->id, 'content' => 'Busy discussion']);
        $root = null;
        foreach (range(1, 25) as $number) {
            $comment = Comment::create(['post_id' => $post->id, 'user_id' => $user->id, 'text' => "Comment {$number}"]);
            $root ??= $comment;
        }
        foreach (range(1, 12) as $number) {
            Comment::create(['post_id' => $post->id, 'user_id' => $user->id, 'parent_id' => $root->id, 'text' => "Reply {$number}"]);
        }
        $headers = ['Authorization' => 'Bearer '.$user->createToken('test')->plainTextToken];

        $this->withHeaders($headers)->getJson("/api/posts/{$post->id}")
            ->assertOk()->assertJsonCount(0, 'comments')->assertJsonPath('commentsCount', 37);
        $this->withHeaders($headers)->getJson("/api/posts/{$post->id}/comments?page=1")
            ->assertOk()->assertJsonCount(20, 'data')->assertJsonPath('total', 25)->assertJsonPath('hasMorePages', true);
        $this->withHeaders($headers)->getJson("/api/posts/{$post->id}/comments?page=2")
            ->assertOk()->assertJsonCount(5, 'data')->assertJsonPath('hasMorePages', false);
        $this->withHeaders($headers)->getJson("/api/posts/{$post->id}/comments/{$root->id}/replies?page=1")
            ->assertOk()->assertJsonCount(10, 'data')->assertJsonPath('total', 12)->assertJsonPath('hasMorePages', true);
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

    public function test_friend_suggestions_prioritize_shared_communities_and_exclude_existing_relationships(): void
    {
        $viewer = User::factory()->create(['name' => 'Current User']);
        $shared = User::factory()->create(['name' => 'Shared Community']);
        $unrelated = User::factory()->create(['name' => 'Unrelated Person']);
        $pending = User::factory()->create(['name' => 'Pending Person']);
        $blocked = User::factory()->create(['name' => 'Blocked Person']);
        $community = Community::create(['name' => 'Shared circle']);
        $community->members()->attach([$viewer->id, $shared->id]);
        DB::table('friendships')->insert([
            'sender_id' => $viewer->id,
            'receiver_id' => $pending->id,
            'status' => 'pending',
            'created_at' => now(),
            'updated_at' => now(),
        ]);
        DB::table('user_blocks')->insert([
            'user_id' => $blocked->id,
            'blocked_user_id' => $viewer->id,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $headers = ['Authorization' => 'Bearer '.$viewer->createToken('test')->plainTextToken];

        $this->withHeaders($headers)
            ->getJson('/api/friend-suggestions')
            ->assertOk()
            ->assertJsonPath('data.0.id', (string) $shared->id)
            ->assertJsonFragment(['id' => (string) $unrelated->id])
            ->assertJsonMissing(['id' => (string) $pending->id])
            ->assertJsonMissing(['id' => (string) $blocked->id]);
    }
}
