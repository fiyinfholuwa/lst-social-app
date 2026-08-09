<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('posts', function (Blueprint $table) {
            $table->foreignId('original_post_id')->nullable()->after('community_id')->constrained('posts')->nullOnDelete();
            $table->index(['original_post_id', 'created_at'], 'posts_original_created_index');
        });
    }

    public function down(): void
    {
        Schema::table('posts', function (Blueprint $table) {
            $table->dropIndex('posts_original_created_index');
            $table->dropConstrainedForeignId('original_post_id');
        });
    }
};
