import { useState, useEffect } from "react";
import { css, fmtDateTime, Footer } from "../theme";
import { subscribeAllUsers, subscribeGlobalStats, getAllSessionsCount } from "../firebase";

const SUPER_PASS = "safera2024super";

export default function SuperAdminPage() {
  const [authed, setAuthed] = useState(false);
  const [pass, setPass] = useState("");
  const [err, setErr] = useState(false);
  const [users, setUsers] = useState([]);
  const [stats, setStats] = useState({});
  const [totalSessions, setTotalSessions] = useState(0);

  useEffect(() => {
    if (!authed) return;
    const u1 = subscribeAllUsers(setUsers);
    const u2 = subscribeGlobalStats(setStats);
    getAllSessionsCount().then(setTotalSessions);
    return () => { u1(); u2(); };
  }, [authed]);

  if (!authed) return (
    <>
      <style>{css}</style>
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
        <div className="card" style={{ maxWidth: 320, width: "100%" }}>
          <div style={{ textAlign: "center", marginBottom: 20 }}>
            <div style={{ fontSize: 32 }}>🔐</div>
            <div style={{ fontSize: 16, fontWeight: 800, color: "#1a5c2e", marginTop: 6 }}>Super Admin</div>
          </div>
          {err && <div className="al ae">كلمة السر غير صحيحة</div>}
          <div className="ig"><label>كلمة السر</label>
            <input type="password" value={pass} onChange={(e) => setPass(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") { if (pass === SUPER_PASS) { setAuthed(true); setErr(false); } else setErr(true); } }} />
          </div>
          <button className="btn btn-g" onClick={() => { if (pass === SUPER_PASS) { setAuthed(true); setErr(false); } else setErr(true); }}>دخول</button>
        </div>
      </div>
    </>
  );

  return (
    <>
      <style>{css}</style>
      <div className="app-wide">
        <div className="header" style={{ marginBottom: 16 }}>
          <div>
            <div className="header-title">⚽ صافرة — Super Admin</div>
            <div className="header-sub">لوحة المراقبة والإحصائيات</div>
          </div>
        </div>

        <div className="grid-3">
          <div className="super-stat"><div className="super-stat-n">{users.length}</div><div className="super-stat-l">مسؤول مسجل</div></div>
          <div className="super-stat"><div className="super-stat-n">{totalSessions}</div><div className="super-stat-l">إجمالي التمارين</div></div>
          <div className="super-stat"><div className="super-stat-n">{stats.totalSessions || 0}</div><div className="super-stat-l">تمارين هذا الشهر</div></div>
        </div>

        <div className="card">
          <div className="card-title">المسؤولون المسجلون <span className="bdg bdg-g">{users.length}</span></div>
          {users.length === 0 && <div style={{ color: "#ccc", fontSize: 12, textAlign: "center", padding: "16px 0" }}>لا يوجد مسؤولون بعد</div>}
          {users.map((u) => (
            <div key={u.id} className="user-row">
              <div className="avatar">{(u.displayName || u.email || "?")[0].toUpperCase()}</div>
              <div style={{ flex: 1 }}>
                <div className="user-name">{u.displayName || "—"}</div>
                <div className="user-meta">{u.email} · {u.phone || "بدون جوال"}</div>
              </div>
              <div style={{ textAlign: "left" }}>
                <div style={{ fontSize: 10, color: "#aaa" }}>آخر نشاط</div>
                <div style={{ fontSize: 11, fontWeight: 600, color: "#555" }}>{fmtDateTime(u.lastActive)}</div>
              </div>
            </div>
          ))}
        </div>

        <Footer />
      </div>
    </>
  );
}
