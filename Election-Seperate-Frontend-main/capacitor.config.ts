import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.vesp.app',
  appName: 'ESP-Vmukti',
  webDir: 'build',
  android: {
    allowMixedContent: true,
    webContentsDebuggingEnabled: true,
  },
  server: {
    cleartext: true, 
    url:"https://esp.vmukti.com",
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,  // Show splash for 2s
      launchAutoHide: true,      // Auto-hide once webview is ready
      backgroundColor: "#ffffffff", // Your brand color
      androidScaleType: "FIT_CENTER", // 👈 prevents cropping
      showSpinner: false
    }
  }
};

export default config;