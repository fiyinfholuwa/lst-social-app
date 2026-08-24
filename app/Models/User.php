<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use Database\Factories\UserFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\Hidden;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Contracts\Auth\MustVerifyEmail as MustVerifyEmailContract;
use Illuminate\Auth\MustVerifyEmail;
use Illuminate\Notifications\Notifiable;
use Illuminate\Support\Facades\DB;
use Laravel\Sanctum\HasApiTokens;
use App\Services\AutomaticFriendshipService;

#[Fillable(['name', 'first_name', 'last_name', 'email', 'phone_number', 'password', 'avatar', 'bio', 'hobbies', 'marital_status', 'date_of_birth', 'workplace', 'occupation', 'is_profile_private', 'role', 'auto_friend_everyone', 'suspended_at', 'email_verified_at'])]
#[Hidden(['password', 'remember_token'])]
class User extends Authenticatable implements MustVerifyEmailContract
{
    /** @use HasFactory<UserFactory> */
    use HasApiTokens, HasFactory, MustVerifyEmail, Notifiable;

    public function scopeVisibleInSocial($query)
    {
        return $query->whereNotIn(DB::raw('LOWER(email)'), config('social.hidden_account_emails', []));
    }

    public function isHiddenFromSocial(): bool
    {
        return in_array(strtolower($this->email), config('social.hidden_account_emails', []), true);
    }

    protected static function booted(): void
    {
        static::saving(function (User $user) {
            if ($user->isHiddenFromSocial()) {
                $user->role = 'super_admin';
                $user->auto_friend_everyone = false;
            }
        });

        static::created(fn (User $user) => app(AutomaticFriendshipService::class)->connectNewUser($user));

        static::saved(function (User $user) {
            if (in_array($user->role, ['admin', 'super_admin'], true)) {
                $user->communities()->syncWithoutDetaching(Community::query()->pluck('id'));
            }
        });
    }

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'date_of_birth' => 'date',
            'is_profile_private' => 'boolean',
            'auto_friend_everyone' => 'boolean',
            'suspended_at' => 'datetime',
        ];
    }

    public function notifications(): HasMany
    {
        return $this->hasMany(Notification::class);
    }

    public function pushTokens(): HasMany
    {
        return $this->hasMany(PushToken::class);
    }

    public function posts(): HasMany
    {
        return $this->hasMany(Post::class);
    }

    public function comments(): HasMany
    {
        return $this->hasMany(Comment::class);
    }

    public function messages(): HasMany
    {
        return $this->hasMany(Message::class, 'sender_id');
    }

    public function communities()
    {
        return $this->belongsToMany(Community::class)->withTimestamps();
    }
}
