<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class RegistrationEmailAvailabilityTest extends TestCase
{
    use RefreshDatabase;

    public function test_it_reports_an_unused_email_as_available(): void
    {
        $this->postJson('/api/register/check-email', ['email' => 'new@example.com'])
            ->assertOk()
            ->assertJson(['available' => true]);
    }

    public function test_it_stops_registration_when_email_already_exists(): void
    {
        User::factory()->create(['email' => 'member@example.com']);

        $this->postJson('/api/register/check-email', ['email' => 'MEMBER@example.com'])
            ->assertOk()
            ->assertJson([
                'available' => false,
                'message' => 'An account with this email already exists.',
            ]);

        $this->postJson('/api/register', [
            'first_name' => 'Another',
            'last_name' => 'Member',
            'email' => 'MEMBER@example.com',
            'password' => 'password123',
            'password_confirmation' => 'password123',
        ])->assertUnprocessable()->assertJsonValidationErrors('email');
    }
}
