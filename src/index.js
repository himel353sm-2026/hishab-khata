import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

// কোনো ভুলে পর্দা কালো হয়ে গেলে ভুলের লেখা দেখানো হবে (সমস্যা ধরতে সুবিধা)
const showErr = (msg) => {
  try {
    const r = document.getElementById('root');
    if (!r || r.dataset.err) return;
    r.dataset.err = '1';
    r.innerHTML = '<div style="padding:16px;color:#fbbf24;font:14px/1.5 monospace;white-space:pre-wrap;word-break:break-word"><b>অ্যাপ চালু হয়নি। এই লেখার ছবি পাঠান:</b>\n\n' +
      String(msg).replace(/</g, '&lt;').slice(0, 1500) + '\n\n<button onclick="(async()=>{try{(await navigator.serviceWorker.getRegistrations()).forEach(r=>r.unregister());(await caches.keys()).forEach(k=>caches.delete(k))}catch(e){};location.reload()})()" style="margin-top:12px;padding:10px 16px;border-radius:10px;border:0;background:#f59e0b;font-size:15px">রিফ্রেশ করুন</button></div>';
  } catch (e) { /* ignore */ }
};
window.addEventListener('error', (e) => showErr((e.error && e.error.stack) || e.message));
window.addEventListener('unhandledrejection', (e) => { if (!document.getElementById('root').children.length) showErr((e.reason && e.reason.stack) || e.reason); });

class Boundary extends React.Component {
  constructor(p) { super(p); this.state = { e: null }; }
  static getDerivedStateFromError(e) { return { e }; }
  componentDidCatch(e) { console.error(e); }
  render() {
    if (this.state.e) { setTimeout(() => showErr((this.state.e && this.state.e.stack) || this.state.e), 0); return null; }
    return this.props.children;
  }
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <Boundary>
      <App />
    </Boundary>
  </React.StrictMode>
);
