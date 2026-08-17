<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('posts', function (Blueprint $table) {
            $table->string('public_id', 26)->nullable()->unique()->after('id');
        });

        DB::table('posts')->whereNull('public_id')->orderBy('id')->eachById(function ($post) {
            DB::table('posts')->where('id', $post->id)->update(['public_id' => (string) Str::ulid()]);
        });
    }

    public function down(): void
    {
        Schema::table('posts', fn (Blueprint $table) => $table->dropColumn('public_id'));
    }
};
