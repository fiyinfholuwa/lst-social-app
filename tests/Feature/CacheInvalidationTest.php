<?php

namespace Tests\Feature;

use App\Models\Post;
use App\Models\User;
use App\Services\CacheService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Cache;
use Tests\TestCase;

class CacheInvalidationTest extends TestCase
{
    use RefreshDatabase;

    public function test_scoped_cache_is_reused_until_invalidated(): void
    {
        $cache = app(CacheService::class);
        $loads = 0;

        $first = $cache->remember('example', 'value', 300, function () use (&$loads) {
            $loads++;

            return 'first';
        });
        $second = $cache->remember('example', 'value', 300, function () use (&$loads) {
            $loads++;

            return 'second';
        });

        $this->assertSame('first', $first);
        $this->assertSame('first', $second);
        $this->assertSame(1, $loads);

        $cache->invalidate('example');
        $third = $cache->remember('example', 'value', 300, function () use (&$loads) {
            $loads++;

            return 'fresh';
        });

        $this->assertSame('fresh', $third);
        $this->assertSame(2, $loads);
    }

    public function test_post_mutations_invalidate_feed_and_post_caches(): void
    {
        Cache::clear();
        $user = User::factory()->create();
        $post = Post::create(['user_id' => $user->id, 'content' => 'Before']);
        $headers = ['Authorization' => 'Bearer '.$user->createToken('test')->plainTextToken];

        $this->withHeaders($headers)->getJson('/api/posts')->assertJsonPath('0.likes', 0);
        $this->withHeaders($headers)->getJson("/api/posts/{$post->id}")->assertJsonPath('likes', 0);

        $this->withHeaders($headers)->postJson("/api/posts/{$post->id}/like")->assertJsonPath('likes', 1);
        $this->withHeaders($headers)->getJson('/api/posts')->assertJsonPath('0.likes', 1);
        $this->withHeaders($headers)->getJson("/api/posts/{$post->id}")->assertJsonPath('likes', 1);
    }
}
