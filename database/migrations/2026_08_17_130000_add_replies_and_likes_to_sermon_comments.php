<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('sermon_comments', function (Blueprint $table) {
            $table->foreignId('parent_id')->nullable()->after('id')->constrained('sermon_comments')->cascadeOnDelete();
            $table->unique(['parent_id', 'user_id']);
        });

        Schema::create('sermon_comment_likes', function (Blueprint $table) {
            $table->foreignId('sermon_comment_id')->constrained()->cascadeOnDelete();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->timestamps();
            $table->primary(['sermon_comment_id', 'user_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('sermon_comment_likes');
        Schema::table('sermon_comments', function (Blueprint $table) {
            $table->dropUnique(['parent_id', 'user_id']);
            $table->dropConstrainedForeignId('parent_id');
        });
    }
};
