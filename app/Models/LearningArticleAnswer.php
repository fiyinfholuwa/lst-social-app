<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class LearningArticleAnswer extends Model
{
    protected $fillable = ['learning_article_question_id', 'answer', 'is_correct', 'position'];
    protected function casts(): array { return ['is_correct' => 'boolean']; }
}
