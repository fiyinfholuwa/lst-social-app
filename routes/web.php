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

Route::get('/admin/login', [AdminController::class, 'loginForm'])->name('login');
Route::post('/admin/login', [AdminController::class, 'login'])->middleware('throttle:6,1')->name('admin.login');

Route::middleware(['auth', 'admin'])->group(function () {
    Route::post('/admin/logout', [AdminController::class, 'logout'])->name('admin.logout');
    Route::get('/admin/{section?}', [AdminController::class, 'index'])->name('admin.dashboard');
    Route::post('/admin/members', [AdminController::class, 'storeMember'])->name('admin.members.store');
    Route::patch('/admin/members/{user}', [AdminController::class, 'updateMember'])->name('admin.members.update');
    Route::delete('/admin/members/{user}', [AdminController::class, 'destroyMember'])->name('admin.members.destroy');
    Route::post('/admin/communities', [AdminController::class, 'storeCommunity'])->name('admin.communities.store');
    Route::get('/admin/communities/{community}/applications', [AdminController::class, 'communityApplications'])->name('admin.communities.applications');
    Route::patch('/admin/communities/{community}', [AdminController::class, 'updateCommunity'])->name('admin.communities.update');
    Route::delete('/admin/communities/{community}', [AdminController::class, 'destroyCommunity'])->name('admin.communities.destroy');
    Route::post('/admin/community-applications/{application}', [AdminController::class, 'reviewApplication'])->name('admin.applications.review');
    Route::post('/admin/posts/{post}/review', [AdminController::class, 'reviewPost'])->name('admin.posts.review');
    Route::post('/admin/quizzes', [AdminController::class, 'storeQuiz'])->name('admin.quizzes.store');
    Route::patch('/admin/quizzes/{quiz}', [AdminController::class, 'updateQuiz'])->name('admin.quizzes.update');
    Route::delete('/admin/quizzes/{quiz}', [AdminController::class, 'destroyQuiz'])->name('admin.quizzes.destroy');
    Route::patch('/admin/support-requests/{supportRequest}', [AdminController::class, 'updateSupportRequest'])->name('admin.support.update');
    Route::patch('/admin/settings/profile', [AdminController::class, 'updateAdminProfile'])->name('admin.settings.profile');
    Route::patch('/admin/settings/password', [AdminController::class, 'updateAdminPassword'])->name('admin.settings.password');
});
