<?php

return [
    'name' => env('BRAND_NAME', 'Love Straight Talks'),
    'product_name' => env('BRAND_PRODUCT_NAME', 'LST Social'),
    'logo_url' => env(
        'BRAND_LOGO_URL',
        'https://lovestraighttalks.com/wp-content/uploads/2019/08/0abbb10e-210f-4a45-b10c-854f16c93320.png',
    ),
    'support_email' => env('BRAND_SUPPORT_EMAIL', 'support@lovestraighttalks.com'),
    'ios_app_url' => env('BRAND_IOS_APP_URL', 'https://apps.apple.com/us/search?term=LST%20Social'),
    'android_app_url' => 'https://play.google.com/store/apps/details?id=com.lstsocial.com',
];
