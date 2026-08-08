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
    <div class="page-heading"><div><div class="eyebrow">Spaces & membership</div><h1>Communities</h1><p>Create communities, assign owners and review membership applications.</p></div><button class="btn btn-primary" type="button" onclick="document.getElementById('newCommunity').showModal()">+ New community</button></div>
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
                <div class="community-admin-head"><div><h3>{{ $community->name }}</h3><p>{{ $community->description ?: 'No description provided.' }}</p></div><span class="admin-pill">{{ $community->members_count }} members</span></div>
                <div class="community-meta"><span>Owner: {{ $community->admin?->name ?? 'Unassigned' }}</span><span>{{ $community->pending_applications_count }} pending</span></div>
                <details><summary class="mini-btn">Edit community</summary>
                    <form class="admin-form compact" method="POST" action="{{ route('admin.communities.update', $community) }}">@csrf @method('PATCH')
                        <label>Name<input name="name" value="{{ $community->name }}" required></label><label>Description<textarea name="description">{{ $community->description }}</textarea></label><label>Rules<textarea name="rules">{{ $community->rules }}</textarea></label><label>Image URL<input name="image" type="url" value="{{ $community->image }}"></label><label>Owner<select name="admin_id"><option value="">Unassigned</option>@foreach($admins as $admin)<option value="{{ $admin->id }}" @selected($community->admin_id === $admin->id)>{{ $admin->name }}</option>@endforeach</select></label><button class="btn btn-primary" type="submit">Save changes</button>
                    </form>
                </details>
                <form method="POST" action="{{ route('admin.communities.destroy', $community) }}" onsubmit="return confirm('Delete this community, its applications and community posts?')">@csrf @method('DELETE')<button class="text-danger" type="submit">Delete community</button></form>
            </article>
        @empty<div class="empty-cell">No communities created yet.</div>@endforelse
        </div>
    </section>
    <section class="card panel admin-section-gap">
        <div class="panel-head"><div><h2>Membership applications</h2><div class="panel-sub">Review requests submitted from the mobile community application form.</div></div><span class="admin-pill">{{ $applications->where('status', 'pending')->count() }} pending</span></div>
        <div class="application-list">
        @forelse($applications as $application)
            <article class="application-row">
                <div class="avatar">{{ strtoupper(substr($application->user?->name ?? '?', 0, 2)) }}</div>
                <div class="application-copy"><strong>{{ $application->user?->name ?? 'Deleted member' }}</strong><small>{{ $application->user?->email }} · {{ $application->community?->name ?? 'Deleted community' }} · {{ $application->created_at->diffForHumans() }}</small>
                    @if($application->answers)<details><summary>View answers</summary><div class="answers">@foreach($application->answers as $question => $answer)<p><b>{{ is_string($question) ? $question : 'Answer '.($loop->index + 1) }}</b><br>{{ is_array($answer) ? implode(', ', $answer) : $answer }}</p>@endforeach</div></details>@endif
                </div>
                <div class="application-actions"><span class="admin-pill {{ $application->status }}">{{ ucfirst($application->status) }}</span>@if($application->status === 'pending')<form method="POST" action="{{ route('admin.applications.review', $application) }}">@csrf<input type="hidden" name="action" value="approve"><button class="mini-btn approve">Approve</button></form><form method="POST" action="{{ route('admin.applications.review', $application) }}">@csrf<input type="hidden" name="action" value="reject"><button class="mini-btn danger">Reject</button></form>@endif</div>
            </article>
        @empty<div class="empty-cell">No community applications yet.</div>@endforelse
        </div>
    </section>
    <dialog class="admin-dialog" id="newCommunity"><form method="POST" action="{{ route('admin.communities.store') }}" class="admin-form">@csrf<div class="dialog-heading"><div><h2>New community</h2><p>Create a space members can discover and apply to join.</p></div><button type="button" onclick="this.closest('dialog').close()">×</button></div><label>Name<input name="name" required></label><label>Description<textarea name="description"></textarea></label><label>Rules<textarea name="rules"></textarea></label><label>Image URL<input name="image" type="url"></label><label>Owner<select name="admin_id"><option value="">Unassigned</option>@foreach($admins as $admin)<option value="{{ $admin->id }}">{{ $admin->name }}</option>@endforeach</select></label><button class="btn btn-primary" type="submit">Create community</button></form></dialog>
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
