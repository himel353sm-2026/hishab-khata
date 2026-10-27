// Shared helpers (modular firebase-admin API). Loaded lazily so a config mistake returns a readable error.
const crypto = require('crypto');
const sha = (s) => crypto.createHash('sha256').update(s).digest('hex');

function parseSA() {
  let sa;
  try { sa = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT); }
  catch (e) { throw new Error('FIREBASE_SERVICE_ACCOUNT is missing or not valid JSON'); }
  if (sa.private_key) sa.private_key = sa.private_key.replace(/\\n/g, '\n');
  return sa;
}

function getFbApp() {
  const { initializeApp, getApps, cert } = require('firebase-admin/app');
  const existing = getApps();
  if (existing.length) return existing[0];
  return initializeApp({ credential: cert(parseSA()) });
}

// Auth via Identity Toolkit REST API (avoids firebase-admin's auth module, which needs ESM-only "jose" and breaks on some Node versions)
async function idToolkit(path, body) {
  const app = getFbApp();
  const tok = await app.options.credential.getAccessToken();
  const pid = parseSA().project_id;
  const r = await fetch(`https://identitytoolkit.googleapis.com/v1/projects/${pid}/${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + tok.access_token },
    body: JSON.stringify(body),
  });
  let j = {};
  try { j = await r.json(); } catch (e) { /* ignore */ }
  if (!r.ok) { const e = new Error((j.error && j.error.message) || ('HTTP ' + r.status)); e.status = r.status; throw e; }
  return j;
}

async function getUserByEmail(email) {
  const j = await idToolkit('accounts:lookup', { email: [email] });
  const u = (j.users || [])[0];
  return u ? { uid: u.localId, email: u.email } : null;
}

async function setPassword(uid, password) {
  return idToolkit('accounts:update', { localId: uid, password });
}

let _db = null;
function getDb() {
  if (_db) return _db;
  const { getFirestore } = require('firebase-admin/firestore');
  const db = getFirestore(getFbApp());
  try { db.settings({ preferRest: true }); } catch (e) { /* ignore */ }   // REST instead of gRPC (more reliable on serverless)
  _db = db;
  return db;
}

function fieldValue() { return require('firebase-admin/firestore').FieldValue; }

function getMailer() {
  const nodemailer = require('nodemailer');
  return nodemailer.createTransport({
    service: 'gmail',
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
  });
}

module.exports = { sha, crypto, getUserByEmail, setPassword, getDb, fieldValue, getMailer };
