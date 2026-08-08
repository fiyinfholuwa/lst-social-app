<?php

namespace App\Http\Controllers;

use App\Models\Community;
use App\Models\CommunityApplication;
use App\Models\User;
use App\Services\CacheService;
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
                ->get();
            $data['applications'] = CommunityApplication::query()
                ->with(['community:id,name', 'user:id,name,email,avatar'])
                ->latest()
                ->get();
            $data['admins'] = User::query()->orderBy('name')->get(['id', 'name']);
            $data['communityMetrics'] = [
                'Communities' => Community::count(),
                'Members joined' => DB::table('community_user')->count(),
                'Pending requests' => CommunityApplication::where('status', 'pending')->count(),
                'Reviewed requests' => CommunityApplication::whereIn('status', ['approved', 'rejected'])->count(),
            ];
        }

        $view = 'admin.sections.index';
        if (! $request->ajax()) {
            $view = 'admin';
        }

        return view($view, $data);
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

    public function storeCommunity(Request $request, CacheService $cache)
    {
        Community::create($this->communityData($request));
        $cache->invalidate('communities');

        return back()->with('status', 'Community created successfully.');
    }

    public function updateCommunity(Request $request, Community $community, CacheService $cache)
    {
        $community->update($this->communityData($request));
        $cache->invalidate('communities', "community:{$community->id}");

        return back()->with('status', 'Community updated successfully.');
    }

    public function destroyCommunity(Community $community, CacheService $cache)
    {
        $name = $community->name;
        $community->delete();
        $cache->invalidate('communities', "community:{$community->id}");

        return back()->with('status', "{$name} was deleted.");
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

    private function communityData(Request $request): array
    {
        return $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'nullable|string|max:3000',
            'rules' => 'nullable|string|max:5000',
            'image' => 'nullable|url|max:2048',
            'admin_id' => 'nullable|exists:users,id',
        ]);
    }
}
