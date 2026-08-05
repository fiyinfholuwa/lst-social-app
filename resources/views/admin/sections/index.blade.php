@php
    $content = [
        'overview' => ['Overview', 'Monitor your entire LST Social workspace.', ['Total members' => '12,849', 'Active communities' => '184', 'Quiz completions' => '2,410', 'Open reports' => '8']],
        'members' => ['Members', 'Manage accounts, roles, access and membership status.', ['Total members' => '12,849', 'Active today' => '3,204', 'New this week' => '418', 'Restricted' => '16']],
        'communities' => ['Communities', 'Create spaces and manage their rules, owners and visibility.', ['Active communities' => '184', 'Private' => '72', 'Pending approval' => '9', 'Archived' => '14']],
        'posts' => ['Posts', 'Review, publish and assign required reading across communities.', ['Published' => '18,204', 'Required reading' => '42', 'Drafts' => '31', 'Reported' => '5']],
        'quizzes' => ['Quizzes', 'Control questions, answers, timers, attempts and pass requirements.', ['Published quizzes' => '28', 'Drafts' => '5', 'Completions' => '2,410', 'Average pass rate' => '84%']],
        'moderation' => ['Moderation', 'Review reported content, member appeals and safety actions.', ['Open reports' => '8', 'High priority' => '3', 'Resolved today' => '14', 'Average response' => '18m']],
        'analytics' => ['Analytics', 'Understand growth, engagement and learning outcomes.', ['Monthly active users' => '9,482', 'Engagement rate' => '74%', 'Quiz pass rate' => '84%', 'Member growth' => '+12.5%']],
        'settings' => ['Settings', 'Configure platform access, notifications, branding and security.', ['Administrators' => '6', 'Integrations' => '4', 'Active sessions' => '8', 'Audit events' => '1,204']],
    ];
    [$title, $description, $metrics] = $content[$section];
@endphp
<div class="page-heading"><div><div class="eyebrow">Admin workspace</div><h1>{{ $title }}</h1><p>{{ $description }}</p></div><button class="btn btn-primary">+ Add new</button></div>
<section class="stats">
    @foreach($metrics as $label => $value)
        <article class="card stat"><div class="stat-top"><span class="stat-icon">{{ substr($label, 0, 1) }}</span><span class="trend">Live</span></div><div class="stat-value">{{ $value }}</div><div class="stat-label">{{ $label }}</div></article>
    @endforeach
</section>
<section class="card panel">
    <div class="panel-head"><div><h2>{{ $title }} management</h2><div class="panel-sub">Search, filter, edit and manage all {{ strtolower($title) }} from here.</div></div><button class="text-btn">Export</button></div>
    <div class="quiz-list">
        @foreach(range(1, 4) as $row)
            <div class="quiz"><div><div class="quiz-title"><i class="status {{ $row === 4 ? 'draft' : '' }}"></i>{{ $title }} record {{ $row }}</div><div class="quiz-meta"><span>Updated {{ $row * 8 }} minutes ago</span><span>{{ $row === 4 ? 'Needs attention' : 'Active' }}</span><span>Managed by Admin</span></div></div><div class="quiz-score"><button class="text-btn">Manage →</button></div></div>
        @endforeach
    </div>
</section>
