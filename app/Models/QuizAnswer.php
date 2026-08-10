<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class QuizAnswer extends Model
{
    protected $fillable = ['quiz_question_id', 'answer', 'is_correct', 'position'];

    protected function casts(): array
    {
        return ['is_correct' => 'boolean'];
    }
}
