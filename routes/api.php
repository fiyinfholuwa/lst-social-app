<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\ConnectionController;
use App\Http\Controllers\Api\SocialController;
use Illuminate\Support\Facades\Route;

Route::middleware('throttle:6,1')->group(function () {
    Route::post('/register', [AuthController::class, 'register']);
    Route::post('/login', [AuthController::class, 'login']);
});

Route::middleware('auth:sanctum')->group(function () {
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/user', [AuthController::class, 'me']);
    Route::patch('/user', [SocialController::class, 'updateProfile']);
    Route::get('/users/{user}', [SocialController::class, 'user']);
    Route::get('/posts', [SocialController::class, 'posts']);
    Route::post('/posts', [SocialController::class, 'createPost']);
    Route::get('/posts/{post}', [SocialController::class, 'post']);
    Route::post('/posts/{post}/like', [SocialController::class, 'like']);
    Route::post('/posts/{post}/comments', [SocialController::class, 'comment']);
    Route::get('/saved-posts', [SocialController::class, 'saved']);
    Route::post('/posts/{post}/save', [SocialController::class, 'toggleSaved']);
    Route::get('/communities', [SocialController::class, 'communities']);
    Route::get('/communities/{community}', [SocialController::class, 'community']);
    Route::get('/communities/{community}/members', [SocialController::class, 'members']);
    Route::post('/communities/{community}/join', [SocialController::class, 'join']);
    Route::get('/community-applications', [SocialController::class, 'applications']);
    Route::post('/communities/{community}/applications', [SocialController::class, 'apply']);
    Route::delete('/communities/{community}/applications', [SocialController::class, 'withdraw']);
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
});
