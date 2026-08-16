<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="csrf-token" content="{{ csrf_token() }}">
    <title>Admin overview · LST Social</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Manrope:wght@600;700;800&display=swap" rel="stylesheet">
    <style>
        :root{--navy:#0b1f3a;--navy-2:#173a63;--red:#d62839;--red-soft:#fbe8eb;--bg:#f6f7f9;--surface:#fff;--ink:#101828;--muted:#667085;--line:#e6e9ee;--green:#15803d;--green-soft:#eaf8ef;--amber:#b45309;--amber-soft:#fff7e6;--shadow:0 12px 36px rgba(16,24,40,.07)}
        *{box-sizing:border-box}body{margin:0;background:var(--bg);color:var(--ink);font-family:'DM Sans',sans-serif;font-size:14px}.icon{width:19px;height:19px;fill:none;stroke:currentColor;stroke-width:1.8;stroke-linecap:round;stroke-linejoin:round}.app{min-height:100vh;display:grid;grid-template-columns:248px 1fr}.sidebar{position:fixed;inset:0 auto 0 0;width:248px;background:var(--navy);color:#fff;padding:24px 16px;display:flex;flex-direction:column;z-index:30}.brand{display:flex;align-items:center;gap:11px;padding:0 10px 27px;font:800 20px 'Manrope',sans-serif}.brand-mark{width:34px;height:34px;border-radius:11px;background:var(--red);display:grid;place-items:center;font-size:14px;box-shadow:0 6px 16px rgba(214,40,57,.32)}.nav-label{padding:0 12px;margin:5px 0 8px;color:#8fa0b7;font-size:10px;font-weight:700;letter-spacing:.12em}.nav{display:grid;gap:4px}.nav a{display:flex;align-items:center;gap:12px;padding:11px 12px;border-radius:10px;color:#cbd5e1;text-decoration:none;font-weight:500}.nav a:hover,.nav a.active{background:rgba(255,255,255,.1);color:#fff}.nav a.active{box-shadow:inset 3px 0 var(--red)}.nav .badge{margin-left:auto;background:var(--red);font-size:10px;min-width:20px;height:20px;border-radius:10px;display:grid;place-items:center;color:white}.admin-card{margin-top:auto;border-top:1px solid rgba(255,255,255,.1);padding:18px 8px 0;display:flex;align-items:center;gap:10px}.avatar{width:36px;height:36px;border-radius:50%;background:#dbe7f5;color:var(--navy);display:grid;place-items:center;font-weight:800;flex:0 0 auto}.admin-card strong{font-size:13px;display:block}.admin-card small{color:#8fa0b7}.main{grid-column:2;min-width:0}.topbar{height:76px;background:rgba(255,255,255,.91);backdrop-filter:blur(14px);border-bottom:1px solid var(--line);display:flex;align-items:center;padding:0 34px;gap:20px;position:sticky;top:0;z-index:20}.menu-btn{display:none}.search{height:42px;max-width:430px;flex:1;position:relative}.search .icon{position:absolute;left:14px;top:11px;color:#98a2b3}.search input{width:100%;height:100%;border:1px solid var(--line);background:#f9fafb;border-radius:12px;padding:0 16px 0 43px;outline:none}.search input:focus{border-color:var(--navy-2);box-shadow:0 0 0 3px #e8eef6}.top-actions{margin-left:auto;display:flex;align-items:center;gap:8px}.icon-btn{border:1px solid var(--line);background:white;width:40px;height:40px;border-radius:11px;display:grid;place-items:center;cursor:pointer;position:relative}.dot{width:7px;height:7px;background:var(--red);border:2px solid white;box-sizing:content-box;border-radius:50%;position:absolute;right:8px;top:7px}.content{padding:30px 34px 48px;max-width:1600px;margin:auto}.page-heading{display:flex;justify-content:space-between;align-items:flex-end;gap:20px;margin-bottom:25px}.eyebrow{font-size:11px;color:var(--red);font-weight:800;letter-spacing:.11em;text-transform:uppercase;margin-bottom:6px}.page-heading h1{font:800 28px/1.2 'Manrope';margin:0 0 5px}.page-heading p{margin:0;color:var(--muted)}.btn{border:0;border-radius:11px;height:42px;padding:0 16px;font-weight:700;display:inline-flex;align-items:center;justify-content:center;gap:8px;cursor:pointer}.btn-primary{background:var(--red);color:white;box-shadow:0 6px 15px rgba(214,40,57,.2)}.stats{display:grid;grid-template-columns:repeat(4,1fr);gap:16px;margin-bottom:22px}.card{background:var(--surface);border:1px solid var(--line);border-radius:16px;box-shadow:0 2px 8px rgba(16,24,40,.025)}.stat{padding:19px}.stat-top{display:flex;justify-content:space-between;align-items:start}.stat-icon{width:39px;height:39px;border-radius:11px;background:#edf2f8;color:var(--navy);display:grid;place-items:center}.stat-icon.red{background:var(--red-soft);color:var(--red)}.stat-value{font:800 27px 'Manrope';margin:16px 0 3px}.stat-label{color:var(--muted);font-size:12px}.trend{color:var(--green);background:var(--green-soft);padding:4px 7px;border-radius:20px;font-size:10px;font-weight:700}.grid{display:grid;grid-template-columns:minmax(0,1.65fr) minmax(300px,.8fr);gap:20px}.panel{padding:21px}.panel-head{display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:18px}.panel h2{font:800 17px 'Manrope';margin:0}.panel-sub{font-size:12px;color:var(--muted);margin-top:4px}.text-btn{color:var(--navy-2);background:none;border:0;font-weight:700;cursor:pointer}.quiz-list{display:grid;gap:10px}.quiz{border:1px solid var(--line);border-radius:13px;padding:15px;display:grid;grid-template-columns:1fr auto;gap:12px;transition:.2s}.quiz:hover{border-color:#cad4e2;transform:translateY(-1px)}.quiz-title{display:flex;gap:10px;align-items:center;font-weight:700}.status{width:8px;height:8px;border-radius:50%;background:#22c55e}.status.draft{background:#f59e0b}.quiz-meta{margin:8px 0 0 18px;display:flex;flex-wrap:wrap;gap:12px;color:var(--muted);font-size:11px}.quiz-score{text-align:right}.quiz-score strong{display:block;font:800 18px 'Manrope';color:var(--navy)}.quiz-score small{color:var(--muted)}.progress{height:6px;background:#edf0f4;border-radius:8px;margin-top:10px;overflow:hidden}.progress span{display:block;height:100%;border-radius:8px;background:var(--navy-2)}.quick-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:10px}.quick{border:1px solid var(--line);background:white;border-radius:12px;padding:13px;text-align:left;cursor:pointer}.quick .icon{color:var(--red);margin-bottom:9px}.quick strong{display:block;font-size:12px}.quick small{color:var(--muted);font-size:10px}.activity{display:grid;gap:16px}.activity-item{display:grid;grid-template-columns:33px 1fr;gap:10px;align-items:start}.activity-item .avatar{width:33px;height:33px;font-size:10px}.activity-item p{font-size:12px;margin:1px 0 3px;line-height:1.45}.activity-item time{font-size:10px;color:#98a2b3}.lower{display:grid;grid-template-columns:1.15fr 1fr;gap:20px;margin-top:20px}.bars{height:180px;display:flex;align-items:flex-end;justify-content:space-between;gap:12px;padding-top:20px;border-bottom:1px solid var(--line)}.bar-group{height:100%;flex:1;display:flex;flex-direction:column;justify-content:flex-end;align-items:center;gap:7px;color:var(--muted);font-size:10px}.bar{width:min(29px,80%);background:linear-gradient(var(--navy-2),var(--navy));border-radius:6px 6px 2px 2px;min-height:8px}.moderation{display:grid;gap:9px}.mod-row{border:1px solid var(--line);border-radius:12px;padding:13px;display:flex;align-items:center;gap:11px}.mod-icon{width:35px;height:35px;border-radius:10px;background:var(--amber-soft);color:var(--amber);display:grid;place-items:center}.mod-info{min-width:0;flex:1}.mod-info strong{display:block;font-size:12px}.mod-info small{color:var(--muted);font-size:10px}.pill{padding:5px 8px;border-radius:20px;background:var(--red-soft);color:var(--red);font-size:10px;font-weight:700}.mobile-overlay{display:none}
        .admin-notice{margin-bottom:18px;padding:13px 16px;border-radius:12px;background:var(--green-soft);color:var(--green);font-weight:700}.admin-notice.error{background:var(--red-soft);color:var(--red)}.admin-table-wrap{overflow:auto}.admin-table{width:100%;border-collapse:collapse}.admin-table th{text-align:left;color:var(--muted);font-size:11px;text-transform:uppercase;letter-spacing:.06em;padding:11px;border-bottom:1px solid var(--line)}.admin-table td{padding:13px 11px;border-bottom:1px solid var(--line);vertical-align:middle}.admin-table td small{display:block;color:var(--muted);margin-top:3px}.admin-pill{display:inline-flex;padding:5px 9px;border-radius:99px;background:#edf2f8;color:var(--navy-2);font-size:10px;font-weight:800}.admin-pill.pending{background:var(--amber-soft);color:var(--amber)}.admin-pill.approved{background:var(--green-soft);color:var(--green)}.admin-pill.rejected{background:var(--red-soft);color:var(--red)}.row-actions,.row-actions form,.application-actions,.application-filter-actions{display:flex;align-items:center;gap:7px}.row-actions select,.admin-form input,.admin-form textarea,.admin-form select{border:1px solid var(--line);border-radius:10px;background:white;color:var(--ink);padding:10px;font:inherit}.mini-btn{border:1px solid var(--line);background:white;color:var(--navy-2);padding:8px 10px;border-radius:9px;font-weight:700;cursor:pointer;text-decoration:none}.mini-btn.approve{background:var(--green-soft);color:var(--green);border-color:transparent}.mini-btn.danger,.text-danger{color:var(--red)}.text-danger{border:0;background:none;padding:10px 0;cursor:pointer;font-weight:700}.empty-cell{text-align:center;color:var(--muted);padding:35px}.community-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:14px}.community-admin-card{border:1px solid var(--line);border-radius:14px;padding:16px}.community-admin-head{display:flex;justify-content:space-between;gap:15px}.community-admin-head h3{margin:0;font:800 15px Manrope}.community-admin-head p{color:var(--muted);font-size:12px;line-height:18px;margin:5px 0}.community-meta{display:flex;gap:14px;color:var(--muted);font-size:11px;margin:10px 0}.manage-applications-link{display:flex;align-items:center;justify-content:space-between;margin:10px 0;color:var(--navy-2);text-decoration:none;font-size:12px;font-weight:800}.manage-applications-link span{min-width:24px;height:24px;padding:0 7px;border-radius:12px;background:var(--amber-soft);color:var(--amber);display:grid;place-items:center}.community-admin-card summary{display:inline-block;list-style:none;cursor:pointer}.admin-form{display:grid;gap:13px}.admin-form.compact{margin-top:12px;padding:14px;background:var(--bg);border-radius:12px}.admin-form label{display:grid;gap:6px;font-size:11px;font-weight:700;color:var(--muted)}.admin-form label small{font-weight:500}.admin-form textarea{min-height:72px;resize:vertical}.community-image-preview{width:100%;height:150px;object-fit:cover;border-radius:12px;border:1px solid var(--line)}.admin-section-gap{margin-top:20px}.application-list{display:grid}.application-row{display:flex;align-items:flex-start;gap:12px;padding:14px 0;border-bottom:1px solid var(--line)}.application-copy{flex:1;min-width:0}.application-copy small{display:block;color:var(--muted);font-size:11px;margin-top:4px}.application-copy details{margin-top:9px;color:var(--navy-2);font-size:11px}.answers{color:var(--ink);padding:5px 12px}.admin-dialog{border:1px solid var(--line);border-radius:22px;width:min(520px,calc(100% - 30px));padding:22px;box-shadow:var(--shadow)}.admin-dialog::backdrop{background:rgba(11,31,58,.55)}.dialog-heading{display:flex;justify-content:space-between;gap:16px}.dialog-heading h2{margin:0;font:800 21px Manrope}.dialog-heading p{color:var(--muted);margin:5px 0 15px}.dialog-heading button{border:0;background:none;font-size:27px;cursor:pointer}.admin-dialog .btn{width:100%}.dialog-actions{display:grid;grid-template-columns:1fr 1fr;gap:10px}.danger-bg{background:var(--red)}
        .community-card-main{display:flex;gap:12px;align-items:flex-start}.community-card-thumb,.community-card-placeholder{width:58px;height:58px;border-radius:12px;flex:0 0 auto}.community-card-thumb{object-fit:cover}.community-card-placeholder{display:grid;place-items:center;background:#edf2f8;color:var(--navy);font:800 20px Manrope}.community-card-main .community-admin-head{flex:1}.community-card-actions{display:flex;align-items:center;justify-content:space-between;gap:12px;border-top:1px solid var(--line);padding-top:10px;margin-top:10px}.community-card-actions .manage-applications-link{flex:1;margin:0}.admin-pagination{display:flex;align-items:center;justify-content:space-between;gap:12px;margin-top:20px;padding-top:16px;border-top:1px solid var(--line)}.admin-pagination a,.admin-pagination span{padding:9px 12px;border:1px solid var(--line);border-radius:9px;text-decoration:none;color:var(--navy-2);font-size:11px;font-weight:700}.admin-pagination span{color:#a0a5ad}.admin-pagination strong{font-size:11px}.application-stats{display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin-bottom:18px}.application-stat{display:flex;align-items:center;justify-content:space-between;padding:16px 18px;border:1px solid var(--line);border-radius:14px;background:white;color:var(--muted);text-decoration:none}.application-stat strong{font:800 22px Manrope;color:var(--ink)}.application-stat.active{border-color:var(--navy-2);box-shadow:inset 0 0 0 1px var(--navy-2)}.application-toolbar{display:flex;align-items:center;justify-content:space-between;gap:18px;margin-bottom:10px}.application-toolbar h2{margin:0}.application-search{display:flex;align-items:center;gap:7px}.application-search input{width:260px;height:38px;border:1px solid var(--line);border-radius:9px;padding:0 11px;font:inherit}.application-search span{color:var(--muted);font-size:20px}
        .applications-table td{height:72px}.applications-table th:last-child,.applications-table td:last-child{text-align:right}.table-person{display:flex;align-items:center;gap:10px}.table-person .avatar{width:38px;height:38px;font-size:10px}.application-actions{justify-content:flex-end;white-space:nowrap}.response-dialog{width:min(620px,calc(100% - 30px));max-height:min(760px,calc(100vh - 40px));overflow:auto}.response-list{display:grid;gap:10px;margin-top:6px}.response-item{padding:13px 14px;border:1px solid var(--line);border-radius:12px;background:var(--bg)}.response-item span{display:block;color:var(--muted);font-size:10px;font-weight:800;text-transform:uppercase;letter-spacing:.05em}.response-item p{margin:6px 0 0;font-size:13px;line-height:20px;white-space:pre-wrap}.response-close{width:100%;margin-top:18px;min-height:44px}.community-card-main{display:flex;gap:12px;align-items:flex-start}.community-card-thumb,.community-card-placeholder{width:58px;height:58px;border-radius:12px;flex:0 0 auto}.community-card-thumb{object-fit:cover}.community-card-placeholder{display:grid;place-items:center;background:#edf2f8;color:var(--navy);font:800 20px Manrope}.community-card-main .community-admin-head{flex:1}.community-card-actions{display:flex;align-items:center;justify-content:space-between;gap:12px;border-top:1px solid var(--line);padding-top:10px;margin-top:10px}.community-card-actions .manage-applications-link{flex:1;margin:0}.admin-pagination{display:flex;align-items:center;justify-content:space-between;gap:12px;margin-top:20px;padding-top:16px;border-top:1px solid var(--line)}.admin-pagination a,.admin-pagination span{padding:9px 12px;border:1px solid var(--line);border-radius:9px;text-decoration:none;color:var(--navy-2);font-size:11px;font-weight:700}.admin-pagination span{color:#a0a5ad}.admin-pagination strong{font-size:11px}.application-stats{display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin-bottom:18px}.application-stat{display:flex;align-items:center;justify-content:space-between;padding:16px 18px;border:1px solid var(--line);border-radius:14px;background:white;color:var(--muted);text-decoration:none}.application-stat strong{font:800 22px Manrope;color:var(--ink)}.application-stat.active{border-color:var(--navy-2);box-shadow:inset 0 0 0 1px var(--navy-2)}.application-toolbar{display:flex;align-items:center;justify-content:space-between;gap:18px;margin-bottom:10px}.application-toolbar h2{margin:0}.application-search{display:flex;align-items:center;gap:7px}.application-search input{width:260px;height:38px;border:1px solid var(--line);border-radius:9px;padding:0 11px;font:inherit}.application-search span{color:var(--muted);font-size:20px}
        .applications-table{min-width:760px}.applications-table .application-actions{width:auto;padding-left:0;justify-content:flex-end}
        @media(max-width:1050px){.stats{grid-template-columns:repeat(2,1fr)}.grid{grid-template-columns:1fr}.quick-grid{grid-template-columns:repeat(4,1fr)}.lower{grid-template-columns:1fr 1fr}.community-grid{grid-template-columns:1fr}}
        @media(max-width:760px){.app{display:block}.sidebar{transform:translateX(-105%);transition:.25s}.sidebar.open{transform:translateX(0)}.mobile-overlay.show{display:block;position:fixed;inset:0;background:rgba(7,20,38,.52);z-index:25}.main{width:100%}.topbar{height:66px;padding:0 16px}.menu-btn{display:grid}.search{max-width:none}.search input{font-size:16px}.content{padding:22px 16px 35px}.page-heading{align-items:start}.page-heading h1{font-size:23px}.page-heading p{font-size:12px}.page-heading .btn span{display:none}.stats{grid-template-columns:repeat(2,1fr);gap:10px}.stat{padding:15px}.stat-value{font-size:23px}.grid,.lower{grid-template-columns:1fr}.quick-grid{grid-template-columns:repeat(2,1fr)}.application-row{flex-wrap:wrap}.application-actions{width:100%;padding-left:48px}.row-actions{align-items:flex-start;flex-direction:column}.application-stats{grid-template-columns:1fr}.application-toolbar{align-items:stretch;flex-direction:column}.application-search input{width:100%;min-width:0}.application-toolbar form{width:100%}.application-search{width:100%}.admin-pagination strong{display:none}}
        .form-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px}.quiz-question{border:1px solid var(--line);border-radius:14px;padding:15px;margin:14px 0}.quiz-question legend{font-weight:800;padding:0 7px}.panel details{margin:10px 0}.panel details>summary{cursor:pointer}.top-actions form{margin:0}.top-actions a{text-decoration:none}.admin-form input[type=checkbox]{width:auto;height:auto;margin-right:7px}
        @media(max-width:430px){.topbar .search{display:none}.stats{grid-template-columns:1fr 1fr}.stat-label{font-size:11px}.stat-icon{width:34px;height:34px}.trend{display:none}.panel{padding:16px}.quiz{grid-template-columns:1fr}.quiz-score{text-align:left;display:flex;gap:5px;align-items:baseline}.quiz-meta{gap:7px}.page-heading{margin-bottom:19px}.form-grid{grid-template-columns:1fr}}

        /* Refined admin interface */
        :root{--navy:#14213d;--navy-2:#243b64;--red:#d62839;--bg:#f4f6f9;--line:#e4e8ef;--shadow:0 16px 40px rgba(20,33,61,.08)}
        body{background:var(--bg);font-size:14px}.app{grid-template-columns:276px minmax(0,1fr)}.sidebar{width:276px;background:#fff;color:var(--ink);padding:22px 18px;border-right:1px solid var(--line);box-shadow:4px 0 24px rgba(20,33,61,.025)}.brand{height:68px;padding:0 10px 18px;text-decoration:none;border-bottom:1px solid #edf0f4;margin-bottom:22px}.brand img{display:block;width:180px;height:54px;object-fit:contain;object-position:left center}.nav-label{color:#98a2b3;padding:0 13px;margin-bottom:8px;font-size:10px}.nav-label-spaced{margin-top:27px}.nav{gap:5px}.nav a{min-height:45px;padding:0 13px;color:#536174;border-radius:12px;font-weight:600;position:relative}.nav a .icon{width:20px;height:20px;color:#7a8798;flex:0 0 auto}.nav a:hover{background:#f7f8fb;color:var(--navy)}.nav a.active{background:#fff0f3;color:var(--red);box-shadow:none}.nav a.active:before{content:"";position:absolute;left:0;width:3px;height:22px;background:var(--red);border-radius:0 4px 4px 0}.nav a.active .icon{color:var(--red)}.nav .badge{background:var(--red-soft);color:var(--red);font-weight:800}.admin-card{border-top:1px solid #edf0f4;padding:20px 8px 0;color:var(--ink)}.admin-card small{color:#98a2b3;text-transform:capitalize}.admin-identity{min-width:0}.admin-identity strong,.admin-identity small{white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:175px}.avatar{background:linear-gradient(135deg,#e8edf5,#d7e1ef);border:1px solid #d8e0eb}.main{background:var(--bg)}.topbar{height:82px;padding:0 38px;background:rgba(255,255,255,.94);border-bottom:1px solid var(--line)}.topbar-title{display:grid;min-width:155px}.topbar-title strong{font:800 14px Manrope;color:var(--navy)}.topbar-title span{font-size:11px;color:var(--muted);margin-top:2px}.search{margin-left:12px}.search input{background:#f7f8fa;border-color:#e7eaf0}.icon-btn{border-color:#e4e8ef;box-shadow:0 1px 2px rgba(16,24,40,.03)}.content{padding:38px 42px 60px;max-width:1500px}.page-heading{margin-bottom:30px;align-items:center}.page-heading h1{font-size:31px;letter-spacing:-.035em;color:var(--navy)}.page-heading p{font-size:14px;line-height:1.6}.eyebrow{margin-bottom:8px}.card{border-color:#e5e9f0;border-radius:18px;box-shadow:0 5px 18px rgba(20,33,61,.04)}.stats{gap:18px;margin-bottom:24px}.stat{padding:23px}.stat-icon{width:44px;height:44px;border-radius:13px}.stat-value{font-size:30px;margin-top:19px;color:var(--navy)}.panel{padding:25px}.panel-head{margin-bottom:21px}.panel h2{color:var(--navy);font-size:18px}.grid,.lower{gap:22px}.admin-table th{background:#f8f9fb;padding:13px 14px;border-top:1px solid var(--line)}.admin-table th:first-child{border-radius:10px 0 0 10px}.admin-table th:last-child{border-radius:0 10px 10px 0}.admin-table td{padding:16px 14px}.admin-table tbody tr:hover{background:#fafbfc}.btn,.mini-btn{transition:transform .15s,box-shadow .15s,background .15s}.btn:hover,.mini-btn:hover{transform:translateY(-1px)}.btn-primary{background:var(--navy);box-shadow:0 7px 18px rgba(20,33,61,.17)}.btn-primary:hover{background:var(--navy-2)}.community-admin-card{border-radius:16px;padding:19px;background:#fff;transition:border-color .2s,box-shadow .2s}.community-admin-card:hover{border-color:#ccd4e0;box-shadow:0 10px 25px rgba(20,33,61,.06)}.admin-form input,.admin-form textarea,.admin-form select,.row-actions select,.application-search input,.application-search select{min-height:44px;border-radius:11px;background:#fff;outline:none}.admin-form input:focus,.admin-form textarea:focus,.admin-form select:focus,.application-search input:focus,.application-search select:focus{border-color:var(--navy-2);box-shadow:0 0 0 3px rgba(36,59,100,.09)}
        @media(max-width:760px){.app{display:block}.sidebar{width:276px}.topbar{padding:0 16px}.topbar-title{display:none}.content{padding:25px 17px 42px}.page-heading h1{font-size:26px}.page-heading{align-items:flex-start}.card{border-radius:15px}}

        .dashboard-welcome{display:flex;align-items:flex-end;justify-content:space-between;gap:28px;margin-bottom:28px}.dashboard-welcome h1{font:800 clamp(27px,3vw,36px)/1.15 Manrope;margin:0 0 8px;color:var(--navy);letter-spacing:-.04em}.dashboard-welcome p{margin:0;color:var(--muted);font-size:15px}.dashboard-actions{display:flex;align-items:center;gap:10px;flex:0 0 auto}.dashboard-actions a{text-decoration:none}.attention-banner{display:flex;align-items:center;gap:13px;padding:15px 18px;margin-bottom:20px;border:1px solid #f6ccd3;border-radius:15px;background:linear-gradient(90deg,#fff5f6,#fff);color:var(--ink);text-decoration:none}.attention-icon{width:38px;height:38px;border-radius:11px;display:grid;place-items:center;background:var(--red);color:#fff;font-weight:900}.attention-banner span:nth-child(2){display:grid;gap:2px}.attention-banner small{color:var(--muted)}.attention-banner b{margin-left:auto;color:var(--red);font-size:12px}.dashboard-stats{margin-bottom:24px}.dashboard-stat{position:relative;overflow:hidden}.dashboard-stat:after{content:"";position:absolute;width:90px;height:90px;border-radius:50%;right:-48px;bottom:-50px;background:#f3f6fa}.dashboard-stat .stat-value{margin-top:17px}.metric-live{display:flex;align-items:center;gap:5px;font-size:10px;font-weight:800;color:#667085;background:#f5f7fa;padding:5px 8px;border-radius:99px}.metric-live i{width:6px;height:6px;border-radius:50%;background:#22a06b}.dashboard-grid{display:grid;grid-template-columns:1.15fr .85fr;gap:22px}.dashboard-panel{padding:0;overflow:hidden}.dashboard-panel .panel-head{padding:23px 24px 18px;margin:0;border-bottom:1px solid var(--line)}.panel-link{font-size:12px;font-weight:800;color:var(--navy-2);text-decoration:none}.dashboard-list{display:grid}.dashboard-row{min-height:72px;padding:13px 24px;display:flex;align-items:center;gap:12px;border-bottom:1px solid #edf0f4}.dashboard-row:last-child{border-bottom:0}.dashboard-row:hover{background:#fafbfc}.dashboard-row-copy{min-width:0;display:grid;gap:3px;flex:1}.dashboard-row-copy strong{color:var(--navy);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.dashboard-row-copy span{font-size:11px;color:var(--muted);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.dashboard-row time{font-size:10px;color:#98a2b3;white-space:nowrap}.dashboard-empty{min-height:230px;display:grid;place-content:center;text-align:center;color:var(--muted)}.dashboard-empty>span{width:48px;height:48px;border-radius:50%;display:grid;place-items:center;margin:0 auto 12px;background:#f1f4f8;color:var(--navy);font-size:20px}.dashboard-empty strong{color:var(--navy);margin-bottom:4px}.dashboard-empty small{font-size:11px}
        @media(max-width:1050px){.dashboard-grid{grid-template-columns:1fr}.dashboard-welcome{align-items:flex-start}}
        @media(max-width:650px){.dashboard-welcome{display:block}.dashboard-actions{margin-top:18px}.dashboard-actions .btn,.dashboard-actions .mini-btn{flex:1}.attention-banner b{display:none}.dashboard-row{padding-inline:17px}.dashboard-panel .panel-head{padding-inline:17px}}

        .create-member{position:relative}.create-member>summary{list-style:none}.create-member>summary::-webkit-details-marker{display:none}.floating-form{position:absolute;right:0;top:52px;width:420px;z-index:10;box-shadow:0 20px 55px rgba(20,33,61,.18);border:1px solid var(--line)}.check-label{display:flex!important;grid-template-columns:none!important;align-items:center;gap:8px}.check-label input{width:auto!important;min-height:0!important}.members-panel{overflow:visible}.members-toolbar{display:flex;align-items:flex-end;justify-content:space-between;gap:20px;padding:24px;border-bottom:1px solid var(--line)}.members-toolbar h2{font:800 18px Manrope;color:var(--navy);margin:0 0 4px}.members-toolbar>div>span{font-size:12px;color:var(--muted)}.member-filter{display:flex;align-items:center;gap:8px}.member-search{position:relative}.member-search .icon{position:absolute;left:12px;top:12px;color:#98a2b3}.member-search input{width:240px;height:42px;padding:0 12px 0 40px;border:1px solid var(--line);border-radius:11px;font:inherit;outline:none}.member-filter select{height:42px;border:1px solid var(--line);border-radius:11px;background:#fff;padding:0 32px 0 11px;color:#475467;font:inherit}.member-search input:focus,.member-filter select:focus{border-color:var(--navy-2);box-shadow:0 0 0 3px rgba(36,59,100,.08)}.clear-filter{font-size:11px;font-weight:800;color:var(--red);text-decoration:none}.account-status{display:inline-flex;align-items:center;gap:7px;font-size:11px;font-weight:750;color:#166534}.account-status i{width:7px;height:7px;background:#22a06b;border-radius:50%}.account-status.suspended{color:#b42318}.account-status.suspended i{background:#d92d20}.member-view-btn{border:0;background:none;color:var(--navy-2);font-weight:800;font-size:12px;white-space:nowrap;cursor:pointer;padding:8px}.member-view-btn span{display:inline-block;margin-left:5px;transition:transform .15s}.member-view-btn:hover span{transform:translateX(3px)}.member-dialog{width:min(760px,calc(100% - 28px));padding:0;overflow:hidden;max-height:calc(100vh - 35px)}.member-dialog::backdrop{background:rgba(11,31,58,.58);backdrop-filter:blur(3px)}.member-detail-loading{padding:60px;text-align:center;color:var(--muted)}.member-detail-head{padding:25px 27px;background:linear-gradient(135deg,#14213d,#243b64);color:#fff;display:flex;align-items:center;gap:15px}.member-detail-head .avatar{width:58px;height:58px;font-size:16px;border:3px solid rgba(255,255,255,.28)}.member-detail-title{min-width:0;flex:1}.member-detail-title h2{margin:0 0 4px;font:800 21px Manrope}.member-detail-title p{margin:0;color:#cbd5e1;font-size:12px}.dialog-close{width:36px;height:36px;border:0;border-radius:10px;background:rgba(255,255,255,.1);color:#fff;font-size:22px;cursor:pointer}.member-detail-body{padding:24px 27px;overflow:auto;max-height:calc(100vh - 150px)}.member-summary{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin-bottom:22px}.member-summary div{padding:14px;border:1px solid var(--line);border-radius:12px;background:#fafbfc}.member-summary strong{display:block;font:800 20px Manrope;color:var(--navy)}.member-summary span{font-size:10px;color:var(--muted)}.detail-section{border-top:1px solid var(--line);padding:20px 0}.detail-section h3{margin:0 0 14px;font:800 14px Manrope;color:var(--navy)}.detail-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:15px 25px}.detail-field span{display:block;font-size:10px;text-transform:uppercase;letter-spacing:.06em;color:#98a2b3;font-weight:800;margin-bottom:4px}.detail-field strong{font-size:13px;font-weight:650;overflow-wrap:anywhere}.community-tags{display:flex;flex-wrap:wrap;gap:7px}.community-tags span{padding:6px 9px;background:#f0f3f7;border-radius:8px;font-size:11px;color:var(--navy-2)}.member-management{display:grid;grid-template-columns:1fr 1fr;gap:13px}.management-card{border:1px solid var(--line);border-radius:14px;padding:16px}.management-card h4{margin:0 0 5px;color:var(--navy)}.management-card p{font-size:11px;color:var(--muted);line-height:1.5;margin:0 0 13px}.management-card input,.management-card select{width:100%;height:40px;border:1px solid var(--line);border-radius:9px;padding:0 10px;font:inherit;margin-bottom:8px}.management-card .mini-btn{width:100%}.management-card.danger-zone{border-color:#f4c7cd;background:#fffafb}.ajax-message{display:none;margin-bottom:13px;padding:10px 12px;border-radius:9px;font-size:12px}.ajax-message.show{display:block;background:var(--green-soft);color:var(--green)}.ajax-message.error{background:var(--red-soft);color:var(--red)}
        .member-dialog-toast{position:absolute;z-index:20;top:18px;left:50%;width:max-content;max-width:calc(100% - 150px);transform:translate(-50%,-16px);display:flex;align-items:center;gap:9px;padding:11px 15px;border-radius:11px;background:#ecfdf3;color:#067647;border:1px solid #abefc6;box-shadow:0 12px 32px rgba(6,118,71,.22);font-size:12px;font-weight:800;opacity:0;visibility:hidden;transition:.2s}.member-dialog-toast.show{transform:translate(-50%,0);opacity:1;visibility:visible}.member-dialog-toast.error{background:#fff1f3;color:#c01048;border-color:#fecdd6}.member-dialog-toast i{width:20px;height:20px;border-radius:50%;display:grid;place-items:center;background:#12b76a;color:#fff;font-style:normal}.member-dialog-toast.error i{background:#e11d48}.detail-section-heading{display:flex;align-items:flex-start;justify-content:space-between;gap:15px;margin-bottom:15px}.detail-section-heading h3{margin-bottom:4px}.detail-section-heading p{margin:0;color:var(--muted);font-size:11px}.detail-section-heading>span{font-size:10px;font-weight:800;color:var(--green);background:var(--green-soft);border-radius:99px;padding:6px 9px;white-space:nowrap}.member-profile-form{display:grid;gap:13px}.member-profile-form label{display:grid;gap:6px;color:#667085;font-size:10px;font-weight:800;text-transform:uppercase;letter-spacing:.04em}.member-profile-form input,.member-profile-form textarea{width:100%;border:1px solid var(--line);border-radius:10px;padding:10px 11px;color:var(--ink);font:500 13px 'DM Sans';text-transform:none;letter-spacing:normal;outline:none}.member-profile-form input{height:42px}.member-profile-form input:focus,.member-profile-form textarea:focus{border-color:var(--navy-2);box-shadow:0 0 0 3px rgba(36,59,100,.08)}.profile-bio{margin-top:2px}.member-profile-form .btn{justify-self:start}.member-view-btn{text-decoration:none}.member-page-hero{display:flex;align-items:center;gap:17px;padding:23px 25px;margin-bottom:22px}.member-page-hero>.avatar{width:64px;height:64px;font-size:18px}.member-page-hero h2{margin:0 0 3px;font:800 20px Manrope;color:var(--navy)}.member-page-hero p{margin:0 0 8px;color:var(--muted)}.member-page-hero .member-summary{margin:0 0 0 auto;min-width:330px}.member-page-grid{display:grid;grid-template-columns:minmax(0,1.45fr) minmax(280px,.7fr);gap:22px;align-items:start}.member-page-side{display:grid;gap:16px}.member-page-side .panel{padding:20px}.member-page-side h2{margin-bottom:14px}.member-page-side .admin-form{margin-top:12px}.danger-panel{border-color:#f3c8ce;background:#fffafb}.danger-panel p{font-size:12px;line-height:1.55;color:var(--muted)}
        .post-preview-link{color:var(--ink);text-decoration:none;line-height:1.55}.post-preview-link:hover{color:var(--navy-2);text-decoration:underline}.post-detail-layout{display:grid;grid-template-columns:minmax(0,1.5fr) minmax(290px,.65fr);gap:22px;align-items:start}.post-detail-card{overflow:hidden}.post-author{display:flex;align-items:center;gap:12px;padding:22px 25px;border-bottom:1px solid var(--line)}.post-author>div:nth-child(2){display:grid;gap:3px;min-width:0;flex:1}.post-author>div:nth-child(2) span{font-size:11px;color:var(--muted)}.post-context{display:flex;flex-wrap:wrap;gap:7px;padding:16px 25px 0}.post-context span{padding:5px 8px;border-radius:7px;background:#f1f4f8;color:var(--navy-2);font-size:10px;font-weight:800}.post-full-content{padding:22px 25px;font-size:16px;line-height:1.75;white-space:normal;color:#263446}.post-media{padding:0 25px 24px;display:grid;gap:8px}.post-media.multiple{grid-template-columns:repeat(2,1fr)}.post-media img{display:block;width:100%;max-height:560px;object-fit:cover;border-radius:14px;border:1px solid var(--line)}.post-media.multiple img{height:260px}.original-post{margin:0 25px 24px;padding:16px;border:1px solid var(--line);border-radius:13px;background:#fafbfc}.original-post span{font-size:10px;color:var(--muted);font-weight:800}.original-post p{margin:8px 0 0;line-height:1.6}.post-engagement{display:flex;gap:28px;padding:16px 25px;border-top:1px solid var(--line);border-bottom:1px solid var(--line);color:var(--muted);font-size:11px}.post-engagement strong{color:var(--navy);font-size:14px;margin-right:3px}.post-comments{padding:23px 25px}.post-comments article{display:flex;gap:11px;padding:15px 0;border-bottom:1px solid #edf0f4}.post-comments article>div:nth-child(2){flex:1}.post-comments article strong{font-size:12px}.post-comments time{font-size:10px;color:#98a2b3;margin-left:7px}.post-comments p{margin:7px 0;font-size:13px;line-height:1.6}.post-comments small{color:var(--muted)}.post-detail-side{display:grid;gap:16px}.post-detail-side .panel{padding:20px}.post-status-block{display:flex;align-items:center;justify-content:space-between;padding:13px 0}.post-status-block>span{color:var(--muted);font-size:11px}.post-review-actions{display:grid;grid-template-columns:1fr 1fr;gap:8px}.post-review-actions form,.post-review-actions button{width:100%}.post-review-actions .approve{background:var(--green);color:#fff}.post-review-actions .danger-bg{color:#fff}.post-metadata{display:grid;gap:13px;margin-top:15px}.post-metadata>div{display:grid;gap:3px;padding-bottom:11px;border-bottom:1px solid #edf0f4}.post-metadata span{font-size:10px;color:#98a2b3;text-transform:uppercase;letter-spacing:.05em;font-weight:800}.post-metadata strong{font-size:12px;overflow-wrap:anywhere}.post-metadata>a{margin-top:3px;text-align:center}
        @media(max-width:950px){.members-toolbar{align-items:stretch;flex-direction:column}.member-filter{flex-wrap:wrap}.member-search{flex:1}.member-search input{width:100%}.member-page-grid,.post-detail-layout{grid-template-columns:1fr}.member-page-hero{align-items:flex-start;flex-wrap:wrap}.member-page-hero .member-summary{width:100%;margin:5px 0 0}}
        .post-context span{display:flex;align-items:center;gap:6px;font-size:11px;font-weight:700}.post-context b{font-size:9px;text-transform:uppercase;letter-spacing:.05em;color:#98a2b3}.post-stats .stat{padding:21px}.posts-panel{overflow:hidden}.posts-toolbar{display:flex;align-items:flex-end;justify-content:space-between;gap:20px;padding:23px 24px;border-bottom:1px solid var(--line)}.posts-toolbar h2{font:800 18px Manrope;color:var(--navy);margin:0 0 4px}.posts-toolbar>div>span{font-size:12px;color:var(--muted)}.post-filter{display:flex;align-items:center;gap:8px}.post-filter select{height:42px;min-width:150px;border:1px solid var(--line);border-radius:11px;background:#fff;padding:0 34px 0 11px;color:#475467;font:inherit;outline:none}.post-filter select:focus{border-color:var(--navy-2);box-shadow:0 0 0 3px rgba(36,59,100,.08)}.posts-panel .admin-table td{height:76px}.posts-panel .admin-table th:last-child,.posts-panel .admin-table td:last-child{text-align:right}.posts-empty{min-height:240px;display:grid;place-content:center;text-align:center;color:var(--muted)}.posts-empty>span{width:48px;height:48px;border-radius:50%;display:grid;place-items:center;margin:0 auto 12px;background:#f1f4f8;color:var(--navy);font-size:20px}.posts-empty strong{color:var(--navy);margin-bottom:4px}.posts-empty small{max-width:320px;line-height:1.5}.posts-panel .admin-pagination{padding:18px 24px;margin:0}.admin-pagination.loading{opacity:.45;pointer-events:none}
        .quiz-community-panel,.quiz-library{padding:24px;margin-bottom:22px}.quiz-community-list{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px}.quiz-community-list>a{display:grid;grid-template-columns:42px 1fr auto auto;align-items:center;gap:11px;padding:14px;border:1px solid var(--line);border-radius:13px;text-decoration:none;color:var(--ink);transition:.15s}.quiz-community-list>a:hover{border-color:#bdc8d8;background:#fafbfc;transform:translateY(-1px)}.quiz-community-mark{width:42px;height:42px;border-radius:11px;display:grid;place-items:center;background:#edf2f8;color:var(--navy);font-weight:900}.quiz-community-list a>span:nth-child(2){display:grid;gap:3px;min-width:0}.quiz-community-list a>span:nth-child(2) strong{white-space:nowrap;overflow:hidden;text-overflow:ellipsis;font-size:12px}.quiz-community-list small{color:var(--muted);font-size:10px}.quiz-community-list b{font-size:10px;color:var(--red);background:var(--red-soft);padding:5px 7px;border-radius:99px;white-space:nowrap}.quiz-community-list i{font-style:normal;color:var(--navy);font-size:18px}.quiz-library .panel-head{margin-bottom:18px}.quiz-table-wrap{overflow:auto}.quiz-library .admin-table{min-width:850px}.quiz-row-actions,.quiz-row-actions form{display:flex;align-items:center;gap:6px}.quiz-row-actions{justify-content:flex-end}.quiz-editor-layout{display:grid;grid-template-columns:minmax(0,1.45fr) minmax(280px,.55fr);gap:22px;align-items:start}.quiz-editor-form>label:first-child,.quiz-editor-form>label:nth-child(2),.quiz-editor-form>label:nth-child(3){font-size:12px}.quiz-editor-form>label:nth-child(3) textarea{min-height:150px}.quiz-editor-help{position:sticky;top:105px}.quiz-editor-help>p{color:var(--muted);font-size:12px;line-height:1.6}.quiz-community-counts{display:grid;margin:15px 0;border-top:1px solid var(--line)}.quiz-community-counts div{display:flex;justify-content:space-between;gap:12px;padding:11px 0;border-bottom:1px solid var(--line);font-size:11px}.quiz-community-counts strong{color:var(--navy)}.quiz-question{background:#fafbfc}.quiz-question legend{color:var(--navy)}
        @media(max-width:1050px){.quiz-community-list{grid-template-columns:repeat(2,1fr)}.quiz-editor-layout{grid-template-columns:1fr}.quiz-editor-help{position:static}}
        @media(max-width:800px){.posts-toolbar{align-items:stretch;flex-direction:column}.post-filter{flex-wrap:wrap}.post-filter select{flex:1}}
        @media(max-width:600px){.quiz-community-list{grid-template-columns:1fr}.quiz-community-panel,.quiz-library{padding:17px}}
        .learning-tabs{display:inline-flex;align-items:center;gap:4px;padding:4px;margin-bottom:24px;border:1px solid var(--line);border-radius:12px;background:#fff}.learning-tabs a{padding:9px 13px;border-radius:9px;text-decoration:none;color:var(--muted);font-size:12px;font-weight:800}.learning-tabs a:hover{color:var(--navy);background:#f7f8fa}.learning-tabs a.active{background:var(--navy);color:#fff}.learning-editor-section{display:grid;gap:14px;padding:6px 0 28px;margin-bottom:24px;border-bottom:1px solid var(--line)}.learning-editor-section:last-child{border:0;margin:0;padding-bottom:4px}.learning-step{display:flex;align-items:flex-start;gap:12px;margin-bottom:4px}.learning-step>b{width:30px;height:30px;border-radius:9px;display:grid;place-items:center;background:var(--navy);color:#fff;font-size:12px}.learning-step h2{margin:0 0 3px;font:800 17px Manrope;color:var(--navy)}.learning-step p{margin:0;color:var(--muted);font-size:11px}.article-content-editor{min-height:340px!important;line-height:1.65}.publishing-section{background:#fafbfc;border:1px solid var(--line)!important;border-radius:14px;padding:18px!important}.publishing-section .btn{justify-self:start}.compact-question{padding:0!important;overflow:hidden;background:#fff}.compact-question summary{display:flex!important;align-items:center;gap:12px;padding:14px 16px;cursor:pointer;list-style:none}.compact-question summary::-webkit-details-marker{display:none}.compact-question summary:before{content:"›";font-size:20px;color:var(--muted);transition:transform .15s}.compact-question[open] summary:before{transform:rotate(90deg)}.compact-question summary span{font-weight:800;color:var(--navy)}.compact-question summary small{color:var(--muted);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.compact-question[open] summary{border-bottom:1px solid var(--line);background:#f8f9fb}.question-fields{display:grid;gap:12px;padding:16px}.learning-editor-section [data-question-list]{display:grid;gap:8px}
        @media(max-width:560px){.post-media.multiple{grid-template-columns:1fr}.post-media.multiple img{height:auto}.post-review-actions{grid-template-columns:1fr}.post-engagement{gap:14px;justify-content:space-between}}
        .toast-stack{position:fixed;inset:24px 24px auto auto;margin:0;border:0;padding:0;background:transparent;display:grid;gap:10px;width:min(390px,calc(100% - 32px));pointer-events:none;overflow:visible}.toast-stack::backdrop{display:none}.toast{display:flex;align-items:flex-start;gap:11px;padding:14px 16px;border-radius:13px;background:#fff;color:var(--ink);border:1px solid #dce3eb;box-shadow:0 18px 48px rgba(20,33,61,.28);transform:translateX(115%);opacity:0;transition:transform .25s ease,opacity .25s ease;pointer-events:auto}.toast.show{transform:translateX(0);opacity:1}.toast-icon{width:25px;height:25px;display:grid;place-items:center;border-radius:50%;background:var(--green-soft);color:var(--green);font-weight:900;flex:0 0 auto}.toast.error .toast-icon{background:var(--red-soft);color:var(--red)}.toast-copy{min-width:0;flex:1}.toast-copy strong{display:block;font-size:13px;color:var(--navy);margin-bottom:2px}.toast-copy span{font-size:12px;color:var(--muted);line-height:1.4}.toast-close{border:0;background:none;color:#98a2b3;font-size:18px;line-height:1;cursor:pointer;padding:1px}
        @media(max-width:620px){.floating-form{position:fixed;left:14px;right:14px;top:90px;width:auto}.member-filter{display:grid;grid-template-columns:1fr 1fr}.member-search{grid-column:1/-1}.member-filter .mini-btn{height:42px}.member-summary{grid-template-columns:repeat(3,1fr)}.detail-grid,.member-management{grid-template-columns:1fr}.member-detail-body{padding:20px}.member-detail-head{padding:20px}.admin-table{min-width:760px}.toast-stack{top:14px;right:16px}}
        .question-guide{display:grid;gap:4px;padding:13px 15px;border-radius:12px;background:#eef4fb;border:1px solid #d9e4f2;color:var(--navy)}.question-guide strong{font-size:12px}.question-guide span{font-size:11px;line-height:1.55;color:var(--muted)}.add-question-button{justify-self:start;border-style:dashed;background:#fafbfc}.analytics-updated{font-size:11px;color:var(--muted);padding:8px 11px;border:1px solid var(--line);border-radius:9px;background:#fff}.analytics-grid{display:grid;grid-template-columns:minmax(0,1.45fr) minmax(280px,.55fr);gap:22px;margin-bottom:22px}.chart-legend{display:flex;gap:13px;color:var(--muted);font-size:10px}.chart-legend span{display:flex;align-items:center;gap:5px}.chart-legend i{width:8px;height:8px;border-radius:3px}.chart-legend .members,.chart-bar.members{background:var(--navy)}.chart-legend .posts,.chart-bar.posts{background:var(--red)}.activity-chart{height:240px;display:grid;grid-template-columns:repeat(7,1fr);gap:12px;padding:16px 4px 0;border-bottom:1px solid var(--line)}.chart-day{display:grid;grid-template-rows:1fr auto auto;text-align:center;gap:4px;min-width:0}.chart-values{height:180px;display:flex;align-items:flex-end;justify-content:center;gap:4px}.chart-bar{width:min(18px,42%);border-radius:5px 5px 2px 2px;min-height:5px;transition:.2s}.chart-bar:hover{filter:brightness(1.25)}.chart-day strong{font-size:10px;color:var(--muted)}.chart-day small{font-size:9px;color:#98a2b3}.health-list{display:grid}.health-list>div{display:grid;grid-template-columns:1fr auto;gap:7px;padding:14px 0;border-bottom:1px solid var(--line)}.health-list>div:last-child{border:0}.health-list span{font-size:11px;color:var(--muted)}.health-list strong{font:800 15px Manrope;color:var(--navy)}.health-list i{grid-column:1/-1;height:5px;background:#edf0f4;border-radius:9px;overflow:hidden}.health-list i b{display:block;height:100%;background:linear-gradient(90deg,var(--navy-2),var(--red));border-radius:9px}.analytics-lower{display:grid;grid-template-columns:minmax(0,1.5fr) minmax(260px,.5fr);gap:22px}.engagement-list{display:grid;grid-template-columns:1fr 1fr;gap:10px}.engagement-list div{padding:15px;border:1px solid var(--line);border-radius:12px;background:#fafbfc}.engagement-list span{display:block;font-size:10px;color:var(--muted);margin-bottom:6px}.engagement-list strong{font:800 21px Manrope;color:var(--navy)}@media(max-width:1000px){.analytics-grid,.analytics-lower{grid-template-columns:1fr}}@media(max-width:600px){.activity-chart{gap:5px}.chart-values{height:160px}.analytics-updated{display:none}.engagement-list{grid-template-columns:1fr 1fr}}
        .settings-saved{display:flex;align-items:center;gap:7px;padding:8px 11px;border:1px solid #cdebd7;border-radius:99px;background:var(--green-soft);color:var(--green);font-size:10px;font-weight:800}.settings-saved i{width:7px;height:7px;border-radius:50%;background:var(--green)}.settings-layout{display:grid;grid-template-columns:230px minmax(0,1fr);gap:22px;align-items:start}.settings-nav{position:sticky;top:98px;padding:12px;display:grid;gap:5px}.settings-nav>strong{padding:7px 9px 10px;font:800 12px Manrope;color:var(--navy)}.settings-nav a{display:flex;gap:11px;align-items:center;padding:11px;border-radius:11px;text-decoration:none;color:var(--ink);transition:.15s}.settings-nav a:hover{background:#f5f7fa}.settings-nav a>span{width:29px;height:29px;border-radius:9px;background:#edf2f8;color:var(--navy-2);display:grid;place-items:center;font-size:9px;font-weight:800}.settings-nav a:first-of-type>span{background:var(--red-soft);color:var(--red)}.settings-nav a div{font-size:11px;font-weight:800}.settings-nav a small{display:block;margin-top:2px;color:var(--muted);font-size:9px;font-weight:500}.settings-content{display:grid;gap:20px}.settings-section{padding:0;overflow:hidden;scroll-margin-top:98px}.settings-section-head{display:flex;align-items:center;gap:13px;padding:20px 22px;border-bottom:1px solid var(--line);background:#fafbfc}.settings-section-head h2{margin:0;font:800 16px Manrope;color:var(--navy)}.settings-section-head p{margin:4px 0 0;color:var(--muted);font-size:11px}.settings-icon{width:39px;height:39px;border-radius:11px;background:#edf2f8;color:var(--navy-2);display:grid;place-items:center;flex:0 0 auto}.settings-icon.security{background:var(--red-soft);color:var(--red)}.settings-public{margin-left:auto;padding:5px 9px;border-radius:99px;background:var(--green-soft);color:var(--green);font-size:9px;font-weight:800}.settings-form{padding:22px}.settings-form input{height:43px;padding:0 12px}.settings-form label small{color:#98a2b3;font-size:9px}.settings-divider{display:flex;align-items:center;gap:11px;color:var(--navy);font-size:10px;font-weight:800;text-transform:uppercase;letter-spacing:.07em;margin-top:5px}.settings-divider:after{content:"";height:1px;background:var(--line);flex:1}.settings-form-actions{display:flex;align-items:center;justify-content:space-between;gap:15px;padding-top:18px;margin-top:5px;border-top:1px solid var(--line)}.settings-form-actions>span{color:var(--muted);font-size:10px}.settings-account-grid{display:grid;grid-template-columns:1fr 1fr;gap:20px;align-items:start}.settings-account-grid .settings-section-head{min-height:81px}.settings-account-grid .settings-form-actions{align-items:flex-end}.settings-account-grid .settings-form-actions .btn{white-space:nowrap}@media(max-width:1050px){.settings-layout{grid-template-columns:1fr}.settings-nav{position:static;grid-template-columns:repeat(3,1fr)}.settings-nav>strong{display:none}}@media(max-width:780px){.settings-account-grid{grid-template-columns:1fr}.settings-nav{display:none}}@media(max-width:560px){.settings-heading{align-items:flex-start}.settings-saved{display:none}.settings-section-head,.settings-form{padding:17px}.settings-section-head p{line-height:1.4}.settings-form .form-grid{grid-template-columns:1fr}.settings-form-actions{align-items:stretch;flex-direction:column}.settings-form-actions .btn{width:100%}}
        /* Settings navigation sits above the forms on every screen size. */
        .settings-layout{grid-template-columns:minmax(0,1fr);gap:18px}
        .settings-nav{position:sticky;top:84px;z-index:10;display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:6px;padding:7px;box-shadow:0 8px 24px rgba(16,24,40,.06)}
        .settings-nav>strong{display:none}
        .settings-nav a{min-width:0}
        @media(max-width:780px){.settings-nav{display:flex;overflow-x:auto;position:sticky;scrollbar-width:none}.settings-nav::-webkit-scrollbar{display:none}.settings-nav a{flex:0 0 210px}.settings-account-grid{grid-template-columns:1fr}}
        @media(max-width:480px){.settings-nav a{flex-basis:185px}.settings-nav a small{display:none}}
        .settings-layout.tabs-ready .settings-section{display:none}.settings-layout.tabs-ready .settings-section.active{display:block}.settings-layout.tabs-ready .settings-nav a.active{background:var(--navy);color:#fff}.settings-layout.tabs-ready .settings-nav a.active>span{background:var(--red);color:#fff}.settings-layout.tabs-ready .settings-nav a.active small{color:#cbd5e1}.settings-layout.tabs-ready .settings-account-grid{display:block}
        .menu-btn{display:grid}.sidebar{transition:transform .24s ease}.app{transition:grid-template-columns .24s ease}.app.sidebar-collapsed{grid-template-columns:0 minmax(0,1fr)}.app.sidebar-collapsed .sidebar{transform:translateX(-105%)}
        .report-history-panel{min-height:330px;margin-bottom:22px;transition:opacity .18s}.report-history-panel.loading{opacity:.55}.report-loading,.report-load-error{min-height:285px;display:grid;place-content:center;justify-items:center;gap:10px;color:var(--muted);text-align:center}.report-loading span{width:28px;height:28px;border:3px solid #dfe4ec;border-top-color:var(--red);border-radius:50%;animation:report-spin .7s linear infinite}.report-load-error strong{color:var(--navy)}@keyframes report-spin{to{transform:rotate(360deg)}}.report-toolbar{display:grid;grid-template-columns:minmax(220px,1fr) 170px 160px auto auto;gap:9px;margin-bottom:17px}.report-toolbar input,.report-toolbar select,.report-status-form select{height:42px;border:1px solid var(--line);border-radius:10px;background:#fff;padding:0 11px;font:inherit;color:var(--ink);outline:none}.report-toolbar input:focus,.report-toolbar select:focus,.report-status-form select:focus{border-color:var(--navy-2);box-shadow:0 0 0 3px rgba(36,59,100,.08)}.report-table{min-width:900px}.report-excerpt{display:block;max-width:460px;line-height:1.55}.report-status-form{display:flex;align-items:center;gap:7px}.report-pagination>div{display:flex;align-items:center;gap:5px}.report-pagination a.active{background:var(--navy);border-color:var(--navy);color:#fff}.report-total{margin-top:17px;padding-top:14px;border-top:1px solid var(--line);color:var(--muted);font-size:11px}@media(max-width:900px){.report-toolbar{grid-template-columns:1fr 1fr}.report-toolbar input{grid-column:1/-1}}@media(max-width:620px){.report-toolbar{grid-template-columns:1fr}.report-toolbar input{grid-column:auto}.report-pagination{align-items:flex-start;flex-direction:column}.report-pagination>div{flex-wrap:wrap}}
    </style>
</head>
<body>
<div id="toast-stack" class="toast-stack" popover="manual" aria-live="polite" aria-atomic="true"></div>
<div class="app">
    @include('admin.partials.sidebar', ['section' => $section ?? 'overview'])
    <div class="mobile-overlay" id="overlay"></div>
    <main class="main">
        @include('admin.partials.header')
        <div class="content" id="adminContent" aria-live="polite">
            @if($articleEditorPage ?? false)
                @include('admin.sections.article-editor')
            @elseif($quizEditorPage ?? false)
                @include('admin.sections.quiz-editor')
            @elseif($postPage ?? false)
                @include('admin.sections.post-details')
            @elseif($memberPage ?? false)
                @include('admin.sections.member-details')
            @elseif($applicationsPage ?? false)
                @include('admin.sections.community-applications')
            @elseif(in_array(($section ?? 'overview'), ['overview','members','communities','posts','quizzes','articles','sermons','moderation','analytics','settings'], true))
                @include('admin.sections.index', ['section' => $section])
            @else
            <div class="page-heading">
                <div><div class="eyebrow">Thursday, 6 August</div><h1>Good morning, Amara</h1><p>Here’s what is happening across your community today.</p></div>
                <button class="btn btn-primary" id="createQuiz"><svg class="icon"><path d="M12 5v14M5 12h14"/></svg><span>Create quiz</span></button>
            </div>
            <section class="stats">
                <article class="card stat"><div class="stat-top"><span class="stat-icon"><svg class="icon"><circle cx="9" cy="8" r="4"/><path d="M2 20c1-4 3.3-6 7-6s6 2 7 6M17 5c2 .7 3 2 3 4s-1 3.3-3 4"/></svg></span><span class="trend">↑ 12.5%</span></div><div class="stat-value">12,849</div><div class="stat-label">Total members</div></article>
                <article class="card stat"><div class="stat-top"><span class="stat-icon"><svg class="icon"><path d="M4 5h16v12H8l-4 3V5Z"/></svg></span><span class="trend">↑ 8.2%</span></div><div class="stat-value">184</div><div class="stat-label">Active communities</div></article>
                <article class="card stat"><div class="stat-top"><span class="stat-icon red"><svg class="icon"><path d="M4 4h16v16H4zM8 9l2 2 5-5M8 16h8"/></svg></span><span class="trend">↑ 6.7%</span></div><div class="stat-value">2,410</div><div class="stat-label">Quiz completions</div></article>
                <article class="card stat"><div class="stat-top"><span class="stat-icon red"><svg class="icon"><path d="M12 3 4 6v5c0 5 3.4 8.7 8 10 4.6-1.3 8-5 8-10V6l-8-3Z"/><path d="M12 8v5M12 16h.01"/></svg></span><span class="pill">Needs review</span></div><div class="stat-value">8</div><div class="stat-label">Open reports</div></article>
            </section>
            <section class="grid">
                <article class="card panel"><div class="panel-head"><div><h2>Required reading & quizzes</h2><div class="panel-sub">Control questions, answers, timing and access</div></div><button class="text-btn">Manage all</button></div>
                    <div class="quiz-list">
                        <div class="quiz"><div><div class="quiz-title"><i class="status"></i>Healthy Communication Foundations</div><div class="quiz-meta"><span>Marriage Builders</span><span>8 questions</span><span>10 min</span><span>80% to pass</span></div><div class="progress"><span style="width:78%"></span></div></div><div class="quiz-score"><strong>78%</strong><small>934 completed</small></div></div>
                        <div class="quiz"><div><div class="quiz-title"><i class="status"></i>Community Guidelines & Safety</div><div class="quiz-meta"><span>All members</span><span>6 questions</span><span>No limit</span><span>100% to pass</span></div><div class="progress"><span style="width:91%"></span></div></div><div class="quiz-score"><strong>91%</strong><small>8,201 completed</small></div></div>
                        <div class="quiz"><div><div class="quiz-title"><i class="status draft"></i>Preparing for Parenthood</div><div class="quiz-meta"><span>Growing Families</span><span>12 questions</span><span>15 min</span><span>75% to pass</span></div><div class="progress"><span style="width:34%;background:#f59e0b"></span></div></div><div class="quiz-score"><strong>Draft</strong><small>Edited 2h ago</small></div></div>
                    </div>
                </article>
                <article class="card panel"><div class="panel-head"><div><h2>Quick actions</h2><div class="panel-sub">Common admin tasks</div></div></div><div class="quick-grid">
                    <button class="quick"><svg class="icon"><path d="M12 5v14M5 12h14"/></svg><strong>New quiz</strong><small>Add questions & rules</small></button>
                    <button class="quick"><svg class="icon"><circle cx="12" cy="8" r="4"/><path d="M5 21c1-5 3.5-7 7-7s6 2 7 7M19 5v6M16 8h6"/></svg><strong>Add member</strong><small>Send an invitation</small></button>
                    <button class="quick"><svg class="icon"><path d="M4 5h16v12H8l-4 3V5Z"/><path d="M12 8v6M9 11h6"/></svg><strong>Community</strong><small>Create a new space</small></button>
                    <button class="quick"><svg class="icon"><path d="M5 3h14v18H5zM9 8h6M9 12h6"/></svg><strong>Required post</strong><small>Publish reading</small></button>
                </div><div class="panel-head" style="margin-top:25px"><div><h2>Recent activity</h2></div></div><div class="activity">
                    <div class="activity-item"><div class="avatar">CN</div><div><p><strong>Chidi N.</strong> passed “Healthy Communication” with 88%</p><time>4 minutes ago</time></div></div>
                    <div class="activity-item"><div class="avatar" style="background:#fbe8eb;color:#d62839">AM</div><div><p><strong>Amina M.</strong> created a new community post</p><time>18 minutes ago</time></div></div>
                    <div class="activity-item"><div class="avatar" style="background:#eaf8ef;color:#15803d">TO</div><div><p><strong>Tunde O.</strong> joined Marriage Builders</p><time>31 minutes ago</time></div></div>
                </div></article>
            </section>
            <section class="lower">
                <article class="card panel"><div class="panel-head"><div><h2>Weekly quiz engagement</h2><div class="panel-sub">Completions over the last 7 days</div></div><button class="text-btn">This week ▾</button></div><div class="bars"><div class="bar-group"><div class="bar" style="height:40%"></div>Mon</div><div class="bar-group"><div class="bar" style="height:58%"></div>Tue</div><div class="bar-group"><div class="bar" style="height:46%"></div>Wed</div><div class="bar-group"><div class="bar" style="height:76%"></div>Thu</div><div class="bar-group"><div class="bar" style="height:68%"></div>Fri</div><div class="bar-group"><div class="bar" style="height:92%;background:var(--red)"></div>Sat</div><div class="bar-group"><div class="bar" style="height:72%"></div>Sun</div></div></article>
                <article class="card panel"><div class="panel-head"><div><h2>Moderation queue</h2><div class="panel-sub">Items that need your attention</div></div><button class="text-btn">View queue</button></div><div class="moderation"><div class="mod-row"><span class="mod-icon"><svg class="icon"><path d="M12 3 4 6v5c0 5 3.4 8.7 8 10 4.6-1.3 8-5 8-10V6l-8-3Z"/></svg></span><div class="mod-info"><strong>Reported posts</strong><small>5 waiting for review</small></div><span class="pill">5 open</span></div><div class="mod-row"><span class="mod-icon"><svg class="icon"><circle cx="12" cy="8" r="4"/><path d="M5 21c1-5 3.5-7 7-7s6 2 7 7"/></svg></span><div class="mod-info"><strong>Member appeals</strong><small>3 account restrictions</small></div><span class="pill">3 open</span></div></div></article>
            </section>
            @endif
        </div>
        @include('admin.partials.footer')
    </main>
</div>
<script>
    const sidebar=document.getElementById('sidebar'),overlay=document.getElementById('overlay'),adminApp=document.querySelector('.app'),menuButton=document.getElementById('menuBtn');
    menuButton.addEventListener('click',()=>{
        if (window.matchMedia('(max-width:760px)').matches) {
            const opening = !sidebar.classList.contains('open');
            sidebar.classList.toggle('open', opening); overlay.classList.toggle('show', opening);
            menuButton.setAttribute('aria-expanded', opening ? 'true' : 'false');
            return;
        }
        adminApp.classList.toggle('sidebar-collapsed');
        menuButton.setAttribute('aria-expanded', adminApp.classList.contains('sidebar-collapsed') ? 'false' : 'true');
    });
    overlay.addEventListener('click',()=>{sidebar.classList.remove('open');overlay.classList.remove('show');menuButton.setAttribute('aria-expanded','false')});
    function initializeSettingsTabs() {
        const layout = document.querySelector('.settings-layout');
        if (!layout) return;
        const available = [...layout.querySelectorAll('.settings-section')].map(panel => panel.id);
        const requested = window.location.hash.slice(1);
        const selected = available.includes(requested) ? requested : 'branding';
        layout.querySelectorAll('.settings-section').forEach(panel => panel.classList.toggle('active', panel.id === selected));
        layout.querySelectorAll('[data-settings-tab]').forEach(tab => {
            const active = tab.dataset.settingsTab === selected;
            tab.classList.toggle('active', active);
            tab.setAttribute('aria-selected', active ? 'true' : 'false');
        });
        layout.classList.add('tabs-ready');
    }

    async function loadReportHistory(url) {
        const panel = document.querySelector('[data-report-history]');
        if (!panel) return;
        panel.classList.add('loading');
        panel.setAttribute('aria-busy', 'true');
        try {
            const response = await fetch(url, {headers:{'X-Requested-With':'XMLHttpRequest','Accept':'text/html'}});
            if (!response.ok) throw new Error('Could not load report history.');
            panel.innerHTML = await response.text();
            panel.dataset.reportHistoryLoaded = 'true';
        } catch (error) {
            panel.innerHTML = `<div class="report-load-error"><strong>Couldn’t load report history</strong><span>Please check the connection and try again.</span><button class="mini-btn" data-report-retry type="button">Try again</button></div>`;
            panel.dataset.failedUrl = url;
        } finally {
            panel.classList.remove('loading');
            panel.removeAttribute('aria-busy');
        }
    }

    function initializeReportHistory() {
        const panel = document.querySelector('[data-report-history]');
        if (!panel || panel.dataset.reportHistoryLoaded === 'true') return;
        loadReportHistory(panel.dataset.reportHistoryUrl);
    }

    async function loadAdmin(url, push = true) {
        const content = document.getElementById('adminContent');
        content.style.opacity = '.45';
        try {
            const response = await fetch(url, {headers:{'X-Requested-With':'XMLHttpRequest','Accept':'text/html'}});
            if (!response.ok) throw new Error('Request failed');
            content.innerHTML = await response.text();
            if (push) history.pushState({url}, '', url);
            initializeSettingsTabs();
            initializeReportHistory();
            document.querySelectorAll('[data-admin-link]').forEach(item => item.classList.toggle('active', item.href === url));
            sidebar.classList.remove('open'); overlay.classList.remove('show'); window.scrollTo({top:0,behavior:'smooth'});
        } catch (error) { window.location.href = url; }
        finally { content.style.opacity = '1'; }
    }
    document.addEventListener('click', event => {
        const settingsTab = event.target.closest('[data-settings-tab]');
        if (settingsTab) {
            event.preventDefault();
            history.replaceState(history.state, '', settingsTab.href);
            initializeSettingsTabs();
            return;
        }
        const link = event.target.closest('[data-admin-link]');
        if (!link) return;
        event.preventDefault();
        loadAdmin(link.href);
    });
    initializeSettingsTabs();
    initializeReportHistory();
    window.addEventListener('popstate', () => loadAdmin(window.location.href, false));
    const csrfToken = document.querySelector('meta[name="csrf-token"]').content;
    const escapeHtml = value => String(value ?? 'Not provided').replace(/[&<>'"]/g, character => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#039;','"':'&quot;'}[character]));
    function showToast(text, type = 'success') {
        const stack = document.getElementById('toast-stack');
        if (typeof stack.showPopover === 'function' && !stack.matches(':popover-open')) {
            try { stack.showPopover(); } catch (error) { stack.style.display = 'grid'; }
        } else if (typeof stack.showPopover !== 'function') {
            stack.style.display = 'grid';
        }
        const toast = document.createElement('div');
        toast.className = `toast ${type === 'error' ? 'error' : ''}`;
        toast.innerHTML = `<span class="toast-icon">${type === 'error' ? '!' : '✓'}</span><div class="toast-copy"><strong>${type === 'error' ? 'Update failed' : 'Changes saved'}</strong><span>${escapeHtml(text)}</span></div><button class="toast-close" type="button" aria-label="Dismiss">×</button>`;
        stack.appendChild(toast);
        requestAnimationFrame(() => toast.classList.add('show'));
        const dismiss = () => { toast.classList.remove('show'); setTimeout(() => { toast.remove(); if (!stack.children.length && typeof stack.hidePopover === 'function' && stack.matches(':popover-open')) stack.hidePopover(); }, 250); };
        toast.querySelector('.toast-close').addEventListener('click', dismiss);
        setTimeout(dismiss, 4500);
    }
    @if(session('status'))
        showToast({{ Illuminate\Support\Js::from(session('status')) }});
    @endif
    @if($errors->any())
        showToast({{ Illuminate\Support\Js::from($errors->first()) }}, 'error');
    @endif

    let memberSearchTimer;
    document.addEventListener('input', event => {
        if (!event.target.matches('#member-filter input[name="search"]')) return;
        clearTimeout(memberSearchTimer);
        memberSearchTimer = setTimeout(() => {
            const form = event.target.form;
            loadAdmin(`${form.action}?${new URLSearchParams(new FormData(form))}`);
        }, 350);
    });
    document.addEventListener('change', event => {
        if (!event.target.matches('#member-filter select')) return;
        const form = event.target.form;
        loadAdmin(`${form.action}?${new URLSearchParams(new FormData(form))}`);
    });

    let reportSearchTimer;
    document.addEventListener('input', event => {
        if (!event.target.matches('[data-report-filter] input[name="search"]')) return;
        clearTimeout(reportSearchTimer);
        reportSearchTimer = setTimeout(() => {
            const form = event.target.form;
            loadReportHistory(`${form.action}?${new URLSearchParams(new FormData(form))}`);
        }, 350);
    });
    document.addEventListener('change', event => {
        if (!event.target.matches('[data-report-filter] select')) return;
        const form = event.target.form;
        loadReportHistory(`${form.action}?${new URLSearchParams(new FormData(form))}`);
    });
    document.addEventListener('submit', event => {
        if (!event.target.matches('[data-report-filter]')) return;
        event.preventDefault();
        loadReportHistory(`${event.target.action}?${new URLSearchParams(new FormData(event.target))}`);
    });
    document.addEventListener('click', event => {
        const page = event.target.closest('[data-report-page], [data-report-clear]');
        const retry = event.target.closest('[data-report-retry]');
        if (!page && !retry) return;
        event.preventDefault();
        const panel = document.querySelector('[data-report-history]');
        loadReportHistory(page?.href || panel?.dataset.failedUrl || panel?.dataset.reportHistoryUrl);
    });
    document.addEventListener('submit', async event => {
        if (!event.target.matches('[data-report-action]')) return;
        event.preventDefault();
        const form = event.target;
        const button = form.querySelector('button');
        button.disabled = true;
        try {
            const response = await fetch(form.action, {method:'POST',headers:{'X-CSRF-TOKEN':csrfToken,'X-Requested-With':'XMLHttpRequest','Accept':'application/json'},body:new FormData(form)});
            const payload = await response.json();
            if (!response.ok) throw new Error(payload.message || 'Could not update the report.');
            showToast(payload.message);
            const currentUrl = document.querySelector('[data-report-history-content]')?.dataset.currentUrl;
            loadReportHistory(currentUrl || document.querySelector('[data-report-history]')?.dataset.reportHistoryUrl);
        } catch (error) {
            showToast(error.message, 'error');
            button.disabled = false;
        }
    });
    document.addEventListener('submit', event => {
        if (!event.target.matches('#member-filter')) return;
        event.preventDefault();
        loadAdmin(`${event.target.action}?${new URLSearchParams(new FormData(event.target))}`);
    });
    document.addEventListener('click', event => {
        const paginationLink = event.target.closest('#adminContent .ajax-pagination a');
        const clearPostFilter = event.target.closest('#adminContent .posts-toolbar .clear-filter');
        const target = paginationLink || clearPostFilter;
        if (!target) return;
        event.preventDefault();
        target.closest('.admin-pagination')?.classList.add('loading');
        loadAdmin(target.href);
    });
    document.addEventListener('submit', event => {
        if (!event.target.matches('[data-post-filter]')) return;
        event.preventDefault();
        loadAdmin(`${event.target.action}?${new URLSearchParams(new FormData(event.target))}`);
    });
    document.addEventListener('change', event => {
        if (!event.target.matches('[data-post-filter] select')) return;
        const form = event.target.form;
        loadAdmin(`${form.action}?${new URLSearchParams(new FormData(form))}`);
    });

    function memberDetailMarkup(payload) {
        const member = payload.member;
        const initials = member.name.split(/\s+/).map(part => part[0]).join('').slice(0, 2).toUpperCase();
        const communities = member.communities.length ? member.communities.map(name => `<span>${escapeHtml(name)}</span>`).join('') : '<span>No communities joined</span>';
        const roles = ['member','moderator','admin','super_admin'].map(role => `<option value="${role}" ${member.role === role ? 'selected' : ''}>${role.replace('_',' ').replace(/\b\w/g, letter => letter.toUpperCase())}</option>`).join('');
        return `<div id="member-dialog-toast" class="member-dialog-toast" role="status"><i>✓</i><span></span></div><div class="member-detail-head"><div class="avatar">${escapeHtml(initials)}</div><div class="member-detail-title"><h2>${escapeHtml(member.name)}</h2><p>${escapeHtml(member.email)} · ${member.suspended ? 'Suspended account' : 'Active account'}</p></div><button class="dialog-close" type="button" data-close-dialog aria-label="Close">×</button></div>
        <div class="member-detail-body"><div id="member-ajax-message" class="ajax-message" role="status"></div>
        <div class="member-summary"><div><strong>${member.posts_count}</strong><span>Posts</span></div><div><strong>${member.comments_count}</strong><span>Comments</span></div><div><strong>${member.communities_count}</strong><span>Communities</span></div></div>
        <section class="detail-section"><div class="detail-section-heading"><div><h3>Edit member details</h3><p>Update the member's personal and profile information.</p></div><span>${member.email_verified ? '✓ Email verified' : 'Email not verified'}</span></div><form class="member-profile-form member-ajax-form" action="${escapeHtml(payload.actions.details)}"><input type="hidden" name="_method" value="PATCH"><div class="detail-grid"><label>Full name<input name="name" value="${escapeHtml(member.name)}" required></label><label>Email address<input type="email" name="email" value="${escapeHtml(member.email)}" required></label><label>Phone number<input name="phone_number" value="${escapeHtml(member.phone_number ?? '')}"></label><label>Date of birth<input type="date" name="date_of_birth" value="${escapeHtml(member.date_of_birth ?? '')}"></label><label>Marital status<input name="marital_status" value="${escapeHtml(member.marital_status ?? '')}"></label><label>Occupation<input name="occupation" value="${escapeHtml(member.occupation ?? '')}"></label><label>Workplace<input name="workplace" value="${escapeHtml(member.workplace ?? '')}"></label><label>Hobbies<input name="hobbies" value="${escapeHtml(member.hobbies ?? '')}"></label></div><label class="profile-bio">Bio<textarea name="bio" rows="3">${escapeHtml(member.bio ?? '')}</textarea></label><button class="btn btn-primary" type="submit">Save member details</button></form></section>
        <section class="detail-section"><h3>Communities</h3><div class="community-tags">${communities}</div></section>
        <section class="detail-section"><h3>Account management</h3><div class="member-management"><form class="management-card member-ajax-form" action="${escapeHtml(payload.actions.role)}"><h4>Access role</h4><p>Change the permissions assigned to this account.</p><input type="hidden" name="_method" value="PATCH"><select name="role">${roles}</select><button class="mini-btn" type="submit">Update role</button></form>
        <form class="management-card member-ajax-form" action="${escapeHtml(payload.actions.password)}"><h4>Change password</h4><p>Sets a new password and signs the member out everywhere.</p><input type="hidden" name="_method" value="PATCH"><input type="password" name="password" minlength="8" placeholder="New password" required><input type="password" name="password_confirmation" minlength="8" placeholder="Confirm password" required><button class="mini-btn" type="submit">Change password</button></form>
        <form class="management-card danger-zone member-ajax-form" action="${escapeHtml(payload.actions.suspension)}"><h4>${member.suspended ? 'Reactivate account' : 'Suspend account'}</h4><p>${member.suspended ? 'Restore access to LST Social.' : 'Immediately revoke tokens, sessions and account access.'}</p><input type="hidden" name="_method" value="PATCH"><input type="hidden" name="suspended" value="${member.suspended ? 0 : 1}"><button class="mini-btn ${member.suspended ? 'approve' : 'danger'}" type="submit">${member.suspended ? 'Reactivate member' : 'Suspend member'}</button></form></div></section></div>`;
    }

    document.addEventListener('click', async event => {
        const button = event.target.closest('[data-member-url]');
        if (!button) return;
        const dialog = document.getElementById('member-detail-dialog');
        const content = document.getElementById('member-detail-content');
        dialog.dataset.memberUrl = button.dataset.memberUrl;
        dialog.showModal();
        content.className = 'member-detail-loading';
        content.textContent = 'Loading member details…';
        try {
            const response = await fetch(button.dataset.memberUrl, {headers:{'Accept':'application/json','X-Requested-With':'XMLHttpRequest'}});
            if (!response.ok) throw new Error('Unable to load this member.');
            content.className = '';
            content.innerHTML = memberDetailMarkup(await response.json());
        } catch (error) { content.textContent = error.message; }
    });

    function showMemberToast(text, type = 'success') {
        const toast = document.getElementById('member-dialog-toast');
        if (!toast) return;
        toast.querySelector('i').textContent = type === 'error' ? '!' : '✓';
        toast.querySelector('span').textContent = text;
        toast.className = `member-dialog-toast ${type === 'error' ? 'error ' : ''}show`;
        clearTimeout(window.memberToastTimer);
        window.memberToastTimer = setTimeout(() => toast.classList.remove('show'), 4500);
    }

    document.addEventListener('submit', async event => {
        if (!event.target.matches('.member-ajax-form')) return;
        event.preventDefault();
        const form = event.target;
        const button = form.querySelector('button[type="submit"]');
        const message = document.getElementById('member-ajax-message');
        button.disabled = true;
        try {
            const response = await fetch(form.action, {method:'POST',body:new FormData(form),headers:{'Accept':'application/json','X-Requested-With':'XMLHttpRequest','X-CSRF-TOKEN':csrfToken}});
            const data = await response.json();
            if (!response.ok) throw new Error(data.message || Object.values(data.errors || {}).flat()[0] || 'The update failed.');
            message.textContent = data.message; message.className = 'ajax-message show';
            showToast(data.message);
            showMemberToast(data.message);
            if (form.querySelector('[name="password"]')) {
                form.querySelectorAll('input[type="password"]').forEach(input => input.value = '');
            } else {
                const dialog = document.getElementById('member-detail-dialog');
                await new Promise(resolve => setTimeout(resolve, 700));
                const refreshed = await fetch(dialog.dataset.memberUrl, {headers:{'Accept':'application/json','X-Requested-With':'XMLHttpRequest'}});
                if (refreshed.ok) {
                    document.getElementById('member-detail-content').innerHTML = memberDetailMarkup(await refreshed.json());
                    const refreshedMessage = document.getElementById('member-ajax-message');
                    refreshedMessage.textContent = data.message;
                    refreshedMessage.className = 'ajax-message show';
                    showMemberToast(data.message);
                }
            }
        } catch (error) { message.textContent = error.message; message.className = 'ajax-message error show'; showToast(error.message, 'error'); showMemberToast(error.message, 'error'); }
        finally { button.disabled = false; }
    });
    document.addEventListener('click', event => {
        if(event.target.closest('#createQuiz')) alert('Quiz builder: add questions, correct answers, time limit, passing score, attempts and unlock rules.');
        const closeDialog = event.target.closest('[data-close-dialog]');
        if (closeDialog) closeDialog.closest('dialog')?.close();
        const viewApplication = event.target.closest('[data-view-application]');
        if (viewApplication) {
            const template = document.getElementById(viewApplication.dataset.template);
            const dialog = document.getElementById('applicationResponseDialog');
            const body = document.getElementById('applicationResponseBody');
            const name = document.getElementById('applicationResponseName');
            if (template && dialog && body && name) {
                name.textContent = viewApplication.dataset.applicant;
                body.replaceChildren(template.content.cloneNode(true));
                dialog.showModal();
            }
        }
        const addQuestion = event.target.closest('[data-add-question]');
        if (addQuestion) {
            const form = addQuestion.closest('[data-quiz-form], [data-article-form]');
            const list = form.querySelector('[data-question-list]');
            const index = list.querySelectorAll('.quiz-question').length;
            const isArticle = form.matches('[data-article-form]');
            const answerIndexes = [0,1,2,3];
            const question = document.createElement(isArticle ? 'details' : 'fieldset');
            question.className = `quiz-question${isArticle ? ' compact-question' : ''}`;
            if (isArticle) question.open = true;
            const fields = `<label>${isArticle ? 'Question text' : 'Question'}<input name="questions[${index}][question]" ${isArticle ? 'placeholder="What should the reader understand from this article?"' : ''} required></label><div class="form-grid">${answerIndexes.map(answer => `<label>${isArticle ? 'Option' : 'Answer'} ${answer + 1}<input name="questions[${index}][answers][${answer}]" ${isArticle ? `placeholder="Enter answer option ${answer + 1}"` : ''} required></label>`).join('')}</div><label>Correct answer<select name="questions[${index}][correct]">${answerIndexes.map(answer => `<option value="${answer}">${isArticle ? 'Option' : 'Answer'} ${answer + 1}</option>`).join('')}</select></label><button class="mini-btn danger" type="button" data-remove-question>Remove question</button>`;
            question.innerHTML = isArticle ? `<summary><span>Question ${index + 1}</span><small>New question</small></summary><div class="question-fields">${fields}</div>` : `<legend>Question <span data-question-number>${index + 1}</span></legend>${fields}`;
            list.querySelectorAll('.compact-question').forEach(item => { item.open = false; });
            list.appendChild(question);
            question.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
        const removeQuestion = event.target.closest('[data-remove-question]');
        if (removeQuestion) {
            const list = removeQuestion.closest('[data-question-list]');
            if (list.querySelectorAll('.quiz-question').length > 1) removeQuestion.closest('.quiz-question').remove();
        }
    });
    document.addEventListener('invalid', event => event.target.closest('details')?.setAttribute('open', ''), true);
</script>
</body>
</html>
