<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Status extends Model
{
    protected $fillable = ['user_id', 'type', 'text', 'image', 'expires_at'];
    protected function casts(): array { return ['expires_at' => 'datetime']; }
    public function user() { return $this->belongsTo(User::class); }
    public function views() { return $this->hasMany(StatusView::class); }
}
