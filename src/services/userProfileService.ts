import { API_CONFIG } from '@/constants/config';
import { getAuthToken } from '@/services/authService';
import type { Gender, UserSettings } from '@/types';

interface UserProfile {
  name: string;
  gender: string;
  birthDateTime: string;
  notificationTime: string;
  notificationEnabled: boolean;
}

interface UserProfileResponse {
  isSuccess: boolean;
  code: number;
  message: string;
  result?: {
    profile: UserProfile | null;
  };
}

interface UserProfilePatch {
  name?: string;
  gender?: string;
  birthDateTime?: string;
  notificationTime?: string;
  notificationEnabled?: boolean;
}

export class ProfileApiError extends Error {
  status?: number;
  code?: number;

  constructor(message: string, options: { status?: number; code?: number } = {}) {
    super(message);
    this.name = 'ProfileApiError';
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

const mapGenderFromApi = (gender: string | null | undefined): Gender => {
  const normalized = gender?.toUpperCase();
  if (normalized === 'M' || normalized === 'MALE') return 'male';
  if (normalized === 'F' || normalized === 'FEMALE') return 'female';
  return 'other';
};

const mapGenderToApi = (gender: Gender | null | undefined) => {
  switch (gender) {
    case 'male':
      return 'M';
    case 'female':
      return 'F';
    case 'other':
      return 'O';
    default:
      return undefined;
  }
};

const toBirthDate = (birthDateTime?: string | null) => {
  if (!birthDateTime) return '';
  const trimmed = birthDateTime.trim();
  if (!trimmed) return '';
  return trimmed.replace('T', ' ');
};

const toBirthDateTime = (birthdate: string) => {
  const trimmed = birthdate.trim();
  if (!trimmed) return undefined;
  if (trimmed.includes('T')) return trimmed;
  if (trimmed.includes(' ')) return trimmed.replace(' ', 'T');
  return `${trimmed}T00:00:00`;
};

const normalizeNotificationTime = (notificationTime: string) => {
  const trimmed = notificationTime.trim();
  if (!trimmed) return undefined;
  const match = trimmed.match(/^(\d{1,2}):(\d{1,2})$/);
  if (!match) {
    throw new ProfileApiError('알림 시간 형식이 올바르지 않습니다.');
  }
  const hour = Number(match[1]);
  const minute = Number(match[2]);
  if (
    !Number.isFinite(hour) ||
    !Number.isFinite(minute) ||
    hour < 0 ||
    hour > 23 ||
    minute < 0 ||
    minute > 59
  ) {
    throw new ProfileApiError('알림 시간 형식이 올바르지 않습니다.');
  }
  if (minute % 5 !== 0) {
    throw new ProfileApiError('알림 시간은 5분 단위만 설정할 수 있습니다.');
  }
  return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
};

const mapProfileToSettings = (profile: UserProfile): UserSettings => ({
  nickname: profile.name ?? '',
  gender: mapGenderFromApi(profile.gender),
  birthdate: toBirthDate(profile.birthDateTime),
  notificationTime: profile.notificationTime ?? '',
  notificationEnabled: Boolean(profile.notificationEnabled),
});

const buildProfilePatch = (settings: UserSettings): UserProfilePatch => {
  const payload: UserProfilePatch = {
    notificationEnabled: settings.notificationEnabled,
  };

  const name = settings.nickname.trim();
  if (name) payload.name = name;

  const gender = mapGenderToApi(settings.gender);
  if (gender) payload.gender = gender;

  const birthDateTime = toBirthDateTime(settings.birthdate);
  if (birthDateTime) payload.birthDateTime = birthDateTime;

  const notificationTime = normalizeNotificationTime(settings.notificationTime);
  if (notificationTime) payload.notificationTime = notificationTime;

  return payload;
};

export async function fetchUserProfile(): Promise<UserSettings | null> {
  const baseUrl = normalizeBaseUrl(API_CONFIG.BASE_URL);
  if (!baseUrl) {
    throw new ProfileApiError('API 주소가 설정되지 않았습니다.');
  }

  const url = `${baseUrl}/users/me`;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), API_CONFIG.TIMEOUT);

  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: await buildHeaders(),
      signal: controller.signal,
    });

    const { payload } = await readPayload<UserProfileResponse>(response);
    if (!response.ok || !payload?.isSuccess) {
      const message = payload?.message || response.statusText || '요청에 실패했습니다.';
      throw new ProfileApiError(message, { status: response.status, code: payload?.code });
    }

    const profile = payload.result?.profile;
    if (!profile) return null;

    return mapProfileToSettings(profile);
  } catch (error) {
    if (error instanceof ProfileApiError) {
      throw error;
    }

    if (error instanceof Error && error.name === 'AbortError') {
      throw new ProfileApiError('요청 시간이 초과되었습니다.', { status: 408 });
    }

    const message = error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.';
    throw new ProfileApiError(message);
  } finally {
    clearTimeout(timeoutId);
  }
}

export async function updateUserProfile(settings: UserSettings): Promise<UserSettings> {
  const baseUrl = normalizeBaseUrl(API_CONFIG.BASE_URL);
  if (!baseUrl) {
    throw new ProfileApiError('API 주소가 설정되지 않았습니다.');
  }

  const url = `${baseUrl}/users/me`;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), API_CONFIG.TIMEOUT);

  try {
    const payload = buildProfilePatch(settings);
    const response = await fetch(url, {
      method: 'PATCH',
      headers: await buildHeaders(true),
      body: JSON.stringify(payload),
      signal: controller.signal,
    });

    const { payload: responsePayload } = await readPayload<UserProfileResponse>(response);
    if (!response.ok || !responsePayload?.isSuccess) {
      const message =
        responsePayload?.message || response.statusText || '요청에 실패했습니다.';
      throw new ProfileApiError(message, {
        status: response.status,
        code: responsePayload?.code,
      });
    }

    const profile = responsePayload.result?.profile;
    if (!profile) {
      throw new ProfileApiError('프로필 응답 형식이 올바르지 않습니다.', {
        status: response.status,
      });
    }

    return mapProfileToSettings(profile);
  } catch (error) {
    if (error instanceof ProfileApiError) {
      throw error;
    }

    if (error instanceof Error && error.name === 'AbortError') {
      throw new ProfileApiError('요청 시간이 초과되었습니다.', { status: 408 });
    }

    const message = error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.';
    throw new ProfileApiError(message);
  } finally {
    clearTimeout(timeoutId);
  }
}

export async function deleteUserAccount(): Promise<void> {
  const baseUrl = normalizeBaseUrl(API_CONFIG.BASE_URL);
  if (!baseUrl) {
    throw new ProfileApiError('API 주소가 설정되지 않았습니다.');
  }

  const url = `${baseUrl}/users/me`;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), API_CONFIG.TIMEOUT);

  try {
    const response = await fetch(url, {
      method: 'DELETE',
      headers: await buildHeaders(),
      signal: controller.signal,
    });

    const { payload } = await readPayload<UserProfileResponse>(response);
    if (!response.ok) {
      const message = payload?.message || response.statusText || '요청에 실패했습니다.';
      throw new ProfileApiError(message, { status: response.status, code: payload?.code });
    }

    if (payload && !payload.isSuccess) {
      const message = payload.message || '요청에 실패했습니다.';
      throw new ProfileApiError(message, { status: response.status, code: payload.code });
    }
  } catch (error) {
    if (error instanceof ProfileApiError) {
      throw error;
    }

    if (error instanceof Error && error.name === 'AbortError') {
      throw new ProfileApiError('요청 시간이 초과되었습니다.', { status: 408 });
    }

    const message = error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.';
    throw new ProfileApiError(message);
  } finally {
    clearTimeout(timeoutId);
  }
}
