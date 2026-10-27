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

function getAuthAdmin() {
  const { getAuth } = require('firebase-admin/auth');
  return getAuth(getFbApp());
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

module.exports = { sha, crypto, getAuthAdmin, getDb, fieldValue, getMailer };
