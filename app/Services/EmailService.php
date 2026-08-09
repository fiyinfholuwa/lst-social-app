<?php

namespace App\Services;

use App\Models\User;
use App\Notifications\VerifyEmailOtp;
use App\Notifications\PasswordOtp;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Hash;

class EmailService
{
    public const VERIFICATION_CODE_TTL_MINUTES = 10;

    public function sendVerificationCode(User $user): void
    {
        $code = (string) random_int(100000, 999999);

        Cache::put(
            $this->verificationCacheKey($user),
            Hash::make($code),
            now()->addMinutes(self::VERIFICATION_CODE_TTL_MINUTES),
        );

        $user->notify(new VerifyEmailOtp($code, self::VERIFICATION_CODE_TTL_MINUTES));
    }

    public function verificationCodeIsValid(User $user, string $code): bool
    {
        $storedCode = Cache::get($this->verificationCacheKey($user));

        return $storedCode && Hash::check($code, $storedCode);
    }

    public function forgetVerificationCode(User $user): void
    {
        Cache::forget($this->verificationCacheKey($user));
    }

    public function sendPasswordCode(User $user, string $purpose): void
    {
        $code = (string) random_int(100000, 999999);
        Cache::put($this->passwordCacheKey($user, $purpose), Hash::make($code), now()->addMinutes(10));
        $user->notify(new PasswordOtp($code));
    }

    public function passwordCodeIsValid(User $user, string $purpose, string $code): bool
    {
        $storedCode = Cache::get($this->passwordCacheKey($user, $purpose));
        return $storedCode && Hash::check($code, $storedCode);
    }

    public function forgetPasswordCode(User $user, string $purpose): void
    {
        Cache::forget($this->passwordCacheKey($user, $purpose));
    }

    private function verificationCacheKey(User $user): string
    {
        return "email-verification-otp:{$user->id}";
    }

    private function passwordCacheKey(User $user, string $purpose): string
    {
        return "password-otp:{$purpose}:{$user->id}";
    }
}
