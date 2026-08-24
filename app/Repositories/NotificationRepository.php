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
        SendPushNotificationJob::dispatch($notification);

        return $notification;
    }
}
