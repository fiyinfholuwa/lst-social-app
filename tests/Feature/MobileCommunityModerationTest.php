<?php

namespace Tests\Feature;

use App\Models\Community;
use App\Models\CommunityApplication;
use App\Models\Post;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Queue;
use Tests\TestCase;

class MobileCommunityModerationTest extends TestCase
{
    use RefreshDatabase;

    public function test_assigned_admin_can_review_pending_applications_and_posts(): void
    {
        $admin = User::factory()->create();
        $applicant = User::factory()->create();
        $author = User::factory()->create();
        $community = Community::create(['name' => 'Managed Circle', 'admin_id' => $admin->id]);
        $application = CommunityApplication::create(['community_id' => $community->id, 'user_id' => $applicant->id, 'answers' => ['motivation' => 'I want to grow', 'applicantPath' => 'puritan', 'abstinenceBand' => '3–5 years', 'notApplicable' => null], 'status' => 'pending']);
        $post = Post::create(['community_id' => $community->id, 'user_id' => $author->id, 'content' => 'Please review', 'status' => 'pending']);

        $this->actingAs($admin)->getJson("/api/communities/{$community->id}/moderation")
            ->assertOk()
            ->assertJsonPath('type', 'applications')
            ->assertJsonPath('data.0.id', (string) $application->id)
            ->assertJsonPath('data.0.answers.motivation', 'I want to grow')
            ->assertJsonPath('data.0.answers.applicantPath', 'puritan')
            ->assertJsonPath('data.0.answers.abstinenceBand', '3–5 years')
            ->assertJsonMissingPath('data.0.answers.notApplicable')
            ->assertJsonPath('counts.posts', 1);

        $this->actingAs($admin)->getJson("/api/communities/{$community->id}/moderation?type=posts")
            ->assertOk()
            ->assertJsonPath('data.0.id', (string) $post->id);

        $this->actingAs($admin)->postJson("/api/communities/{$community->id}/moderation/applications/{$application->id}", ['action' => 'approve'])
            ->assertOk()->assertJsonPath('status', 'approved');
        $this->actingAs($admin)->postJson("/api/communities/{$community->id}/moderation/posts/{$post->id}", ['action' => 'reject'])
            ->assertOk()->assertJsonPath('status', 'rejected');

        $this->assertDatabaseHas('community_user', ['community_id' => $community->id, 'user_id' => $applicant->id]);
        $this->assertDatabaseHas('posts', ['id' => $post->id, 'status' => 'rejected']);
    }

    public function test_regular_member_cannot_access_community_moderation(): void
    {
        $admin = User::factory()->create();
        $member = User::factory()->create();
        $community = Community::create(['name' => 'Managed Circle', 'admin_id' => $admin->id]);
        $community->members()->attach($member);

        $this->actingAs($member)->getJson("/api/communities/{$community->id}/moderation")
            ->assertForbidden()
            ->assertJsonPath('message', 'Only this community’s administrator can review requests.');
    }

    public function test_moderators_are_notified_when_users_submit_applications_and_posts(): void
    {
        Queue::fake();
        $communityAdmin = User::factory()->create();
        $admin = User::factory()->create(['role' => 'admin']);
        $superAdmin = User::factory()->create(['role' => 'super_admin']);
        $member = User::factory()->create();
        $community = Community::create(['name' => 'Managed Circle', 'admin_id' => $communityAdmin->id]);
        $community->members()->attach($member);

        $this->actingAs($member)->postJson("/api/communities/{$community->id}/applications", [
            'answers' => ['motivation' => 'I want to grow'],
        ])->assertCreated();

        $this->actingAs($member)->postJson("/api/communities/{$community->id}/posts", [
            'content' => 'Please approve this post',
        ])->assertCreated()->assertJsonPath('status', 'pending');

        foreach ([$communityAdmin, $admin, $superAdmin] as $moderator) {
            $this->assertDatabaseHas('notifications', [
                'user_id' => $moderator->id,
                'title' => 'New community application',
            ]);
            $this->assertDatabaseHas('notifications', [
                'user_id' => $moderator->id,
                'title' => 'Community post awaiting approval',
            ]);
        }

        $this->assertDatabaseMissing('notifications', [
            'user_id' => $member->id,
            'title' => 'New community application',
        ]);
    }

    public function test_users_are_notified_when_applications_and_posts_are_reviewed(): void
    {
        Queue::fake();
        $admin = User::factory()->create();
        $applicant = User::factory()->create();
        $author = User::factory()->create();
        $community = Community::create(['name' => 'Managed Circle', 'admin_id' => $admin->id]);
        $application = CommunityApplication::create([
            'community_id' => $community->id,
            'user_id' => $applicant->id,
            'answers' => ['motivation' => 'I want to grow'],
            'status' => 'pending',
        ]);
        $post = Post::create([
            'community_id' => $community->id,
            'user_id' => $author->id,
            'content' => 'Please review',
            'status' => 'pending',
        ]);

        $this->actingAs($admin)->postJson("/api/communities/{$community->id}/moderation/applications/{$application->id}", ['action' => 'approve'])->assertOk();
        $this->actingAs($admin)->postJson("/api/communities/{$community->id}/moderation/posts/{$post->id}", ['action' => 'approve'])->assertOk();

        $this->assertDatabaseHas('notifications', [
            'user_id' => $applicant->id,
            'title' => 'Community application approved',
        ]);
        $this->assertDatabaseHas('notifications', [
            'user_id' => $author->id,
            'title' => 'Community post approved',
        ]);
    }
}
