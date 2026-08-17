<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class SermonComment extends Model
{
    protected $fillable = ['sermon_id', 'user_id', 'parent_id', 'text'];
    public function user() { return $this->belongsTo(User::class); }
    public function sermon() { return $this->belongsTo(Sermon::class); }
    public function parent() { return $this->belongsTo(self::class, 'parent_id'); }
    public function replies() { return $this->hasMany(self::class, 'parent_id'); }
    public function likes() { return $this->belongsToMany(User::class, 'sermon_comment_likes')->withTimestamps(); }
}
