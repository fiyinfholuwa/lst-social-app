<header class="topbar">
    <button class="icon-btn menu-btn" id="menuBtn" aria-label="Open navigation"><svg class="icon"><path d="M4 7h16M4 12h16M4 17h16"/></svg></button>
    <div class="topbar-title"><strong>Administration</strong><span>Manage your community</span></div>
    <form class="search" method="GET" action="{{ url('/admin/members') }}"><svg class="icon"><circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/></svg><input name="search" type="search" value="{{ request('search') }}" placeholder="Search members by name or email…"></form>
    <div class="top-actions"><a class="icon-btn" href="{{ url('/admin/moderation') }}" aria-label="Moderation queue"><svg class="icon"><path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4"/></svg>@if(\App\Models\SupportRequest::where('status','open')->exists())<i class="dot"></i>@endif</a><div class="avatar">{{ strtoupper(substr(auth()->user()->name,0,2)) }}</div><form method="POST" action="{{ route('admin.logout') }}">@csrf<button class="mini-btn" type="submit">Sign out</button></form></div>
</header>
