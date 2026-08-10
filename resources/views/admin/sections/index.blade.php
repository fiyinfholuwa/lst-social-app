@if(session('status'))
    <div class="admin-notice">{{ session('status') }}</div>
@endif
@if($errors->any())
    <div class="admin-notice error">{{ $errors->first() }}</div>
@endif

@if($section === 'overview')
    <div class="page-heading"><div><div class="eyebrow">Live workspace</div><h1>Overview</h1><p>Current platform activity and work requiring attention.</p></div></div>
    <section class="stats">@foreach($overviewMetrics as $label=>$value)<article class="card stat"><div class="stat-value">{{ number_format($value) }}</div><div class="stat-label">{{ $label }}</div></article>@endforeach</section>
    <section class="grid"><article class="card panel"><div class="panel-head"><div><h2>Newest members</h2><div class="panel-sub">Recently created accounts</div></div><a href="{{ url('/admin/members') }}">Manage</a></div><div class="activity">@forelse($recentMembers as $member)<div class="activity-item"><div class="avatar">{{ strtoupper(substr($member->name,0,2)) }}</div><div><p><strong>{{ $member->name }}</strong> · {{ $member->email }}</p><time>{{ $member->created_at->diffForHumans() }}</time></div></div>@empty<div class="empty-cell">No members yet.</div>@endforelse</div></article>
    <article class="card panel"><div class="panel-head"><div><h2>Recent applications</h2><div class="panel-sub">Latest community membership activity</div></div><a href="{{ url('/admin/moderation') }}">Review</a></div><div class="activity">@forelse($recentApplications as $application)<div class="activity-item"><div class="avatar">{{ strtoupper(substr($application->user?->name ?? '?',0,2)) }}</div><div><p><strong>{{ $application->user?->name ?? 'Deleted member' }}</strong> applied to {{ $application->community?->name }}</p><time>{{ ucfirst($application->status) }} · {{ $application->created_at->diffForHumans() }}</time></div></div>@empty<div class="empty-cell">No applications yet.</div>@endforelse</div></article></section>
    @if($openSupportCount)<div class="admin-notice error"><strong>{{ $openSupportCount }}</strong> support request{{ $openSupportCount===1?'':'s' }} need attention. <a href="{{ url('/admin/moderation') }}">Open moderation</a></div>@endif
@elseif($section === 'members')
    <div class="page-heading"><div><div class="eyebrow">People & access</div><h1>Members</h1><p>Manage member roles, community participation and accounts.</p></div></div>
    <section class="stats">
        @foreach($memberMetrics as $label => $value)
            <article class="card stat"><div class="stat-top"><span class="stat-icon">{{ substr($label, 0, 1) }}</span><span class="trend">Live</span></div><div class="stat-value">{{ number_format($value) }}</div><div class="stat-label">{{ $label }}</div></article>
        @endforeach
    </section>
    <section class="card panel">
        <div class="panel-head"><div><h2>All members</h2><div class="panel-sub">{{ number_format($members->total()) }} matching accounts</div></div><form method="GET" class="application-search"><input type="search" name="search" value="{{ $memberSearch }}" placeholder="Name or email"><select name="role"><option value="">All roles</option>@foreach(['member','moderator','admin','super_admin'] as $role)<option value="{{ $role }}" @selected($memberRole===$role)>{{ ucfirst(str_replace('_',' ',$role)) }}</option>@endforeach</select><button class="mini-btn">Filter</button></form></div>
        <details><summary class="mini-btn">Create member</summary><form class="admin-form compact" method="POST" action="{{ route('admin.members.store') }}">@csrf<label>Full name<input name="name" required></label><label>Email<input type="email" name="email" required></label><label>Temporary password<input type="password" name="password" minlength="8" required></label><label>Confirm password<input type="password" name="password_confirmation" required></label><label>Role<select name="role">@foreach(['member','moderator','admin','super_admin'] as $role)<option value="{{ $role }}">{{ ucfirst(str_replace('_',' ',$role)) }}</option>@endforeach</select></label><label><input type="checkbox" name="email_verified" value="1"> Mark email verified</label><button class="btn btn-primary">Create account</button></form></details>
        <div class="admin-table-wrap"><table class="admin-table">
            <thead><tr><th>Member</th><th>Role</th><th>Communities</th><th>Joined</th><th>Actions</th></tr></thead>
            <tbody>
            @forelse($members as $member)
                <tr>
                    <td><strong>{{ $member->name }}</strong><small>{{ $member->email }}</small></td>
                    <td><span class="admin-pill">{{ ucfirst(str_replace('_', ' ', $member->role ?: 'member')) }}</span></td>
                    <td>{{ $member->communities_count }}</td><td>{{ $member->created_at->format('d M Y') }}</td>
                    <td><div class="row-actions">
                        <form method="POST" action="{{ route('admin.members.update', $member) }}">@csrf @method('PATCH')
                            <select name="role" aria-label="Role for {{ $member->name }}"><option value="member" @selected(($member->role ?: 'member') === 'member')>Member</option><option value="moderator" @selected($member->role === 'moderator')>Moderator</option><option value="admin" @selected($member->role === 'admin')>Admin</option><option value="super_admin" @selected($member->role === 'super_admin')>Super admin</option></select>
                            <button class="mini-btn" type="submit">Save</button>
                        </form>
                        <form method="POST" action="{{ route('admin.members.destroy', $member) }}" onsubmit="return confirm('Remove {{ addslashes($member->name) }} and all associated data?')">@csrf @method('DELETE')<button class="mini-btn danger" type="submit">Remove</button></form>
                    </div></td>
                </tr>
            @empty<tr><td colspan="5" class="empty-cell">No members found.</td></tr>@endforelse
            </tbody>
        </table></div>
        @if($members->hasPages()){{ $members->links() }}@endif
    </section>
@elseif($section === 'communities')
    <div class="page-heading"><div><div class="eyebrow">Spaces & membership</div><h1>Communities</h1><p>Manage community details, assign owners and review membership applications.</p></div></div>
    <section class="stats">
        @foreach($communityMetrics as $label => $value)
            <article class="card stat"><div class="stat-top"><span class="stat-icon">{{ substr($label, 0, 1) }}</span><span class="trend">Live</span></div><div class="stat-value">{{ number_format($value) }}</div><div class="stat-label">{{ $label }}</div></article>
        @endforeach
    </section>
    <section class="card panel">
        <div class="panel-head"><div><h2>Community directory</h2><div class="panel-sub">Edit details, rules, owners and visibility from one place.</div></div><details><summary class="mini-btn">New community</summary><form class="admin-form compact" method="POST" action="{{ route('admin.communities.store') }}" enctype="multipart/form-data">@csrf<label>Name<input name="name" required></label><label>Description<textarea name="description"></textarea></label><label>Rules<textarea name="rules"></textarea></label><label>Image<input type="file" name="image" accept="image/jpeg,image/png,image/webp"></label><label>Administrator<select name="admin_id"><option value="">Unassigned</option>@foreach($admins as $admin)<option value="{{ $admin->id }}">{{ $admin->name }}</option>@endforeach</select></label><button class="btn btn-primary">Create community</button></form></details></div>
        <div class="community-grid">
        @forelse($communities as $community)
            <article class="community-admin-card">
                <div class="community-card-main">@if($community->image)<img class="community-card-thumb" src="{{ $community->image }}" alt="">@else<div class="community-card-placeholder">{{ strtoupper(substr($community->name, 0, 1)) }}</div>@endif<div class="community-admin-head"><div><h3>{{ $community->name }}</h3><p>{{ $community->description ?: 'No description provided.' }}</p></div></div></div>
                <div class="community-meta"><span>Owner: {{ $community->admin?->name ?? 'Unassigned' }}</span><span>{{ $community->pending_applications_count }} pending</span></div>
                <div class="community-card-actions"><a class="manage-applications-link" href="{{ route('admin.communities.applications', $community) }}">Manage applications <span>{{ $community->pending_applications_count }}</span></a><span class="admin-pill">{{ number_format($community->members_count) }} members</span></div>
                <details><summary class="mini-btn">Edit details</summary>
                    <form class="admin-form compact" method="POST" action="{{ route('admin.communities.update', $community) }}" enctype="multipart/form-data">@csrf @method('PATCH')
                        <label>Name<input name="name" value="{{ $community->name }}" required></label>
                        <label>Description<textarea name="description">{{ $community->description }}</textarea></label>
                        <label>Rules<textarea name="rules">{{ $community->rules }}</textarea></label>
                        <label>Community image
                            @if($community->image)<img class="community-image-preview" src="{{ $community->image }}" alt="Current {{ $community->name }} image">@endif
                            <input name="image" type="file" accept="image/jpeg,image/png,image/webp"><small>JPG, PNG or WebP, up to 4 MB.</small>
                        </label>
                        <label>Administrator<select name="admin_id"><option value="">Unassigned</option>@foreach($admins as $admin)<option value="{{ $admin->id }}" @selected((int) $community->admin_id === (int) $admin->id)>{{ $admin->name }} · {{ $admin->role === 'super_admin' ? 'Super administrator' : 'Administrator' }}</option>@endforeach</select></label>
                        <button class="btn btn-primary" type="submit">Save changes</button>
                    </form>
                </details>
                <form method="POST" action="{{ route('admin.communities.destroy',$community) }}" onsubmit="return confirm('Delete this community and all of its posts, applications and quizzes?')">@csrf @method('DELETE')<button class="mini-btn danger">Delete community</button></form>
            </article>
        @empty<div class="empty-cell">No communities created yet.</div>@endforelse
        </div>
        @if($communities->hasPages())<nav class="admin-pagination" aria-label="Community pages">@if($communities->onFirstPage())<span>← Previous</span>@else<a href="{{ $communities->previousPageUrl() }}">← Previous</a>@endif<strong>Page {{ $communities->currentPage() }} of {{ $communities->lastPage() }}</strong>@if($communities->hasMorePages())<a href="{{ $communities->nextPageUrl() }}">Next →</a>@else<span>Next →</span>@endif</nav>@endif
    </section>
@elseif($section === 'posts')
    <div class="page-heading"><div><div class="eyebrow">Community moderation</div><h1>Community posts</h1><p>Review member posts before they become visible in their community.</p></div></div>
    <section class="stats">
        @foreach($postMetrics as $label => $value)<article class="card stat"><div class="stat-value">{{ number_format($value) }}</div><div class="stat-label">{{ $label }}</div></article>@endforeach
    </section>
    <section class="card panel"><form method="GET" class="application-search"><select name="status"><option value="">All statuses</option>@foreach(['pending','approved','rejected'] as $status)<option value="{{ $status }}" @selected($postStatus===$status)>{{ ucfirst($status) }}</option>@endforeach</select><select name="community"><option value="">All communities</option>@foreach($postCommunities as $community)<option value="{{ $community->id }}" @selected((string)$postCommunity===(string)$community->id)>{{ $community->name }}</option>@endforeach</select><button class="mini-btn">Filter</button></form>
        <div class="admin-table-wrap"><table class="admin-table"><thead><tr><th>Author</th><th>Community</th><th>Post</th><th>Status</th><th>Submitted</th><th>Actions</th></tr></thead><tbody>
        @forelse($posts as $post)<tr>
            <td><strong>{{ $post->user->name }}</strong><small>{{ $post->user->email }}</small></td>
            <td>{{ $post->community->name }}</td>
            <td style="max-width:420px">{{ Str::limit($post->content, 180) }}</td>
            <td><span class="admin-pill {{ $post->status }}">{{ ucfirst($post->status) }}</span></td>
            <td>{{ $post->created_at->format('d M Y, H:i') }}</td>
            <td><div class="application-actions">@if($post->status === 'pending')<form method="POST" action="{{ route('admin.posts.review', $post) }}">@csrf<input type="hidden" name="action" value="approve"><button class="mini-btn approve">Approve</button></form><form method="POST" action="{{ route('admin.posts.review', $post) }}">@csrf<input type="hidden" name="action" value="reject"><button class="mini-btn danger">Reject</button></form>@else<span>Reviewed</span>@endif</div></td>
        </tr>@empty<tr><td colspan="6" class="empty-cell">No community posts have been submitted.</td></tr>@endforelse
        </tbody></table></div>
        @if($posts->hasPages()){{ $posts->links() }}@endif
    </section>
@elseif($section === 'quizzes')
    <div class="page-heading"><div><div class="eyebrow">Learning gates</div><h1>Quizzes</h1><p>Create, publish and maintain community quizzes and answers.</p></div></div>
    <section class="card panel"><details open><summary class="mini-btn">Create quiz</summary><form class="admin-form" method="POST" action="{{ route('admin.quizzes.store') }}" data-quiz-form>@csrf @include('admin.sections.quiz-form', ['quiz'=>null])</form></details></section>
    <section class="card panel"><div class="panel-head"><div><h2>Quiz library</h2><div class="panel-sub">{{ $quizzes->total() }} quizzes</div></div></div>@forelse($quizzes as $quiz)<details class="community-admin-card"><summary><strong>{{ $quiz->title }}</strong> · {{ $quiz->community->name }} · {{ $quiz->questions_count }} questions · {{ ucfirst($quiz->status) }}</summary><form class="admin-form compact" method="POST" action="{{ route('admin.quizzes.update',$quiz) }}" data-quiz-form>@csrf @method('PATCH') @include('admin.sections.quiz-form', ['quiz'=>$quiz->load('questions.answers')])</form><form method="POST" action="{{ route('admin.quizzes.destroy',$quiz) }}" onsubmit="return confirm('Delete this quiz?')">@csrf @method('DELETE')<button class="mini-btn danger">Delete quiz</button></form></details>@empty<div class="empty-cell">No quizzes created yet.</div>@endforelse @if($quizzes->hasPages()){{ $quizzes->links() }}@endif</section>
@elseif($section === 'moderation')
    <div class="page-heading"><div><div class="eyebrow">Safety & review</div><h1>Moderation</h1><p>Process applications, community posts and member support requests.</p></div></div>
    <section class="card panel"><h2>Pending applications</h2><div class="admin-table-wrap"><table class="admin-table"><tbody>@forelse($pendingApplications as $item)<tr><td><strong>{{ $item->user?->name }}</strong><small>{{ $item->community?->name }}</small></td><td><div class="application-actions"><form method="POST" action="{{ route('admin.applications.review',$item) }}">@csrf<input type="hidden" name="action" value="approve"><button class="mini-btn approve">Approve</button></form><form method="POST" action="{{ route('admin.applications.review',$item) }}">@csrf<input type="hidden" name="action" value="reject"><button class="mini-btn danger">Reject</button></form></div></td></tr>@empty<tr><td class="empty-cell">No pending applications.</td></tr>@endforelse</tbody></table></div>{{ $pendingApplications->links() }}</section>
    <section class="card panel"><h2>Pending posts</h2><div class="admin-table-wrap"><table class="admin-table"><tbody>@forelse($pendingPosts as $post)<tr><td><strong>{{ $post->user?->name }}</strong><small>{{ $post->community?->name }}</small></td><td>{{ Str::limit($post->content,160) }}</td><td><div class="application-actions"><form method="POST" action="{{ route('admin.posts.review',$post) }}">@csrf<input type="hidden" name="action" value="approve"><button class="mini-btn approve">Approve</button></form><form method="POST" action="{{ route('admin.posts.review',$post) }}">@csrf<input type="hidden" name="action" value="reject"><button class="mini-btn danger">Reject</button></form></div></td></tr>@empty<tr><td class="empty-cell">No pending posts.</td></tr>@endforelse</tbody></table></div>{{ $pendingPosts->links() }}</section>
    <section class="card panel"><h2>Support requests</h2><div class="admin-table-wrap"><table class="admin-table"><tbody>@forelse($supportRequests as $ticket)<tr><td><strong>#{{ $ticket->id }} {{ $ticket->subject }}</strong><small>{{ $ticket->user?->name }} · {{ $ticket->type }}</small></td><td>{{ $ticket->message }}</td><td><form method="POST" action="{{ route('admin.support.update',$ticket) }}">@csrf @method('PATCH')<select name="status">@foreach(['open','in_progress','resolved','closed'] as $status)<option value="{{ $status }}" @selected($ticket->status===$status)>{{ ucfirst(str_replace('_',' ',$status)) }}</option>@endforeach</select><button class="mini-btn">Save</button></form></td></tr>@empty<tr><td class="empty-cell">No support requests.</td></tr>@endforelse</tbody></table></div>{{ $supportRequests->links() }}</section>
@elseif($section === 'analytics')
    <div class="page-heading"><div><div class="eyebrow">Platform health</div><h1>Analytics</h1><p>Live membership, content and community totals.</p></div></div><section class="stats">@foreach($analyticsMetrics as $label=>$value)<article class="card stat"><div class="stat-value">{{ number_format($value) }}</div><div class="stat-label">{{ $label }}</div></article>@endforeach</section><section class="card panel"><h2>Community performance</h2><div class="admin-table-wrap"><table class="admin-table"><thead><tr><th>Community</th><th>Members</th><th>Posts</th><th>Applications</th></tr></thead><tbody>@foreach($communityAnalytics as $community)<tr><td>{{ $community->name }}</td><td>{{ $community->members_count }}</td><td>{{ $community->posts_count }}</td><td>{{ $community->applications_count }}</td></tr>@endforeach</tbody></table></div></section>
@elseif($section === 'settings')
    <div class="page-heading"><div><div class="eyebrow">Platform configuration</div><h1>Settings</h1><p>Maintain landing-page branding, store links and administrator security.</p></div></div>
    <section class="card panel"><div class="panel-head"><div><h2>Landing page & app downloads</h2><div class="panel-sub">These values appear publicly and take effect immediately after saving.</div></div></div><form class="admin-form" method="POST" action="{{ route('admin.settings.branding') }}">@csrf @method('PATCH')<div class="form-grid"><label>Organization name<input name="brand_name" value="{{ old('brand_name',$branding['brand_name']) }}" required></label><label>Product name<input name="product_name" value="{{ old('product_name',$branding['product_name']) }}" required></label></div><label>Public support email<input type="email" name="support_email" value="{{ old('support_email',$branding['support_email']) }}" required></label><label>Apple App Store URL<input type="url" name="ios_app_url" value="{{ old('ios_app_url',$branding['ios_app_url']) }}" placeholder="https://apps.apple.com/app/..." required></label><label>Google Play URL<input type="url" name="android_app_url" value="{{ old('android_app_url',$branding['android_app_url']) }}" placeholder="https://play.google.com/store/apps/details?id=..." required></label><button class="btn btn-primary">Save public branding</button></form></section>
    <section class="grid"><article class="card panel"><h2>Administrator profile</h2><form class="admin-form" method="POST" action="{{ route('admin.settings.profile') }}">@csrf @method('PATCH')<label>Name<input name="name" value="{{ $admin->name }}" required></label><label>Email<input type="email" name="email" value="{{ $admin->email }}" required></label><button class="btn btn-primary">Save profile</button></form></article><article class="card panel"><h2>Change password</h2><form class="admin-form" method="POST" action="{{ route('admin.settings.password') }}">@csrf @method('PATCH')<label>Current password<input type="password" name="current_password" required></label><label>New password<input type="password" name="password" minlength="8" required></label><label>Confirm password<input type="password" name="password_confirmation" required></label><button class="btn btn-primary">Update password</button></form></article></section>
@else
    @php
        $content = [
            'overview' => ['Overview', 'Monitor your entire LST Social workspace.'], 'posts' => ['Posts', 'Review and manage community posts.'], 'quizzes' => ['Quizzes', 'Control questions and pass requirements.'], 'moderation' => ['Moderation', 'Review reports and safety actions.'], 'analytics' => ['Analytics', 'Understand growth and engagement.'], 'settings' => ['Settings', 'Configure platform access and security.'],
        ];
        [$title, $description] = $content[$section];
    @endphp
    <div class="page-heading"><div><div class="eyebrow">Admin workspace</div><h1>{{ $title }}</h1><p>{{ $description }}</p></div></div>
    <section class="card panel"><div class="empty-cell">This section is ready for its next management workflow.</div></section>
@endif
