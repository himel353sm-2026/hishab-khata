// POST /api/send-otp  { email }  -> emails a 6-digit OTP (valid 10 minutes)
// GET  /api/send-otp?check=1     -> setup check (shows only true/false, never secrets)
const { sha, crypto, getAdmin, getMailer } = require('./_lib');

module.exports = async (req, res) => {
  if (req.method === 'GET' && req.query && req.query.check) {
    const out = { smtpUser: !!process.env.SMTP_USER, smtpPass: !!process.env.SMTP_PASS, serviceAccountSet: !!process.env.FIREBASE_SERVICE_ACCOUNT };
    try { JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT); out.serviceAccountJson = true; } catch (e) { out.serviceAccountJson = false; }
    try { require('firebase-admin'); out.firebaseAdminInstalled = true; } catch (e) { out.firebaseAdminInstalled = false; }
    try { require('nodemailer'); out.nodemailerInstalled = true; } catch (e) { out.nodemailerInstalled = false; }
    try { const a = getAdmin(); await a.firestore().collection('otps').limit(1).get(); out.firestore = 'ok'; }
    catch (e) { out.firestore = 'ERROR: ' + String(e.message || e).slice(0, 200); }
    return res.status(200).json(out);
  }
  if (req.method !== 'POST') return res.status(405).json({ code: 'method' });
  try {
    const admin = getAdmin();
    const email = String((req.body || {}).email || '').trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return res.status(400).json({ code: 'invalid-email' });

    let user;
    try { user = await admin.auth().getUserByEmail(email); }
    catch (e) { return res.status(404).json({ code: 'no-user' }); }

    const ref = admin.firestore().collection('otps').doc(sha(email));
    const snap = await ref.get();
    const now = Date.now();
    if (snap.exists && now - (snap.data().sentAt || 0) < 60000) return res.status(429).json({ code: 'wait' });

    const otp = String(crypto.randomInt(100000, 1000000));
    const salt = crypto.randomBytes(8).toString('hex');
    await ref.set({ uid: user.uid, h: sha(otp + salt), salt, exp: now + 10 * 60000, tries: 0, sentAt: now });

    await getMailer().sendMail({
      from: `"Business Calculator Book" <${process.env.SMTP_USER}>`,
      to: email,
      subject: 'Business Calculator Book - পাসওয়ার্ড রিসেট OTP',
      text: `আপনার OTP: ${otp}\nএটি ১০ মিনিট পর্যন্ত চলবে। আপনি না চাইলে এই ইমেইল উপেক্ষা করুন।`,
      html: `<div style="font-family:Arial,sans-serif;max-width:420px"><h2>Business Calculator Book</h2><p>পাসওয়ার্ড রিসেটের OTP:</p><p style="font-size:34px;letter-spacing:8px;font-weight:bold;color:#f59e0b">${otp}</p><p style="color:#666">১০ মিনিট পর্যন্ত চলবে। আপনি না চাইলে এই ইমেইল উপেক্ষা করুন।</p></div>`,
    });
    return res.status(200).json({ ok: true });
  } catch (e) {
    console.error('send-otp', e);
    return res.status(500).json({ code: 'server', detail: String(e.message || e).slice(0, 160) });
  }
};
