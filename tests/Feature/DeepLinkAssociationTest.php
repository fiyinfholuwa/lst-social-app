<?php

namespace Tests\Feature;

use Tests\TestCase;

class DeepLinkAssociationTest extends TestCase
{
    public function test_it_serves_the_apple_app_site_association_file(): void
    {
        config([
            'deep_links.apple.team_id' => 'ABCDE12345',
            'deep_links.apple.bundle_id' => 'com.fiyinfholuwa.lstsocial',
        ]);

        $this->get('/.well-known/apple-app-site-association')
            ->assertOk()
            ->assertHeader('content-type', 'application/json')
            ->assertJsonPath('applinks.details.0.appID', 'ABCDE12345.com.fiyinfholuwa.lstsocial')
            ->assertJsonPath('applinks.details.0.components.0./', '/posts/*');
    }

    public function test_it_serves_the_android_asset_links_file(): void
    {
        config([
            'deep_links.android.package_name' => 'com.lstsocial.com',
            'deep_links.android.sha256_fingerprints' => ['AA:BB:CC'],
        ]);

        $this->get('/.well-known/assetlinks.json')
            ->assertOk()
            ->assertHeader('content-type', 'application/json')
            ->assertJsonPath('0.target.package_name', 'com.lstsocial.com')
            ->assertJsonPath('0.target.sha256_cert_fingerprints.0', 'AA:BB:CC');
    }
}
