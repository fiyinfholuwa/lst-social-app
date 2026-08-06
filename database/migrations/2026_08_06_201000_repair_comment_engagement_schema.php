<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // A previous deployment recorded the feature migration without creating
        // these tables in the active MySQL schema. Keep this safe to run on
        // both affected and clean installations.
        if (!Schema::hasColumn('comments', 'parent_id')) {
            Schema::table('comments', function (Blueprint $table) {
                $table->foreignId('parent_id')->nullable()->after('user_id')->constrained('comments')->cascadeOnDelete();
                $table->index(['post_id', 'parent_id', 'created_at'], 'comments_thread_index');
            });
        }

        if (!Schema::hasTable('comment_likes')) {
            Schema::create('comment_likes', function (Blueprint $table) {
                $table->foreignId('comment_id')->constrained()->cascadeOnDelete();
                $table->foreignId('user_id')->constrained()->cascadeOnDelete();
                $table->primary(['comment_id', 'user_id']);
            });
        }
    }

    public function down(): void
    {
        // This is a repair migration. Do not remove structures that may have
        // been created by the original feature migration.
    }
};
