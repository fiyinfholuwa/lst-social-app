<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('statuses', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('type', 10);
            $table->text('text')->nullable();
            $table->string('image')->nullable();
            $table->timestamp('expires_at')->index();
            $table->timestamps();
            $table->index(['user_id', 'expires_at']);
        });

        Schema::create('status_views', function (Blueprint $table) {
            $table->id();
            $table->foreignId('status_id')->constrained('statuses')->cascadeOnDelete();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->timestamp('viewed_at');
            $table->unique(['status_id', 'user_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('status_views');
        Schema::dropIfExists('statuses');
    }
};
