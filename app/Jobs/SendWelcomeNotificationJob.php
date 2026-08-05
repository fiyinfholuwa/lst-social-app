<?php

namespace App\Jobs;

use App\Models\User;
use App\Repositories\NotificationRepository;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;

class SendWelcomeNotificationJob implements ShouldQueue
{
    use Queueable;

    public function __construct(
        public User $user,
    ) {}

    public function handle(NotificationRepository $notifications): void
    {
        $notifications->createFor($this->user, [
            'icon' => 'heart',
            'title' => 'Welcome to LST Social',
            'message' => 'Your faith community is ready. Share an encouragement or connect with others.',
        ]);
    }
}
