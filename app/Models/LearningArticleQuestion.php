<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class LearningArticleQuestion extends Model
{
    protected $fillable = ['learning_article_id', 'question', 'position'];
    public function answers() { return $this->hasMany(LearningArticleAnswer::class)->orderBy('position'); }
}
