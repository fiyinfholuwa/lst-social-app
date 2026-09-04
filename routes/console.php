<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;
use App\Models\Status;
use App\Services\UploadService;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

Schedule::call(function () {
    Status::where('expires_at', '<=', now())->each(function (Status $status) {
        app(UploadService::class)->delete($status->image, 'statuses');
        $status->delete();
    });
})->hourly()->name('delete-expired-statuses')->withoutOverlapping();
