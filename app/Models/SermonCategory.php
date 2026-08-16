<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class SermonCategory extends Model
{
    protected $fillable = ['name', 'position'];

    public function sermons()
    {
        return $this->hasMany(Sermon::class);
    }
}
