import React, { useCallback, useState, useMemo } from 'react';
import {
  Pressable,
  Dimensions,
  StyleSheet,
  View,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  useAnimatedStyle,
  withSpring,
  useSharedValue,
  useAnimatedScrollHandler,
  type SharedValue,
} from 'react-native-reanimated';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import type { MonthlyStats, PhotoEntry } from '@/types/fortune';
import { Box, Text, VStack, Heading } from '../ui';

interface Props {
  year: number;
  month: number;
  photos: PhotoEntry[];
  stats: MonthlyStats | null;
  onPrevMonth: () => void;
  onNextMonth: () => void;
  onSelectPhoto: (photo: PhotoEntry) => void;
  onSelectEmptyDay: (date: Date) => void;
  onSelectMonth?: (year: number, month: number) => void;
}

interface MonthlyStatData {
  year: number;
  month: number;
  streakDays: number;
  successRate: number | string;
}

const MONTH_COLORS: Record<number, { bg: string; text: string; accent: string }> = {
  1: { bg: '#E5EBF0', text: '#2C4A5A', accent: '#5A8A9E' },
  2: { bg: '#E8F0E8', text: '#3A4A33', accent: '#6B8B5E' },
  3: { bg: '#D8EAD4', text: '#3A4A33', accent: '#6B8B5E' },
  4: { bg: '#D5E5D8', text: '#3A4A33', accent: '#6B8B5E' },
  5: { bg: '#D8E8D0', text: '#3A4A33', accent: '#6B8B5E' },
  6: { bg: '#F0E8D0', text: '#4A4833', accent: '#8B8655' },
  7: { bg: '#EDE4D4', text: '#4A3728', accent: '#8B7355' },
  8: { bg: '#E8E4D8', text: '#4A4039', accent: '#7D7067' },
  9: { bg: '#E8E0D8', text: '#4A4039', accent: '#7D7067' },
  10: { bg: '#E5DCD4', text: '#4A4039', accent: '#7D7067' },
  11: { bg: '#E2DDD8', text: '#4A4039', accent: '#7D7067' },
  12: { bg: '#DCE4EB', text: '#2C4A5A', accent: '#5A8A9E' },
};

const MONTH_NAMES_KR = [
  '1월', '2월', '3월', '4월', '5월', '6월',
  '7월', '8월', '9월', '10월', '11월', '12월',
];

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const CARD_WIDTH = SCREEN_WIDTH; // 화면 가로 꽉 차도록 수정
const CARD_HEIGHT = 200;
const STACK_SPACING = 60;

const springConfig = {
  damping: 22,
  stiffness: 160,
  mass: 0.8,
};

function generateMockStats(): MonthlyStatData[] {
  const currentDate = new Date();
  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth() + 1;
  const stats: MonthlyStatData[] = [];

  for (let i = 0; i < 12; i++) {
    let year = currentYear;
    let month = currentMonth - i;
    if (month <= 0) {
      month += 12;
      year -= 1;
    }
    const seed = year * 100 + month;
    const streakDays = (seed % 20) + 3;
    const rawRate = 50 + (seed % 40) + (seed % 10) * 0.5;
    const successRate = Math.min(rawRate, 99.9);
    stats.push({
      year,
      month,
      streakDays,
      successRate,
    });
  }
  return stats;
}

interface WalletCardProps {
  item: MonthlyStatData;
  index: number;
  totalCount: number;
  expandedIndex: number | null;
  scrollY: SharedValue<number>;
  onPress: () => void;
  onDetail: () => void;
}

const WalletCard: React.FC<WalletCardProps & { insets: any }> = ({
  item,
  index,
  totalCount,
  expandedIndex,
  scrollY,
  onPress,
  onDetail,
  insets,
}) => {
  const color = MONTH_COLORS[item.month];
  const isExpanded = expandedIndex === index;
  const hasAnyExpanded = expandedIndex !== null;

  const animatedStyle = useAnimatedStyle(() => {
    const baseTranslateY = index * STACK_SPACING;
    let translateY = baseTranslateY;
    let scale = 1;
    let zIndex = index;
    let opacity = 1;

    if (hasAnyExpanded) {
      if (isExpanded) {
        // 선택된 카드는 화면 중앙으로 이동
        const headerOffset = 80;
        const bottomTabOffset = 80; 
        const availableHeight = SCREEN_HEIGHT - insets.top - headerOffset - insets.bottom - bottomTabOffset;
        
        const viewportCenter = scrollY.value + (availableHeight / 2) - (CARD_HEIGHT / 2) + 10;
        
        translateY = withSpring(viewportCenter, springConfig);
        scale = withSpring(1.05, springConfig);
        zIndex = 1000;
        opacity = 1;
      } else {
        // 선택되지 않은 카드들은 약간만 투명하게 하여 배경이 어두워 보이지 않도록 함
        opacity = withSpring(0.4, { damping: 20, stiffness: 100 });
        
        if (index < expandedIndex) {
          translateY = withSpring(baseTranslateY - 60, springConfig);
        } else {
          translateY = withSpring(baseTranslateY + 60, springConfig);
        }
      }
    } else {
      translateY = withSpring(baseTranslateY, springConfig);
      scale = withSpring(1, springConfig);
      opacity = withSpring(1, springConfig);
    }

    return {
      transform: [{ translateY }, { scale }],
      zIndex,
      opacity,
    };
  });

  return (
    <Animated.View style={[styles.cardWrapper, animatedStyle]}>
      <View style={[styles.card, { backgroundColor: color.bg }]}>
        {/* 카드 탭(확장/축소) 영역만 Pressable — 상세 보기 버튼과 터치 영역 분리 */}
        <Pressable
          onPress={onPress}
          style={styles.cardPressable}
          accessibilityLabel={`${item.year}년 ${item.month}월 통계 카드`}
          accessibilityRole="button"
        >
          <View style={styles.cardHeader}>
            <View style={styles.headerLeft}>
              <Text style={[styles.cardTitle, { color: color.text }]}>
                {item.year} {MONTH_NAMES_KR[item.month - 1]}
              </Text>
            </View>
          </View>

          <View style={styles.cardBody}>
            <View style={styles.mainInfo}>
              <Text style={[styles.rateValue, { color: color.text }]}>
                {String(item.successRate)}%
              </Text>
              <Text style={[styles.rateLabel, { color: color.accent }]}>
                성공률
              </Text>
            </View>

            <View style={styles.footerInfo}>
              <View style={styles.streakInfo}>
                <Text style={[styles.streakValue, { color: color.text }]}>
                  {item.streakDays}일
                </Text>
                <Text style={[styles.streakLabel, { color: color.accent }]}>
                  연속 달성
                </Text>
              </View>
            </View>
          </View>
        </Pressable>

        {/* 확장 시 상세 보기 버튼 — 별도 Pressable이라 카드 탭과 겹치지 않음 */}
        {isExpanded && (
          <Pressable
            style={[styles.detailButton, { borderColor: color.accent }]}
            onPress={onDetail}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            accessibilityLabel="월별 상세 보기"
            accessibilityRole="button"
          >
            <Text style={[styles.detailButtonText, { color: color.text }]}>상세 보기</Text>
            <Feather name="chevron-right" size={16} color={color.text} />
          </Pressable>
        )}

        <View style={[styles.cardBorder, { borderColor: 'rgba(0,0,0,0.05)' }]} />
      </View>
    </Animated.View>
  );
};

const MonthlyAlbumPage: React.FC<Props> = ({ onSelectMonth }) => {
  const insets = useSafeAreaInsets();
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);
  const scrollY = useSharedValue(0);

  const monthlyStats = useMemo(() => generateMockStats(), []);

  const contentHeight = useMemo(() => {
    return (monthlyStats.length - 1) * STACK_SPACING + CARD_HEIGHT;
  }, [monthlyStats.length]);

  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollY.value = event.contentOffset.y;
    },
  });

  const handleCardPress = useCallback((index: number) => {
    setExpandedIndex((prev) => (prev === index ? null : index));
  }, []);

  const handleDetail = useCallback(
    (item: MonthlyStatData) => {
      setExpandedIndex(null); // 확장된 카드 먼저 닫기
      if (onSelectMonth) {
        onSelectMonth(item.year, item.month); // 해당 월의 캘린더 뷰로 이동
      }
    },
    [onSelectMonth],
  );

  return (
    <GestureHandlerRootView style={styles.container}>
      <Box className="flex-1" style={styles.screenBg}>
        <Animated.View 
          style={[
            styles.screenHeader, 
            { paddingTop: insets.top + 16 },
            expandedIndex !== null && { opacity: 0 } 
          ]}
        >
          <VStack>
            <Text style={styles.screenSubtitle}>나의 기록</Text>
            <Heading style={styles.screenTitle}>월별 통계</Heading>
          </VStack>
          <Pressable style={styles.settingsButton}>
            <Feather name="settings" size={24} color="#000000" />
          </Pressable>
        </Animated.View>

        {/* Backdrop - 투명하게 유지하여 화면이 어두워지지 않도록 함 */}
        {expandedIndex !== null && (
          <View 
            style={[StyleSheet.absoluteFill, { zIndex: 500 }]}
          >
            <Pressable 
              style={StyleSheet.absoluteFill} 
              onPress={() => setExpandedIndex(null)}
            />
          </View>
        )}

        {/* Scrollable Card Stack Container */}
        <View style={styles.scrollContainer}>
          <Animated.ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            onScroll={scrollHandler}
            scrollEventThrottle={16}
            showsVerticalScrollIndicator={false}
            scrollEnabled={expandedIndex === null}
          >
            <View style={styles.stackContainer}>
              {monthlyStats.map((item, index) => (
                <WalletCard
                  key={`${item.year}-${item.month}`}
                  item={item}
                  index={index}
                  totalCount={monthlyStats.length}
                  expandedIndex={expandedIndex}
                  scrollY={scrollY}
                  onPress={() => handleCardPress(index)}
                  onDetail={() => handleDetail(item)}
                  insets={insets}
                />
              ))}
            </View>
          </Animated.ScrollView>
        </View>
      </Box>
    </GestureHandlerRootView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  screenBg: {
    backgroundColor: '#FAF8F5',
  },
  screenHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    paddingHorizontal: 24,
    marginBottom: 12,
    zIndex: 2000,
  },
  screenSubtitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#a3a3a3',
    fontFamily: 'WantedSans-SemiBold',
    marginBottom: 4,
  },
  screenTitle: {
    fontSize: 32,
    fontWeight: '700',
    color: '#000000',
    fontFamily: 'WantedSans-Bold',
  },
  settingsButton: {
    padding: 8,
    marginBottom: -4,
  },
  scrollContainer: {
    flex: 1,
    marginBottom: 100, 
    overflow: 'hidden',
    backgroundColor: '#FAF8F5', // 배경색 명시
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 12, // 양옆에 최소한의 여백(12px)을 두어 카드가 화면 끝에 너무 붙지 않게 함
    paddingBottom: 40, 
  },
  stackContainer: {
    height: 12 * 60 + 200, 
    paddingTop: 10,
  },
  cardWrapper: {
    position: 'absolute',
    left: 12,
    right: 12,
    width: SCREEN_WIDTH - 24, // 양옆 12px씩 제외
  },
  cardPressable: {
    flex: 1, // 내부 콘텐츠가 공간을 차지할 수 있도록 flex 부여
    width: '100%',
  },
  card: {
    width: '100%',
    height: CARD_HEIGHT,
    borderRadius: 24, // 가이드라인 lg(24px) 반영
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 8,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24, // xl(32px) 보다는 카드 내부이므로 lg(24px) 정도가 적당
    paddingVertical: 18,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cardTitle: {
    fontSize: 18, // Subtitle (18-22px) 반영
    fontWeight: '600',
    fontFamily: 'WantedSans-SemiBold',
    letterSpacing: -0.3,
  },
  cardBody: {
    flex: 1,
    paddingHorizontal: 24,
    paddingBottom: 20,
    justifyContent: 'center',
  },
  mainInfo: {
    marginTop: 20, // 연/월 영역과의 여백 추가
    marginBottom: 25, // 연속 성공 영역과의 여백 추가
  },
  rateValue: {
    fontSize: 32, // 기존 42px에서 32px로 축소 (Title 스타일 적용)
    fontWeight: '700',
    fontFamily: 'WantedSans-Bold',
    letterSpacing: -0.5,
  },
  rateLabel: {
    fontSize: 13, // Caption (11-13px) 반영
    fontWeight: '700',
    fontFamily: 'WantedSans-SemiBold',
    marginTop: 2,
  },
  footerInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  streakInfo: {
    flex: 1,
  },
  streakValue: {
    fontSize: 22, // Subtitle (18-22px) 반영
    fontWeight: '700',
    fontFamily: 'WantedSans-Bold',
  },
  streakLabel: {
    fontSize: 13, // Caption (11-13px) 반영
    fontWeight: '700',
    fontFamily: 'WantedSans-SemiBold',
    marginTop: 2,
  },
  detailButton: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-end',
    marginHorizontal: 24,
    marginBottom: 20,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1.5,
  },
  detailButtonText: {
    fontSize: 13, // Caption (11-13px) 반영
    fontWeight: '700',
    fontFamily: 'WantedSans-SemiBold',
    marginRight: 4,
  },
  cardBorder: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 20,
    borderWidth: 0.5,
    pointerEvents: 'none',
  },
  backdrop: {
    backgroundColor: 'transparent', // 배경 어둡기 완전 제거
    zIndex: 10, 
  },
});

export default MonthlyAlbumPage;
