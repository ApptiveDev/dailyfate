/**
 * 글감 일력 앱 타입 정의
 */

// 글감 타입 (4가지 카테고리)
export type PromptType = 'copywriting' | 'narrative' | 'constraint' | 'question';

// 글감 데이터
export interface WritingPrompt {
  id: string;
  type: PromptType;
  category: string; // 세부 카테고리 (예: "광고카피", "일상묘사", "감정표현")
  title: string; // 글감 제목/질문
  description?: string; // 부연 설명
  constraint?: string; // 제약조건 (예: "30자 이내", "금지어: 사랑")
  placeholder?: string; // 입력창 플레이스홀더
  tags?: string[]; // 관련 태그
}

// 사용자가 작성한 글
export interface WritingEntry {
  id: string;
  userId: string;
  promptId: string;
  promptTitle: string;
  promptType: PromptType;
  text: string; // 작성한 글 내용
  charCount: number;
  writtenAt: Date;
  updatedAt?: Date;
  isBestSentence?: boolean; // 주간 베스트로 선정됨
  tags?: string[];
}

// 북마크된 글감
export interface BookmarkedPrompt extends WritingPrompt {
  bookmarkedAt: Date;
  isCompleted?: boolean; // 이미 작성한 글감인지
}

// 주간 베스트 문장
export interface BestSentence {
  id: string;
  entryId: string;
  text: string;
  promptTitle: string;
  promptType: PromptType;
  writtenAt: Date;
  weekNumber: number;
  year: number;
}

// 주간 정보
export interface WeekInfo {
  year: number;
  weekNumber: number;
  startDate: Date;
  endDate: Date;
  sentences: BestSentence[];
}

// 월간 통계
export interface MonthlyStats {
  year: number;
  month: number;
  totalDays: number;
  writtenDays: number;
  totalEntries: number;
  averageCharCount: number;
  bestSentenceCount: number;
  promptTypeBreakdown: Record<PromptType, number>;
}

// 글감 타입 레이블 정보
export interface PromptTypeInfo {
  label: string;
  color: string;
  bgColor: string;
  icon: string;
}

export const PROMPT_TYPE_INFO: Record<PromptType, PromptTypeInfo> = {
  copywriting: {
    label: '카피라이팅',
    color: '#7c3aed',
    bgColor: '#ede9fe',
    icon: 'edit-2',
  },
  narrative: {
    label: '서사 글감',
    color: '#059669',
    bgColor: '#d1fae5',
    icon: 'book-open',
  },
  constraint: {
    label: '제약 글쓰기',
    color: '#d97706',
    bgColor: '#fef3c7',
    icon: 'lock',
  },
  question: {
    label: '오늘의 질문',
    color: '#2563eb',
    bgColor: '#dbeafe',
    icon: 'help-circle',
  },
};

// API 응답 타입
export interface WritingApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
  };
}

// 글감 조회 응답
export interface GetPromptResponse {
  prompt: WritingPrompt;
  todayEntry?: WritingEntry; // 오늘 이미 작성한 글이 있으면
}

// 글 저장 요청
export interface SaveEntryRequest {
  promptId: string;
  text: string;
  tags?: string[];
}

// 월간 글 목록 응답
export interface MonthlyEntriesResponse {
  entries: WritingEntry[];
  stats: MonthlyStats;
}
