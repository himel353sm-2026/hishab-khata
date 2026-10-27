// Shared helpers. Everything is loaded lazily so a config mistake returns a readable error instead of crashing.
const crypto = require('crypto');
const sha = (s) => crypto.createHash('sha256').update(s).digest('hex');

function getAdmin() {
  const admin = require('firebase-admin');
  if (!admin.apps.length) {
    let sa;
    try { sa = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT); }
    catch (e) { throw new Error('FIREBASE_SERVICE_ACCOUNT is missing or not valid JSON'); }
    if (sa.private_key) sa.private_key = sa.private_key.replace(/\\n/g, '\n');
    admin.initializeApp({ credential: admin.credential.cert(sa) });
  }
  return admin;
}

function getMailer() {
  const nodemailer = require('nodemailer');
  return nodemailer.createTransport({
    service: 'gmail',
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
  });
}

module.exports = { sha, crypto, getAdmin, getMailer };
