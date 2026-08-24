<?php

namespace App\Services;

use App\Models\User;
use Illuminate\Support\Facades\DB;

class AutomaticFriendshipService
{
    public function __construct(private CacheService $cache) {}

    public function connectWithEveryone(User $user): void
    {
        if ($user->isHiddenFromSocial()) {
            return;
        }

        User::query()->visibleInSocial()->whereKeyNot($user->id)->pluck('id')->each(
            fn ($otherId) => $this->connect($user->id, (int) $otherId)
        );
    }

    public function connectNewUser(User $user): void
    {
        if ($user->isHiddenFromSocial()) {
            return;
        }

        User::query()->visibleInSocial()->where('auto_friend_everyone', true)->whereKeyNot($user->id)->pluck('id')->each(
            fn ($automaticUserId) => $this->connect((int) $automaticUserId, $user->id)
        );
    }

    private function connect(int $firstId, int $secondId): void
    {
        if ($firstId === $secondId || DB::table('user_blocks')->where(fn ($blocks) => $blocks
            ->where(['user_id' => $firstId, 'blocked_user_id' => $secondId])
            ->orWhere(fn ($reverse) => $reverse->where(['user_id' => $secondId, 'blocked_user_id' => $firstId])))->exists()) {
            return;
        }

        $existing = DB::table('friendships')->where(fn ($friendships) => $friendships
            ->where(['sender_id' => $firstId, 'receiver_id' => $secondId])
            ->orWhere(fn ($reverse) => $reverse->where(['sender_id' => $secondId, 'receiver_id' => $firstId])));

        if ((clone $existing)->exists()) {
            $existing->update(['status' => 'accepted', 'updated_at' => now()]);
        } else {
            DB::table('friendships')->insertOrIgnore([
                'sender_id' => min($firstId, $secondId),
                'receiver_id' => max($firstId, $secondId),
                'status' => 'accepted',
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }

        $this->cache->invalidate("friendships:{$firstId}", "friendships:{$secondId}");
    }
}
