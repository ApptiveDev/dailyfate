import React, { useCallback } from 'react';
import { Pressable, StyleSheet, View, Dimensions } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  useAnimatedStyle,
  withSpring,
  interpolate,
  useSharedValue,
  useAnimatedScrollHandler,
  SharedValue,
} from 'react-native-reanimated';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { MonthlyStats, PhotoEntry } from '@/types/fortune';
import { Box, Text } from '../ui';

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

// 월별 통계 데이터 타입
interface MonthlyStatData {
  year: number;
  month: number;
  streakDays: number;
  successRate: number;
}

// 파스텔/뮤트 톤 색상 팔레트 (Apple Wallet 느낌)
const CARD_COLORS: { bg: string; text: string; accent: string }[] = [
  { bg: '#F5E6D3', text: '#4A3728', accent: '#8B7355' }, // 웜 베이지
  { bg: '#E8D5C4', text: '#5C4033', accent: '#9D7B5B' }, // 토프
  { bg: '#D4E5ED', text: '#2C4A5A', accent: '#5A8A9E' }, // 소프트 블루
  { bg: '#E5DDD5', text: '#4A4039', accent: '#7D7067' }, // 그레이지
  { bg: '#DDE8D5', text: '#3A4A33', accent: '#6B8B5E' }, // 세이지
  { bg: '#EDD5D5', text: '#5A3A3A', accent: '#9E6B6B' }, // 더스티 로즈
  { bg: '#D5DEE8', text: '#3A4455', accent: '#6B7D9E' }, // 슬레이트 블루
  { bg: '#E8E5D5', text: '#4A4833', accent: '#8B8655' }, // 올리브
  { bg: '#E0D5E8', text: '#4A3A55', accent: '#8B6B9E' }, // 라벤더
  { bg: '#D5E8E5', text: '#335550', accent: '#5B9E8B' }, // 민트
  { bg: '#F0E5D8', text: '#4D4035', accent: '#8A7560' }, // 카라멜
  { bg: '#DBE5E0', text: '#354540', accent: '#608578' }, // 유칼립투스
];

const MONTH_NAMES_KR = [
  '1월', '2월', '3월', '4월', '5월', '6월',
  '7월', '8월', '9월', '10월', '11월', '12월',
];

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const CARD_WIDTH = SCREEN_WIDTH - 40;
const CARD_HEIGHT = 140;
const CARD_OVERLAP = 65; // 겹치는 높이

const springConfig = {
  damping: 18,
  stiffness: 100,
  mass: 0.8,
};

// Mock 데이터 생성 (실제 데이터 소스가 없으므로)
const generateMockStats = (): MonthlyStatData[] => {
  const currentDate = new Date();
  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth() + 1;

  const stats: MonthlyStatData[] = [];

  // 최근 12개월 데이터 생성 (최신 월이 위로)
  for (let i = 0; i < 12; i++) {
    let year = currentYear;
    let month = currentMonth - i;

    if (month <= 0) {
      month += 12;
      year -= 1;
    }

    // 랜덤하지만 일관된 데이터 생성 (시드 기반)
    const seed = year * 100 + month;
    const streakDays = Math.floor((seed % 15) + 1);
    const successRate = parseFloat((40 + (seed % 50) + Math.random() * 10).toFixed(1));

    stats.push({
      year,
      month,
      streakDays,
      successRate: Math.min(successRate, 100),
    });
  }

  return stats;
};

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

interface CardItemProps {
  item: MonthlyStatData;
  index: number;
  scrollY: SharedValue<number>;
  totalCount: number;
  onPress: (item: MonthlyStatData) => void;
}

const CardItem: React.FC<CardItemProps> = ({ item, index, scrollY, totalCount, onPress }) => {
  const color = CARD_COLORS[item.month - 1];
  const inputRange = [
    (index - 1) * CARD_OVERLAP,
    index * CARD_OVERLAP,
    (index + 1) * CARD_OVERLAP,
  ];

  const animatedStyle = useAnimatedStyle(() => {
    const scale = interpolate(
      scrollY.value,
      inputRange,
      [0.95, 1, 0.98],
      'clamp'
    );

    const opacity = interpolate(
      scrollY.value,
      inputRange,
      [0.7, 1, 0.9],
      'clamp'
    );

    // 강조되는 카드가 가장 위에 표시되도록 zIndex 계산
    const zIndex = interpolate(
      scrollY.value,
      inputRange,
      [totalCount - index, totalCount + 100, totalCount - index - 1],
      'clamp'
    );

    return {
      transform: [{ scale: withSpring(scale, springConfig) }],
      opacity: withSpring(opacity, springConfig),
      zIndex: Math.round(zIndex),
    };
  });

  const handlePress = useCallback(() => {
    onPress(item);
  }, [item, onPress]);

  const accessibilityLabel = `${item.year}년 ${item.month}월 통계 보기. 연속 ${item.streakDays}일 성공, 성공률 ${item.successRate}%`;

  return (
    <AnimatedPressable
      onPress={handlePress}
      style={[styles.cardWrapper, { marginTop: index === 0 ? 0 : -CARD_OVERLAP }, animatedStyle]}
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="button"
      accessibilityHint="탭하여 상세 통계 보기"
    >
      <View style={[styles.cardOuter, { backgroundColor: color.bg }]}>
        <View style={styles.cardContent}>
          {/* 상단: 월 + 성공률 */}
          <View style={styles.cardHeader}>
            <View style={styles.monthSection}>
              <Text style={[styles.yearLabel, { color: color.accent }]}>
                {item.year}년
              </Text>
              <Text style={[styles.monthLabel, { color: color.text }]}>
                {MONTH_NAMES_KR[item.month - 1]}
              </Text>
            </View>
            <View style={styles.rateSection}>
              <Text style={[styles.rateLabel, { color: color.accent }]}>
                성공률
              </Text>
              <Text style={[styles.rateValue, { color: color.text }]}>
                {item.successRate}%
              </Text>
            </View>
          </View>

          {/* 하단: 연속 성공 일수 */}
          <View style={styles.cardFooter}>
            <View style={[styles.streakBadge, { backgroundColor: color.accent + '20' }]}>
              <Feather name="zap" size={14} color={color.accent} />
              <Text style={[styles.streakText, { color: color.text }]}>
                연속 {item.streakDays}일
              </Text>
            </View>
            <Feather name="chevron-right" size={20} color={color.accent} />
          </View>
        </View>

        {/* 카드 테두리 */}
        <View style={styles.cardBorderOverlay} />
      </View>
    </AnimatedPressable>
  );
};

const MonthlyAlbumPage: React.FC<Props> = ({
  onOpenSettings,
}) => {
  const insets = useSafeAreaInsets();
  const scrollY = useSharedValue(0);

  // Mock 데이터 사용 (실제 데이터 소스 연결 시 교체)
  const monthlyStats = generateMockStats();

  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollY.value = event.contentOffset.y;
    },
  });

  const handleCardPress = useCallback((item: MonthlyStatData) => {
    // TODO: 월별 상세 페이지로 이동
    // 현재 프로젝트에 월별 상세 페이지가 없으므로 fallback 처리
    // 향후 router.push(`/monthly/${item.year}/${item.month}`) 등으로 연결
    console.warn(
      `[MonthlyAlbumPage] 월별 상세 페이지 미구현: ${item.year}년 ${item.month}월 선택됨`
    );
  }, []);

  const renderCard = useCallback(
    ({ item, index }: { item: MonthlyStatData; index: number }) => (
      <CardItem
        item={item}
        index={index}
        scrollY={scrollY}
        totalCount={monthlyStats.length}
        onPress={handleCardPress}
      />
    ),
    [scrollY, handleCardPress, monthlyStats.length]
  );

  const keyExtractor = useCallback(
    (item: MonthlyStatData) => `${item.year}-${item.month}`,
    []
  );

  // 리스트 전체 높이 계산
  const listContentHeight =
    monthlyStats.length > 0
      ? CARD_HEIGHT + (monthlyStats.length - 1) * (CARD_HEIGHT - CARD_OVERLAP)
      : 0;

  return (
    <GestureHandlerRootView style={styles.container}>
      {/* 배경 */}
      <View style={[styles.background, { backgroundColor: '#FAF8F5' }]} />

      <Box className="flex-1">
        {/* 헤더 */}
        <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
          <View>
            <Text style={styles.headerSubtitle}>나의 기록</Text>
            <Text style={styles.headerTitle}>월별 통계</Text>
          </View>
          <Pressable
            onPress={onOpenSettings}
            hitSlop={16}
            accessibilityLabel="설정 열기"
            accessibilityRole="button"
          >
            <Feather name="settings" size={22} color="#4A4A4A" />
          </Pressable>
        </View>

        {/* 카드 스택 */}
        <Animated.FlatList
          data={monthlyStats}
          renderItem={renderCard}
          keyExtractor={keyExtractor}
          onScroll={scrollHandler}
          scrollEventThrottle={16}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[
            styles.listContent,
            {
              paddingTop: 20,
              paddingBottom: insets.bottom + SCREEN_HEIGHT * 0.3,
              minHeight: listContentHeight + insets.bottom + SCREEN_HEIGHT * 0.3,
            },
          ]}
          decelerationRate="fast"
          snapToInterval={CARD_HEIGHT - CARD_OVERLAP}
          snapToAlignment="start"
        />
      </Box>
    </GestureHandlerRootView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  background: {
    ...StyleSheet.absoluteFillObject,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  headerSubtitle: {
    fontSize: 13,
    fontWeight: '500',
    color: '#8A8A8A',
    marginBottom: 4,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#2C2C2C',
    fontFamily: 'WantedSans-Bold',
  },
  listContent: {
    paddingHorizontal: 20,
  },
  cardWrapper: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    zIndex: 1,
  },
  cardOuter: {
    flex: 1,
    borderRadius: 24,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 10,
  },
  cardBorderOverlay: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.6)',
  },
  cardContent: {
    flex: 1,
    padding: 20,
    justifyContent: 'space-between',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  monthSection: {
    flex: 1,
  },
  yearLabel: {
    fontSize: 12,
    fontWeight: '500',
    marginBottom: 2,
  },
  monthLabel: {
    fontSize: 26,
    fontWeight: '700',
    fontFamily: 'WantedSans-Bold',
  },
  rateSection: {
    alignItems: 'flex-end',
  },
  rateLabel: {
    fontSize: 11,
    fontWeight: '500',
    marginBottom: 2,
  },
  rateValue: {
    fontSize: 22,
    fontWeight: '700',
    fontFamily: 'WantedSans-Bold',
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  streakBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
  },
  streakText: {
    fontSize: 14,
    fontWeight: '600',
  },
});

export default MonthlyAlbumPage;
