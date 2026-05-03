export const css = `
@import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Sans+Arabic:wght@400;500;600;700;800&display=swap');
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:'IBM Plex Sans Arabic','Segoe UI',sans-serif;background:#f0f4f0;direction:rtl;min-height:100vh}
.app{max-width:480px;margin:0 auto;padding:14px 12px 40px}
.app-wide{max-width:860px;margin:0 auto;padding:16px 16px 40px}
.header{background:linear-gradient(135deg,#1a5c2e,#2d7a45);color:white;border-radius:16px;padding:16px 18px;margin-bottom:14px;display:flex;align-items:flex-start;justify-content:space-between;box-shadow:0 4px 20px rgba(26,92,46,.25)}
.header-title{font-size:18px;font-weight:800}
.header-sub{font-size:11px;opacity:.75;margin-top:4px;font-weight:500}
.hbadge{background:rgba(255,255,255,.2);padding:4px 12px;border-radius:20px;font-size:11px;font-weight:700;white-space:nowrap;cursor:pointer;border:none;color:white;font-family:inherit}
.hbadge.closed{background:rgba(220,53,69,.5)}
.hbadge.plain{cursor:default}
.card{background:white;border-radius:14px;border:.5px solid #e8e8e8;padding:16px;margin-bottom:12px;box-shadow:0 1px 4px rgba(0,0,0,.04)}
.card-title{font-size:13px;font-weight:700;color:#333;margin-bottom:12px;display:flex;align-items:center;gap:7px}
.card-clickable{cursor:pointer;transition:.15s}
.card-clickable:hover{border-color:#1a5c2e;box-shadow:0 2px 12px rgba(26,92,46,.12);transform:translateY(-1px)}
.igrid{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:10px}
.icell{background:#f7faf7;border-radius:10px;padding:10px 12px}
.ilbl{font-size:10px;color:#aaa;margin-bottom:2px;font-weight:500}
.ival{font-size:13px;font-weight:700;color:#1a5c2e}
.btn{padding:11px 14px;border:none;border-radius:10px;cursor:pointer;font-size:14px;font-weight:700;width:100%;margin-bottom:8px;font-family:inherit;transition:.15s}
.btn:last-child{margin-bottom:0}
.btn-g{background:#1a5c2e;color:white;box-shadow:0 2px 8px rgba(26,92,46,.2)}
.btn-g:hover{background:#155026;transform:translateY(-1px)}
.btn-r{background:#dc3545;color:white}
.btn-r:hover{background:#c82333}
.btn-o{background:transparent;color:#1a5c2e;border:1.5px solid #1a5c2e}
.btn-o:hover{background:#f0f8f2}
.btn-wa{background:#25d366;color:white}
.btn-do{background:transparent;color:#dc3545;border:1.5px solid #dc3545}
.btn-do:hover{background:#fff5f5}
.btn-blue{background:#1a73e8;color:white}
.btn-blue:hover{background:#1558b0}
.btn-gold{background:#f0ad4e;color:white}
.btn-gray{background:#f0f0f0;color:#555}
.btn-gray:hover{background:#e5e5e5}
.btn-sm{padding:5px 10px;font-size:11px;width:auto;margin-bottom:0;border-radius:7px}
.btn:disabled{opacity:.4;cursor:not-allowed;transform:none!important}
.tabs{display:flex;gap:6px;background:white;border-radius:12px;padding:5px;border:.5px solid #e0e0e0;margin-bottom:12px;box-shadow:0 1px 4px rgba(0,0,0,.05)}
.tab{flex:1;padding:9px;border:none;border-radius:8px;cursor:pointer;font-size:13px;font-weight:700;background:transparent;color:#888;transition:.2s;font-family:inherit}
.tab.on{background:#1a5c2e;color:white;box-shadow:0 2px 8px rgba(26,92,46,.3)}
.myst{background:linear-gradient(135deg,#e8f5e9,#c8e6c9);border:1px solid #a5d6a7;border-radius:14px;padding:16px;text-align:center;margin-bottom:12px}
.myst.res{background:linear-gradient(135deg,#fff8e1,#ffecb3);border-color:#ffc107}
.myrank{font-size:44px;font-weight:800;color:#1a5c2e;line-height:1}
.myst.res .myrank{color:#f57c00}
.mydesc{font-size:12px;color:#2e7d32;font-weight:700;margin-top:6px}
.myst.res .mydesc{color:#e65100}
.al{padding:10px 14px;border-radius:10px;font-size:12px;margin-bottom:10px;font-weight:600;line-height:1.5}
.aok{background:#d4edda;color:#155724;border:1px solid #c3e6cb}
.aw{background:#fff3cd;color:#856404;border:1px solid #ffc107}
.ae{background:#f8d7da;color:#721c24;border:1px solid #f5c6cb}
.ai{background:#d1ecf1;color:#0c5460;border:1px solid #bee5eb}
.row{display:flex;align-items:center;padding:8px 0;border-bottom:.5px solid #f2f2f2;gap:8px}
.row:last-child{border-bottom:none}
.row.me{background:#f0f8f2;border-radius:8px;padding:8px 7px}
.num{width:24px;height:24px;border-radius:50%;font-size:10px;font-weight:800;display:flex;align-items:center;justify-content:center;flex-shrink:0}
.ng{background:#1a5c2e;color:white}.ny{background:#f0ad4e;color:white}.nr{background:#dc3545;color:white}
.pn{flex:1;font-size:13px;font-weight:600;line-height:1.4}
.pn-sub{font-size:10px;color:#aaa;font-weight:500}
.pt{font-size:10px;color:#ccc;white-space:nowrap}
.metag{background:#d4edda;color:#155724;font-size:10px;font-weight:800;padding:1px 7px;border-radius:10px;margin-left:5px}
.paid-tag{font-size:10px;font-weight:700;padding:1px 6px;border-radius:8px}
.paid-yes{background:#d4edda;color:#155724}
.paid-no{background:#fff3cd;color:#856404}
.stats{display:flex;gap:7px;margin-bottom:12px}
.stat{flex:1;background:white;border-radius:11px;border:.5px solid #e8e8e8;padding:10px 8px;text-align:center;box-shadow:0 1px 4px rgba(0,0,0,.04)}
.sn{font-size:22px;font-weight:800;line-height:1}
.sl{font-size:10px;color:#aaa;margin-top:3px;font-weight:600}
.ig{margin-bottom:11px}
.ig label{font-size:12px;color:#666;font-weight:700;margin-bottom:4px;display:block}
.ig input,.ig textarea,.ig select{width:100%;padding:9px 12px;border:1.5px solid #e0e0e0;border-radius:10px;font-size:13px;font-family:inherit;direction:rtl;transition:.2s;background:white}
.ig input:focus,.ig textarea:focus,.ig select:focus{outline:none;border-color:#1a5c2e;box-shadow:0 0 0 3px rgba(26,92,46,.08)}
.tc{display:grid;grid-template-columns:1fr 1fr;gap:8px}
.nrow{display:flex;gap:7px;align-items:center}
.nrow input{flex:1;padding:10px 12px;border:1.5px solid #e0e0e0;border-radius:10px;font-size:14px;font-family:inherit;direction:rtl;transition:.2s}
.nrow input:focus{outline:none;border-color:#1a5c2e;box-shadow:0 0 0 3px rgba(26,92,46,.1)}
.trow{display:flex;align-items:center;justify-content:space-between;padding:4px 0}
.sw{width:46px;height:26px;background:#ddd;border-radius:13px;position:relative;cursor:pointer;transition:.25s;flex-shrink:0}
.sw.on{background:#1a5c2e}
.sw::after{content:'';width:20px;height:20px;background:white;border-radius:50%;position:absolute;top:3px;right:3px;transition:.25s;box-shadow:0 1px 4px rgba(0,0,0,.2)}
.sw.on::after{right:23px}
.dvd{height:.5px;background:#f0f0f0;margin:12px 0}
.wabox{background:#e9fbe9;border:1px solid #25d366;border-radius:10px;padding:12px 14px;font-size:12px;white-space:pre-wrap;direction:rtl;line-height:1.9;color:#1a1a1a;max-height:260px;overflow-y:auto;margin-top:8px}
.bdg{padding:2px 9px;border-radius:20px;font-size:10px;font-weight:800}
.bdg-g{background:#d4edda;color:#155724}
.bdg-y{background:#fff3cd;color:#856404}
.bdg-r{background:#f8d7da;color:#721c24}
.bdg-b{background:#d1ecf1;color:#0c5460}
.abtns{display:flex;gap:5px;flex-wrap:wrap}
.link-box{background:#f0f8f2;border:1px solid #a5d6a7;border-radius:10px;padding:12px 14px;font-size:12px;direction:ltr;text-align:left;word-break:break-all;color:#1a5c2e;font-weight:600;margin-bottom:8px;cursor:pointer}
.session-card-title{font-size:15px;font-weight:800;color:#222}
.session-card-date{font-size:12px;color:#1a5c2e;font-weight:600;margin-top:2px}
.session-card-meta{font-size:11px;color:#aaa;margin-top:4px}
.open-dot{display:inline-block;width:7px;height:7px;border-radius:50%;background:#1a5c2e;margin-left:5px}
.closed-dot{display:inline-block;width:7px;height:7px;border-radius:50%;background:#dc3545;margin-left:5px}
.super-stat{background:white;border-radius:14px;border:.5px solid #e8e8e8;padding:18px;text-align:center;box-shadow:0 1px 6px rgba(0,0,0,.05)}
.super-stat-n{font-size:36px;font-weight:800;color:#1a5c2e}
.super-stat-l{font-size:12px;color:#aaa;font-weight:600;margin-top:4px}
.grid-3{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin-bottom:14px}
.grid-2{display:grid;grid-template-columns:repeat(2,1fr);gap:10px;margin-bottom:14px}
.user-row{display:flex;align-items:center;padding:10px 0;border-bottom:.5px solid #f5f5f5;gap:10px}
.user-row:last-child{border-bottom:none}
.avatar{width:34px;height:34px;border-radius:50%;background:#1a5c2e;color:white;display:flex;align-items:center;justify-content:center;font-size:13px;font-weight:800;flex-shrink:0}
.user-name{font-size:13px;font-weight:700}
.user-meta{font-size:10px;color:#aaa;margin-top:1px}
.loading{text-align:center;padding:70px 20px;color:#aaa;font-size:15px;font-weight:700}
.footer{font-size:10px;color:#ccc;text-align:center;margin-top:10px;line-height:1.8}
.phone-input-wrap{display:flex;align-items:center;gap:0;border:1.5px solid #e0e0e0;border-radius:10px;overflow:hidden;transition:.2s;background:white}
.phone-input-wrap:focus-within{border-color:#1a5c2e;box-shadow:0 0 0 3px rgba(26,92,46,.08)}
.phone-prefix{padding:10px 12px;background:#f7faf7;color:#1a5c2e;font-weight:700;font-size:13px;border-left:1px solid #e0e0e0;white-space:nowrap}
.phone-input-wrap input{flex:1;padding:10px 12px;border:none;font-size:14px;font-family:inherit;direction:ltr;text-align:left;outline:none;background:transparent}
.pay-summary{background:#f7faf7;border-radius:12px;padding:14px;margin-bottom:12px}
.pay-row{display:flex;justify-content:space-between;align-items:center;padding:5px 0;font-size:13px}
.pay-row.total{font-weight:800;font-size:14px;border-top:.5px solid #eee;margin-top:5px;padding-top:10px;color:#1a5c2e}
.guest-tag{background:#e3f2fd;color:#1565c0;font-size:10px;font-weight:700;padding:1px 6px;border-radius:8px;margin-right:4px}
@keyframes fadeIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
.fade{animation:fadeIn .25s ease}
`;

export function r2ms(ts) {
  if (!ts) return 0;
  if (ts.toMillis) return ts.toMillis();
  if (ts.seconds) return ts.seconds * 1000;
  return new Date(ts).getTime();
}

export function fmtTime(ts) {
  const ms = r2ms(ts);
  if (!ms) return "";
  return new Date(ms).toLocaleTimeString("ar-SA", { hour: "2-digit", minute: "2-digit" });
}

export function fmtDate(dateStr) {
  if (!dateStr) return "";
  return new Date(dateStr).toLocaleDateString("ar-SA", { weekday: "long", day: "numeric", month: "long" });
}

export function fmtDateTime(ts) {
  const ms = r2ms(ts);
  if (!ms) return "";
  return new Date(ms).toLocaleDateString("ar-SA", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
}

export function canCancelNow(startTime, deadlineHours, sessionDate) {
  const [h, m] = startTime.split(":").map(Number);
  const t = sessionDate ? new Date(sessionDate) : new Date();
  t.setHours(h, m, 0, 0);
  return Date.now() < t.getTime() - deadlineHours * 3600000;
}

export function getLists(regs, maxMain) {
  const active = regs
    .filter((r) => r.status === "active")
    .sort((a, b) => r2ms(a.registeredAt) - r2ms(b.registeredAt));
  return {
    main: active.slice(0, maxMain),
    reserve: active.slice(maxMain),
    cancelled: regs
      .filter((r) => r.status === "cancelled")
      .sort((a, b) => r2ms(a.cancelledAt) - r2ms(b.cancelledAt)),
  };
}

export function calcPrice(fieldCost, playerCount, rounding) {
  if (!fieldCost || !playerCount) return 0;
  const raw = fieldCost / playerCount;
  if (rounding === "none") return Math.round(raw * 100) / 100;
  if (rounding === "round") return Math.round(raw);
  if (rounding === "ceil") return Math.ceil(raw);
  return raw;
}

export function genWA(session, lists, sessionId) {
  const { main, reserve, cancelled } = lists;
  const price = session.price || calcPrice(session.fieldCost, session.maxMainPlayers, session.rounding || "round");
  let t = `${session.title}\nمن: ${session.startTime} إلى ${session.endTime}\n`;
  if (session.date) t += `${fmtDate(session.date)}\n`;
  t += "\n";
  main.forEach((p, i) => {
    t += `${i + 1} - ${p.playerName}`;
    if (p.isGuest) t += ` (ضيف - ${p.addedByName})`;
    t += "\n";
  });
  if (reserve.length) {
    t += `\nالاحتياط:\n`;
    reserve.forEach((p, i) => {
      t += `${i + 1} - ${p.playerName}`;
      if (p.isGuest) t += ` (ضيف - ${p.addedByName})`;
      t += "\n";
    });
  }
  if (cancelled.length) {
    t += `\nالمعتذرين:\n`;
    cancelled.forEach((p, i) => (t += `${i + 1} - ${p.playerName}\n`));
  }
  t += `\nالحضور قبل بداية التمرين بـ15 دقيقة.\nيمنع الاعتذار قبل التمرين بساعتين.\nقطة اللعب: ${price} ريال على كل شخص.\n\nالموقع: ${session.location}`;
  if (session.fieldNumber) t += ` ملعب رقم ${session.fieldNumber}`;
  if (session.mapLink) t += `\n${session.mapLink}`;
  t += `\n\n🔗 رابط التسجيل:\n${typeof window !== 'undefined' ? window.location.origin : ''}/session/${sessionId}\n\nوشكرًا`;
  return t;
}

export function Footer() {
  return (
    <div className="footer">
      صافرة · نظام تسجيل التمارين @🟢<br />
      <span style={{ fontSize: 9, opacity: 0.6 }}>Powered by Hamdan Alshebli</span>
    </div>
  );
}
