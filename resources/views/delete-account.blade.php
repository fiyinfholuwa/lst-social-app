@php
    $brandName = \App\Models\PlatformSetting::valueFor('brand_name', config('branding.name'));
    $productName = \App\Models\PlatformSetting::valueFor('product_name', config('branding.product_name'));
    $supportEmail = \App\Models\PlatformSetting::valueFor('support_email', config('branding.support_email'));
@endphp
<!doctype html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width,initial-scale=1">
    <meta name="description" content="Request deletion of your {{ $productName }} account and associated data.">
    <title>Delete your account · {{ $productName }}</title>
    <style>
        :root{--navy:#0b1f3a;--red:#e4002b;--red-dark:#b90022;--ink:#101828;--muted:#667085;--line:#e8e9ed;--white:#fff;--soft:#f7f9fb}
        *{box-sizing:border-box}body{margin:0;color:var(--ink);font-family:Inter,ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;background:var(--soft)}a{color:var(--red-dark)}.wrap{width:min(760px,calc(100% - 32px));margin:auto}.nav{height:88px;display:flex;align-items:center;justify-content:space-between;gap:20px}.brand img{width:178px;height:62px;object-fit:contain;object-position:left center}.back{text-decoration:none;color:var(--navy);font-size:14px;font-weight:750}.card{margin:36px auto 72px;padding:clamp(26px,6vw,54px);background:var(--white);border:1px solid var(--line);border-radius:24px}.eyebrow{color:var(--red);font-size:12px;font-weight:850;letter-spacing:.1em;text-transform:uppercase}h1{color:var(--navy);font-size:clamp(36px,7vw,56px);line-height:1.05;letter-spacing:-.045em;margin:12px 0 20px}h2{color:var(--navy);font-size:21px;margin:34px 0 10px}p,li{color:#475467;font-size:15px;line-height:1.75}ol,ul{padding-left:22px}.button{display:inline-block;margin-top:12px;padding:14px 20px;border-radius:12px;background:var(--red);color:#fff;text-decoration:none;font-weight:800}.button:hover{background:var(--red-dark)}.note{margin-top:28px;padding:16px 18px;border-left:3px solid var(--red);background:#fff0f3;border-radius:0 12px 12px 0}footer{padding:28px 0;border-top:1px solid var(--line);background:var(--white);color:var(--muted);font-size:13px}.footer{display:flex;justify-content:space-between;gap:20px}@media(max-width:600px){.nav{height:76px}.brand img{width:145px}.card{margin-top:20px}.footer{flex-direction:column}}
    </style>
</head>
<body>
<header class="wrap nav"><a class="brand" href="{{ url('/') }}"><img src="{{ asset('images/brand-logo.png') }}" alt="{{ $brandName }}"></a><a class="back" href="{{ url('/') }}">← Back to home</a></header>
<main class="wrap">
    <article class="card">
        <span class="eyebrow">{{ $productName }} account management</span>
        <h1>Delete your account</h1>
        <p>You can permanently delete your {{ $productName }} account and associated data either in the app or by sending us a deletion request.</p>

        <h2>Delete your account in the app</h2>
        <ol>
            <li>Sign in to {{ $productName }}.</li>
            <li>Open your profile settings.</li>
            <li>Select <strong>Delete account</strong> and confirm with your password.</li>
        </ol>

        <h2>Request deletion by email</h2>
        <p>If you cannot access the app, email us from the address registered to your account. Use the subject “Delete my {{ $productName }} account” and include your full name. We may ask you to verify ownership before processing the request.</p>
        <a class="button" href="mailto:{{ $supportEmail }}?subject={{ rawurlencode('Delete my '.$productName.' account') }}">Request account deletion</a>

        <h2>What will be deleted</h2>
        <p>Your account, profile details, authentication tokens, posts, comments, messages, uploaded media and other data associated with your account will be deleted or de-identified from active systems.</p>

        <div class="note"><p><strong>Data that may be retained:</strong> limited records may remain for reasonable backup cycles or where required for legal compliance, fraud prevention, security, dispute resolution or enforcement. Content copied or shared independently by other users may remain outside our control.</p></div>
    </article>
</main>
<footer><div class="wrap footer"><span>© {{ date('Y') }} {{ $brandName }}.</span><span><a href="{{ route('privacy') }}">Privacy Policy</a> · <a href="{{ route('terms') }}">Terms &amp; Conditions</a></span></div></footer>
</body>
</html>
