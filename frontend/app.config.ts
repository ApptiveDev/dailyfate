import { ConfigContext, ExpoConfig } from 'expo/config';

const processEnv =
  (globalThis as { process?: { env?: Record<string, string | undefined> } }).process?.env ?? {};

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: 'dailyfate',
  slug: 'dailyfate',
  version: '1.0.0',
  extra: {
    eas: {
      projectId: '7eaf22a0-8a86-4d38-96f4-5c8eb183393b',
    },
    EXPO_BASE_URL: processEnv.EXPO_BASE_URL,
    EXPO_AUTH_TOKEN: processEnv.EXPO_AUTH_TOKEN,
  },
  orientation: 'portrait',
  icon: './assets/icon.png',
  userInterfaceStyle: 'light',
  splash: {
    image: './assets/splash.png',
    resizeMode: 'contain',
    backgroundColor: '#ffffff',
  },
  assetBundlePatterns: ['**/*'],
  ios: {
    ...config.ios,
    supportsTablet: true,
    bundleIdentifier: 'com.dailyfate.frontend',
    infoPlist: {
      ...config.ios?.infoPlist,
      ITSAppUsesNonExemptEncryption: false,
    },
  },
  android: {
    ...config.android,
    adaptiveIcon: {
      ...(config.android?.adaptiveIcon ?? {}),
      foregroundImage: './assets/adaptive-icon.png',
      backgroundColor: '#ffffff',
    },
    package: 'com.dailyfate.frontend',
  },
  web: {
    ...config.web,
    favicon: './assets/favicon.png',
  },
  scheme: 'frontend',
  plugins: ['expo-router'],
});
