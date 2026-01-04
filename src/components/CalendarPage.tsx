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

import { FortuneData } from '../types/fortune';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface Props {
  date: Date;
  onNext: () => void;
  onPrev: () => void;
  fortune: FortuneData | null;
  loading: boolean;
  onOpenSettings: () => void; // ✅ 필수로
}

const WEEKDAY_HANJA = ['日', '月', '火', '水', '木', '金', '土'];
const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);
const dayKey = (value: Date) =>
  value.getFullYear() * 10000 + (value.getMonth() + 1) * 100 + value.getDate();
const isBeforeDay = (left: Date, right: Date) => dayKey(left) < dayKey(right);
const EDGE_TRIGGER_RATIO = 0.22;
const TAP_MOVE_TOLERANCE = 10;
const TAP_MAX_DURATION_MS = 280;

const CalendarPage: React.FC<Props> = ({
  date,
  onNext,
  onPrev,
  fortune,
  loading,
  onOpenSettings,
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

  // Reset scroll to top when the date changes
  useEffect(() => {
    scrollRef.current?.scrollTo({ y: 0, animated: false });
    tearAnim.setValue(0);
    cutProgress.setValue(0);
    scissorX.setValue(0);
  }, [date]);

  // Chevron bounce animation (indicator to scroll)
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
    return () => {
      loop.stop();
    };
  }, [bounceAnim]);

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
      {
        translateY: Animated.add(dragPullDown, tearLift),
      },
      {
        rotate: '0deg',
      },
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
    if (isTearing) return;
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
          ]).start(() => {
            handleTear();
          });
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
    <View className="relative flex-1 bg-stone-200 ">
      <View className="absolute inset-0 bg-white" />

      <View
        className="z-10 bg-white px-4"
        style={{ paddingTop: insets.top + 8 }} // ✅ 노치 / 다이나믹 아일랜드 대응
      >
        {/* 상단 커스텀 헤더 */}
        <View className="flex-row items-center justify-between mb-2">
          {/* 왼쪽 더미 공간 (에러 방지) */}
          <View style={{ width: 22 }} />

          <Pressable onPress={onOpenSettings} hitSlop={12} accessibilityLabel="설정 열기">
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
          const h = Math.round(height);
          const w = Math.round(width);
          if (h && Math.abs(h - pageHeight) > 2) {
            setPageHeight(h);
          }
          if (w && Math.abs(w - pageWidth) > 2) {
            setPageWidth(w);
          }
        }}
      >
        <Animated.ScrollView
          ref={scrollRef}
          showsVerticalScrollIndicator={false}
          pagingEnabled
          scrollEventThrottle={16}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
          onTouchCancel={() => {
            tapStart.current = null;
          }}
          onScroll={Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], {
            useNativeDriver: true,
          })}
          contentContainerStyle={{
            paddingBottom: 40, // 👈 원하는 만큼
          }}
        >
          <View style={{ height: pageHeight }} className="relative bg-white px-8 pb-28 pt-6">
            <View className="flex-row items-start justify-between">
              <View>
                <View className="flex-row items-end">
                  <Text
                    className="font-serif text-4xl font-bold leading-10"
                    style={{ color: accentColor }}
                  >
                    {month}
                  </Text>
                  <Text className="mb-1.5 ml-1.5 text-base text-gray-500 font-wanted-semibold">월</Text>
                </View>
              </View>

              <View className="items-end space-y-2">
                <View className="items-end">
                  <Text className=" text-3xl font-wanted-semibold" style={{ color: accentColor }}>
                    {WEEKDAY_HANJA[weekday]}
                  </Text>
                  <Text className=" mt-1 text-xs text-gray-400 font-wanted-semibold">
                    {/* 음력 정보 포맷팅 */}
                    {fortune?.lunarDate
                      ? (() => {
                          const parts = fortune.lunarDate.split('-');
                          if (parts.length === 3) {
                            return `음력 ${parts[1]}/${parts[2]}`;
                          }
                          return `음력 ${fortune.lunarDate}`;
                        })()
                      : '음력 --'}
                  </Text>
                </View>
              </View>
            </View>

            <View className="flex-1 items-center" style={{ marginTop: '15%' }}>
              <Text
                className="font-serif text-[148px] font-extrabold leading-[148px] tracking-[-0.04em]"
                style={{ color: accentColor }}
              >
                {day}
              </Text>

              <View className="mt-12 w-full max-w-xl px-4">
                {loading ? (
                  <View className="items-center">
                    <ActivityIndicator size="small" color="#d1d5db" />
                    <Text className="mt-2 font-serif text-sm text-gray-300">
                      운세를 읽고 있습니다...
                    </Text>
                  </View>
                ) : fortune ? (
                  <View className="relative items-center" style={{ minHeight: 7 * 36 }}>
                    {/* 노트 줄 배경 */}
                    <View className="absolute inset-0">
                      {Array.from({ length: 7 }).map((_, i) => (
                        <View
                          key={i}
                          className="absolute w-full border-t border-gray-200"
                          style={{ top: i * 36 }}
                        />
                      ))}
                    </View>
                    <Text
                      className="relative text-center text-lg font-medium text-gray-700 font-wanted-semibold"
                      style={{ lineHeight: 36 }}
                    >
                      {fortune.overview}
                    </Text>
                  </View>
                ) : (
                  <Text className="text-center font-serif text-sm text-gray-300">
                    운세 정보가 없습니다.
                  </Text>
                )}
              </View>
            </View>

            <Animated.View
              style={[{ opacity: indicatorOpacity }, bounceStyle]}
              className="absolute inset-x-0 bottom-20 items-center"
            >
              <Feather name="chevron-down" size={28} color="#d1d5db" />
              <Text className=" font-serif text-gray-500">운세보러가기</Text>
            </Animated.View>
          </View>

          <View
            style={{ height: pageHeight }}
            className="border-t border-dashed border-gray-200 bg-gray-50 p-8"
          >
            <View className="mx-auto flex-1 w-full max-w-xl ">
              {fortune ? (
                <>
                  <FortuneItem 
                    icon="dollar-sign" 
                    label="재물운" 
                    value={fortune.wealth}
                    iconColor="#d97706"
                    bgColor="#fef3c7"
                  />
                  <FortuneItem 
                    icon="heart" 
                    label="애정운" 
                    value={fortune.love}
                    iconColor="#dc2626"
                    bgColor="#fee2e2"
                  />
                  <FortuneItem 
                    icon="award" 
                    label="성공운" 
                    value={fortune.success}
                    iconColor="#7c3aed"
                    bgColor="#ede9fe"
                  />
                  <FortuneItem 
                    icon="zap" 
                    label="추천 행동" 
                    value={fortune.action}
                    iconColor="#059669"
                    bgColor="#d1fae5"
                    isLast 
                  />
                </>
              ) : (
                <View className="py-5">
                  <Text className="font-serif text-[15px] text-gray-400">
                    운세 정보가 없습니다.
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

interface FortuneItemProps {
  icon: React.ComponentProps<typeof Feather>['name'];
  label: string;
  value: string;
  iconColor: string;
  bgColor: string;
  isLast?: boolean;
}

const FortuneItem: React.FC<FortuneItemProps> = ({ icon, label, value, iconColor, bgColor, isLast }) => (
  <View className={`py-4 ${isLast ? '' : 'border-b border-gray-200'}`}>
    <View className="mb-2 flex-row items-center">
      <View 
        className="mr-3 h-9 w-9 items-center justify-center rounded-full"
        style={{ backgroundColor: bgColor }}
      >
        <Feather name={icon} size={18} color={iconColor} />
      </View>
      <Text className=" text-lg font-bold text-gray-900 font-wanted-regular">{label}</Text>
    </View>
    <Text className=" text-[15px] leading-7 text-gray-600 font-wanted-regular">{value}</Text>
  </View>
);

export default CalendarPage;
