<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        $userId = DB::table('users')->whereRaw('LOWER(email) = ?', ['test.admin@lst.test'])->value('id');

        if (! $userId) {
            return;
        }

        DB::table('users')->where('id', $userId)->update([
            'role' => 'super_admin',
            'auto_friend_everyone' => false,
            'updated_at' => now(),
        ]);

        DB::table('friendships')->where('sender_id', $userId)->orWhere('receiver_id', $userId)->delete();
    }

    public function down(): void
    {
        // The account cannot be demoted and deleted friendships cannot be reconstructed safely.
    }
};
