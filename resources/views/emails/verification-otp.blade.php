@extends('emails.layout')

@section('title', 'Verify your LST Social email')

@section('content')
    <div style="color:#d44a62;font-size:12px;font-weight:800;letter-spacing:1.3px;text-transform:uppercase;margin-bottom:10px;">Email verification</div>
    <h1 style="color:#172033;font-size:26px;line-height:34px;margin:0 0 12px;font-weight:800;">Confirm your email address</h1>
    <p style="color:#566176;font-size:15px;line-height:24px;margin:0 0 22px;">Hello {{ $name }}, use the code below to finish verifying your LST Social account.</p>

    <div style="background:#f0f3f9;border:1px solid #dce2ec;border-radius:18px;padding:22px 14px;text-align:center;margin:0 0 22px;">
        <div style="color:#172033;font-size:34px;font-weight:800;letter-spacing:10px;line-height:42px;">{{ $code }}</div>
    </div>

    <p style="color:#566176;font-size:14px;line-height:22px;margin:0;">This code expires in <strong>{{ $expiresInMinutes }} minutes</strong>. If you did not request this code, no action is required.</p>
@endsection
