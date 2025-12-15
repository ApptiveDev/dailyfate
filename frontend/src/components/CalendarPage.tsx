import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Dimensions,
  Easing,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { Feather } from '@expo/vector-icons';

import { FortuneData } from '../types/fortune';

interface Props {
  date: Date;
  onNext: () => void;
  onPrev: () => void;
  fortune: FortuneData | null;
  loading: boolean;
  onOpenSettings?: () => void;
}

const WEEKDAY_HANJA = ['日', '月', '火', '水', '木', '金', '土'];

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
  const [isTearing, setIsTearing] = useState(false);

  // Reset scroll to top when the date changes
  useEffect(() => {
    scrollRef.current?.scrollTo({ y: 0, animated: false });
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

  const handleTear = () => {
    if (isTearing) return;
    setIsTearing(true);

    Animated.sequence([
      Animated.timing(tearAnim, {
        toValue: 1,
        duration: 320,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(tearAnim, {
        toValue: 0,
        duration: 180,
        easing: Easing.in(Easing.quad),
        useNativeDriver: true,
      }),
    ]).start(() => {
      onNext();
      setTimeout(() => setIsTearing(false), 100);
    });
  };

  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const weekday = date.getDay();

  const accentColor = weekday === 0 ? '#dc2626' : weekday === 6 ? '#2563eb' : '#111827';
  const pageHeight = Dimensions.get('window').height;

  const tearTransform = {
    transform: [
      {
        translateY: tearAnim.interpolate({
          inputRange: [0, 1],
          outputRange: [0, -24],
        }),
      },
      {
        rotate: tearAnim.interpolate({
          inputRange: [0, 1],
          outputRange: ['0deg', '-2deg'],
        }),
      },
      {
        scale: tearAnim.interpolate({
          inputRange: [0, 1],
          outputRange: [1, 0.99],
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

  return (
    <View className="relative flex-1 bg-stone-200">
      <View className="absolute inset-0 bg-white" />

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
          tearTransform,
        ]}
      >
        <Animated.ScrollView
          ref={scrollRef}
          showsVerticalScrollIndicator={false}
          pagingEnabled
          scrollEventThrottle={16}
          onScroll={Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], {
            useNativeDriver: true,
          })}
        >
          <View style={{ height: pageHeight }} className="relative bg-white px-8 pb-28 pt-6">
            <View className="flex-row items-start justify-between">
              <View>
                <Text className="font-serif text-xs tracking-[0.25em] text-gray-400">{year}</Text>
                <View className="mt-1.5 flex-row items-end">
                  <Text
                    className="font-serif text-4xl font-bold leading-10"
                    style={{ color: accentColor }}
                  >
                    {month}
                  </Text>
                  <Text className="font-serif mb-1.5 ml-1.5 text-base text-gray-500">월</Text>
                </View>
              </View>

              <View className="items-end space-y-2">
                <View className="items-end">
                  <Text className="font-serif text-3xl font-bold" style={{ color: accentColor }}>
                    {WEEKDAY_HANJA[weekday]}
                  </Text>
                  <Text className="font-serif mt-1 text-xs text-gray-400">
                    {fortune?.lunarDate || '음력 --'}
                  </Text>
                </View>
              </View>
            </View>

            <View className="flex-1 items-center" style={{ marginTop: '20%' }}>
              <Text
                className="font-serif text-[148px] font-extrabold leading-[148px] tracking-[-0.04em]"
                style={{ color: accentColor }}
              >
                {day}
              </Text>

              <View className="mt-6 w-full max-w-xl px-6">
                {loading ? (
                  <View className="items-center">
                    <ActivityIndicator size="small" color="#d1d5db" />
                    <Text className="mt-2 font-serif text-sm text-gray-300">
                      운세를 읽고 있습니다...
                    </Text>
                  </View>
                ) : fortune ? (
                  <Text className="text-center font-serif text-lg font-semibold leading-7 text-gray-600">
                    {fortune.overview}
                  </Text>
                ) : (
                  <Text className="text-center font-serif text-sm text-gray-300">
                    운세 정보가 없습니다.
                  </Text>
                )}
              </View>

              <View className="mt-6 flex-row items-center space-x-3">
                <Pressable
                  onPress={onPrev}
                  className="rounded-full bg-stone-100 px-3 py-2 active:opacity-80"
                  hitSlop={8}
                  accessibilityLabel="이전 날 보기"
                >
                  <Feather name="chevron-left" size={18} color="#4b5563" />
                </Pressable>
                <Pressable
                  onPress={handleTear}
                  className="flex-row items-center space-x-2 rounded-full bg-gray-900 px-4 py-2 active:opacity-85"
                  accessibilityLabel="다음 날로 넘어가기"
                >
                  <Feather name="scissors" size={16} color="#fff" />
                  <Text className="text-sm font-semibold text-white">다음 날로 넘기기</Text>
                </Pressable>
              </View>
            </View>

            <Animated.View
              style={[{ opacity: indicatorOpacity }, bounceStyle]}
              className="absolute inset-x-0 bottom-40 items-center"
            >
              <Feather name="chevron-down" size={28} color="#d1d5db" />
              <Text className=" font-serif text-gray-500">운세보러가기</Text>
            </Animated.View>
          </View>

          <View
            style={{ height: pageHeight }}
            className="border-t border-dashed border-gray-200 bg-gray-50 px-8 pb-10 pt-14"
          >
            <View className="mx-auto flex-1 w-full max-w-xl">
              <View className="mb-3 flex-row items-center opacity-60">
                <Text className="font-serif text-[11px] font-bold tracking-[0.2em] text-gray-500">
                  오늘의 운세
                </Text>
                <View className="ml-2 h-px flex-1 bg-gray-300" />
              </View>

              {fortune ? (
                <>
                  <FortuneItem icon="dollar-sign" label="재물운" value={fortune.wealth} />
                  <FortuneItem icon="heart" label="애정운" value={fortune.love} />
                  <FortuneItem icon="award" label="성공운" value={fortune.success} />
                  <FortuneItem icon="zap" label="추천 행동" value={fortune.action} isLast />
                </>
              ) : (
                <View className="py-5">
                  <Text className="font-serif text-[15px] text-gray-400">
                    운세 정보가 없습니다.
                  </Text>
                </View>
              )}

              <View className="flex-1" />
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
  isLast?: boolean;
}

const FortuneItem: React.FC<FortuneItemProps> = ({ icon, label, value, isLast }) => (
  <View className={`py-4 ${isLast ? '' : 'border-b border-gray-200'}`}>
    <View className="mb-2 flex-row items-center">
      <Feather name={icon} size={20} color="#9ca3af" style={{ marginRight: 10 }} />
      <Text className="font-serif text-lg font-bold text-gray-900">{label}</Text>
    </View>
    <Text className="font-serif text-[15px] leading-6 text-gray-600">{value}</Text>
  </View>
);

export default CalendarPage;
