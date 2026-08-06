<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('posts', function (Blueprint $table) {
            $table->json('images')->nullable()->after('image');
        });

        DB::table('posts')->whereNotNull('image')->orderBy('id')->each(function (object $post): void {
            DB::table('posts')->where('id', $post->id)->update(['images' => json_encode([$post->image])]);
        });
    }

    public function down(): void
    {
        Schema::table('posts', fn (Blueprint $table) => $table->dropColumn('images'));
    }
};
