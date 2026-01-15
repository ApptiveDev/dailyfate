import React, { useState, useCallback } from 'react';
import { View, Alert } from 'react-native';

import WritingCalendarPage from './WritingCalendarPage';
import WritingEditor from './WritingEditor';
import MonthlyArchive from './MonthlyArchive';
import WritingSettingsSheet from './WritingSettingsSheet';
import EntryDetail from './EntryDetail';

import { getTodayPrompt, getRandomPrompt } from '../data/samplePrompts';
import { WritingPrompt, WritingEntry } from '../types/writing';

// 화면 상태
type Screen = 'main' | 'writing' | 'archive' | 'entryDetail';

interface Props {
  onLogout?: () => void;
}

const WritingHome: React.FC<Props> = ({ onLogout }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [currentPrompt, setCurrentPrompt] = useState<WritingPrompt>(getTodayPrompt(currentDate));
  const [currentScreen, setCurrentScreen] = useState<Screen>('main');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // 저장된 글 목록 (샘플 데이터)
  const [entries, setEntries] = useState<WritingEntry[]>([
    {
      id: 'entry-1',
      userId: 'user-1',
      promptId: 'ques-001',
      promptTitle: '자서전을 쓴다면, 첫 문장은 무엇일까요?',
      promptType: 'question',
      text: '나는 항상 조금 늦게 도착하는 사람이었다. 유행에도, 기회에도, 사랑에도. 하지만 그래서 더 오래 머물 수 있었다.',
      charCount: 58,
      writtenAt: new Date(2026, 0, 14, 9, 30),
      isBestSentence: true,
    },
    {
      id: 'entry-2',
      userId: 'user-1',
      promptId: 'copy-001',
      promptTitle: '당신의 하루를 한 문장으로 표현한다면?',
      promptType: 'copywriting',
      text: '커피 한 잔에 담긴 여유, 그게 내 사치야.',
      charCount: 24,
      writtenAt: new Date(2026, 0, 15, 8, 15),
      isBestSentence: true,
    },
    {
      id: 'entry-3',
      userId: 'user-2',
      promptId: 'ques-001',
      promptTitle: '자서전을 쓴다면, 첫 문장은 무엇일까요?',
      promptType: 'question',
      text: '그렇게 배웠습니다. 이루어질 수 없는 사랑은 첫사랑이라고, 하지만 이렇게 생각해 보았습니다. 첫사랑을 겪었기에, 지금의 사랑이 있는 거라고.',
      charCount: 78,
      writtenAt: new Date(2026, 0, 16, 1, 0),
    },
  ]);

  const [selectedEntry, setSelectedEntry] = useState<WritingEntry | null>(null);
  const [archiveMonth, setArchiveMonth] = useState(new Date());

  // 설정 (샘플)
  const userSettings = {
    nickname: '빛나는 문서',
    notificationEnabled: true,
    notificationTime: '09:00',
    preferredPromptTypes: ['question', 'copywriting'],
  };

  // 통계
  const myEntries = entries.filter(e => e.userId === 'user-1');
  const stats = {
    totalEntries: myEntries.length,
    totalDays: new Set(myEntries.map(e => e.writtenAt.toDateString())).size,
    longestStreak: 5,
    currentStreak: 3,
    totalCharacters: myEntries.reduce((sum, e) => sum + e.charCount, 0),
    bestSentenceCount: myEntries.filter(e => e.isBestSentence).length,
  };

  // 현재 글감에 해당하는 글들
  const currentPromptEntries = entries.filter(e => e.promptId === currentPrompt.id);

  // 날짜 이동
  const handleNextDay = useCallback(() => {
    setCurrentDate((prev) => {
      const next = new Date(prev);
      next.setDate(prev.getDate() + 1);
      return next;
    });
    // 날짜가 바뀌면 글감도 변경
    setCurrentPrompt(prev => getRandomPrompt(prev.id));
  }, []);

  const handlePrevDay = useCallback(() => {
    setCurrentDate((prev) => {
      const prevDate = new Date(prev);
      prevDate.setDate(prev.getDate() - 1);
      return prevDate;
    });
    setCurrentPrompt(prev => getRandomPrompt(prev.id));
  }, []);

  // 핸들러들
  const handleSaveEntry = useCallback((text: string) => {
    const newEntry: WritingEntry = {
      id: `entry-${Date.now()}`,
      userId: 'user-1',
      promptId: currentPrompt.id,
      promptTitle: currentPrompt.title,
      promptType: currentPrompt.type,
      text,
      charCount: text.length,
      writtenAt: new Date(),
    };

    setEntries(prev => [newEntry, ...prev]);
    setCurrentScreen('main');
    Alert.alert('저장 완료', '글이 저장되었습니다.');
  }, [currentPrompt]);

  const handleRefreshPrompt = useCallback(() => {
    const newPrompt = getRandomPrompt(currentPrompt.id);
    setCurrentPrompt(newPrompt);
  }, [currentPrompt.id]);

  const handleToggleBest = useCallback((entryId: string) => {
    setEntries(prev =>
      prev.map(e =>
        e.id === entryId ? { ...e, isBestSentence: !e.isBestSentence } : e
      )
    );
  }, []);

  const handleSelectEntry = useCallback((entry: WritingEntry) => {
    setSelectedEntry(entry);
    setCurrentScreen('entryDetail');
  }, []);

  const handleSaveEntryEdit = useCallback((text: string, tags: string[]) => {
    if (!selectedEntry) return;
    setEntries(prev =>
      prev.map(e =>
        e.id === selectedEntry.id
          ? { ...e, text, tags, charCount: text.length, updatedAt: new Date() }
          : e
      )
    );
    setSelectedEntry(prev => prev ? { ...prev, text, tags } : null);
  }, [selectedEntry]);

  const handleDeleteEntry = useCallback(() => {
    if (!selectedEntry) return;
    setEntries(prev => prev.filter(e => e.id !== selectedEntry.id));
    setSelectedEntry(null);
    setCurrentScreen('archive');
  }, [selectedEntry]);

  // 화면 렌더링
  const renderScreen = () => {
    switch (currentScreen) {
      case 'writing':
        return (
          <WritingEditor
            prompt={currentPrompt}
            onSave={handleSaveEntry}
            onClose={() => setCurrentScreen('main')}
          />
        );

      case 'archive':
        return (
          <MonthlyArchive
            entries={myEntries.filter(e =>
              e.writtenAt.getMonth() === archiveMonth.getMonth() &&
              e.writtenAt.getFullYear() === archiveMonth.getFullYear()
            )}
            selectedMonth={archiveMonth}
            onChangeMonth={setArchiveMonth}
            onSelectEntry={handleSelectEntry}
            onClose={() => setCurrentScreen('main')}
            onToggleBest={handleToggleBest}
          />
        );

      case 'entryDetail':
        if (!selectedEntry) {
          setCurrentScreen('main');
          return null;
        }
        return (
          <EntryDetail
            entry={selectedEntry}
            onClose={() => {
              setSelectedEntry(null);
              setCurrentScreen('archive');
            }}
            onSave={handleSaveEntryEdit}
            onDelete={handleDeleteEntry}
            onToggleBest={() => handleToggleBest(selectedEntry.id)}
          />
        );

      default:
        return (
          <WritingCalendarPage
            date={currentDate}
            onNext={handleNextDay}
            onPrev={handlePrevDay}
            prompt={currentPrompt}
            recentEntries={currentPromptEntries}
            totalWritten={entries.length}
            onStartWriting={() => setCurrentScreen('writing')}
            onOpenSettings={() => setIsSettingsOpen(true)}
            onOpenArchive={() => setCurrentScreen('archive')}
            onSelectEntry={handleSelectEntry}
            onRefreshPrompt={handleRefreshPrompt}
          />
        );
    }
  };

  return (
    <View className="flex-1 bg-white">
      {renderScreen()}

      <WritingSettingsSheet
        visible={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={userSettings}
        stats={stats}
        onUpdateSettings={() => {}}
        onOpenBookmarks={() => setIsSettingsOpen(false)}
        onOpenWeeklyBest={() => setIsSettingsOpen(false)}
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

export default WritingHome;
