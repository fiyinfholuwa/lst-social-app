<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->text('hobbies')->nullable()->after('bio');
            $table->string('marital_status', 40)->nullable()->after('hobbies');
            $table->date('date_of_birth')->nullable()->after('marital_status');
            $table->string('workplace')->nullable()->after('date_of_birth');
            $table->string('occupation')->nullable()->after('workplace');
            $table->boolean('is_profile_private')->default(false)->after('occupation')->index();
        });
    }

    public function down(): void
    {
        Schema::table('users', fn (Blueprint $table) => $table->dropColumn(['hobbies', 'marital_status', 'date_of_birth', 'workplace', 'occupation', 'is_profile_private']));
    }
};
