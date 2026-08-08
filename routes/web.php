<?php

use App\Http\Controllers\AdminController;
use Illuminate\Support\Facades\Route;

Route::get('/', function () {
    return view('welcome');
});

Route::get('/admin/{section?}', [AdminController::class, 'index'])->name('admin.dashboard');
Route::patch('/admin/members/{user}', [AdminController::class, 'updateMember'])->name('admin.members.update');
Route::delete('/admin/members/{user}', [AdminController::class, 'destroyMember'])->name('admin.members.destroy');
Route::post('/admin/communities', [AdminController::class, 'storeCommunity'])->name('admin.communities.store');
Route::patch('/admin/communities/{community}', [AdminController::class, 'updateCommunity'])->name('admin.communities.update');
Route::delete('/admin/communities/{community}', [AdminController::class, 'destroyCommunity'])->name('admin.communities.destroy');
Route::post('/admin/community-applications/{application}', [AdminController::class, 'reviewApplication'])->name('admin.applications.review');
