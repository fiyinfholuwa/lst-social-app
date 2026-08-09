<!doctype html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>@yield('title', 'LST Social')</title>
</head>
<body style="margin:0;padding:0;background:#f5f6fa;color:#172033;font-family:Arial,Helvetica,sans-serif;">
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f5f6fa;padding:32px 14px;">
    <tr>
        <td align="center">
            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:560px;">
                <tr>
                    <td style="padding:0 4px 18px;text-align:center;">
                        <img src="{{ config('branding.logo_url') }}" width="190" alt="{{ config('branding.name') }}" style="display:block;width:190px;max-width:65%;height:auto;margin:0 auto;border:0;">
                    </td>
                </tr>
                <tr>
                    <td style="background:#ffffff;border:1px solid #e3e7ef;border-radius:24px;padding:34px 32px;box-shadow:0 10px 30px rgba(23,32,51,.07);">
                        @yield('content')
                    </td>
                </tr>
                <tr>
                    <td style="padding:20px 20px 0;text-align:center;color:#7a8496;font-size:12px;line-height:18px;">
                        This is an automated security email from {{ config('branding.product_name') }}.<br>
                        Please do not share verification codes with anyone.
                    </td>
                </tr>
            </table>
        </td>
    </tr>
</table>
</body>
</html>
