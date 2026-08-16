<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Sermon extends Model
{
    protected $fillable = ['sermon_category_id', 'title', 'description', 'speaker', 'url', 'is_published'];

    protected function casts(): array
    {
        return ['is_published' => 'boolean'];
    }

    public function category()
    {
        return $this->belongsTo(SermonCategory::class, 'sermon_category_id');
    }

    public function likes() { return $this->belongsToMany(User::class, 'sermon_likes')->withTimestamps(); }
    public function comments() { return $this->hasMany(SermonComment::class); }
}
