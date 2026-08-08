@if(session('status'))
    <div class="admin-notice">{{ session('status') }}</div>
@endif
@if($errors->any())
    <div class="admin-notice error">{{ $errors->first() }}</div>
@endif

@if($section === 'members')
    <div class="page-heading"><div><div class="eyebrow">People & access</div><h1>Members</h1><p>Manage member roles, community participation and accounts.</p></div></div>
    <section class="stats">
        @foreach($memberMetrics as $label => $value)
            <article class="card stat"><div class="stat-top"><span class="stat-icon">{{ substr($label, 0, 1) }}</span><span class="trend">Live</span></div><div class="stat-value">{{ number_format($value) }}</div><div class="stat-label">{{ $label }}</div></article>
        @endforeach
    </section>
    <section class="card panel">
        <div class="panel-head"><div><h2>All members</h2><div class="panel-sub">{{ $members->count() }} accounts currently in the database</div></div></div>
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
    </section>
@elseif($section === 'communities')
    <div class="page-heading"><div><div class="eyebrow">Spaces & membership</div><h1>Communities</h1><p>Manage community details, assign owners and review membership applications.</p></div></div>
    <section class="stats">
        @foreach($communityMetrics as $label => $value)
            <article class="card stat"><div class="stat-top"><span class="stat-icon">{{ substr($label, 0, 1) }}</span><span class="trend">Live</span></div><div class="stat-value">{{ number_format($value) }}</div><div class="stat-label">{{ $label }}</div></article>
        @endforeach
    </section>
    <section class="card panel">
        <div class="panel-head"><div><h2>Community directory</h2><div class="panel-sub">Edit details, rules, owners and visibility from one place.</div></div></div>
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
    <section class="card panel">
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
