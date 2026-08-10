<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use App\Models\User;
use Tests\TestCase;

class AdminDashboardTest extends TestCase
{
    use RefreshDatabase;

    public function test_admin_sections_render_as_full_pages(): void
    {
        $this->actingAs(User::factory()->create(['role' => 'super_admin']));
        foreach (['admin', 'admin/members', 'admin/communities', 'admin/posts', 'admin/quizzes', 'admin/moderation', 'admin/analytics', 'admin/settings'] as $path) {
            $this->get($path)->assertOk()->assertSee('LST Social');
        }
    }

    public function test_admin_ajax_request_returns_only_section_content(): void
    {
        $this->actingAs(User::factory()->create(['role' => 'super_admin']));
        $this->get('admin/quizzes', ['X-Requested-With' => 'XMLHttpRequest'])
            ->assertOk()
            ->assertSee('Manage assessments that are not attached to a required reading article.')
            ->assertDontSee('<aside', false)
            ->assertDontSee('<header', false);
    }
}
