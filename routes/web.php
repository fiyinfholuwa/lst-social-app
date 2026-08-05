<?php

use Illuminate\Support\Facades\Route;

Route::get('/', function () {
    return view('welcome');
});

Route::get('/admin/{section?}', function (Illuminate\Http\Request $request, string $section = 'overview') {
    $sections = ['overview', 'members', 'communities', 'posts', 'quizzes', 'moderation', 'analytics', 'settings'];
    abort_unless(in_array($section, $sections, true), 404);

    if ($request->ajax()) {
        return view('admin.sections.index', compact('section'));
    }

    return view('admin', compact('section'));
})->name('admin.dashboard');
