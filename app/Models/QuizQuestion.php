<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class QuizQuestion extends Model
{
    protected $fillable = ['quiz_id', 'question', 'explanation', 'position'];

    public function answers()
    {
        return $this->hasMany(QuizAnswer::class)->orderBy('position');
    }
}
