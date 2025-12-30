import { useEffect, useState } from 'react';

import type { FortuneData } from '@/types';
import { ApiError, fetchFortuneByDate } from '@/services/fortuneService';

export interface FortuneError {
  message: string;
  status?: number;
  code?: number;
}

const normalizeError = (error: unknown): FortuneError => {
  if (error instanceof ApiError) {
    return {
      message: error.message,
      status: error.status,
      code: error.code,
    };
  }

  if (error instanceof Error) {
    return { message: error.message };
  }

  return { message: '알 수 없는 오류가 발생했습니다.' };
};

export const useFortune = (date: Date, enabled = true) => {
  const [fortune, setFortune] = useState<FortuneData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<FortuneError | null>(null);

  useEffect(() => {
    let isActive = true;

    if (!enabled) {
      setFortune(null);
      setError(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    setFortune(null);

    fetchFortuneByDate(date)
      .then((data) => {
        if (isActive) setFortune(data);
      })
      .catch((err) => {
        if (isActive) setError(normalizeError(err));
      })
      .finally(() => {
        if (isActive) setLoading(false);
      });

    return () => {
      isActive = false;
    };
  }, [date, enabled]);

  return { fortune, loading, error };
};
