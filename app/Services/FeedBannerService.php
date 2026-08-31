<?php

namespace App\Services;

use App\Models\PlatformSetting;

class FeedBannerService
{
    private const VERSES = [
        ['text' => 'Let all that you do be done in love.', 'reference' => '1 Corinthians 16:14'],
        ['text' => 'I can do all things through Christ, who strengthens me.', 'reference' => 'Philippians 4:13'],
        ['text' => 'God is our refuge and strength, a very present help in trouble.', 'reference' => 'Psalm 46:1'],
        ['text' => 'Trust in Yahweh with all your heart, and don’t lean on your own understanding.', 'reference' => 'Proverbs 3:5'],
        ['text' => 'Rejoicing in hope, enduring in troubles, continuing steadfastly in prayer.', 'reference' => 'Romans 12:12'],
        ['text' => 'Don’t be afraid, for I am with you. Don’t be dismayed, for I am your God.', 'reference' => 'Isaiah 41:10'],
        ['text' => 'Let’s not be weary in doing good, for we will reap in due season if we don’t give up.', 'reference' => 'Galatians 6:9'],
    ];

    public function current(): ?array
    {
        $mode = PlatformSetting::valueFor(
            'feed_banner_mode',
            PlatformSetting::valueFor('announcement_enabled', '0') === '1' ? 'announcement' : 'encouragement'
        );

        if ($mode === 'hidden') {
            return null;
        }

        if ($mode === 'announcement') {
            return [
                'mode' => 'announcement',
                'label' => 'ANNOUNCEMENT',
                'title' => PlatformSetting::valueFor('announcement_title', 'Important update'),
                'text' => PlatformSetting::valueFor('announcement_text', ''),
                'actionLabel' => 'Click here to continue',
                'actionUrl' => PlatformSetting::valueFor('announcement_action_url'),
            ];
        }

        $verse = self::VERSES[((int) now()->format('z')) % count(self::VERSES)];

        return [
            'mode' => 'encouragement',
            'label' => "TODAY'S ENCOURAGEMENT",
            'text' => $verse['text'],
            'reference' => $verse['reference'],
            'source' => 'World English Bible',
        ];
    }
}
