import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { css, fmtDate, calcPrice, Footer } from "../theme";
import { onAuthChange, logoutAdmin, subscribeAdminSessions, createSession, getUserData } from "../firebase";

const EMPTY_FORM = {
  title: "", date: "", startTime: "", endTime: "",
  location: "", fieldNumber: "", mapLink: "",
  fieldCost: "", maxMainPlayers: 16,
  cancelDeadlineHours: 2,
  instructions: "الحضور قبل بداية التمرين بـ15 دقيقة.",
  rounding: "round",
};

export default function DashboardPage() {
  const [user, setUser] = useState(null);
  const [userData, setUserData] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState(null);
  const [newSession, setNewSession] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    return onAuthChange(async (u) => {
      if (!u) { navigate("/"); return; }
      setUser(u);
      const data = await getUserData(u.uid);
      setUserData(data);
    });
  }, [navigate]);

  useEffect(() => {
    if (!user) return;
    return subscribeAdminSessions(user.uid, setSessions);
  }, [user]);

  const upd = (k, v) => setForm((f) => ({ ...f, [k]: v }));
  const price = form.fieldCost && form.maxMainPlayers ? calcPrice(+form.fieldCost, +form.maxMainPlayers, form.rounding) : 0;

  async function handleCreate() {
    setErr(null);
    if (!form.title || !form.date || !form.startTime || !form.endTime || !form.location || !form.fieldCost) {
      setErr("أدخل البيانات المطلوبة"); return;
    }
    setBusy(true);
    try {
      const sessionData = { ...form, price, fieldCost: +form.fieldCost, maxMainPlayers: +form.maxMainPlayers };
      const id = await createSession(user.uid, sessionData);
      setNewSession({ id, link: `${window.location.origin}/session/${id}` });
      setShowForm(false);
      setForm(EMPTY_FORM);
    } catch { setErr("حدث خطأ، حاول مرة ثانية"); }
    setBusy(false);
  }

  if (!user) return <><style>{css}</style><div className="app"><div className="loading">⚽ جاري التحميل...</div></div></>;

  return (
    <>
      <style>{css}</style>
      <div className="app">
        <div className="header">
          <div>
            <div className="header-title">⚽ صافرة</div>
            <div className="header-sub">أهلاً، {user.displayName}</div>
          </div>
          <button className="hbadge" onClick={() => logoutAdmin().then(() => navigate("/"))}>خروج</button>
        </div>

        {newSession && (
          <div className="card fade">
            <div className="card-title">✅ تم إنشاء التمرين</div>
            <div style={{ fontSize: 12, color: "#555", marginBottom: 8 }}>أرسل هذا الرابط للاعبين:</div>
            <div className="link-box" onClick={() => navigator.clipboard.writeText(newSession.link)}>{newSession.link}</div>
            <div style={{ display: "flex", gap: 8 }}>
              <button className="btn btn-g btn-sm" style={{ flex: 1, padding: "9px 0" }} onClick={() => navigator.clipboard.writeText(newSession.link)}>نسخ الرابط</button>
              <button className="btn btn-o btn-sm" style={{ flex: 1, padding: "9px 0" }} onClick={() => navigate(`/manage/${newSession.id}`)}>إدارة التمرين</button>
              <button className="btn btn-gray btn-sm" onClick={() => setNewSession(null)}>✕</button>
            </div>
          </div>
        )}

        {!showForm && <button className="btn btn-g" onClick={() => { setShowForm(true); setErr(null); }}>+ إنشاء تمرين جديد</button>}

        {showForm && (
          <div className="card fade">
            <div className="card-title">تمرين جديد</div>
            {err && <div className="al ae">{err}</div>}
            <div className="ig"><label>اسم التمرين *</label><input placeholder="مثال: تمرين الاثنين" value={form.title} onChange={(e) => upd("title", e.target.value)} /></div>
            <div className="ig"><label>التاريخ *</label><input type="date" value={form.date} onChange={(e) => upd("date", e.target.value)} /></div>
            <div className="tc">
              <div className="ig"><label>وقت البداية *</label><input type="time" value={form.startTime} onChange={(e) => upd("startTime", e.target.value)} /></div>
              <div className="ig"><label>وقت النهاية *</label><input type="time" value={form.endTime} onChange={(e) => upd("endTime", e.target.value)} /></div>
            </div>
            <div className="ig"><label>الموقع *</label><input placeholder="مثال: ملاعب ڨيا، حي المصانع" value={form.location} onChange={(e) => upd("location", e.target.value)} /></div>
            <div className="tc">
              <div className="ig"><label>رقم الملعب</label><input placeholder="11" value={form.fieldNumber} onChange={(e) => upd("fieldNumber", e.target.value)} /></div>
              <div className="ig"><label>عدد الأساسيين</label><input type="number" value={form.maxMainPlayers} onChange={(e) => upd("maxMainPlayers", e.target.value)} /></div>
            </div>
            <div className="dvd" />
            <div style={{ fontSize: 12, fontWeight: 700, color: "#555", marginBottom: 10 }}>💰 حساب القطة</div>
            <div className="tc">
              <div className="ig"><label>قيمة الملعب (ريال) *</label><input type="number" placeholder="352" value={form.fieldCost} onChange={(e) => upd("fieldCost", e.target.value)} /></div>
              <div className="ig">
                <label>التقريب</label>
                <select value={form.rounding} onChange={(e) => upd("rounding", e.target.value)}>
                  <option value="round">لأقرب ريال</option>
                  <option value="ceil">للأعلى</option>
                  <option value="none">بدون تقريب</option>
                </select>
              </div>
            </div>
            {price > 0 && <div className="al ai" style={{ marginBottom: 10 }}>القطة لكل لاعب: <strong>{price} ريال</strong></div>}
            <div className="dvd" />
            <div className="ig"><label>رابط Google Maps</label><input placeholder="https://maps.google.com/..." value={form.mapLink} onChange={(e) => upd("mapLink", e.target.value)} /></div>
            <div className="ig"><label>مهلة الاعتذار (ساعات)</label><input type="number" value={form.cancelDeadlineHours} onChange={(e) => upd("cancelDeadlineHours", e.target.value)} /></div>
            <div className="ig"><label>تعليمات الحضور</label><input value={form.instructions} onChange={(e) => upd("instructions", e.target.value)} /></div>
            <div style={{ display: "flex", gap: 8 }}>
              <button className="btn btn-g" style={{ flex: 1, marginBottom: 0 }} onClick={handleCreate} disabled={busy}>{busy ? "جاري..." : "إنشاء التمرين"}</button>
              <button className="btn btn-o" style={{ marginBottom: 0, padding: "11px 16px" }} onClick={() => { setShowForm(false); setErr(null); }}>إلغاء</button>
            </div>
          </div>
        )}

        <div style={{ marginTop: 4 }}>
          {sessions.length === 0 && !showForm && (
            <div className="card" style={{ textAlign: "center", color: "#bbb", padding: "32px 16px" }}>
              <div style={{ fontSize: 32, marginBottom: 8 }}>📋</div>
              <div style={{ fontSize: 13, fontWeight: 600 }}>لا يوجد تمارين بعد</div>
              <div style={{ fontSize: 11, marginTop: 4 }}>أنشئ أول تمرين وأرسل الرابط للمجموعة</div>
            </div>
          )}
          {sessions.map((s) => (
            <div key={s.id} className="card card-clickable fade" onClick={() => navigate(`/manage/${s.id}`)}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div>
                  <div className="session-card-title">{s.title}</div>
                  <div className="session-card-date">{fmtDate(s.date)} · {s.startTime}–{s.endTime}</div>
                  <div className="session-card-meta">{s.location}{s.fieldNumber ? `، ملعب ${s.fieldNumber}` : ""} · القطة: {s.price} ريال</div>
                </div>
                <span className={`bdg ${s.registrationOpen ? "bdg-g" : "bdg-r"}`}>
                  {s.registrationOpen ? "● مفتوح" : "● مغلق"}
                </span>
              </div>
            </div>
          ))}
        </div>
        <Footer />
      </div>
    </>
  );
}
