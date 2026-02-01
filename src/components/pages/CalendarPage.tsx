import React, { useCallback, useMemo, useState } from 'react';
import { Dimensions, Image, Pressable, ScrollView } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  runOnJS,
  interpolate,
  Extrapolation,
} from 'react-native-reanimated';

import type { MonthlyStats, PhotoEntry, MissionData } from '@/types';
import { useMission } from '@/providers/MissionProvider';
import { Box, Text, HStack, VStack, Center, Button, Heading } from '../ui';

const WEEKDAYS = ['월', '화', '수', '목', '금', '토', '일'];
const SCREEN_WIDTH = Dimensions.get('window').width;
const SWIPE_THRESHOLD = 50;
const PHOTO_SIZE = SCREEN_WIDTH - 64;

interface Props {
  year: number;
  month: number;
  photos: PhotoEntry[];
  stats: MonthlyStats;
  onPrevMonth: () => void;
  onNextMonth: () => void;
  onSelectPhoto: (photo: PhotoEntry) => void;
  onSelectEmptyDay: (date: Date) => void;
  onCreateAlbum: () => void;
}

// 아코디언 아이템 컴포넌트
interface AccordionItemProps {
  photo: PhotoEntry;
  mission: MissionData;
  isExpanded: boolean;
  onToggle: () => void;
}

const AccordionItem: React.FC<AccordionItemProps> = ({
  photo,
  mission,
  isExpanded,
  onToggle,
}) => {
  const animationValue = useSharedValue(isExpanded ? 1 : 0);

  React.useEffect(() => {
    animationValue.value = withTiming(isExpanded ? 1 : 0, { duration: 300 });
  }, [isExpanded, animationValue]);

  const contentStyle = useAnimatedStyle(() => {
    const height = interpolate(
      animationValue.value,
      [0, 1],
      [0, PHOTO_SIZE + 80],
      Extrapolation.CLAMP
    );
    const opacity = interpolate(
      animationValue.value,
      [0, 0.5, 1],
      [0, 0, 1],
      Extrapolation.CLAMP
    );

    return {
      height,
      opacity,
      overflow: 'hidden',
    };
  });

  const chevronStyle = useAnimatedStyle(() => {
    const rotation = interpolate(
      animationValue.value,
      [0, 1],
      [0, 180],
      Extrapolation.CLAMP
    );

    return {
      transform: [{ rotate: `${rotation}deg` }],
    };
  });

  const date = new Date(photo.date);
  const createdAt = photo.createdAt ? new Date(photo.createdAt) : date;
  const dayOfWeek = ['일', '월', '화', '수', '목', '금', '토'][date.getDay()];

  // 미션 텍스트 truncate (최대 15자)
  const truncatedMission = mission.theme.length > 15
    ? `${mission.theme.slice(0, 15)}...`
    : mission.theme;

  const formatTime = (d: Date) => {
    const hours = d.getHours();
    const minutes = String(d.getMinutes()).padStart(2, '0');
    const ampm = hours >= 12 ? 'pm' : 'am';
    const displayHours = hours % 12 || 12;
    return `${displayHours}:${minutes}${ampm}`;
  };

  return (
    <Box className="border-b border-neutral-100">
      {/* 헤더 - 미션 제목 */}
      <Pressable onPress={onToggle}>
        <HStack className="py-4 px-4 items-center justify-between">
          <Text
            className={`text-xl font-wanted-bold ${isExpanded ? 'text-black' : 'text-neutral-600'}`}
            numberOfLines={1}
          >
            {truncatedMission}
          </Text>
          <Animated.View style={chevronStyle}>
            <Feather
              name="chevron-down"
              size={20}
              color={isExpanded ? '#000' : '#a3a3a3'}
            />
          </Animated.View>
        </HStack>
      </Pressable>

      {/* 확장 콘텐츠 */}
      <Animated.View style={contentStyle}>
        <Box className="px-4 pb-4">
          {/* 메타데이터 */}
          <Text className="text-neutral-400 text-sm font-wanted-regular mb-3">
            {date.getMonth() + 1}월 {date.getDate()}일 ({dayOfWeek}), {date.getFullYear()}년 — {formatTime(createdAt)}
          </Text>

          {/* 사진 */}
          <Box
            className="rounded-2xl overflow-hidden bg-neutral-100"
            style={{ width: PHOTO_SIZE, height: PHOTO_SIZE }}
          >
            {photo.photoUri.startsWith('dummy://') ? (
              <Center className="flex-1">
                <Feather name="image" size={48} color="#d4d4d4" />
              </Center>
            ) : (
              <Image
                source={{ uri: photo.photoUri }}
                style={{ width: '100%', height: '100%' }}
                resizeMode="cover"
              />
            )}
          </Box>
        </Box>
      </Animated.View>
    </Box>
  );
};

const CalendarPage: React.FC<Props> = ({
  year,
  month,
  photos,
  stats,
  onPrevMonth,
  onNextMonth,
  onSelectEmptyDay,
  onCreateAlbum,
}) => {
  const insets = useSafeAreaInsets();
  const translateX = useSharedValue(0);
  const { getMissionByKey } = useMission();

  // 확장된 아이템 ID 상태
  const [expandedId, setExpandedId] = useState<string | null>(null);

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

  // Sort photos by date for accordion list
  const sortedPhotos = useMemo(() => {
    return [...photos].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );
  }, [photos]);

  // Generate calendar grid
  const calendarDays = useMemo(() => {
    const firstDay = new Date(year, month - 1, 1);
    const lastDay = new Date(year, month, 0);
    const daysInMonth = lastDay.getDate();

    let startDayOfWeek = firstDay.getDay() - 1;
    if (startDayOfWeek < 0) startDayOfWeek = 6;

    const days: Array<{ date: Date | null; photo: PhotoEntry | null }> = [];

    for (let i = 0; i < startDayOfWeek; i++) {
      days.push({ date: null, photo: null });
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month - 1, day);
      const dateKey = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      days.push({
        date,
        photo: photoMap[dateKey] || null,
      });
    }

    while (days.length < 42) {
      days.push({ date: null, photo: null });
    }

    return days;
  }, [year, month, photoMap]);

  // Swipe gesture for month navigation
  const handleSwipeLeft = useCallback(() => {
    onNextMonth();
    setExpandedId(null);
  }, [onNextMonth]);

  const handleSwipeRight = useCallback(() => {
    onPrevMonth();
    setExpandedId(null);
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

  // Handle day cell press - 아코디언 토글
  const handleDayPress = useCallback(
    (date: Date | null, photo: PhotoEntry | null) => {
      if (!date) return;

      if (photo) {
        // 사진이 있는 날 클릭 시 아코디언 토글
        setExpandedId((prev) => (prev === photo.id ? null : photo.id));
      } else {
        // 사진이 없는 날 클릭 시 해당 날짜로 이동
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const targetDate = new Date(date);
        targetDate.setHours(0, 0, 0, 0);

        if (targetDate <= today) {
          onSelectEmptyDay(date);
        }
      }
    },
    [onSelectEmptyDay]
  );

  // 아코디언 토글 핸들러
  const handleAccordionToggle = useCallback((photoId: string) => {
    setExpandedId((prev) => (prev === photoId ? null : photoId));
  }, []);

  const isToday = useCallback((date: Date | null) => {
    if (!date) return false;
    const today = new Date();
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    );
  }, []);

  const isFuture = useCallback((date: Date | null) => {
    if (!date) return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const targetDate = new Date(date);
    targetDate.setHours(0, 0, 0, 0);
    return targetDate > today;
  }, []);

  const cellSize = useMemo(() => {
    const padding = 32;
    const gap = 8;
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
            <Heading className="text-2xl font-wanted-bold">
              {month}월
            </Heading>
          </VStack>
          <Box style={{ width: 40 }} />
        </HStack>

        {/* Navigation & Achievement Rate */}
        <HStack className="justify-between items-center mb-6">
          <HStack className="items-center" space="sm">
            <Pressable onPress={() => { onPrevMonth(); setExpandedId(null); }} hitSlop={12}>
              <Feather name="chevron-left" size={24} color="#000" />
            </Pressable>
            <Text className="text-neutral-500 text-sm font-wanted-regular">
              {year}.{String(month).padStart(2, '0')}
            </Text>
            <Pressable onPress={() => { onNextMonth(); setExpandedId(null); }} hitSlop={12}>
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
                const isSelected = photo && expandedId === photo.id;

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
                        <Box
                          className={`rounded-lg overflow-hidden ${
                            isSelected ? 'border-2 border-black' : todayFlag ? 'border-2 border-neutral-300' : ''
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

                        <Text
                          className={`text-xs mt-1 ${
                            isSelected
                              ? 'font-wanted-bold text-black'
                              : todayFlag
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

            {/* Mission Accordion List */}
            {sortedPhotos.length > 0 && (
              <Box className="mt-4 mx-2 bg-neutral-50 rounded-2xl overflow-hidden">
                {sortedPhotos.map((photo) => {
                  const mission = getMissionByKey(photo.date);
                  return (
                    <AccordionItem
                      key={photo.id}
                      photo={photo}
                      mission={mission}
                      isExpanded={expandedId === photo.id}
                      onToggle={() => handleAccordionToggle(photo.id)}
                    />
                  );
                })}
              </Box>
            )}
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
