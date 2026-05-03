import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { css, Footer } from "../theme";
import { registerAdmin, loginAdmin, onAuthChange } from "../firebase";

export default function AuthPage() {
  const [mode, setMode] = useState("login");
  const [displayName, setDisplayName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    return onAuthChange((user) => { if (user) navigate("/dashboard"); });
  }, [navigate]);

  async function handleSubmit() {
    setErr(null);
    if (!email || !password) { setErr("أدخل البيانات كاملة"); return; }
    if (mode === "register" && (!displayName.trim() || !phone.trim())) { setErr("أدخل الاسم ورقم الجوال"); return; }
    setBusy(true);
    try {
      if (mode === "register") await registerAdmin(displayName.trim(), phone.trim(), email.trim(), password);
      else await loginAdmin(email.trim(), password);
      navigate("/dashboard");
    } catch (e) {
      const msgs = {
        "auth/email-already-in-use": "البريد مسجل مسبقاً",
        "auth/invalid-email": "بريد إلكتروني غير صحيح",
        "auth/weak-password": "كلمة السر ضعيفة (6 أحرف على الأقل)",
        "auth/user-not-found": "الحساب غير موجود",
        "auth/wrong-password": "كلمة السر غير صحيحة",
        "auth/invalid-credential": "بيانات الدخول غير صحيحة",
      };
      setErr(msgs[e.code] || "حدث خطأ، حاول مرة ثانية");
    }
    setBusy(false);
  }

  return (
    <>
      <style>{css}</style>
      <style>{`
        .auth-wrap{min-height:100vh;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:20px}
        .auth-card{background:white;border-radius:18px;border:.5px solid #e8e8e8;padding:28px 24px;width:100%;max-width:380px;box-shadow:0 4px 24px rgba(0,0,0,.08)}
        .auth-logo{text-align:center;margin-bottom:24px}
        .auth-logo-icon{font-size:40px;margin-bottom:6px}
        .auth-logo-name{font-size:26px;font-weight:800;color:#1a5c2e}
        .auth-logo-sub{font-size:12px;color:#aaa;margin-top:2px}
        .auth-toggle{display:flex;gap:0;background:#f5f5f5;border-radius:10px;padding:4px;margin-bottom:20px}
        .auth-toggle button{flex:1;padding:8px;border:none;border-radius:7px;cursor:pointer;font-size:13px;font-weight:700;background:transparent;color:#888;font-family:inherit;transition:.2s}
        .auth-toggle button.on{background:white;color:#1a5c2e;box-shadow:0 1px 4px rgba(0,0,0,.1)}
      `}</style>
      <div className="auth-wrap">
        <div className="auth-card fade">
          <div className="auth-logo">
            <div className="auth-logo-icon">⚽</div>
            <div className="auth-logo-name">صافرة</div>
            <div className="auth-logo-sub">نظام تسجيل التمارين</div>
          </div>
          <div className="auth-toggle">
            <button className={mode === "login" ? "on" : ""} onClick={() => { setMode("login"); setErr(null); }}>تسجيل الدخول</button>
            <button className={mode === "register" ? "on" : ""} onClick={() => { setMode("register"); setErr(null); }}>حساب جديد</button>
          </div>
          {err && <div className="al ae">{err}</div>}
          {mode === "register" && (
            <>
              <div className="ig"><label>الاسم الكامل</label><input placeholder="اسمك الكامل" value={displayName} onChange={(e) => setDisplayName(e.target.value)} /></div>
              <div className="ig">
                <label>رقم الجوال</label>
                <div className="phone-input-wrap">
                  <span className="phone-prefix">🇸🇦 +966</span>
                  <input placeholder="5xxxxxxxx" value={phone} onChange={(e) => setPhone(e.target.value.replace(/\D/g, ""))} maxLength={9} />
                </div>
              </div>
            </>
          )}
          <div className="ig"><label>البريد الإلكتروني</label><input type="email" placeholder="example@email.com" value={email} onChange={(e) => setEmail(e.target.value)} style={{ direction: "ltr", textAlign: "right" }} /></div>
          <div className="ig"><label>كلمة السر</label><input type="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} onKeyDown={(e) => e.key === "Enter" && handleSubmit()} /></div>
          <button className="btn btn-g" onClick={handleSubmit} disabled={busy} style={{ marginTop: 4 }}>
            {busy ? "جاري..." : mode === "login" ? "دخول" : "إنشاء حساب"}
          </button>
        </div>
        <Footer />
      </div>
    </>
  );
}
