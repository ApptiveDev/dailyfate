import React, { useEffect, useRef, useState } from 'react';
import {
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

import { WritingPrompt, WritingEntry } from '../types/writing';

interface Props {
  date: Date;
  onNext: () => void;
  onPrev: () => void;
  prompt: WritingPrompt | null;
  recentEntries?: WritingEntry[]; // 이 글감에 대한 최근 글들
  totalWritten?: number;
  onStartWriting: () => void;
  onOpenSettings: () => void;
  onOpenArchive: () => void;
  onSelectEntry?: (entry: WritingEntry) => void;
  onRefreshPrompt?: () => void;
}

const WEEKDAY_HANJA = ['日', '月', '火', '水', '木', '金', '土'];
const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);
const dayKey = (value: Date) =>
  value.getFullYear() * 10000 + (value.getMonth() + 1) * 100 + value.getDate();
const isBeforeDay = (left: Date, right: Date) => dayKey(left) < dayKey(right);
const MIN_DATE = new Date(2026, 0, 1);
const EDGE_TRIGGER_RATIO = 0.22;
const TAP_MOVE_TOLERANCE = 10;
const TAP_MAX_DURATION_MS = 280;

const WritingCalendarPage: React.FC<Props> = ({
  date,
  onNext,
  onPrev,
  prompt,
  recentEntries = [],
  totalWritten = 0,
  onStartWriting,
  onOpenSettings,
  onOpenArchive,
  onSelectEntry,
  onRefreshPrompt,
}) => {
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

  useEffect(() => {
    scrollRef.current?.scrollTo({ y: 0, animated: false });
    tearAnim.setValue(0);
    cutProgress.setValue(0);
    scissorX.setValue(0);
  }, [date]);

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

  const canGoPrev = () => isBeforeDay(MIN_DATE, date);
  const canGoNext = () => isBeforeDay(date, new Date());

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

  const month = date.getMonth() + 1;
  const day = date.getDate();
  const weekday = date.getDay();
  const accentColor = weekday === 0 ? '#dc2626' : weekday === 6 ? '#2563eb' : '#111827';
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

    const { locationX, timestamp } = event.nativeEvent;
    const dx = locationX - start.x;
    const dy = event.nativeEvent.locationY - start.y;
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

  const insets = useSafeAreaInsets();

  return (
    <View className="relative flex-1 bg-stone-200">
      <View className="absolute inset-0 bg-white" />

      {/* 헤더 */}
      <View
        className="z-10 bg-white px-4"
        style={{ paddingTop: insets.top + 8 }}
      >
        <View className="flex-row items-center justify-between mb-2">
          <Pressable
            onPress={onOpenArchive}
            className="flex-row items-center"
            hitSlop={12}
          >
            <Feather name="book-open" size={20} color="#6b7280" />
            <Text className="ml-1.5 text-sm text-gray-500 font-wanted-semibold">
              내 글
            </Text>
          </Pressable>

          <Pressable onPress={onOpenSettings} hitSlop={12}>
            <Feather name="settings" size={22} color="#111827" />
          </Pressable>
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

      {/* 일력 본체 */}
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
          {/* 첫 번째 페이지: 일력 + 글감 */}
          <View style={{ height: pageHeight }} className="relative bg-white px-8 pb-28 pt-6">
            {/* 날짜 헤더 */}
            <View className="flex-row items-start justify-between">
              <View>
                <View className="flex-row items-end">
                  <Text
                    className="font-noto-bold text-4xl leading-10"
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
                  className="text-3xl font-wanted-semibold"
                  style={{ color: accentColor }}
                >
                  {WEEKDAY_HANJA[weekday]}
                </Text>
              </View>
            </View>

            {/* 날짜 숫자 + 글감 */}
            <View className="flex-1 items-center" style={{ marginTop: '12%' }}>
              <Text
                className="font-noto-extrabold text-[140px] leading-[140px] tracking-[-0.04em]"
                style={{ color: accentColor }}
              >
                {day}
              </Text>

              {/* 오늘의 글감 */}
              <View className="mt-8 w-full max-w-xl px-4">
                {prompt ? (
                  <View className="relative items-center" style={{ minHeight: 6 * 32 }}>
                    {/* 노트 줄 배경 */}
                    <View className="absolute inset-0">
                      {Array.from({ length: 6 }).map((_, i) => (
                        <View
                          key={i}
                          className="absolute w-full border-t border-gray-100"
                          style={{ top: i * 32 }}
                        />
                      ))}
                    </View>

                    <Text
                      className="relative text-center text-xl font-noto-semibold text-gray-800"
                      style={{ lineHeight: 32 }}
                    >
                      {prompt.title}
                    </Text>

                    {prompt.description && (
                      <Text
                        className="relative mt-4 text-center text-base text-gray-500 font-noto"
                        style={{ lineHeight: 28 }}
                      >
                        {prompt.description}
                      </Text>
                    )}
                  </View>
                ) : (
                  <Text className="text-center text-sm text-gray-300 font-noto">
                    오늘의 글감을 불러오는 중...
                  </Text>
                )}
              </View>
            </View>

            {/* 스크롤 인디케이터 */}
            <Animated.View
              style={[{ opacity: indicatorOpacity }, bounceStyle]}
              className="absolute inset-x-0 bottom-20 items-center"
            >
              <Feather name="chevron-down" size={28} color="#d1d5db" />
              <Text className="font-wanted-semibold text-gray-500">
                글쓰기 하러가기
              </Text>
            </Animated.View>
          </View>

          {/* 두 번째 페이지: 글쓰기 + 커뮤니티 */}
          <View
            style={{ minHeight: pageHeight }}
            className="border-t border-dashed border-gray-200 bg-[#f8f8f8] p-6"
          >
            <View className="mx-auto w-full max-w-xl">
              {/* 글쓰기 버튼 */}
              {prompt && (
                <Pressable
                  onPress={onStartWriting}
                  className="flex-row items-center justify-center bg-white py-4 rounded-2xl mb-4"
                  style={{
                    shadowColor: '#000',
                    shadowOpacity: 0.06,
                    shadowRadius: 12,
                    shadowOffset: { width: 0, height: 4 },
                    elevation: 3,
                  }}
                >
                  <Feather name="edit-3" size={18} color="#374151" />
                  <Text className="ml-2 text-base text-gray-700 font-wanted-semibold">
                    &apos;{prompt.title.slice(0, 8)}{prompt.title.length > 8 ? '...' : ''}&apos;으로 글쓰기
                  </Text>
                </Pressable>
              )}

              {/* 다른 글감 보기 */}
              {onRefreshPrompt && (
                <Pressable
                  onPress={onRefreshPrompt}
                  className="flex-row items-center justify-center mb-6"
                >
                  <Feather name="refresh-cw" size={14} color="#9ca3af" />
                  <Text className="ml-1.5 text-sm text-gray-400 font-wanted-regular">
                    다른 글감 보기
                  </Text>
                </Pressable>
              )}

              {/* 통계 */}
              <View className="flex-row items-center justify-between mb-4">
                <Text className="text-xs text-gray-500 font-wanted-semibold">
                  {totalWritten.toLocaleString()}편의 글
                </Text>
                <Text className="text-xs text-gray-400 font-wanted-regular">
                  최신순
                </Text>
              </View>

              {/* 최근 글 목록 */}
              {recentEntries.length > 0 ? (
                <View className="gap-3">
                  {recentEntries.map((entry) => (
                    <EntryCard
                      key={entry.id}
                      entry={entry}
                      onPress={() => onSelectEntry?.(entry)}
                    />
                  ))}
                </View>
              ) : (
                <View className="items-center py-12 bg-white rounded-2xl">
                  <Feather name="edit-3" size={32} color="#d1d5db" />
                  <Text className="mt-3 text-sm text-gray-400 font-wanted-regular">
                    아직 작성된 글이 없어요
                  </Text>
                  <Text className="mt-1 text-xs text-gray-300 font-wanted-regular">
                    첫 번째 글을 작성해보세요
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

// 글 카드 컴포넌트
interface EntryCardProps {
  entry: WritingEntry;
  onPress: () => void;
}

const EntryCard: React.FC<EntryCardProps> = ({ entry, onPress }) => {
  const formatDate = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hour = String(date.getHours()).padStart(2, '0');
    return `${year}년 ${month}월 ${day}일 ${hour}시`;
  };

  return (
    <Pressable
      onPress={onPress}
      className="bg-white rounded-2xl p-5 border border-gray-100"
    >
      {/* 글감 제목 */}
      <Text className="text-base font-noto-semibold text-gray-800 text-center mb-3">
        {entry.promptTitle.length > 20
          ? entry.promptTitle.slice(0, 20) + '...'
          : entry.promptTitle}
      </Text>

      {/* 작성한 글 */}
      <Text
        className="text-base text-gray-600 font-noto leading-7 text-center"
        numberOfLines={4}
      >
        {entry.text}
      </Text>

      {/* 작성자 + 날짜 */}
      <View className="items-center mt-4 pt-4 border-t border-gray-50">
        <Text className="text-xs text-gray-400 font-wanted-regular">
          {entry.userId === 'user-1' ? '나의 글' : '익명'}
        </Text>
        <Text className="text-xs text-gray-300 font-wanted-regular mt-0.5">
          {formatDate(entry.writtenAt)}
        </Text>
      </View>
    </Pressable>
  );
};

export default WritingCalendarPage;
