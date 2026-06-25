import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.dcc.insightai',
  appName: 'DCC InsightAI',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
    url: 'https://insight-ai-gamma-virid.vercel.app',
    cleartext: false
  },
  android: {
    allowMixedContent: false,
    captureInput: true,
    webContentsDebuggingEnabled: false
  }
};

export default config;
