import type { MissionData, MonthlyStats, PhotoEntry } from '@/types';

// ===== 더미 미션 데이터 =====
export const DUMMY_MISSIONS: Record<string, MissionData> = {
  '2026-01-24': {
    id: '1',
    date: '2026-01-24',
    theme: '오늘\n퇴근길 풍경은\n어땠나요?',
    hint: '일상에서 특별한 순간을 찾아보세요',
  },
};

// ===== 더미 사진 데이터 =====
export const DUMMY_PHOTOS: PhotoEntry[] = [
  // 1월 (5개)
  { id: '1', missionId: 'm1', date: '2026-01-05', photoUri: 'dummy://jan1.jpg', caption: '새해 첫 산책', createdAt: '2026-01-05T18:00:00Z' },
  { id: '2', missionId: 'm2', date: '2026-01-10', photoUri: 'dummy://jan2.jpg', caption: '눈 오는 날', createdAt: '2026-01-10T18:00:00Z' },
  { id: '3', missionId: 'm3', date: '2026-01-15', photoUri: 'dummy://jan3.jpg', caption: '카페에서', createdAt: '2026-01-15T18:00:00Z' },
  { id: '4', missionId: 'm4', date: '2026-01-18', photoUri: 'dummy://jan4.jpg', caption: '저녁 노을', createdAt: '2026-01-18T18:00:00Z' },
  { id: '5', missionId: 'm5', date: '2026-01-22', photoUri: 'dummy://jan5.jpg', caption: '출근길', createdAt: '2026-01-22T18:00:00Z' },
  // 2월 (3개)
  { id: '6', missionId: 'm6', date: '2026-02-03', photoUri: 'dummy://feb1.jpg', caption: '설날 아침', createdAt: '2026-02-03T18:00:00Z' },
  { id: '7', missionId: 'm7', date: '2026-02-14', photoUri: 'dummy://feb2.jpg', caption: '발렌타인', createdAt: '2026-02-14T18:00:00Z' },
  { id: '8', missionId: 'm8', date: '2026-02-28', photoUri: 'dummy://feb3.jpg', caption: '2월의 마지막', createdAt: '2026-02-28T18:00:00Z' },
  // 3월 (7개)
  { id: '9', missionId: 'm9', date: '2026-03-01', photoUri: 'dummy://mar1.jpg', caption: '삼일절', createdAt: '2026-03-01T18:00:00Z' },
  { id: '10', missionId: 'm10', date: '2026-03-05', photoUri: 'dummy://mar2.jpg', caption: '봄비', createdAt: '2026-03-05T18:00:00Z' },
  { id: '11', missionId: 'm11', date: '2026-03-10', photoUri: 'dummy://mar3.jpg', caption: '개나리', createdAt: '2026-03-10T18:00:00Z' },
  { id: '12', missionId: 'm12', date: '2026-03-15', photoUri: 'dummy://mar4.jpg', caption: '벚꽃 시작', createdAt: '2026-03-15T18:00:00Z' },
  { id: '13', missionId: 'm13', date: '2026-03-20', photoUri: 'dummy://mar5.jpg', caption: '공원 산책', createdAt: '2026-03-20T18:00:00Z' },
  { id: '14', missionId: 'm14', date: '2026-03-25', photoUri: 'dummy://mar6.jpg', caption: '친구와 점심', createdAt: '2026-03-25T18:00:00Z' },
  { id: '15', missionId: 'm15', date: '2026-03-30', photoUri: 'dummy://mar7.jpg', caption: '퇴근길 야경', createdAt: '2026-03-30T18:00:00Z' },
  // 4월 (4개)
  { id: '16', missionId: 'm16', date: '2026-04-05', photoUri: 'dummy://apr1.jpg', caption: '벚꽃 만개', createdAt: '2026-04-05T18:00:00Z' },
  { id: '17', missionId: 'm17', date: '2026-04-12', photoUri: 'dummy://apr2.jpg', caption: '주말 브런치', createdAt: '2026-04-12T18:00:00Z' },
  { id: '18', missionId: 'm18', date: '2026-04-20', photoUri: 'dummy://apr3.jpg', caption: '비 온 뒤', createdAt: '2026-04-20T18:00:00Z' },
  { id: '19', missionId: 'm19', date: '2026-04-28', photoUri: 'dummy://apr4.jpg', caption: '봄 나들이', createdAt: '2026-04-28T18:00:00Z' },
  // 5월 (6개)
  { id: '20', missionId: 'm20', date: '2026-05-01', photoUri: 'dummy://may1.jpg', caption: '근로자의 날', createdAt: '2026-05-01T18:00:00Z' },
  { id: '21', missionId: 'm21', date: '2026-05-05', photoUri: 'dummy://may2.jpg', caption: '어린이날', createdAt: '2026-05-05T18:00:00Z' },
  { id: '22', missionId: 'm22', date: '2026-05-10', photoUri: 'dummy://may3.jpg', caption: '어버이날', createdAt: '2026-05-10T18:00:00Z' },
  { id: '23', missionId: 'm23', date: '2026-05-18', photoUri: 'dummy://may4.jpg', caption: '주말 등산', createdAt: '2026-05-18T18:00:00Z' },
  { id: '24', missionId: 'm24', date: '2026-05-22', photoUri: 'dummy://may5.jpg', caption: '저녁 산책', createdAt: '2026-05-22T18:00:00Z' },
  { id: '25', missionId: 'm25', date: '2026-05-30', photoUri: 'dummy://may6.jpg', caption: '5월의 끝', createdAt: '2026-05-30T18:00:00Z' },
  // 6월 (2개)
  { id: '26', missionId: 'm26', date: '2026-06-06', photoUri: 'dummy://jun1.jpg', caption: '현충일', createdAt: '2026-06-06T18:00:00Z' },
  { id: '27', missionId: 'm27', date: '2026-06-15', photoUri: 'dummy://jun2.jpg', caption: '여름 시작', createdAt: '2026-06-15T18:00:00Z' },
  // 7월 (4개)
  { id: '28', missionId: 'm28', date: '2026-07-01', photoUri: 'dummy://jul1.jpg', caption: '7월 첫날', createdAt: '2026-07-01T18:00:00Z' },
  { id: '29', missionId: 'm29', date: '2026-07-10', photoUri: 'dummy://jul2.jpg', caption: '무더위', createdAt: '2026-07-10T18:00:00Z' },
  { id: '30', missionId: 'm30', date: '2026-07-17', photoUri: 'dummy://jul3.jpg', caption: '제헌절', createdAt: '2026-07-17T18:00:00Z' },
  { id: '31', missionId: 'm31', date: '2026-07-25', photoUri: 'dummy://jul4.jpg', caption: '휴가 전날', createdAt: '2026-07-25T18:00:00Z' },
];

// ===== 유틸리티 함수 =====

/**
 * Date 객체를 YYYY-MM-DD 형식의 문자열로 변환
 */
export const formatDateKey = (date: Date): string => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

/**
 * 특정 월의 사진 통계 계산 (더미 데이터 기반)
 */
export const getDummyStats = (year: number, month: number, photos: PhotoEntry[] = DUMMY_PHOTOS): MonthlyStats => {
  const daysInMonth = new Date(year, month, 0).getDate();
  const today = new Date();
  const isCurrentMonth = today.getFullYear() === year && today.getMonth() + 1 === month;
  const totalDays = isCurrentMonth ? today.getDate() : daysInMonth;
  const completedDays = photos.filter((p) => {
    const d = new Date(p.date);
    return d.getFullYear() === year && d.getMonth() + 1 === month;
  }).length;

  return {
    year,
    month,
    totalDays,
    completedDays,
    streak: 2,
    longestStreak: 5,
  };
};

/**
 * 특정 날짜의 미션 데이터 반환 (없으면 기본값)
 */
export const getDefaultMission = (dateKey: string): MissionData => {
  return DUMMY_MISSIONS[dateKey] || {
    id: 'default',
    date: dateKey,
    theme: '오늘\n퇴근길 풍경은\n어땠나요?',
    hint: '일상에서 특별한 순간을 찾아보세요',
  };
};

/**
 * 특정 월의 사진 목록 필터링
 */
export const getPhotosByMonth = (year: number, month: number, photos: PhotoEntry[] = DUMMY_PHOTOS): PhotoEntry[] => {
  return photos.filter((p) => {
    const d = new Date(p.date);
    return d.getFullYear() === year && d.getMonth() + 1 === month;
  });
};

/**
 * 특정 날짜의 사진 찾기
 */
export const getPhotoByDate = (dateKey: string, photos: PhotoEntry[] = DUMMY_PHOTOS): PhotoEntry | null => {
  return photos.find((p) => p.date === dateKey) || null;
};
