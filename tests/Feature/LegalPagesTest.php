<?php

namespace Tests\Feature;

use Tests\TestCase;

class LegalPagesTest extends TestCase
{
    public function test_privacy_policy_is_publicly_available(): void
    {
        $this->get(route('privacy'))
            ->assertOk()
            ->assertSee('Privacy Policy')
            ->assertSee('Information we collect');
    }

    public function test_terms_are_publicly_available(): void
    {
        $this->get(route('terms'))
            ->assertOk()
            ->assertSee('Terms and Conditions')
            ->assertSee('Community conduct');
    }

    public function test_landing_page_links_to_both_legal_documents(): void
    {
        $this->get('/')
            ->assertOk()
            ->assertSee(route('privacy'))
            ->assertSee(route('terms'));
    }
}
