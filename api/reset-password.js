const { admin, sha } = require('./_lib');

module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).json({ code: 'method' });
  try {
    const b = req.body || {};
    const email = String(b.email || '').trim().toLowerCase();
    const otp = String(b.otp || '').trim();
    const password = String(b.password || '');
    if (password.length < 6) return res.status(400).json({ code: 'weak' });

    const ref = admin.firestore().collection('otps').doc(sha(email));
    const snap = await ref.get();
    const d = snap.exists ? snap.data() : null;
    if (!d || d.exp < Date.now()) return res.status(400).json({ code: 'expired' });
    if (d.tries >= 5) { await ref.delete(); return res.status(400).json({ code: 'too-many' }); }
    if (sha(otp + d.salt) !== d.h) {
      await ref.update({ tries: admin.firestore.FieldValue.increment(1) });
      return res.status(400).json({ code: 'bad-otp' });
    }
    await admin.auth().updateUser(d.uid, { password });
    await ref.delete();
    return res.json({ ok: true });
  } catch (e) {
    console.error('reset-password', e);
    return res.status(500).json({ code: 'server' });
  }
};