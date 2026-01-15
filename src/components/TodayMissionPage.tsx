import React, { useEffect, useRef } from 'react';
import {
  Animated,
  Dimensions,
  Easing,
  Pressable,
  Text,
  View,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MissionData, MonthlyStats, PhotoEntry, SeasonTag } from '../types/fortune';

interface Props {
  date: Date;
  mission: MissionData | null;
  todayPhoto: PhotoEntry | null;
  stats: MonthlyStats | null;
  loading: boolean;
  onOpenCamera: () => void;
  onOpenGallery: () => void;
  onOpenSettings: () => void;
  onViewPhoto: () => void;
}

const WEEKDAY_KR = ['일', '월', '화', '수', '목', '금', '토'];

const getSeasonColors = (seasonTag?: SeasonTag) => {
  if (!seasonTag) return { bg: '#f5f5f4', accent: '#78716c', glow: '#d6d3d1' };

  // 봄
  if (['봄', '입춘', '우수', '경칩', '춘분', '청명', '곡우'].includes(seasonTag)) {
    return { bg: '#ecfccb', accent: '#65a30d', glow: '#bef264' };
  }
  // 여름
  if (['여름', '입하', '소만', '망종', '하지', '소서', '대서'].includes(seasonTag)) {
    return { bg: '#cffafe', accent: '#0891b2', glow: '#67e8f9' };
  }
  // 가을
  if (['가을', '입추', '처서', '백로', '추분', '한로', '상강'].includes(seasonTag)) {
    return { bg: '#ffedd5', accent: '#ea580c', glow: '#fdba74' };
  }
  // 겨울
  if (['겨울', '입동', '소설', '대설', '동지', '소한', '대한'].includes(seasonTag)) {
    return { bg: '#f1f5f9', accent: '#475569', glow: '#cbd5e1' };
  }

  return { bg: '#f5f5f4', accent: '#78716c', glow: '#d6d3d1' };
};

const TodayMissionPage: React.FC<Props> = ({
  date,
  mission,
  todayPhoto,
  stats,
  loading,
  onOpenCamera,
  onOpenGallery,
  onOpenSettings,
  onViewPhoto,
}) => {
  const insets = useSafeAreaInsets();
  const pulseAnim = useRef(new Animated.Value(0)).current;
  const floatAnim = useRef(new Animated.Value(0)).current;
  const screenWidth = Dimensions.get('window').width;

  const month = date.getMonth() + 1;
  const day = date.getDate();
  const weekday = date.getDay();
  const isWeekend = weekday === 0 || weekday === 6;

  const seasonColors = getSeasonColors(mission?.seasonTag);
  const completionRate = stats ? Math.round((stats.completedDays / stats.totalDays) * 100) : 0;

  // 부드러운 펄스 애니메이션 (촬영 버튼)
  useEffect(() => {
    if (todayPhoto) return;

    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1500,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 0,
          duration: 1500,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    );
    pulse.start();
    return () => pulse.stop();
  }, [pulseAnim, todayPhoto]);

  // 카드 플로팅 애니메이션
  useEffect(() => {
    const float = Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim, {
          toValue: 1,
          duration: 3000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(floatAnim, {
          toValue: 0,
          duration: 3000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    );
    float.start();
    return () => float.stop();
  }, [floatAnim]);

  const pulseScale = pulseAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.08],
  });

  const floatY = floatAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -8],
  });

  return (
    <View className="flex-1 bg-[#FFFBF5]">
      {/* 배경 그라데이션 효과 */}
      <View
        className="absolute top-0 left-0 right-0 opacity-40"
        style={{
          height: 300,
          backgroundColor: seasonColors.bg,
        }}
      />

      {/* 헤더 */}
      <View
        className="z-10 px-6"
        style={{ paddingTop: insets.top + 12 }}
      >
        <View className="flex-row items-center justify-between">
          <View className="flex-row items-baseline">
            <Text className="font-serif text-4xl font-bold text-stone-800">
              {month}
            </Text>
            <Text className="ml-1 text-lg text-stone-500 font-wanted-semibold">월</Text>
            <Text className="ml-3 font-serif text-5xl font-extrabold text-stone-900">
              {day}
            </Text>
            <Text className="ml-1 text-lg text-stone-500 font-wanted-semibold">일</Text>
          </View>

          <View className="flex-row items-center gap-2">
            <View
              className="rounded-full px-3 py-1.5"
              style={{ backgroundColor: isWeekend ? '#fee2e2' : '#f3f4f6' }}
            >
              <Text
                className="text-sm font-bold"
                style={{ color: isWeekend ? '#dc2626' : '#6b7280' }}
              >
                {WEEKDAY_KR[weekday]}요일
              </Text>
            </View>
            <Pressable
              onPress={onOpenSettings}
              hitSlop={12}
              className="ml-2 rounded-full bg-white/80 p-2.5 shadow-sm"
            >
              <Feather name="settings" size={20} color="#57534e" />
            </Pressable>
          </View>
        </View>
      </View>

      {/* 메인 콘텐츠 */}
      <View className="flex-1 justify-center px-6" style={{ marginTop: -40 }}>
        {/* 미션 카드 */}
        <Animated.View
          style={{ transform: [{ translateY: floatY }] }}
        >
          <View
            className="rounded-3xl p-6 shadow-xl"
            style={{
              backgroundColor: '#ffffff',
              shadowColor: seasonColors.accent,
              shadowOpacity: 0.15,
              shadowRadius: 24,
              shadowOffset: { width: 0, height: 12 },
            }}
          >
            {/* 계절 태그 */}
            {mission?.seasonTag && (
              <View className="mb-4 flex-row">
                <View
                  className="rounded-full px-4 py-1.5"
                  style={{ backgroundColor: seasonColors.bg }}
                >
                  <Text
                    className="text-sm font-bold"
                    style={{ color: seasonColors.accent }}
                  >
                    {mission.seasonTag}
                  </Text>
                </View>
              </View>
            )}

            {/* 오늘의 주제 */}
            <View className="mb-6">
              <Text className="mb-2 text-sm font-semibold uppercase tracking-widest text-stone-400">
                오늘의 사진 주제
              </Text>
              {loading ? (
                <View className="h-12 w-48 animate-pulse rounded-lg bg-stone-100" />
              ) : (
                <Text className="font-serif text-3xl font-bold leading-tight text-stone-800">
                  {mission?.theme || '주제를 불러오는 중...'}
                </Text>
              )}
            </View>

            {/* 힌트 */}
            {mission?.hint && (
              <View className="mb-6 flex-row items-start rounded-2xl bg-stone-50 p-4">
                <Feather name="info" size={18} color="#a8a29e" style={{ marginTop: 2 }} />
                <Text className="ml-3 flex-1 text-base leading-6 text-stone-500 font-wanted-regular">
                  {mission.hint}
                </Text>
              </View>
            )}

            {/* 오늘 촬영한 사진이 있을 경우 */}
            {todayPhoto ? (
              <Pressable
                onPress={onViewPhoto}
                className="overflow-hidden rounded-2xl"
              >
                <View
                  className="aspect-square w-full items-center justify-center rounded-2xl bg-stone-100"
                >
                  <View className="items-center">
                    <View className="mb-3 h-16 w-16 items-center justify-center rounded-full bg-emerald-100">
                      <Feather name="check" size={32} color="#10b981" />
                    </View>
                    <Text className="text-lg font-bold text-stone-700">오늘의 미션 완료!</Text>
                    <Text className="mt-1 text-sm text-stone-400">탭하여 사진 보기</Text>
                  </View>
                </View>
              </Pressable>
            ) : (
              /* 촬영/갤러리 버튼 */
              <View className="flex-row gap-3">
                <Animated.View
                  className="flex-1"
                  style={{ transform: [{ scale: pulseScale }] }}
                >
                  <Pressable
                    onPress={onOpenCamera}
                    className="flex-row items-center justify-center rounded-2xl py-5"
                    style={{ backgroundColor: seasonColors.accent }}
                  >
                    <Feather name="camera" size={24} color="#ffffff" />
                    <Text className="ml-3 text-lg font-bold text-white">촬영하기</Text>
                  </Pressable>
                </Animated.View>

                <Pressable
                  onPress={onOpenGallery}
                  className="items-center justify-center rounded-2xl border-2 border-stone-200 bg-white px-5"
                >
                  <Feather name="image" size={24} color="#78716c" />
                </Pressable>
              </View>
            )}
          </View>
        </Animated.View>
      </View>

      {/* 하단 미션 달성률 */}
      <View
        className="px-6"
        style={{ paddingBottom: insets.bottom + 100 }}
      >
        <View className="rounded-2xl bg-white/80 p-5 shadow-sm">
          <View className="mb-3 flex-row items-center justify-between">
            <Text className="text-sm font-semibold text-stone-500">
              {month}월 미션 달성률
            </Text>
            <View className="flex-row items-center">
              {stats && stats.streak > 0 && (
                <View className="mr-3 flex-row items-center rounded-full bg-amber-50 px-3 py-1">
                  <Feather name="zap" size={14} color="#f59e0b" />
                  <Text className="ml-1 text-sm font-bold text-amber-600">
                    {stats.streak}일 연속
                  </Text>
                </View>
              )}
              <Text className="text-2xl font-extrabold text-stone-800">
                {completionRate}%
              </Text>
            </View>
          </View>

          {/* 프로그레스 바 */}
          <View className="h-3 overflow-hidden rounded-full bg-stone-100">
            <View
              className="h-full rounded-full"
              style={{
                width: `${completionRate}%`,
                backgroundColor: seasonColors.accent,
              }}
            />
          </View>

          {stats && (
            <Text className="mt-2 text-xs text-stone-400">
              {stats.completedDays}일 완료 / {stats.totalDays}일
            </Text>
          )}
        </View>
      </View>
    </View>
  );
};

export default TodayMissionPage;
