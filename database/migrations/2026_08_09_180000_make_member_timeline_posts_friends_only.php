<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        $adminIds = DB::table('users')->whereIn('role', ['admin', 'super_admin'])->pluck('id');

        DB::table('posts')
            ->whereNull('community_id')
            ->whereNull('original_post_id')
            ->where('audience', 'Everyone')
            ->when($adminIds->isNotEmpty(), fn ($query) => $query->whereNotIn('user_id', $adminIds))
            ->update(['audience' => 'Friends']);
    }

    public function down(): void
    {
        // Audience changes are intentionally retained to avoid exposing private posts.
    }
};
