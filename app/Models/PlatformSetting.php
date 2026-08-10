<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Schema;

class PlatformSetting extends Model
{
    public $incrementing = false;
    protected $primaryKey = 'key';
    protected $keyType = 'string';
    protected $fillable = ['key', 'value'];

    public static function valueFor(string $key, mixed $fallback = null): mixed
    {
        if (! Schema::hasTable((new static)->getTable())) {
            return $fallback;
        }

        return Cache::remember("platform-setting:{$key}", 3600, fn () => static::query()->whereKey($key)->value('value')) ?? $fallback;
    }

    public static function put(string $key, ?string $value): void
    {
        static::query()->updateOrCreate(['key' => $key], ['value' => $value]);
        Cache::forget("platform-setting:{$key}");
    }
}
