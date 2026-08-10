<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Quiz extends Model
{
    protected $fillable = ['community_id', 'post_id', 'title', 'instructions', 'duration_minutes', 'passing_score', 'max_attempts', 'randomize_questions', 'show_answers', 'status'];

    protected function casts(): array
    {
        return ['randomize_questions' => 'boolean', 'show_answers' => 'boolean'];
    }

    public function community()
    {
        return $this->belongsTo(Community::class);
    }

    public function questions()
    {
        return $this->hasMany(QuizQuestion::class)->orderBy('position');
    }
}
