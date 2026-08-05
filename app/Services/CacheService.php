<?php

namespace App\Services;

use Closure;
use Illuminate\Support\Facades\Cache;

class CacheService
{
    public const SHORT = 6000;

    public const MEDIUM = 30000;

    public const LONG = 90000;

    public function remember(string $scope, string $key, int $seconds, Closure $loader): mixed
    {
        $version = Cache::get($this->versionKey($scope), 1);

        return Cache::remember("lst:{$scope}:v{$version}:{$key}", $seconds, $loader);
    }

    public function invalidate(string ...$scopes): void
    {
        foreach (array_unique($scopes) as $scope) {
            $key = $this->versionKey($scope);
            Cache::forever($key, ((int) Cache::get($key, 1)) + 1);
        }
    }

    private function versionKey(string $scope): string
    {
        return "lst:cache-version:{$scope}";
    }
}
