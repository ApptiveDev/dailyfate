import { API_CONFIG } from '@/constants/config';
import { getAuthToken } from '@/services/authService';
import type { FortuneData } from '@/types';

interface FortuneApiResponse {
  isSuccess: boolean;
  code: number;
  message: string;
  result: {
    fortune: {
      solarDate: string;
      lunarDate: string;
      day: string;
      summary: string;
      money: string;
      love: string;
      success: string;
      recommendedAction: string;
    };
    source: string;
  };
}

export class ApiError extends Error {
  status?: number;
  code?: number;

  constructor(message: string, options: { status?: number; code?: number } = {}) {
    super(message);
    this.name = 'ApiError';
    this.status = options.status;
    this.code = options.code;
  }
}

const normalizeBaseUrl = (baseUrl: string) => baseUrl.replace(/\/+$/, '');

const formatDateToKst = (date: Date) => {
  const utc = date.getTime() + date.getTimezoneOffset() * 60000;
  const kst = new Date(utc + 9 * 60 * 60000);
  const year = kst.getFullYear();
  const month = String(kst.getMonth() + 1).padStart(2, '0');
  const day = String(kst.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const readPayload = async (response: Response) => {
  try {
    const rawText = await response.clone().text();
    if (!rawText) return { payload: null, rawText: null };
    try {
      return { payload: JSON.parse(rawText) as FortuneApiResponse, rawText };
    } catch {
      return { payload: null, rawText };
    }
  } catch {
    return { payload: null, rawText: null };
  }
};

export async function fetchFortuneByDate(date: Date): Promise<FortuneData> {
  const baseUrl = normalizeBaseUrl(API_CONFIG.BASE_URL);
  if (!baseUrl) {
    throw new ApiError('API 주소가 설정되지 않았습니다.');
  }

  const dateParam = formatDateToKst(date);
  const url = `${baseUrl}/fortunes/${dateParam}`;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), API_CONFIG.TIMEOUT);
  const authToken = await getAuthToken();
  const headers: Record<string, string> = { Accept: 'application/json' };
  if (authToken) {
    const trimmed = authToken.trim();
    headers.Authorization = trimmed.toLowerCase().startsWith('bearer ')
      ? trimmed
      : `Bearer ${trimmed}`;
  }

  try {
    const response = await fetch(url, {
      method: 'GET',
      headers,
      signal: controller.signal,
    });

    const { payload, rawText } = await readPayload(response);
    if (!response.ok || !payload?.isSuccess) {
      if (response.status === 401 || payload?.code === 401) {
        console.warn('Unauthorized daily response', {
          status: response.status,
          url,
          payload,
          rawText,
        });
      }
      const message = payload?.message || response.statusText || '요청에 실패했습니다.';
      throw new ApiError(message, { status: response.status, code: payload?.code });
    }

    const fortune = payload.result?.fortune;
    if (!fortune) {
      throw new ApiError('데이터 응답 형식이 올바르지 않습니다.', { status: response.status });
    }

    return {
      overview: fortune.summary,
      wealth: fortune.money,
      love: fortune.love,
      success: fortune.success,
      action: fortune.recommendedAction,
      lunarDate: fortune.lunarDate,
    };
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }

    if (error instanceof Error && error.name === 'AbortError') {
      throw new ApiError('요청 시간이 초과되었습니다.', { status: 408 });
    }

    const message = error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.';
    throw new ApiError(message);
  } finally {
    clearTimeout(timeoutId);
  }
}
