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
