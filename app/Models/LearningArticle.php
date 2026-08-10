<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class LearningArticle extends Model
{
    protected $fillable = ['community_id', 'title', 'content', 'position', 'duration_minutes', 'passing_score', 'status'];

    public function community() { return $this->belongsTo(Community::class); }
    public function questions() { return $this->hasMany(LearningArticleQuestion::class)->orderBy('position'); }
}
