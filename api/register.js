// POST /api/register  { email, otp, password, name } -> creates the account only if the emailed OTP is right
const { sha, createUser, getDb, fieldValue } = require('./_lib');

module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).json({ code: 'method' });
  try {
    const b = req.body || {};
    const email = String(b.email || '').trim().toLowerCase();
    const otp = String(b.otp || '').trim();
    const password = String(b.password || '');
    const name = String(b.name || '').trim().slice(0, 60);
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return res.status(400).json({ code: 'invalid-email' });
    if (password.length < 6) return res.status(400).json({ code: 'weak' });

    const ref = getDb().collection('otps').doc(sha('reg:' + email));
    const snap = await ref.get();
    const d = snap.exists ? snap.data() : null;
    if (!d || d.exp < Date.now()) return res.status(400).json({ code: 'expired' });
    if (d.tries >= 5) { await ref.delete(); return res.status(400).json({ code: 'too-many' }); }
    if (sha(otp + d.salt) !== d.h) {
      await ref.update({ tries: fieldValue().increment(1) });
      return res.status(400).json({ code: 'bad-otp' });
    }
    try { await createUser(email, password, name); }
    catch (e) {
      if (/EMAIL_EXISTS/.test(String(e.message))) return res.status(409).json({ code: 'exists' });
      throw e;
    }
    await ref.delete();
    return res.status(200).json({ ok: true });
  } catch (e) {
    console.error('register', e);
    return res.status(500).json({ code: 'server', detail: String((e && e.message) || e).slice(0, 160) });
  }
};
