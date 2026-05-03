import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { css, fmtDate, fmtTime, getLists, canCancelNow, r2ms, Footer } from "../theme";
import { subscribeSession, subscribeRegistrations, reserveSpot, setPlayerName, cancelRegistration, confirmPayment, addGuest, updateRegistration } from "../firebase";

export default function PlayerPage() {
  const { sessionId } = useParams();
  const [session, setSession] = useState(null);
  const [regs, setRegs] = useState([]);
  const [notFound, setNotFound] = useState(false);

  // My state
  const [myReg, setMyReg] = useState(null);
  const [step, setStep] = useState("phone"); // phone | name | player
  const [phone, setPhone] = useState("");
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [flash, setFlash] = useState(null);

  // Guest
  const [showAddGuest, setShowAddGuest] = useState(false);
  const [guestName, setGuestName] = useState("");

  useEffect(() => {
    return subscribeSession(sessionId, (d) => { if (!d) setNotFound(true); else setSession(d); });
  }, [sessionId]);

  useEffect(() => {
    return subscribeRegistrations(sessionId, (data) => {
      setRegs(data);
      // update myReg if exists
      if (myReg) {
        const updated = data.find((r) => r.id === myReg.id);
        if (updated) setMyReg(updated);
      }
    });
  }, [sessionId, myReg?.id]);

  function msg(txt, type) {
    setFlash({ txt, type });
    setTimeout(() => setFlash(null), 3500);
  }

  async function handlePhone() {
    const cleaned = phone.replace(/\D/g, "");
    if (cleaned.length < 9) { msg("أدخل رقم جوال صحيح", "e"); return; }
    setBusy(true);
    try {
      const result = await reserveSpot(sessionId, cleaned);
      if (result.exists) {
        setMyReg(result.reg);
        setStep("player");
      } else {
        setMyReg({ id: result.id, playerName: "", phone: cleaned, status: "active" });
        setStep("name");
      }
    } catch { msg("حدث خطأ، حاول مرة ثانية", "e"); }
    setBusy(false);
  }

  async function handleName() {
    if (!name.trim()) { msg("أدخل اسمك", "e"); return; }
    setBusy(true);
    try {
      await setPlayerName(sessionId, myReg.id, name.trim());
      setMyReg((r) => ({ ...r, playerName: name.trim() }));
      setStep("player");
      msg("تم تسجيلك بنجاح ✓", "ok");
    } catch { msg("حدث خطأ", "e"); }
    setBusy(false);
  }

  async function handleCancel() {
    if (!canCancelNow(session.startTime, session.cancelDeadlineHours, session.date)) {
      msg("انتهت مهلة الاعتذار.", "e"); return;
    }
    setBusy(true);
    try {
      await cancelRegistration(sessionId, myReg.id);
      setMyReg((r) => ({ ...r, status: "cancelled" }));
      msg("تم تسجيل اعتذارك", "w");
    } catch { msg("حدث خطأ", "e"); }
    setBusy(false);
  }

  async function handlePay() {
    setBusy(true);
    try {
      await confirmPayment(sessionId, myReg.id);
      setMyReg((r) => ({ ...r, paid: true }));
      msg("تم تأكيد الدفع ✓", "ok");
    } catch { msg("حدث خطأ", "e"); }
    setBusy(false);
  }

  async function handleAddGuest() {
    if (!guestName.trim()) { msg("أدخل اسم الضيف", "e"); return; }
    setBusy(true);
    try {
      await addGuest(sessionId, guestName.trim(), myReg.playerName, myReg.phone);
      setGuestName("");
      setShowAddGuest(false);
      msg("تمت إضافة الضيف ✓", "ok");
    } catch { msg("حدث خطأ", "e"); }
    setBusy(false);
  }

  async function handleCancelGuest(guestId) {
    await cancelRegistration(sessionId, guestId);
    msg("تم اعتذار الضيف", "w");
  }

  async function handlePayGuest(guestId) {
    await confirmPayment(sessionId, guestId);
    msg("تم تأكيد دفع الضيف ✓", "ok");
  }

  if (notFound) return (
    <><style>{css}</style>
    <div className="app" style={{ textAlign: "center", paddingTop: 80 }}>
      <div style={{ fontSize: 40, marginBottom: 12 }}>🔍</div>
      <div style={{ fontSize: 16, fontWeight: 700 }}>التمرين غير موجود</div>
    </div></>
  );

  if (!session) return <><style>{css}</style><div className="app"><div className="loading">⚽ جاري التحميل...</div></div></>;

  const lists = getLists(regs, session.maxMainPlayers);
  const flashCls = flash?.type === "ok" ? "aok" : flash?.type === "w" ? "aw" : "ae";
  const cc = canCancelNow(session.startTime, session.cancelDeadlineHours, session.date);

  // Find my position
  let mySt = null;
  if (myReg?.status === "active") {
    const mi = lists.main.findIndex((p) => p.id === myReg.id);
    const ri = lists.reserve.findIndex((p) => p.id === myReg.id);
    if (mi >= 0) mySt = { list: "main", rank: mi + 1 };
    else if (ri >= 0) mySt = { list: "reserve", rank: ri + 1 };
  }

  // My guests
  const myGuests = regs.filter((r) => r.isGuest && r.addedByPhone === myReg?.phone && r.status === "active");

  return (
    <>
      <style>{css}</style>
      <div className="app">
        <div className="header">
          <div>
            <div className="header-title">{session.title}</div>
            <div className="header-sub">{fmtDate(session.date)} · {session.startTime}–{session.endTime} · {session.fieldNumber ? `ملعب ${session.fieldNumber}` : ""}</div>
          </div>
          <span className={`hbadge plain${session.registrationOpen ? "" : " closed"}`}>{session.registrationOpen ? "● مفتوح" : "● مغلق"}</span>
        </div>

        {flash && <div className={`al ${flashCls}`}>{flash.txt}</div>}

        {/* Session info */}
        <div className="card">
          <div className="igrid">
            <div className="icell"><div className="ilbl">الوقت</div><div className="ival">{session.startTime} – {session.endTime}</div></div>
            <div className="icell"><div className="ilbl">القطة</div><div className="ival">{session.price} ريال</div></div>
            {session.date && <div className="icell"><div className="ilbl">التاريخ</div><div className="ival" style={{ fontSize: 12 }}>{fmtDate(session.date)}</div></div>}
            <div className="icell" style={{ gridColumn: "1/-1" }}>
              <div className="ilbl">الموقع</div>
              <div className="ival" style={{ fontSize: 12 }}>
                {session.location}{session.fieldNumber ? `، ملعب ${session.fieldNumber}` : ""}
                {session.mapLink && <a href={session.mapLink} target="_blank" rel="noreferrer" style={{ marginRight: 8, fontSize: 11, color: "#1a73e8", fontWeight: 700, textDecoration: "none" }}>📍 خريطة</a>}
              </div>
            </div>
          </div>
          {session.instructions && <div className="al aw" style={{ margin: 0 }}>{session.instructions}</div>}
        </div>

        {/* STEP: Phone */}
        {step === "phone" && (
          <div className="card fade">
            <div className="card-title">أدخل رقم جوالك</div>
            <div className="ig">
              <div className="phone-input-wrap">
                <span className="phone-prefix">🇸🇦 +966</span>
                <input type="tel" placeholder="5xxxxxxxx" value={phone} onChange={(e) => setPhone(e.target.value.replace(/\D/g, ""))} maxLength={9} onKeyDown={(e) => e.key === "Enter" && handlePhone()} autoFocus />
              </div>
            </div>
            {!session.registrationOpen
              ? <div className="al aw">التسجيل مغلق حالياً — يمكنك إدخال رقمك لمشاهدة وضعك</div>
              : null}
            <button className="btn btn-g" onClick={handlePhone} disabled={busy}>{busy ? "جاري..." : "دخول / حجز مقعد"}</button>
          </div>
        )}

        {/* STEP: Name */}
        {step === "name" && (
          <div className="card fade">
            <div className="card-title">🎉 تم حجز مقعدك!</div>
            <div className="al ai">أدخل اسمك لإتمام التسجيل</div>
            <div className="ig"><label>اسمك الكامل</label><input placeholder="أدخل اسمك" value={name} onChange={(e) => setName(e.target.value)} onKeyDown={(e) => e.key === "Enter" && handleName()} autoFocus /></div>
            <button className="btn btn-g" onClick={handleName} disabled={busy}>{busy ? "جاري..." : "تأكيد الاسم"}</button>
          </div>
        )}

        {/* STEP: Player view */}
        {step === "player" && myReg && (
          <>
            {mySt && (
              <div className={`myst${mySt.list === "reserve" ? " res" : ""} fade`}>
                <div className="myrank">#{mySt.rank}</div>
                <div className="mydesc">{mySt.list === "main" ? "✓ أنت في القائمة الأساسية" : "⏳ أنت في قائمة الاحتياط"}</div>
                <div style={{ fontSize: 11, marginTop: 6, opacity: .7 }}>{myReg.playerName}</div>
              </div>
            )}
            {myReg.status === "cancelled" && <div className="al ae">أنت في قائمة المعتذرين</div>}

            {myReg.status === "active" && (
              <div className="card">
                <div style={{ display: "flex", gap: 8 }}>
                  {cc
                    ? <button className="btn btn-r" style={{ flex: 1, marginBottom: 0 }} onClick={handleCancel} disabled={busy}>اعتذار عن الحضور</button>
                    : <div className="al ae" style={{ flex: 1, margin: 0, display: "flex", alignItems: "center" }}>انتهت مهلة الاعتذار</div>}
                  {!myReg.paid
                    ? <button className="btn btn-blue" style={{ flex: 1, marginBottom: 0 }} onClick={handlePay} disabled={busy}>✓ تم الدفع</button>
                    : <div className="al aok" style={{ flex: 1, margin: 0, textAlign: "center", display: "flex", alignItems: "center", justifyContent: "center" }}>✅ تم الدفع</div>}
                </div>
              </div>
            )}

            {/* My guests */}
            {myGuests.length > 0 && (
              <div className="card">
                <div className="card-title">ضيوفي <span className="bdg bdg-b">{myGuests.length}</span></div>
                {myGuests.map((g) => (
                  <div key={g.id} className="row">
                    <div className="pn">
                      <span className="guest-tag">ضيف</span>{g.playerName}
                    </div>
                    <div className="abtns">
                      {!g.paid && <button className="btn btn-blue btn-sm" onClick={() => handlePayGuest(g.id)}>دفع</button>}
                      {g.paid && <span className="paid-tag paid-yes">✅ دفع</span>}
                      {cc && <button className="btn btn-r btn-sm" onClick={() => handleCancelGuest(g.id)}>اعتذار</button>}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Add guest */}
            {myReg.status === "active" && session.registrationOpen && (
              <div className="card">
                {!showAddGuest
                  ? <button className="btn btn-o" onClick={() => setShowAddGuest(true)}>+ إضافة ضيف</button>
                  : <>
                    <div className="card-title">إضافة ضيف</div>
                    <div className="nrow">
                      <input placeholder="اسم الضيف" value={guestName} onChange={(e) => setGuestName(e.target.value)} onKeyDown={(e) => e.key === "Enter" && handleAddGuest()} autoFocus />
                      <button className="btn btn-g btn-sm" onClick={handleAddGuest} disabled={busy} style={{ padding: "9px 14px" }}>إضافة</button>
                      <button className="btn btn-gray btn-sm" onClick={() => setShowAddGuest(false)}>✕</button>
                    </div>
                  </>}
              </div>
            )}
          </>
        )}

        {/* Stats */}
        <div className="stats">
          <div className="stat"><div className="sn" style={{ color: "#1a5c2e" }}>{lists.main.length}/{session.maxMainPlayers}</div><div className="sl">أساسي</div></div>
          <div className="stat"><div className="sn" style={{ color: "#f0ad4e" }}>{lists.reserve.length}</div><div className="sl">احتياط</div></div>
          <div className="stat"><div className="sn" style={{ color: "#dc3545" }}>{lists.cancelled.length}</div><div className="sl">معتذرين</div></div>
        </div>

        <PlayerList title="القائمة الأساسية" players={lists.main} nc="g" bt="g" myId={myReg?.id} />
        <PlayerList title="الاحتياط" players={lists.reserve} nc="y" bt="y" myId={myReg?.id} />
        <PlayerList title="المعتذرين" players={lists.cancelled} nc="r" bt="r" myId={myReg?.id} isCan />

        <Footer />
      </div>
    </>
  );
}

function PlayerList({ title, players, nc, bt, myId, isCan }) {
  if (!players.length) return null;
  return (
    <div className="card">
      <div className="card-title">{title} <span className={`bdg bdg-${bt}`}>{players.length}</span></div>
      {players.map((p, i) => (
        <div key={p.id} className={`row${p.id === myId ? " me" : ""}`}>
          <div className={`num n${nc}`}>{i + 1}</div>
          <div className="pn">
            {p.id === myId && <span className="metag">أنت</span>}
            {p.isGuest && <span className="guest-tag">ضيف</span>}
            {p.playerName || <span style={{ color: "#ccc" }}>جاري التسجيل...</span>}
            {p.isGuest && p.addedByName && <div className="pn-sub">بواسطة {p.addedByName}</div>}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
            {!isCan && <span className={`paid-tag ${p.paid ? "paid-yes" : "paid-no"}`}>{p.paid ? "✅" : "⏳"}</span>}
            <span className="pt">{fmtTime(isCan ? p.cancelledAt : p.registeredAt)}</span>
          </div>
        </div>
      ))}
    </div>
  );
}
