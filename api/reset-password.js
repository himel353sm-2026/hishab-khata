// POST /api/reset-password  { email, otp, password }  -> sets the new password if the OTP is right
const { sha, getAuthAdmin, getDb, fieldValue } = require('./_lib');

module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).json({ code: 'method' });
  try {
    const b = req.body || {};
    const email = String(b.email || '').trim().toLowerCase();
    const otp = String(b.otp || '').trim();
    const password = String(b.password || '');
    if (password.length < 6) return res.status(400).json({ code: 'weak' });

    const ref = getDb().collection('otps').doc(sha(email));
    const snap = await ref.get();
    const d = snap.exists ? snap.data() : null;
    if (!d || d.exp < Date.now()) return res.status(400).json({ code: 'expired' });
    if (d.tries >= 5) { await ref.delete(); return res.status(400).json({ code: 'too-many' }); }
    if (sha(otp + d.salt) !== d.h) {
      await ref.update({ tries: fieldValue().increment(1) });
      return res.status(400).json({ code: 'bad-otp' });
    }
    await getAuthAdmin().updateUser(d.uid, { password });   // only the password changes; data stays
    await ref.delete();
    return res.status(200).json({ ok: true });
  } catch (e) {
    console.error('reset-password', e);
    return res.status(500).json({ code: 'server', detail: String((e && e.message) || e).slice(0, 160) });
  }
};
