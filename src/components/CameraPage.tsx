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
import { MissionData } from '../types/fortune';

interface Props {
  mission: MissionData | null;
  onCapture: () => void;
  onClose: () => void;
  onFlipCamera: () => void;
  onOpenGallery: () => void;
}

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const CameraPage: React.FC<Props> = ({
  mission,
  onCapture,
  onClose,
  onFlipCamera,
  onOpenGallery,
}) => {
  const insets = useSafeAreaInsets();
  const pulseAnim = useRef(new Animated.Value(0)).current;
  const focusAnim = useRef(new Animated.Value(0)).current;

  // 촬영 버튼 펄스 애니메이션
  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1200,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 0,
          duration: 1200,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    );
    pulse.start();
    return () => pulse.stop();
  }, [pulseAnim]);

  // 포커스 프레임 애니메이션
  useEffect(() => {
    const focus = Animated.loop(
      Animated.sequence([
        Animated.timing(focusAnim, {
          toValue: 1,
          duration: 2000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(focusAnim, {
          toValue: 0,
          duration: 2000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    );
    focus.start();
    return () => focus.stop();
  }, [focusAnim]);

  const pulseScale = pulseAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.05],
  });

  const focusOpacity = focusAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.6],
  });

  return (
    <View className="flex-1 bg-black">
      {/* 카메라 프리뷰 영역 (placeholder) */}
      <View className="flex-1 items-center justify-center bg-stone-900">
        {/* 그리드 오버레이 */}
        <View className="absolute inset-0">
          {/* 수평선 */}
          <View className="absolute top-1/3 left-0 right-0 h-px bg-white/20" />
          <View className="absolute top-2/3 left-0 right-0 h-px bg-white/20" />
          {/* 수직선 */}
          <View className="absolute top-0 bottom-0 left-1/3 w-px bg-white/20" />
          <View className="absolute top-0 bottom-0 left-2/3 w-px bg-white/20" />
        </View>

        {/* 포커스 프레임 */}
        <Animated.View
          style={{ opacity: focusOpacity }}
          className="h-48 w-48 items-center justify-center"
        >
          {/* 코너 */}
          <View className="absolute top-0 left-0 h-8 w-8 border-l-2 border-t-2 border-white/80 rounded-tl-lg" />
          <View className="absolute top-0 right-0 h-8 w-8 border-r-2 border-t-2 border-white/80 rounded-tr-lg" />
          <View className="absolute bottom-0 left-0 h-8 w-8 border-l-2 border-b-2 border-white/80 rounded-bl-lg" />
          <View className="absolute bottom-0 right-0 h-8 w-8 border-r-2 border-b-2 border-white/80 rounded-br-lg" />
        </Animated.View>

        {/* 카메라 미리보기 플레이스홀더 */}
        <View className="absolute inset-0 items-center justify-center">
          <View className="items-center">
            <Feather name="camera" size={48} color="rgba(255,255,255,0.3)" />
            <Text className="mt-4 text-sm text-white/40">카메라 미리보기</Text>
          </View>
        </View>
      </View>

      {/* 상단 헤더 */}
      <View
        className="absolute left-0 right-0 z-10"
        style={{ top: insets.top }}
      >
        {/* 닫기 버튼 */}
        <View className="flex-row items-center justify-between px-4 py-3">
          <Pressable
            onPress={onClose}
            hitSlop={12}
            className="rounded-full bg-black/40 p-3"
          >
            <Feather name="x" size={24} color="#ffffff" />
          </Pressable>

          <Pressable
            onPress={onFlipCamera}
            hitSlop={12}
            className="rounded-full bg-black/40 p-3"
          >
            <Feather name="refresh-cw" size={20} color="#ffffff" />
          </Pressable>
        </View>

        {/* 미션 표시 */}
        {mission && (
          <View className="mx-4 mt-2 rounded-2xl bg-black/50 px-5 py-4">
            <Text className="text-xs font-semibold uppercase tracking-widest text-white/60">
              오늘의 주제
            </Text>
            <Text className="mt-1 font-serif text-xl font-bold text-white">
              {mission.theme}
            </Text>
            {mission.hint && (
              <Text className="mt-2 text-sm text-white/70">
                💡 {mission.hint}
              </Text>
            )}
          </View>
        )}
      </View>

      {/* 하단 컨트롤 */}
      <View
        className="absolute bottom-0 left-0 right-0"
        style={{ paddingBottom: insets.bottom + 20 }}
      >
        <View className="flex-row items-center justify-center px-8 py-6">
          {/* 갤러리 버튼 */}
          <Pressable
            onPress={onOpenGallery}
            className="items-center justify-center rounded-2xl bg-white/20 p-4"
          >
            <Feather name="image" size={24} color="#ffffff" />
          </Pressable>

          {/* 촬영 버튼 */}
          <View className="mx-10">
            <Animated.View
              style={{ transform: [{ scale: pulseScale }] }}
            >
              <Pressable
                onPress={onCapture}
                className="h-20 w-20 items-center justify-center rounded-full border-4 border-white bg-transparent"
              >
                <View className="h-16 w-16 rounded-full bg-white" />
              </Pressable>
            </Animated.View>
          </View>

          {/* 빈 공간 (대칭용) */}
          <View className="rounded-2xl bg-transparent p-4" style={{ width: 56 }} />
        </View>

        {/* 안내 텍스트 */}
        <Text className="mb-2 text-center text-sm text-white/50">
          버튼을 눌러 사진을 촬영하세요
        </Text>
      </View>
    </View>
  );
};

export default CameraPage;
