<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        $adminIds = DB::table('users')->whereIn('role', ['admin', 'super_admin'])->pluck('id');
        $communityIds = DB::table('communities')->pluck('id');
        $now = now();

        $memberships = $adminIds->flatMap(fn ($adminId) => $communityIds->map(fn ($communityId) => [
            'community_id' => $communityId,
            'user_id' => $adminId,
            'created_at' => $now,
            'updated_at' => $now,
        ]));

        foreach ($memberships->chunk(500) as $chunk) {
            DB::table('community_user')->insertOrIgnore($chunk->all());
        }
    }

    public function down(): void
    {
        // Memberships are retained because an administrator may have joined independently.
    }
};
