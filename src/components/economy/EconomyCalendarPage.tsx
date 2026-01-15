import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Dimensions,
  Easing,
  GestureResponderEvent,
  PanResponder,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { EconomyTerm, Quiz, NewsArticle, CATEGORY_INFO, DIFFICULTY_INFO } from '../../types/economy';

interface Props {
  date: Date;
  onNext: () => void;
  onPrev: () => void;
  term: EconomyTerm | null;
  quiz: Quiz | null;
  articles: NewsArticle[];
  loading?: boolean;
  isLearned?: boolean;
  onStartLearning: () => void;
  onOpenSettings: () => void;
  onOpenArchive: () => void;
  onOpenStreak: () => void;
  onBookmarkTerm?: () => void;
  isBookmarked?: boolean;
}

const WEEKDAY_HANJA = ['日', '月', '火', '水', '木', '金', '土'];
const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);
const EDGE_TRIGGER_RATIO = 0.22;
const TAP_MOVE_TOLERANCE = 10;
const TAP_MAX_DURATION_MS = 280;

const EconomyCalendarPage: React.FC<Props> = ({
  date,
  onNext,
  onPrev,
  term,
  quiz,
  articles,
  loading = false,
  isLearned = false,
  onStartLearning,
  onOpenSettings,
  onOpenArchive,
  onOpenStreak,
  onBookmarkTerm,
  isBookmarked = false,
}) => {
  const insets = useSafeAreaInsets();
  const scrollRef = useRef<ScrollView | null>(null);
  const tearAnim = useRef(new Animated.Value(0)).current;
  const bounceAnim = useRef(new Animated.Value(0)).current;
  const scrollY = useRef(new Animated.Value(0)).current;
  const cutProgress = useRef(new Animated.Value(0)).current;
  const scissorX = useRef(new Animated.Value(0)).current;
  const scissorStartX = useRef(0);
  const [isTearing, setIsTearing] = useState(false);
  const [trackWidth, setTrackWidth] = useState(0);
  const [pageHeight, setPageHeight] = useState(Dimensions.get('window').height);
  const [pageWidth, setPageWidth] = useState(Dimensions.get('window').width);
  const tapStart = useRef<{ x: number; y: number; time: number } | null>(null);

  const month = date.getMonth() + 1;
  const day = date.getDate();
  const weekday = date.getDay();
  const accentColor = weekday === 0 ? '#dc2626' : weekday === 6 ? '#2563eb' : '#111827';

  const categoryInfo = term ? CATEGORY_INFO[term.category] : null;
  const difficultyInfo = term ? DIFFICULTY_INFO[term.difficulty] : null;

  // Reset scroll when date changes
  useEffect(() => {
    scrollRef.current?.scrollTo({ y: 0, animated: false });
    tearAnim.setValue(0);
    cutProgress.setValue(0);
    scissorX.setValue(0);
  }, [date]);

  // Bounce animation
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(bounceAnim, {
          toValue: 1,
          duration: 700,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(bounceAnim, {
          toValue: 0,
          duration: 700,
          easing: Easing.in(Easing.quad),
          useNativeDriver: true,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [bounceAnim]);

  const canGoNext = () => true;
  const canGoPrev = () => true;

  const handleTear = () => {
    if (isTearing || !canGoNext()) return;
    setIsTearing(true);

    Animated.sequence([
      Animated.parallel([
        Animated.timing(cutProgress, {
          toValue: 1,
          duration: 180,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: false,
        }),
        Animated.timing(tearAnim, {
          toValue: 0.35,
          duration: 180,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: false,
        }),
      ]),
      Animated.timing(tearAnim, {
        toValue: 1,
        duration: 360,
        easing: Easing.in(Easing.quad),
        useNativeDriver: false,
      }),
    ]).start(() => {
      onNext();
      tearAnim.setValue(0);
      cutProgress.setValue(0);
      scissorX.setValue(0);
      scissorStartX.current = 0;
      setTimeout(() => setIsTearing(false), 100);
    });
  };

  const maxDrag = Math.max(trackWidth - 32, 0);

  const dragPullDown = scissorX.interpolate({
    inputRange: [0, Math.max(maxDrag, 1)],
    outputRange: [0, 6],
    extrapolate: 'clamp',
  });

  const tearLift = tearAnim.interpolate({
    inputRange: [0, 0.35, 1],
    outputRange: [0, -12, pageHeight * 0.8],
  });

  const pageOpacity = tearAnim.interpolate({
    inputRange: [0, 0.65, 1],
    outputRange: [1, 0.97, 0],
    extrapolate: 'clamp',
  });

  const tearTransform = {
    transform: [
      { translateY: Animated.add(dragPullDown, tearLift) },
      { rotate: '0deg' },
      {
        scale: tearAnim.interpolate({
          inputRange: [0, 0.35, 1],
          outputRange: [1, 0.997, 1],
        }),
      },
    ],
  };

  const bounceStyle = {
    transform: [
      {
        translateY: bounceAnim.interpolate({
          inputRange: [0, 1],
          outputRange: [0, 15],
        }),
      },
    ],
  };

  const indicatorOpacity = scrollY.interpolate({
    inputRange: [0, pageHeight * 0.2, pageHeight * 0.45],
    outputRange: [1, 0.8, 0],
    extrapolate: 'clamp',
  });

  const handlePrevTap = () => {
    if (isTearing || !canGoPrev()) return;
    onPrev();
  };

  const handleNextTap = () => {
    if (isTearing || !canGoNext()) return;
    onNext();
  };

  const handleTouchStart = (event: GestureResponderEvent) => {
    tapStart.current = {
      x: event.nativeEvent.locationX,
      y: event.nativeEvent.locationY,
      time: event.nativeEvent.timestamp,
    };
  };

  const handleTouchEnd = (event: GestureResponderEvent) => {
    const start = tapStart.current;
    tapStart.current = null;
    if (!start) return;

    const { locationX, locationY, timestamp } = event.nativeEvent;
    const dx = locationX - start.x;
    const dy = locationY - start.y;
    const distance = Math.hypot(dx, dy);
    const duration = timestamp - start.time;

    if (distance > TAP_MOVE_TOLERANCE || duration > TAP_MAX_DURATION_MS) return;

    const width = pageWidth || Dimensions.get('window').width;
    const edgeWidth = width * EDGE_TRIGGER_RATIO;

    if (locationX <= edgeWidth) {
      handlePrevTap();
    } else if (locationX >= width - edgeWidth) {
      handleNextTap();
    }
  };

  const panResponder = PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: () => true,
    onPanResponderGrant: () => {
      scissorX.stopAnimation((value) => {
        scissorStartX.current = value;
      });
    },
    onPanResponderMove: (_, { dx }) => {
      const next = clamp(scissorStartX.current + dx, 0, maxDrag);
      scissorX.setValue(next);
      cutProgress.setValue(maxDrag ? next / maxDrag : 0);
    },
    onPanResponderRelease: () => {
      scissorX.stopAnimation((value) => {
        const progress = maxDrag ? value / maxDrag : 0;
        const canAdvance = !isTearing && canGoNext();
        if (canAdvance && progress > 0.9 && maxDrag > 12) {
          Animated.parallel([
            Animated.timing(scissorX, {
              toValue: maxDrag,
              duration: 140,
              easing: Easing.out(Easing.cubic),
              useNativeDriver: false,
            }),
            Animated.timing(cutProgress, {
              toValue: 1,
              duration: 140,
              easing: Easing.out(Easing.cubic),
              useNativeDriver: false,
            }),
          ]).start(() => handleTear());
        } else {
          Animated.spring(scissorX, {
            toValue: 0,
            friction: 6,
            tension: 45,
            useNativeDriver: false,
          }).start(() => {
            scissorStartX.current = 0;
          });
          Animated.spring(cutProgress, {
            toValue: 0,
            friction: 6,
            tension: 45,
            useNativeDriver: false,
          }).start();
        }
      });
    },
  });

  return (
    <View className="relative flex-1 bg-stone-200">
      <View className="absolute inset-0 bg-white" />

      {/* 헤더 */}
      <View
        className="z-10 bg-white px-4"
        style={{ paddingTop: insets.top + 8 }}
      >
        <View className="flex-row items-center justify-between mb-2">
          <Pressable onPress={onOpenStreak} hitSlop={12}>
            <Feather name="activity" size={22} color="#111827" />
          </Pressable>

          <Text className="text-base font-noto-semibold text-gray-800">
            경제 감각
          </Text>

          <View className="flex-row items-center gap-3">
            <Pressable onPress={onOpenArchive} hitSlop={12}>
              <Feather name="book-open" size={20} color="#111827" />
            </Pressable>
            <Pressable onPress={onOpenSettings} hitSlop={12}>
              <Feather name="settings" size={20} color="#111827" />
            </Pressable>
          </View>
        </View>

        {/* 가위 트랙 */}
        <View
          className="relative h-12 justify-center"
          onLayout={(e) => setTrackWidth(e.nativeEvent.layout.width)}
        >
          <View className="absolute left-0 right-0 top-1/2 -translate-y-1/2 border-t border-dashed border-gray-300" />

          <Animated.View
            {...panResponder.panHandlers}
            className="h-10 w-10 items-center justify-center rounded-full border border-gray-200 bg-white"
            style={{
              transform: [{ translateX: scissorX }],
              shadowColor: '#000',
              shadowOpacity: 0.12,
              shadowRadius: 8,
              shadowOffset: { width: 0, height: 4 },
              elevation: 4,
            }}
          >
            <Feather name="scissors" size={18} color="#0f172a" />
          </Animated.View>
        </View>
      </View>

      {/* 일력 본문 */}
      <Animated.View
        className="flex-1 bg-white"
        style={[
          {
            shadowColor: '#000',
            shadowOpacity: 0.14,
            shadowRadius: 20,
            shadowOffset: { width: 0, height: 16 },
            elevation: 10,
          },
          { opacity: pageOpacity },
          tearTransform,
        ]}
        onLayout={(e) => {
          const { height, width } = e.nativeEvent.layout;
          if (height && Math.abs(height - pageHeight) > 2) setPageHeight(height);
          if (width && Math.abs(width - pageWidth) > 2) setPageWidth(width);
        }}
      >
        <Animated.ScrollView
          ref={scrollRef}
          showsVerticalScrollIndicator={false}
          pagingEnabled
          scrollEventThrottle={16}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
          onTouchCancel={() => { tapStart.current = null; }}
          onScroll={Animated.event(
            [{ nativeEvent: { contentOffset: { y: scrollY } } }],
            { useNativeDriver: true }
          )}
          contentContainerStyle={{ paddingBottom: 40 }}
        >
          {/* 첫 번째 페이지: 날짜 + 오늘의 용어 */}
          <View style={{ height: pageHeight }} className="relative bg-white px-8 pb-28 pt-6">
            <View className="flex-row items-start justify-between">
              <View>
                <View className="flex-row items-end">
                  <Text
                    className="text-4xl font-noto-bold leading-10"
                    style={{ color: accentColor }}
                  >
                    {month}
                  </Text>
                  <Text className="mb-1.5 ml-1.5 text-base text-gray-500 font-wanted-semibold">
                    월
                  </Text>
                </View>
              </View>

              <View className="items-end">
                <Text
                  className="text-3xl font-noto-semibold"
                  style={{ color: accentColor }}
                >
                  {WEEKDAY_HANJA[weekday]}
                </Text>
                {categoryInfo && (
                  <View
                    className="mt-2 px-2 py-1 rounded"
                    style={{ backgroundColor: categoryInfo.bgColor }}
                  >
                    <Text
                      className="text-xs font-wanted-semibold"
                      style={{ color: categoryInfo.color }}
                    >
                      {categoryInfo.label}
                    </Text>
                  </View>
                )}
              </View>
            </View>

            {/* 날짜 */}
            <View className="flex-1 items-center" style={{ marginTop: '10%' }}>
              <Text
                className="text-[148px] font-noto-bold leading-[148px] tracking-[-0.04em]"
                style={{ color: accentColor }}
              >
                {day}
              </Text>

              {/* 오늘의 용어 (summary 영역) */}
              <View className="mt-8 w-full max-w-xl px-4">
                {loading ? (
                  <View className="items-center">
                    <ActivityIndicator size="small" color="#d1d5db" />
                    <Text className="mt-2 text-sm text-gray-300 font-noto">
                      용어를 불러오는 중...
                    </Text>
                  </View>
                ) : term ? (
                  <View className="relative items-center" style={{ minHeight: 5 * 36 }}>
                    {/* 노트 줄 배경 */}
                    <View className="absolute inset-0">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <View
                          key={i}
                          className="absolute w-full border-t border-gray-200"
                          style={{ top: i * 36 }}
                        />
                      ))}
                    </View>

                    <View className="relative items-center">
                      <Text className="text-sm text-gray-400 font-wanted-regular mb-2">
                        오늘의 용어
                      </Text>
                      <Text
                        className="text-2xl font-noto-bold text-gray-900 text-center"
                        style={{ lineHeight: 36 }}
                      >
                        {term.term}
                      </Text>
                      {term.termEn && (
                        <Text
                          className="text-base text-gray-400 font-wanted-regular text-center"
                          style={{ lineHeight: 36 }}
                        >
                          {term.termEn}
                        </Text>
                      )}
                      {isLearned && (
                        <View className="flex-row items-center mt-2">
                          <Feather name="check-circle" size={14} color="#22c55e" />
                          <Text className="ml-1 text-sm text-green-600 font-wanted-semibold">
                            학습 완료
                          </Text>
                        </View>
                      )}
                    </View>
                  </View>
                ) : (
                  <Text className="text-center text-sm text-gray-300 font-noto">
                    용어 정보가 없습니다.
                  </Text>
                )}
              </View>
            </View>

            {/* 스크롤 힌트 */}
            <Animated.View
              style={[{ opacity: indicatorOpacity }, bounceStyle]}
              className="absolute inset-x-0 bottom-20 items-center"
            >
              <Feather name="chevron-down" size={28} color="#d1d5db" />
              <Text className="font-wanted-semibold text-gray-500">
                자세히 보기
              </Text>
            </Animated.View>
          </View>

          {/* 두 번째 페이지: 용어 상세 + 학습 */}
          <View
            style={{ height: pageHeight }}
            className="border-t border-dashed border-gray-200 bg-gray-50 p-8"
          >
            <View className="mx-auto flex-1 w-full max-w-xl">
              {/* 섹션 헤더 */}
              <View className="mb-3 flex-row items-center opacity-60">
                <Text className="text-[11px] font-bold tracking-[0.2em] text-gray-500 font-wanted-semibold">
                  오늘의 경제 용어
                </Text>
                <View className="ml-2 h-px flex-1 bg-gray-300" />
              </View>

              {term ? (
                <>
                  {/* 용어 + 북마크 */}
                  <View className="flex-row items-center justify-between mb-4">
                    <View className="flex-row items-center">
                      <Text className="text-xl font-noto-bold text-gray-900">
                        {term.term}
                      </Text>
                      {difficultyInfo && (
                        <View className="flex-row items-center ml-3">
                          <View
                            className="w-2 h-2 rounded-full mr-1"
                            style={{ backgroundColor: difficultyInfo.color }}
                          />
                          <Text className="text-xs text-gray-400 font-wanted-regular">
                            {difficultyInfo.label}
                          </Text>
                        </View>
                      )}
                    </View>
                    <Pressable onPress={onBookmarkTerm} hitSlop={12}>
                      <Feather
                        name="bookmark"
                        size={20}
                        color={isBookmarked ? '#f59e0b' : '#d1d5db'}
                      />
                    </Pressable>
                  </View>

                  {/* 정의 */}
                  <DetailItem
                    icon="book"
                    label="정의"
                    value={term.definition}
                    iconColor="#2563eb"
                    bgColor="#dbeafe"
                  />

                  {/* 예시 */}
                  <DetailItem
                    icon="zap"
                    label="예시"
                    value={term.example}
                    iconColor="#f59e0b"
                    bgColor="#fef3c7"
                  />

                  {/* 퀴즈 미리보기 */}
                  {quiz && (
                    <DetailItem
                      icon="help-circle"
                      label="오늘의 퀴즈"
                      value={quiz.question}
                      iconColor="#7c3aed"
                      bgColor="#ede9fe"
                    />
                  )}

                  {/* 관련 기사 */}
                  {articles.length > 0 && (
                    <View className="py-4 border-b border-gray-200">
                      <View className="mb-2 flex-row items-center">
                        <View className="mr-3 h-9 w-9 items-center justify-center rounded-full bg-gray-100">
                          <Feather name="file-text" size={18} color="#6b7280" />
                        </View>
                        <Text className="text-lg font-noto-semibold text-gray-900">
                          관련 기사 {articles.length}개
                        </Text>
                      </View>
                      {articles.slice(0, 2).map((article) => (
                        <View
                          key={article.id}
                          className="ml-12 py-2 border-b border-gray-100"
                        >
                          <Text
                            className="text-sm text-gray-600 font-wanted-regular"
                            numberOfLines={1}
                          >
                            {article.title}
                          </Text>
                          <Text className="text-xs text-gray-400 font-wanted-regular mt-0.5">
                            {article.source}
                          </Text>
                        </View>
                      ))}
                    </View>
                  )}

                  {/* 학습 시작 버튼 */}
                  <Pressable
                    onPress={onStartLearning}
                    className="mt-6 bg-gray-900 rounded-full py-4 items-center"
                  >
                    <Text className="text-base text-white font-wanted-semibold">
                      {isLearned ? '다시 학습하기' : '퀴즈 풀러 가기'}
                    </Text>
                  </Pressable>
                </>
              ) : (
                <View className="py-5">
                  <Text className="text-[15px] text-gray-400 font-noto">
                    용어 정보가 없습니다.
                  </Text>
                </View>
              )}
            </View>
          </View>
        </Animated.ScrollView>
      </Animated.View>
    </View>
  );
};

// 상세 아이템 컴포넌트
interface DetailItemProps {
  icon: React.ComponentProps<typeof Feather>['name'];
  label: string;
  value: string;
  iconColor: string;
  bgColor: string;
  isLast?: boolean;
}

const DetailItem: React.FC<DetailItemProps> = ({
  icon,
  label,
  value,
  iconColor,
  bgColor,
  isLast,
}) => (
  <View className={`py-4 ${isLast ? '' : 'border-b border-gray-200'}`}>
    <View className="mb-2 flex-row items-center">
      <View
        className="mr-3 h-9 w-9 items-center justify-center rounded-full"
        style={{ backgroundColor: bgColor }}
      >
        <Feather name={icon} size={18} color={iconColor} />
      </View>
      <Text className="text-lg font-noto-semibold text-gray-900">{label}</Text>
    </View>
    <Text className="text-[15px] leading-7 text-gray-600 font-wanted-regular ml-12">
      {value}
    </Text>
  </View>
);

export default EconomyCalendarPage;
