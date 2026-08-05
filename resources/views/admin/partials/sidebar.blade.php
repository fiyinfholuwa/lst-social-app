@php
    $workspace = ['overview' => '⌂', 'members' => '♙', 'communities' => '◫', 'posts' => '▤', 'quizzes' => '☑'];
    $manage = ['moderation' => '♢', 'analytics' => '⌁', 'settings' => '⚙'];
@endphp
<aside class="sidebar" id="sidebar">
    <div class="brand"><span class="brand-mark">LST</span><span>LST Social</span></div>
    <div class="nav-label">WORKSPACE</div>
    <nav class="nav">
        @foreach($workspace as $key => $symbol)
            <a data-admin-link class="{{ ($section ?? 'overview') === $key ? 'active' : '' }}" href="{{ url('/admin'.($key === 'overview' ? '' : '/'.$key)) }}"><span style="width:19px;text-align:center;font-size:18px">{{ $symbol }}</span>{{ ucfirst($key) }}@if($key === 'quizzes')<span class="badge">5</span>@endif</a>
        @endforeach
    </nav>
    <div class="nav-label" style="margin-top:22px">MANAGE</div>
    <nav class="nav">
        @foreach($manage as $key => $symbol)
            <a data-admin-link class="{{ ($section ?? '') === $key ? 'active' : '' }}" href="{{ url('/admin/'.$key) }}"><span style="width:19px;text-align:center;font-size:18px">{{ $symbol }}</span>{{ ucfirst($key) }}@if($key === 'moderation')<span class="badge">8</span>@endif</a>
        @endforeach
    </nav>
    <div class="admin-card"><div class="avatar">AO</div><div><strong>Amara Okafor</strong><small>Super administrator</small></div></div>
</aside>
