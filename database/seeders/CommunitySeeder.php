<?php

namespace Database\Seeders;

use App\Models\Community;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Cache;

class CommunitySeeder extends Seeder
{
    public function run(): void
    {
        $legacyCommunity = Community::where('name', 'Faith & Encouragement')->first();
        if ($legacyCommunity) {
            \App\Models\Post::where('community_id', $legacyCommunity->id)
                ->orWhere('audience', 'Faith & Encouragement')
                ->delete();
            $legacyCommunity->delete();
        }

        $leader = User::updateOrCreate(
            ['email' => 'pastor.peniela@lstsocial.app'],
            [
                'name' => 'Pastor Peniela Akintujoye',
                'password' => Hash::make('password'),
                'bio' => 'Pastor, mentor, and community leader helping people grow toward maturity and wholeness.',
                'role' => 'Community leader',
                'avatar' => 'https://i.pravatar.cc/200?img=12',
            ]
        );

        $rules = 'Be respectful and truthful. Protect every member’s privacy. Do not share another member’s story outside the community. Follow the guidance of authorised community leaders.';

        $communities = [
            [
                'name' => 'Virgins & Sexual Puritans',
                'description' => 'A shared growth community for people committed to abstinence and a lifestyle of sexual purity.',
                'image' => 'https://picsum.photos/seed/lst-purity/800/500',
            ],
            [
                'name' => 'Addiction Recovery',
                'description' => 'A safe, supportive community for people seeking freedom from addiction and a healthy, godly life through accountability, encouragement, prayer, and recovery resources.',
                'image' => 'https://picsum.photos/seed/lst-recovery/800/500',
            ],
            [
                'name' => 'Marriage Healing',
                'description' => 'A safe place for couples facing conflict, distance, lost trust, or separation to seek healing, support, guidance, and restoration.',
                'image' => 'https://picsum.photos/seed/lst-healing/800/500',
            ],
            [
                'name' => 'Quick Marital Settlement',
                'description' => 'Faith-based support, guidance, and preparation for mature singles seeking a godly spouse and a healthy marriage.',
                'image' => 'https://picsum.photos/seed/lst-marital/800/500',
            ],
            [
                'name' => 'Courtship Mentorship & Marriage Preparation',
                'description' => 'Mentorship for courting couples, soon-to-marry partners, and mature singles building a foundation for purposeful and lasting marriage.',
                'image' => 'https://picsum.photos/seed/lst-courtship/800/500',
            ],
            [
                'name' => 'Special Discipleship',
                'description' => 'An intensive discipleship community focused on spiritual growth, personal guidance, accountability, ministry assignments, and Christlike maturity.',
                'image' => 'https://picsum.photos/seed/lst-discipleship/800/500',
            ],
            [
                'name' => 'All-Round Wholeness for Singles',
                'description' => 'A three-month mentorship community helping singles grow in purpose, faith, emotional wholeness, career, finances, and divine direction.',
                'image' => 'https://picsum.photos/seed/lst-wholeness/800/500',
            ],
        ];

        foreach ($communities as $community) {
            Community::updateOrCreate(
                ['name' => $community['name']],
                $community + ['rules' => $rules, 'admin_id' => $leader->id]
            );
        }

        Cache::flush();
    }
}
