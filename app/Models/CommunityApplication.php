<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class CommunityApplication extends Model
{
    protected $fillable = ['community_id', 'user_id', 'answers', 'status'];

    protected function casts(): array
    {
        return ['answers' => 'array'];
    }

    public function community()
    {
        return $this->belongsTo(Community::class);
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
