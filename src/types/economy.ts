// 경제 용어 카테고리
export type TermCategory =
  | 'macro' // 거시경제 (금리, 환율, GDP 등)
  | 'finance' // 금융/투자 (주식, 채권, 펀드 등)
  | 'market' // 시장/산업 (수요공급, 독점 등)
  | 'policy'; // 정책/제도 (통화정책, 재정정책 등)

// 난이도
export type Difficulty = 'beginner' | 'intermediate' | 'advanced';

// 경제 용어
export interface EconomyTerm {
  id: string;
  term: string; // 용어명 (예: "기준금리")
  termEn?: string; // 영문명 (예: "Base Rate")
  category: TermCategory;
  difficulty: Difficulty;
  definition: string; // 초간단 정의 (2문장)
  example: string; // 예시 (1문장)
  relatedTerms?: string[]; // 관련 용어 ID
  tags?: string[];
}

// 퀴즈 문항
export interface Quiz {
  id: string;
  termId: string;
  question: string;
  options: string[]; // 4지선다
  correctIndex: number; // 정답 인덱스 (0-3)
  explanation?: string; // 해설
}

// 뉴스 기사
export interface NewsArticle {
  id: string;
  title: string;
  source: string; // 출처 (예: "한국경제", "매일경제")
  url: string;
  publishedAt: Date;
  termId: string; // 관련 용어
}

// 학습 기록
export interface LearningRecord {
  id: string;
  date: Date;
  termId: string;
  quizAnswered: boolean;
  isCorrect?: boolean;
  timeSpent?: number; // 학습 시간 (초)
}

// 북마크 (어려웠던 용어)
export interface BookmarkedTerm {
  termId: string;
  bookmarkedAt: Date;
  note?: string; // 메모
}

// 학습 통계
export interface LearningStats {
  totalTermsLearned: number;
  totalQuizAnswered: number;
  correctAnswers: number;
  currentStreak: number;
  longestStreak: number;
  categoryProgress: Record<TermCategory, number>; // 카테고리별 학습 진행률
}

// 주간 학습 데이터 (잔디용)
export interface WeeklyLearning {
  date: Date;
  learned: boolean;
  isCorrect?: boolean;
}

// 카테고리 정보
export const CATEGORY_INFO: Record<TermCategory, { label: string; color: string; bgColor: string; icon: string }> = {
  macro: { label: '거시경제', color: '#2563eb', bgColor: '#dbeafe', icon: 'globe' },
  finance: { label: '금융/투자', color: '#059669', bgColor: '#d1fae5', icon: 'trending-up' },
  market: { label: '시장/산업', color: '#d97706', bgColor: '#fef3c7', icon: 'shopping-bag' },
  policy: { label: '정책/제도', color: '#7c3aed', bgColor: '#ede9fe', icon: 'file-text' },
};

// 난이도 정보
export const DIFFICULTY_INFO: Record<Difficulty, { label: string; color: string }> = {
  beginner: { label: '입문', color: '#22c55e' },
  intermediate: { label: '중급', color: '#f59e0b' },
  advanced: { label: '고급', color: '#ef4444' },
};
