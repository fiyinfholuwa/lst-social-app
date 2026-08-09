<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

class StressTestSeeder extends Seeder
{
    private const ADMIN_EMAIL = 'stress.admin@lst.test';
    private const MEMBER_EMAIL = 'stress.user.0001@lst.test';
    private const PASSWORD = 'Password123!';

    public function run(): void
    {
        $userCount = max(10, min(1000, (int) env('STRESS_USER_COUNT', 1000)));
        $now = now();
        $password = Hash::make(self::PASSWORD);

        DB::disableQueryLog();
        DB::transaction(function () use ($userCount, $now, $password) {
            DB::table('communities')->where('name', 'Stress Test Community')->delete();
            DB::table('users')->where('email', 'like', 'stress.%@lst.test')->delete();

            $users = [[
                'name' => 'Stress Admin', 'first_name' => 'Stress', 'last_name' => 'Admin',
                'email' => self::ADMIN_EMAIL, 'email_verified_at' => $now, 'password' => $password,
                'role' => 'admin', 'bio' => 'Administrator account for load and moderation testing.',
                'created_at' => $now, 'updated_at' => $now,
            ]];

            for ($number = 1; $number < $userCount; $number++) {
                $index = str_pad((string) $number, 4, '0', STR_PAD_LEFT);
                $users[] = [
                    'name' => "Stress User {$index}", 'first_name' => 'Stress', 'last_name' => "User {$index}",
                    'email' => "stress.user.{$index}@lst.test",
                    'email_verified_at' => $number % 20 === 0 ? null : $now,
                    'password' => $password, 'role' => null,
                    'bio' => "Generated test member {$index}.",
                    'created_at' => $now->copy()->subDays($number % 120), 'updated_at' => $now,
                ];
            }
            foreach (array_chunk($users, 250) as $chunk) DB::table('users')->insert($chunk);

            $userIds = DB::table('users')->where('email', 'like', 'stress.%@lst.test')->orderBy('id')->pluck('id')->all();
            $adminId = (int) DB::table('users')->where('email', self::ADMIN_EMAIL)->value('id');
            $memberId = (int) DB::table('users')->where('email', self::MEMBER_EMAIL)->value('id');

            $communityId = DB::table('communities')->insertGetId([
                'name' => 'Stress Test Community',
                'description' => 'Generated community for testing membership, post approval, comments, and pagination.',
                'rules' => 'Testing data only.', 'admin_id' => $adminId,
                'created_at' => $now, 'updated_at' => $now,
            ]);

            $memberships = [];
            foreach (array_slice($userIds, 0, min(500, count($userIds))) as $userId) {
                $memberships[] = ['community_id' => $communityId, 'user_id' => $userId, 'created_at' => $now, 'updated_at' => $now];
            }
            foreach (array_chunk($memberships, 500) as $chunk) DB::table('community_user')->insert($chunk);

            $friendships = [];
            foreach (array_slice(array_values(array_diff($userIds, [$memberId])), 0, 350) as $friendId) {
                $friendships[] = ['sender_id' => min($memberId, $friendId), 'receiver_id' => max($memberId, $friendId), 'status' => 'accepted', 'created_at' => $now, 'updated_at' => $now];
            }
            for ($index = 2; $index < count($userIds) - 1; $index++) {
                $first = $userIds[$index]; $second = $userIds[$index + 1];
                $friendships[] = ['sender_id' => min($first, $second), 'receiver_id' => max($first, $second), 'status' => $index % 8 === 0 ? 'pending' : 'accepted', 'created_at' => $now, 'updated_at' => $now];
            }
            $friendships = collect($friendships)->unique(fn ($row) => $row['sender_id'].'-'.$row['receiver_id'])->values()->all();
            foreach (array_chunk($friendships, 500) as $chunk) DB::table('friendships')->insert($chunk);

            $posts = [];
            for ($index = 0; $index < 2000; $index++) {
                $authorId = $userIds[$index % count($userIds)];
                $posts[] = [
                    'user_id' => $authorId, 'community_id' => null, 'original_post_id' => null,
                    'content' => 'Stress timeline post '.($index + 1).'. Testing scrolling, reactions, comments, and feed stability.',
                    'image' => null, 'images' => null, 'type' => 'Post',
                    'audience' => $authorId === $adminId ? 'Everyone' : 'Friends', 'status' => 'approved',
                    'created_at' => $now->copy()->subMinutes($index), 'updated_at' => $now,
                ];
            }
            for ($index = 0; $index < 600; $index++) {
                $authorId = $userIds[$index % min(500, count($userIds))];
                $isCommunityAdmin = $authorId === $adminId;
                $posts[] = [
                    'user_id' => $authorId, 'community_id' => $communityId, 'original_post_id' => null,
                    'content' => 'Stress community post '.($index + 1).'. Testing moderation and community pagination.',
                    'image' => null, 'images' => null, 'type' => 'Community post', 'audience' => 'Stress Test Community',
                    'status' => $isCommunityAdmin || $index % 3 !== 0 ? 'approved' : 'pending',
                    'created_at' => $now->copy()->subMinutes($index), 'updated_at' => $now,
                ];
            }
            foreach (array_chunk($posts, 400) as $chunk) DB::table('posts')->insert($chunk);

            $timelinePostIds = DB::table('posts')->whereIn('user_id', $userIds)->whereNull('community_id')->whereNull('original_post_id')->pluck('id')->all();
            $comments = [];
            for ($index = 0; $index < 6000; $index++) {
                $comments[] = [
                    'post_id' => $timelinePostIds[$index % count($timelinePostIds)],
                    'user_id' => $userIds[($index * 7 + 3) % count($userIds)], 'parent_id' => null,
                    'text' => 'Generated comment '.($index + 1).' for conversation and pagination testing.',
                    'created_at' => $now->copy()->subSeconds($index * 7), 'updated_at' => $now,
                ];
            }
            foreach (array_chunk($comments, 500) as $chunk) DB::table('comments')->insert($chunk);

            $rootComments = DB::table('comments')->whereIn('user_id', $userIds)->whereNull('parent_id')->pluck('post_id', 'id');
            $rootCommentIds = $rootComments->keys()->all();
            $replies = [];
            for ($index = 0; $index < 3000; $index++) {
                $parentId = $rootCommentIds[$index % count($rootCommentIds)];
                $postId = (int) $rootComments[$parentId];
                $replies[] = [
                    'post_id' => $postId, 'user_id' => $userIds[($index * 11 + 5) % count($userIds)],
                    'parent_id' => $parentId, 'text' => 'Generated reply '.($index + 1).'.',
                    'created_at' => $now->copy()->subSeconds($index * 5), 'updated_at' => $now,
                ];
            }
            foreach (array_chunk($replies, 500) as $chunk) DB::table('comments')->insert($chunk);

            $likes = [];
            for ($index = 0; $index < 12000; $index++) {
                $postId = $timelinePostIds[$index % count($timelinePostIds)];
                $userId = $userIds[($index * 13 + intdiv($index, count($timelinePostIds))) % count($userIds)];
                $likes[$postId.'-'.$userId] = ['post_id' => $postId, 'user_id' => $userId];
            }
            foreach (array_chunk(array_values($likes), 500) as $chunk) DB::table('post_likes')->insert($chunk);

            $commentLikes = [];
            for ($index = 0; $index < 8000; $index++) {
                $commentId = $rootCommentIds[$index % count($rootCommentIds)];
                $userId = $userIds[($index * 17 + 1) % count($userIds)];
                $commentLikes[$commentId.'-'.$userId] = ['comment_id' => $commentId, 'user_id' => $userId];
            }
            foreach (array_chunk(array_values($commentLikes), 500) as $chunk) DB::table('comment_likes')->insert($chunk);

            $shares = [];
            for ($index = 0; $index < 300; $index++) {
                $shares[] = [
                    'user_id' => $userIds[($index + 30) % count($userIds)], 'community_id' => null,
                    'original_post_id' => $timelinePostIds[$index % count($timelinePostIds)],
                    'content' => $index % 2 === 0 ? 'A generated note added to this shared post.' : '',
                    'image' => null, 'images' => null, 'type' => 'Shared post', 'audience' => 'Friends', 'status' => 'approved',
                    'created_at' => $now->copy()->subSeconds($index * 3), 'updated_at' => $now,
                ];
            }
            foreach (array_chunk($shares, 300) as $chunk) DB::table('posts')->insert($chunk);

            $applications = [];
            foreach (array_slice($userIds, 500, min(100, max(0, count($userIds) - 500))) as $userId) {
                $applications[] = ['community_id' => $communityId, 'user_id' => $userId, 'answers' => json_encode(['motivation' => 'Generated stress-test application.']), 'status' => 'pending', 'created_at' => $now, 'updated_at' => $now];
            }
            foreach (array_chunk($applications, 250) as $chunk) DB::table('community_applications')->insert($chunk);
        });

        cache()->flush();
        $this->command?->info("Created {$userCount} stress users with posts, comments, replies, likes, shares, friendships, and moderation data.");
        $this->command?->table(['Role', 'Email', 'Password'], [
            ['Admin', self::ADMIN_EMAIL, self::PASSWORD],
            ['Member', self::MEMBER_EMAIL, self::PASSWORD],
        ]);
    }
}
