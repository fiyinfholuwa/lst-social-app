<header class="topbar">
    <button class="icon-btn menu-btn" id="menuBtn" aria-label="Toggle navigation" aria-controls="sidebar" aria-expanded="true"><svg class="icon"><path d="M4 7h16M4 12h16M4 17h16"/></svg></button>
    <div class="topbar-title"><strong>Administration</strong><span>Manage your community</span></div>
    <div class="top-actions"><div class="avatar">{{ strtoupper(substr(auth()->user()->name,0,2)) }}</div><form method="POST" action="{{ route('admin.logout') }}">@csrf<button class="mini-btn" type="submit">Sign out</button></form></div>
</header>
