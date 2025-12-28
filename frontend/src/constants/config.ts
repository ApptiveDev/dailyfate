import Constants from 'expo-constants';

type EnvRecord = Record<string, string | undefined>;

const env: EnvRecord =
  (globalThis as { process?: { env?: EnvRecord } }).process?.env ?? {};

const manifestExtra = (Constants.manifest as { extra?: EnvRecord } | undefined)?.extra;
const extra = (Constants.expoConfig?.extra ?? manifestExtra ?? {}) as EnvRecord;

const baseUrl = extra.EXPO_BASE_URL || env.EXPO_BASE_URL || env.API_URL || 'http://localhost:3000';
const authToken = extra.EXPO_AUTH_TOKEN || env.EXPO_AUTH_TOKEN || env.AUTH_TOKEN;
const cognitoUserPoolId =
  extra.EXPO_COGNITO_USER_POOL_ID || env.EXPO_COGNITO_USER_POOL_ID || '';
const cognitoClientId = extra.EXPO_COGNITO_CLIENT_ID || env.EXPO_COGNITO_CLIENT_ID || '';
const cognitoRegion = extra.EXPO_COGNITO_REGION || env.EXPO_COGNITO_REGION || '';
const cognitoTokenUse =
  extra.EXPO_COGNITO_TOKEN_USE || env.EXPO_COGNITO_TOKEN_USE || 'access';

export const API_CONFIG = {
  BASE_URL: baseUrl,
  AUTH_TOKEN: authToken,
  TIMEOUT: 10000,
};

export const COGNITO_CONFIG = {
  USER_POOL_ID: cognitoUserPoolId,
  CLIENT_ID: cognitoClientId,
  REGION: cognitoRegion,
  TOKEN_USE: cognitoTokenUse === 'id' ? 'id' : 'access',
};

export const APP_CONFIG = {
  NAME: 'Frontend',
  VERSION: '1.0.0',
};
