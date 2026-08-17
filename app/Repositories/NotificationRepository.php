<?php

namespace App\Repositories;

use App\Models\Notification;
use App\Models\User;
use App\Services\CacheService;
use App\Jobs\SendPushNotificationJob;

class NotificationRepository
{
    public function __construct(private CacheService $cache) {}

    public function createFor(User $user, array $data): Notification
    {
        $notification = $user->notifications()->create($data);
        $this->cache->invalidate("notifications:{$user->id}");
        // Push delivery must not depend on a separately managed queue worker.
        // The push service catches provider/network failures, so notification
        // creation remains successful even when Expo is temporarily unavailable.
        SendPushNotificationJob::dispatchSync($notification);

        return $notification;
    }
}
