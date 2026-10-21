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
  getDocs, addDoc, setDoc, query, orderBy, serverTimestamp
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

export const PROJECT_ID = firebaseConfig.projectId;

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
  if(!c){
    const ids = (await listCustomers()).map(x => x.acc);
    throw new Error("ACCOUNT_NOT_FOUND | searched: customers/" + acc + " | project: " + firebaseConfig.projectId + " | IDs the site can see: " + (ids.length ? ids.join(", ") : "none"));
  }
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

export async function saveCustomer(acc, data){
  await setDoc(doc(db, "customers", acc), data);
}

export async function addRequest(acc, data){
  await addDoc(collection(db, "customers", acc, "requests"),
    { ...data, createdAt: serverTimestamp() });
}

export async function setBalance(acc, balance){
  await updateDoc(doc(db, "customers", acc), { balance });
}


export async function setPhoto(acc, photo){
  await updateDoc(doc(db, "customers", acc), { photo });
}

export async function setCustomerCard(acc, card){
  await updateDoc(doc(db, "customers", acc), { card });
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


export async function listRequests(acc){
  const snap = await getDocs(collection(db, "customers", acc, "requests"));
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

export async function updateRequest(acc, id, data){
  await updateDoc(doc(db, "customers", acc, "requests", id), data);
}

export async function completeTransaction(acc, ref, status){
  const list = await listTransactions(acc);
  const hit = list.find(t => t.ref === ref);
  if(!hit) return false;
  await updateDoc(doc(db, "customers", acc, "transactions", hit.id), { status });
  return true;
}


export async function submitApplication(app){
  await addDoc(collection(db, "applications"), { ...app, createdAt: serverTimestamp() });
}

export async function listApplications(){
  const snap = await getDocs(collection(db, "applications"));
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

export async function updateApplication(id, data){
  await updateDoc(doc(db, "applications", id), data);
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
