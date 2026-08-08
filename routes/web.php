<?php

use App\Http\Controllers\AdminController;
use Illuminate\Support\Facades\Route;

Route::get('/', function () {
    return view('welcome');
});

Route::get('/admin/{section?}', [AdminController::class, 'index'])->name('admin.dashboard');
Route::patch('/admin/members/{user}', [AdminController::class, 'updateMember'])->name('admin.members.update');
Route::delete('/admin/members/{user}', [AdminController::class, 'destroyMember'])->name('admin.members.destroy');
Route::get('/admin/communities/{community}/applications', [AdminController::class, 'communityApplications'])->name('admin.communities.applications');
Route::patch('/admin/communities/{community}', [AdminController::class, 'updateCommunity'])->name('admin.communities.update');
Route::post('/admin/community-applications/{application}', [AdminController::class, 'reviewApplication'])->name('admin.applications.review');
Route::post('/admin/posts/{post}/review', [AdminController::class, 'reviewPost'])->name('admin.posts.review');
