import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.mumazbd.businesscalculator',
  appName: 'Business Calculator Book',
  webDir: 'build',
  // এই APK-র ভার্সন (আপডেট পপআপের জন্য)। নতুন APK বানালে এটা বাড়ান, যেমন BCBApp/1.0.6
  android: { appendUserAgent: 'BCBApp/1.0.5' },
  server: {
    // অ্যাপ সরাসরি লাইভ সাইট থেকে লোড হবে, তাই ওয়েবে বদলালে অ্যাপেও নিজে থেকে আসবে
    url: 'https://hishab-khata-two.vercel.app',
    cleartext: false
  }
};

export default config;
