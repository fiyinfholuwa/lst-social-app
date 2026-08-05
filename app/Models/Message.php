<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Message extends Model
{
    protected $fillable = ['chat_id', 'sender_id', 'type', 'text', 'audio_uri', 'duration'];

    public function sender()
    {
        return $this->belongsTo(User::class, 'sender_id');
    }
}
