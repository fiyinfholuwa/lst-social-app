<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // MySQL's older utf8 charset stores at most 3-byte characters and
        // cannot safely store most emoji. Keep social text on utf8mb4.
        if (DB::getDriverName() !== 'mysql') {
            return;
        }

        foreach ([
            ['posts', 'content'],
            ['comments', 'text'],
            ['messages', 'text'],
        ] as [$table, $column]) {
            if (Schema::hasTable($table) && Schema::hasColumn($table, $column)) {
                DB::statement("ALTER TABLE `{$table}` MODIFY `{$column}` TEXT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci");
            }
        }
    }

    public function down(): void
    {
        // Do not downgrade social text columns: that would make emoji unsafe.
    }
};
