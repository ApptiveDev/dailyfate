import { ConfigContext, ExpoConfig } from 'expo/config';

const processEnv =
  (globalThis as { process?: { env?: Record<string, string | undefined> } }).process?.env ?? {};

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,

  // ===== App 기본 정보 =====
  name: '운세한장',
  slug: 'dailyfate',
  version: '1.0.3',

  // ===== 환경 변수 =====
  extra: {
    eas: {
      projectId: '7eaf22a0-8a86-4d38-96f4-5c8eb183393b',
    },
    EXPO_BASE_URL: processEnv.EXPO_BASE_URL,
    EXPO_AUTH_TOKEN: processEnv.EXPO_AUTH_TOKEN,
    EXPO_COGNITO_REGION: processEnv.EXPO_COGNITO_REGION,
    EXPO_COGNITO_USER_POOL_ID: processEnv.EXPO_COGNITO_USER_POOL_ID,
    EXPO_COGNITO_CLIENT_ID: processEnv.EXPO_COGNITO_CLIENT_ID,
    EXPO_COGNITO_TOKEN_USE: processEnv.EXPO_COGNITO_TOKEN_USE,
    EXPO_COGNITO_CODE_TTL_MINUTES: processEnv.EXPO_COGNITO_CODE_TTL_MINUTES,
  },

  // ===== UI 기본 설정 =====
  orientation: 'portrait',
  userInterfaceStyle: 'light',
  icon: './assets/icon.png',

  splash: {
    image: './assets/splash.png',
    resizeMode: 'contain',
    backgroundColor: '#ffffff',
  },

  assetBundlePatterns: ['**/*'],

  // ===== iOS 설정 =====
  ios: {
    ...config.ios,
    supportsTablet: true,
    bundleIdentifier: 'com.dailyfate.frontend',
    infoPlist: {
      ...config.ios?.infoPlist,
      CFBundleDisplayName: '운세한장', // 👈 iOS 홈 화면 앱 이름
      ITSAppUsesNonExemptEncryption: false,
    },
  },

  // ===== Android 설정 =====
  android: {
    ...config.android,
    package: 'com.dailyfate.frontend',

    // @ts-ignore — Expo에서 실제 지원하는 속성
    label: '운세한장',

    adaptiveIcon: {
      ...(config.android?.adaptiveIcon ?? {}),
      foregroundImage: './assets/adaptive-icon.png',
      backgroundColor: '#ffffff',
    },
  },

  // ===== Web 설정 =====
  web: {
    ...config.web,
    favicon: './assets/favicon.png',
  },

  // ===== 기타 =====
  scheme: 'frontend',
  plugins: ['expo-router'],
});
