<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable(['user_id', 'icon', 'title', 'message', 'screen', 'route_params'])]
class Notification extends Model
{
    protected function casts(): array
    {
        return [
            'read_at' => 'datetime',
            'route_params' => 'array',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
