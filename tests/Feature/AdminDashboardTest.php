<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AdminDashboardTest extends TestCase
{
    use RefreshDatabase;

    public function test_admin_sections_render_as_full_pages(): void
    {
        foreach (['admin', 'admin/members', 'admin/communities', 'admin/posts', 'admin/quizzes', 'admin/moderation', 'admin/analytics', 'admin/settings'] as $path) {
            $this->get($path)->assertOk()->assertSee('LST Social');
        }
    }

    public function test_admin_ajax_request_returns_only_section_content(): void
    {
        $this->get('admin/quizzes', ['X-Requested-With' => 'XMLHttpRequest'])
            ->assertOk()
            ->assertSee('Control questions and pass requirements.')
            ->assertDontSee('<aside', false)
            ->assertDontSee('<header', false);
    }
}
