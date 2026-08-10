<!doctype html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width,initial-scale=1">
    <title>Admin sign in · {{ config('branding.product_name') }}</title>
    <style>
        :root{font-family:Inter,system-ui,sans-serif;color:#101828;background:#f5f7fa}*{box-sizing:border-box}body{margin:0;min-height:100vh;display:grid;place-items:center;padding:24px;background:radial-gradient(circle at top right,#fff0f3 0,transparent 32%),#f5f7fa}.login{width:100%;max-width:430px;background:#fff;border:1px solid #e5e9ef;border-radius:24px;padding:34px;box-shadow:0 20px 60px rgba(11,31,58,.12)}.brand{display:flex;align-items:center;justify-content:center;padding-bottom:8px}.brand img{display:block;width:min(230px,75%);height:78px;object-fit:contain}h1{margin:24px 0 7px;font-size:28px;color:#0b1f3a}p{color:#667085;margin:0 0 24px;line-height:1.5}label{display:grid;gap:7px;margin-top:16px;font-size:13px;font-weight:750;color:#344054}input{width:100%;height:49px;border:1px solid #d8dee8;border-radius:12px;padding:0 13px;font:inherit;outline:none;transition:border-color .2s,box-shadow .2s}input:focus{border-color:#173a63;box-shadow:0 0 0 3px rgba(23,58,99,.1)}.password-wrap{position:relative}.password-wrap input{padding-right:54px}.toggle-password{position:absolute;right:7px;top:50%;transform:translateY(-50%);width:40px;height:36px;margin:0;border:0;border-radius:9px;background:transparent;color:#475467;display:grid;place-items:center;cursor:pointer}.toggle-password:hover{background:#f2f4f7}.toggle-password svg{width:20px;height:20px}.remember{display:flex;align-items:center;gap:9px;font-weight:600;color:#475467}.remember input{width:16px;height:16px;accent-color:#0b1f3a}.submit{width:100%;height:50px;border:0;border-radius:13px;background:#0b1f3a;color:#fff;font-weight:800;margin-top:24px;cursor:pointer;transition:background .2s,opacity .2s}.submit:hover{background:#173a63}.submit:disabled{cursor:wait;opacity:.7}.message{display:none;padding:12px;border-radius:10px;margin-bottom:14px;font-size:13px;line-height:1.45}.message.show{display:block}.message.error{background:#fbe8eb;color:#9f1d2d}.message.success{background:#eaf8ef;color:#166534}@media(max-width:480px){.login{padding:27px 22px}.brand img{height:68px}}
    </style>
</head>
<body>
<main class="login">
    <div class="brand"><img src="{{ asset('images/brand-logo.png') }}" alt="{{ config('branding.name') }}"></div>
    <h1>Welcome back</h1>
    <p>Sign in with your administrator account to manage {{ config('branding.product_name') }}.</p>
    <div id="form-message" class="message{{ $errors->any() ? ' error show' : '' }}" role="alert" aria-live="polite">{{ $errors->first() }}</div>
    <form id="login-form" method="POST" action="{{ route('admin.login') }}">
        @csrf
        <label>Email address<input type="email" name="email" value="{{ old('email') }}" autocomplete="username" required autofocus></label>
        <label>Password
            <span class="password-wrap">
                <input id="password" type="password" name="password" autocomplete="current-password" required>
                <button id="toggle-password" class="toggle-password" type="button" aria-label="Show password" aria-pressed="false">
                    <svg id="eye-open" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z"/><circle cx="12" cy="12" r="3"/></svg>
                </button>
            </span>
        </label>
        <label class="remember"><input type="checkbox" name="remember" value="1"> Keep me signed in</label>
        <button id="submit-button" class="submit" type="submit">Sign in</button>
    </form>
</main>
<script>
    const form = document.getElementById('login-form');
    const password = document.getElementById('password');
    const togglePassword = document.getElementById('toggle-password');
    const message = document.getElementById('form-message');
    const submitButton = document.getElementById('submit-button');

    togglePassword.addEventListener('click', () => {
        const isVisible = password.type === 'text';
        password.type = isVisible ? 'password' : 'text';
        togglePassword.setAttribute('aria-label', isVisible ? 'Show password' : 'Hide password');
        togglePassword.setAttribute('aria-pressed', String(!isVisible));
        password.focus();
    });

    form.addEventListener('submit', async (event) => {
        event.preventDefault();
        message.className = 'message';
        message.textContent = '';
        submitButton.disabled = true;
        submitButton.textContent = 'Signing in…';

        try {
            const response = await fetch(form.action, {
                method: 'POST',
                body: new FormData(form),
                headers: {'Accept': 'application/json', 'X-Requested-With': 'XMLHttpRequest'},
            });
            const data = await response.json();

            if (!response.ok) {
                const validationError = data.errors ? Object.values(data.errors).flat()[0] : null;
                throw new Error(validationError || data.message || 'Unable to sign in. Please try again.');
            }

            message.textContent = 'Sign-in successful. Redirecting…';
            message.className = 'message success show';
            window.location.assign(data.redirect);
        } catch (error) {
            message.textContent = error.message || 'Unable to sign in. Please try again.';
            message.className = 'message error show';
            submitButton.disabled = false;
            submitButton.textContent = 'Sign in';
        }
    });
</script>
</body>
</html>
