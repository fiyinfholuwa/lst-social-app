<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\LoginRequest;
use App\Http\Requests\Auth\RegisterRequest;
use App\Http\Resources\UserResource;
use App\Models\User;
use App\Services\AuthService;
use App\Services\AccountDeletionService;
use App\Services\EmailService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    public function __construct(
        private AuthService $authService,
        private EmailService $emailService,
        private AccountDeletionService $accountDeletion,
    ) {}

    public function register(RegisterRequest $request): JsonResponse
    {
        $result = $this->authService->register($request->validated());

        return response()->json([
            'user' => new UserResource($result['user']),
            'token' => $result['token'],
        ], 201);
    }

    public function checkEmail(Request $request): JsonResponse
    {
        $validator = Validator::make([
            'email' => strtolower(trim((string) $request->input('email'))),
        ], [
            'email' => ['required', 'string', 'email', 'max:255'],
        ]);

        $validated = $validator->validate();
        $available = ! \App\Models\User::whereRaw('LOWER(email) = ?', [$validated['email']])->exists();

        return response()->json([
            'available' => $available,
            'message' => $available ? 'Email is available.' : 'An account with this email already exists.',
        ]);
    }

    public function login(LoginRequest $request): JsonResponse
    {
        $result = $this->authService->login($request->validated());

        return response()->json([
            'user' => new UserResource($result['user']),
            'token' => $result['token'],
        ]);
    }

    public function logout(Request $request): JsonResponse
    {
        $this->authService->logout($request->user());

        return response()->json(['message' => 'Logged out.']);
    }

    public function me(Request $request): JsonResponse
    {
        return response()->json([
            'user' => new UserResource($request->user()->load('communities')),
        ]);
    }

    public function sendVerification(Request $request): JsonResponse
    {
        if ($request->user()->hasVerifiedEmail()) {
            return response()->json(['message' => 'Your email is already verified.']);
        }

        $this->emailService->sendVerificationCode($request->user());

        return response()->json(['message' => 'A six-digit verification code has been sent to your email.']);
    }

    public function verifyEmailOtp(Request $request): JsonResponse
    {
        if ($request->user()->hasVerifiedEmail()) {
            return response()->json(['message' => 'Your email is already verified.']);
        }

        $data = $request->validate(['code' => ['required', 'digits:6']]);
        if (! $this->emailService->verificationCodeIsValid($request->user(), $data['code'])) {
            return response()->json(['message' => 'The verification code is invalid or has expired.'], 422);
        }

        $request->user()->markEmailAsVerified();
        $this->emailService->forgetVerificationCode($request->user());

        return response()->json(['message' => 'Your email has been verified.']);
    }

    public function sendForgotPasswordOtp(Request $request): JsonResponse
    {
        $data = $request->validate(['email' => ['required', 'email', 'max:255']]);
        $user = User::whereRaw('LOWER(email) = ?', [strtolower(trim($data['email']))])->first();
        if ($user) $this->emailService->sendPasswordCode($user, 'forgot');

        return response()->json(['message' => 'If an account uses that email, a six-digit code has been sent.']);
    }

    public function resetForgottenPassword(Request $request): JsonResponse
    {
        $data = $request->validate([
            'email' => ['required', 'email', 'max:255'],
            'code' => ['required', 'digits:6'],
            'password' => ['required', 'string', 'min:8', 'confirmed'],
        ]);
        $user = User::whereRaw('LOWER(email) = ?', [strtolower(trim($data['email']))])->first();
        if (! $user || ! $this->emailService->passwordCodeIsValid($user, 'forgot', $data['code'])) {
            return response()->json(['message' => 'The password reset code is invalid or has expired.'], 422);
        }
        $user->forceFill(['password' => $data['password']])->save();
        $user->tokens()->delete();
        $this->emailService->forgetPasswordCode($user, 'forgot');

        return response()->json(['message' => 'Your password has been reset. Sign in with your new password.']);
    }

    public function sendChangePasswordOtp(Request $request): JsonResponse
    {
        $data = $request->validate(['current_password' => ['required', 'string']]);
        if (! Hash::check($data['current_password'], $request->user()->password)) {
            throw ValidationException::withMessages(['current_password' => 'The current password is incorrect.']);
        }
        $this->emailService->sendPasswordCode($request->user(), 'change');

        return response()->json(['message' => 'A six-digit code has been sent to your email.']);
    }

    public function changePassword(Request $request): JsonResponse
    {
        $data = $request->validate([
            'current_password' => ['required', 'string'],
            'code' => ['required', 'digits:6'],
            'password' => ['required', 'string', 'min:8', 'confirmed'],
        ]);
        $user = $request->user();
        if (! Hash::check($data['current_password'], $user->password)) {
            throw ValidationException::withMessages(['current_password' => 'The current password is incorrect.']);
        }
        if (! $this->emailService->passwordCodeIsValid($user, 'change', $data['code'])) {
            return response()->json(['message' => 'The password change code is invalid or has expired.'], 422);
        }
        $user->forceFill(['password' => $data['password']])->save();
        $accessToken = $user->currentAccessToken();
        $currentTokenId = $accessToken && method_exists($accessToken, 'getKey') ? $accessToken->getKey() : null;
        if ($currentTokenId) {
            $user->tokens()->whereKeyNot($currentTokenId)->delete();
        }
        $this->emailService->forgetPasswordCode($user, 'change');

        return response()->json(['message' => 'Your password has been changed.']);
    }

    public function destroy(Request $request): JsonResponse
    {
        $data = $request->validate(['password' => ['required', 'string']]);
        $user = $request->user();
        if (! Hash::check($data['password'], $user->password)) {
            throw ValidationException::withMessages(['password' => 'The password is incorrect.']);
        }
        $this->accountDeletion->delete($user);

        return response()->json(['message' => 'Your account has been permanently deleted.']);
    }
}
