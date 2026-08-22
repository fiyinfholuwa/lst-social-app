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
        $friendIds = DB::table('friendships')->where('sender_id', $userId)->pluck('receiver_id')
            ->merge(DB::table('friendships')->where('receiver_id', $userId)->pluck('sender_id'))->unique();
        $chatIds = DB::table('chat_user')->where('user_id', $userId)->pluck('chat_id');
        $chatParticipantIds = DB::table('chat_user')->whereIn('chat_id', $chatIds)->where('user_id', '!=', $userId)->pluck('user_id')->unique();
        $messageIds = DB::table('messages')->whereIn('chat_id', $chatIds)->pluck('id');
        $voiceNotes = DB::table('messages')->whereIn('chat_id', $chatIds)->whereNotNull('audio_uri')->pluck('audio_uri');
        $savedByUserIds = DB::table('saved_posts')->whereIn('post_id', $posts->pluck('id'))->pluck('user_id')->unique();

        DB::transaction(function () use ($user, $userId, $chatIds, $messageIds, $posts) {
            $user->tokens()->delete();
            DB::table('sessions')->where('user_id', $userId)->delete();
            DB::table('content_reports')->where(function ($reports) use ($userId, $messageIds, $posts) {
                $reports->where(fn ($query) => $query->where('target_type', 'user')->where('target_id', $userId))
                    ->orWhere(fn ($query) => $query->where('target_type', 'post')->whereIn('target_id', $posts->pluck('id')))
                    ->orWhere(fn ($query) => $query->where('target_type', 'message')->whereIn('target_id', $messageIds));
            })->delete();
            DB::table('content_reports')->where('reported_user_id', $userId)->delete();
            DB::table('chats')->whereIn('id', $chatIds)->delete();
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
