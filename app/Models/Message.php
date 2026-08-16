<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Message extends Model
{
    protected $fillable = ['chat_id', 'sender_id', 'type', 'text', 'audio_uri', 'duration', 'read_at', 'edited_at'];

    protected function casts(): array
    {
        return ['read_at' => 'datetime', 'edited_at' => 'datetime'];
    }

    public function chat()
    {
        return $this->belongsTo(Chat::class);
    }

    public function sender()
    {
        return $this->belongsTo(User::class, 'sender_id');
    }

    public function reactions()
    {
        return $this->hasMany(MessageReaction::class);
    }

    public function deletions()
    {
        return $this->hasMany(MessageDeletion::class);
    }

}
