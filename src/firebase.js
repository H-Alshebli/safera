import { initializeApp } from "firebase/app";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, onAuthStateChanged, updateProfile } from "firebase/auth";
import { getFirestore, collection, doc, addDoc, updateDoc, deleteDoc, onSnapshot, serverTimestamp, query, orderBy, where, getDoc, getDocs, setDoc } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyBdyZ1nLc7lEGX0ptJVNpBYpwDOvuVCrs0",
  authDomain: "football-idea.firebaseapp.com",
  projectId: "football-idea",
  storageBucket: "football-idea.firebasestorage.app",
  messagingSenderId: "612976434599",
  appId: "1:612976434599:web:826d2fd99074ca218c6a82",
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export { serverTimestamp };

// ── Auth ──────────────────────────────────────────────
export async function registerAdmin(displayName, phone, email, password) {
  const cred = await createUserWithEmailAndPassword(auth, email, password);
  await updateProfile(cred.user, { displayName });
  await setDoc(doc(db, "users", cred.user.uid), {
    displayName, phone, email, role: "admin",
    createdAt: serverTimestamp(), lastActive: serverTimestamp(),
  });
  return cred.user;
}

export async function loginAdmin(email, password) {
  const cred = await signInWithEmailAndPassword(auth, email, password);
  await updateDoc(doc(db, "users", cred.user.uid), { lastActive: serverTimestamp() });
  return cred.user;
}

export function logoutAdmin() { return signOut(auth); }
export function onAuthChange(cb) { return onAuthStateChanged(auth, cb); }

export async function getUserData(uid) {
  const snap = await getDoc(doc(db, "users", uid));
  return snap.exists() ? snap.data() : null;
}

// ── Sessions ──────────────────────────────────────────
export async function createSession(uid, data) {
  const ref = await addDoc(collection(db, "sessions"), {
    ...data, adminUid: uid, registrationOpen: true, createdAt: serverTimestamp(),
  });
  const statsRef = doc(db, "stats", "global");
  const snap = await getDoc(statsRef);
  if (snap.exists()) await updateDoc(statsRef, { totalSessions: (snap.data().totalSessions || 0) + 1 });
  else await setDoc(statsRef, { totalSessions: 1, totalAdmins: 0 });
  return ref.id;
}

export function subscribeAdminSessions(uid, cb) {
  const q = query(collection(db, "sessions"), where("adminUid", "==", uid), orderBy("createdAt", "desc"));
  return onSnapshot(q, (snap) => cb(snap.docs.map((d) => ({ id: d.id, ...d.data() }))));
}

export function subscribeSession(sessionId, cb) {
  return onSnapshot(doc(db, "sessions", sessionId), (snap) => {
    if (snap.exists()) cb({ id: snap.id, ...snap.data() });
    else cb(null);
  });
}

export async function updateSession(sessionId, data) {
  await updateDoc(doc(db, "sessions", sessionId), data);
}

// ── Registrations ─────────────────────────────────────
export function subscribeRegistrations(sessionId, cb) {
  const q = query(collection(db, "sessions", sessionId, "registrations"), orderBy("registeredAt", "asc"));
  return onSnapshot(q, (snap) => cb(snap.docs.map((d) => ({ id: d.id, ...d.data() }))));
}

// Step 1: reserve spot immediately with phone
export async function reserveSpot(sessionId, phone) {
  // check duplicate
  const q = query(collection(db, "sessions", sessionId, "registrations"), where("phone", "==", phone));
  const snap = await getDocs(q);
  if (!snap.empty) {
    const existing = { id: snap.docs[0].id, ...snap.docs[0].data() };
    return { exists: true, reg: existing };
  }
  const ref = await addDoc(collection(db, "sessions", sessionId, "registrations"), {
    playerName: "", phone, status: "active", isGuest: false,
    addedByName: null, addedByPhone: null,
    registeredAt: serverTimestamp(), cancelledAt: null,
    paid: false, paidAt: null,
  });
  return { exists: false, id: ref.id };
}

// Step 2: set name after spot reserved
export async function setPlayerName(sessionId, regId, name) {
  await updateDoc(doc(db, "sessions", sessionId, "registrations", regId), { playerName: name });
}

// Add guest
export async function addGuest(sessionId, guestName, addedByName, addedByPhone) {
  return await addDoc(collection(db, "sessions", sessionId, "registrations"), {
    playerName: guestName, phone: null, status: "active", isGuest: true,
    addedByName, addedByPhone,
    registeredAt: serverTimestamp(), cancelledAt: null,
    paid: false, paidAt: null,
  });
}

export async function updateRegistration(sessionId, regId, data) {
  await updateDoc(doc(db, "sessions", sessionId, "registrations", regId), data);
}

export async function cancelRegistration(sessionId, regId) {
  await updateDoc(doc(db, "sessions", sessionId, "registrations", regId), {
    status: "cancelled", cancelledAt: serverTimestamp(),
  });
}

export async function restoreRegistration(sessionId, regId) {
  await updateDoc(doc(db, "sessions", sessionId, "registrations", regId), {
    status: "active", cancelledAt: null,
  });
}

export async function deleteRegistration(sessionId, regId) {
  await deleteDoc(doc(db, "sessions", sessionId, "registrations", regId));
}

export async function confirmPayment(sessionId, regId) {
  await updateDoc(doc(db, "sessions", sessionId, "registrations", regId), {
    paid: true, paidAt: serverTimestamp(),
  });
}

// Admin registers himself as player
export async function adminRegisterSelf(sessionId, adminName, adminPhone) {
  const q = query(collection(db, "sessions", sessionId, "registrations"), where("phone", "==", adminPhone));
  const snap = await getDocs(q);
  if (!snap.empty) return { exists: true };
  const ref = await addDoc(collection(db, "sessions", sessionId, "registrations"), {
    playerName: adminName, phone: adminPhone, status: "active", isGuest: false,
    addedByName: null, addedByPhone: null,
    registeredAt: serverTimestamp(), cancelledAt: null,
    paid: false, paidAt: null,
  });
  return { exists: false, id: ref.id };
}

// ── Super Admin ───────────────────────────────────────
export function subscribeAllUsers(cb) {
  const q = query(collection(db, "users"), orderBy("createdAt", "desc"));
  return onSnapshot(q, (snap) => cb(snap.docs.map((d) => ({ id: d.id, ...d.data() }))));
}

export function subscribeGlobalStats(cb) {
  return onSnapshot(doc(db, "stats", "global"), (snap) => {
    if (snap.exists()) cb(snap.data());
    else cb({});
  });
}

export async function getAllSessionsCount() {
  const snap = await getDocs(collection(db, "sessions"));
  return snap.size;
}
