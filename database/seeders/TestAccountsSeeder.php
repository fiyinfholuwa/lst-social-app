<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;

class TestAccountsSeeder extends Seeder
{
    /**
     * Create reusable test accounts without generating stress-test data.
     */
    public function run(): void
    {
        User::updateOrCreate(
            ['email' => 'test.user@lst.test'],
            [
                'name' => 'Test User',
                'password' => 'password',
                'role' => null,
                'email_verified_at' => now(),
            ],
        );

        User::updateOrCreate(
            ['email' => 'test.admin@lst.test'],
            [
                'name' => 'Test Admin',
                'password' => 'password',
                'role' => 'admin',
                'email_verified_at' => now(),
            ],
        );
    }
}
