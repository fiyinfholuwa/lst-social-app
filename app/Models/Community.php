<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Community extends Model
{
    protected $fillable = ['name', 'description', 'rules', 'image', 'admin_id'];

    protected static function booted(): void
    {
        static::created(function (Community $community) {
            $adminIds = User::query()->whereIn('role', ['admin', 'super_admin'])->pluck('id');
            $community->members()->syncWithoutDetaching($adminIds);
        });
    }

    public function admin()
    {
        return $this->belongsTo(User::class, 'admin_id');
    }

    public function members()
    {
        return $this->belongsToMany(User::class)->withTimestamps();
    }

    public function posts()
    {
        return $this->hasMany(Post::class);
    }

    public function applications()
    {
        return $this->hasMany(CommunityApplication::class);
    }

    public function quizzes()
    {
        return $this->hasMany(Quiz::class);
    }

    public function learningArticles()
    {
        return $this->hasMany(LearningArticle::class);
    }
}
