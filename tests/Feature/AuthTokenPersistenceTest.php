<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AuthTokenPersistenceTest extends TestCase
{
    use RefreshDatabase;

    public function test_mobile_token_has_no_expiry_and_is_revoked_on_logout(): void
    {
        $user = User::factory()->create([
            'email' => 'member@example.com',
            'password' => 'secure-password',
        ]);

        $token = $this->postJson('/api/login', [
            'email' => $user->email,
            'password' => 'secure-password',
        ])->assertOk()->json('token');
        $tokenId = explode('|', $token, 2)[0];

        $this->assertDatabaseHas('personal_access_tokens', [
            'id' => $tokenId,
            'tokenable_id' => $user->id,
            'name' => 'mobile',
            'expires_at' => null,
        ]);

        $this->withHeader('Authorization', "Bearer {$token}")
            ->postJson('/api/logout')
            ->assertOk();

        $this->assertDatabaseMissing('personal_access_tokens', ['id' => $tokenId]);
    }
}
