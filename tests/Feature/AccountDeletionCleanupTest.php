<?php

namespace Tests\Feature;

use App\Models\Chat;
use App\Models\Community;
use App\Models\ContentReport;
use App\Models\Message;
use App\Models\Post;
use App\Models\User;
use App\Services\UploadService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\RateLimiter;
use Tests\TestCase;

class AccountDeletionCleanupTest extends TestCase
{
    use RefreshDatabase;

    public function test_self_deletion_removes_profile_post_and_voice_files(): void
    {
        $user = User::factory()->create(['password' => 'correct-password']);
        $other = User::factory()->create();
        $uploads = app(UploadService::class);
        $avatar = $uploads->store(UploadedFile::fake()->image('avatar.jpg'), 'profiles');
        $postImage = $uploads->store(UploadedFile::fake()->image('post.jpg'), 'posts');
        $voiceNote = $uploads->store(UploadedFile::fake()->create('voice.m4a', 10, 'audio/mp4'), 'voice-notes');
        $user->update(['avatar' => $avatar]);
        Post::create(['user_id' => $user->id, 'content' => 'With media', 'image' => $postImage, 'images' => [$postImage]]);
        $chat = Chat::create();
        $chat->users()->attach([$user->id, $other->id]);
        Message::create(['chat_id' => $chat->id, 'sender_id' => $user->id, 'type' => 'voice', 'audio_uri' => $voiceNote, 'duration' => 1000]);

        foreach ([$avatar, $postImage, $voiceNote] as $path) $this->assertFileExists($this->publicUploadPath($path));

        $this->actingAs($user)->deleteJson('/api/user', ['password' => 'correct-password'])->assertOk();

        foreach ([$avatar, $postImage, $voiceNote] as $path) $this->assertFileDoesNotExist($this->publicUploadPath($path));
        $this->assertDatabaseMissing('users', ['id' => $user->id]);
    }

    public function test_admin_deletion_uses_the_same_media_cleanup(): void
    {
        $admin = User::factory()->create(['role' => 'super_admin']);
        $member = User::factory()->create();
        $other = User::factory()->create();
        $avatar = app(UploadService::class)->store(UploadedFile::fake()->image('avatar.jpg'), 'profiles');
        $postImage = app(UploadService::class)->store(UploadedFile::fake()->image('post.jpg'), 'posts');
        $voiceNote = app(UploadService::class)->store(UploadedFile::fake()->create('voice.m4a', 10, 'audio/mp4'), 'voice-notes');
        $member->update(['avatar' => $avatar]);
        $post = Post::create(['user_id' => $member->id, 'content' => 'Delete this post', 'image' => $postImage, 'images' => [$postImage]]);
        $post->comments()->create(['user_id' => $member->id, 'text' => 'Delete this comment']);
        $community = Community::create(['name' => 'Deletion test circle']);
        $community->members()->attach($member);
        $chat = Chat::create();
        $chat->users()->attach([$member->id, $other->id]);
        $message = Message::create(['chat_id' => $chat->id, 'sender_id' => $member->id, 'type' => 'voice', 'audio_uri' => $voiceNote, 'duration' => 1000]);
        ContentReport::create([
            'reporter_id' => $other->id,
            'reported_user_id' => $member->id,
            'target_type' => 'message',
            'target_id' => $message->id,
            'reason' => 'spam',
        ]);

        $this->actingAs($admin)->delete("/admin/members/{$member->id}")->assertRedirect();

        $this->assertFileDoesNotExist($this->publicUploadPath($avatar));
        $this->assertFileDoesNotExist($this->publicUploadPath($postImage));
        $this->assertFileDoesNotExist($this->publicUploadPath($voiceNote));
        $this->assertDatabaseMissing('users', ['id' => $member->id]);
        $this->assertDatabaseMissing('posts', ['id' => $post->id]);
        $this->assertDatabaseMissing('chats', ['id' => $chat->id]);
        $this->assertDatabaseMissing('messages', ['id' => $message->id]);
        $this->assertDatabaseMissing('community_user', ['community_id' => $community->id, 'user_id' => $member->id]);
        $this->assertDatabaseMissing('content_reports', ['reported_user_id' => $member->id]);
    }

    public function test_media_creation_routes_are_rate_limited_per_member(): void
    {
        $user = User::factory()->create();
        RateLimiter::clear("media:{$user->id}");

        foreach (range(1, 12) as $number) {
            $this->actingAs($user)->postJson('/api/posts', ['content' => "Post {$number}"])->assertCreated();
        }
        $this->actingAs($user)->postJson('/api/posts', ['content' => 'One too many'])->assertStatus(429);
    }

    private function publicUploadPath(string $url): string
    {
        $relative = ltrim(str_replace('/'.trim(config('uploads.url_prefix'), '/').'/', '', $url), '/');
        return public_path(trim(config('uploads.directory'), '/').'/'.$relative);
    }
}
