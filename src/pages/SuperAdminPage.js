import { useState, useEffect, useMemo } from "react";
import {
  collection,
  getDocs,
  orderBy,
  query,
  limit,
} from "firebase/firestore";
import { css, fmtDateTime, Footer } from "../theme";
import {
  db,
  subscribeAllUsers,
  subscribeGlobalStats,
  getAllSessionsCount,
} from "../firebase";

const SUPER_PASS = "safera2024super";

function toMs(ts) {
  if (!ts) return 0;
  if (ts.toMillis) return ts.toMillis();
  if (ts.seconds) return ts.seconds * 1000;
  return new Date(ts).getTime() || 0;
}

function todayStr() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function fmtDateOnly(dateStr) {
  if (!dateStr) return "—";
  try {
    return new Date(dateStr).toLocaleDateString("ar-SA", {
      weekday: "short",
      day: "numeric",
      month: "short",
    });
  } catch {
    return dateStr;
  }
}

function money(n) {
  return `${Number(n || 0).toLocaleString("ar-SA")} ريال`;
}

function getSessionPrice(session) {
  if (session.price) return Number(session.price) || 0;

  const fieldCost = Number(session.fieldCost || 0);
  const maxMainPlayers = Number(session.maxMainPlayers || 0);

  if (!fieldCost || !maxMainPlayers) return 0;

  const raw = fieldCost / maxMainPlayers;
  const rounding = session.rounding || "round";

  if (rounding === "none") return Math.round(raw * 100) / 100;
  if (rounding === "ceil") return Math.ceil(raw);
  return Math.round(raw);
}

function isInactive(lastActive) {
  const ms = toMs(lastActive);
  if (!ms) return true;

  const days = (Date.now() - ms) / (1000 * 60 * 60 * 24);
  return days > 30;
}

function getPlayerUniqueKey(player) {
  return String(player.phone || player.playerName || "")
    .trim()
    .toLowerCase();
}

export default function SuperAdminPage() {
  const [authed, setAuthed] = useState(false);
  const [pass, setPass] = useState("");
  const [err, setErr] = useState(false);

  const [users, setUsers] = useState([]);
  const [stats, setStats] = useState({});
  const [totalSessions, setTotalSessions] = useState(0);

  const [sessions, setSessions] = useState([]);
  const [sessionRows, setSessionRows] = useState([]);
  const [allPlayers, setAllPlayers] = useState([]);

  const [loadingExtra, setLoadingExtra] = useState(false);
  const [loadError, setLoadError] = useState("");

  const [adminSearch, setAdminSearch] = useState("");
  const [playerSearch, setPlayerSearch] = useState("");
  const [playerViewFilter, setPlayerViewFilter] = useState("registrations");
  const [playerPaymentFilter, setPlayerPaymentFilter] = useState("all");
  const [playerStatusFilter, setPlayerStatusFilter] = useState("all");

  async function loadSuperAdminData() {
    setLoadingExtra(true);
    setLoadError("");

    try {
      const sessionsQuery = query(
        collection(db, "sessions"),
        orderBy("createdAt", "desc"),
        limit(50)
      );

      const sessionsSnap = await getDocs(sessionsQuery);
      const allSessions = sessionsSnap.docs.map((d) => ({
        id: d.id,
        ...d.data(),
      }));

      setSessions(allSessions);

      const rows = [];
      const players = [];

      for (const s of allSessions) {
        const regsSnap = await getDocs(
          collection(db, "sessions", s.id, "registrations")
        );

        const regs = regsSnap.docs.map((d) => ({
          id: d.id,
          ...d.data(),
        }));

        const activeRegs = regs.filter((r) => r.status !== "cancelled");
        const cancelledRegs = regs.filter((r) => r.status === "cancelled");
        const paidRegs = activeRegs.filter((r) => r.paid);
        const unpaidRegs = activeRegs.filter((r) => !r.paid);

        const price = getSessionPrice(s);

        rows.push({
          ...s,
          totalPlayers: activeRegs.length,
          cancelledPlayers: cancelledRegs.length,
          paidPlayers: paidRegs.length,
          unpaidPlayers: unpaidRegs.length,
          price,
          collectedAmount: paidRegs.length * price,
          unpaidAmount: unpaidRegs.length * price,
          expectedAmount: activeRegs.length * price,
        });

        regs.forEach((r, index) => {
          const isCancelled = r.status === "cancelled";
          const playerType =
            isCancelled
              ? "cancelled"
              : index < Number(s.maxMainPlayers || 0)
              ? "main"
              : "reserve";

          players.push({
            id: `${s.id}-${r.id}`,
            regId: r.id,
            sessionId: s.id,

            playerName: r.playerName || "بدون اسم",
            phone: r.phone || "—",
            paid: !!r.paid,
            paidAt: r.paidAt || null,
            status: r.status || "active",
            isGuest: !!r.isGuest,
            addedByName: r.addedByName || "",
            addedByPhone: r.addedByPhone || "",
            registeredAt: r.registeredAt || null,

            playerType,
            amount: isCancelled ? 0 : price,

            sessionTitle: s.title || "تمرين بدون اسم",
            sessionDate: s.date || "",
            sessionStartTime: s.startTime || "",
            sessionEndTime: s.endTime || "",
            sessionLocation: s.location || "",
            sessionAdminUid: s.adminUid || "",
          });
        });
      }

      setSessionRows(rows);
      setAllPlayers(players);
    } catch (e) {
      console.error(e);
      setLoadError("تعذر تحميل بيانات التمارين أو اللاعبين");
    } finally {
      setLoadingExtra(false);
    }
  }

  useEffect(() => {
    if (!authed) return;

    const u1 = subscribeAllUsers(setUsers);
    const u2 = subscribeGlobalStats(setStats);

    getAllSessionsCount().then(setTotalSessions);
    loadSuperAdminData();

    return () => {
      u1();
      u2();
    };
  }, [authed]);

  const summary = useMemo(() => {
    const activePlayers = allPlayers.filter((p) => p.status !== "cancelled");
    const cancelledPlayers = allPlayers.filter((p) => p.status === "cancelled");

    const paidPlayers = activePlayers.filter((p) => p.paid);
    const unpaidPlayers = activePlayers.filter((p) => !p.paid);

    const uniquePlayersMap = new Map();

    activePlayers.forEach((p) => {
      const key = getPlayerUniqueKey(p);
      if (key) uniquePlayersMap.set(key, p);
    });

    const collectedAmount = paidPlayers.reduce(
      (sum, p) => sum + Number(p.amount || 0),
      0
    );

    const unpaidAmount = unpaidPlayers.reduce(
      (sum, p) => sum + Number(p.amount || 0),
      0
    );

    const expectedAmount = activePlayers.reduce(
      (sum, p) => sum + Number(p.amount || 0),
      0
    );

    const openSessions = sessions.filter((s) => s.registrationOpen).length;
    const closedSessions = sessions.filter((s) => !s.registrationOpen).length;
    const todaySessions = sessions.filter((s) => s.date === todayStr()).length;
    const inactiveAdmins = users.filter((u) => isInactive(u.lastActive)).length;

    return {
      totalPlayers: activePlayers.length,
      uniquePlayers: uniquePlayersMap.size,
      paidPlayers: paidPlayers.length,
      unpaidPlayers: unpaidPlayers.length,
      cancelledPlayers: cancelledPlayers.length,
      collectedAmount,
      unpaidAmount,
      expectedAmount,
      openSessions,
      closedSessions,
      todaySessions,
      inactiveAdmins,
    };
  }, [allPlayers, sessions, users]);

  const adminPerformance = useMemo(() => {
    return users
      .map((u) => {
        const adminSessions = sessionRows.filter((s) => s.adminUid === u.id);

        return {
          ...u,
          sessionsCreated: adminSessions.length,
          playersRegistered: adminSessions.reduce(
            (sum, s) => sum + s.totalPlayers,
            0
          ),
          collectedAmount: adminSessions.reduce(
            (sum, s) => sum + s.collectedAmount,
            0
          ),
        };
      })
      .sort((a, b) => b.sessionsCreated - a.sessionsCreated);
  }, [users, sessionRows]);

  const latestSessions = useMemo(() => {
    return [...sessionRows]
      .sort((a, b) => toMs(b.createdAt) - toMs(a.createdAt))
      .slice(0, 8);
  }, [sessionRows]);

  const filteredUsers = useMemo(() => {
    const q = adminSearch.trim().toLowerCase();

    if (!q) return users;

    return users.filter((u) => {
      return (
        (u.displayName || "").toLowerCase().includes(q) ||
        (u.email || "").toLowerCase().includes(q) ||
        (u.phone || "").toLowerCase().includes(q)
      );
    });
  }, [users, adminSearch]);

  const filteredPlayers = useMemo(() => {
    let list = [...allPlayers];

    if (playerPaymentFilter === "paid") {
      list = list.filter((p) => p.paid && p.status !== "cancelled");
    }

    if (playerPaymentFilter === "unpaid") {
      list = list.filter((p) => !p.paid && p.status !== "cancelled");
    }

    if (playerStatusFilter === "active") {
      list = list.filter((p) => p.status !== "cancelled");
    }

    if (playerStatusFilter === "cancelled") {
      list = list.filter((p) => p.status === "cancelled");
    }

    if (playerStatusFilter === "main") {
      list = list.filter((p) => p.playerType === "main");
    }

    if (playerStatusFilter === "reserve") {
      list = list.filter((p) => p.playerType === "reserve");
    }

    const q = playerSearch.trim().toLowerCase();

    if (q) {
      list = list.filter((p) => {
        return (
          (p.playerName || "").toLowerCase().includes(q) ||
          (p.phone || "").toLowerCase().includes(q) ||
          (p.sessionTitle || "").toLowerCase().includes(q)
        );
      });
    }

    list = list.sort((a, b) => toMs(b.registeredAt) - toMs(a.registeredAt));

    if (playerViewFilter === "unique") {
      const map = new Map();

      list.forEach((p) => {
        const key = getPlayerUniqueKey(p);
        if (!key) return;

        if (!map.has(key)) {
          map.set(key, {
            ...p,
            totalRegistrations: 1,
            sessionsList: [p.sessionTitle],
            totalAmount: p.status === "cancelled" ? 0 : Number(p.amount || 0),
            paidRegistrations:
              p.paid && p.status !== "cancelled" ? 1 : 0,
            unpaidRegistrations:
              !p.paid && p.status !== "cancelled" ? 1 : 0,
            cancelledRegistrations:
              p.status === "cancelled" ? 1 : 0,
          });
        } else {
          const existing = map.get(key);

          map.set(key, {
            ...existing,
            totalRegistrations: existing.totalRegistrations + 1,
            sessionsList: [...existing.sessionsList, p.sessionTitle],
            totalAmount:
              existing.totalAmount +
              (p.status === "cancelled" ? 0 : Number(p.amount || 0)),
            paidRegistrations:
              existing.paidRegistrations +
              (p.paid && p.status !== "cancelled" ? 1 : 0),
            unpaidRegistrations:
              existing.unpaidRegistrations +
              (!p.paid && p.status !== "cancelled" ? 1 : 0),
            cancelledRegistrations:
              existing.cancelledRegistrations +
              (p.status === "cancelled" ? 1 : 0),
          });
        }
      });

      return Array.from(map.values());
    }

    return list;
  }, [
    allPlayers,
    playerSearch,
    playerViewFilter,
    playerPaymentFilter,
    playerStatusFilter,
  ]);

  function handleLogin() {
    if (pass === SUPER_PASS) {
      setAuthed(true);
      setErr(false);
    } else {
      setErr(true);
    }
  }

  const extraCss = `
    .kpi-grid{
      display:grid;
      grid-template-columns:repeat(3,1fr);
      gap:10px;
      margin-bottom:14px;
    }

    .kpi-card{
      background:white;
      border-radius:14px;
      border:.5px solid #e8e8e8;
      padding:16px;
      box-shadow:0 1px 6px rgba(0,0,0,.05);
    }

    .kpi-icon{
      font-size:20px;
      margin-bottom:6px;
    }

    .kpi-number{
      font-size:26px;
      font-weight:800;
      color:#1a5c2e;
      line-height:1.2;
    }

    .kpi-label{
      font-size:11px;
      color:#888;
      font-weight:700;
      margin-top:4px;
    }

    .kpi-split{
      display:grid;
      grid-template-columns:1fr 1fr;
      gap:8px;
      margin-top:4px;
    }

    .kpi-mini-box{
      background:#f7faf7;
      border-radius:12px;
      padding:10px;
      border:1px solid #edf2ed;
    }

    .kpi-mini-number{
      font-size:22px;
      font-weight:900;
      color:#1a5c2e;
      line-height:1.1;
    }

    .section-head{
      display:flex;
      align-items:center;
      justify-content:space-between;
      gap:10px;
      margin-bottom:12px;
    }

    .mini-note{
      font-size:10px;
      color:#aaa;
      font-weight:600;
    }

    .admin-table{
      width:100%;
      border-collapse:collapse;
      font-size:12px;
    }

    .admin-table th{
      text-align:right;
      color:#777;
      font-size:11px;
      padding:9px 8px;
      background:#f7faf7;
      border-bottom:1px solid #eee;
      white-space:nowrap;
    }

    .admin-table td{
      padding:10px 8px;
      border-bottom:1px solid #f3f3f3;
      color:#333;
      vertical-align:middle;
    }

    .admin-table tr:last-child td{
      border-bottom:none;
    }

    .table-wrap{
      width:100%;
      overflow-x:auto;
    }

    .status-pill{
      display:inline-flex;
      align-items:center;
      justify-content:center;
      padding:3px 9px;
      border-radius:20px;
      font-size:10px;
      font-weight:800;
      white-space:nowrap;
    }

    .status-open{
      background:#d4edda;
      color:#155724;
    }

    .status-closed{
      background:#f8d7da;
      color:#721c24;
    }

    .status-paid{
      background:#d4edda;
      color:#155724;
    }

    .status-unpaid{
      background:#fff3cd;
      color:#856404;
    }

    .status-cancelled{
      background:#f8d7da;
      color:#721c24;
    }

    .status-main{
      background:#e8f5e9;
      color:#1a5c2e;
    }

    .status-reserve{
      background:#e3f2fd;
      color:#0d47a1;
    }

    .status-guest{
      background:#f3e5f5;
      color:#6a1b9a;
    }

    .alert-box{
      display:flex;
      align-items:flex-start;
      gap:8px;
      padding:10px 12px;
      border-radius:12px;
      background:#fff8e1;
      border:1px solid #ffecb3;
      color:#856404;
      font-size:12px;
      font-weight:700;
      margin-bottom:8px;
    }

    .alert-box.good{
      background:#e8f5e9;
      border-color:#c8e6c9;
      color:#155724;
    }

    .search-input{
      width:100%;
      border:1.5px solid #e0e0e0;
      border-radius:10px;
      padding:10px 12px;
      font-family:inherit;
      font-size:13px;
      outline:none;
    }

    .search-input:focus{
      border-color:#1a5c2e;
      box-shadow:0 0 0 3px rgba(26,92,46,.08);
    }

    .filters-row{
      display:grid;
      grid-template-columns:1.5fr 1fr 1fr 1fr;
      gap:8px;
      margin-bottom:12px;
    }

    .filter-select{
      width:100%;
      border:1.5px solid #e0e0e0;
      border-radius:10px;
      padding:10px 12px;
      font-family:inherit;
      font-size:12px;
      outline:none;
      background:white;
    }

    .empty-state{
      color:#bbb;
      font-size:12px;
      text-align:center;
      padding:18px 0;
      font-weight:600;
    }

    .clickable-kpi{
      cursor:pointer;
      transition:.15s;
    }

    .clickable-kpi:hover{
      transform:translateY(-1px);
      box-shadow:0 4px 12px rgba(0,0,0,.08);
    }

    @media(max-width:720px){
      .kpi-grid{
        grid-template-columns:repeat(2,1fr);
      }

      .filters-row{
        grid-template-columns:1fr;
      }

      .kpi-split{
        grid-template-columns:1fr;
      }
    }

    @media(max-width:480px){
      .kpi-grid{
        grid-template-columns:1fr;
      }

      .header{
        flex-direction:column;
        gap:10px;
      }
    }
  `;

  if (!authed) {
    return (
      <>
        <style>{css}</style>

        <div
          style={{
            minHeight: "100vh",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 20,
          }}
        >
          <div className="card" style={{ maxWidth: 320, width: "100%" }}>
            <div style={{ textAlign: "center", marginBottom: 20 }}>
              <div style={{ fontSize: 32 }}>🔐</div>
              <div
                style={{
                  fontSize: 16,
                  fontWeight: 800,
                  color: "#1a5c2e",
                  marginTop: 6,
                }}
              >
                Super Admin
              </div>
              <div style={{ fontSize: 11, color: "#aaa", marginTop: 4 }}>
                لوحة التحكم الرئيسية
              </div>
            </div>

            {err && <div className="al ae">كلمة السر غير صحيحة</div>}

            <div className="ig">
              <label>كلمة السر</label>
              <input
                type="password"
                value={pass}
                onChange={(e) => setPass(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleLogin();
                }}
              />
            </div>

            <button className="btn btn-g" onClick={handleLogin}>
              دخول
            </button>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <style>{css + extraCss}</style>

      <div className="app-wide">
        <div className="header" style={{ marginBottom: 16 }}>
          <div>
            <div className="header-title">⚽ صافرة — Super Admin</div>
            <div className="header-sub">
              لوحة مراقبة المسؤولين، التمارين، اللاعبين، والمدفوعات
            </div>
          </div>

          <button
            className="hbadge"
            onClick={loadSuperAdminData}
            disabled={loadingExtra}
          >
            {loadingExtra ? "جاري التحديث..." : "تحديث البيانات"}
          </button>
        </div>

        {loadError && <div className="al ae">{loadError}</div>}

        <div className="kpi-grid">
          <div className="kpi-card">
            <div className="kpi-icon">👤</div>
            <div className="kpi-number">{users.length}</div>
            <div className="kpi-label">مسؤول مسجل</div>
          </div>

          <div className="kpi-card">
            <div className="kpi-icon">🏟️</div>
            <div className="kpi-number">{totalSessions}</div>
            <div className="kpi-label">إجمالي التمارين</div>
          </div>

          <div className="kpi-card">
            <div className="kpi-icon">🟢</div>
            <div className="kpi-number">{summary.openSessions}</div>
            <div className="kpi-label">تمارين مفتوحة</div>
          </div>

          <div
            className="kpi-card clickable-kpi"
            onClick={() => {
              const el = document.getElementById("players-details");
              if (el) el.scrollIntoView({ behavior: "smooth" });
            }}
          >
            <div className="kpi-icon">👥</div>

            <div className="kpi-split">
              <div className="kpi-mini-box">
                <div className="kpi-mini-number">{summary.totalPlayers}</div>
                <div className="kpi-label">إجمالي التسجيلات</div>
              </div>

              <div className="kpi-mini-box">
                <div className="kpi-mini-number">{summary.uniquePlayers}</div>
                <div className="kpi-label">لاعبين فريدين</div>
              </div>
            </div>

            <div style={{ fontSize: 10, color: "#aaa", marginTop: 8 }}>
              اضغط للتفاصيل
            </div>
          </div>

          <div className="kpi-card">
            <div className="kpi-icon">💰</div>
            <div className="kpi-number" style={{ fontSize: 22 }}>
              {money(summary.collectedAmount)}
            </div>
            <div className="kpi-label">المبلغ المحصل</div>
          </div>

          <div className="kpi-card">
            <div className="kpi-icon">⏳</div>
            <div className="kpi-number" style={{ fontSize: 22 }}>
              {money(summary.unpaidAmount)}
            </div>
            <div className="kpi-label">المبلغ غير المحصل</div>
          </div>
        </div>

        <div className="card" id="players-details">
          <div className="section-head">
            <div className="card-title" style={{ marginBottom: 0 }}>
              تفاصيل اللاعبين المسجلين{" "}
              <span className="bdg bdg-g">{filteredPlayers.length}</span>
            </div>
            <div className="mini-note">آخر 50 تمرين</div>
          </div>

          <div className="filters-row">
            <input
              className="search-input"
              placeholder="ابحث باسم اللاعب أو الجوال أو اسم التمرين..."
              value={playerSearch}
              onChange={(e) => setPlayerSearch(e.target.value)}
            />

            <select
              className="filter-select"
              value={playerViewFilter}
              onChange={(e) => setPlayerViewFilter(e.target.value)}
            >
              <option value="registrations">إجمالي التسجيلات</option>
              <option value="unique">لاعبين فريدين</option>
            </select>

            <select
              className="filter-select"
              value={playerPaymentFilter}
              onChange={(e) => setPlayerPaymentFilter(e.target.value)}
            >
              <option value="all">كل المدفوعات</option>
              <option value="paid">دفعوا</option>
              <option value="unpaid">لم يدفعوا</option>
            </select>

            <select
              className="filter-select"
              value={playerStatusFilter}
              onChange={(e) => setPlayerStatusFilter(e.target.value)}
            >
              <option value="all">كل الحالات</option>
              <option value="active">المسجلين</option>
              <option value="main">أساسي</option>
              <option value="reserve">احتياط</option>
              <option value="cancelled">المعتذرين</option>
            </select>
          </div>

          {filteredPlayers.length === 0 ? (
            <div className="empty-state">لا يوجد لاعبون مطابقون للبحث</div>
          ) : (
            <div className="table-wrap">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>اللاعب</th>
                    <th>الجوال</th>
                    <th>التمرين</th>
                    <th>التاريخ</th>
                    <th>القائمة</th>
                    <th>الدفع</th>
                    <th>المبلغ</th>
                    <th>
                      {playerViewFilter === "unique"
                        ? "عدد التسجيلات"
                        : "نوع التسجيل"}
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {filteredPlayers.map((p) => (
                    <tr key={p.id}>
                      <td>
                        <strong>{p.playerName}</strong>
                        <div className="user-meta">
                          سجل: {fmtDateTime(p.registeredAt) || "—"}
                        </div>
                      </td>

                      <td>{p.phone}</td>

                      <td>
                        <strong>{p.sessionTitle}</strong>
                        <div className="user-meta">
                          {p.sessionStartTime || "—"} إلى{" "}
                          {p.sessionEndTime || "—"}
                        </div>
                      </td>

                      <td>{fmtDateOnly(p.sessionDate)}</td>

                      <td>
                        {playerViewFilter === "unique" ? (
                          <>
                            <span className="status-pill status-main">
                              {p.totalRegistrations || 1} تسجيل
                            </span>
                            {p.cancelledRegistrations > 0 && (
                              <div className="user-meta">
                                معتذر: {p.cancelledRegistrations}
                              </div>
                            )}
                          </>
                        ) : (
                          <>
                            {p.playerType === "cancelled" && (
                              <span className="status-pill status-cancelled">
                                معتذر
                              </span>
                            )}

                            {p.playerType === "main" && (
                              <span className="status-pill status-main">
                                أساسي
                              </span>
                            )}

                            {p.playerType === "reserve" && (
                              <span className="status-pill status-reserve">
                                احتياط
                              </span>
                            )}
                          </>
                        )}
                      </td>

                      <td>
                        {playerViewFilter === "unique" ? (
                          <>
                            <span className="status-pill status-paid">
                              دفع: {p.paidRegistrations || 0}
                            </span>
                            <span
                              className="status-pill status-unpaid"
                              style={{ marginInlineStart: 4 }}
                            >
                              لم يدفع: {p.unpaidRegistrations || 0}
                            </span>
                          </>
                        ) : p.status === "cancelled" ? (
                          <span className="status-pill status-cancelled">
                            ملغي
                          </span>
                        ) : p.paid ? (
                          <span className="status-pill status-paid">دفع</span>
                        ) : (
                          <span className="status-pill status-unpaid">
                            لم يدفع
                          </span>
                        )}
                      </td>

                      <td>
                        {playerViewFilter === "unique"
                          ? money(p.totalAmount)
                          : money(p.amount)}
                      </td>

                      <td>
                        {playerViewFilter === "unique" ? (
                          <>
                            <strong>{p.totalRegistrations || 1}</strong>
                            <div className="user-meta">
                              {p.sessionsList?.slice(0, 2).join("، ")}
                              {p.sessionsList?.length > 2 ? "..." : ""}
                            </div>
                          </>
                        ) : (
                          <>
                            {p.isGuest ? (
                              <span className="status-pill status-guest">
                                ضيف
                              </span>
                            ) : (
                              <span className="status-pill status-open">
                                لاعب
                              </span>
                            )}

                            {p.isGuest && p.addedByName && (
                              <div className="user-meta">
                                بواسطة: {p.addedByName}
                              </div>
                            )}
                          </>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="card">
          <div className="section-head">
            <div className="card-title" style={{ marginBottom: 0 }}>
              التنبيهات السريعة
            </div>
            <div className="mini-note">آخر 50 تمرين</div>
          </div>

          {summary.unpaidPlayers > 0 && (
            <div className="alert-box">
              ⚠️ يوجد {summary.unpaidPlayers} لاعب غير مدفوع، بإجمالي{" "}
              {money(summary.unpaidAmount)}
            </div>
          )}

          {summary.cancelledPlayers > 0 && (
            <div className="alert-box">
              ⚠️ يوجد {summary.cancelledPlayers} لاعب معتذر أو ملغي
            </div>
          )}

          {summary.inactiveAdmins > 0 && (
            <div className="alert-box">
              ⚠️ يوجد {summary.inactiveAdmins} مسؤول لم يظهر له نشاط حديث
            </div>
          )}

          {summary.todaySessions > 0 && (
            <div className="alert-box">
              📅 يوجد {summary.todaySessions} تمرين مجدول اليوم
            </div>
          )}

          {summary.unpaidPlayers === 0 &&
            summary.inactiveAdmins === 0 &&
            summary.todaySessions === 0 &&
            summary.cancelledPlayers === 0 && (
              <div className="alert-box good">
                ✅ لا توجد تنبيهات مهمة حاليًا
              </div>
            )}
        </div>

        <div className="card">
          <div className="section-head">
            <div className="card-title" style={{ marginBottom: 0 }}>
              آخر التمارين
            </div>
            <div className="mini-note">{latestSessions.length} تمرين</div>
          </div>

          {latestSessions.length === 0 ? (
            <div className="empty-state">لا توجد تمارين بعد</div>
          ) : (
            <div className="table-wrap">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>التمرين</th>
                    <th>التاريخ</th>
                    <th>اللاعبين</th>
                    <th>المدفوع</th>
                    <th>غير المدفوع</th>
                    <th>الحالة</th>
                  </tr>
                </thead>
                <tbody>
                  {latestSessions.map((s) => (
                    <tr key={s.id}>
                      <td>
                        <strong>{s.title || "تمرين بدون اسم"}</strong>
                        <div className="user-meta">
                          {s.startTime || "—"} إلى {s.endTime || "—"}
                        </div>
                      </td>
                      <td>{fmtDateOnly(s.date)}</td>
                      <td>{s.totalPlayers}</td>
                      <td>{s.paidPlayers}</td>
                      <td>{s.unpaidPlayers}</td>
                      <td>
                        <span
                          className={
                            s.registrationOpen
                              ? "status-pill status-open"
                              : "status-pill status-closed"
                          }
                        >
                          {s.registrationOpen ? "مفتوح" : "مغلق"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="card">
          <div className="section-head">
            <div className="card-title" style={{ marginBottom: 0 }}>
              أداء المسؤولين
            </div>
            <div className="mini-note">حسب عدد التمارين</div>
          </div>

          {adminPerformance.length === 0 ? (
            <div className="empty-state">لا يوجد مسؤولون بعد</div>
          ) : (
            <div className="table-wrap">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>المسؤول</th>
                    <th>التمارين</th>
                    <th>اللاعبين</th>
                    <th>المحصل</th>
                    <th>آخر نشاط</th>
                  </tr>
                </thead>
                <tbody>
                  {adminPerformance.map((u) => (
                    <tr key={u.id}>
                      <td>
                        <strong>{u.displayName || "—"}</strong>
                        <div className="user-meta">{u.email || "—"}</div>
                      </td>
                      <td>{u.sessionsCreated}</td>
                      <td>{u.playersRegistered}</td>
                      <td>{money(u.collectedAmount)}</td>
                      <td>{fmtDateTime(u.lastActive) || "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="card">
          <div className="section-head">
            <div className="card-title" style={{ marginBottom: 0 }}>
              المسؤولون المسجلون <span className="bdg bdg-g">{users.length}</span>
            </div>
          </div>

          <input
            className="search-input"
            style={{ marginBottom: 12 }}
            placeholder="ابحث بالاسم أو الإيميل أو رقم الجوال..."
            value={adminSearch}
            onChange={(e) => setAdminSearch(e.target.value)}
          />

          {filteredUsers.length === 0 && (
            <div className="empty-state">لا يوجد مسؤولون مطابقون للبحث</div>
          )}

          {filteredUsers.map((u) => (
            <div key={u.id} className="user-row">
              <div className="avatar">
                {(u.displayName || u.email || "?")[0].toUpperCase()}
              </div>

              <div style={{ flex: 1 }}>
                <div className="user-name">{u.displayName || "—"}</div>
                <div className="user-meta">
                  {u.email || "بدون إيميل"} · {u.phone || "بدون جوال"}
                </div>
              </div>

              <div style={{ textAlign: "left" }}>
                <div style={{ fontSize: 10, color: "#aaa" }}>آخر نشاط</div>
                <div
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    color: isInactive(u.lastActive) ? "#dc3545" : "#555",
                  }}
                >
                  {fmtDateTime(u.lastActive) || "لا يوجد"}
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="card">
          <div className="card-title">ملخص المدفوعات</div>

          <div className="pay-summary">
            <div className="pay-row">
              <span>إجمالي المتوقع</span>
              <strong>{money(summary.expectedAmount)}</strong>
            </div>

            <div className="pay-row">
              <span>إجمالي المحصل</span>
              <strong>{money(summary.collectedAmount)}</strong>
            </div>

            <div className="pay-row">
              <span>إجمالي غير المحصل</span>
              <strong>{money(summary.unpaidAmount)}</strong>
            </div>

            <div className="pay-row total">
              <span>نسبة التحصيل</span>
              <span>
                {summary.expectedAmount
                  ? Math.round(
                      (summary.collectedAmount / summary.expectedAmount) * 100
                    )
                  : 0}
                %
              </span>
            </div>
          </div>
        </div>

        <Footer />
      </div>
    </>
  );
}