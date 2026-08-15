<?php

return [
    'apple' => [
        'team_id' => env('DEEP_LINK_APPLE_TEAM_ID'),
        'bundle_id' => env('DEEP_LINK_APPLE_BUNDLE_ID', 'com.fiyinfholuwa.lstsocial'),
    ],

    'android' => [
        'package_name' => env('DEEP_LINK_ANDROID_PACKAGE', 'com.lstsocial.com'),
        'sha256_fingerprints' => array_values(array_filter(array_map(
            'trim',
            explode(',', (string) env('DEEP_LINK_ANDROID_SHA256_FINGERPRINTS', ''))
        ))),
    ],
];
