@php
    $media = collect($post->images ?: [])->filter()->values();
    if ($post->image && !$media->contains($post->image)) $media->prepend($post->image);
@endphp
<div class="page-heading"><div><h1>Review post</h1><p>Complete content and moderation information.</p></div><a class="mini-btn" href="{{ url('/admin/posts') }}">← Back to posts</a></div>

<div class="post-detail-layout">
    <main class="card post-detail-card">
        <header class="post-author"><div class="avatar">{{ strtoupper(substr($post->user?->name ?? '?',0,2)) }}</div><div><strong>{{ $post->user?->name ?? 'Deleted member' }}</strong><span>{{ $post->user?->email ?? 'Account unavailable' }}</span></div><span class="admin-pill {{ $post->status }}">{{ ucfirst($post->status) }}</span></header>
        <div class="post-context"><span><b>Community</b>{{ $post->community?->name ?? 'Timeline' }}</span>@if($post->type && $post->type !== 'Community post')<span><b>Type</b>{{ $post->type }}</span>@endif @if($post->audience && $post->audience !== $post->community?->name)<span><b>Visibility</b>{{ $post->audience }}</span>@endif</div>
        <div class="post-full-content">{!! nl2br(e($post->content ?: 'This post contains media only.')) !!}</div>
        @if($media->isNotEmpty())<div class="post-media {{ $media->count() > 1 ? 'multiple' : '' }}">@foreach($media as $image)<a href="{{ $image }}" target="_blank" rel="noopener"><img src="{{ $image }}" alt="Post media {{ $loop->iteration }}"></a>@endforeach</div>@endif
        @if($post->originalPost)<div class="original-post"><span>Reposted from {{ $post->originalPost->user?->name ?? 'Deleted member' }}</span><p>{{ $post->originalPost->content }}</p></div>@endif
        <div class="post-engagement"><span><strong>{{ number_format($post->likes_count) }}</strong> Likes</span><span><strong>{{ number_format($post->comments_count) }}</strong> Comments</span><span><strong>{{ number_format($post->shares_count) }}</strong> Reposts</span></div>
        <section class="post-comments"><div class="panel-head"><div><h2>Comments</h2><div class="panel-sub">All responses on this post</div></div></div>@forelse($post->comments as $comment)<article><div class="avatar">{{ strtoupper(substr($comment->user?->name ?? '?',0,2)) }}</div><div><strong>{{ $comment->user?->name ?? 'Deleted member' }}</strong><time>{{ $comment->created_at->diffForHumans() }}</time><p>{{ $comment->text }}</p><small>{{ $comment->likes_count }} like{{ $comment->likes_count===1?'':'s' }}</small></div></article>@empty<div class="empty-cell">No comments on this post.</div>@endforelse</section>
    </main>
    <aside class="post-detail-side">
        <section class="card panel"><h2>Moderation</h2><div class="post-status-block"><span>Current status</span><strong class="admin-pill {{ $post->status }}">{{ ucfirst($post->status) }}</strong></div>@if($post->status === 'pending')<div class="post-review-actions"><form method="POST" action="{{ route('admin.posts.review',$post) }}">@csrf<input type="hidden" name="action" value="approve"><button class="btn approve">Approve post</button></form><form method="POST" action="{{ route('admin.posts.review',$post) }}">@csrf<input type="hidden" name="action" value="reject"><button class="btn danger-bg">Reject post</button></form></div>@else<p class="panel-sub">This post has already been reviewed.</p>@endif</section>
        <section class="card panel"><h2>Post information</h2><div class="post-metadata"><div><span>Post ID</span><strong>#{{ $post->id }}</strong></div><div><span>Published</span><strong>{{ $post->created_at->format('d M Y, H:i') }}</strong></div><div><span>Last updated</span><strong>{{ $post->updated_at->format('d M Y, H:i') }}</strong></div><div><span>Community</span><strong>{{ $post->community?->name ?? 'None' }}</strong></div><div><span>Visibility</span><strong>{{ $post->audience }}</strong></div><div><span>Content type</span><strong>{{ $post->type }}</strong></div></div></section>
        <section class="card panel"><h2>Author</h2><div class="post-metadata"><div><span>Name</span><strong>{{ $post->user?->name ?? 'Deleted member' }}</strong></div><div><span>Email</span><strong>{{ $post->user?->email ?? 'Unavailable' }}</strong></div>@if($post->user)<a class="mini-btn" href="{{ route('admin.members.show',$post->user) }}">View member profile</a>@endif</div></section>
    </aside>
</div>
