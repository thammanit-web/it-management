import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.ndc.itsystem',
  appName: 'it-system',
  webDir: 'out',
  server: {
    url: "https://ndc-it.vercel.app",
    cleartext: true
  }
};

export default config;
