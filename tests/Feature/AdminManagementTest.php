<?php

namespace Tests\Feature;

use App\Models\Community;
use App\Models\CommunityApplication;
use App\Models\Post;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Hash;
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

    public function test_super_admin_can_view_suspend_and_reset_a_member_via_ajax(): void
    {
        $admin = User::factory()->create(['role' => 'super_admin']);
        $member = User::factory()->create(['name' => 'Detailed Member', 'phone_number' => '+2348000000000']);

        $this->actingAs($admin)->getJson("/admin/members/{$member->id}")
            ->assertOk()->assertJsonPath('member.name', 'Detailed Member')
            ->assertJsonPath('member.phone_number', '+2348000000000');

        $this->patchJson("/admin/members/{$member->id}/details", [
            'name' => 'Updated Detailed Member', 'email' => 'updated-member@example.com',
            'phone_number' => '+2348111111111', 'occupation' => 'Counsellor',
        ])->assertOk();
        $this->assertDatabaseHas('users', [
            'id' => $member->id, 'name' => 'Updated Detailed Member',
            'email' => 'updated-member@example.com', 'occupation' => 'Counsellor',
        ]);

        $this->patchJson("/admin/members/{$member->id}/suspension", ['suspended' => true])
            ->assertOk();
        $this->assertNotNull($member->fresh()->suspended_at);

        $this->patchJson("/admin/members/{$member->id}/password", [
            'password' => 'UpdatedPassword123!', 'password_confirmation' => 'UpdatedPassword123!',
        ])->assertOk();
        $this->assertTrue(Hash::check('UpdatedPassword123!', $member->fresh()->password));

        $this->patchJson("/admin/members/{$member->id}/suspension", ['suspended' => false])
            ->assertOk();
        $this->assertNull($member->fresh()->suspended_at);
    }

    public function test_admin_can_verify_and_unverify_a_member(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);
        $member = User::factory()->create();

        $this->actingAs($admin)->patch("/admin/members/{$member->id}/verification", ['verified' => true])
            ->assertRedirect();
        $this->assertNotNull($member->fresh()->email_verified_at);

        $this->get('/admin/members?verification=verified')->assertOk()->assertSee($member->email);

        $this->patch("/admin/members/{$member->id}/verification", ['verified' => false])
            ->assertRedirect();
        $this->assertNull($member->fresh()->email_verified_at);
    }

    public function test_super_admin_can_make_an_account_automatically_friends_with_everyone(): void
    {
        $superAdmin = User::factory()->create(['role' => 'super_admin']);
        $automaticAccount = User::factory()->create();
        $existingMember = User::factory()->create();

        $this->actingAs($superAdmin)->patch("/admin/members/{$automaticAccount->id}", [
            'role' => 'admin',
            'auto_friend_everyone' => true,
        ])->assertRedirect();

        $this->assertTrue($automaticAccount->fresh()->auto_friend_everyone);
        $this->assertDatabaseHas('friendships', ['sender_id' => min($automaticAccount->id, $existingMember->id), 'receiver_id' => max($automaticAccount->id, $existingMember->id), 'status' => 'accepted']);

        $newMember = User::factory()->create();

        $this->assertDatabaseHas('friendships', ['sender_id' => min($automaticAccount->id, $newMember->id), 'receiver_id' => max($automaticAccount->id, $newMember->id), 'status' => 'accepted']);
    }

    public function test_admin_can_enable_automatic_friendships_and_assign_the_admin_role(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);
        $managedAccount = User::factory()->create();
        $existingMember = User::factory()->create();

        $this->actingAs($admin)->patch("/admin/members/{$managedAccount->id}", [
            'role' => 'admin',
            'auto_friend_everyone' => true,
        ])->assertRedirect();

        $managedAccount->refresh();
        $this->assertSame('admin', $managedAccount->role);
        $this->assertTrue($managedAccount->auto_friend_everyone);
        $this->assertDatabaseHas('friendships', [
            'sender_id' => min($managedAccount->id, $existingMember->id),
            'receiver_id' => max($managedAccount->id, $existingMember->id),
            'status' => 'accepted',
        ]);

    }

    public function test_admin_can_view_full_post_details(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);
        $author = User::factory()->create(['name' => 'Post Author']);
        $community = Community::create(['name' => 'Post Community']);
        $post = Post::create(['user_id' => $author->id, 'community_id' => $community->id, 'content' => 'The complete post content.', 'status' => 'pending']);
        $post->comments()->create(['user_id' => $admin->id, 'text' => 'A complete comment.']);

        $this->actingAs($admin)->get("/admin/posts/{$post->id}")
            ->assertOk()->assertSee('The complete post content.')
            ->assertSee('Post Author')->assertSee('Post Community')->assertSee('A complete comment.');
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
        $this->assertDatabaseHas('notifications', ['user_id' => $member->id, 'title' => 'Community application approved']);
    }

    public function test_web_admin_post_approval_notifies_the_author(): void
    {
        $admin = User::factory()->create(['role' => 'super_admin']);
        $author = User::factory()->create();
        $community = Community::create(['name' => 'Review Circle']);
        $post = Post::create(['user_id' => $author->id, 'community_id' => $community->id, 'content' => 'Please review', 'status' => 'pending']);

        $this->actingAs($admin)->post("/admin/posts/{$post->id}/review", ['action' => 'approve'])->assertRedirect();

        $this->assertDatabaseHas('notifications', ['user_id' => $author->id, 'title' => 'Community post approved']);
    }
}
