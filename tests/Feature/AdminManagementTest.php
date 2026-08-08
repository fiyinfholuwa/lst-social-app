<?php

namespace Tests\Feature;

use App\Models\Community;
use App\Models\CommunityApplication;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AdminManagementTest extends TestCase
{
    use RefreshDatabase;

    public function test_admin_can_manage_members_and_communities(): void
    {
        $member = User::factory()->create(['name' => 'Managed Member']);

        $this->get('/admin/members')->assertOk()->assertSee('Managed Member');
        $this->patch("/admin/members/{$member->id}", ['role' => 'moderator'])->assertRedirect();
        $this->assertDatabaseHas('users', ['id' => $member->id, 'role' => 'moderator']);

        $this->post('/admin/communities', [
            'name' => 'Admin Created Circle',
            'description' => 'A managed community',
            'admin_id' => $member->id,
        ])->assertRedirect();
        $this->assertDatabaseHas('communities', ['name' => 'Admin Created Circle', 'admin_id' => $member->id]);
        $this->get('/admin/communities')->assertOk()->assertSee('Admin Created Circle');
    }

    public function test_admin_can_review_a_community_application(): void
    {
        $member = User::factory()->create();
        $community = Community::create(['name' => 'Review Circle']);
        $application = CommunityApplication::create([
            'community_id' => $community->id,
            'user_id' => $member->id,
            'answers' => ['motivation' => 'I would like to join this community.'],
            'status' => 'pending',
        ]);

        $this->post("/admin/community-applications/{$application->id}", ['action' => 'approve'])->assertRedirect();

        $this->assertDatabaseHas('community_applications', ['id' => $application->id, 'status' => 'approved']);
        $this->assertDatabaseHas('community_user', ['community_id' => $community->id, 'user_id' => $member->id]);
    }
}
