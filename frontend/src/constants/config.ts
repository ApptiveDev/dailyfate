type EnvRecord = Record<string, string | undefined>;

const env: EnvRecord =
  typeof process !== 'undefined' && process.env ? (process.env as EnvRecord) : {};

export const API_CONFIG = {
  BASE_URL: env.API_URL || 'http://localhost:3000/api',
  TIMEOUT: 10000,
};

export const APP_CONFIG = {
  NAME: 'Frontend',
  VERSION: '1.0.0',
};
