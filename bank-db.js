// ═══════════════════════════════════════════════════════════════
// ITRACE BANK FINANCIAL — shared data layer (Firebase)
// Every page uses these functions instead of localStorage.
// ═══════════════════════════════════════════════════════════════
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {
  getAuth, signInWithEmailAndPassword, signOut, onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import {
  getFirestore, doc, getDoc, updateDoc, collection, collectionGroup,
  getDocs, addDoc, query, orderBy, serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// ── 1. PASTE YOUR FIREBASE CONFIG HERE ──────────────────────────
const firebaseConfig = {
  apiKey: "AIzaSyAEpYhNaKUIlS8lI18fDzvH2ls3QBI5NSU",
  authDomain: "trace-bank-2.firebaseapp.com",
  projectId: "trace-bank-2",
  storageBucket: "trace-bank-2.firebasestorage.app",
  messagingSenderId: "298361279013",
  appId: "1:298361279013:web:0a30ad1a3d35a980e8a5cc",
  measurementId: "G-E8RZ6PBSY9"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

// ── 2. CUSTOMER SIGN-IN ─────────────────────────────────────────
// Customers type an account number and password. Firebase stores the
// password securely (never in plain text). Behind the scenes the account
// number becomes an email-style login, e.g. bus-10293847@accounts.itracebank.org
const ACCOUNT_DOMAIN = "accounts.itracebank.org";
export const emailFor = acc => acc.toLowerCase() + "@" + ACCOUNT_DOMAIN;

export async function customerSignIn(acc, password){
  await signInWithEmailAndPassword(auth, emailFor(acc), password);
  const c = await getCustomer(acc);
  if(!c) throw new Error("ACCOUNT_NOT_FOUND | searched: customers/" + acc + " | project: " + firebaseConfig.projectId);
  if(c.status === "Frozen") throw new Error("FROZEN");
  return c;
}
export const customerSignOut = () => signOut(auth);

// ── 3. CUSTOMER DATA ────────────────────────────────────────────
export async function getCustomer(acc){
  const snap = await getDoc(doc(db, "customers", acc));
  return snap.exists() ? { acc, ...snap.data() } : null;
}

export async function listCustomers(){
  const snap = await getDocs(collection(db, "customers"));
  return snap.docs.map(d => ({ acc: d.id, ...d.data() }));
}

export async function setBalance(acc, balance){
  await updateDoc(doc(db, "customers", acc), { balance });
}

export async function setStatus(acc, status){
  await updateDoc(doc(db, "customers", acc), { status });
}

// ── 4. TRANSACTIONS ─────────────────────────────────────────────
export async function addTransaction(acc, tx){
  await addDoc(collection(db, "customers", acc, "transactions"),
    { ...tx, createdAt: serverTimestamp() });
}

export async function listTransactions(acc){
  const q = query(collection(db, "customers", acc, "transactions"), orderBy("createdAt", "desc"));
  return (await getDocs(q)).docs.map(d => ({ id: d.id, ...d.data() }));
}

export async function listAllTransactions(){
  const q = query(collectionGroup(db, "transactions"), orderBy("createdAt", "desc"));
  return (await getDocs(q)).docs.map(d => ({ id: d.id, acc: d.ref.parent.parent.id, ...d.data() }));
}

// ── 5. LOANS ────────────────────────────────────────────────────
export async function addLoan(acc, loan){
  await addDoc(collection(db, "customers", acc, "loans"),
    { ...loan, createdAt: serverTimestamp() });
}

export async function listAllLoans(){
  const q = query(collectionGroup(db, "loans"), orderBy("createdAt", "desc"));
  return (await getDocs(q)).docs.map(d => ({ id: d.id, acc: d.ref.parent.parent.id, ...d.data() }));
}

// ── 6. ADMIN SIGN-IN ────────────────────────────────────────────
export const adminSignIn = (email, password) => signInWithEmailAndPassword(auth, email, password);
export const adminSignOut = () => signOut(auth);
export const onAuthChange = cb => onAuthStateChanged(auth, cb);

// ── 7. NOT IN THIS FILE ─────────────────────────────────────────
// Creating new customer logins and resetting customer passwords need
// a small server-side function (Firebase Cloud Functions), because only
// the server can create or change other users' passwords.
