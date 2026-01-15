import React from 'react';
import {
  Dimensions,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MonthlyStats, PhotoEntry } from '../types/fortune';

interface Props {
  year: number;
  month: number;
  photos: PhotoEntry[];
  stats: MonthlyStats | null;
  onPrevMonth: () => void;
  onNextMonth: () => void;
  onSelectPhoto: (photo: PhotoEntry) => void;
  onSelectEmptyDay: (date: Date) => void;
  onOpenSettings: () => void;
}

const WEEKDAY_LABELS = ['일', '월', '화', '수', '목', '금', '토'];
const SCREEN_WIDTH = Dimensions.get('window').width;
const GRID_PADDING = 16;
const GRID_GAP = 4;
const CELL_SIZE = (SCREEN_WIDTH - GRID_PADDING * 2 - GRID_GAP * 6) / 7;

const getDaysInMonth = (year: number, month: number) => new Date(year, month, 0).getDate();
const getFirstDayOfMonth = (year: number, month: number) => new Date(year, month - 1, 1).getDay();

const MonthlyAlbumPage: React.FC<Props> = ({
  year,
  month,
  photos,
  stats,
  onPrevMonth,
  onNextMonth,
  onSelectPhoto,
  onSelectEmptyDay,
  onOpenSettings,
}) => {
  const insets = useSafeAreaInsets();
  const today = new Date();
  const isCurrentMonth = today.getFullYear() === year && today.getMonth() + 1 === month;
  const todayDate = today.getDate();

  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfMonth(year, month);
  const completionRate = stats ? Math.round((stats.completedDays / stats.totalDays) * 100) : 0;

  // 날짜별 사진 매핑
  const photosByDate: Record<number, PhotoEntry> = {};
  photos.forEach((photo) => {
    const photoDate = new Date(photo.date);
    if (photoDate.getFullYear() === year && photoDate.getMonth() + 1 === month) {
      photosByDate[photoDate.getDate()] = photo;
    }
  });

  // 캘린더 그리드 생성
  const calendarDays: (number | null)[] = [];

  // 첫 주의 빈 칸
  for (let i = 0; i < firstDay; i++) {
    calendarDays.push(null);
  }

  // 날짜 채우기
  for (let day = 1; day <= daysInMonth; day++) {
    calendarDays.push(day);
  }

  // 마지막 주의 빈 칸 (7의 배수로 맞추기)
  while (calendarDays.length % 7 !== 0) {
    calendarDays.push(null);
  }

  const weeks: (number | null)[][] = [];
  for (let i = 0; i < calendarDays.length; i += 7) {
    weeks.push(calendarDays.slice(i, i + 7));
  }

  const canGoNext = () => {
    const now = new Date();
    return year < now.getFullYear() || (year === now.getFullYear() && month < now.getMonth() + 1);
  };

  return (
    <View className="flex-1 bg-[#FFFBF5]">
      {/* 헤더 */}
      <View
        className="z-10 bg-[#FFFBF5] px-5"
        style={{ paddingTop: insets.top + 12 }}
      >
        <View className="flex-row items-center justify-between">
          <View className="flex-row items-center">
            <Pressable
              onPress={onPrevMonth}
              hitSlop={12}
              className="rounded-full bg-white p-2.5 shadow-sm"
            >
              <Feather name="chevron-left" size={20} color="#57534e" />
            </Pressable>

            <View className="mx-4 flex-row items-baseline">
              <Text className="font-serif text-3xl font-bold text-stone-800">
                {year}
              </Text>
              <Text className="mx-1 text-lg text-stone-400">.</Text>
              <Text className="font-serif text-3xl font-bold text-stone-800">
                {String(month).padStart(2, '0')}
              </Text>
            </View>

            <Pressable
              onPress={onNextMonth}
              hitSlop={12}
              disabled={!canGoNext()}
              className={`rounded-full bg-white p-2.5 shadow-sm ${!canGoNext() ? 'opacity-30' : ''}`}
            >
              <Feather name="chevron-right" size={20} color="#57534e" />
            </Pressable>
          </View>

          <Pressable
            onPress={onOpenSettings}
            hitSlop={12}
            className="rounded-full bg-white p-2.5 shadow-sm"
          >
            <Feather name="settings" size={20} color="#57534e" />
          </Pressable>
        </View>
      </View>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: insets.bottom + 100 }}
        showsVerticalScrollIndicator={false}
      >
        {/* 요일 헤더 */}
        <View className="mt-6 flex-row px-4">
          {WEEKDAY_LABELS.map((label, index) => (
            <View
              key={label}
              style={{ width: CELL_SIZE, marginHorizontal: GRID_GAP / 2 }}
              className="items-center py-2"
            >
              <Text
                className={`text-xs font-bold ${
                  index === 0 ? 'text-red-400' : index === 6 ? 'text-blue-400' : 'text-stone-400'
                }`}
              >
                {label}
              </Text>
            </View>
          ))}
        </View>

        {/* 캘린더 그리드 */}
        <View className="px-4">
          {weeks.map((week, weekIndex) => (
            <View key={weekIndex} className="mb-1 flex-row">
              {week.map((day, dayIndex) => {
                if (day === null) {
                  return (
                    <View
                      key={`empty-${dayIndex}`}
                      style={{
                        width: CELL_SIZE,
                        height: CELL_SIZE,
                        marginHorizontal: GRID_GAP / 2,
                      }}
                    />
                  );
                }

                const photo = photosByDate[day];
                const isToday = isCurrentMonth && day === todayDate;
                const isPast = isCurrentMonth ? day < todayDate : true;
                const isFuture = isCurrentMonth && day > todayDate;

                return (
                  <Pressable
                    key={day}
                    onPress={() => {
                      if (photo) {
                        onSelectPhoto(photo);
                      } else if (!isFuture) {
                        onSelectEmptyDay(new Date(year, month - 1, day));
                      }
                    }}
                    disabled={isFuture}
                    style={{
                      width: CELL_SIZE,
                      height: CELL_SIZE,
                      marginHorizontal: GRID_GAP / 2,
                    }}
                    className={`mb-1 overflow-hidden rounded-xl ${
                      isFuture ? 'opacity-30' : ''
                    }`}
                  >
                    {photo ? (
                      /* 사진이 있는 날 */
                      <View className="flex-1 items-center justify-center bg-emerald-100">
                        <View className="absolute inset-0 items-center justify-center">
                          <Feather name="image" size={20} color="#10b981" />
                        </View>
                        <View className="absolute bottom-1 right-1 h-4 w-4 items-center justify-center rounded-full bg-emerald-500">
                          <Feather name="check" size={10} color="#ffffff" />
                        </View>
                        {/* 날짜 표시 */}
                        <Text className="absolute top-1 left-1.5 text-[10px] font-bold text-emerald-600">
                          {day}
                        </Text>
                      </View>
                    ) : isPast ? (
                      /* 과거인데 사진이 없는 날 */
                      <View className="flex-1 items-center justify-center bg-stone-100">
                        <Text className="text-[10px] font-bold text-stone-300">{day}</Text>
                        <View className="mt-1">
                          <Feather name="x" size={12} color="#d6d3d1" />
                        </View>
                      </View>
                    ) : isToday ? (
                      /* 오늘 */
                      <View
                        className="flex-1 items-center justify-center rounded-xl border-2 border-amber-400"
                        style={{ backgroundColor: '#fffbeb' }}
                      >
                        <Text className="text-xs font-extrabold text-amber-600">{day}</Text>
                        <Text className="mt-0.5 text-[8px] font-bold text-amber-400">TODAY</Text>
                      </View>
                    ) : (
                      /* 미래 날짜 */
                      <View className="flex-1 items-center justify-center bg-stone-50">
                        <Text className="text-xs font-semibold text-stone-300">{day}</Text>
                      </View>
                    )}
                  </Pressable>
                );
              })}
            </View>
          ))}
        </View>

        {/* 월간 통계 */}
        <View className="mx-4 mt-6 rounded-2xl bg-white p-5 shadow-sm">
          <Text className="mb-4 text-sm font-semibold uppercase tracking-widest text-stone-400">
            {month}월 기록
          </Text>

          <View className="flex-row items-center justify-between">
            <View className="items-center">
              <Text className="text-3xl font-extrabold text-stone-800">
                {stats?.completedDays || 0}
              </Text>
              <Text className="mt-1 text-xs text-stone-400">완료</Text>
            </View>

            <View className="h-12 w-px bg-stone-100" />

            <View className="items-center">
              <Text className="text-3xl font-extrabold text-stone-800">
                {stats?.totalDays || daysInMonth}
              </Text>
              <Text className="mt-1 text-xs text-stone-400">전체</Text>
            </View>

            <View className="h-12 w-px bg-stone-100" />

            <View className="items-center">
              <Text className="text-3xl font-extrabold text-amber-500">
                {stats?.longestStreak || 0}
              </Text>
              <Text className="mt-1 text-xs text-stone-400">최장 연속</Text>
            </View>

            <View className="h-12 w-px bg-stone-100" />

            <View className="items-center">
              <Text className="text-3xl font-extrabold text-emerald-500">
                {completionRate}%
              </Text>
              <Text className="mt-1 text-xs text-stone-400">달성률</Text>
            </View>
          </View>

          {/* 프로그레스 바 */}
          <View className="mt-5 h-2 overflow-hidden rounded-full bg-stone-100">
            <View
              className="h-full rounded-full bg-emerald-400"
              style={{ width: `${completionRate}%` }}
            />
          </View>
        </View>

        {/* 월말 앨범 생성 버튼 */}
        {stats && stats.completedDays > 0 && (
          <Pressable className="mx-4 mt-4 flex-row items-center justify-center rounded-2xl bg-stone-800 py-4">
            <Feather name="book-open" size={20} color="#ffffff" />
            <Text className="ml-3 text-base font-bold text-white">
              {month}월 앨범 만들기
            </Text>
          </Pressable>
        )}
      </ScrollView>
    </View>
  );
};

export default MonthlyAlbumPage;
