<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\ConnectionController;
use App\Http\Controllers\Api\SocialController;
use App\Models\Comment;
use Illuminate\Support\Facades\Route;

Route::middleware('throttle:6,1')->group(function () {
    Route::post('/register', [AuthController::class, 'register']);
    Route::post('/register/check-email', [AuthController::class, 'checkEmail']);
    Route::post('/login', [AuthController::class, 'login']);
    Route::post('/forgot-password/otp', [AuthController::class, 'sendForgotPasswordOtp']);
    Route::post('/forgot-password/reset', [AuthController::class, 'resetForgottenPassword']);
});

Route::middleware('auth:sanctum')->group(function () {
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/user', [AuthController::class, 'me']);
    Route::post('/email/verification-notification', [AuthController::class, 'sendVerification'])->middleware('throttle:3,1');
    Route::post('/email/verify-otp', [AuthController::class, 'verifyEmailOtp'])->middleware('throttle:6,1');
    Route::delete('/user', [AuthController::class, 'destroy'])->middleware('throttle:3,1');
    Route::post('/user/password/otp', [AuthController::class, 'sendChangePasswordOtp'])->middleware('throttle:3,1');
    Route::patch('/user/password', [AuthController::class, 'changePassword'])->middleware('throttle:6,1');
    Route::patch('/user', [SocialController::class, 'updateProfile']);
    Route::get('/users/search', [ConnectionController::class, 'searchUsers']);
    Route::get('/users/{user}', [SocialController::class, 'user']);
    Route::get('/posts', [SocialController::class, 'posts']);
    Route::post('/posts', [SocialController::class, 'createPost']);
    Route::patch('/posts/{post}', [SocialController::class, 'updatePost']);
    Route::delete('/posts/{post}', [SocialController::class, 'deletePost']);
    Route::get('/posts/{post}', [SocialController::class, 'post']);
    Route::post('/posts/{post}/like', [SocialController::class, 'like']);
    Route::post('/posts/{post}/comments', [SocialController::class, 'comment']);
    Route::get('/posts/{post}/comments', [SocialController::class, 'comments']);
    Route::get('/posts/{post}/comments/{comment}/replies', [SocialController::class, 'replies']);
    Route::post('/comments/{comment}/like', [SocialController::class, 'likeComment']);
    Route::patch('/comments/{comment}', [SocialController::class, 'updateComment']);
    Route::delete('/comments/{comment}', [SocialController::class, 'deleteComment']);
    Route::get('/saved-posts', [SocialController::class, 'saved']);
    Route::post('/posts/{post}/save', [SocialController::class, 'toggleSaved']);
    Route::get('/communities', [SocialController::class, 'communities']);
    Route::get('/communities/{community}', [SocialController::class, 'community']);
    Route::get('/communities/{community}/posts', [SocialController::class, 'communityPosts']);
    Route::get('/communities/{community}/members', [SocialController::class, 'members']);
    Route::get('/communities/{community}/member-directory', [SocialController::class, 'memberDirectory']);
    Route::post('/communities/{community}/join', [SocialController::class, 'join']);
    Route::delete('/communities/{community}/leave', [SocialController::class, 'leave']);
    Route::post('/communities/{community}/posts', [SocialController::class, 'createCommunityPost']);
    Route::get('/community-applications', [SocialController::class, 'applications']);
    Route::post('/communities/{community}/applications', [SocialController::class, 'apply']);
    Route::delete('/communities/{community}/applications', [SocialController::class, 'withdraw']);
    Route::get('/communities/{community}/moderation', [SocialController::class, 'moderationQueue']);
    Route::post('/communities/{community}/moderation/applications/{application}', [SocialController::class, 'reviewCommunityApplication']);
    Route::post('/communities/{community}/moderation/posts/{post}', [SocialController::class, 'reviewCommunityPost']);
    Route::get('/friendships', [ConnectionController::class, 'friendships']);
    Route::post('/users/{user}/friend-request', [ConnectionController::class, 'request']);
    Route::post('/users/{user}/relationship', [ConnectionController::class, 'act']);
    Route::get('/chats', [ConnectionController::class, 'chats']);
    Route::post('/chats/with/{user}', [ConnectionController::class, 'createChat']);
    Route::get('/chats/{chat}', [ConnectionController::class, 'chat']);
    Route::get('/chats/{chat}/messages', [ConnectionController::class, 'messages']);
    Route::post('/chats/{chat}/messages', [ConnectionController::class, 'send']);
    Route::get('/notifications', [SocialController::class, 'notifications']);
    Route::post('/notifications/read-all', [SocialController::class, 'readAll']);
    Route::post('/notifications/{notification}/read', [SocialController::class, 'readNotification']);
    Route::post('/support-requests', [SocialController::class, 'submitSupportRequest'])->middleware('throttle:10,1');
});
