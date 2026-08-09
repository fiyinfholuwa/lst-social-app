<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Post extends Model
{
    protected $fillable = ['user_id', 'community_id', 'original_post_id', 'content', 'image', 'images', 'type', 'audience', 'status'];

    protected function casts(): array
    {
        return ['images' => 'array'];
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function community()
    {
        return $this->belongsTo(Community::class);
    }

    public function originalPost()
    {
        return $this->belongsTo(self::class, 'original_post_id');
    }

    public function shares()
    {
        return $this->hasMany(self::class, 'original_post_id');
    }

    public function comments()
    {
        return $this->hasMany(Comment::class)->withCount('likes');
    }

    public function likes()
    {
        return $this->belongsToMany(User::class, 'post_likes');
    }
}
