<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class SermonComment extends Model
{
    protected $fillable = ['sermon_id', 'user_id', 'text'];
    public function user() { return $this->belongsTo(User::class); }
    public function sermon() { return $this->belongsTo(Sermon::class); }
}
