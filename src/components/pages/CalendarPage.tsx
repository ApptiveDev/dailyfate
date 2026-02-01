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
import { Box, Text, HStack, VStack, Center } from '../ui';

const SCREEN_WIDTH = Dimensions.get('window').width;
const SWIPE_THRESHOLD = 50;
const PHOTO_SIZE = SCREEN_WIDTH - 48;

// 요일 한글 약자
const WEEKDAYS_KR = ['월', '화', '수', '목', '금', '토', '일'];
const MONTH_NAMES_KR = [
  '1월', '2월', '3월', '4월', '5월', '6월',
  '7월', '8월', '9월', '10월', '11월', '12월'
];

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
      [0, PHOTO_SIZE + 40],
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

  const date = new Date(photo.date);
  const dayOfWeek = ['일요일', '월요일', '화요일', '수요일', '목요일', '금요일', '토요일'][date.getDay()];
  
  const formatTime = (dateStr: string) => {
    const d = new Date(dateStr);
    let hours = d.getHours();
    const minutes = String(d.getMinutes()).padStart(2, '0');
    const ampm = hours >= 12 ? '오후' : '오전';
    hours = hours % 12;
    hours = hours ? hours : 12;
    return `${ampm} ${hours}:${minutes}`;
  };

  return (
    <Box className="border-b border-neutral-100">
      <Pressable onPress={onToggle}>
        <VStack className="py-8 px-10">
          <HStack className="items-start justify-between">
            <Text 
              className="text-[32px] font-wanted-bold text-black leading-[38px] tracking-tighter flex-1 mr-4"
              numberOfLines={2}
            >
              {mission.theme}
            </Text>
            <VStack className="items-end">
              <Text className="text-sm font-wanted-semibold text-brand-orange mb-1">
                {date.getDate()}일
              </Text>
            </VStack>
          </HStack>
          {isExpanded && (
            <VStack className="mt-4">
              <Text className="text-xs font-wanted-medium text-neutral-400">
                {date.getFullYear()}년 — {formatTime(photo.date)}
              </Text>
            </VStack>
          )}
        </VStack>
      </Pressable>

      <Animated.View style={contentStyle}>
        <Box className="px-10 pb-10">
          <Box
            className="rounded-3xl overflow-hidden bg-neutral-50"
            style={{ width: PHOTO_SIZE - 32, height: PHOTO_SIZE - 32 }}
          >
            {photo.photoUri.startsWith('dummy://') ? (
              <Center className="flex-1">
                <Feather name="image" size={48} color="#D1CFCA" />
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
  onPrevMonth,
  onNextMonth,
  onSelectPhoto,
  onSelectEmptyDay,
}) => {
  const insets = useSafeAreaInsets();
  const translateX = useSharedValue(0);
  const { getMissionByKey } = useMission();
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const photoMap = useMemo(() => {
    const map: Record<string, PhotoEntry> = {};
    photos.forEach((photo) => {
      map[photo.date] = photo;
    });
    return map;
  }, [photos]);

  const sortedPhotos = useMemo(() => {
    return [...photos].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );
  }, [photos]);

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

  const handleSwipeLeft = useCallback(() => {
    onNextMonth();
    setExpandedId(null);
  }, [onNextMonth]);

  const handleSwipeRight = useCallback(() => {
    onPrevMonth();
    setExpandedId(null);
  }, [onPrevMonth]);

  const panGesture = Gesture.Pan()
    .activeOffsetX([-SWIPE_THRESHOLD, SWIPE_THRESHOLD])
    .failOffsetY([-10, 10])
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

  const handleDayPress = useCallback(
    (date: Date | null, photo: PhotoEntry | null) => {
      if (!date) return;
      if (photo) {
        onSelectPhoto(photo);
      } else {
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

  const isFuture = useCallback((date: Date | null) => {
    if (!date) return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const targetDate = new Date(date);
    targetDate.setHours(0, 0, 0, 0);
    return targetDate > today;
  }, []);

  const cellSize = useMemo(() => {
    const padding = 48;
    const gap = 12;
    return (SCREEN_WIDTH - padding - gap * 6) / 7;
  }, []);

  return (
    <Box className="flex-1 bg-white">
      <ScrollView 
        className="flex-1" 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingTop: insets.top + 40, paddingBottom: 60 }}
      >
        {/* Header Section */}
        <Box className="px-10 mb-12">
          <Text className="text-[100px] font-wanted-bold text-black leading-[100px] -ml-2">
            {month}
          </Text>
          <VStack className="mt-4">
            <HStack className="items-center justify-between mt-1">
              <Text className="text-2xl font-wanted-regular text-neutral-400">
                {year}년
              </Text>
              <Text className="text-2xl font-wanted-regular text-black">
                {['일요일', '월요일', '화요일', '수요일', '목요일', '금요일', '토요일'][new Date().getDay()]}
              </Text>
            </HStack>
          </VStack>
        </Box>

        {/* Navigation Controls */}
        <HStack className="px-10 mb-10" space="xl">
          <Pressable onPress={onPrevMonth} hitSlop={20}>
            <Feather name="chevron-left" size={24} color="#000" />
          </Pressable>
          <Pressable onPress={onNextMonth} hitSlop={20}>
            <Feather name="chevron-right" size={24} color="#000" />
          </Pressable>
        </HStack>

        {/* Calendar Grid */}
        <GestureDetector gesture={panGesture}>
          <Animated.View style={[animatedStyle, { paddingHorizontal: 24, marginBottom: 60 }]}>
            <HStack className="justify-between mb-6 px-2">
              {WEEKDAYS_KR.map((day, i) => (
                <Center key={`${day}-${i}`} style={{ width: cellSize }}>
                  <Text className="text-[10px] font-wanted-medium text-neutral-400">
                    {day}
                  </Text>
                </Center>
              ))}
            </HStack>

            <Box className="flex-row flex-wrap justify-between">
              {calendarDays.map((dayData, index) => {
                const { date, photo } = dayData;
                const futureFlag = isFuture(date);
                const isToday = date && 
                  date.getDate() === new Date().getDate() && 
                  date.getMonth() === new Date().getMonth() && 
                  date.getFullYear() === new Date().getFullYear();

                return (
                  <Pressable
                    key={index}
                    onPress={() => handleDayPress(date, photo)}
                    disabled={!date || futureFlag}
                    style={{
                      width: cellSize,
                      height: cellSize,
                      marginBottom: 12,
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    {date ? (
                      <Box
                        style={{
                          width: cellSize - 4,
                          height: cellSize - 4,
                          borderRadius: 12,
                          backgroundColor: isToday ? '#FF5C00' : (photo ? '#1A1A1A' : '#F0F0F0'),
                          borderWidth: 0,
                        }}
                      />
                    ) : null}
                  </Pressable>
                );
              })}
            </Box>
          </Animated.View>
        </GestureDetector>

        {/* Mission Accordion List (새로운 디자인에 맞춰 복구) */}
        {sortedPhotos.length > 0 && (
          <Box className="mt-10 border-t border-neutral-100">
            {sortedPhotos.map((photo) => {
              const mission = getMissionByKey(photo.date);
              return (
                <AccordionItem
                  key={photo.id}
                  photo={photo}
                  mission={mission}
                  isExpanded={expandedId === photo.id}
                  onToggle={() => setExpandedId(expandedId === photo.id ? null : photo.id)}
                />
              );
            })}
          </Box>
        )}

        {/* Footer Text */}
        <Center className="mt-20">
          <Text className="text-[10px] font-wanted-medium text-neutral-400 tracking-[3px]">
            오늘을 기록해 보세요!
          </Text>
        </Center>
      </ScrollView>
    </Box>
  );
};

export default CalendarPage;
