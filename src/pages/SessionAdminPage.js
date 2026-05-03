import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { css, fmtDate, fmtTime, getLists, genWA, canCancelNow, calcPrice, Footer } from "../theme";
import { onAuthChange, subscribeSession, subscribeRegistrations, updateSession, cancelRegistration, restoreRegistration, deleteRegistration, confirmPayment, updateRegistration, adminRegisterSelf, addGuest, getUserData } from "../firebase";

export default function SessionAdminPage() {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [userData, setUserData] = useState(null);
  const [session, setSession] = useState(null);
  const [regs, setRegs] = useState([]);
  const [tab, setTab] = useState("list"); // list | pay | wa | edit
  const [flash, setFlash] = useState(null);
  const [showWA, setShowWA] = useState(false);
  const [copied, setCopied] = useState(false);
  const [editForm, setEditForm] = useState(null);
  const [guestName, setGuestName] = useState("");
  const [showAddGuest, setShowAddGuest] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    return onAuthChange(async (u) => {
      if (!u) { navigate("/"); return; }
      setUser(u);
      const data = await getUserData(u.uid);
      setUserData(data);
    });
  }, [navigate]);

  useEffect(() => { return subscribeSession(sessionId, setSession); }, [sessionId]);
  useEffect(() => { return subscribeRegistrations(sessionId, setRegs); }, [sessionId]);

  function msg(txt, type) { setFlash({ txt, type }); setTimeout(() => setFlash(null), 3000); }

  const lists = session ? getLists(regs, session.maxMainPlayers) : { main: [], reserve: [], cancelled: [] };
  const playerLink = `${window.location.origin}/session/${sessionId}`;
  const price = session?.price || 0;
  const paidCount = [...lists.main, ...lists.reserve].filter((p) => p.paid).length;
  const unpaidCount = [...lists.main, ...lists.reserve].filter((p) => !p.paid).length;
  const totalCollected = paidCount * price;
  const totalRemaining = unpaidCount * price;

  // Check if admin already registered
  const adminReg = userData ? regs.find((r) => r.phone === userData.phone && r.status === "active") : null;

  async function handleAdminRegister() {
    if (!userData?.phone) { msg("لا يوجد رقم جوال في حسابك", "e"); return; }
    setBusy(true);
    const result = await adminRegisterSelf(sessionId, user.displayName, userData.phone);
    if (result.exists) msg("أنت مسجل بالفعل", "w");
    else msg("تم تسجيلك كلاعب ✓", "ok");
    setBusy(false);
  }

  async function handleAddGuest() {
    if (!guestName.trim()) { msg("أدخل اسم الضيف", "e"); return; }
    if (!adminReg) { msg("سجّل نفسك أولاً", "e"); return; }
    setBusy(true);
    await addGuest(sessionId, guestName.trim(), user.displayName, userData?.phone);
    setGuestName(""); setShowAddGuest(false);
    msg("تمت إضافة الضيف ✓", "ok");
    setBusy(false);
  }

  async function handleSaveEdit() {
    const updated = { ...editForm, price: calcPrice(+editForm.fieldCost, +editForm.maxMainPlayers, editForm.rounding || "round") };
    await updateSession(sessionId, updated);
    setTab("list"); msg("تم الحفظ ✓", "ok");
  }

  if (!session) return <><style>{css}</style><div className="app"><div className="loading">⚽ جاري التحميل...</div></div></>;

  const flashCls = flash?.type === "ok" ? "aok" : flash?.type === "w" ? "aw" : "ae";

  return (
    <>
      <style>{css}</style>
      <div className="app">
        <div className="header">
          <div>
            <div className="header-title">{session.title}</div>
            <div className="header-sub">{fmtDate(session.date)} · {session.startTime}–{session.endTime}</div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 5, alignItems: "flex-end" }}>
            <button className="hbadge" onClick={() => navigate("/dashboard")}>← رجوع</button>
            <span className={`hbadge plain${session.registrationOpen ? "" : " closed"}`}>{session.registrationOpen ? "● مفتوح" : "● مغلق"}</span>
          </div>
        </div>

        {flash && <div className={`al ${flashCls}`}>{flash.txt}</div>}

        {/* Tabs */}
        <div className="tabs">
          <button className={`tab${tab === "list" ? " on" : ""}`} onClick={() => setTab("list")}>القوائم</button>
          <button className={`tab${tab === "pay" ? " on" : ""}`} onClick={() => setTab("pay")}>الدفع</button>
          <button className={`tab${tab === "wa" ? " on" : ""}`} onClick={() => setTab("wa")}>واتساب</button>
          <button className={`tab${tab === "edit" ? " on" : ""}`} onClick={() => { setEditForm({ ...session }); setTab("edit"); }}>تعديل</button>
        </div>

        {/* ── LIST TAB ── */}
        {tab === "list" && (
          <>
            {/* Player link */}
            <div className="card">
              <div className="card-title">رابط اللاعبين</div>
              <div className="link-box" onClick={() => { navigator.clipboard.writeText(playerLink); setCopied(true); setTimeout(() => setCopied(false), 2000); }}>{playerLink}</div>
              <button className="btn btn-g btn-sm" style={{ width: "100%", padding: "9px" }} onClick={() => { navigator.clipboard.writeText(playerLink); setCopied(true); setTimeout(() => setCopied(false), 2000); }}>{copied ? "✓ تم النسخ" : "نسخ الرابط"}</button>
            </div>

            {/* Controls */}
            <div className="card">
              <div className="trow">
                <span style={{ fontSize: 13, fontWeight: 700 }}>التسجيل {session.registrationOpen ? "مفتوح" : "مغلق"}</span>
                <div className={`sw${session.registrationOpen ? " on" : ""}`} onClick={() => updateSession(sessionId, { registrationOpen: !session.registrationOpen })} />
              </div>
              <div className="dvd" />
              {!adminReg
                ? <button className="btn btn-g" onClick={handleAdminRegister} disabled={busy}>{busy ? "..." : "تسجيل نفسي في التمرين"}</button>
                : <div className="al aok" style={{ margin: 0 }}>أنت مسجل في التمرين ✓</div>}
              {adminReg && (
                <>
                  <div className="dvd" />
                  {!showAddGuest
                    ? <button className="btn btn-o" onClick={() => setShowAddGuest(true)}>+ إضافة ضيف</button>
                    : <div className="nrow" style={{ marginTop: 4 }}>
                      <input placeholder="اسم الضيف" value={guestName} onChange={(e) => setGuestName(e.target.value)} onKeyDown={(e) => e.key === "Enter" && handleAddGuest()} autoFocus />
                      <button className="btn btn-g btn-sm" onClick={handleAddGuest} disabled={busy} style={{ padding: "9px 14px" }}>إضافة</button>
                      <button className="btn btn-gray btn-sm" onClick={() => setShowAddGuest(false)}>✕</button>
                    </div>}
                </>
              )}
            </div>

            {/* Stats */}
            <div className="stats">
              <div className="stat"><div className="sn" style={{ color: "#1a5c2e" }}>{lists.main.length}/{session.maxMainPlayers}</div><div className="sl">أساسي</div></div>
              <div className="stat"><div className="sn" style={{ color: "#f0ad4e" }}>{lists.reserve.length}</div><div className="sl">احتياط</div></div>
              <div className="stat"><div className="sn" style={{ color: "#dc3545" }}>{lists.cancelled.length}</div><div className="sl">معتذرين</div></div>
            </div>

            <AdminList title="القائمة الأساسية" players={lists.main} nc="g" bt="g" sessionId={sessionId} onMsg={msg} />
            <AdminList title="الاحتياط" players={lists.reserve} nc="y" bt="y" sessionId={sessionId} onMsg={msg} />
            <AdminList title="المعتذرين" players={lists.cancelled} nc="r" bt="r" sessionId={sessionId} onMsg={msg} isCan />
          </>
        )}

        {/* ── PAY TAB ── */}
        {tab === "pay" && (
          <>
            <div className="pay-summary">
              <div className="pay-row"><span>القطة لكل لاعب</span><strong>{price} ريال</strong></div>
              <div className="pay-row"><span>دفعوا ✅</span><strong style={{ color: "#155724" }}>{paidCount} لاعب</strong></div>
              <div className="pay-row"><span>لم يدفعوا ⏳</span><strong style={{ color: "#856404" }}>{unpaidCount} لاعب</strong></div>
              <div className="pay-row total"><span>المحصّل</span><span>{totalCollected} ريال</span></div>
              <div className="pay-row" style={{ color: "#dc3545", fontWeight: 700 }}><span>المتبقي</span><span>{totalRemaining} ريال</span></div>
            </div>
            <div className="card">
              <div className="card-title">حالة الدفع</div>
              {[...lists.main, ...lists.reserve].map((p, i) => (
                <div key={p.id} className="row">
                  <div className={`num n${lists.main.includes(p) ? "g" : "y"}`}>{lists.main.includes(p) ? lists.main.indexOf(p) + 1 : lists.reserve.indexOf(p) + 1}</div>
                  <div className="pn">
                    {p.isGuest && <span className="guest-tag">ضيف</span>}
                    {p.playerName || "—"}
                    {p.isGuest && p.addedByName && <div className="pn-sub">بواسطة {p.addedByName}</div>}
                  </div>
                  {p.paid
                    ? <span className="paid-tag paid-yes">✅ دفع</span>
                    : <button className="btn btn-gold btn-sm" onClick={async () => { await confirmPayment(sessionId, p.id); msg("تم تأكيد الدفع", "ok"); }}>تأكيد الدفع</button>}
                </div>
              ))}
            </div>
          </>
        )}

        {/* ── WA TAB ── */}
        {tab === "wa" && (
          <div className="card">
            <div className="card-title">نص الواتساب</div>
            <div className="wabox">{genWA(session, lists, sessionId)}</div>
            <button className="btn btn-wa" style={{ marginTop: 10 }} onClick={() => { navigator.clipboard.writeText(genWA(session, lists, sessionId)); msg("تم النسخ ✓", "ok"); }}>نسخ النص</button>
          </div>
        )}

        {/* ── EDIT TAB ── */}
        {tab === "edit" && editForm && (
          <div className="card fade">
            <div className="card-title">تعديل التمرين</div>
            {["title", "location", "fieldNumber", "mapLink", "instructions"].map((k) => (
              <div className="ig" key={k}>
                <label>{{ title: "اسم التمرين", location: "الموقع", fieldNumber: "رقم الملعب", mapLink: "رابط Google Maps", instructions: "تعليمات الحضور" }[k]}</label>
                <input value={editForm[k] || ""} onChange={(e) => setEditForm((f) => ({ ...f, [k]: e.target.value }))} />
              </div>
            ))}
            <div className="ig"><label>التاريخ</label><input type="date" value={editForm.date || ""} onChange={(e) => setEditForm((f) => ({ ...f, date: e.target.value }))} /></div>
            <div className="tc">
              <div className="ig"><label>وقت البداية</label><input type="time" value={editForm.startTime} onChange={(e) => setEditForm((f) => ({ ...f, startTime: e.target.value }))} /></div>
              <div className="ig"><label>وقت النهاية</label><input type="time" value={editForm.endTime} onChange={(e) => setEditForm((f) => ({ ...f, endTime: e.target.value }))} /></div>
            </div>
            <div className="tc">
              <div className="ig"><label>قيمة الملعب (ريال)</label><input type="number" value={editForm.fieldCost || ""} onChange={(e) => setEditForm((f) => ({ ...f, fieldCost: e.target.value }))} /></div>
              <div className="ig"><label>عدد الأساسيين</label><input type="number" value={editForm.maxMainPlayers} onChange={(e) => setEditForm((f) => ({ ...f, maxMainPlayers: +e.target.value }))} /></div>
            </div>
            <div className="ig"><label>مهلة الاعتذار (ساعات)</label><input type="number" value={editForm.cancelDeadlineHours} onChange={(e) => setEditForm((f) => ({ ...f, cancelDeadlineHours: +e.target.value }))} /></div>
            <div style={{ display: "flex", gap: 8 }}>
              <button className="btn btn-g" style={{ flex: 1, marginBottom: 0 }} onClick={handleSaveEdit}>حفظ</button>
              <button className="btn btn-o" style={{ flex: 1, marginBottom: 0 }} onClick={() => setTab("list")}>إلغاء</button>
            </div>
          </div>
        )}

        <Footer />
      </div>
    </>
  );
}

function AdminList({ title, players, nc, bt, sessionId, onMsg, isCan }) {
  if (!players.length) return null;
  return (
    <div className="card">
      <div className="card-title">{title} <span className={`bdg bdg-${bt}`}>{players.length}</span></div>
      {players.map((p, i) => (
        <div key={p.id} className="row">
          <div className={`num n${nc}`}>{i + 1}</div>
          <div className="pn">
            {p.isGuest && <span className="guest-tag">ضيف</span>}
            {p.playerName || <span style={{ color: "#ccc" }}>بدون اسم</span>}
            {p.isGuest && p.addedByName && <div className="pn-sub">بواسطة {p.addedByName}</div>}
            {p.phone && <div className="pn-sub">📱 {p.phone}</div>}
          </div>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 3 }}>
            {!isCan && <span className={`paid-tag ${p.paid ? "paid-yes" : "paid-no"}`}>{p.paid ? "✅" : "⏳"}</span>}
            <span className="pt">{fmtTime(isCan ? p.cancelledAt : p.registeredAt)}</span>
          </div>
          <div className="abtns">
            {isCan
              ? <button className="btn btn-o btn-sm" onClick={async () => { await restoreRegistration(sessionId, p.id); onMsg("تمت الاستعادة", "ok"); }}>استعادة</button>
              : <button className="btn btn-o btn-sm" onClick={async () => { await cancelRegistration(sessionId, p.id); onMsg("تم الاعتذار", "w"); }}>اعتذار</button>}
            <button className="btn btn-r btn-sm" onClick={async () => { await deleteRegistration(sessionId, p.id); onMsg("تم الحذف", "w"); }}>حذف</button>
          </div>
        </div>
      ))}
    </div>
  );
}
