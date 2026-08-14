<?php

namespace App\Providers;

use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        $key = fn (Request $request, string $bucket) => $bucket.':'.($request->user()?->id ?: $request->ip());
        RateLimiter::for('media-uploads', fn (Request $request) => Limit::perMinute(12)->by($key($request, 'media')));
        RateLimiter::for('social-writes', fn (Request $request) => Limit::perMinute(60)->by($key($request, 'social')));
        RateLimiter::for('social-interactions', fn (Request $request) => Limit::perMinute(120)->by($key($request, 'interaction')));
        RateLimiter::for('relationship-writes', fn (Request $request) => Limit::perMinute(40)->by($key($request, 'relationship')));
        RateLimiter::for('message-sends', fn (Request $request) => Limit::perMinute(90)->by($key($request, 'messages')));
    }
}
