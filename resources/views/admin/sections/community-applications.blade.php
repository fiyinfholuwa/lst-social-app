@if(session('status'))<div class="admin-notice">{{ session('status') }}</div>@endif
<div class="page-heading">
    <div><div class="eyebrow">Community applications</div><h1>{{ $community->name }}</h1><p>Review applicants without loading the full membership queue.</p></div>
    <a class="mini-btn" href="{{ url('/admin/communities') }}">← Communities</a>
</div>

<section class="application-stats">
    @foreach(['pending' => 'Pending', 'approved' => 'Approved', 'rejected' => 'Rejected'] as $key => $label)
        <a class="application-stat {{ $activeStatus === $key ? 'active' : '' }}" href="{{ route('admin.communities.applications', [$community, 'status' => $key]) }}"><span>{{ $label }}</span><strong>{{ number_format((int) ($statusCounts[$key] ?? 0)) }}</strong></a>
    @endforeach
</section>

<section class="card panel">
    <div class="application-toolbar">
        <div><h2>{{ ucfirst($activeStatus) }} applications</h2><div class="panel-sub">Showing up to 50 records at a time</div></div>
        <form method="GET" action="{{ route('admin.communities.applications', $community) }}"><input type="hidden" name="status" value="{{ $activeStatus }}"><label class="application-search"><span>⌕</span><input type="search" name="search" value="{{ $search }}" placeholder="Search name or email"><button class="mini-btn" type="submit">Search</button></label></form>
    </div>
    <div class="admin-table-wrap"><table class="admin-table applications-table">
        <thead><tr><th>Applicant</th><th>Submitted</th><th>Status</th><th>Actions</th></tr></thead>
        <tbody>
        @forelse($applications as $application)
            <tr>
                <td><div class="table-person"><div class="avatar">{{ strtoupper(substr($application->user?->name ?? '?', 0, 2)) }}</div><div><strong>{{ $application->user?->name ?? 'Deleted member' }}</strong><small>{{ $application->user?->email ?: 'Email unavailable' }}</small></div></div></td>
                <td><strong>{{ $application->created_at->format('d M Y') }}</strong><small>{{ $application->created_at->format('g:i A') }} · {{ $application->created_at->diffForHumans() }}</small></td>
                <td><span class="admin-pill {{ $application->status }}">{{ ucfirst($application->status) }}</span></td>
                <td><div class="application-actions">
                    <button class="mini-btn" type="button" data-view-application data-template="applicationAnswers{{ $application->id }}" data-applicant="{{ $application->user?->name ?? 'Deleted member' }}">View responses</button>
                    @if($application->status === 'pending')<form method="POST" action="{{ route('admin.applications.review', $application) }}">@csrf<input type="hidden" name="action" value="approve"><button class="mini-btn approve">Approve</button></form><form method="POST" action="{{ route('admin.applications.review', $application) }}">@csrf<input type="hidden" name="action" value="reject"><button class="mini-btn danger">Reject</button></form>@endif
                </div>
                @php
                    $visibleAnswers = collect($application->answers ?? [])->reject(
                        fn ($answer) => $answer === null || $answer === '' || $answer === []
                    );
                @endphp
                <template id="applicationAnswers{{ $application->id }}"><div class="response-list">@forelse($visibleAnswers as $question => $answer)<div class="response-item"><span>{{ is_string($question) ? ucfirst(preg_replace('/(?<!^)[A-Z]/', ' $0', $question)) : 'Answer '.($loop->index + 1) }}</span><p>{{ is_array($answer) ? implode(', ', $answer) : ($answer === true ? 'Yes' : ($answer === false ? 'No' : $answer)) }}</p></div>@empty<div class="empty-cell">No responses were submitted.</div>@endforelse</div></template>
                </td>
            </tr>
        @empty<tr><td colspan="4" class="empty-cell">No {{ $activeStatus }} applications match this view.</td></tr>@endforelse
        </tbody>
    </table></div>
    @if($applications->hasPages())<nav class="admin-pagination">@if($applications->previousPageUrl())<a href="{{ $applications->previousPageUrl() }}">← Previous 50</a>@else<span>← Previous 50</span>@endif<strong>Application queue</strong>@if($applications->nextPageUrl())<a href="{{ $applications->nextPageUrl() }}">Next 50 →</a>@else<span>Next 50 →</span>@endif</nav>@endif
</section>

<dialog class="admin-dialog response-dialog" id="applicationResponseDialog">
    <div class="dialog-heading"><div><div class="eyebrow">Application responses</div><h2 id="applicationResponseName">Applicant</h2><p>Review the information submitted with this membership request.</p></div><button type="button" data-close-dialog aria-label="Close">×</button></div>
    <div id="applicationResponseBody"></div>
    <button class="mini-btn response-close" type="button" data-close-dialog>Close responses</button>
</dialog>
