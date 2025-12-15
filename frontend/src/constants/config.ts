const env =
  typeof globalThis !== 'undefined' && (globalThis as any).process?.env
    ? ((globalThis as any).process.env as Record<string, string | undefined>)
    : {};

export const API_CONFIG = {
  BASE_URL: env.API_URL || 'http://localhost:3000/api',
  TIMEOUT: 10000,
};

export const APP_CONFIG = {
  NAME: 'Frontend',
  VERSION: '1.0.0',
};
