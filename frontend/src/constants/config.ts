import Constants from 'expo-constants';

type EnvRecord = Record<string, string | undefined>;

const env: EnvRecord =
  (globalThis as { process?: { env?: EnvRecord } }).process?.env ?? {};

const manifestExtra = (Constants.manifest as { extra?: EnvRecord } | undefined)?.extra;
const extra = (Constants.expoConfig?.extra ?? manifestExtra ?? {}) as EnvRecord;

const baseUrl = extra.EXPO_BASE_URL || env.EXPO_BASE_URL || env.API_URL || 'http://localhost:3000';

export const API_CONFIG = {
  BASE_URL: baseUrl,
  TIMEOUT: 10000,
};

export const APP_CONFIG = {
  NAME: 'Frontend',
  VERSION: '1.0.0',
};
