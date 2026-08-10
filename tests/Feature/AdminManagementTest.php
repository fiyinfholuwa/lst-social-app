<?php

namespace Tests\Feature;

use App\Models\Community;
use App\Models\CommunityApplication;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\File;
use Tests\TestCase;

class AdminManagementTest extends TestCase
{
    use RefreshDatabase;

    public function test_admin_can_manage_members_and_communities(): void
    {
        $this->actingAs(User::factory()->create(['role' => 'super_admin']));
        Storage::fake('public');
        $member = User::factory()->create(['name' => 'Managed Member']);
        $administrator = User::factory()->create(['name' => 'Community Administrator', 'role' => 'admin']);

        $this->get('/admin/members')->assertOk()->assertSee('Managed Member');
        $this->patch("/admin/members/{$member->id}", ['role' => 'moderator'])->assertRedirect();
        $this->assertDatabaseHas('users', ['id' => $member->id, 'role' => 'moderator']);

        $community = Community::create(['name' => 'Managed Circle']);
        $this->patch("/admin/communities/{$community->id}", [
            'name' => 'Updated Managed Circle',
            'description' => 'A managed community',
            'admin_id' => $administrator->id,
            'image' => UploadedFile::fake()->image('community.jpg', 800, 600),
        ])->assertRedirect();
        $community->refresh();
        $this->assertDatabaseHas('communities', ['id' => $community->id, 'name' => 'Updated Managed Circle', 'admin_id' => $administrator->id]);
        $uploadedPath = public_path(trim(config('uploads.directory'), '/').'/'.ltrim(str_replace(config('uploads.url_prefix'), '', parse_url($community->image, PHP_URL_PATH)), '/'));
        $this->assertFileExists($uploadedPath);
        File::delete($uploadedPath);
        $this->get('/admin/communities')->assertOk()->assertSee('New community')->assertSee('Delete community');
        $this->post('/admin/communities', ['name' => 'Created Circle'])->assertRedirect();
        $this->assertDatabaseHas('communities', ['name' => 'Created Circle']);
    }

    public function test_admin_can_review_a_community_application(): void
    {
        $this->actingAs(User::factory()->create(['role' => 'super_admin']));
        $member = User::factory()->create();
        $community = Community::create(['name' => 'Review Circle']);
        $application = CommunityApplication::create([
            'community_id' => $community->id,
            'user_id' => $member->id,
            'answers' => ['motivation' => 'I would like to join this community.'],
            'status' => 'pending',
        ]);
        $otherCommunity = Community::create(['name' => 'Other Circle']);
        CommunityApplication::create([
            'community_id' => $otherCommunity->id,
            'user_id' => User::factory()->create()->id,
            'answers' => ['motivation' => 'Another application'],
            'status' => 'pending',
        ]);

        $this->get("/admin/communities/{$community->id}/applications")
            ->assertOk()
            ->assertSee('Review Circle')
            ->assertSee($member->email)
            ->assertDontSee('Another application');

        $this->post("/admin/community-applications/{$application->id}", ['action' => 'approve'])->assertRedirect();

        $this->assertDatabaseHas('community_applications', ['id' => $application->id, 'status' => 'approved']);
        $this->assertDatabaseHas('community_user', ['community_id' => $community->id, 'user_id' => $member->id]);
    }
}
