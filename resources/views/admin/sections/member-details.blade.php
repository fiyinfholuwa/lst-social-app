<div class="page-heading">
    <div><div class="eyebrow">Member profile</div><h1>{{ $member->name }}</h1><p>Review personal information, activity and account access.</p></div>
    <a class="mini-btn" href="{{ url('/admin/members') }}">← Back to members</a>
</div>

<section class="member-page-hero card">
    <div class="avatar">{{ strtoupper(substr($member->name, 0, 2)) }}</div>
    <div><h2>{{ $member->name }} @if($member->email_verified_at)<span title="Verified member">✓</span>@endif</h2><p>{{ $member->email }}</p><span class="account-status {{ $member->suspended_at ? 'suspended' : 'active' }}"><i></i>{{ $member->suspended_at ? 'Suspended' : 'Active account' }}</span></div>
    <div class="member-summary"><div><strong>{{ $member->posts_count }}</strong><span>Posts</span></div><div><strong>{{ $member->comments_count }}</strong><span>Comments</span></div><div><strong>{{ $member->communities_count }}</strong><span>Communities</span></div></div>
</section>

<div class="member-page-grid">
    <section class="card panel"><div class="panel-head"><div><h2>Personal information</h2><div class="panel-sub">Update this member's profile information.</div></div></div>
        <form class="admin-form" method="POST" action="{{ route('admin.members.details', $member) }}">@csrf @method('PATCH')
            <div class="form-grid"><label>Full name<input name="name" value="{{ old('name',$member->name) }}" required></label><label>Email address<input type="email" name="email" value="{{ old('email',$member->email) }}" required></label><label>Phone number<input name="phone_number" value="{{ old('phone_number',$member->phone_number) }}"></label><label>Date of birth<input type="date" name="date_of_birth" value="{{ old('date_of_birth',$member->date_of_birth?->format('Y-m-d')) }}"></label><label>Marital status<input name="marital_status" value="{{ old('marital_status',$member->marital_status) }}"></label><label>Occupation<input name="occupation" value="{{ old('occupation',$member->occupation) }}"></label><label>Workplace<input name="workplace" value="{{ old('workplace',$member->workplace) }}"></label><label>Hobbies<input name="hobbies" value="{{ old('hobbies',$member->hobbies) }}"></label></div>
            <label>Biography<textarea name="bio">{{ old('bio',$member->bio) }}</textarea></label><button class="btn btn-primary">Save member details</button>
        </form>
    </section>
    <aside class="member-page-side">
        <section class="card panel"><h2>Email verification</h2><p>{{ $member->email_verified_at ? 'This email was verified on '.$member->email_verified_at->format('d M Y, H:i').'.' : 'Manually confirm this member’s email address.' }}</p><form method="POST" action="{{ route('admin.members.verification',$member) }}">@csrf @method('PATCH')<input type="hidden" name="verified" value="{{ $member->email_verified_at ? 0 : 1 }}"><button class="mini-btn {{ $member->email_verified_at ? 'danger' : 'approve' }}">{{ $member->email_verified_at ? 'Remove verification' : 'Verify member' }}</button></form></section>
        <section class="card panel"><h2>Account access</h2><form class="admin-form" method="POST" action="{{ route('admin.members.update',$member) }}">@csrf @method('PATCH')<label>Role<select name="role">@foreach(['member','moderator','admin','super_admin'] as $role)<option value="{{ $role }}" @selected(($member->role ?: 'member')===$role)>{{ ucfirst(str_replace('_',' ',$role)) }}</option>@endforeach</select></label><button class="mini-btn">Update role</button></form></section>
        <section class="card panel"><h2>Change password</h2><form class="admin-form" method="POST" action="{{ route('admin.members.password',$member) }}">@csrf @method('PATCH')<label>New password<input type="password" name="password" minlength="8" required></label><label>Confirm password<input type="password" name="password_confirmation" minlength="8" required></label><button class="mini-btn">Change password</button></form></section>
        <section class="card panel danger-panel"><h2>{{ $member->suspended_at ? 'Reactivate account' : 'Suspend account' }}</h2><p>{{ $member->suspended_at ? 'Restore this member’s access.' : 'Sign this member out and prevent further access.' }}</p><form method="POST" action="{{ route('admin.members.suspension',$member) }}">@csrf @method('PATCH')<input type="hidden" name="suspended" value="{{ $member->suspended_at ? 0 : 1 }}"><button class="mini-btn {{ $member->suspended_at ? 'approve' : 'danger' }}">{{ $member->suspended_at ? 'Reactivate member' : 'Suspend member' }}</button></form></section>
        @if(!auth()->user()->is($member))<section class="card panel danger-panel"><h2>Delete member permanently</h2><p>Delete this account and all associated posts, comments, messages, conversations, memberships, reports, sessions, and uploaded media. This cannot be undone.</p><form method="POST" action="{{ route('admin.members.destroy',$member) }}" onsubmit="return confirm('Permanently delete this member and all associated data? This cannot be undone.')">@csrf @method('DELETE')<button class="mini-btn danger">Delete member and data</button></form></section>@endif
        <section class="card panel"><h2>Communities</h2><div class="community-tags">@forelse($member->communities as $community)<span>{{ $community->name }}</span>@empty<span>No communities joined</span>@endforelse</div></section>
    </aside>
</div>
