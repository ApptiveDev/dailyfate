import { API_CONFIG } from '@/constants/config';
import { getAuthToken } from '@/services/authService';

type PushPlatform = 'ios' | 'android';

interface PushTokenPayload {
  pushToken: string;
  platform: PushPlatform;
}

interface PushTokenResult {
  pushToken: string;
  platform: PushPlatform;
}

interface PushTokenResponse {
  isSuccess: boolean;
  code: number;
  message: string;
  result?: PushTokenResult;
}

export class PushTokenApiError extends Error {
  status?: number;
  code?: number;

  constructor(message: string, options: { status?: number; code?: number } = {}) {
    super(message);
    this.name = 'PushTokenApiError';
    this.status = options.status;
    this.code = options.code;
  }
}

const normalizeBaseUrl = (baseUrl: string) => baseUrl.replace(/\/+$/, '');

const readPayload = async <T>(response: Response) => {
  try {
    const rawText = await response.clone().text();
    if (!rawText) return { payload: null, rawText: null };
    try {
      return { payload: JSON.parse(rawText) as T, rawText };
    } catch {
      return { payload: null, rawText };
    }
  } catch {
    return { payload: null, rawText: null };
  }
};

const buildHeaders = async (includeJson = false) => {
  const authToken = await getAuthToken();
  const headers: Record<string, string> = { Accept: 'application/json' };
  if (includeJson) {
    headers['Content-Type'] = 'application/json';
  }
  if (authToken) {
    const trimmed = authToken.trim();
    headers.Authorization = trimmed.toLowerCase().startsWith('bearer ')
      ? trimmed
      : `Bearer ${trimmed}`;
  }
  return headers;
};

export async function updatePushToken(payload: PushTokenPayload): Promise<PushTokenResult> {
  const baseUrl = normalizeBaseUrl(API_CONFIG.BASE_URL);
  if (!baseUrl) {
    throw new PushTokenApiError('API base URL is missing.');
  }

  if (!payload.pushToken.trim()) {
    throw new PushTokenApiError('pushToken is required.');
  }

  const url = `${baseUrl}/users/me/token`;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), API_CONFIG.TIMEOUT);

  try {
    const response = await fetch(url, {
      method: 'PATCH',
      headers: await buildHeaders(true),
      body: JSON.stringify(payload),
      signal: controller.signal,
    });

    const { payload: responsePayload } = await readPayload<PushTokenResponse>(response);
    if (!response.ok || !responsePayload?.isSuccess) {
      const message = responsePayload?.message || response.statusText || 'Request failed.';
      throw new PushTokenApiError(message, {
        status: response.status,
        code: responsePayload?.code,
      });
    }

    if (!responsePayload.result) {
      throw new PushTokenApiError('Push token response is missing.', {
        status: response.status,
      });
    }

    return responsePayload.result;
  } catch (error) {
    if (error instanceof PushTokenApiError) {
      throw error;
    }

    if (error instanceof Error && error.name === 'AbortError') {
      throw new PushTokenApiError('Request timed out.', { status: 408 });
    }

    const message = error instanceof Error ? error.message : 'Unknown error occurred.';
    throw new PushTokenApiError(message);
  } finally {
    clearTimeout(timeoutId);
  }
}
