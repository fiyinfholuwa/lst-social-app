<?php

use App\Http\Controllers\AdminController;
use Illuminate\Support\Facades\Route;
use App\Models\User;

Route::get('/', function () {
    return view('welcome');
});

Route::view('/privacy-policy', 'legal', ['document' => 'privacy'])->name('privacy');
Route::view('/terms-and-conditions', 'legal', ['document' => 'terms'])->name('terms');

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
    Route::get('/admin/members/{user}', [AdminController::class, 'showMember'])->name('admin.members.show');
    Route::patch('/admin/members/{user}', [AdminController::class, 'updateMember'])->name('admin.members.update');
    Route::patch('/admin/members/{user}/details', [AdminController::class, 'updateMemberDetails'])->name('admin.members.details');
    Route::patch('/admin/members/{user}/suspension', [AdminController::class, 'updateMemberSuspension'])->name('admin.members.suspension');
    Route::patch('/admin/members/{user}/password', [AdminController::class, 'updateMemberPassword'])->name('admin.members.password');
    Route::delete('/admin/members/{user}', [AdminController::class, 'destroyMember'])->name('admin.members.destroy');
    Route::post('/admin/communities', [AdminController::class, 'storeCommunity'])->name('admin.communities.store');
    Route::get('/admin/communities/{community}/applications', [AdminController::class, 'communityApplications'])->name('admin.communities.applications');
    Route::patch('/admin/communities/{community}', [AdminController::class, 'updateCommunity'])->name('admin.communities.update');
    Route::delete('/admin/communities/{community}', [AdminController::class, 'destroyCommunity'])->name('admin.communities.destroy');
    Route::post('/admin/community-applications/{application}', [AdminController::class, 'reviewApplication'])->name('admin.applications.review');
    Route::get('/admin/posts/{post}', [AdminController::class, 'showPost'])->name('admin.posts.show');
    Route::post('/admin/posts/{post}/review', [AdminController::class, 'reviewPost'])->name('admin.posts.review');
    Route::get('/admin/quizzes/create', [AdminController::class, 'createQuiz'])->name('admin.quizzes.create');
    Route::get('/admin/quizzes/{quiz}/edit', [AdminController::class, 'editQuiz'])->name('admin.quizzes.edit');
    Route::post('/admin/quizzes', [AdminController::class, 'storeQuiz'])->name('admin.quizzes.store');
    Route::patch('/admin/quizzes/{quiz}', [AdminController::class, 'updateQuiz'])->name('admin.quizzes.update');
    Route::delete('/admin/quizzes/{quiz}', [AdminController::class, 'destroyQuiz'])->name('admin.quizzes.destroy');
    Route::get('/admin/articles/create', [AdminController::class, 'createArticle'])->name('admin.articles.create');
    Route::get('/admin/articles/{article}/edit', [AdminController::class, 'editArticle'])->name('admin.articles.edit');
    Route::post('/admin/articles', [AdminController::class, 'storeArticle'])->name('admin.articles.store');
    Route::patch('/admin/articles/{article}', [AdminController::class, 'updateArticle'])->name('admin.articles.update');
    Route::delete('/admin/articles/{article}', [AdminController::class, 'destroyArticle'])->name('admin.articles.destroy');
    Route::patch('/admin/support-requests/{supportRequest}', [AdminController::class, 'updateSupportRequest'])->name('admin.support.update');
    Route::patch('/admin/settings/profile', [AdminController::class, 'updateAdminProfile'])->name('admin.settings.profile');
    Route::patch('/admin/settings/password', [AdminController::class, 'updateAdminPassword'])->name('admin.settings.password');
    Route::patch('/admin/settings/branding', [AdminController::class, 'updateBranding'])->name('admin.settings.branding');
});
