<?php

namespace Database\Seeders;

use App\Models\Post;
use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // User::factory(10)->create();

        $users = collect([
            ['Grace Johnson', 'grace@example.com', 1, 'Lover of Jesus. Wife. Mom. Worship leader.'],
            ['David Eze', 'david@example.com', 2, 'Growing in grace. Prayer team volunteer.'],
            ['Sarah Williams', 'sarah@example.com', 3, 'Wife, sister, and lover of honest community.'],
            ['Pastor Michael', 'michael@example.com', 4, 'Pastor and mentor helping people grow with wisdom.'],
            ['Daniel Okafor', 'daniel@example.com', 11, 'Recovery advocate. One day at a time.'],
        ])->map(fn ($u) => User::updateOrCreate(['email' => $u[1]], ['name' => $u[0], 'password' => 'password', 'avatar' => "https://i.pravatar.cc/200?img={$u[2]}", 'bio' => $u[3], 'role' => str_starts_with($u[0], 'Pastor') ? 'Community leader' : null]));
        if (Post::count() === 0) {
            Post::create(['user_id' => $users[0]->id, 'content' => 'Trust in the Lord with all your heart. Share the verse carrying you today. 🙏', 'image' => 'https://picsum.photos/600/320?random=1', 'type' => 'Encouragement', 'audience' => 'Everyone']);
        }

        $this->call(CommunitySeeder::class);
        $this->call(CommunityQuizSeeder::class);
    }
}
