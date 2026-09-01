@php
    $workspace = ['overview', 'members', 'communities', 'posts', 'articles', 'sermons'];
    $labels = ['articles' => 'Learning'];
    $manage = ['notifications', 'moderation', 'analytics', 'settings'];
@endphp
<aside class="sidebar" id="sidebar">
    <a class="brand" href="{{ url('/admin') }}"><img src="{{ asset('images/brand-logo.png') }}" alt="{{ config('branding.name') }}"></a>
    <div class="nav-label">WORKSPACE</div>
    <nav class="nav">
        @foreach($workspace as $key)
            <a data-admin-link class="{{ (($section ?? 'overview') === $key || ($key === 'articles' && ($section ?? '') === 'quizzes')) ? 'active' : '' }}" href="{{ url('/admin'.($key === 'overview' ? '' : '/'.$key)) }}">
                <svg class="icon" aria-hidden="true">@switch($key)@case('overview')<rect x="3" y="3" width="7" height="7" rx="2"/><rect x="14" y="3" width="7" height="7" rx="2"/><rect x="3" y="14" width="7" height="7" rx="2"/><rect x="14" y="14" width="7" height="7" rx="2"/>@break @case('members')<circle cx="9" cy="8" r="4"/><path d="M2 21c.8-4 3.1-6 7-6s6.2 2 7 6M17 5c2.5.6 4 2.2 4 4.5S19.5 13.4 17 14"/>@break @case('communities')<path d="M4 21v-9l8-6 8 6v9M9 21v-6h6v6M7 8V4h3v2"/>@break @case('posts')<path d="M5 3h11l3 3v15H5zM8 10h8M8 14h8M8 18h5"/>@break @default<path d="M9 11l2 2 4-5M4 3h16v18H4zM8 17h8"/>@endswitch</svg>
                <span>{{ $labels[$key] ?? ucfirst($key) }}</span>@if($key === 'articles' && (\App\Models\LearningArticle::where('status','draft')->count() + \App\Models\Quiz::where('status','draft')->count()))<span class="badge">{{ \App\Models\LearningArticle::where('status','draft')->count() + \App\Models\Quiz::where('status','draft')->count() }}</span>@endif
            </a>
        @endforeach
    </nav>
    <div class="nav-label nav-label-spaced">MANAGE</div>
    <nav class="nav">
        @foreach($manage as $key)
            <a data-admin-link class="{{ ($section ?? '') === $key ? 'active' : '' }}" href="{{ url('/admin/'.$key) }}">
                <svg class="icon" aria-hidden="true">@switch($key)@case('notifications')<path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4"/>@break @case('moderation')<path d="M12 3 4 6v5c0 5.1 3.4 8.7 8 10 4.6-1.3 8-4.9 8-10V6zM9 12l2 2 4-5"/>@break @case('analytics')<path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/>@break @default<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1-2.8 2.8-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.6v.2h-4V21a1.7 1.7 0 0 0-1-1.6 1.7 1.7 0 0 0-1.9.3l-.1.1L4.2 17l.1-.1a1.7 1.7 0 0 0 .3-1.9A1.7 1.7 0 0 0 3 14H2.8v-4H3a1.7 1.7 0 0 0 1.6-1 1.7 1.7 0 0 0-.3-1.9L4.2 7 7 4.2l.1.1a1.7 1.7 0 0 0 1.9.3A1.7 1.7 0 0 0 10 3V2.8h4V3a1.7 1.7 0 0 0 1 1.6 1.7 1.7 0 0 0 1.9-.3l.1-.1L19.8 7l-.1.1a1.7 1.7 0 0 0-.3 1.9 1.7 1.7 0 0 0 1.6 1h.2v4H21a1.7 1.7 0 0 0-1.6 1z"/>@endswitch</svg>
                <span>{{ ucfirst($key) }}</span>@if($key === 'moderation' && (($reportCount = \App\Models\ContentReport::where('status','pending')->count()) + ($supportCount = \App\Models\SupportRequest::where('status','open')->count())))<span class="badge">{{ $reportCount + $supportCount }}</span>@endif
            </a>
        @endforeach
    </nav>
    <div class="admin-card"><div class="avatar">{{ strtoupper(substr(auth()->user()->name,0,2)) }}</div><div class="admin-identity"><strong>{{ auth()->user()->name }}</strong><small>{{ ucfirst(str_replace('_',' ',auth()->user()->role)) }}</small></div></div>
</aside>
