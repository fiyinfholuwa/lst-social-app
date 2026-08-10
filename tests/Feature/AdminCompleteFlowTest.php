<?php

namespace Tests\Feature;

use App\Models\Community;
use App\Models\Quiz;
use App\Models\SupportRequest;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class AdminCompleteFlowTest extends TestCase
{
    use RefreshDatabase;

    public function test_admin_area_requires_an_authenticated_administrator(): void
    {
        $this->get('/admin')->assertRedirect('/admin/login');
        $this->actingAs(User::factory()->create(['role' => 'member']))->get('/admin')->assertForbidden();
        $admin = User::factory()->create(['role' => 'admin']);
        $this->post('/admin/login', ['email' => $admin->email, 'password' => 'password'])->assertRedirect('/admin');
    }

    public function test_admin_can_create_update_and_delete_a_quiz(): void
    {
        $this->actingAs(User::factory()->create(['role' => 'super_admin']));
        $community = Community::create(['name' => 'Quiz Community']);
        $payload = [
            'community_id' => $community->id, 'title' => 'Safety Quiz', 'passing_score' => 80,
            'status' => 'published', 'show_answers' => 1,
            'questions' => [['question' => 'Choose the kind response.', 'answers' => ['Kind', 'Cruel'], 'correct' => 0]],
        ];
        $this->post('/admin/quizzes', $payload)->assertRedirect();
        $quiz = Quiz::where('title', 'Safety Quiz')->firstOrFail();
        $this->assertDatabaseHas('quiz_questions', ['quiz_id' => $quiz->id, 'question' => 'Choose the kind response.']);
        $this->assertDatabaseHas('quiz_answers', ['answer' => 'Kind', 'is_correct' => true]);
        $this->patch("/admin/quizzes/{$quiz->id}", [...$payload, 'title' => 'Updated Safety Quiz', 'status' => 'draft'])->assertRedirect();
        $this->assertDatabaseHas('quizzes', ['id' => $quiz->id, 'title' => 'Updated Safety Quiz', 'status' => 'draft']);
        $this->delete("/admin/quizzes/{$quiz->id}")->assertRedirect();
        $this->assertDatabaseMissing('quizzes', ['id' => $quiz->id]);
    }

    public function test_admin_can_process_support_and_manage_own_settings(): void
    {
        $admin = User::factory()->create(['role' => 'super_admin']);
        $member = User::factory()->create();
        $ticket = SupportRequest::create(['user_id' => $member->id, 'type' => 'support', 'subject' => 'Help', 'message' => 'Please assist.', 'status' => 'open']);
        $this->actingAs($admin)->patch("/admin/support-requests/{$ticket->id}", ['status' => 'resolved'])->assertRedirect();
        $this->assertDatabaseHas('support_requests', ['id' => $ticket->id, 'status' => 'resolved']);
        $this->patch('/admin/settings/profile', ['name' => 'Platform Admin', 'email' => 'platform@example.com'])->assertRedirect();
        $this->patch('/admin/settings/password', ['current_password' => 'password', 'password' => 'NewPassword123!', 'password_confirmation' => 'NewPassword123!'])->assertRedirect();
        $this->assertTrue(Hash::check('NewPassword123!', $admin->fresh()->password));
        $this->delete("/admin/members/{$admin->id}")->assertStatus(422);
    }
}
