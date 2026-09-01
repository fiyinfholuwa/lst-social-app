<?php

namespace App\Jobs;

use App\Models\User;
use App\Repositories\NotificationRepository;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;

class BroadcastAdminNotificationJob implements ShouldQueue
{
    use Queueable;

    public int $tries = 3;

    public function __construct(
        public string $title,
        public string $message,
        public string $audience = 'all',
    ) {}

    public function handle(NotificationRepository $notifications): void
    {
        User::query()
            ->select('id')
            ->when($this->audience === 'verified', fn ($query) => $query->whereNotNull('email_verified_at'))
            ->whereNull('suspended_at')
            ->chunkById(500, function ($users) use ($notifications) {
                foreach ($users as $user) {
                    $notifications->createFor($user, [
                        'icon' => 'notifications-outline',
                        'title' => $this->title,
                        'message' => $this->message,
                    ]);
                }
            });
    }
}
