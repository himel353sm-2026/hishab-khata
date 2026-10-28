import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.mumazbd.businesscalculator',
  appName: 'Business Calculator Book',
  webDir: 'build',
  // APK-র নম্বর (আপডেট পপআপের জন্য)। নতুন APK বানালে এই সংখ্যা ১ করে বাড়ান।
  android: { appendUserAgent: 'BCBApp/1' },
  server: {
    // অ্যাপ সরাসরি লাইভ সাইট থেকে লোড হবে, তাই ওয়েবে বদলালে অ্যাপেও নিজে থেকে আসবে
    url: 'https://hishab-khata-two.vercel.app',
    cleartext: false
  }
};

export default config;
