<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\PushToken;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class PushTokenController extends Controller
{
    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'token' => ['required', 'string', 'max:255', 'regex:/^ExponentPushToken\[[A-Za-z0-9_-]+\]$|^ExpoPushToken\[[A-Za-z0-9_-]+\]$/'],
            'platform' => ['nullable', 'in:ios,android'],
            'device_name' => ['nullable', 'string', 'max:255'],
        ]);

        PushToken::updateOrCreate(['token' => $data['token']], [
            'user_id' => $request->user()->id,
            'platform' => $data['platform'] ?? null,
            'device_name' => $data['device_name'] ?? null,
            'last_used_at' => now(),
        ]);

        return response()->json(['message' => 'Push notifications enabled.']);
    }

    public function destroy(Request $request): JsonResponse
    {
        $data = $request->validate(['token' => ['required', 'string', 'max:255']]);
        $request->user()->pushTokens()->where('token', $data['token'])->delete();

        return response()->json(['message' => 'Push notifications disabled.']);
    }
}
