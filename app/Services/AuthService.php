<?php

namespace App\Services;

use App\Jobs\SendWelcomeNotificationJob;
use App\Models\User;
use App\Repositories\UserRepository;
use Illuminate\Auth\AuthenticationException;
use Illuminate\Support\Facades\Hash;

class AuthService
{
    public function __construct(
        private UserRepository $users,
    ) {}

    public function register(array $data): array
    {
        $user = $this->users->create([
            'first_name' => trim($data['first_name']),
            'last_name' => trim($data['last_name']),
            'name' => trim($data['first_name'].' '.$data['last_name']),
            'email' => $data['email'],
            'email_verified_at' => now(),
            'password' => Hash::make($data['password']),
        ]);

        SendWelcomeNotificationJob::dispatchSync($user);

        return [
            'user' => $user,
            'token' => $user->createToken('mobile', ['*'], expiresAt: null)->plainTextToken,
        ];
    }

    public function login(array $credentials): array
    {
        $user = $this->users->findByEmail($credentials['email']);

        if (! $user || ! Hash::check($credentials['password'], $user->password)) {
            throw new AuthenticationException('These credentials do not match our records.');
        }

        if ($user->suspended_at) {
            throw new AuthenticationException('This account has been suspended. Please contact support.');
        }

        return [
            'user' => $user,
            'token' => $user->createToken('mobile', ['*'], expiresAt: null)->plainTextToken,
        ];
    }

    public function logout(User $user): void
    {
        $user->currentAccessToken()->delete();
    }
}
