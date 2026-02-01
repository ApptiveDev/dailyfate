import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';

import type { MissionData } from '@/types';
import { DUMMY_MISSIONS, formatDateKey, getDefaultMission } from '@/data/mockData';

interface MissionContextValue {
  missions: Record<string, MissionData>;
  getMission: (date: Date) => MissionData;
  getMissionByKey: (dateKey: string) => MissionData;
  refreshMission: (date: Date) => Promise<void>;
  isLoading: boolean;
}

const MissionContext = createContext<MissionContextValue | undefined>(undefined);

export const MissionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [missions, setMissions] = useState<Record<string, MissionData>>(DUMMY_MISSIONS);
  const [isLoading, setIsLoading] = useState(false);

  const getMission = useCallback(
    (date: Date): MissionData => {
      const dateKey = formatDateKey(date);
      return missions[dateKey] || getDefaultMission(dateKey);
    },
    [missions]
  );

  const getMissionByKey = useCallback(
    (dateKey: string): MissionData => {
      return missions[dateKey] || getDefaultMission(dateKey);
    },
    [missions]
  );

  const refreshMission = useCallback(async (date: Date) => {
    const dateKey = formatDateKey(date);
    setIsLoading(true);
    try {
      // TODO: API 호출로 실제 미션 데이터 가져오기
      // const mission = await fetchMission(dateKey);
      // setMissions((prev) => ({ ...prev, [dateKey]: mission }));

      // 현재는 더미 데이터 사용
      const mission = getDefaultMission(dateKey);
      setMissions((prev) => ({ ...prev, [dateKey]: mission }));
    } catch (error) {
      console.error('Failed to refresh mission:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const value = useMemo(
    () => ({
      missions,
      getMission,
      getMissionByKey,
      refreshMission,
      isLoading,
    }),
    [missions, getMission, getMissionByKey, refreshMission, isLoading]
  );

  return <MissionContext.Provider value={value}>{children}</MissionContext.Provider>;
};

export const useMission = (): MissionContextValue => {
  const context = useContext(MissionContext);
  if (!context) {
    throw new Error('useMission must be used within MissionProvider');
  }
  return context;
};
