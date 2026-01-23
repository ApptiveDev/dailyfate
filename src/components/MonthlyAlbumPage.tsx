import React, { useRef, useEffect } from 'react';
import { Dimensions, Pressable, ScrollView } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MonthlyStats, PhotoEntry } from '../types/fortune';
import {
  Box,
  Text,
  Heading,
  VStack,
  HStack,
  Center,
  Card,
} from './ui';

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
  const monthScrollRef = useRef<ScrollView>(null);
  const today = new Date();
  const isCurrentMonth = today.getFullYear() === year && today.getMonth() + 1 === month;
  const todayDate = today.getDate();

  const MONTH_NAMES = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  const MONTH_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const WEEKDAY_LABELS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

  const SCREEN_WIDTH = Dimensions.get('window').width;
  const GRID_GAP = 6;

  const daysInMonth = new Date(year, month, 0).getDate();
  const firstDay = new Date(year, month - 1, 1).getDay();

  const photosByDate: Record<number, PhotoEntry> = {};
  photos.forEach((photo) => {
    const photoDate = new Date(photo.date);
    if (photoDate.getFullYear() === year && photoDate.getMonth() + 1 === month) {
      photosByDate[photoDate.getDate()] = photo;
    }
  });

  const calendarDays: (number | null)[] = [];
  for (let i = 0; i < firstDay; i++) calendarDays.push(null);
  for (let d = 1; d <= daysInMonth; d++) calendarDays.push(d);
  while (calendarDays.length % 7 !== 0) calendarDays.push(null);

  const weeks: (number | null)[][] = [];
  for (let i = 0; i < calendarDays.length; i += 7) {
    weeks.push(calendarDays.slice(i, i + 7));
  }

  useEffect(() => {
    const timer = setTimeout(() => {
      monthScrollRef.current?.scrollTo({ x: (month - 1) * 80 - 100, animated: false });
    }, 100);
    return () => clearTimeout(timer);
  }, [month]);

  const handleMonthSelect = (selectedMonth: number) => {
    const now = new Date();
    const maxMonth = now.getFullYear() === year ? now.getMonth() + 1 : 12;
    if (selectedMonth <= maxMonth) {
      if (selectedMonth < month) {
        for (let i = 0; i < month - selectedMonth; i++) onPrevMonth();
      } else if (selectedMonth > month) {
        for (let i = 0; i < selectedMonth - month; i++) onNextMonth();
      }
    }
  };

  return (
    <Box className="flex-1 bg-white">
      <Box className="px-6" style={{ paddingTop: insets.top + 16 }}>
        <HStack className="items-center justify-between">
          <Pressable
            onPress={onOpenSettings}
            className="h-10 w-10 items-center justify-center rounded-full bg-black"
          >
            <Feather name="user" size={18} color="#fff" />
          </Pressable>
          <Heading className="text-lg text-black">{year}</Heading>
          <Box className="w-10" />
        </HStack>
      </Box>

      <ScrollView
        ref={monthScrollRef}
        horizontal
        showsHorizontalScrollIndicator={false}
        className="mt-6"
        contentContainerStyle={{ paddingHorizontal: 24 }}
      >
        {MONTH_NAMES.map((name, index) => {
          const monthNum = index + 1;
          const isSelected = monthNum === month;
          const now = new Date();
          const isDisabled = year === now.getFullYear() && monthNum > now.getMonth() + 1;

          return (
            <Pressable
              key={name}
              onPress={() => handleMonthSelect(monthNum)}
              disabled={isDisabled}
              className="mr-4"
            >
              <Text
                className={`text-xl ${
                  isSelected
                    ? 'font-bold text-black'
                    : isDisabled
                    ? 'font-light text-neutral-200'
                    : 'font-light text-neutral-400'
                }`}
              >
                {name}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: insets.bottom + 120 }}
        showsVerticalScrollIndicator={false}
      >
        <Card className="mx-6 mt-6 p-4 rounded-2xl border border-neutral-100">
          <HStack className="mb-2">
            {WEEKDAY_LABELS.map((label, index) => (
              <Center
                key={`${label}-${index}`}
                style={{ width: (SCREEN_WIDTH - 48 - 32 - GRID_GAP * 6) / 7 }}
                className="py-2"
              >
                <Text className="text-xs font-medium text-neutral-400">
                  {label}
                </Text>
              </Center>
            ))}
          </HStack>

          {weeks.map((week, weekIndex) => (
            <HStack key={weekIndex} style={{ marginBottom: GRID_GAP }}>
              {week.map((dayValue, dayIndex) => {
                const cellWidth = (SCREEN_WIDTH - 48 - 32 - GRID_GAP * 6) / 7;
                if (dayValue === null) return <Box key={`empty-${dayIndex}`} style={{ width: cellWidth, height: cellWidth }} />;

                const photo = photosByDate[dayValue];
                const isToday = isCurrentMonth && dayValue === todayDate;
                const isPast = isCurrentMonth ? dayValue < todayDate : true;
                const isFuture = isCurrentMonth && dayValue > todayDate;

                return (
                  <Pressable
                    key={dayValue}
                    onPress={() => {
                      if (photo) onSelectPhoto(photo);
                      else if (!isFuture) onSelectEmptyDay(new Date(year, month - 1, dayValue));
                    }}
                    disabled={isFuture}
                    style={{ width: cellWidth, height: cellWidth }}
                  >
                    {photo ? (
                      <Center className="flex-1 rounded-lg bg-black">
                        <Feather name="check" size={14} color="#fff" />
                      </Center>
                    ) : isToday ? (
                      <Center className="flex-1 rounded-lg bg-black">
                        <Text className="text-xs font-bold text-white">{dayValue}</Text>
                      </Center>
                    ) : isPast ? (
                      <Center className="flex-1 rounded-lg bg-neutral-50">
                        <Text className="text-xs text-neutral-400">{dayValue}</Text>
                      </Center>
                    ) : (
                      <Center className="flex-1 rounded-lg">
                        <Text className="text-xs text-neutral-300">{dayValue}</Text>
                      </Center>
                    )}
                  </Pressable>
                );
              })}
            </HStack>
          ))}
        </Card>

        <Box className="mx-6 mt-8">
          <Text className="text-lg font-bold text-black mb-4">Today</Text>
          <VStack space="sm">
            <Card className="p-4 rounded-2xl bg-neutral-50 border-0">
              <HStack className="justify-between items-center">
                <HStack space="md" className="items-center">
                  <Center className="h-8 w-8 rounded-full bg-black">
                    <Feather name="check" size={14} color="#fff" />
                  </Center>
                  <VStack>
                    <Text className="text-sm font-medium text-black">완료한 미션</Text>
                    <Text className="text-xs text-neutral-400">이번 달</Text>
                  </VStack>
                </HStack>
                <Text className="text-lg font-bold text-black">{stats?.completedDays || 0}일</Text>
              </HStack>
            </Card>

            <Card className="p-4 rounded-2xl bg-neutral-50 border-0">
              <HStack className="justify-between items-center">
                <HStack space="md" className="items-center">
                  <Center className="h-8 w-8 rounded-full bg-black">
                    <Feather name="zap" size={14} color="#fff" />
                  </Center>
                  <VStack>
                    <Text className="text-sm font-medium text-black">연속 달성</Text>
                    <Text className="text-xs text-neutral-400">최장 기록</Text>
                  </VStack>
                </HStack>
                <Text className="text-lg font-bold text-black">{stats?.longestStreak || 0}일</Text>
              </HStack>
            </Card>

            {stats && stats.completedDays > 0 && (
              <Card className="p-4 rounded-2xl bg-black mt-2 border-0">
                <HStack className="justify-between items-center">
                  <VStack>
                    <Text className="text-sm font-medium text-white">앨범 만들기</Text>
                    <Text className="text-xs text-neutral-400">
                      {MONTH_SHORT[month - 1]}의 추억을 저장하세요
                    </Text>
                  </VStack>
                  <Center className="h-10 w-10 rounded-full bg-white">
                    <Feather name="download" size={18} color="#000" />
                  </Center>
                </HStack>
              </Card>
            )}
          </VStack>
        </Box>
      </ScrollView>
    </Box>
  );
};

export default MonthlyAlbumPage;
