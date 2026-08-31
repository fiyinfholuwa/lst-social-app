<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\PlatformSetting;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AppVersionController extends Controller
{
    public function __invoke(Request $request): JsonResponse
    {
        $data = $request->validate(['platform' => ['required', 'in:android,ios']]);
        $platform = $data['platform'];

        return response()->json([
            'latestVersion' => PlatformSetting::valueFor("{$platform}_latest_version", '1.1.0'),
            'minimumVersion' => PlatformSetting::valueFor("{$platform}_minimum_version", '1.0.0'),
            'storeUrl' => PlatformSetting::valueFor("{$platform}_app_url", config("branding.{$platform}_app_url")),
            'message' => PlatformSetting::valueFor('app_update_message', 'A new version of LST Social is available with improvements and important fixes.'),
        ]);
    }
}
