<?php

use App\Http\Controllers\AdminController;
use Illuminate\Support\Facades\Route;
use App\Models\User;

Route::get('/', function () {
    return view('welcome');
});

Route::get('/email/verify/{id}/{hash}', function ($id, $hash) {
    $user = User::findOrFail($id);
    abort_unless(hash_equals((string) $hash, sha1($user->getEmailForVerification())), 403);
    $user->markEmailAsVerified();

    return response('<h1>Email verified</h1><p>You can return to the LST Social app.</p>');
})->middleware('signed')->name('verification.verify');

Route::get('/admin/{section?}', [AdminController::class, 'index'])->name('admin.dashboard');
Route::patch('/admin/members/{user}', [AdminController::class, 'updateMember'])->name('admin.members.update');
Route::delete('/admin/members/{user}', [AdminController::class, 'destroyMember'])->name('admin.members.destroy');
Route::get('/admin/communities/{community}/applications', [AdminController::class, 'communityApplications'])->name('admin.communities.applications');
Route::patch('/admin/communities/{community}', [AdminController::class, 'updateCommunity'])->name('admin.communities.update');
Route::post('/admin/community-applications/{application}', [AdminController::class, 'reviewApplication'])->name('admin.applications.review');
Route::post('/admin/posts/{post}/review', [AdminController::class, 'reviewPost'])->name('admin.posts.review');
