<?php

namespace App\Repositories;

use App\Models\Notification;
use App\Models\User;

class NotificationRepository
{
    public function createFor(User $user, array $data): Notification
    {
        return $user->notifications()->create($data);
    }
}
