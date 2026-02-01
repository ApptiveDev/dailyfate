import React, { useState, useCallback, useEffect } from 'react';
import { Pressable, Dimensions, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  runOnJS,
  SharedValue,
} from 'react-native-reanimated';
import {
  Gesture,
  GestureDetector,
  GestureHandlerRootView,
} from 'react-native-gesture-handler';
import { MonthlyStats, PhotoEntry } from '../types/fortune';
import {
  Box,
  Text,
  Heading,
  VStack,
  HStack,
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

// 월별 색상 테마 (무채색)
const MONTH_COLORS = [
  { bg: '#FFFFFF', text: '#000000' }, // January
  { bg: '#F5F5F5', text: '#000000' }, // February
  { bg: '#EEEEEE', text: '#000000' }, // March
  { bg: '#E0E0E0', text: '#000000' }, // April
  { bg: '#D6D6D6', text: '#000000' }, // May
  { bg: '#CCCCCC', text: '#000000' }, // June
  { bg: '#C2C2C2', text: '#000000' }, // July
  { bg: '#B8B8B8', text: '#000000' }, // August
  { bg: '#ADADAD', text: '#000000' }, // September
  { bg: '#A3A3A3', text: '#000000' }, // October
  { bg: '#999999', text: '#FFFFFF' }, // November
  { bg: '#8F8F8F', text: '#FFFFFF' }, // December
];

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_WIDTH = SCREEN_WIDTH - 40;
const CARD_HEIGHT = 200;
const COLLAPSED_CARD_HEIGHT = 70;
const SWIPE_THRESHOLD = 50; // 스와이프 임계값

const springConfig = {
  damping: 20,
  stiffness: 200,
  mass: 0.8,
};

interface CardProps {
  monthNum: number;
  index: number;
  photoCount: number;
  daysInMonth: number;
  completionRate: number;
  color: { bg: string; text: string };
  selectedIndex: number;
  dragOffset: SharedValue<number>;
  onTap: (index: number) => void;
}

const Card: React.FC<CardProps> = ({
  monthNum,
  index,
  photoCount,
  daysInMonth,
  completionRate,
  color,
  selectedIndex,
  dragOffset,
  onTap,
}) => {
  // 탭 제스처
  const tapGesture = Gesture.Tap()
    .onEnd(() => {
      'worklet';
      runOnJS(onTap)(index);
    });

  // 애니메이션 스타일
  const animatedStyle = useAnimatedStyle(() => {
    'worklet';

    // 기본 위치 계산
    let basePosition = 0;
    if (index < selectedIndex) {
      basePosition = index * COLLAPSED_CARD_HEIGHT;
    } else if (index === selectedIndex) {
      basePosition = selectedIndex * COLLAPSED_CARD_HEIGHT;
    } else {
      basePosition = selectedIndex * COLLAPSED_CARD_HEIGHT + CARD_HEIGHT + (index - selectedIndex - 1) * COLLAPSED_CARD_HEIGHT;
    }

    // 드래그 오프셋 적용 (선택된 카드 위의 카드들은 더 많이 움직임)
    let offsetMultiplier = 1;
    if (index > selectedIndex) {
      offsetMultiplier = 1.5;
    } else if (index < selectedIndex) {
      offsetMultiplier = 0.5;
    }

    const targetBottom = basePosition + (dragOffset.value * offsetMultiplier);

    return {
      position: 'absolute' as const,
      left: 20,
      bottom: withSpring(targetBottom, springConfig),
      width: CARD_WIDTH,
      height: CARD_HEIGHT,
      zIndex: index + 1,
    };
  }, [selectedIndex, index]);

  return (
    <GestureDetector gesture={tapGesture}>
      <Animated.View style={animatedStyle}>
        <Box
          style={[
            styles.card,
            { backgroundColor: color.bg },
          ]}
        >
          {/* 상단 헤더 영역 */}
          <HStack className="items-center justify-between" style={styles.cardHeader}>
            <Text style={[styles.monthName, { color: color.text }]}>
              {MONTH_NAMES[monthNum - 1]}
            </Text>
            <HStack className="items-end">
              <Text style={[styles.percentSymbol, { color: color.text }]}>
                %
              </Text>
              <Text style={[styles.percentValue, { color: color.text }]}>
                {completionRate}
              </Text>
            </HStack>
          </HStack>

          {/* 하단 상세 영역 */}
          <VStack className="flex-1 justify-between" style={styles.cardContent}>
            <Text style={[styles.recordText, { color: color.text }]}>
              {photoCount > 0 ? `${photoCount}개의 기록` : '아직 기록이 없어요'}
            </Text>
            <HStack style={styles.statsRow}>
              <VStack>
                <Text style={[styles.statsLabel, { color: color.text }]}>
                  완료
                </Text>
                <Text style={[styles.statsValue, { color: color.text }]}>
                  {photoCount}일
                </Text>
              </VStack>
              <VStack>
                <Text style={[styles.statsLabel, { color: color.text }]}>
                  목표
                </Text>
                <Text style={[styles.statsValue, { color: color.text }]}>
                  {daysInMonth}일
                </Text>
              </VStack>
            </HStack>
          </VStack>
        </Box>
      </Animated.View>
    </GestureDetector>
  );
};

const MonthlyAlbumPage: React.FC<Props> = ({
  year,
  month,
  photos,
  onPrevMonth,
  onNextMonth,
  onOpenSettings,
}) => {
  const insets = useSafeAreaInsets();

  // 더미데이터 테스트용: 7월까지 표시
  const maxSelectableMonth = 7;

  // 상태 관리
  const [selectedIndex, setSelectedIndex] = useState(month - 1);
  const dragOffset = useSharedValue(0);

  // 월 변경 시 selectedIndex 동기화
  useEffect(() => {
    if (month >= 1 && month <= maxSelectableMonth) {
      setSelectedIndex(month - 1);
    }
  }, [month]);

  // 월별 사진 개수 계산
  const getPhotoCountForMonth = useCallback((monthNum: number) => {
    return photos.filter((photo) => {
      const photoDate = new Date(photo.date);
      return photoDate.getFullYear() === year && photoDate.getMonth() + 1 === monthNum;
    }).length;
  }, [photos, year]);

  // 카드 선택 변경 핸들러
  const changeSelectedIndex = useCallback((newIndex: number) => {
    const clampedIndex = Math.max(0, Math.min(newIndex, maxSelectableMonth - 1));
    const diff = clampedIndex - selectedIndex;

    setSelectedIndex(clampedIndex);

    // 월 변경 콜백 호출
    if (diff > 0) {
      for (let i = 0; i < diff; i++) onNextMonth();
    } else if (diff < 0) {
      for (let i = 0; i < Math.abs(diff); i++) onPrevMonth();
    }
  }, [selectedIndex, onPrevMonth, onNextMonth, maxSelectableMonth]);

  // 카드 탭 핸들러 - 탭한 카드로 이동
  const handleCardTap = useCallback((index: number) => {
    if (index !== selectedIndex) {
      changeSelectedIndex(index);
    }
  }, [selectedIndex, changeSelectedIndex]);

  // 전체 영역 스와이프 제스처
  const panGesture = Gesture.Pan()
    .onUpdate((event) => {
      'worklet';
      dragOffset.value = event.translationY;
    })
    .onEnd((event) => {
      'worklet';
      const velocity = event.velocityY;
      const translation = event.translationY;

      // 스와이프 방향 판단 (위로 스와이프 = 다음 카드, 아래로 스와이프 = 이전 카드)
      if (translation < -SWIPE_THRESHOLD || velocity < -500) {
        // 위로 스와이프 -> 다음 카드 (인덱스 증가)
        runOnJS(changeSelectedIndex)(selectedIndex + 1);
      } else if (translation > SWIPE_THRESHOLD || velocity > 500) {
        // 아래로 스와이프 -> 이전 카드 (인덱스 감소)
        runOnJS(changeSelectedIndex)(selectedIndex - 1);
      }

      dragOffset.value = withSpring(0, springConfig);
    });

  // 1월부터 순서대로
  const availableMonths = Array.from({ length: maxSelectableMonth }, (_, i) => i + 1);

  return (
    <GestureHandlerRootView style={styles.container}>
      <Box className="flex-1" style={{ backgroundColor: '#000000' }}>
        {/* 헤더 */}
        <Box className="px-8" style={{ paddingTop: insets.top + 16, paddingBottom: 24 }}>
          <HStack className="items-center justify-between">
            <VStack>
              <Heading className="text-3xl font-wanted-bold text-white">{year}년</Heading>
              <Heading className="text-3xl font-wanted-bold text-white">앨범</Heading>
            </VStack>
            <Pressable onPress={onOpenSettings} hitSlop={16}>
              <Feather name="settings" size={24} color="#FFFFFF" />
            </Pressable>
          </HStack>
        </Box>

        {/* 카드 스택 - 전체 영역에 스와이프 제스처 적용 */}
        <GestureDetector gesture={panGesture}>
          <Animated.View style={[styles.cardContainer, { marginBottom: insets.bottom + 90 }]}>
            {availableMonths.map((monthNum, index) => {
              const color = MONTH_COLORS[monthNum - 1];
              const photoCount = getPhotoCountForMonth(monthNum);
              const daysInMonth = new Date(year, monthNum, 0).getDate();
              const completionRate = Math.round((photoCount / daysInMonth) * 100);

              return (
                <Card
                  key={monthNum}
                  monthNum={monthNum}
                  index={index}
                  photoCount={photoCount}
                  daysInMonth={daysInMonth}
                  completionRate={completionRate}
                  color={color}
                  selectedIndex={selectedIndex}
                  dragOffset={dragOffset}
                  onTap={handleCardTap}
                />
              );
            })}
          </Animated.View>
        </GestureDetector>
      </Box>
    </GestureHandlerRootView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  cardContainer: {
    flex: 1,
    marginHorizontal: 0,
  },
  card: {
    flex: 1,
    borderRadius: 24,
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  cardHeader: {
    height: 50,
  },
  monthName: {
    fontSize: 28,
    fontWeight: 'bold',
  },
  percentSymbol: {
    fontSize: 12,
    fontWeight: '500',
    opacity: 0.5,
    marginBottom: 8,
    marginRight: 2,
  },
  percentValue: {
    fontSize: 40,
    fontWeight: 'bold',
    lineHeight: 44,
  },
  cardContent: {
    marginTop: 8,
  },
  recordText: {
    fontSize: 14,
    opacity: 0.5,
  },
  statsRow: {
    gap: 24,
  },
  statsLabel: {
    fontSize: 12,
    opacity: 0.5,
  },
  statsValue: {
    fontSize: 22,
    fontWeight: '600',
  },
});

export default MonthlyAlbumPage;
