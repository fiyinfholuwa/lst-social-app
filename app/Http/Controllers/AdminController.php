<?php

namespace App\Http\Controllers;

use App\Models\Community;
use App\Models\CommunityApplication;
use App\Models\Post;
use App\Models\LearningArticle;
use App\Models\PlatformSetting;
use App\Models\Quiz;
use App\Models\SupportRequest;
use App\Models\User;
use App\Services\CacheService;
use App\Services\UploadService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;

class AdminController extends Controller
{
    private const SECTIONS = ['overview', 'members', 'communities', 'posts', 'quizzes', 'articles', 'moderation', 'analytics', 'settings'];

    public function loginForm()
    {
        return view('admin.login');
    }

    public function login(Request $request)
    {
        $credentials = $request->validate(['email' => 'required|email', 'password' => 'required|string']);
        if (! Auth::attempt($credentials, $request->boolean('remember'))) {
            if ($request->expectsJson()) {
                return response()->json(['message' => 'The email or password is incorrect.'], 422);
            }

            return back()->withErrors(['email' => 'The email or password is incorrect.'])->onlyInput('email');
        }
        $request->session()->regenerate();
        if ($request->user()->suspended_at) {
            Auth::logout();
            $message = 'This account has been suspended.';

            return $request->expectsJson()
                ? response()->json(['message' => $message], 403)
                : back()->withErrors(['email' => $message]);
        }
        if (! in_array($request->user()->role, ['admin', 'super_admin'], true)) {
            Auth::logout();

            if ($request->expectsJson()) {
                return response()->json(['message' => 'This account does not have administrator access.'], 403);
            }

            return back()->withErrors(['email' => 'This account does not have administrator access.']);
        }

        if ($request->expectsJson()) {
            return response()->json(['redirect' => route('admin.dashboard')]);
        }

        return redirect()->intended(route('admin.dashboard'));
    }

    public function logout(Request $request)
    {
        Auth::logout();
        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return redirect()->route('login');
    }

    public function index(Request $request, string $section = 'overview')
    {
        abort_unless(in_array($section, self::SECTIONS, true), 404);

        $data = compact('section');
        if ($section === 'overview') {
            $data['overviewMetrics'] = [
                'Total members' => User::count(),
                'Communities' => Community::count(),
                'Pending applications' => CommunityApplication::where('status', 'pending')->count(),
                'Pending posts' => Post::whereNotNull('community_id')->where('status', 'pending')->count(),
            ];
            $data['recentMembers'] = User::latest()->limit(6)->get();
            $data['recentApplications'] = CommunityApplication::with(['user:id,name', 'community:id,name'])->latest()->limit(6)->get();
            $data['openSupportCount'] = SupportRequest::where('status', 'open')->count();
        }
        if ($section === 'members') {
            $filters = $request->validate(['search' => 'nullable|string|max:100', 'role' => ['nullable', Rule::in(['member', 'moderator', 'admin', 'super_admin'])], 'account_status' => ['nullable', Rule::in(['active', 'suspended'])]]);
            $search = trim($filters['search'] ?? '');
            $role = $filters['role'] ?? '';
            $accountStatus = $filters['account_status'] ?? '';
            $data['members'] = User::query()->withCount('communities')
                ->when($search !== '', fn ($query) => $query->where(fn ($users) => $users->where('name', 'like', "%{$search}%")->orWhere('email', 'like', "%{$search}%")))
                ->when($role !== '', fn ($query) => $role === 'member' ? $query->where(fn ($roles) => $roles->whereNull('role')->orWhere('role', 'member')) : $query->where('role', $role))
                ->when($accountStatus === 'active', fn ($query) => $query->whereNull('suspended_at'))
                ->when($accountStatus === 'suspended', fn ($query) => $query->whereNotNull('suspended_at'))
                ->latest()->paginate(30)->withQueryString();
            $data['memberSearch'] = $search;
            $data['memberRole'] = $role;
            $data['memberAccountStatus'] = $accountStatus;
            $data['memberMetrics'] = [
                'Total members' => User::count(),
                'Community members' => User::has('communities')->count(),
                'Administrators' => User::whereIn('role', ['admin', 'super_admin'])->count(),
                'New this week' => User::where('created_at', '>=', now()->subWeek())->count(),
            ];
        }

        if ($section === 'communities') {
            $data['communities'] = Community::query()
                ->with('admin:id,name')
                ->withCount(['members', 'applications as pending_applications_count' => fn ($query) => $query->where('status', 'pending')])
                ->latest()
                ->paginate(20);
            $data['admins'] = User::query()->whereIn('role', ['admin', 'super_admin'])->orderBy('name')->get(['id', 'name']);
            $data['communityMetrics'] = [
                'Communities' => Community::count(),
                'Members joined' => DB::table('community_user')->count(),
                'Pending requests' => CommunityApplication::where('status', 'pending')->count(),
                'Reviewed requests' => CommunityApplication::whereIn('status', ['approved', 'rejected'])->count(),
            ];
        }

        if ($section === 'posts') {
            $filters = $request->validate(['status' => ['nullable', Rule::in(['pending', 'approved', 'rejected'])], 'community' => 'nullable|integer|exists:communities,id']);
            $data['posts'] = Post::query()
                ->whereNotNull('community_id')
                ->when($filters['status'] ?? null, fn ($query, $status) => $query->where('status', $status))
                ->when($filters['community'] ?? null, fn ($query, $community) => $query->where('community_id', $community))
                ->with(['user:id,name,email', 'community:id,name'])
                ->latest()->paginate(50)->withQueryString();
            $data['postCommunities'] = Community::orderBy('name')->get(['id', 'name']);
            $data['postStatus'] = $filters['status'] ?? '';
            $data['postCommunity'] = $filters['community'] ?? '';
            $data['postMetrics'] = [
                'Pending review' => Post::whereNotNull('community_id')->where('status', 'pending')->count(),
                'Approved' => Post::whereNotNull('community_id')->where('status', 'approved')->count(),
                'Rejected' => Post::whereNotNull('community_id')->where('status', 'rejected')->count(),
            ];
        }

        if ($section === 'quizzes') {
            $data['quizzes'] = Quiz::with('community:id,name')->withCount('questions')->latest()->paginate(25);
            $data['quizCommunities'] = Community::withCount(['quizzes', 'members'])->orderBy('name')->get(['id', 'name']);
            $data['quizMetrics'] = [
                'Total quizzes' => Quiz::count(),
                'Published' => Quiz::where('status', 'published')->count(),
                'Drafts' => Quiz::where('status', 'draft')->count(),
                'Eligible communities' => Community::count(),
            ];
        }
        if ($section === 'articles') {
            $data['articles'] = LearningArticle::with('community:id,name')->withCount('questions')->orderBy('community_id')->orderBy('position')->paginate(25);
            $data['articleCommunities'] = Community::withCount('learningArticles')->orderBy('name')->get(['id', 'name']);
        }

        if ($section === 'moderation') {
            $data['pendingApplications'] = CommunityApplication::with(['user:id,name,email', 'community:id,name'])->where('status', 'pending')->latest()->paginate(20, ['*'], 'applications_page');
            $data['pendingPosts'] = Post::with(['user:id,name', 'community:id,name'])->whereNotNull('community_id')->where('status', 'pending')->latest()->paginate(20, ['*'], 'posts_page');
            $data['supportRequests'] = SupportRequest::with('user:id,name,email')->latest()->paginate(20, ['*'], 'support_page');
        }

        if ($section === 'analytics') {
            $memberCount = User::count();
            $verifiedCount = User::whereNotNull('email_verified_at')->count();
            $postCount = Post::count();
            $dates = collect(range(6, 0))->map(fn ($days) => now()->subDays($days));
            $recentUsers = User::where('created_at', '>=', now()->subDays(6)->startOfDay())->get(['created_at'])->groupBy(fn ($user) => $user->created_at->format('Y-m-d'));
            $recentPosts = Post::where('created_at', '>=', now()->subDays(6)->startOfDay())->get(['created_at'])->groupBy(fn ($post) => $post->created_at->format('Y-m-d'));
            $data['analyticsMetrics'] = [
                'Total members' => $memberCount,
                'Verified members' => $verifiedCount,
                'Total posts' => $postCount,
                'Communities' => Community::count(),
            ];
            $data['analyticsRates'] = [
                'Verification rate' => $memberCount ? round(($verifiedCount / $memberCount) * 100) : 0,
                'Community content' => $postCount ? round((Post::whereNotNull('community_id')->count() / $postCount) * 100) : 0,
                'Approved community posts' => max(0, Post::whereNotNull('community_id')->where('status', 'approved')->count()),
                'Open support requests' => SupportRequest::where('status', 'open')->count(),
            ];
            $data['weeklyActivity'] = $dates->map(fn ($date) => [
                'label' => $date->format('D'), 'date' => $date->format('Y-m-d'),
                'members' => ($recentUsers[$date->format('Y-m-d')] ?? collect())->count(),
                'posts' => ($recentPosts[$date->format('Y-m-d')] ?? collect())->count(),
            ]);
            $data['engagementTotals'] = [
                'Likes' => DB::table('post_likes')->count(),
                'Comments' => DB::table('comments')->count(),
                'Published quizzes' => Quiz::where('status', 'published')->count(),
                'Published articles' => LearningArticle::where('status', 'published')->count(),
            ];
            $data['communityAnalytics'] = Community::withCount(['members', 'posts', 'applications'])->orderByDesc('members_count')->get();
        }

        if ($section === 'settings') {
            $data['admin'] = $request->user();
            $data['branding'] = [
                'brand_name' => PlatformSetting::valueFor('brand_name', config('branding.name')),
                'product_name' => PlatformSetting::valueFor('product_name', config('branding.product_name')),
                'support_email' => PlatformSetting::valueFor('support_email', config('branding.support_email')),
                'ios_app_url' => PlatformSetting::valueFor('ios_app_url', config('branding.ios_app_url')),
                'android_app_url' => PlatformSetting::valueFor('android_app_url', config('branding.android_app_url')),
            ];
            $data['feedBanner'] = [
                'mode' => PlatformSetting::valueFor('feed_banner_mode', PlatformSetting::valueFor('announcement_enabled', '0') === '1' ? 'announcement' : 'encouragement'),
                'announcement_title' => PlatformSetting::valueFor('announcement_title', ''),
                'announcement_text' => PlatformSetting::valueFor('announcement_text', ''),
                'announcement_action_url' => PlatformSetting::valueFor('announcement_action_url', ''),
            ];
        }

        $view = 'admin.sections.index';
        if (! $request->ajax()) {
            $view = 'admin';
        }

        return view($view, $data);
    }

    public function communityApplications(Request $request, Community $community)
    {
        $filters = $request->validate([
            'status' => ['nullable', Rule::in(['pending', 'approved', 'rejected'])],
            'search' => 'nullable|string|max:100',
        ]);
        $status = $filters['status'] ?? 'pending';
        $search = trim($filters['search'] ?? '');

        $applications = CommunityApplication::query()
            ->where('community_id', $community->id)
            ->where('status', $status)
            ->with('user:id,name,email,avatar')
            ->when($search !== '', fn ($query) => $query->whereHas('user', fn ($users) => $users
                ->where('name', 'like', "%{$search}%")
                ->orWhere('email', 'like', "%{$search}%")))
            ->latest('id')
            ->cursorPaginate(50)
            ->withQueryString();

        $statusCounts = CommunityApplication::query()
            ->where('community_id', $community->id)
            ->selectRaw('status, count(*) as aggregate')
            ->groupBy('status')
            ->pluck('aggregate', 'status');

        return view('admin', [
            'section' => 'communities',
            'applicationsPage' => true,
            'community' => $community,
            'applications' => $applications,
            'statusCounts' => $statusCounts,
            'activeStatus' => $status,
            'search' => $search,
        ]);
    }

    public function updateMember(Request $request, User $user)
    {
        $data = $request->validate(['role' => ['nullable', Rule::in(['member', 'moderator', 'admin', 'super_admin'])]]);
        $nextRole = $data['role'] ?: 'member';
        if ($request->user()->is($user) && $nextRole !== ($user->role ?: 'member')) {
            $message = 'You cannot change your own administrator role.';

            return $request->expectsJson() ? response()->json(['message' => $message], 422) : back()->withErrors(['member' => $message]);
        }
        if ($request->user()->role !== 'super_admin' && (in_array($user->role, ['admin', 'super_admin'], true) || in_array($nextRole, ['admin', 'super_admin'], true))) {
            $message = 'Only a super administrator can manage administrator roles.';

            return $request->expectsJson() ? response()->json(['message' => $message], 403) : back()->withErrors(['member' => $message]);
        }
        $user->update(['role' => $nextRole]);

        if ($request->expectsJson()) {
            return response()->json(['message' => "{$user->name}'s role was updated."]);
        }

        return back()->with('status', "{$user->name}'s role was updated.");
    }

    public function showMember(Request $request, User $user)
    {
        $user->load('communities:id,name')->loadCount(['communities', 'posts', 'comments']);

        $payload = [
            'member' => [
                'id' => $user->id, 'name' => $user->name, 'email' => $user->email,
                'phone_number' => $user->phone_number, 'role' => $user->role ?: 'member',
                'avatar' => $user->avatar, 'bio' => $user->bio, 'hobbies' => $user->hobbies,
                'marital_status' => $user->marital_status, 'date_of_birth' => $user->date_of_birth?->format('Y-m-d'),
                'workplace' => $user->workplace, 'occupation' => $user->occupation,
                'is_profile_private' => $user->is_profile_private, 'email_verified' => $user->email_verified_at !== null,
                'suspended' => $user->suspended_at !== null, 'suspended_at' => $user->suspended_at?->format('d M Y, H:i'),
                'joined_at' => $user->created_at->format('d M Y, H:i'), 'last_updated' => $user->updated_at->diffForHumans(),
                'communities_count' => $user->communities_count, 'posts_count' => $user->posts_count,
                'comments_count' => $user->comments_count, 'communities' => $user->communities->pluck('name'),
            ],
            'actions' => [
                'role' => route('admin.members.update', $user),
                'details' => route('admin.members.details', $user),
                'suspension' => route('admin.members.suspension', $user),
                'password' => route('admin.members.password', $user),
            ],
        ];

        if ($request->expectsJson()) {
            return response()->json($payload);
        }

        return view('admin', ['section' => 'members', 'memberPage' => true, 'member' => $user, 'memberPayload' => $payload]);
    }

    public function updateMemberDetails(Request $request, User $user)
    {
        $data = $request->validate([
            'name' => 'required|string|max:200',
            'email' => ['required', 'email', 'max:255', Rule::unique('users', 'email')->ignore($user->id)],
            'phone_number' => 'nullable|string|max:30',
            'date_of_birth' => 'nullable|date|before:today',
            'marital_status' => 'nullable|string|max:40',
            'occupation' => 'nullable|string|max:120',
            'workplace' => 'nullable|string|max:160',
            'bio' => 'nullable|string|max:1000',
            'hobbies' => 'nullable|string|max:500',
        ]);
        abort_if($request->user()->role !== 'super_admin' && in_array($user->role, ['admin', 'super_admin'], true), 403, 'Only a super administrator can edit an administrator account.');
        [$firstName, $lastName] = array_pad(explode(' ', trim($data['name']), 2), 2, '');
        $user->update([...$data, 'name' => trim($data['name']), 'first_name' => $firstName, 'last_name' => $lastName, 'email' => strtolower($data['email'])]);

        $message = "{$user->name}'s details were updated.";

        return $request->expectsJson() ? response()->json(['message' => $message]) : back()->with('status', $message);
    }

    public function updateMemberSuspension(Request $request, User $user)
    {
        $data = $request->validate(['suspended' => 'required|boolean']);
        abort_if($request->user()->is($user), 422, 'You cannot suspend your own account.');
        abort_if($request->user()->role !== 'super_admin' && in_array($user->role, ['admin', 'super_admin'], true), 403, 'Only a super administrator can manage an administrator account.');
        $user->update(['suspended_at' => $data['suspended'] ? now() : null]);

        if ($data['suspended']) {
            $user->tokens()->delete();
            DB::table('sessions')->where('user_id', $user->id)->delete();
        }

        $message = $data['suspended'] ? "{$user->name} was suspended." : "{$user->name} was reactivated.";

        return $request->expectsJson() ? response()->json(['message' => $message]) : back()->with('status', $message);
    }

    public function updateMemberPassword(Request $request, User $user)
    {
        $data = $request->validate(['password' => 'required|string|min:8|confirmed']);
        abort_if($request->user()->is($user), 422, 'Change your own password from Settings.');
        abort_if($request->user()->role !== 'super_admin' && in_array($user->role, ['admin', 'super_admin'], true), 403, 'Only a super administrator can reset an administrator password.');
        $user->update(['password' => $data['password']]);
        $user->tokens()->delete();
        DB::table('sessions')->where('user_id', $user->id)->delete();

        $message = "{$user->name}'s password was changed and active sessions were signed out.";

        return $request->expectsJson() ? response()->json(['message' => $message]) : back()->with('status', $message);
    }

    public function showPost(Post $post)
    {
        $post->load([
            'user', 'community', 'originalPost.user',
            'comments' => fn ($query) => $query->with('user:id,name,email,avatar')->latest(),
        ])->loadCount(['likes', 'comments', 'shares']);

        return view('admin', ['section' => 'posts', 'postPage' => true, 'post' => $post]);
    }

    public function destroyMember(User $user)
    {
        abort_if(request()->user()->is($user), 422, 'You cannot remove your own account.');
        abort_if(request()->user()->role !== 'super_admin' && in_array($user->role, ['admin', 'super_admin'], true), 403, 'Only a super administrator can remove an administrator.');
        $name = $user->name;
        $user->delete();

        return back()->with('status', "{$name} was removed.");
    }

    public function storeMember(Request $request)
    {
        $data = $request->validate([
            'name' => 'required|string|max:200', 'email' => 'required|email|max:255|unique:users,email',
            'password' => 'required|string|min:8|confirmed', 'role' => ['required', Rule::in(['member', 'moderator', 'admin', 'super_admin'])],
            'email_verified' => 'nullable|boolean',
        ]);
        abort_if($request->user()->role !== 'super_admin' && in_array($data['role'], ['admin', 'super_admin'], true), 403, 'Only a super administrator can create another administrator.');
        [$firstName, $lastName] = array_pad(explode(' ', trim($data['name']), 2), 2, '');
        User::create([
            'name' => trim($data['name']), 'first_name' => $firstName, 'last_name' => $lastName,
            'email' => strtolower($data['email']), 'password' => $data['password'], 'role' => $data['role'],
            'email_verified_at' => $request->boolean('email_verified') ? now() : null,
        ]);

        return back()->with('status', 'Member account created.');
    }

    public function storeCommunity(Request $request, CacheService $cache, UploadService $uploads)
    {
        $data = $this->communityData($request);
        unset($data['image']);
        if ($request->hasFile('image')) $data['image'] = $uploads->store($request->file('image'), 'communities');
        $community = Community::create($data);
        if ($community->admin_id) $community->members()->syncWithoutDetaching([$community->admin_id]);
        $cache->invalidate('communities');

        return back()->with('status', 'Community created successfully.');
    }

    public function destroyCommunity(Community $community, CacheService $cache, UploadService $uploads)
    {
        $name = $community->name;
        $uploads->delete($community->image, 'communities');
        $community->delete();
        $cache->invalidate('communities', "community:{$community->id}");

        return redirect('/admin/communities')->with('status', "{$name} was deleted.");
    }

    public function updateCommunity(Request $request, Community $community, CacheService $cache, UploadService $uploads)
    {
        $data = $this->communityData($request);
        if ($request->hasFile('image')) {
            $uploads->delete($community->image, 'communities');
            $data['image'] = $uploads->store($request->file('image'), 'communities');
        }

        $community->update($data);
        if ($community->admin_id) $community->members()->syncWithoutDetaching([$community->admin_id]);
        $cache->invalidate('communities', "community:{$community->id}");

        return back()->with('status', 'Community updated successfully.');
    }

    public function reviewApplication(Request $request, CommunityApplication $application, CacheService $cache)
    {
        $data = $request->validate(['action' => ['required', Rule::in(['approve', 'reject'])]]);
        $status = $data['action'] === 'approve' ? 'approved' : 'rejected';
        $application->update(['status' => $status]);

        if ($status === 'approved') {
            $application->community()->firstOrFail()->members()->syncWithoutDetaching([$application->user_id]);
        } else {
            DB::table('community_user')->where(['community_id' => $application->community_id, 'user_id' => $application->user_id])->delete();
        }

        $cache->invalidate('communities', "community:{$application->community_id}", "applications:{$application->user_id}", "user:{$application->user_id}");

        return back()->with('status', "Application {$status}.");
    }

    public function reviewPost(Request $request, Post $post, CacheService $cache)
    {
        $data = $request->validate(['action' => ['required', Rule::in(['approve', 'reject'])]]);
        abort_unless($post->community_id, 422, 'Only community posts require moderation.');
        $status = $data['action'] === 'approve' ? 'approved' : 'rejected';
        $post->update(['status' => $status]);
        $cache->invalidate('posts', "post:{$post->id}", "user:{$post->user_id}", "community:{$post->community_id}");

        return back()->with('status', "Post {$status}.");
    }

    public function storeQuiz(Request $request)
    {
        $data = $this->quizData($request);
        DB::transaction(fn () => $this->persistQuiz(new Quiz, $data));

        return redirect('/admin/quizzes')->with('status', 'Quiz created successfully.');
    }

    public function createQuiz()
    {
        return view('admin', [
            'section' => 'quizzes', 'quizEditorPage' => true, 'quiz' => null,
            'quizCommunities' => Community::withCount('quizzes')->orderBy('name')->get(['id', 'name']),
        ]);
    }

    public function editQuiz(Quiz $quiz)
    {
        $quiz->load('questions.answers', 'community:id,name');

        return view('admin', [
            'section' => 'quizzes', 'quizEditorPage' => true, 'quiz' => $quiz,
            'quizCommunities' => Community::withCount('quizzes')->orderBy('name')->get(['id', 'name']),
        ]);
    }

    public function updateQuiz(Request $request, Quiz $quiz)
    {
        $data = $this->quizData($request);
        DB::transaction(fn () => $this->persistQuiz($quiz, $data));

        return back()->with('status', 'Quiz updated successfully.');
    }

    public function destroyQuiz(Quiz $quiz)
    {
        $quiz->delete();

        return back()->with('status', 'Quiz deleted.');
    }

    public function createArticle()
    {
        return view('admin', ['section' => 'articles', 'articleEditorPage' => true, 'article' => null, 'articleCommunities' => Community::withCount('learningArticles')->orderBy('name')->get(['id', 'name'])]);
    }

    public function editArticle(LearningArticle $article)
    {
        $article->load('questions.answers');
        return view('admin', ['section' => 'articles', 'articleEditorPage' => true, 'article' => $article, 'articleCommunities' => Community::withCount('learningArticles')->orderBy('name')->get(['id', 'name'])]);
    }

    public function storeArticle(Request $request)
    {
        $data = $this->articleData($request);
        DB::transaction(fn () => $this->persistArticle(new LearningArticle, $data));
        return redirect('/admin/articles')->with('status', 'Article created successfully.');
    }

    public function updateArticle(Request $request, LearningArticle $article)
    {
        $data = $this->articleData($request);
        DB::transaction(fn () => $this->persistArticle($article, $data));
        return back()->with('status', 'Article updated successfully.');
    }

    public function destroyArticle(LearningArticle $article)
    {
        $article->delete();
        return redirect('/admin/articles')->with('status', 'Article deleted.');
    }

    public function updateSupportRequest(Request $request, SupportRequest $supportRequest)
    {
        $data = $request->validate(['status' => ['required', Rule::in(['open', 'in_progress', 'resolved', 'closed'])]]);
        $supportRequest->update($data);

        return back()->with('status', 'Support request updated.');
    }

    public function updateAdminProfile(Request $request)
    {
        $data = $request->validate(['name' => 'required|string|max:200', 'email' => ['required', 'email', 'max:255', Rule::unique('users', 'email')->ignore($request->user()->id)]]);
        [$firstName, $lastName] = array_pad(explode(' ', trim($data['name']), 2), 2, '');
        $request->user()->update($data + ['first_name' => $firstName, 'last_name' => $lastName]);

        return back()->with('status', 'Administrator profile updated.');
    }

    public function updateAdminPassword(Request $request)
    {
        $data = $request->validate(['current_password' => 'required|current_password', 'password' => 'required|string|min:8|confirmed']);
        $request->user()->update(['password' => Hash::make($data['password'])]);

        return back()->with('status', 'Password updated.');
    }

    public function updateBranding(Request $request)
    {
        $data = $request->validate([
            'brand_name' => 'required|string|max:150',
            'product_name' => 'required|string|max:150',
            'support_email' => 'required|email|max:255',
            'ios_app_url' => 'required|url:http,https|max:2000',
            'android_app_url' => 'required|url:http,https|max:2000',
        ]);
        foreach ($data as $key => $value) PlatformSetting::put($key, trim($value));

        return back()->with('status', 'Landing-page branding and download links updated.');
    }

    public function updateFeedBanner(Request $request)
    {
        $data = $request->validate([
            'feed_banner_mode' => ['required', Rule::in(['encouragement', 'announcement'])],
            'announcement_title' => 'nullable|string|max:80',
            'announcement_text' => 'required_if:feed_banner_mode,announcement|nullable|string|max:240',
            'announcement_action_url' => 'nullable|url:https|max:2000',
        ]);

        PlatformSetting::put('feed_banner_mode', $data['feed_banner_mode']);
        PlatformSetting::put('announcement_enabled', $data['feed_banner_mode'] === 'announcement' ? '1' : '0');
        PlatformSetting::put('announcement_title', trim($data['announcement_title'] ?? ''));
        PlatformSetting::put('announcement_text', trim($data['announcement_text'] ?? ''));
        PlatformSetting::put('announcement_action_url', trim($data['announcement_action_url'] ?? ''));

        return back()->with('status', $data['feed_banner_mode'] === 'announcement' ? 'Feed announcement published.' : 'Daily encouragement restored.');
    }

    private function quizData(Request $request): array
    {
        $quiz = $request->route('quiz');
        return $request->validate([
            'community_id' => 'required|exists:communities,id',
            'title' => ['required', 'string', 'max:255', Rule::unique('quizzes', 'title')->where('community_id', $request->input('community_id'))->ignore($quiz?->id)],
            'instructions' => 'nullable|string|max:3000', 'duration_minutes' => 'nullable|integer|min:1|max:600',
            'passing_score' => 'required|integer|min:1|max:100', 'max_attempts' => 'nullable|integer|min:1|max:100',
            'status' => ['required', Rule::in(['draft', 'published'])], 'randomize_questions' => 'nullable|boolean', 'show_answers' => 'nullable|boolean',
            'questions' => 'required|array|min:1|max:100', 'questions.*.question' => 'required|string|max:2000',
            'questions.*.answers' => 'required|array|min:2|max:10', 'questions.*.answers.*' => 'required|string|max:1000',
            'questions.*.correct' => 'required|integer|min:0|max:9',
        ]);
    }

    private function articleData(Request $request): array
    {
        $article = $request->route('article');
        return $request->validate([
            'community_id' => 'required|exists:communities,id',
            'title' => ['required','string','max:255',Rule::unique('learning_articles','title')->where('community_id',$request->input('community_id'))->ignore($article?->id)],
            'content' => 'required|string|max:50000', 'position' => 'required|integer|min:1|max:1000',
            'duration_minutes' => 'required|integer|min:1|max:600', 'passing_score' => 'required|integer|min:1|max:100',
            'status' => ['required',Rule::in(['draft','published'])], 'questions' => 'required|array|min:1|max:100',
            'questions.*.question' => 'required|string|max:2000', 'questions.*.answers' => 'required|array|min:2|max:10',
            'questions.*.answers.*' => 'required|string|max:1000', 'questions.*.correct' => 'required|integer|min:0|max:9',
        ]);
    }

    private function persistArticle(LearningArticle $article, array $data): void
    {
        $questions = $data['questions']; unset($data['questions']); $article->fill($data)->save(); $article->questions()->delete();
        foreach ($questions as $questionPosition => $questionData) {
            abort_if($questionData['correct'] >= count($questionData['answers']), 422, 'A correct-answer selection is outside its answer list.');
            $question = $article->questions()->create(['question'=>$questionData['question'],'position'=>$questionPosition+1]);
            foreach ($questionData['answers'] as $answerPosition => $answer) $question->answers()->create(['answer'=>$answer,'is_correct'=>$answerPosition === (int)$questionData['correct'],'position'=>$answerPosition+1]);
        }
    }

    private function persistQuiz(Quiz $quiz, array $data): void
    {
        $questions = $data['questions'];
        unset($data['questions']);
        $data['randomize_questions'] = (bool) ($data['randomize_questions'] ?? false);
        $data['show_answers'] = (bool) ($data['show_answers'] ?? false);
        $quiz->fill($data)->save();
        $quiz->questions()->delete();
        foreach ($questions as $questionPosition => $questionData) {
            abort_if($questionData['correct'] >= count($questionData['answers']), 422, 'A correct-answer selection is outside its answer list.');
            $question = $quiz->questions()->create(['question' => $questionData['question'], 'position' => $questionPosition + 1]);
            foreach ($questionData['answers'] as $answerPosition => $answer) {
                $question->answers()->create(['answer' => $answer, 'is_correct' => $answerPosition === (int) $questionData['correct'], 'position' => $answerPosition + 1]);
            }
        }
    }

    private function communityData(Request $request): array
    {
        return $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'nullable|string|max:3000',
            'rules' => 'nullable|string|max:5000',
            'image' => 'nullable|image|mimes:jpg,jpeg,png,webp|max:4096',
            'admin_id' => ['nullable', Rule::exists('users', 'id')->where(fn ($query) => $query->whereIn('role', ['admin', 'super_admin']))],
        ]);
    }
}
