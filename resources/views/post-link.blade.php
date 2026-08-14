<!doctype html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="theme-color" content="#54233D">
    <title>Open post in LST Social</title>
    <style>
        * { box-sizing: border-box; }
        body { margin: 0; min-height: 100vh; display: grid; place-items: center; padding: 24px; background: #fcf8fa; color: #281923; font-family: system-ui, sans-serif; }
        main { width: min(100%, 430px); padding: 32px 24px; border: 1px solid #eadde3; border-radius: 24px; background: #fff; text-align: center; box-shadow: 0 18px 50px rgba(84, 35, 61, .12); }
        h1 { margin: 0; font-size: 25px; }
        p { margin: 12px 0 24px; color: #74616d; line-height: 1.55; }
        a { display: block; padding: 15px 18px; border-radius: 14px; background: #ed002b; color: #fff; text-decoration: none; font-weight: 800; }
    </style>
</head>
<body>
<main>
    <h1>LST Social</h1>
    <p>Open this post in the LST Social app.</p>
    <a href="lstsocial://posts/{{ $postId }}">Open post in app</a>
</main>
</body>
</html>
