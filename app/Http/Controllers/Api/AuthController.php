<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\LoginRequest;
use App\Http\Requests\Auth\RegisterRequest;
use App\Http\Resources\UserResource;
use App\Services\AuthService;
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

    public function destroy(Request $request): JsonResponse
    {
        $data = $request->validate(['password' => ['required', 'string']]);
        $user = $request->user();
        if (! Hash::check($data['password'], $user->password)) {
            throw ValidationException::withMessages(['password' => 'The password is incorrect.']);
        }
        $user->tokens()->delete();
        $user->delete();

        return response()->json(['message' => 'Your account has been permanently deleted.']);
    }
}
