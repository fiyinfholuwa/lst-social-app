<?php

namespace App\Jobs;

use App\Models\Sermon;
use App\Models\User;
use App\Repositories\NotificationRepository;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;

class BroadcastSermonUpdateJob implements ShouldQueue
{
    use Queueable;

    public int $tries = 3;

    public function __construct(public int $sermonId) {}

    public function handle(NotificationRepository $notifications): void
    {
        $sermon = Sermon::query()->find($this->sermonId);
        if (! $sermon?->is_published) {
            return;
        }

        User::query()->select('id')->chunkById(500, function ($users) use ($notifications, $sermon) {
            foreach ($users as $user) {
                $notifications->createFor($user, [
                    'icon' => 'book',
                    'title' => 'Sermon updated',
                    'message' => '“'.$sermon->title.'” is ready to watch.',
                    'screen' => 'SermonDetail',
                    'route_params' => ['sermonId' => (string) $sermon->id],
                ]);
            }
        });
    }
}
