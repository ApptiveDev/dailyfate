import React, { useState, useCallback } from 'react';
import { View, Alert, Linking } from 'react-native';

import EconomyCalendarPage from './EconomyCalendarPage';
import QuizView from './QuizView';
import TermArchive from './TermArchive';
import LearningStreak from './LearningStreak';
import EconomySettingsSheet from './EconomySettingsSheet';

import {
  EconomyTerm,
  LearningRecord,
  LearningStats,
  TermCategory,
} from '../../types/economy';
import {
  sampleTerms,
  getTodayTerm,
  getQuizByTermId,
  getArticlesByTermId,
  getRandomTerm,
} from '../../data/sampleTerms';

// 화면 상태
type Screen = 'main' | 'quiz' | 'archive' | 'streak';

interface Props {
  onLogout?: () => void;
}

const EconomyHome: React.FC<Props> = ({ onLogout }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [currentTerm, setCurrentTerm] = useState<EconomyTerm>(getTodayTerm(currentDate));
  const [currentScreen, setCurrentScreen] = useState<Screen>('main');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // 학습 기록 (샘플)
  const [learningHistory, setLearningHistory] = useState<LearningRecord[]>([
    { id: 'lr-1', date: new Date(2026, 0, 14), termId: 'term-001', quizAnswered: true, isCorrect: true },
    { id: 'lr-2', date: new Date(2026, 0, 15), termId: 'term-002', quizAnswered: true, isCorrect: true },
    { id: 'lr-3', date: new Date(2026, 0, 13), termId: 'term-004', quizAnswered: true, isCorrect: false },
    { id: 'lr-4', date: new Date(2026, 0, 12), termId: 'term-005', quizAnswered: true, isCorrect: true },
    { id: 'lr-5', date: new Date(2026, 0, 11), termId: 'term-007', quizAnswered: true, isCorrect: true },
  ]);

  // 북마크 (어려웠던 용어)
  const [bookmarkedTermIds, setBookmarkedTermIds] = useState<string[]>(['term-003', 'term-012']);

  // 퀴즈 및 기사
  const currentQuiz = getQuizByTermId(currentTerm.id) || null;
  const currentArticles = getArticlesByTermId(currentTerm.id);

  // 학습 완료 여부
  const isLearned = learningHistory.some(
    (r) => r.date.toDateString() === currentDate.toDateString()
  );

  // 북마크 여부
  const isBookmarked = bookmarkedTermIds.includes(currentTerm.id);

  // 학습 통계 계산
  const learnedTermIds = [...new Set(learningHistory.map((r) => r.termId))];
  const stats: LearningStats = {
    totalTermsLearned: learnedTermIds.length,
    totalQuizAnswered: learningHistory.filter((r) => r.quizAnswered).length,
    correctAnswers: learningHistory.filter((r) => r.isCorrect).length,
    currentStreak: calculateStreak(learningHistory),
    longestStreak: 12,
    categoryProgress: {
      macro: Math.round((learnedTermIds.filter((id) => {
        const term = sampleTerms.find((t) => t.id === id);
        return term?.category === 'macro';
      }).length / sampleTerms.filter((t) => t.category === 'macro').length) * 100),
      finance: Math.round((learnedTermIds.filter((id) => {
        const term = sampleTerms.find((t) => t.id === id);
        return term?.category === 'finance';
      }).length / sampleTerms.filter((t) => t.category === 'finance').length) * 100),
      market: Math.round((learnedTermIds.filter((id) => {
        const term = sampleTerms.find((t) => t.id === id);
        return term?.category === 'market';
      }).length / sampleTerms.filter((t) => t.category === 'market').length) * 100),
      policy: Math.round((learnedTermIds.filter((id) => {
        const term = sampleTerms.find((t) => t.id === id);
        return term?.category === 'policy';
      }).length / sampleTerms.filter((t) => t.category === 'policy').length) * 100),
    },
  };

  // 설정
  const userSettings = {
    nickname: '경제 초보',
    notificationEnabled: true,
    notificationTime: '08:00',
    preferredCategories: ['macro', 'finance'] as TermCategory[],
  };

  // 날짜 이동
  const handleNextDay = useCallback(() => {
    setCurrentDate((prev) => {
      const next = new Date(prev);
      next.setDate(prev.getDate() + 1);
      return next;
    });
    setCurrentTerm((prev) => getRandomTerm(prev.id));
  }, []);

  const handlePrevDay = useCallback(() => {
    setCurrentDate((prev) => {
      const prevDate = new Date(prev);
      prevDate.setDate(prev.getDate() - 1);
      return prevDate;
    });
    setCurrentTerm((prev) => getRandomTerm(prev.id));
  }, []);

  // 학습 완료
  const handleCompleteQuiz = useCallback((isCorrect: boolean) => {
    const newRecord: LearningRecord = {
      id: `lr-${Date.now()}`,
      date: new Date(),
      termId: currentTerm.id,
      quizAnswered: true,
      isCorrect,
    };

    setLearningHistory((prev) => [newRecord, ...prev]);
    setCurrentScreen('main');

    if (isCorrect) {
      Alert.alert('정답!', '오늘도 경제 감각이 쑥쑥 자랐어요.');
    }
  }, [currentTerm.id]);

  // 북마크 토글
  const handleToggleBookmark = useCallback((termId?: string) => {
    const id = termId || currentTerm.id;
    setBookmarkedTermIds((prev) =>
      prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id]
    );
  }, [currentTerm.id]);

  // 용어 선택 (아카이브에서)
  const handleSelectTerm = useCallback((term: EconomyTerm) => {
    setCurrentTerm(term);
    setCurrentScreen('quiz');
  }, []);

  // 기사 열기
  const handleOpenArticle = useCallback((url: string) => {
    Linking.openURL(url);
  }, []);

  // 화면 렌더링
  const renderScreen = () => {
    switch (currentScreen) {
      case 'quiz':
        return (
          <QuizView
            term={currentTerm}
            quiz={currentQuiz}
            articles={currentArticles}
            onClose={() => setCurrentScreen('main')}
            onComplete={handleCompleteQuiz}
            onOpenArticle={handleOpenArticle}
          />
        );

      case 'archive':
        return (
          <TermArchive
            terms={sampleTerms}
            learnedTermIds={learnedTermIds}
            bookmarkedTermIds={bookmarkedTermIds}
            onClose={() => setCurrentScreen('main')}
            onSelectTerm={handleSelectTerm}
            onToggleBookmark={handleToggleBookmark}
          />
        );

      case 'streak':
        return (
          <LearningStreak
            stats={stats}
            learningHistory={learningHistory}
            onClose={() => setCurrentScreen('main')}
          />
        );

      default:
        return (
          <EconomyCalendarPage
            date={currentDate}
            onNext={handleNextDay}
            onPrev={handlePrevDay}
            term={currentTerm}
            quiz={currentQuiz}
            articles={currentArticles}
            isLearned={isLearned}
            onStartLearning={() => setCurrentScreen('quiz')}
            onOpenSettings={() => setIsSettingsOpen(true)}
            onOpenArchive={() => setCurrentScreen('archive')}
            onOpenStreak={() => setCurrentScreen('streak')}
            onBookmarkTerm={() => handleToggleBookmark()}
            isBookmarked={isBookmarked}
          />
        );
    }
  };

  return (
    <View className="flex-1 bg-white">
      {renderScreen()}

      <EconomySettingsSheet
        visible={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={userSettings}
        stats={stats}
        onUpdateSettings={() => {}}
        onOpenBookmarks={() => {
          setIsSettingsOpen(false);
          setCurrentScreen('archive');
        }}
        onLogout={() => {
          Alert.alert('로그아웃', '로그아웃 하시겠습니까?', [
            { text: '취소', style: 'cancel' },
            { text: '확인', onPress: onLogout },
          ]);
        }}
        onDeleteAccount={() => {
          Alert.alert('계정 삭제', '정말 계정을 삭제하시겠습니까?', [
            { text: '취소', style: 'cancel' },
            { text: '삭제', style: 'destructive' },
          ]);
        }}
      />
    </View>
  );
};

// 연속 학습일 계산
function calculateStreak(history: LearningRecord[]): number {
  if (history.length === 0) return 0;

  const sortedDates = [...new Set(history.map((r) => r.date.toDateString()))]
    .sort((a, b) => new Date(b).getTime() - new Date(a).getTime());

  let streak = 0;
  let expectedDate = new Date();
  expectedDate.setHours(0, 0, 0, 0);

  for (const dateStr of sortedDates) {
    const date = new Date(dateStr);
    date.setHours(0, 0, 0, 0);

    if (date.getTime() === expectedDate.getTime()) {
      streak++;
      expectedDate.setDate(expectedDate.getDate() - 1);
    } else if (date.getTime() < expectedDate.getTime()) {
      break;
    }
  }

  return streak;
}

export default EconomyHome;
