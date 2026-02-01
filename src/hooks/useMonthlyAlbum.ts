import { useCallback, useMemo, useState } from 'react';

import type { MonthlyStats, PhotoEntry } from '@/types';
import { getDummyStats, getPhotosByMonth, DUMMY_PHOTOS } from '@/data/mockData';

export interface MonthlyAlbumState {
  year: number;
  month: number;
  photos: PhotoEntry[];
  stats: MonthlyStats;
}

export interface MonthlyAlbumActions {
  goToPrevMonth: () => void;
  goToNextMonth: () => void;
  goToMonth: (year: number, month: number) => void;
  canGoNext: boolean;
  canGoPrev: boolean;
}

export interface UseMonthlyAlbumReturn extends MonthlyAlbumState, MonthlyAlbumActions {}

interface UseMonthlyAlbumOptions {
  initialYear?: number;
  initialMonth?: number;
  allPhotos?: PhotoEntry[];
}

export const useMonthlyAlbum = (options: UseMonthlyAlbumOptions = {}): UseMonthlyAlbumReturn => {
  const now = new Date();
  const {
    initialYear = now.getFullYear(),
    initialMonth = now.getMonth() + 1,
    allPhotos = DUMMY_PHOTOS,
  } = options;

  const [year, setYear] = useState(initialYear);
  const [month, setMonth] = useState(initialMonth);

  const photos = useMemo(() => {
    return getPhotosByMonth(year, month, allPhotos);
  }, [year, month, allPhotos]);

  const stats = useMemo(() => {
    return getDummyStats(year, month, allPhotos);
  }, [year, month, allPhotos]);

  const canGoNext = useMemo(() => {
    const today = new Date();
    return (
      year < today.getFullYear() ||
      (year === today.getFullYear() && month < today.getMonth() + 1)
    );
  }, [year, month]);

  const canGoPrev = true; // 과거로는 무제한 이동 가능

  const goToPrevMonth = useCallback(() => {
    if (month === 1) {
      setYear((y) => y - 1);
      setMonth(12);
    } else {
      setMonth((m) => m - 1);
    }
  }, [month]);

  const goToNextMonth = useCallback(() => {
    if (!canGoNext) return;

    if (month === 12) {
      setYear((y) => y + 1);
      setMonth(1);
    } else {
      setMonth((m) => m + 1);
    }
  }, [month, canGoNext]);

  const goToMonth = useCallback((newYear: number, newMonth: number) => {
    setYear(newYear);
    setMonth(newMonth);
  }, []);

  return {
    year,
    month,
    photos,
    stats,
    goToPrevMonth,
    goToNextMonth,
    goToMonth,
    canGoNext,
    canGoPrev,
  };
};
