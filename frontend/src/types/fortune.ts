export type Gender = 'male' | 'female' | 'other';

export interface UserSettings {
  nickname: string;
  gender: Gender;
  birthdate: string; // ISO date string
  notificationTime: string; // HH:mm
  notificationEnabled: boolean;
}

export interface FortuneData {
  summary: string;
  finance: string;
  love: string;
  career: string;
}
