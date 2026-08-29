<?php

namespace Tests\Feature;

use App\Models\Community;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class CommunityDirectoryFilterTest extends TestCase
{
    use RefreshDatabase;

    public function test_circle_directory_searches_and_filters_before_paginating(): void
    {
        $user = User::factory()->create();
        $joined = Community::create(['name' => 'Marriage Support', 'description' => 'Healthy relationships']);
        Community::create(['name' => 'Addiction Recovery', 'description' => 'A healing circle']);
        Community::create(['name' => 'Singles Growth', 'description' => 'Purpose and community']);
        $joined->members()->attach($user->id);

        $this->actingAs($user)->getJson('/api/communities?page=1&q=healing&filter=all')
            ->assertOk()
            ->assertJsonPath('total', 1)
            ->assertJsonPath('data.0.name', 'Addiction Recovery');

        $this->actingAs($user)->getJson('/api/communities?page=1&filter=mine')
            ->assertOk()
            ->assertJsonPath('total', 1)
            ->assertJsonPath('data.0.id', (string) $joined->id);

        $this->actingAs($user)->getJson('/api/communities?page=1&filter=singles')
            ->assertOk()
            ->assertJsonPath('total', 1)
            ->assertJsonPath('data.0.name', 'Singles Growth');
    }
}
