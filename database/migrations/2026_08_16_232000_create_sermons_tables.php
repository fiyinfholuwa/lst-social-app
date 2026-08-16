<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('sermon_categories', function (Blueprint $table) {
            $table->id();
            $table->string('name')->unique();
            $table->unsignedInteger('position')->default(0);
            $table->timestamps();
        });
        Schema::create('sermons', function (Blueprint $table) {
            $table->id();
            $table->foreignId('sermon_category_id')->constrained()->cascadeOnDelete();
            $table->string('title');
            $table->text('description')->nullable();
            $table->string('speaker')->nullable();
            $table->text('url');
            $table->boolean('is_published')->default(true);
            $table->timestamps();
            $table->index(['sermon_category_id', 'is_published']);
        });
        $now = now();
        DB::table('sermon_categories')->insert([
            ['name' => 'Sexual Purity', 'position' => 1, 'created_at' => $now, 'updated_at' => $now],
            ['name' => 'Love and Relationships', 'position' => 2, 'created_at' => $now, 'updated_at' => $now],
            ['name' => 'Other', 'position' => 99, 'created_at' => $now, 'updated_at' => $now],
        ]);
    }

    public function down(): void
    {
        Schema::dropIfExists('sermons');
        Schema::dropIfExists('sermon_categories');
    }
};
