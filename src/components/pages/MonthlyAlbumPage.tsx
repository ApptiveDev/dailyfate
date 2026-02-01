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
import { Box, Text, VStack, Heading, HStack } from '../ui';

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

const MONTH_COLORS_GRADIENT = Array.from({ length: 12 }, (_, i) => {
  // 1월(흰색) -> 12월(검정) 그라데이션 계산
  // 255 (white) to 28 (dark gray)
  const value = Math.floor(255 - (i * (227 / 11)));
  const hex = value.toString(16).padStart(2, '0');
  const color = `#${hex}${hex}${hex}`;
  
  // 배경색에 따른 텍스트 색상 결정 (밝으면 검정, 어두우면 흰색)
  const textColor = value > 160 ? '#000000' : '#FFFFFF';
  const subTextColor = value > 160 ? 'rgba(0,0,0,0.4)' : 'rgba(255,255,255,0.5)';
  
  return { bg: color, text: textColor, sub: subTextColor };
});

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
  const isExpanded = expandedIndex === index;
  const hasAnyExpanded = expandedIndex !== null;
  const colors = MONTH_COLORS_GRADIENT[item.month - 1];

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
      <View style={[styles.card, { backgroundColor: colors.bg }]}>
        {/* 카드 탭(확장/축소) 영역만 Pressable — 상세 보기 버튼과 터치 영역 분리 */}
        <Pressable
          onPress={onPress}
          style={styles.cardPressable}
          accessibilityLabel={`${item.year}년 ${item.month}월 통계 카드`}
          accessibilityRole="button"
        >
          {/* Card Header */}
          <View style={styles.cardHeader}>
            <Text style={[styles.cardTitle, { color: colors.text }]}>
              {item.year} {MONTH_NAMES_KR[item.month - 1]}
            </Text>
            <Feather 
              name={isExpanded ? "chevron-up" : "chevron-down"} 
              size={20} 
              color={colors.sub} 
            />
          </View>

          {/* Card Body */}
          <View style={styles.cardBody}>
            <View>
              <Text style={[styles.rateLabel, { color: colors.sub }]}>
                성공률
              </Text>
              <Text style={[styles.rateValue, { color: colors.text }]}>
                {String(item.successRate)}%
              </Text>
            </View>

            <View style={styles.footerInfo}>
              <View>
                <Text style={[styles.streakLabel, { color: colors.sub }]}>
                  연속 달성
                </Text>
                <HStack className="items-center" space="xs">
                  <Text style={[styles.streakValue, { color: colors.text }]}>
                    {item.streakDays}일
                  </Text>
                </HStack>
              </View>
            </View>
          </View>
        </Pressable>

        {/* 확장 시 상세 보기 버튼 — 별도 Pressable이라 카드 탭과 겹치지 않음 */}
        {isExpanded && (
          <Pressable
            style={[styles.detailButton, { backgroundColor: colors.text === '#000000' ? '#000000' : '#FFFFFF' }]}
            onPress={onDetail}
            hitSlop={12}
          >
            <Text style={[styles.detailButtonText, { color: colors.text === '#000000' ? '#FFFFFF' : '#000000' }]}>
              앨범 보기
            </Text>
            <Feather 
              name="arrow-right" 
              size={14} 
              color={colors.text === '#000000' ? '#FFFFFF' : '#000000'} 
            />
          </Pressable>
        )}

        <View style={[styles.cardBorder, { borderColor: colors.text === '#000000' ? 'rgba(0,0,0,0.05)' : 'rgba(255,255,255,0.1)' }]} />
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
    backgroundColor: '#FFFFFF',
  },
  screenHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    paddingHorizontal: 24,
    marginBottom: 32, // 헤더와 카드 사이 여백
    zIndex: 2000,
    backgroundColor: '#FFFFFF',
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
    backgroundColor: '#FFFFFF',
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
    backgroundColor: 'transparent',
    zIndex: 10, 
  },
});

export default MonthlyAlbumPage;
