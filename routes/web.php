<?php

use App\Http\Controllers\AdminController;
use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\Artisan;
use App\Models\User;
use App\Models\Post;

Route::get('/', function () {
    return view('welcome');
});

Route::view('/privacy-policy', 'legal', ['document' => 'privacy'])->name('privacy');
Route::view('/terms-and-conditions', 'legal', ['document' => 'terms'])->name('terms');
Route::view('/delete-account', 'delete-account')->name('account-deletion');
Route::view('/child-safety-standards', 'child-safety-standards')->name('child-safety-standards');

Route::get('/system/run-queue', function () {
    abort_unless(config('queue.web_runner_enabled'), 404);

    $exitCode = Artisan::call('queue:work', [
        '--stop-when-empty' => true,
        '--max-jobs' => 50,
        '--max-time' => 50,
        '--tries' => 3,
        '--no-interaction' => true,
    ]);

    return response()->json([
        'success' => $exitCode === 0,
        'exitCode' => $exitCode,
        'message' => $exitCode === 0 ? 'The queued jobs were processed.' : 'The queue worker exited with an error.',
    ], $exitCode === 0 ? 200 : 500);
})->middleware('throttle:1,1')->name('system.queue.run');

Route::get('/.well-known/apple-app-site-association', function () {
    $teamId = config('deep_links.apple.team_id');
    $bundleId = config('deep_links.apple.bundle_id');

    return response()->json([
        'applinks' => [
            'apps' => [],
            'details' => $teamId ? [[
                'appID' => "{$teamId}.{$bundleId}",
                'components' => [[
                    '/' => '/posts/*',
                    'comment' => 'Open shared LST Social posts in the app',
                ]],
            ]] : [],
        ],
    ], options: JSON_UNESCAPED_SLASHES)->header('Content-Type', 'application/json');
})->name('deep-links.apple');

Route::get('/.well-known/assetlinks.json', function () {
    $fingerprints = config('deep_links.android.sha256_fingerprints');

    return response()->json($fingerprints ? [[
        'relation' => ['delegate_permission/common.handle_all_urls'],
        'target' => [
            'namespace' => 'android_app',
            'package_name' => config('deep_links.android.package_name'),
            'sha256_cert_fingerprints' => $fingerprints,
        ],
    ]] : [], options: JSON_UNESCAPED_SLASHES)->header('Content-Type', 'application/json');
})->name('deep-links.android');

Route::get('/posts/{postToken}', function (string $postToken) {
    $post = Post::where('public_id', $postToken)
        ->when(ctype_digit($postToken), fn ($query) => $query->orWhere('id', (int) $postToken))
        ->first();

    return response()->view('post-link', [
        'available' => (bool) $post,
        'postToken' => $post?->public_id ?: $postToken,
    ], $post ? 200 : 404);
})->where('postToken', '[A-Za-z0-9]+')->name('posts.link');

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
    Route::get('/admin/moderation/reports/history', [AdminController::class, 'contentReportHistory'])->name('admin.reports.history');
    Route::post('/admin/members', [AdminController::class, 'storeMember'])->name('admin.members.store');
    Route::get('/admin/members/{user}', [AdminController::class, 'showMember'])->name('admin.members.show');
    Route::patch('/admin/members/{user}', [AdminController::class, 'updateMember'])->name('admin.members.update');
    Route::patch('/admin/members/{user}/details', [AdminController::class, 'updateMemberDetails'])->name('admin.members.details');
    Route::patch('/admin/members/{user}/suspension', [AdminController::class, 'updateMemberSuspension'])->name('admin.members.suspension');
    Route::patch('/admin/members/{user}/verification', [AdminController::class, 'updateMemberVerification'])->name('admin.members.verification');
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
    Route::post('/admin/sermon-categories', [AdminController::class, 'storeSermonCategory'])->name('admin.sermon-categories.store');
    Route::patch('/admin/sermon-categories/{sermonCategory}', [AdminController::class, 'updateSermonCategory'])->name('admin.sermon-categories.update');
    Route::delete('/admin/sermon-categories/{sermonCategory}', [AdminController::class, 'destroySermonCategory'])->name('admin.sermon-categories.destroy');
    Route::post('/admin/sermons', [AdminController::class, 'storeSermon'])->name('admin.sermons.store');
    Route::patch('/admin/sermons/{sermon}', [AdminController::class, 'updateSermon'])->name('admin.sermons.update');
    Route::delete('/admin/sermons/{sermon}', [AdminController::class, 'destroySermon'])->name('admin.sermons.destroy');
    Route::patch('/admin/support-requests/{supportRequest}', [AdminController::class, 'updateSupportRequest'])->name('admin.support.update');
    Route::patch('/admin/content-reports/{contentReport}', [AdminController::class, 'updateContentReport'])->name('admin.reports.update');
    Route::patch('/admin/settings/profile', [AdminController::class, 'updateAdminProfile'])->name('admin.settings.profile');
    Route::patch('/admin/settings/password', [AdminController::class, 'updateAdminPassword'])->name('admin.settings.password');
    Route::patch('/admin/settings/branding', [AdminController::class, 'updateBranding'])->name('admin.settings.branding');
    Route::patch('/admin/settings/feed-banner', [AdminController::class, 'updateFeedBanner'])->name('admin.settings.feed-banner');
});
