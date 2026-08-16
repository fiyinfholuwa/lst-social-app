<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('sermon_likes', function (Blueprint $table) {
            $table->foreignId('sermon_id')->constrained()->cascadeOnDelete();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->timestamps();
            $table->primary(['sermon_id', 'user_id']);
        });
        Schema::create('sermon_comments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('sermon_id')->constrained()->cascadeOnDelete();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->text('text');
            $table->timestamps();
            $table->index(['sermon_id', 'created_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('sermon_comments');
        Schema::dropIfExists('sermon_likes');
    }
};
