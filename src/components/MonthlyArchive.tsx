import React, { useState } from 'react';
import {
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { WritingEntry } from '../types/writing';

interface Props {
  entries: WritingEntry[];
  selectedMonth: Date;
  onChangeMonth: (date: Date) => void;
  onSelectEntry: (entry: WritingEntry) => void;
  onClose: () => void;
  onToggleBest: (entryId: string) => void;
}

const MONTHS_KR = ['1월', '2월', '3월', '4월', '5월', '6월', '7월', '8월', '9월', '10월', '11월', '12월'];
const WEEKDAY_HANJA = ['日', '月', '火', '水', '木', '金', '土'];

const MonthlyArchive: React.FC<Props> = ({
  entries,
  selectedMonth,
  onChangeMonth,
  onSelectEntry,
  onClose,
  onToggleBest,
}) => {
  const insets = useSafeAreaInsets();
  const [viewMode, setViewMode] = useState<'list' | 'calendar'>('calendar');

  const year = selectedMonth.getFullYear();
  const month = selectedMonth.getMonth();

  const goToPrevMonth = () => {
    onChangeMonth(new Date(year, month - 1, 1));
  };

  const goToNextMonth = () => {
    const now = new Date();
    const nextMonth = new Date(year, month + 1, 1);
    if (nextMonth <= now) {
      onChangeMonth(nextMonth);
    }
  };

  // 작성 통계
  const totalDays = new Date(year, month + 1, 0).getDate();
  const writtenDays = new Set(entries.map(e => e.writtenAt.getDate())).size;

  return (
    <View className="flex-1 bg-stone-200">
      {/* 헤더 */}
      <View
        className="bg-white px-5"
        style={{ paddingTop: insets.top + 8 }}
      >
        <View className="flex-row items-center justify-between py-3">
          <Pressable
            onPress={onClose}
            className="flex-row items-center"
            hitSlop={12}
          >
            <Feather name="chevron-left" size={20} color="#374151" />
            <Text className="ml-1 text-base text-gray-700 font-wanted-semibold">
              돌아가기
            </Text>
          </Pressable>

          {/* 뷰 모드 토글 */}
          <View className="flex-row bg-gray-100 rounded-lg p-1">
            <Pressable
              onPress={() => setViewMode('calendar')}
              className={`px-3 py-1.5 rounded-md ${viewMode === 'calendar' ? 'bg-white' : ''}`}
            >
              <Feather name="grid" size={14} color={viewMode === 'calendar' ? '#111827' : '#9ca3af'} />
            </Pressable>
            <Pressable
              onPress={() => setViewMode('list')}
              className={`px-3 py-1.5 rounded-md ${viewMode === 'list' ? 'bg-white' : ''}`}
            >
              <Feather name="list" size={14} color={viewMode === 'list' ? '#111827' : '#9ca3af'} />
            </Pressable>
          </View>
        </View>

        {/* 점선 구분 */}
        <View className="border-t border-dashed border-gray-300" />
      </View>

      {/* 본문 영역 */}
      <View className="flex-1 bg-white">
        {/* 월 선택 + 통계 */}
        <View className="px-8 pt-8 pb-6">
          <View className="flex-row items-center justify-center mb-6">
            <Pressable onPress={goToPrevMonth} hitSlop={12} className="p-2">
              <Feather name="chevron-left" size={24} color="#6b7280" />
            </Pressable>

            <View className="mx-6 items-center">
              <Text className="text-3xl font-noto-bold text-gray-900">
                {MONTHS_KR[month]}
              </Text>
              <Text className="text-sm text-gray-400 font-wanted-regular mt-1">
                {year}년
              </Text>
            </View>

            <Pressable onPress={goToNextMonth} hitSlop={12} className="p-2">
              <Feather name="chevron-right" size={24} color="#6b7280" />
            </Pressable>
          </View>

          {/* 작성 통계 */}
          <View className="flex-row items-center justify-center">
            <Text className="text-base text-gray-600 font-wanted-semibold">
              {writtenDays}
            </Text>
            <Text className="text-base text-gray-400 font-wanted-regular">
              일 / {totalDays}일 기록
            </Text>
          </View>
        </View>

        {/* 구분선 */}
        <View className="border-t border-dashed border-gray-200" />

        {/* 캘린더 뷰 */}
        {viewMode === 'calendar' ? (
          <ScrollView
            className="flex-1"
            contentContainerStyle={{ padding: 24, paddingBottom: insets.bottom + 24 }}
          >
            <CalendarGrid
              year={year}
              month={month}
              entries={entries}
              onSelectEntry={onSelectEntry}
            />
          </ScrollView>
        ) : (
          /* 리스트 뷰 */
          <ScrollView
            className="flex-1"
            contentContainerStyle={{ padding: 24, paddingBottom: insets.bottom + 24 }}
          >
            {entries.length === 0 ? (
              <View className="items-center py-16">
                <Text className="text-4xl mb-4">📝</Text>
                <Text className="text-base text-gray-400 font-noto">
                  아직 작성한 글이 없어요
                </Text>
                <Text className="mt-1 text-sm text-gray-300 font-wanted-regular">
                  오늘의 글감으로 첫 글을 써보세요
                </Text>
              </View>
            ) : (
              <View className="gap-4">
                {entries.map((entry) => (
                  <EntryListItem
                    key={entry.id}
                    entry={entry}
                    onPress={() => onSelectEntry(entry)}
                    onToggleBest={() => onToggleBest(entry.id)}
                  />
                ))}
              </View>
            )}
          </ScrollView>
        )}
      </View>
    </View>
  );
};

// 캘린더 그리드
interface CalendarGridProps {
  year: number;
  month: number;
  entries: WritingEntry[];
  onSelectEntry: (entry: WritingEntry) => void;
}

const CalendarGrid: React.FC<CalendarGridProps> = ({ year, month, entries, onSelectEntry }) => {
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const entryMap = new Map<number, WritingEntry>();
  entries.forEach(entry => {
    entryMap.set(entry.writtenAt.getDate(), entry);
  });

  const weeks: (number | null)[][] = [];
  let currentWeek: (number | null)[] = [];

  for (let i = 0; i < firstDay; i++) {
    currentWeek.push(null);
  }

  for (let day = 1; day <= daysInMonth; day++) {
    currentWeek.push(day);
    if (currentWeek.length === 7) {
      weeks.push(currentWeek);
      currentWeek = [];
    }
  }

  if (currentWeek.length > 0) {
    while (currentWeek.length < 7) {
      currentWeek.push(null);
    }
    weeks.push(currentWeek);
  }

  return (
    <View>
      {/* 요일 헤더 */}
      <View className="flex-row mb-4">
        {WEEKDAY_HANJA.map((day, idx) => (
          <View key={day} className="flex-1 items-center py-2">
            <Text
              className="text-sm font-noto-semibold"
              style={{
                color: idx === 0 ? '#dc2626' : idx === 6 ? '#2563eb' : '#9ca3af',
              }}
            >
              {day}
            </Text>
          </View>
        ))}
      </View>

      {/* 날짜 그리드 */}
      {weeks.map((week, weekIdx) => (
        <View key={weekIdx} className="flex-row">
          {week.map((day, dayIdx) => {
            const entry = day ? entryMap.get(day) : null;
            const hasEntry = !!entry;
            const isToday =
              day !== null &&
              new Date().getDate() === day &&
              new Date().getMonth() === month &&
              new Date().getFullYear() === year;

            const dayColor = dayIdx === 0 ? '#dc2626' : dayIdx === 6 ? '#2563eb' : '#374151';

            return (
              <Pressable
                key={`${weekIdx}-${dayIdx}`}
                className="flex-1 aspect-square items-center justify-center m-1"
                onPress={() => entry && onSelectEntry(entry)}
                disabled={!entry}
              >
                <View
                  className={`w-full h-full rounded-xl items-center justify-center ${
                    hasEntry ? 'bg-gray-100' : ''
                  }`}
                  style={{
                    borderWidth: isToday ? 2 : 0,
                    borderColor: '#111827',
                  }}
                >
                  {day !== null && (
                    <>
                      <Text
                        className={`text-base font-noto-semibold ${
                          hasEntry ? '' : 'opacity-30'
                        }`}
                        style={{ color: dayColor }}
                      >
                        {day}
                      </Text>
                      {hasEntry && (
                        <View className="w-1.5 h-1.5 rounded-full bg-gray-400 mt-1" />
                      )}
                      {entry?.isBestSentence && (
                        <View className="absolute top-1 right-1">
                          <Feather name="star" size={10} color="#f59e0b" />
                        </View>
                      )}
                    </>
                  )}
                </View>
              </Pressable>
            );
          })}
        </View>
      ))}
    </View>
  );
};

// 글 리스트 아이템
interface EntryListItemProps {
  entry: WritingEntry;
  onPress: () => void;
  onToggleBest: () => void;
}

const EntryListItem: React.FC<EntryListItemProps> = ({ entry, onPress, onToggleBest }) => {
  const writtenDate = entry.writtenAt;
  const day = writtenDate.getDate();
  const weekday = writtenDate.getDay();
  const dayColor = weekday === 0 ? '#dc2626' : weekday === 6 ? '#2563eb' : '#111827';

  return (
    <Pressable
      onPress={onPress}
      className="bg-white border border-gray-100 rounded-2xl overflow-hidden"
    >
      {/* 날짜 헤더 */}
      <View className="flex-row items-center justify-between px-5 py-3 bg-gray-50 border-b border-gray-100">
        <View className="flex-row items-center">
          <Text
            className="text-xl font-noto-bold"
            style={{ color: dayColor }}
          >
            {day}
          </Text>
          <Text className="ml-2 text-sm text-gray-400 font-wanted-regular">
            {WEEKDAY_HANJA[weekday]}
          </Text>
        </View>

        <Pressable onPress={onToggleBest} hitSlop={12}>
          <Feather
            name="star"
            size={18}
            color={entry.isBestSentence ? '#f59e0b' : '#d1d5db'}
          />
        </Pressable>
      </View>

      {/* 글 내용 */}
      <View className="px-5 py-4">
        <Text className="text-sm text-gray-500 font-wanted-regular mb-2">
          {entry.promptTitle}
        </Text>
        <Text
          className="text-base text-gray-800 font-noto leading-7"
          numberOfLines={3}
        >
          {entry.text}
        </Text>
      </View>
    </Pressable>
  );
};

export default MonthlyArchive;
