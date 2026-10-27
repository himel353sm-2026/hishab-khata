/* =====================================================================
   Business Calculator Book  —  src/App.js  (পুরো ফাইল রিপ্লেস করুন)
   - Splash বাবল অ্যানিমেশন (৪ সেকেন্ড) → লগইন / অ্যাপ
   - Firebase Auth + Firestore: যেকোনো ডিভাইসে একই ID দিয়ে লগইন করলে
     সব ডাটা রিয়েল-টাইমে পাওয়া যাবে (অফলাইনেও কাজ করে, নেট এলে সিঙ্ক হয়)
   - Tailwind লাগবে না — স্টাইল এই ফাইলের ভিতরেই আছে
   ===================================================================== */
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { initializeApp } from 'firebase/app';
import {
  getAuth, onAuthStateChanged, signInWithEmailAndPassword,
  createUserWithEmailAndPassword, updateProfile, signOut, EmailAuthProvider, reauthenticateWithCredential, deleteUser,
} from 'firebase/auth';
import {
  getFirestore, initializeFirestore, persistentLocalCache, persistentMultipleTabManager,
  collection, doc, onSnapshot, writeBatch, increment,
} from 'firebase/firestore';

/* ------------------------------------------------------------------
   ১) Firebase কনফিগ — Firebase Console থেকে কপি করে এখানে বসান
   ------------------------------------------------------------------ */
const firebaseConfig = {
  apiKey: "AIzaSyCWnwulkxEdwPjQbRphxyiNyBAghvjBp4I",
  authDomain: "hishap-khata.firebaseapp.com",
  projectId: "hishap-khata",
  storageBucket: "hishap-khata.firebasestorage.app",
  messagingSenderId: "961831177568",
  appId: "1:961831177568:web:b913553ff713d185b76205",
  measurementId: "G-RGRG1N8Y47"
};

/* ------------------------------------------------------------------
   ২) আপডেট সেটিংস
   VERSION          : এই অ্যাপের বর্তমান ভার্সন
   UPDATE_URL       : আপনার হোস্ট করা সাইটের version.json লিংক
                      (যেমন https://hishab-khata.vercel.app/version.json)
   APK_URL          : (ঐচ্ছিক) নতুন APK ডাউনলোড লিংক — মোবাইল অ্যাপে এটা খুলবে
   ------------------------------------------------------------------ */
const VERSION = '1.0.0';
const UPDATE_URL = '/version.json';
const APK_URL = '';
const APP_NAME = 'Business Calculator Book';
// OTP সার্ভার-ফাংশনের ঠিকানা। ওয়েবে ফাঁকা থাকবে। মোবাইল APK তে নিজের সাইটের পুরো লিংক দিন (যেমন 'https://hishab-khata.vercel.app')
const API_BASE = '';

const CONFIGURED = !String(firebaseConfig.apiKey).startsWith('YOUR');
const fbApp = initializeApp(firebaseConfig);
const auth = getAuth(fbApp);
let db;
try {
  db = initializeFirestore(fbApp, {
    localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() }),
  });
} catch (e) {
  db = getFirestore(fbApp);
}

/* ============================ ভাষা ============================ */
const L = {
  bn: {
    stock: 'স্টক', list: 'স্টক লিস্ট', tx: 'লেনদেন', ret: 'রিটার্ন', exp: 'খরচ', month: 'মাসিক হিসাব',
    total: 'মোট হিসাব', calc: 'ক্যালকুলেটর', note: 'নোট',
    newProduct: 'নতুন Product', pname: 'Product নাম', buyP: 'কেনা দাম', sellP: 'বেচা দাম', openStock: 'শুরুর Stock',
    add: 'যোগ করুন', stockTable: 'স্টক তালিকা', search: 'পণ্য খুঁজুন...', noProduct: 'কোনো product নেই',
    totalStockVal: 'মোট stock মূল্য (কেনা দামে):', name: 'নাম', stockQty: 'স্টক', value: 'মূল্য', buy: 'কেনা', sell: 'বেচা',
    edit: 'এডিট', save: 'সেভ', cancel: 'বাতিল', confirmDel: 'ডিলিট করবেন? রিসাইকেল বিনে জমা থাকবে।',
    nameReq: 'নাম লিখুন', noStock: 'স্টক নেই!', added: 'যোগ হয়েছে', saved: 'সেভ হয়েছে', deleted: 'রিসাইকেল বিনে গেছে',
    restored: 'রিস্টোর হয়েছে', qty: 'পরিমাণ', profit: 'লাভ', noData: 'কিছু নেই', selectProduct: 'পণ্য বাছুন',
    todaySale: 'আজকের বিক্রি', refund: 'ফেরত দাম', expName: 'খরচের বিবরণ', amount: 'টাকা',
    sales: 'বিক্রি', returns: 'রিটার্ন', netSales: 'নেট বিক্রি', costGoods: 'পণ্যের খরচ', grossProfit: 'মোট লাভ',
    expenses: 'খরচ', netProfit: 'নিট লাভ', allTime: 'সারা জীবনের হিসাব', stockValue: 'স্টকের মূল্য',
    noteHere: 'নোট লিখুন...', settings: 'সেটিংস', account: 'অ্যাকাউন্ট', language: 'ভাষা', theme: 'থিম মুড',
    dark: 'ডার্ক', light: 'হোয়াইট', bin: 'রিসাইকেল বিন', binEmpty: 'রিসাইকেল বিন খালি', restore: 'রিস্টোর',
    emptyBin: 'সব চিরতরে মুছুন', appInfo: 'অ্যাপ ইনফরমেশন ও আপডেট', version: 'বর্তমান ভার্সন', checkUpdate: 'চেক আপডেট',
    upToDate: 'আপনার অ্যাপ লেটেস্ট ভার্সনে আছে', newUpdate: '🔔 নতুন আপডেট এসেছে! আপডেট করতে এখানে ট্যাপ করুন',
    logout: 'লগ আউট করুন', business: 'বিজনেস', addBiz: 'নতুন বিজনেসের নাম', manageBiz: 'বিজনেস ম্যানেজ', rename: 'নাম বদলান',
    login: 'লগইন', register: 'রেজিস্টার', email: 'ইমেইল', password: 'পাসওয়ার্ড', yourName: 'আপনার নাম',
    haveAcc: 'অ্যাকাউন্ট আছে? লগইন করুন', noAcc: 'অ্যাকাউন্ট নেই? রেজিস্টার করুন', fill: 'সব ঘর পূরণ করুন',
    forgot: 'পাসওয়ার্ড ভুলে গেছেন?', resetSent: 'রিসেটের লিংক ইমেইলে পাঠানো হয়েছে — Inbox আর Spam দুটোই দেখুন', needEmail: 'আগে ইমেইল লিখুন',
    types: { product: 'পণ্য', sale: 'লেনদেন', ret: 'রিটার্ন', exp: 'খরচ', note: 'নোট', biz: 'বিজনেস' },
    tagline: 'আপনার ডিজিটাল হিসাব খাতা', loading: 'লোড হচ্ছে...', online: 'অনলাইন — সব ডিভাইসে সিঙ্ক চালু',
    offline: 'অফলাইন — নেট এলে অটো সিঙ্ক হবে', setup: '⚠️ Firebase কনফিগ বসানো হয়নি। App.js এর উপরে firebaseConfig দিন।',
    delForever: 'চিরতরে মুছবেন?', date: 'তারিখ', showPw: 'পাসওয়ার্ড দেখান', delAcc: 'অ্যাকাউন্ট ডিলিট করুন', delAccWarn: 'আপনার অ্যাকাউন্ট আর সব ডেটা (বিজনেস, স্টক, লেনদেন, রিসাইকেল বিনসহ) চিরতরে মুছে যাবে। এটা আর ফেরানো যাবে না। পরে চাইলে এই ইমেইল দিয়ে নতুন করে অ্যাকাউন্ট খুলতে পারবেন।', delAccPass: 'নিশ্চিত করতে আপনার পাসওয়ার্ড দিন', delAccBtn: 'হ্যাঁ, চিরতরে মুছুন', accDeleted: 'অ্যাকাউন্ট মুছে গেছে। চাইলে একই ইমেইলে নতুন অ্যাকাউন্ট খুলুন', otpSent: 'OTP আপনার ইমেইলে পাঠানো হয়েছে (Spam-ও দেখুন)', otpPh: 'ইমেইলে আসা ৬ সংখ্যার OTP', newPass: 'নতুন পাসওয়ার্ড', sendOtp: 'OTP পাঠান', resetBtn: 'পাসওয়ার্ড বদলান', resend: 'আবার OTP পাঠান', backLogin: '← লগইনে ফিরুন', passChanged: 'পাসওয়ার্ড বদলানো হয়েছে', e_nouser: 'এই ইমেইলে কোনো অ্যাকাউন্ট নেই', e_wait: '১ মিনিট পরে আবার চেষ্টা করুন', e_exp: 'OTP মেয়াদ শেষ, আবার OTP নিন', e_otp: 'OTP ভুল', e_many: 'অনেকবার ভুল হয়েছে, আবার OTP নিন',
    e_wrong: 'ইমেইল বা পাসওয়ার্ড ভুল। ইমেইলের বানান দেখুন। আগে রেজিস্টার না করলে নিচে "রেজিস্টার" চাপুন', e_exists: 'এই ইমেইল দিয়ে আগেই অ্যাকাউন্ট আছে', e_weak: 'পাসওয়ার্ড কমপক্ষে ৬ অক্ষর দিন',
    e_net: 'ইন্টারনেট সংযোগ নেই', e_mail: 'ইমেইল সঠিক নয়', e_other: 'কিছু একটা সমস্যা হয়েছে',
  },
  en: {
    stock: 'Stock', list: 'Stock List', tx: 'Transactions', ret: 'Returns', exp: 'Expenses', month: 'Monthly',
    total: 'Total', calc: 'Calculator', note: 'Notes',
    newProduct: 'New Product', pname: 'Product name', buyP: 'Buy price', sellP: 'Sell price', openStock: 'Opening stock',
    add: 'Add', stockTable: 'Stock List', search: 'Search product...', noProduct: 'No products',
    totalStockVal: 'Total stock value (at buy price):', name: 'Name', stockQty: 'Stock', value: 'Value', buy: 'Buy', sell: 'Sell',
    edit: 'Edit', save: 'Save', cancel: 'Cancel', confirmDel: 'Delete? It will be kept in Recycle Bin.',
    nameReq: 'Enter a name', noStock: 'Out of stock!', added: 'Added', saved: 'Saved', deleted: 'Moved to Recycle Bin',
    restored: 'Restored', qty: 'Qty', profit: 'Profit', noData: 'Nothing here', selectProduct: 'Select product',
    todaySale: "Today's sales", refund: 'Refund price', expName: 'Expense detail', amount: 'Amount',
    sales: 'Sales', returns: 'Returns', netSales: 'Net sales', costGoods: 'Cost of goods', grossProfit: 'Gross profit',
    expenses: 'Expenses', netProfit: 'Net profit', allTime: 'All-time summary', stockValue: 'Stock value',
    noteHere: 'Write a note...', settings: 'Settings', account: 'Account', language: 'Language', theme: 'Theme',
    dark: 'Dark', light: 'White', bin: 'Recycle Bin', binEmpty: 'Recycle Bin is empty', restore: 'Restore',
    emptyBin: 'Delete all forever', appInfo: 'App Info & Update', version: 'Current version', checkUpdate: 'Check for update',
    upToDate: 'You are on the latest version', newUpdate: '🔔 New update available! Tap here to update',
    logout: 'Log out', business: 'Business', addBiz: 'New business name', manageBiz: 'Manage businesses', rename: 'Rename',
    login: 'Login', register: 'Register', email: 'Email', password: 'Password', yourName: 'Your name',
    haveAcc: 'Have an account? Login', noAcc: 'No account? Register', fill: 'Fill all fields',
    forgot: 'Forgot password?', resetSent: 'Reset link sent — check both Inbox and Spam', needEmail: 'Enter your email first',
    types: { product: 'Product', sale: 'Transaction', ret: 'Return', exp: 'Expense', note: 'Note', biz: 'Business' },
    tagline: 'Your digital account book', loading: 'Loading...', online: 'Online — synced on all devices',
    offline: 'Offline — will sync when online', setup: '⚠️ Firebase config missing. Fill firebaseConfig at the top of App.js.',
    delForever: 'Delete forever?', date: 'Date', showPw: 'Show password', delAcc: 'Delete account', delAccWarn: 'Your account and ALL data (businesses, stock, transactions, recycle bin) will be permanently deleted. This cannot be undone. You can create a new account with this email later.', delAccPass: 'Enter your password to confirm', delAccBtn: 'Yes, delete forever', accDeleted: 'Account deleted. You can register again with the same email', otpSent: 'OTP sent to your email (check Spam too)', otpPh: '6-digit OTP from email', newPass: 'New password', sendOtp: 'Send OTP', resetBtn: 'Change password', resend: 'Resend OTP', backLogin: '← Back to login', passChanged: 'Password changed', e_nouser: 'No account with this email', e_wait: 'Try again after 1 minute', e_exp: 'OTP expired, request a new one', e_otp: 'Wrong OTP', e_many: 'Too many wrong tries, request a new OTP',
    e_wrong: 'Wrong email or password. Check the email spelling. If you never registered, tap Register', e_exists: 'An account with this email already exists', e_weak: 'Password must be at least 6 characters',
    e_net: 'No internet connection', e_mail: 'Invalid email', e_other: 'Something went wrong',
  },
};

/* ============================ ছোট হেল্পার ============================ */
const ls = (k, d) => { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch (e) { return d; } };
const lsSet = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* ignore */ } };
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
const today = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; };
const num = (v) => { const n = parseFloat(v); return isNaN(n) ? 0 : n; };
const money = (n) => '৳' + (Math.round(n * 100) / 100).toLocaleString('en-US');
const sum = (a, f) => a.reduce((s, x) => s + f(x), 0);
const isNative = () => !!(window.Capacitor && window.Capacitor.isNativePlatform && window.Capacitor.isNativePlatform());

const TABS = [
  ['stock', '📦'], ['list', '📋'], ['tx', '⇄'], ['ret', '↩'], ['exp', '🧾'],
  ['month', '📅'], ['total', '📊'], ['calc', '🧮'], ['note', '📝'],
];

/* Splash বাবল: c = o (কমলা) / g (গ্লাস) */
const BUBBLES = [
  { c: 'o', x: 8, y: 13, d: 0.0, t: 'হিসাব' },
  { c: 'g', x: 52, y: 8, d: 0.15, t: 'স্টক' },
  { c: 'g', x: 28, y: 24, d: 0.3, t: 'লেনদেন', r: 1 },
  { c: 'o', x: 56, y: 29, d: 0.45, t: '৳ লাভ' },
  { c: 'g', x: 6, y: 38, d: 0.6, t: 'খরচ' },
  { c: 'o', x: 30, y: 44, d: 0.75, t: 'মাসিক হিসাব', r: 1 },
  { c: 'g', x: 60, y: 52, d: 0.9, t: 'রিটার্ন' },
  { c: 'o', x: 6, y: 56, d: 1.0, t: 'ক্যালকুলেটর' },
  { c: 'g', x: 40, y: 60, d: 1.1, t: 'নোট', r: 1 },
  { c: 'g', x: 12, y: 67, d: 0.5, t: 'সব ডিভাইসে সিঙ্ক' },
];

/* ============================ CSS ============================ */
const CSS = `
.bcb{--bg:#030712;--card:#0f172a;--card2:#1e293b;--bd:#27364b;--tx:#f1f5f9;--mut:#94a3b8;--ac:#f59e0b;--acx:#1c1200;--red:#f87171;--grn:#4ade80;--gb:rgba(255,255,255,.12);--gbd:rgba(255,255,255,.22);--gt:#fff;
 min-height:100vh;background:var(--bg);color:var(--tx);font-family:"Noto Sans Bengali","Hind Siliguri",system-ui,-apple-system,Segoe UI,Roboto,Arial,sans-serif}
.bcb[data-theme=light]{--bg:#f1f5f9;--card:#ffffff;--card2:#f1f5f9;--bd:#e2e8f0;--tx:#0f172a;--mut:#64748b;--red:#dc2626;--grn:#16a34a;--gb:rgba(255,255,255,.75);--gbd:rgba(255,255,255,.9);--gt:#334155}
.bcb *{box-sizing:border-box;margin:0;padding:0;-webkit-tap-highlight-color:transparent}
.bcb button,.bcb input,.bcb select,.bcb textarea{font:inherit;color:inherit}
.bcb button{cursor:pointer;border:0}
.wrap{max-width:1150px;margin:0 auto;padding:12px 12px 48px}
/* ---------- ডেস্কটপ: পুরো স্ক্রিন জুড়ে বড় করে দেখানো (মোবাইলে কোনো পরিবর্তন নেই) ---------- */
@media(min-width:1000px){.wrap{max-width:none;width:100%;padding:18px 3vw 60px}}
@media(min-width:1000px){.tabs{justify-content:flex-start}}
html,body,#root{width:100%!important;max-width:none!important;margin:0!important;padding:0!important;display:block!important;text-align:left}
.bcb{width:100%!important;max-width:none!important}
.head{display:flex;align-items:center;justify-content:space-between;gap:8px;flex-wrap:nowrap;margin-bottom:16px}
.hleft{display:flex;gap:8px;align-items:center}
.brand{display:flex;align-items:center;gap:10px;background:none;color:var(--ac);font-size:18px;font-weight:800;text-align:left;min-width:0}
.brand b{line-height:1.15}
@media(max-width:560px){.brand{font-size:13px;gap:8px}.brand b{max-width:96px}.bizbox select{max-width:96px}.logo{width:36px;height:36px}}
.logo{width:40px;height:40px;border-radius:12px;background:linear-gradient(135deg,#f97316,#fbbf24);display:grid;place-items:center;font-size:20px;flex:0 0 auto;box-shadow:0 6px 18px rgba(249,115,22,.35)}
.bizbox{display:flex;align-items:center;gap:6px;background:var(--card);border:1px solid var(--bd);border-radius:12px;padding:5px 8px}
.bizbox select{background:transparent;border:0;outline:0;font-weight:700;max-width:150px;font-size:14px}
.bizbox select option{background:var(--card);color:var(--tx)}
.plus{background:var(--ac);color:var(--acx);width:28px;height:26px;border-radius:7px;font-weight:800;font-size:17px;line-height:1}
.gear{background:var(--card);border:1px solid var(--bd);width:40px;height:40px;border-radius:12px;font-size:18px;position:relative}
.dot{position:absolute;right:6px;top:6px;width:8px;height:8px;border-radius:50%;background:var(--grn)}
.dot.off{background:#f97316}
.tabs{touch-action:pan-x pan-y;display:flex;flex-wrap:nowrap;gap:10px;overflow-x:auto;overflow-y:hidden;padding:4px 2px 12px;margin-bottom:8px;scrollbar-width:none;-webkit-overflow-scrolling:touch;overscroll-behavior-x:contain;cursor:grab;user-select:none}
.tabs::-webkit-scrollbar{display:none}
.tab{flex:0 0 auto;display:flex;align-items:center;gap:8px;background:var(--card);border:1px solid var(--bd);padding:12px 17px;border-radius:14px;font-weight:600;white-space:nowrap;font-size:14px}
.tab.on{background:var(--ac);color:var(--acx);border-color:var(--ac);box-shadow:0 4px 18px rgba(245,158,11,.35)}
.card{background:var(--card);border:1px solid var(--bd);border-radius:20px;padding:20px;margin-bottom:16px}
.card h3{font-size:16px;margin-bottom:14px}
.row{display:flex;gap:10px;align-items:center}.between{justify-content:space-between;flex-wrap:wrap}
.bcb input,.bcb select,.bcb textarea{background:var(--card2);border:1px solid var(--bd);border-radius:12px;padding:12px 14px;width:100%;outline:0;font-size:14px}
.bcb input:focus,.bcb select:focus,.bcb textarea:focus{border-color:var(--ac)}
.form5{display:grid;grid-template-columns:repeat(5,1fr);gap:12px}
.form4{display:grid;grid-template-columns:repeat(4,1fr);gap:12px}
.form3{display:grid;grid-template-columns:2fr 1fr 1fr auto;gap:12px}
@media(max-width:760px){.form5,.form4,.form3{grid-template-columns:1fr 1fr}}
.btn{background:var(--ac);color:var(--acx);font-weight:700;border-radius:12px;padding:12px 16px}
.btn.ghost{background:var(--card2);color:var(--tx);border:1px solid var(--bd)}
.btn.red{background:#ef4444;color:#fff}
.btn.full{width:100%}
.search{max-width:260px}
.empty{text-align:center;color:var(--mut);padding:28px 0;font-size:14px}
.total{display:flex;justify-content:space-between;align-items:center;font-weight:700;gap:10px}
.total b{color:var(--ac);font-size:20px}
.thead,.trow{display:grid;grid-template-columns:2fr 1fr 1fr 1fr 1fr;gap:8px;padding:10px 6px;align-items:center;font-size:14px}
.thead{color:var(--mut);font-size:13px;border-bottom:1px solid var(--bd)}
.trow{border-bottom:1px solid var(--bd)}.trow:last-child{border:0}
.item{display:flex;justify-content:space-between;align-items:center;gap:10px;background:var(--card2);border:1px solid var(--bd);border-radius:14px;padding:12px 14px;margin-bottom:10px;flex-wrap:wrap}
.item .nm{font-weight:700}.item .sub{color:var(--mut);font-size:13px;margin-top:3px}
.acts{display:flex;gap:6px;align-items:center}
.ib{width:36px;height:36px;border-radius:10px;background:var(--card);border:1px solid var(--bd);font-size:16px;font-weight:800}
.ib.m{color:var(--red)}.ib.p{color:var(--grn)}
.qty{min-width:34px;text-align:center;font-weight:800}
.pos{color:var(--grn)}.neg{color:var(--red)}
.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(190px,1fr));gap:14px}
.stat{background:var(--card2);border:1px solid var(--bd);border-radius:16px;padding:16px}
.stat small{color:var(--mut)}.stat b{display:block;font-size:22px;margin-top:6px}
.calc{max-width:340px;margin:0 auto}
.disp .ex{font-size:14px;color:var(--mut);min-height:20px;word-break:break-all}.disp .rs{font-size:34px;font-weight:800;word-break:break-all;line-height:1.2}
.disp{background:var(--card2);border-radius:14px;padding:16px;text-align:right;font-size:28px;min-height:70px;word-break:break-all;margin-bottom:12px}
.keys{display:grid;grid-template-columns:repeat(4,1fr);gap:10px}
.keys button{background:var(--card2);border:1px solid var(--bd);border-radius:14px;padding:16px 0;font-size:20px;font-weight:700}
.keys button.op{background:var(--ac);color:var(--acx)}
.modal{position:fixed;inset:0;background:rgba(0,0,0,.6);display:flex;align-items:center;justify-content:center;z-index:50;padding:14px}
.mbox{background:var(--card);border:1px solid var(--bd);border-radius:20px;padding:20px;width:100%;max-width:480px;max-height:90vh;overflow:auto}
.mbox h2{font-size:18px;margin-bottom:14px}
.modal.drawer{padding:0;justify-content:flex-end;align-items:stretch;animation:dfade .2s ease}
.mbox.drawer{position:relative;width:100%;max-width:380px;height:100%;max-height:100vh;border-radius:20px 0 0 20px;border-right:0;padding:20px 18px 28px;animation:dslide .25s ease}
.dclose{position:absolute;top:14px;right:14px;width:34px;height:34px;border-radius:10px;background:var(--card2);border:1px solid var(--bd);font-size:15px}
@keyframes dslide{from{transform:translateX(100%)}to{transform:none}}
@keyframes dfade{from{background:rgba(0,0,0,0)}to{background:rgba(0,0,0,.6)}}
.mbox label{display:block;color:var(--mut);font-size:13px;margin:10px 0 4px}
.sset{display:flex;justify-content:space-between;align-items:center;gap:10px;padding:12px 0;border-bottom:1px solid var(--bd)}
.sset select{max-width:170px}
.muted{color:var(--mut);font-size:13px}
.toast{position:fixed;left:50%;bottom:24px;transform:translateX(-50%);background:var(--ac);color:var(--acx);padding:12px 18px;border-radius:14px;font-weight:700;z-index:300;max-width:92%;text-align:center;box-shadow:0 8px 30px rgba(0,0,0,.4)}
.auth{max-width:400px;margin:0 auto;padding:9vh 14px 30px;position:relative}
.auth .card{padding:26px;position:relative;z-index:1}
.auth h2{text-align:center;color:var(--ac);margin-bottom:6px}
.auth p{text-align:center;color:var(--mut);font-size:13px;margin-bottom:16px}
.auth input{margin-bottom:12px}
.showpw{display:flex;align-items:center;gap:8px;font-size:13px;color:var(--mut);margin-bottom:12px}
.showpw input{width:auto;margin:0;padding:0}
.link{background:none;color:var(--ac);text-decoration:underline;margin-top:12px;width:100%;font-size:14px}
.warn{background:rgba(239,68,68,.12);border:1px solid rgba(239,68,68,.4);color:var(--red);border-radius:12px;padding:10px 12px;font-size:13px;margin-bottom:14px}
.glow{position:fixed;border-radius:50%;filter:blur(70px);opacity:.35;pointer-events:none}
.center{min-height:100vh;display:grid;place-items:center;color:var(--mut)}

/* ---------- Splash ---------- */
.splash{position:fixed;inset:0;z-index:500;background:var(--bg);overflow:hidden;transition:opacity .45s ease}
.splash.out{opacity:0;pointer-events:none}
.splash::before{content:'';position:absolute;inset:0;background:radial-gradient(60% 45% at 50% 38%,rgba(245,158,11,.16),transparent 70%)}
.bub{position:absolute;padding:14px 22px;border-radius:18px;font-weight:700;font-size:16px;white-space:nowrap;opacity:0;
 animation:bubble 3.1s cubic-bezier(.22,1,.36,1) both;will-change:transform,opacity}
.bub::after{content:'';position:absolute;bottom:-9px;right:16px;border-left:9px solid transparent;border-top:11px solid transparent}
.bub.r::after{right:auto;left:16px}
.bub.o{background:linear-gradient(135deg,#f97316,#fbbf24);color:#fff;box-shadow:0 14px 30px rgba(249,115,22,.38),inset 0 1px 0 rgba(255,255,255,.35)}
.bub.o::after{border-top-color:#f97316}
.bub.g{background:var(--gb);color:var(--gt);border:1px solid var(--gbd);backdrop-filter:blur(10px);-webkit-backdrop-filter:blur(10px);box-shadow:0 14px 30px rgba(0,0,0,.28)}
.bub.g::after{border-top-color:var(--gb)}
@keyframes bubble{
 0%{opacity:0;transform:translateY(26px) scale(.35)}
 16%{opacity:1;transform:translateY(0) scale(1.08)}
 26%{transform:translateY(-3px) scale(1)}
 68%{opacity:1;transform:translateY(-12px) scale(1)}
 100%{opacity:0;transform:translateY(-34px) scale(.88)}
}
.stitle{position:absolute;left:0;right:0;bottom:11%;text-align:center;opacity:0;animation:fadeUp 1s ease 1.5s both}
.stitle .logo{margin:0 auto 12px;width:56px;height:56px;font-size:28px;border-radius:16px}
.stitle b{display:block;color:var(--ac);font-size:21px;letter-spacing:.2px}
.stitle span{color:var(--mut);font-size:13px}
@keyframes fadeUp{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:none}}
@media(max-width:420px){.bub{font-size:14px;padding:11px 17px}}
`;

/* ============================ ক্যালকুলেটর ইঞ্জিন ============================ */
// নিরাপদ হিসাব (eval/Function ছাড়া)। + - * / % সাপোর্ট করে। যেমন 200+10% = 220, 50% = 0.5
function calcEval(src) {
  const t = String(src).match(/\d*\.?\d+|\d+\.|[+\-*/%]/g) || [];
  let i = 0;
  const bad = () => { throw new Error('x'); };
  const factor = () => {
    if (t[i] === '-') { i += 1; const f = factor(); return { v: -f.v, p: false }; }
    if (t[i] === '+') { i += 1; return factor(); }
    if (t[i] === undefined || !/^[\d.]/.test(t[i])) bad();
    let v = parseFloat(t[i]); i += 1;
    let p = false;
    while (t[i] === '%') { v /= 100; p = true; i += 1; }
    return { v, p };
  };
  const term = () => {
    let a = factor();
    while (t[i] === '*' || t[i] === '/') {
      const op = t[i]; i += 1;
      const b = factor();
      if (op === '/' && b.v === 0) bad();
      a = { v: op === '*' ? a.v * b.v : a.v / b.v, p: false };
    }
    return a;
  };
  const expr = () => {
    let a = term();
    while (t[i] === '+' || t[i] === '-') {
      const op = t[i]; i += 1;
      const b = term();
      const add = b.p ? a.v * b.v : b.v;          // 200 + 10% = 200 + (200 × 10%)
      a = { v: op === '+' ? a.v + add : a.v - add, p: false };
    }
    return a;
  };
  const r = expr();
  if (i !== t.length) bad();
  const out = Math.round(r.v * 1e10) / 1e10;
  if (!isFinite(out)) bad();
  return out;
}
const calcShow = (n) => (Math.abs(n) >= 1e15 ? String(n) : Number(n).toLocaleString('en-US', { maximumFractionDigits: 10 }));
const calcSym = (s) => s.replace(/\*/g, '×').replace(/\//g, '÷').replace(/-/g, '−');

/* ============================ ছোট কম্পোনেন্ট ============================ */
function Splash({ out }) {
  return (
    <div className={'splash' + (out ? ' out' : '')}>
      {BUBBLES.map((b, i) => (
        <div key={i} className={`bub ${b.c}${b.r ? ' r' : ''}`} style={{ left: b.x + '%', top: b.y + '%', animationDelay: b.d + 's' }}>
          {b.t}
        </div>
      ))}
      <div className="stitle">
        <div className="logo">🧮</div>
        <b>{APP_NAME}</b>
        <span>আপনার ডিজিটাল হিসাব খাতা</span>
      </div>
    </div>
  );
}

function Stats({ r, t }) {
  return (
    <div className="grid">
      <div className="stat"><small>{t('sales')}</small><b>{money(r.rev)}</b></div>
      <div className="stat"><small>{t('returns')}</small><b className="neg">{money(r.rrev)}</b></div>
      <div className="stat"><small>{t('netSales')}</small><b>{money(r.net)}</b></div>
      <div className="stat"><small>{t('costGoods')}</small><b>{money(r.cost)}</b></div>
      <div className="stat"><small>{t('grossProfit')}</small><b className={r.gross >= 0 ? 'pos' : 'neg'}>{money(r.gross)}</b></div>
      <div className="stat"><small>{t('expenses')}</small><b className="neg">{money(r.exp)}</b></div>
      <div className="stat" style={{ borderColor: 'var(--ac)' }}><small>{t('netProfit')}</small><b className={r.netProfit >= 0 ? 'pos' : 'neg'}>{money(r.netProfit)}</b></div>
    </div>
  );
}

/* ============================ মূল অ্যাপ ============================ */
export default function App() {
  const [lang, setLang] = useState(() => ls('bcb_lang', 'bn'));
  const [theme, setTheme] = useState(() => ls('bcb_theme', 'dark'));
  const t = (k) => (L[lang] || L.bn)[k] ?? k;

  const [splash, setSplash] = useState('show');      // show → out → done
  const [user, setUser] = useState(null);
  const [authReady, setAuthReady] = useState(false);
  const [recs, setRecs] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const [fromCache, setFromCache] = useState(true);
  const [online, setOnline] = useState(typeof navigator !== 'undefined' ? navigator.onLine : true);

  const [curSaved, setCurSaved] = useState(null);
  const [tab, setTab] = useState('stock');
  const [q, setQ] = useState('');
  const [month, setMonth] = useState(today().slice(0, 7));
  const [calc, setCalc] = useState('');
  const [calcDone, setCalcDone] = useState(false);
  const [calcPrev, setCalcPrev] = useState('');
  const calcKeyRef = useRef(null);
  const deletingRef = useRef(false);   // অ্যাকাউন্ট মোছার সময় ডিফল্ট বিজনেস আবার তৈরি হওয়া আটকায়
  const [modal, setModal] = useState(null);
  const [toastMsg, setToastMsg] = useState('');
  const [upd, setUpd] = useState(null);

  const [aMode, setAMode] = useState('login');
  const [af, setAf] = useState({ name: '', email: '', pass: '', otp: '' });
  const [busy, setBusy] = useState(false);
  const [dn, setDn] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [dp, setDp] = useState('');
  const [vw, setVw] = useState(typeof window !== 'undefined' ? window.innerWidth : 1000);
  useEffect(() => {
    const f = () => setVw(window.innerWidth);
    window.addEventListener('resize', f);
    return () => window.removeEventListener('resize', f);
  }, []);

  const [pf, setPf] = useState({ name: '', buy: '', sell: '', stock: '' });
  const [sf, setSf] = useState({ pid: '', qty: '1', price: '' });
  const [rf, setRf] = useState({ pid: '', qty: '1', price: '' });
  const [ef, setEf] = useState({ name: '', amount: '', date: today() });
  const [nt, setNt] = useState('');
  const [mf, setMf] = useState({ id: '', name: '', buy: '', sell: '', stock: '' });
  const [bn, setBn] = useState('');

  const toast = (m) => { setToastMsg(m); clearTimeout(toast._t); toast._t = setTimeout(() => setToastMsg(''), 2200); };

  /* ---- ক্যালকুলেটর: কিবোর্ড দিয়েও চলে (পিসিতে) ---- */
  useEffect(() => {
    if (tab !== 'calc' || modal) return undefined;
    const h = (e) => {
      const tg = e.target && e.target.tagName;
      if (tg === 'INPUT' || tg === 'TEXTAREA' || tg === 'SELECT' || e.ctrlKey || e.metaKey || e.altKey) return;
      const k = e.key; let m = null;
      if (/^[0-9]$/.test(k) || '+-*/%.'.includes(k)) m = k;
      else if (k === 'Enter' || k === '=') m = '=';
      else if (k === 'Backspace') m = '⌫';
      else if (k === 'Escape' || k === 'c' || k === 'C' || k === 'Delete') m = 'C';
      if (m && k.length <= 9) { e.preventDefault(); if (calcKeyRef.current) calcKeyRef.current(m); }
    };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [tab, modal]);

  /* ---- ট্যাব লাইন: ডানে-বামে সোয়াইপ (মোবাইলে টাচ, পিসিতে মাউস টেনে) ---- */
  const tabsRef = useRef(null);
  const drag = useRef({ on: false, x: 0, l: 0, moved: false });
  const tabsDown = (e) => { if (!tabsRef.current) return; drag.current = { on: true, x: e.pageX, l: tabsRef.current.scrollLeft, moved: false }; };
  const tabsMove = (e) => {
    const d = drag.current; if (!d.on || !tabsRef.current) return;
    const dx = e.pageX - d.x; if (Math.abs(dx) > 5) d.moved = true;
    tabsRef.current.scrollLeft = d.l - dx;
  };
  const tabsUp = () => { drag.current.on = false; };

  /* ---- splash: ৪ সেকেন্ড, তারপর ফেড আউট ---- */
  useEffect(() => {
    const a = setTimeout(() => setSplash('out'), 4300);
    const b = setTimeout(() => setSplash('done'), 4800);
    return () => { clearTimeout(a); clearTimeout(b); };
  }, []);

  /* ---- থিম/ভাষা সেভ ---- */
  useEffect(() => { lsSet('bcb_theme', theme); document.body.style.background = theme === 'dark' ? '#030712' : '#f1f5f9'; }, [theme]);
  useEffect(() => { lsSet('bcb_lang', lang); }, [lang]);

  /* ---- অনলাইন/অফলাইন ---- */
  useEffect(() => {
    const on = () => setOnline(true), off = () => setOnline(false);
    window.addEventListener('online', on); window.addEventListener('offline', off);
    return () => { window.removeEventListener('online', on); window.removeEventListener('offline', off); };
  }, []);

  /* ---- লগইন অবস্থা ---- */
  useEffect(() => {
    if (!CONFIGURED) { setAuthReady(true); return undefined; }
    return onAuthStateChanged(auth, (u) => { setUser(u); setAuthReady(true); if (!u) { setRecs([]); setLoaded(false); } });
  }, []);

  /* ---- ক্লাউড ডাটা লাইভ সিঙ্ক ---- */
  useEffect(() => {
    if (!user) return undefined;
    setLoaded(false);
    setCurSaved(ls('bcb_cur_' + user.uid, null));
    const col = collection(db, 'users', user.uid, 'records');
    return onSnapshot(col, { includeMetadataChanges: true }, (snap) => {
      const arr = [];
      snap.forEach((d) => arr.push({ id: d.id, ...d.data() }));
      setRecs(arr); setFromCache(snap.metadata.fromCache); setLoaded(true);
    }, (err) => toast(err.message));
  }, [user]);

  /* ---- ডাটা ডিরাইভ ---- */
  const bizAll = useMemo(() => recs.filter((r) => r.kind === 'biz'), [recs]);
  const bizList = useMemo(() => bizAll.filter((r) => !r.del).sort((a, b) => (a.ts || 0) - (b.ts || 0)), [bizAll]);
  const cur = bizList.find((b) => b.id === curSaved) ? curSaved : (bizList[0] ? bizList[0].id : null);
  const curName = (bizList.find((b) => b.id === cur) || {}).name || '';
  const mine = useMemo(() => recs.filter((r) => r.biz === cur && !r.del), [recs, cur]);
  const byKind = (k) => mine.filter((r) => r.kind === k).sort((a, b) => (a.ts || 0) - (b.ts || 0));
  const products = byKind('product'), sales = byKind('sale'), rets = byKind('ret'), exps = byKind('exp'), notes = byKind('note');
  const binItems = recs.filter((r) => r.del).sort((a, b) => (b.delAt || 0) - (a.delAt || 0));
  const stockValue = sum(products, (p) => p.buy * p.stock);
  const shownProducts = products.filter((p) => p.name.toLowerCase().includes(q.toLowerCase()));

  const report = (f) => {
    const sl = sales.filter(f), rt = rets.filter(f), ex = exps.filter(f);
    const rev = sum(sl, (x) => x.sell * x.qty), cost = sum(sl, (x) => x.buy * x.qty);
    const rrev = sum(rt, (x) => x.sell * x.qty), rcost = sum(rt, (x) => x.buy * x.qty);
    const exp = sum(ex, (x) => x.amount);
    const gross = (rev - rrev) - (cost - rcost);
    return { rev, rrev, net: rev - rrev, cost: cost - rcost, gross, exp, netProfit: gross - exp };
  };

  /* ---- প্রথমবার লগইনে ডিফল্ট বিজনেস ---- */
  useEffect(() => {
    if (user && loaded && !fromCache && bizAll.length === 0 && !deletingRef.current) {
      const b = writeBatch(db);
      b.set(rc('biz_main'), { kind: 'biz', name: 'My Business', del: false, ts: Date.now() });
      b.commit().catch(() => {});
    }
    // eslint-disable-next-line
  }, [user, loaded, fromCache, bizAll.length]);

  /* ---- আপডেট চেক (অ্যাপ খুললে সাইলেন্ট) ---- */
  useEffect(() => { checkUpdate(true); /* eslint-disable-next-line */ }, []);

  /* ============ Firestore হেল্পার ============ */
  const rc = (id) => doc(db, 'users', user.uid, 'records', id);
  const run = async (fn) => { try { await fn(); } catch (e) { toast(t('e_other') + ': ' + (e.code || e.message)); } };
  const pickCur = (id) => { setCurSaved(id); lsSet('bcb_cur_' + user.uid, id); setQ(''); };
  const findRec = (id) => recs.find((r) => r.id === id);

  /* ============ লগইন / রেজিস্টার ============ */
  const errMsg = (e) => {
    const c = e.code || '';
    if (c.includes('email-already')) return t('e_exists');
    if (c.includes('weak-password')) return t('e_weak');
    if (c.includes('network')) return t('e_net');
    if (c.includes('invalid-email')) return t('e_mail');
    if (c.includes('invalid-credential') || c.includes('wrong-password') || c.includes('user-not-found')) return t('e_wrong');
    return t('e_other') + ' (' + c + ')';
  };
  const apiPost = async (path, body) => {
    const r = await fetch(API_BASE + '/api/' + path, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    let j = {}; try { j = await r.json(); } catch (e) { /* ignore */ }
    if (!r.ok) { const er = new Error(j.code || 'server'); er.apiCode = j.code || 'server'; throw er; }
    return j;
  };
  const otpErr = (e) => {
    if (!e.apiCode) return t('e_net');
    const m = { 'no-user': 'e_nouser', wait: 'e_wait', expired: 'e_exp', 'bad-otp': 'e_otp', 'too-many': 'e_many', weak: 'e_weak', 'invalid-email': 'e_mail' };
    return t(m[e.apiCode] || 'e_other');
  };
  const doSendOtp = async () => {
    const email = af.email.trim().toLowerCase();
    if (!email) return toast(t('needEmail'));
    setBusy(true);
    try { await apiPost('send-otp', { email }); setAf({ ...af, email, otp: '' }); setAMode('reset'); toast(t('otpSent')); }
    catch (err) { toast(otpErr(err)); }
    setBusy(false);
  };
  const doReset = async () => {
    const email = af.email.trim().toLowerCase();
    if (af.otp.length !== 6 || af.pass.length < 6) return toast(t('fill'));
    setBusy(true);
    try {
      await apiPost('reset-password', { email, otp: af.otp, password: af.pass });
      toast(t('passChanged'));
      await signInWithEmailAndPassword(auth, email, af.pass);
      setAf({ name: '', email: '', pass: '', otp: '' }); setAMode('login');
    } catch (err) { toast(err.apiCode || !err.code ? otpErr(err) : errMsg(err)); }
    setBusy(false);
  };
  const doAuth = async (e) => {
    e.preventDefault();
    if (aMode === 'forgot') return doSendOtp();
    if (aMode === 'reset') return doReset();
    const email = af.email.trim().toLowerCase(), pass = af.pass, name = af.name.trim();
    if (!email || !pass || (aMode === 'register' && !name)) return toast(t('fill'));
    setBusy(true);
    try {
      if (aMode === 'register') {
        const c = await createUserWithEmailAndPassword(auth, email, pass);
        await updateProfile(c.user, { displayName: name });
        setDn(name);
      } else {
        await signInWithEmailAndPassword(auth, email, pass);
      }
      setAf({ name: '', email: '', pass: '', otp: '' });
    } catch (err) { toast(errMsg(err)); }
    setBusy(false);
  };
  const doLogout = async () => { setModal(null); await signOut(auth); };
  const doDeleteAccount = async () => {
    if (!dp) return toast(t('fill'));
    setBusy(true);
    deletingRef.current = true;
    try {
      // ১) পাসওয়ার্ড দিয়ে আবার যাচাই (Firebase এটা চায়)
      await reauthenticateWithCredential(auth.currentUser, EmailAuthProvider.credential(user.email, dp));
      // ২) সব ডেটা মোছা (বিজনেস, পণ্য, লেনদেন, রিসাইকেল বিন সব)
      const ids = recs.map((r) => r.id);
      for (let i = 0; i < ids.length; i += 400) {
        const b = writeBatch(db);
        ids.slice(i, i + 400).forEach((id) => b.delete(rc(id)));
        await b.commit();
      }
      // ৩) অ্যাকাউন্ট মোছা — একই ইমেইলে পরে আবার রেজিস্টার করা যাবে
      await deleteUser(auth.currentUser);
      setDp(''); setModal(null); setAMode('register');
      toast(t('accDeleted'));
    } catch (err) { toast(errMsg(err)); }
    deletingRef.current = false;
    setBusy(false);
  };

  /* ============ প্রোডাক্ট ============ */
  const addProduct = () => {
    const name = pf.name.trim(); if (!name) return toast(t('nameReq'));
    run(async () => {
      const b = writeBatch(db);
      b.set(rc(uid()), { kind: 'product', biz: cur, name, buy: num(pf.buy), sell: num(pf.sell), stock: Math.floor(num(pf.stock)), del: false, ts: Date.now() });
      await b.commit();
    });
    setPf({ name: '', buy: '', sell: '', stock: '' }); toast(t('added'));
  };
  const plus = (p) => run(() => { const b = writeBatch(db); b.update(rc(p.id), { stock: increment(1) }); return b.commit(); });
  const minus = (p) => {
    if (p.stock <= 0) return toast(t('noStock'));
    run(() => {
      const b = writeBatch(db);
      b.update(rc(p.id), { stock: increment(-1) });
      // আজকের একই পণ্যের অটো-বিক্রি থাকলে সেটাতে +১, না থাকলে নতুন লেনদেন
      const ex = sales.find((s) => s.auto && s.pid === p.id && s.date === today() && s.sell === p.sell);
      if (ex) b.update(rc(ex.id), { qty: increment(1) });
      else b.set(rc(uid()), { kind: 'sale', biz: cur, pid: p.id, name: p.name, qty: 1, buy: p.buy, sell: p.sell, date: today(), auto: true, del: false, ts: Date.now() });
      return b.commit();
    });
  };
  const openEdit = (p) => { setMf({ id: p.id, name: p.name, buy: p.buy, sell: p.sell, stock: p.stock }); setModal('editProd'); };
  const saveEdit = () => {
    const name = mf.name.trim(); if (!name) return toast(t('nameReq'));
    run(() => { const b = writeBatch(db); b.update(rc(mf.id), { name, buy: num(mf.buy), sell: num(mf.sell), stock: Math.floor(num(mf.stock)) }); return b.commit(); });
    setModal(null); toast(t('saved'));
  };

  /* ============ লেনদেন / রিটার্ন / খরচ / নোট ============ */
  const addSale = () => {
    const p = products.find((x) => x.id === sf.pid); if (!p) return toast(t('selectProduct'));
    const qty = Math.floor(num(sf.qty)); if (qty < 1) return;
    if (p.stock < qty) return toast(t('noStock'));
    run(() => {
      const b = writeBatch(db);
      b.update(rc(p.id), { stock: increment(-qty) });
      b.set(rc(uid()), { kind: 'sale', biz: cur, pid: p.id, name: p.name, qty, buy: p.buy, sell: num(sf.price) || p.sell, date: today(), del: false, ts: Date.now() });
      return b.commit();
    });
    setSf({ pid: '', qty: '1', price: '' }); toast(t('added'));
  };
  const addRet = () => {
    const p = products.find((x) => x.id === rf.pid); if (!p) return toast(t('selectProduct'));
    const qty = Math.floor(num(rf.qty)); if (qty < 1) return;
    run(() => {
      const b = writeBatch(db);
      b.update(rc(p.id), { stock: increment(qty) });
      b.set(rc(uid()), { kind: 'ret', biz: cur, pid: p.id, name: p.name, qty, buy: p.buy, sell: num(rf.price) || p.sell, date: today(), del: false, ts: Date.now() });
      return b.commit();
    });
    setRf({ pid: '', qty: '1', price: '' }); toast(t('added'));
  };
  const addExp = () => {
    const name = ef.name.trim(), amount = num(ef.amount); if (!name || !amount) return toast(t('nameReq'));
    run(() => { const b = writeBatch(db); b.set(rc(uid()), { kind: 'exp', biz: cur, name, amount, date: ef.date || today(), del: false, ts: Date.now() }); return b.commit(); });
    setEf({ name: '', amount: '', date: today() }); toast(t('added'));
  };
  const addNote = () => {
    const text = nt.trim(); if (!text) return;
    run(() => { const b = writeBatch(db); b.set(rc(uid()), { kind: 'note', biz: cur, text, date: today(), del: false, ts: Date.now() }); return b.commit(); });
    setNt('');
  };

  /* ============ ডিলিট (রিসাইকেল বিন) / রিস্টোর ============ */
  const stockDelta = (r, deleting) => (r.kind === 'sale' ? (deleting ? r.qty : -r.qty) : r.kind === 'ret' ? (deleting ? -r.qty : r.qty) : 0);
  const softDelete = (r) => {
    if (!window.confirm(t('confirmDel'))) return;
    run(() => {
      const b = writeBatch(db);
      b.update(rc(r.id), { del: true, delAt: Date.now() });
      const d = stockDelta(r, true);
      if (d && r.pid && findRec(r.pid)) b.update(rc(r.pid), { stock: increment(d) });
      return b.commit();
    });
    toast(t('deleted'));
  };
  const restore = (r) => {
    run(() => {
      const b = writeBatch(db);
      b.update(rc(r.id), { del: false, delAt: null });
      const d = stockDelta(r, false);
      if (d && r.pid && findRec(r.pid)) b.update(rc(r.pid), { stock: increment(d) });
      return b.commit();
    });
    toast(t('restored'));
  };
  const permDelete = (list) => {
    if (!list.length || !window.confirm(t('delForever'))) return;
    run(async () => {
      const ids = [];
      list.forEach((r) => {
        ids.push(r.id);
        if (r.kind === 'biz') recs.filter((x) => x.biz === r.id).forEach((x) => ids.push(x.id));   // বিজনেসের সব ডাটা
      });
      for (let i = 0; i < ids.length; i += 400) {
        const b = writeBatch(db);
        ids.slice(i, i + 400).forEach((id) => b.delete(rc(id)));
        await b.commit();
      }
    });
  };

  /* ============ বিজনেস ============ */
  const addBiz = () => {
    const name = bn.trim(); if (!name) return toast(t('nameReq'));
    const id = uid();
    run(() => { const b = writeBatch(db); b.set(rc(id), { kind: 'biz', name, del: false, ts: Date.now() }); return b.commit(); });
    pickCur(id); setBn(''); setModal(null);
  };
  const saveRename = () => {
    const name = bn.trim(); if (!name) return toast(t('nameReq'));
    run(() => { const b = writeBatch(db); b.update(rc(modal.id), { name }); return b.commit(); });
    setBn(''); setModal('settings');
  };

  /* ============ ক্যালকুলেটর ============ */
  const calcKey = (k) => {
    const isOp = (c) => '+-*/'.includes(c);
    let cur = calc;
    if (k === 'C') { setCalc(''); setCalcDone(false); setCalcPrev(''); return; }
    if (k === '⌫') { if (calcDone) { setCalc(''); setCalcDone(false); setCalcPrev(''); } else setCalc(cur.slice(0, -1)); return; }
    if (k === '=') {
      if (!cur || calcDone) return;
      let ex = cur; while (ex && isOp(ex[ex.length - 1])) ex = ex.slice(0, -1);
      try {
        const r = calcEval(ex);
        setCalcPrev(calcSym(ex) + ' ='); setCalc(String(r)); setCalcDone(true);
      } catch (e) { toast(lang === 'bn' ? 'হিসাব ঠিক নেই' : 'Invalid calculation'); }
      return;
    }
    const last = cur[cur.length - 1];
    if (/^[0-9.]|^00$/.test(k)) {
      if (calcDone) { cur = ''; setCalcDone(false); setCalcPrev(''); }
      const seg = (cur.match(/[\d.]*$/) || [''])[0];
      if (k === '.') { if (seg.includes('.')) return; cur += seg === '' ? '0.' : '.'; }
      else if (k === '00') { if (seg === '' || seg === '0') return; cur += '00'; }
      else if (seg === '0') cur = cur.slice(0, -1) + k;
      else if (last === '%') cur += '*' + k;
      else cur += k;
      setCalc(cur); return;
    }
    if (k === '%') { if (cur && /[0-9.]$/.test(cur)) { setCalc(cur + '%'); setCalcDone(false); } return; }
    if (isOp(k)) {
      if (calcDone) { setCalcDone(false); setCalcPrev(''); }
      if (!cur) { if (k === '-') setCalc('-'); return; }
      if (cur === '-') return;
      if (isOp(last)) { cur = cur.slice(0, -1); if (!cur && k !== '-') return; }
      setCalc(cur + k);
    }
  };
  calcKeyRef.current = calcKey;

  /* ============ আপডেট ============ */
  async function checkUpdate(silent) {
    try {
      const r = await fetch(UPDATE_URL + '?' + Date.now(), { cache: 'no-store' });
      const j = await r.json();
      if (j.version && j.version !== VERSION) setUpd(j);
      else if (!silent) toast(t('upToDate'));
    } catch (e) { if (!silent) toast(t('upToDate')); }
  }
  const applyUpdate = async () => {
    if (isNative() && (upd?.apk || APK_URL)) { window.open(upd?.apk || APK_URL, '_system'); return; }
    try {
      if ('serviceWorker' in navigator) (await navigator.serviceWorker.getRegistrations()).forEach((r) => r.unregister());
      if ('caches' in window) (await caches.keys()).forEach((k) => caches.delete(k));
    } catch (e) { /* ignore */ }
    window.location.reload();
  };

  /* ===================================================================
     রেন্ডার
     =================================================================== */
  const root = (children) => (
    <div className="bcb" data-theme={theme}>
      <style>{CSS}</style>
      {children}
      {splash !== 'done' && <Splash out={splash === 'out'} />}
      {toastMsg && <div className="toast">{toastMsg}</div>}
    </div>
  );

  if (!authReady || (user && (!loaded || (fromCache && bizList.length === 0)))) {
    return root(<div className="center">{splash === 'done' ? t('loading') : ''}</div>);
  }

  /* ---------------- লগইন পেজ ---------------- */
  if (!user) {
    const reg = aMode === 'register';
    return root(
      <>
        <div className="glow" style={{ width: 300, height: 300, background: '#f97316', top: -80, right: -80 }} />
        <div className="glow" style={{ width: 260, height: 260, background: '#fbbf24', bottom: -90, left: -70 }} />
        <form className="auth" onSubmit={doAuth}>
          <div className="card">
            <div style={{ textAlign: 'center', marginBottom: 10 }}><span className="logo" style={{ display: 'inline-grid' }}>🧮</span></div>
            <h2>{APP_NAME}</h2>
            <p>{L.bn.tagline}</p>
            {!CONFIGURED && <div className="warn">{t('setup')}</div>}
            {reg && <input placeholder={t('yourName')} value={af.name} onChange={(e) => setAf({ ...af, name: e.target.value })} />}
            <input type="email" autoComplete="email" autoCapitalize="none" autoCorrect="off" spellCheck={false} readOnly={aMode === 'reset'} placeholder={t('email')} value={af.email} onChange={(e) => setAf({ ...af, email: e.target.value.replace(/\s/g, '') })} />
            {aMode === 'reset' && <input inputMode="numeric" maxLength={6} autoComplete="one-time-code" placeholder={t('otpPh')} value={af.otp} onChange={(e) => setAf({ ...af, otp: e.target.value.replace(/\D/g, '') })} />}
            {aMode !== 'forgot' && (
              <>
                <input type={showPw ? 'text' : 'password'} autoComplete={reg || aMode === 'reset' ? 'new-password' : 'current-password'} autoCapitalize="none" autoCorrect="off" spellCheck={false} placeholder={aMode === 'reset' ? t('newPass') : t('password')} value={af.pass} onChange={(e) => setAf({ ...af, pass: e.target.value })} />
                <label className="showpw"><input type="checkbox" checked={showPw} onChange={(e) => setShowPw(e.target.checked)} />{t('showPw')}</label>
              </>
            )}
            <button className="btn full" type="submit" disabled={busy}>{busy ? '...' : reg ? t('register') : aMode === 'forgot' ? t('sendOtp') : aMode === 'reset' ? t('resetBtn') : t('login')}</button>
            {aMode === 'login' && <button type="button" className="link" onClick={() => setAMode('forgot')}>{t('forgot')}</button>}
            {aMode === 'reset' && <button type="button" className="link" onClick={doSendOtp}>{t('resend')}</button>}
            {aMode === 'forgot' || aMode === 'reset'
              ? <button type="button" className="link" onClick={() => setAMode('login')}>{t('backLogin')}</button>
              : <button type="button" className="link" onClick={() => setAMode(reg ? 'login' : 'register')}>{reg ? t('haveAcc') : t('noAcc')}</button>}
          </div>
        </form>
      </>
    );
  }

  /* ---------------- ট্যাব কনটেন্ট ---------------- */
  const prodOpts = (
    <>
      <option value="">{t('selectProduct')}</option>
      {products.map((p) => <option key={p.id} value={p.id}>{p.name} ({p.stock})</option>)}
    </>
  );
  const searchBox = <input className="search" placeholder={'🔍 ' + t('search')} value={q} onChange={(e) => setQ(e.target.value)} />;
  const totalBar = <div className="card total"><span>{t('totalStockVal')}</span><b>{money(stockValue)}</b></div>;
  const delBtn = (r) => <button className="ib" onClick={() => softDelete(r)}>🗑</button>;
  const rev = (a) => [...a].reverse();

  const views = {
    stock: () => (
      <>
        <div className="card">
          <h3>{curName} — {t('newProduct')}</h3>
          <div className="form5">
            <input placeholder={t('pname')} value={pf.name} onChange={(e) => setPf({ ...pf, name: e.target.value })} />
            <input type="number" inputMode="decimal" placeholder={t('buyP')} value={pf.buy} onChange={(e) => setPf({ ...pf, buy: e.target.value })} />
            <input type="number" inputMode="decimal" placeholder={t('sellP')} value={pf.sell} onChange={(e) => setPf({ ...pf, sell: e.target.value })} />
            <input type="number" inputMode="numeric" placeholder={t('openStock')} value={pf.stock} onChange={(e) => setPf({ ...pf, stock: e.target.value })} />
            <button className="btn" onClick={addProduct}>{t('add')}</button>
          </div>
        </div>
        <div className="card">
          <div className="row between" style={{ marginBottom: 10 }}><h3 style={{ margin: 0 }}>{t('stockTable')} ({products.length})</h3>{searchBox}</div>
          {shownProducts.length === 0 ? <div className="empty">{t('noProduct')}</div> : (
            <>
              <div className="thead"><span>{t('name')}</span><span>{t('buy')}</span><span>{t('sell')}</span><span>{t('stockQty')}</span><span>{t('value')}</span></div>
              {shownProducts.map((p) => (
                <div className="trow" key={p.id}><b>{p.name}</b><span>{money(p.buy)}</span><span>{money(p.sell)}</span><span>{p.stock}</span><span>{money(p.buy * p.stock)}</span></div>
              ))}
            </>
          )}
        </div>
        {totalBar}
      </>
    ),
    list: () => (
      <>
        <div className="card">
          <div className="row between" style={{ marginBottom: 10 }}><h3 style={{ margin: 0 }}>{t('list')} ({products.length})</h3>{searchBox}</div>
          {shownProducts.length === 0 ? <div className="empty">{t('noProduct')}</div> : shownProducts.map((p) => (
            <div className="item" key={p.id}>
              <div><div className="nm">{p.name}</div><div className="sub">{t('buy')} {money(p.buy)} • {t('sell')} {money(p.sell)} • {t('value')} {money(p.buy * p.stock)}</div></div>
              <div className="acts">
                <button className="ib m" onClick={() => minus(p)}>−</button>
                <span className="qty">{p.stock}</span>
                <button className="ib p" onClick={() => plus(p)}>+</button>
                <button className="ib" onClick={() => openEdit(p)}>✎</button>
                {delBtn(p)}
              </div>
            </div>
          ))}
        </div>
        {totalBar}
      </>
    ),
    tx: () => (
      <>
        <div className="card">
          <h3>{t('tx')}</h3>
          <div className="form4">
            <select value={sf.pid} onChange={(e) => { const p = products.find((x) => x.id === e.target.value); setSf({ ...sf, pid: e.target.value, price: p ? p.sell : '' }); }}>{prodOpts}</select>
            <input type="number" inputMode="numeric" placeholder={t('qty')} value={sf.qty} onChange={(e) => setSf({ ...sf, qty: e.target.value })} />
            <input type="number" inputMode="decimal" placeholder={t('sellP')} value={sf.price} onChange={(e) => setSf({ ...sf, price: e.target.value })} />
            <button className="btn" onClick={addSale}>{t('add')}</button>
          </div>
        </div>
        <div className="card total"><span>{t('todaySale')}</span><b>{money(sum(sales.filter((s) => s.date === today()), (s) => s.sell * s.qty))}</b></div>
        <div className="card">
          {sales.length === 0 ? <div className="empty">{t('noData')}</div> : rev(sales).map((s) => (
            <div className="item" key={s.id}>
              <div><div className="nm">{s.name} × {s.qty}</div>
                <div className="sub">{s.date} • {t('sell')} {money(s.sell)} • {t('profit')} <span className={s.sell >= s.buy ? 'pos' : 'neg'}>{money((s.sell - s.buy) * s.qty)}</span></div></div>
              <div className="acts"><b>{money(s.sell * s.qty)}</b>{delBtn(s)}</div>
            </div>
          ))}
        </div>
      </>
    ),
    ret: () => (
      <>
        <div className="card">
          <h3>{t('ret')}</h3>
          <div className="form4">
            <select value={rf.pid} onChange={(e) => { const p = products.find((x) => x.id === e.target.value); setRf({ ...rf, pid: e.target.value, price: p ? p.sell : '' }); }}>{prodOpts}</select>
            <input type="number" inputMode="numeric" placeholder={t('qty')} value={rf.qty} onChange={(e) => setRf({ ...rf, qty: e.target.value })} />
            <input type="number" inputMode="decimal" placeholder={t('refund')} value={rf.price} onChange={(e) => setRf({ ...rf, price: e.target.value })} />
            <button className="btn" onClick={addRet}>{t('add')}</button>
          </div>
        </div>
        <div className="card">
          {rets.length === 0 ? <div className="empty">{t('noData')}</div> : rev(rets).map((s) => (
            <div className="item" key={s.id}>
              <div><div className="nm">{s.name} × {s.qty}</div><div className="sub">{s.date}</div></div>
              <div className="acts"><b className="neg">-{money(s.sell * s.qty)}</b>{delBtn(s)}</div>
            </div>
          ))}
        </div>
      </>
    ),
    exp: () => (
      <>
        <div className="card">
          <h3>{t('exp')}</h3>
          <div className="form3">
            <input placeholder={t('expName')} value={ef.name} onChange={(e) => setEf({ ...ef, name: e.target.value })} />
            <input type="number" inputMode="decimal" placeholder={t('amount')} value={ef.amount} onChange={(e) => setEf({ ...ef, amount: e.target.value })} />
            <input type="date" value={ef.date} onChange={(e) => setEf({ ...ef, date: e.target.value })} />
            <button className="btn" onClick={addExp}>{t('add')}</button>
          </div>
        </div>
        <div className="card">
          {exps.length === 0 ? <div className="empty">{t('noData')}</div> : rev(exps).map((s) => (
            <div className="item" key={s.id}>
              <div><div className="nm">{s.name}</div><div className="sub">{s.date}</div></div>
              <div className="acts"><b className="neg">{money(s.amount)}</b>{delBtn(s)}</div>
            </div>
          ))}
        </div>
      </>
    ),
    month: () => (
      <>
        <div className="card"><div className="row between"><h3 style={{ margin: 0 }}>{t('month')}</h3>
          <input type="month" value={month} style={{ maxWidth: 200 }} onChange={(e) => setMonth(e.target.value || month)} /></div></div>
        <div className="card"><Stats t={t} r={report((x) => (x.date || '').startsWith(month))} /></div>
      </>
    ),
    total: () => (
      <>
        <div className="card"><h3>{t('allTime')}</h3><Stats t={t} r={report(() => true)} /></div>
        <div className="card total"><span>{t('stockValue')}</span><b>{money(stockValue)}</b></div>
      </>
    ),
    calc: () => {
      let live = '';
      if (!calcDone && calc) {
        let ex = calc; while (ex && '+-*/'.includes(ex[ex.length - 1])) ex = ex.slice(0, -1);
        if (/[0-9.%]/.test(ex)) { try { if (/[+\-*/%]/.test(ex.replace(/^-/, ''))) live = calcShow(calcEval(ex)); } catch (e) { live = ''; } }
      }
      const seg = (calc.match(/[\d.]*$/) || [''])[0];
      const big = calcDone ? calcShow(parseFloat(calc)) : (live || (seg !== '' ? seg : (calc ? '' : '0')));
      const top = calcDone ? calcPrev : calcSym(calc);
      return (
        <div className="card"><div className="calc">
          <div className="disp"><div className="ex">{top || '\u00a0'}</div><div className="rs">{big || '\u00a0'}</div></div>
          <div className="keys">
            {['C', '⌫', '%', '/', '7', '8', '9', '*', '4', '5', '6', '-', '1', '2', '3', '+', '00', '0', '.', '='].map((k) => (
              <button key={k} className={'/*-+%'.includes(k) || k === '=' ? 'op' : ''} onClick={() => calcKey(k)}>{k === '*' ? '×' : k === '/' ? '÷' : k === '-' ? '−' : k}</button>
            ))}
          </div>
        </div></div>
      );
    },
    note: () => (
      <>
        <div className="card"><h3>{t('note')}</h3>
          <textarea rows={3} placeholder={t('noteHere')} value={nt} onChange={(e) => setNt(e.target.value)} />
          <button className="btn" style={{ marginTop: 10 }} onClick={addNote}>{t('add')}</button></div>
        <div className="card">
          {notes.length === 0 ? <div className="empty">{t('noData')}</div> : rev(notes).map((n) => (
            <div className="item" key={n.id}>
              <div style={{ whiteSpace: 'pre-wrap', flex: 1 }}>{n.text}<div className="sub">{n.date}</div></div>
              {delBtn(n)}
            </div>
          ))}
        </div>
      </>
    ),
  };

  /* ---------------- মডাল ---------------- */
  const binLabel = (r) => {
    if (r.kind === 'product') return `${r.name} (${r.stock})`;
    if (r.kind === 'sale' || r.kind === 'ret') return `${r.name} × ${r.qty}`;
    if (r.kind === 'exp') return `${r.name} — ${money(r.amount)}`;
    if (r.kind === 'note') return (r.text || '').slice(0, 40);
    return r.name || '';
  };
  const bizDelete = (b) => {
    if (bizList.length < 2 || !window.confirm(t('confirmDel'))) return;
    run(() => { const bt = writeBatch(db); bt.update(rc(b.id), { del: true, delAt: Date.now() }); return bt.commit(); });
    setModal(null); toast(t('deleted'));
  };

  const renderModal = () => {
    if (!modal) return null;
    const m = typeof modal === 'string' ? modal : modal.type;
    let body = null;
    if (m === 'settings') {
      body = (
        <>
          <h2>⚙️ {t('settings')}</h2>
          <div className="sset"><div><b>👤 {t('account')}</b><div className="muted">{user.displayName || dn}<br />{user.email}</div></div></div>
          <div className="sset"><b>🌐 {t('language')}</b>
            <select value={lang} onChange={(e) => setLang(e.target.value)}><option value="bn">বাংলা</option><option value="en">English</option></select></div>
          <div className="sset"><b>🎨 {t('theme')}</b>
            <select value={theme} onChange={(e) => setTheme(e.target.value)}><option value="dark">{t('dark')}</option><option value="light">{t('light')}</option></select></div>
          <div className="sset"><span className="muted">{online ? '🟢 ' + t('online') : '🟠 ' + t('offline')}</span></div>
          <div className="sset"><b>🏢 {t('manageBiz')}</b></div>
          {bizList.map((b) => (
            <div className="item" key={b.id}><span className="nm">{b.name}</span>
              <div className="acts">
                <button className="ib" onClick={() => { setBn(b.name); setModal({ type: 'rename', id: b.id }); }}>✎</button>
                {bizList.length > 1 && <button className="ib" onClick={() => bizDelete(b)}>🗑</button>}
              </div></div>
          ))}
          <div className="sset" style={{ cursor: 'pointer' }} onClick={() => setModal('bin')}><b>🗑 {t('bin')} ({binItems.length})</b><span>›</span></div>
          <div style={{ padding: '12px 0' }}><b>ℹ️ {t('appInfo')}</b>
            <div className="muted" style={{ margin: '6px 0 10px' }}>{APP_NAME}<br />{t('version')}: v{VERSION}</div>
            <button className="btn ghost" onClick={() => checkUpdate(false)}>🔄 {t('checkUpdate')}</button></div>
          <button className="btn red full" style={{ marginTop: 6 }} onClick={doLogout}>{t('logout')}</button>
          <button className="btn ghost full" style={{ marginTop: 8, color: 'var(--red)' }} onClick={() => { setDp(''); setModal('delAcc'); }}>🗑 {t('delAcc')}</button>
          <button className="btn ghost full" style={{ marginTop: 8 }} onClick={() => setModal(null)}>{t('cancel')}</button>
        </>
      );
    } else if (m === 'bin') {
      body = (
        <>
          <h2>🗑 {t('bin')}</h2>
          {binItems.length === 0 ? <div className="empty">{t('binEmpty')}</div> : (
            <>
              {binItems.map((r) => (
                <div className="item" key={r.id}>
                  <div><div className="nm">{binLabel(r)}</div><div className="sub">{t('types')[r.kind]}{r.delAt ? ' • ' + new Date(r.delAt).toLocaleString() : ''}</div></div>
                  <div className="acts"><button className="btn ghost" onClick={() => restore(r)}>{t('restore')}</button>
                    <button className="ib" onClick={() => permDelete([r])}>✕</button></div>
                </div>
              ))}
              <button className="btn red full" style={{ marginTop: 8 }} onClick={() => permDelete(binItems)}>{t('emptyBin')}</button>
            </>
          )}
          <button className="btn ghost full" style={{ marginTop: 10 }} onClick={() => setModal('settings')}>←</button>
        </>
      );
    } else if (m === 'delAcc') {
      body = (
        <>
          <h2 style={{ color: 'var(--red)' }}>⚠️ {t('delAcc')}</h2>
          <div className="muted" style={{ lineHeight: 1.6, marginBottom: 6 }}>{t('delAccWarn')}</div>
          <div className="muted">{user.email}</div>
          <label>{t('delAccPass')}</label>
          <input type="password" autoComplete="current-password" value={dp} onChange={(e) => setDp(e.target.value)} />
          <div className="row" style={{ marginTop: 14 }}>
            <button className="btn red" onClick={doDeleteAccount} disabled={busy}>{busy ? '...' : t('delAccBtn')}</button>
            <button className="btn ghost" onClick={() => setModal('settings')}>{t('cancel')}</button>
          </div>
        </>
      );
    } else if (m === 'addBiz') {
      body = (
        <>
          <h2>{t('addBiz')}</h2>
          <input autoFocus placeholder={t('business')} value={bn} onChange={(e) => setBn(e.target.value)} />
          <div className="row" style={{ marginTop: 14 }}><button className="btn" onClick={addBiz}>{t('save')}</button><button className="btn ghost" onClick={() => setModal(null)}>{t('cancel')}</button></div>
        </>
      );
    } else if (m === 'rename') {
      body = (
        <>
          <h2>{t('rename')}</h2>
          <input autoFocus value={bn} onChange={(e) => setBn(e.target.value)} />
          <div className="row" style={{ marginTop: 14 }}><button className="btn" onClick={saveRename}>{t('save')}</button><button className="btn ghost" onClick={() => setModal('settings')}>{t('cancel')}</button></div>
        </>
      );
    } else if (m === 'editProd') {
      body = (
        <>
          <h2>{t('edit')}</h2>
          <label>{t('pname')}</label><input value={mf.name} onChange={(e) => setMf({ ...mf, name: e.target.value })} />
          <label>{t('buyP')}</label><input type="number" value={mf.buy} onChange={(e) => setMf({ ...mf, buy: e.target.value })} />
          <label>{t('sellP')}</label><input type="number" value={mf.sell} onChange={(e) => setMf({ ...mf, sell: e.target.value })} />
          <label>{t('stockQty')}</label><input type="number" value={mf.stock} onChange={(e) => setMf({ ...mf, stock: e.target.value })} />
          <div className="row" style={{ marginTop: 14 }}><button className="btn" onClick={saveEdit}>{t('save')}</button><button className="btn ghost" onClick={() => setModal(null)}>{t('cancel')}</button></div>
        </>
      );
    }
    const drawer = m === 'settings' || m === 'bin';   // সেটিংস/বিন: ডান পাশ থেকে ড্রয়ার, বাকিগুলো ছোট পপআপ
    return (
      <div className={'modal' + (drawer ? ' drawer' : '')} onMouseDown={(e) => { if (e.target === e.currentTarget) setModal(null); }}>
        <div className={'mbox' + (drawer ? ' drawer' : '')}>
          {drawer && <button className="dclose" onClick={() => setModal(null)}>✕</button>}
          {body}
        </div>
      </div>
    );
  };

  /* ---------------- মূল পেজ ---------------- */
  // ডেস্কটপে পুরো স্ক্রিন জুড়ে বড় করে দেখানো (মোবাইলে কিছু বদলায় না)
  const scale = vw >= 2400 ? 1.5 : vw >= 1900 ? 1.25 : vw >= 1500 ? 1.05 : vw >= 1000 ? 0.9 : 1;
  const wrapStyle = vw >= 1000 ? { maxWidth: 'none', width: '100%', zoom: scale, padding: '18px 3vw 60px' } : undefined;
  return root(
    <>
    <div className="wrap" style={wrapStyle}>
      <div className="head">
        {/* বাম পাশ: অ্যাপ আইকন + নাম — ট্যাপ করলে রিফ্রেশ */}
        <button className="brand" onClick={() => window.location.reload()}>
          <span className="logo">🧮</span><b>{APP_NAME}</b>
        </button>
        {/* ডান পাশ: বিজনেস সিলেক্টর + অ্যাড (+) + সেটিংস */}
        <div className="hleft">
          <div className="bizbox"><span>🏢</span>
            <select value={cur || ''} onChange={(e) => pickCur(e.target.value)}>
              {bizList.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
            </select>
            <button className="plus" onClick={() => { setBn(''); setModal('addBiz'); }}>+</button>
          </div>
          <button className="gear" onClick={() => setModal('settings')}>⚙️<span className={'dot' + (online ? '' : ' off')} /></button>
        </div>
      </div>

      <nav className="tabs" ref={tabsRef} onMouseDown={tabsDown} onMouseMove={tabsMove} onMouseUp={tabsUp} onMouseLeave={tabsUp}>
        {TABS.map(([k, ic]) => (
          <button key={k} className={'tab' + (k === tab ? ' on' : '')}
            onClick={() => { if (drag.current.moved) { drag.current.moved = false; return; } setTab(k); setQ(''); }}><span>{ic}</span>{t(k)}</button>
        ))}
      </nav>

      <main>{(views[tab] || views.stock)()}</main>

    </div>
    {renderModal()}
    {upd && (
      <div className="toast" style={{ cursor: 'pointer', bottom: 70 }} onClick={applyUpdate}>{t('newUpdate')}</div>
    )}
    </>
  );
}