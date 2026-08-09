<?php

namespace App\Http\Controllers;

use App\Models\Community;
use App\Models\CommunityApplication;
use App\Models\Post;
use App\Models\User;
use App\Services\CacheService;
use App\Services\UploadService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;

class AdminController extends Controller
{
    private const SECTIONS = ['overview', 'members', 'communities', 'posts', 'quizzes', 'moderation', 'analytics', 'settings'];

    public function index(Request $request, string $section = 'overview')
    {
        abort_unless(in_array($section, self::SECTIONS, true), 404);

        $data = compact('section');
        if ($section === 'members') {
            $data['members'] = User::query()->withCount('communities')->latest()->get();
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
            $data['posts'] = Post::query()
                ->whereNotNull('community_id')
                ->with(['user:id,name,email', 'community:id,name'])
                ->latest()
                ->paginate(50);
            $data['postMetrics'] = [
                'Pending review' => Post::whereNotNull('community_id')->where('status', 'pending')->count(),
                'Approved' => Post::whereNotNull('community_id')->where('status', 'approved')->count(),
                'Rejected' => Post::whereNotNull('community_id')->where('status', 'rejected')->count(),
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
        $user->update(['role' => $data['role'] ?: 'member']);

        return back()->with('status', "{$user->name}'s role was updated.");
    }

    public function destroyMember(User $user)
    {
        $name = $user->name;
        $user->delete();

        return back()->with('status', "{$name} was removed.");
    }

    public function updateCommunity(Request $request, Community $community, CacheService $cache, UploadService $uploads)
    {
        $data = $this->communityData($request);
        if ($request->hasFile('image')) {
            $uploads->delete($community->image, 'communities');
            $data['image'] = $uploads->store($request->file('image'), 'communities');
        }

        $community->update($data);
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
