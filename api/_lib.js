const admin = require('firebase-admin');
const nodemailer = require('nodemailer');
const crypto = require('crypto');

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)),
  });
}

const sha = (s) => crypto.createHash('sha256').update(s).digest('hex');
const mailer = () =>
  nodemailer.createTransport({
    service: 'gmail',
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
  });

module.exports = { admin, sha, mailer, crypto };