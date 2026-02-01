import { useMemo, useState } from 'react';

import type { MissionData, MonthlyStats, PhotoEntry } from '@/types';
import {
  formatDateKey,
  getDefaultMission,
  getPhotoByDate,
  getDummyStats,
  DUMMY_PHOTOS,
} from '@/data/mockData';

export interface TodayMissionState {
  currentDate: Date;
  dateKey: string;
  todayMission: MissionData;
  todayPhoto: PhotoEntry | null;
  monthlyStats: MonthlyStats;
}

export interface TodayMissionActions {
  setCurrentDate: (date: Date) => void;
}

export interface UseTodayMissionReturn extends TodayMissionState, TodayMissionActions {}

interface UseTodayMissionOptions {
  initialDate?: Date;
  allPhotos?: PhotoEntry[];
}

export const useTodayMission = (options: UseTodayMissionOptions = {}): UseTodayMissionReturn => {
  const { initialDate = new Date(), allPhotos = DUMMY_PHOTOS } = options;

  const [currentDate, setCurrentDate] = useState(initialDate);

  const dateKey = useMemo(() => {
    return formatDateKey(currentDate);
  }, [currentDate]);

  const todayMission = useMemo(() => {
    return getDefaultMission(dateKey);
  }, [dateKey]);

  const todayPhoto = useMemo(() => {
    return getPhotoByDate(dateKey, allPhotos);
  }, [dateKey, allPhotos]);

  const monthlyStats = useMemo(() => {
    return getDummyStats(
      currentDate.getFullYear(),
      currentDate.getMonth() + 1,
      allPhotos
    );
  }, [currentDate, allPhotos]);

  return {
    currentDate,
    dateKey,
    todayMission,
    todayPhoto,
    monthlyStats,
    setCurrentDate,
  };
};
