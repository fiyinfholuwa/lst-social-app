<?php

namespace App\Services;

use App\Models\Notification;
use App\Models\PushToken;
use App\Models\User;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class PushNotificationService
{
    public function send(User $user, Notification $notification): void
    {
        $tokens = $user->pushTokens()->pluck('token');
        if ($tokens->isEmpty()) {
            return;
        }

        $messages = $tokens->map(fn (string $token) => [
            'to' => $token,
            'sound' => 'default',
            'title' => $notification->title,
            'body' => $notification->message,
            'data' => array_filter([
                'notificationId' => (string) $notification->id,
                'screen' => $notification->screen,
                'routeParams' => $notification->route_params,
            ], fn ($value) => $value !== null),
        ])->values()->all();

        try {
            $response = Http::timeout(10)->acceptJson()->post(config('services.expo.push_url'), $messages);
            if ($response->failed()) {
                Log::warning('Expo push delivery failed.', ['status' => $response->status(), 'body' => $response->json()]);
                return;
            }

            collect($response->json('data', []))->each(function (array $receipt, int $index) use ($tokens) {
                if (($receipt['details']['error'] ?? null) === 'DeviceNotRegistered') {
                    PushToken::where('token', $tokens->values()->get($index))->delete();
                }
            });
        } catch (\Throwable $exception) {
            Log::warning('Expo push delivery could not be completed.', ['message' => $exception->getMessage()]);
        }
    }
}
