const { admin, sha, mailer, crypto } = require('./_lib');

module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).json({ code: 'method' });
  try {
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

    await mailer().sendMail({
      from: `"Business Calculator Book" <${process.env.SMTP_USER}>`,
      to: email,
      subject: 'Business Calculator Book - পাসওয়ার্ড রিসেট OTP',
      text: `আপনার OTP: ${otp}\nএটি ১০ মিনিট পর্যন্ত চলবে। আপনি না চাইলে এই ইমেইল উপেক্ষা করুন।`,
      html: `<div style="font-family:Arial,sans-serif;max-width:420px"><h2>Business Calculator Book</h2><p>পাসওয়ার্ড রিসেটের OTP:</p><p style="font-size:34px;letter-spacing:8px;font-weight:bold;color:#f59e0b">${otp}</p><p style="color:#666">১০ মিনিট পর্যন্ত চলবে। আপনি না চাইলে এই ইমেইল উপেক্ষা করুন।</p></div>`,
    });
    return res.json({ ok: true });
  } catch (e) {
    console.error('send-otp', e);
    return res.status(500).json({ code: 'server' });
  }
};