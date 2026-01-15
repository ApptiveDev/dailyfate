export type Gender = 'male' | 'female' | 'other';

export interface UserSettings {
  nickname: string;
  gender: Gender;
  birthdate: string; // ISO date/time string
  notificationTime: string; // HH:mm (5-minute increments)
  notificationEnabled: boolean;
}

export interface FortuneData {
  // Main daily overview paragraph
  overview: string;
  // Category fortunes
  wealth: string;
  love: string;
  success: string;
  // Suggested action or tip for the day
  action: string;
  // Optional lunar date string e.g. "음력 1월 15일"
  lunarDate?: string;
}

// ===== 사진 미션 일력 관련 타입 =====

export type Season = '봄' | '여름' | '가을' | '겨울';

export type SolarTerm =
  | '입춘' | '우수' | '경칩' | '춘분' | '청명' | '곡우'   // 봄 절기
  | '입하' | '소만' | '망종' | '하지' | '소서' | '대서'   // 여름 절기
  | '입추' | '처서' | '백로' | '추분' | '한로' | '상강'   // 가을 절기
  | '입동' | '소설' | '대설' | '동지' | '소한' | '대한';  // 겨울 절기

export type SeasonTag = Season | SolarTerm;

export interface MissionData {
  id: string;
  date: string;           // "2026-01-16"
  theme: string;          // "오늘의 그림자"
  seasonTag?: SeasonTag;  // 계절/절기 태그
  hint?: string;          // 힌트 텍스트
}

export interface PhotoEntry {
  id: string;
  missionId: string;
  date: string;           // "2026-01-16"
  photoUri: string;       // 로컬 또는 클라우드 URL
  thumbnailUri?: string;
  caption?: string;
  createdAt: string;
}

export interface MonthlyStats {
  year: number;
  month: number;
  totalDays: number;
  completedDays: number;
  streak: number;          // 현재 연속 달성
  longestStreak: number;   // 최장 연속 기록
}

export interface MonthlyAlbumData {
  year: number;
  month: number;
  photos: PhotoEntry[];
  stats: MonthlyStats;
}
