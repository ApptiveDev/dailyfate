import type { MissionData, MonthlyStats, PhotoEntry } from '@/types';

// ===== 더미 미션 데이터 =====
export const DUMMY_MISSIONS: Record<string, MissionData> = {
  // 1월
  '2026-01-05': { id: 'm1', date: '2026-01-05', theme: '새해 첫 발걸음', hint: '새해의 시작을 기록해보세요' },
  '2026-01-10': { id: 'm2', date: '2026-01-10', theme: '하늘에서 내리는 것', hint: '오늘의 날씨를 담아보세요' },
  '2026-01-15': { id: 'm3', date: '2026-01-15', theme: '따뜻한 음료 한 잔', hint: '추운 겨울, 따뜻함을 찾아보세요' },
  '2026-01-18': { id: 'm4', date: '2026-01-18', theme: '오늘의 하늘 색깔', hint: '하늘을 올려다보세요' },
  '2026-01-22': { id: 'm5', date: '2026-01-22', theme: '출근길 풍경', hint: '매일 지나치는 풍경을 담아보세요' },
  '2026-01-24': { id: 'm6', date: '2026-01-24', theme: '퇴근길 풍경', hint: '일상에서 특별한 순간을 찾아보세요' },
  // 2월
  '2026-02-03': { id: 'm7', date: '2026-02-03', theme: '명절 아침 풍경', hint: '가족과 함께하는 순간' },
  '2026-02-14': { id: 'm8', date: '2026-02-14', theme: '사랑을 담은 순간', hint: '오늘의 특별한 순간' },
  '2026-02-28': { id: 'm9', date: '2026-02-28', theme: '이번 달의 마지막', hint: '2월을 마무리하며' },
  // 3월
  '2026-03-01': { id: 'm10', date: '2026-03-01', theme: '우리나라의 상징', hint: '태극기를 찾아보세요' },
  '2026-03-05': { id: 'm11', date: '2026-03-05', theme: '비 오는 날의 정취', hint: '빗소리를 들으며' },
  '2026-03-10': { id: 'm12', date: '2026-03-10', theme: '노란색을 찾아서', hint: '봄의 색깔을 담아보세요' },
  '2026-03-15': { id: 'm13', date: '2026-03-15', theme: '분홍빛 꽃잎', hint: '봄꽃을 찾아보세요' },
  '2026-03-20': { id: 'm14', date: '2026-03-20', theme: '산책로에서 만난 것', hint: '걸으며 발견한 것' },
  '2026-03-25': { id: 'm15', date: '2026-03-25', theme: '함께 먹는 밥', hint: '소중한 사람과의 식사' },
  '2026-03-30': { id: 'm16', date: '2026-03-30', theme: '밤의 불빛들', hint: '도시의 야경을 담아보세요' },
  // 4월
  '2026-04-05': { id: 'm17', date: '2026-04-05', theme: '활짝 핀 꽃', hint: '가장 아름다운 꽃을 찾아보세요' },
  '2026-04-12': { id: 'm18', date: '2026-04-12', theme: '주말 아침 식탁', hint: '여유로운 아침을 담아보세요' },
  '2026-04-20': { id: 'm19', date: '2026-04-20', theme: '비 갠 후의 세상', hint: '깨끗해진 세상을 담아보세요' },
  '2026-04-28': { id: 'm20', date: '2026-04-28', theme: '바깥 나들이', hint: '밖으로 나가보세요' },
  // 5월
  '2026-05-01': { id: 'm21', date: '2026-05-01', theme: '쉬는 날의 여유', hint: '휴식의 순간을 담아보세요' },
  '2026-05-05': { id: 'm22', date: '2026-05-05', theme: '동심의 세계', hint: '어린 시절을 떠올려보세요' },
  '2026-05-10': { id: 'm23', date: '2026-05-10', theme: '감사의 마음', hint: '고마운 분께 마음을 전해보세요' },
  '2026-05-18': { id: 'm24', date: '2026-05-18', theme: '높은 곳에서 본 풍경', hint: '정상에서 바라보는 세상' },
  '2026-05-22': { id: 'm25', date: '2026-05-22', theme: '해 질 무렵', hint: '저녁의 평화로움을 담아보세요' },
  '2026-05-30': { id: 'm26', date: '2026-05-30', theme: '5월을 마무리하며', hint: '이번 달의 기억' },
  // 6월
  '2026-06-06': { id: 'm27', date: '2026-06-06', theme: '나라를 위한 분들', hint: '감사의 마음을 담아보세요' },
  '2026-06-15': { id: 'm28', date: '2026-06-15', theme: '초록빛 세상', hint: '여름의 시작을 담아보세요' },
  // 7월
  '2026-07-01': { id: 'm29', date: '2026-07-01', theme: '7월의 시작', hint: '새로운 달의 첫날' },
  '2026-07-10': { id: 'm30', date: '2026-07-10', theme: '시원함을 찾아서', hint: '더위를 피하는 방법' },
  '2026-07-17': { id: 'm31', date: '2026-07-17', theme: '대한민국 헌법', hint: '자유와 권리를 생각하며' },
  '2026-07-25': { id: 'm32', date: '2026-07-25', theme: '설레는 마음', hint: '기대되는 내일을 담아보세요' },
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

// 기본 미션 테마 목록
const DEFAULT_THEMES = [
  '오늘의 하늘',
  '발걸음이\n멈춘\n곳',
  '오늘 창문 밖\n풍경은\n어땠나요?',
  '오늘 먹은 것',
  '지금 내 앞에 있는 것',
  '오늘의 색깔',
  '일상의 한 조각',
];

/**
 * 특정 날짜의 미션 데이터 반환 (없으면 기본값)
 */
export const getDefaultMission = (dateKey: string): MissionData => {
  if (DUMMY_MISSIONS[dateKey]) {
    return DUMMY_MISSIONS[dateKey];
  }

  // 날짜 기반으로 일관된 테마 선택
  const day = parseInt(dateKey.split('-')[2], 10);
  const themeIndex = day % DEFAULT_THEMES.length;

  return {
    id: `default-${dateKey}`,
    date: dateKey,
    theme: DEFAULT_THEMES[themeIndex],
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
