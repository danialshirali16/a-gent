import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.agent.mobile',
  appName: 'A Gent',
  webDir: 'dist',
  server: { androidScheme: 'https', hostname: 'localhost' },
  android: { backgroundColor: '#111111' },
};

export default config;
