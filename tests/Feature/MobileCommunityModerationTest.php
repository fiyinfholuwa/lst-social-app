<?php

namespace Tests\Feature;

use App\Models\Community;
use App\Models\CommunityApplication;
use App\Models\Post;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
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
            ->assertJsonPath('applications.0.id', (string) $application->id)
            ->assertJsonPath('applications.0.answers.motivation', 'I want to grow')
            ->assertJsonPath('applications.0.answers.applicantPath', 'puritan')
            ->assertJsonPath('applications.0.answers.abstinenceBand', '3–5 years')
            ->assertJsonMissingPath('applications.0.answers.notApplicable')
            ->assertJsonPath('posts.0.id', (string) $post->id);

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
}
