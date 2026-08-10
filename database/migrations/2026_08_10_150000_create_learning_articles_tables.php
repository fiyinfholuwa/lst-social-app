<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('learning_articles', function (Blueprint $table) {
            $table->id();
            $table->foreignId('community_id')->constrained()->cascadeOnDelete();
            $table->string('title');
            $table->longText('content');
            $table->unsignedSmallInteger('position')->default(1);
            $table->unsignedSmallInteger('duration_minutes')->default(5);
            $table->unsignedTinyInteger('passing_score')->default(70);
            $table->string('status')->default('draft')->index();
            $table->timestamps();
            $table->unique(['community_id', 'title']);
        });
        Schema::create('learning_article_questions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('learning_article_id')->constrained()->cascadeOnDelete();
            $table->text('question');
            $table->unsignedSmallInteger('position')->default(1);
            $table->timestamps();
        });
        Schema::create('learning_article_answers', function (Blueprint $table) {
            $table->id();
            $table->foreignId('learning_article_question_id')->constrained()->cascadeOnDelete();
            $table->text('answer');
            $table->boolean('is_correct')->default(false);
            $table->unsignedSmallInteger('position')->default(1);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('learning_article_answers');
        Schema::dropIfExists('learning_article_questions');
        Schema::dropIfExists('learning_articles');
    }
};
