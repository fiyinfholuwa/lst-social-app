<?php

namespace App\Services;

use App\Models\User;
use Illuminate\Support\Facades\DB;

class AccountDeletionService
{
    public function __construct(private UploadService $uploads, private CacheService $cache) {}

    public function delete(User $user): void
    {
        $userId = $user->id;
        $avatar = $user->avatar;
        $posts = $user->posts()->get(['id', 'community_id', 'image', 'images']);
        $voiceNotes = $user->messages()->whereNotNull('audio_uri')->pluck('audio_uri');
        $friendIds = DB::table('friendships')->where('sender_id', $userId)->pluck('receiver_id')
            ->merge(DB::table('friendships')->where('receiver_id', $userId)->pluck('sender_id'))->unique();
        $chatIds = DB::table('chat_user')->where('user_id', $userId)->pluck('chat_id');
        $chatParticipantIds = DB::table('chat_user')->whereIn('chat_id', $chatIds)->where('user_id', '!=', $userId)->pluck('user_id')->unique();
        $savedByUserIds = DB::table('saved_posts')->whereIn('post_id', $posts->pluck('id'))->pluck('user_id')->unique();

        DB::transaction(function () use ($user, $userId) {
            $user->tokens()->delete();
            DB::table('sessions')->where('user_id', $userId)->delete();
            $user->delete();
        });

        $this->uploads->delete($avatar, 'profiles');
        foreach ($posts as $post) {
            foreach ($post->images ?: ($post->image ? [$post->image] : []) as $image) {
                $this->uploads->delete($image, 'posts');
            }
        }
        foreach ($voiceNotes as $voiceNote) {
            $this->uploads->delete($voiceNote, 'voice-notes');
        }

        $scopes = ['posts', 'communities', "user:{$userId}", "friendships:{$userId}", "chats:{$userId}", "notifications:{$userId}", "saved:{$userId}"];
        foreach ($friendIds->merge($chatParticipantIds)->unique() as $relatedUserId) {
            $scopes[] = "friendships:{$relatedUserId}";
            $scopes[] = "chats:{$relatedUserId}";
        }
        foreach ($savedByUserIds as $savedByUserId) $scopes[] = "saved:{$savedByUserId}";
        foreach ($posts as $post) {
            $scopes[] = "post:{$post->id}";
            if ($post->community_id) $scopes[] = "community:{$post->community_id}";
        }
        $this->cache->invalidate(...$scopes);
    }
}
