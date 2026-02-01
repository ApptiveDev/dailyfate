import React, { useCallback, useMemo } from 'react';
import { Dimensions, Image, Pressable, ScrollView } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  runOnJS,
} from 'react-native-reanimated';

import type { MonthlyStats, PhotoEntry } from '@/types';
import { Box, Text, HStack, VStack, Center, Button, Heading } from '../ui';

const WEEKDAYS = ['월', '화', '수', '목', '금', '토', '일'];
const SCREEN_WIDTH = Dimensions.get('window').width;
const SWIPE_THRESHOLD = 50;

interface Props {
  year: number;
  month: number;
  photos: PhotoEntry[];
  stats: MonthlyStats;
  onPrevMonth: () => void;
  onNextMonth: () => void;
  onSelectPhoto: (photo: PhotoEntry) => void;
  onSelectEmptyDay: (date: Date) => void;
  onOpenSettings: () => void;
  onCreateAlbum: () => void;
}

const CalendarPage: React.FC<Props> = ({
  year,
  month,
  photos,
  stats,
  onPrevMonth,
  onNextMonth,
  onSelectPhoto,
  onSelectEmptyDay,
  onOpenSettings,
  onCreateAlbum,
}) => {
  const insets = useSafeAreaInsets();
  const translateX = useSharedValue(0);

  // Calculate achievement rate
  const achievementRate = useMemo(() => {
    if (stats.totalDays === 0) return 0;
    return Math.round((stats.completedDays / stats.totalDays) * 100);
  }, [stats]);

  // Create a map of date -> photo for quick lookup
  const photoMap = useMemo(() => {
    const map: Record<string, PhotoEntry> = {};
    photos.forEach((photo) => {
      map[photo.date] = photo;
    });
    return map;
  }, [photos]);

  // Generate calendar grid
  const calendarDays = useMemo(() => {
    const firstDay = new Date(year, month - 1, 1);
    const lastDay = new Date(year, month, 0);
    const daysInMonth = lastDay.getDate();

    // Get the day of week for the first day (0 = Sunday)
    // Convert to Monday-start (0 = Monday)
    let startDayOfWeek = firstDay.getDay() - 1;
    if (startDayOfWeek < 0) startDayOfWeek = 6;

    const days: Array<{ date: Date | null; photo: PhotoEntry | null }> = [];

    // Add empty cells for days before the first day of month
    for (let i = 0; i < startDayOfWeek; i++) {
      days.push({ date: null, photo: null });
    }

    // Add days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month - 1, day);
      const dateKey = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      days.push({
        date,
        photo: photoMap[dateKey] || null,
      });
    }

    // Fill remaining cells to complete the grid (max 6 rows)
    while (days.length < 42) {
      days.push({ date: null, photo: null });
    }

    return days;
  }, [year, month, photoMap]);

  // Swipe gesture for month navigation
  const handleSwipeLeft = useCallback(() => {
    onNextMonth();
  }, [onNextMonth]);

  const handleSwipeRight = useCallback(() => {
    onPrevMonth();
  }, [onPrevMonth]);

  const panGesture = Gesture.Pan()
    .onUpdate((event) => {
      translateX.value = event.translationX;
    })
    .onEnd((event) => {
      if (event.translationX < -SWIPE_THRESHOLD) {
        runOnJS(handleSwipeLeft)();
      } else if (event.translationX > SWIPE_THRESHOLD) {
        runOnJS(handleSwipeRight)();
      }
      translateX.value = withSpring(0, { damping: 18, stiffness: 100 });
    });

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value * 0.3 }],
  }));

  // Handle day cell press
  const handleDayPress = useCallback(
    (date: Date | null, photo: PhotoEntry | null) => {
      if (!date) return;

      if (photo) {
        onSelectPhoto(photo);
      } else {
        // Only allow selecting past or today dates
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const targetDate = new Date(date);
        targetDate.setHours(0, 0, 0, 0);

        if (targetDate <= today) {
          onSelectEmptyDay(date);
        }
      }
    },
    [onSelectPhoto, onSelectEmptyDay]
  );

  // Check if a date is today
  const isToday = useCallback((date: Date | null) => {
    if (!date) return false;
    const today = new Date();
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    );
  }, []);

  // Check if a date is in the future
  const isFuture = useCallback((date: Date | null) => {
    if (!date) return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const targetDate = new Date(date);
    targetDate.setHours(0, 0, 0, 0);
    return targetDate > today;
  }, []);

  // Calculate cell size based on screen width
  const cellSize = useMemo(() => {
    const padding = 32; // px-4 * 2 = 32
    const gap = 8; // gap between cells
    return (SCREEN_WIDTH - padding - gap * 6) / 7;
  }, []);

  return (
    <Box className="flex-1 bg-white">
      {/* Header */}
      <Box
        className="bg-white px-6"
        style={{ paddingTop: insets.top + 16 }}
      >
        <HStack className="justify-between items-center mb-4">
          <Box style={{ width: 40 }} />
          <VStack className="items-center">
            <Text className="text-neutral-400 text-xs font-wanted-semibold">
              {year}년
            </Text>
            <Heading size="xl" className="font-wanted-bold">
              {month}월
            </Heading>
          </VStack>
          <Pressable onPress={onOpenSettings} hitSlop={12}>
            <Feather name="settings" size={22} color="#000" />
          </Pressable>
        </HStack>

        {/* Achievement Rate */}
        <HStack className="justify-between items-center mb-6">
          <HStack className="items-center" space="sm">
            <Pressable onPress={onPrevMonth} hitSlop={12}>
              <Feather name="chevron-left" size={24} color="#000" />
            </Pressable>
            <Text className="text-neutral-500 text-sm font-wanted-regular">
              {year}.{String(month).padStart(2, '0')}
            </Text>
            <Pressable onPress={onNextMonth} hitSlop={12}>
              <Feather name="chevron-right" size={24} color="#000" />
            </Pressable>
          </HStack>
          <HStack className="items-center" space="xs">
            <Text className="text-neutral-500 text-sm font-wanted-regular">
              달성률
            </Text>
            <Text className="text-black text-lg font-wanted-bold">
              {achievementRate}%
            </Text>
          </HStack>
        </HStack>

        {/* Weekday Headers */}
        <HStack className="justify-between mb-2">
          {WEEKDAYS.map((day, index) => (
            <Center key={day} style={{ width: cellSize }}>
              <Text
                className={`text-xs font-wanted-semibold ${
                  index === 5 ? 'text-blue-600' : index === 6 ? 'text-red-600' : 'text-neutral-400'
                }`}
              >
                {day}
              </Text>
            </Center>
          ))}
        </HStack>
      </Box>

      {/* Calendar Grid with Swipe */}
      <GestureDetector gesture={panGesture}>
        <Animated.View style={[{ flex: 1 }, animatedStyle]}>
          <ScrollView
            className="flex-1 px-4"
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 120 }}
          >
            {/* Calendar Grid */}
            <Box className="flex-row flex-wrap justify-between">
              {calendarDays.map((dayData, index) => {
                const { date, photo } = dayData;
                const dayOfWeek = index % 7;
                const isSaturday = dayOfWeek === 5;
                const isSunday = dayOfWeek === 6;
                const todayFlag = isToday(date);
                const futureFlag = isFuture(date);

                return (
                  <Pressable
                    key={index}
                    onPress={() => handleDayPress(date, photo)}
                    disabled={!date || futureFlag}
                    style={{
                      width: cellSize,
                      height: cellSize + 20,
                      marginBottom: 8,
                    }}
                  >
                    {date && (
                      <VStack className="items-center">
                        {/* Photo or Empty Cell */}
                        <Box
                          className={`rounded-lg overflow-hidden ${
                            todayFlag ? 'border-2 border-black' : ''
                          } ${futureFlag ? 'opacity-30' : ''}`}
                          style={{
                            width: cellSize - 4,
                            height: cellSize - 4,
                            backgroundColor: photo ? '#f5f5f5' : '#fafafa',
                          }}
                        >
                          {photo ? (
                            photo.photoUri.startsWith('dummy://') ? (
                              <Center className="flex-1 bg-neutral-100">
                                <Feather name="image" size={20} color="#a3a3a3" />
                              </Center>
                            ) : (
                              <Image
                                source={{ uri: photo.photoUri }}
                                style={{ width: '100%', height: '100%' }}
                                resizeMode="cover"
                              />
                            )
                          ) : (
                            <Center className="flex-1">
                              {!futureFlag && (
                                <Box className="w-1 h-1 rounded-full bg-neutral-200" />
                              )}
                            </Center>
                          )}
                        </Box>

                        {/* Date Number */}
                        <Text
                          className={`text-xs mt-1 ${
                            todayFlag
                              ? 'font-wanted-bold text-black'
                              : futureFlag
                              ? 'font-wanted-regular text-neutral-300'
                              : isSunday
                              ? 'font-wanted-regular text-red-600'
                              : isSaturday
                              ? 'font-wanted-regular text-blue-600'
                              : 'font-wanted-regular text-neutral-600'
                          }`}
                        >
                          {date.getDate()}
                        </Text>
                      </VStack>
                    )}
                  </Pressable>
                );
              })}
            </Box>

            {/* Stats Summary */}
            <Box className="mt-6 mx-2 p-4 bg-neutral-50 rounded-2xl">
              <HStack className="justify-between">
                <VStack className="items-center flex-1">
                  <Text className="text-neutral-400 text-xs font-wanted-regular">
                    완료
                  </Text>
                  <Text className="text-black text-xl font-wanted-bold">
                    {stats.completedDays}
                  </Text>
                  <Text className="text-neutral-400 text-xs font-wanted-regular">
                    /{stats.totalDays}일
                  </Text>
                </VStack>
                <Box className="w-px h-12 bg-neutral-200 self-center" />
                <VStack className="items-center flex-1">
                  <Text className="text-neutral-400 text-xs font-wanted-regular">
                    연속
                  </Text>
                  <HStack className="items-center" space="xs">
                    <Feather name="zap" size={16} color="#f59e0b" />
                    <Text className="text-black text-xl font-wanted-bold">
                      {stats.streak}
                    </Text>
                  </HStack>
                  <Text className="text-neutral-400 text-xs font-wanted-regular">
                    일 달성
                  </Text>
                </VStack>
                <Box className="w-px h-12 bg-neutral-200 self-center" />
                <VStack className="items-center flex-1">
                  <Text className="text-neutral-400 text-xs font-wanted-regular">
                    최장
                  </Text>
                  <Text className="text-black text-xl font-wanted-bold">
                    {stats.longestStreak}
                  </Text>
                  <Text className="text-neutral-400 text-xs font-wanted-regular">
                    일 연속
                  </Text>
                </VStack>
              </HStack>
            </Box>
          </ScrollView>
        </Animated.View>
      </GestureDetector>

      {/* Create Album Button */}
      <Box
        className="absolute left-0 right-0 px-6"
        style={{ bottom: insets.bottom + 80 }}
      >
        <Button
          onPress={onCreateAlbum}
          className="bg-black rounded-full py-4"
        >
          <HStack className="items-center justify-center" space="sm">
            <Feather name="download" size={18} color="#fff" />
            <Text className="text-white font-wanted-semibold">
              이번 달 앨범 만들기
            </Text>
          </HStack>
        </Button>
      </Box>
    </Box>
  );
};

export default CalendarPage;
