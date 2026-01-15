import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  Image,
  LayoutChangeEvent,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Pressable,
  ScrollView,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import appIcon from '../../assets/icon.png';

type LoginMode = 'signIn' | 'signUp';

interface OnboardingProps {
  onComplete: (mode: LoginMode) => void;
}

interface StepProps {
  title: string;
  description: string;
  titleClassName?: string;
}

interface PhoneStepProps extends StepProps {
  phoneWidth: number;
  phoneHeight: number;
}

interface Step5Props extends StepProps {
  onComplete: (mode: LoginMode) => void;
}

const Onboarding: React.FC<OnboardingProps> = ({ onComplete }) => {
  const { width } = useWindowDimensions();
  const phoneWidth = Math.min(width * 0.74, 310);
  const phoneHeight = Math.round(phoneWidth * 1.68);
  const [activeIndex, setActiveIndex] = useState(0);

  const steps = [
    {
      key: 'intro',
      render: () => (
        <Step1Visual
          title={'하루 한 컷,\n나만의 사진 일력'}
          description={
            '매일 새로운 사진 주제가 주어져요.\n일상의 소중한 순간을 기록해보세요!'
          }
        />
      ),
    },
    {
      key: 'mission',
      render: () => (
        <Step2Visual
          title={'오늘의 사진 주제를\n확인하세요'}
          description={'매일 아침 새로운 주제가 주어져요.\n계절과 절기에 맞는 특별한 미션도 있어요.'}
          phoneWidth={phoneWidth}
          phoneHeight={phoneHeight}
        />
      ),
    },
    {
      key: 'capture',
      render: () => (
        <Step3Visual
          title={'주제에 맞는 사진을\n촬영하세요'}
          description={
            '카메라로 바로 촬영하거나\n갤러리에서 사진을 선택할 수 있어요.'
          }
          phoneWidth={phoneWidth}
          phoneHeight={phoneHeight}
        />
      ),
    },
    {
      key: 'album',
      render: () => (
        <Step4Visual
          title={'월말에 자동으로\n앨범이 완성돼요'}
          description={
            '한 달간 촬영한 사진이 캘린더 앨범으로!\n나만의 계절 기록을 쌓아가세요.'
          }
          phoneWidth={phoneWidth}
          phoneHeight={phoneHeight}
        />
      ),
    },
    {
      key: 'start',
      render: () => (
        <Step5Visual
          title={'지금 바로\n시작해볼까요?'}
          description={'오늘의 첫 번째 사진 미션이\n기다리고 있어요.'}
          onComplete={onComplete}
        />
      ),
    },
  ];

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const index = Math.round(event.nativeEvent.contentOffset.x / width);
    if (index !== activeIndex) {
      setActiveIndex(index);
    }
  };

  return (
    <SafeAreaView edges={['top']} className="flex-1 bg-white">
      <View className="flex-1">
        <View className="absolute top-6 left-0 right-0 z-20 flex-row items-center justify-center gap-2">
          {steps.map((step, index) => (
            <View
              key={step.key}
              className={`h-1 rounded-full ${
                index === activeIndex ? 'w-6 bg-[#191F28]' : 'w-1.5 bg-gray-200'
              }`}
            />
          ))}
        </View>

        <ScrollView
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onScroll={handleScroll}
          scrollEventThrottle={16}
        >
          {steps.map((step) => (
            <View key={step.key} style={{ width }} className="flex-1">
              {step.render()}
            </View>
          ))}
        </ScrollView>
      </View>
    </SafeAreaView>
  );
};

const StepText: React.FC<StepProps> = ({
  title,
  description,
  titleClassName = 'text-[24px] leading-32',
}) => (
  <View className="mb-10 items-center gap-3">
    <Text className={`text-center font-bold text-[#191F28] ${titleClassName}`}>{title}</Text>
    <Text className="text-center text-[15px] leading-6 text-[#8B95A1]">{description}</Text>
  </View>
);

const PhoneMockup: React.FC<{
  width: number;
  height: number;
  children: React.ReactNode;
  className?: string;
}> = ({ width, height, children, className = '' }) => (
  <View
    style={{ width, height }}
    className={`rounded-[36px] bg-[#191F28] p-2 shadow-2xl ${className}`}
  >
    <View className="absolute top-2 left-0 right-0 items-center">
      <View className="h-5 w-24 rounded-2xl bg-[#191F28]" />
    </View>
    <View className="flex-1 overflow-hidden rounded-[28px] bg-white">{children}</View>
  </View>
);

const MockMissionCard: React.FC<{
  fullHeight?: boolean;
  className?: string;
}> = ({ fullHeight = false, className = '' }) => (
  <View className={`w-full ${fullHeight ? 'flex-1' : 'px-4 pt-4'} ${className}`}>
    <View className="w-full flex-1 rounded-2xl bg-white p-4">
      {/* 계절 태그 */}
      <View className="mb-3 flex-row">
        <View className="rounded-full bg-emerald-100 px-3 py-1">
          <Text className="text-[10px] font-bold text-emerald-600">겨울</Text>
        </View>
      </View>
      {/* 주제 */}
      <Text className="text-[10px] font-semibold uppercase tracking-widest text-gray-400">
        오늘의 사진 주제
      </Text>
      <Text className="mt-1 text-xl font-bold text-[#191F28]">
        따뜻한 조명
      </Text>
      {/* 사진 영역 */}
      <View className="mt-4 aspect-square w-full items-center justify-center rounded-xl bg-gray-100">
        <Feather name="camera" size={32} color="#d1d5db" />
      </View>
      {/* 버튼 */}
      <View className="mt-4 flex-row gap-2">
        <View className="flex-1 items-center rounded-xl bg-emerald-500 py-3">
          <Text className="text-xs font-bold text-white">촬영하기</Text>
        </View>
        <View className="items-center justify-center rounded-xl border border-gray-200 px-4">
          <Feather name="image" size={16} color="#9ca3af" />
        </View>
      </View>
    </View>
  </View>
);

const Step1Visual: React.FC<StepProps> = ({ title, description }) => (
  <View className="flex-1 items-center justify-center px-10">
    <StepText title={title} description={description} titleClassName="text-[28px] leading-[36px]" />
    <View className="items-center justify-center">
      <View className="absolute h-56 w-56" />
      <View className="rounded-[32px] bg-white shadow-2xl">
        <Image
          source={appIcon}
          style={{ width: 160, height: 160 }}
          className="rounded-[32px]"
          resizeMode="contain"
        />
      </View>
    </View>
  </View>
);

const Step2Visual: React.FC<PhoneStepProps> = ({ title, description, phoneWidth, phoneHeight }) => {
  const pulseAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1500,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 0,
          duration: 1500,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
      ]),
    );
    animation.start();
    return () => {
      animation.stop();
    };
  }, [pulseAnim]);

  const scale = pulseAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.98, 1.02],
  });

  return (
    <View className="flex-1 items-center justify-center px-8">
      <StepText title={title} description={description} />
      <PhoneMockup width={phoneWidth} height={phoneHeight}>
        <View className="flex-1 bg-[#FFFBF5] p-4">
          {/* 날짜 헤더 */}
          <View className="flex-row items-baseline">
            <Text className="text-2xl font-bold text-gray-800">1월</Text>
            <Text className="ml-2 text-3xl font-extrabold text-gray-900">16일</Text>
          </View>

          {/* 미션 카드 */}
          <Animated.View
            className="mt-4 rounded-2xl bg-white p-4 shadow-sm"
            style={{ transform: [{ scale }] }}
          >
            <View className="mb-2 flex-row">
              <View className="rounded-full bg-slate-100 px-3 py-1">
                <Text className="text-[10px] font-bold text-slate-600">겨울</Text>
              </View>
            </View>
            <Text className="text-[9px] font-semibold uppercase tracking-widest text-gray-400">
              오늘의 사진 주제
            </Text>
            <Text className="mt-1 text-lg font-bold text-gray-800">따뜻한 조명</Text>
            <Text className="mt-2 text-xs text-gray-400">
              💡 카페, 집, 거리의 따뜻한 불빛을 찾아보세요
            </Text>
          </Animated.View>

          {/* 미션 달성률 */}
          <View className="mt-4 rounded-xl bg-white p-3">
            <View className="flex-row items-center justify-between">
              <Text className="text-xs text-gray-400">1월 달성률</Text>
              <Text className="text-lg font-bold text-gray-800">68%</Text>
            </View>
            <View className="mt-2 h-2 overflow-hidden rounded-full bg-gray-100">
              <View className="h-full w-2/3 rounded-full bg-emerald-400" />
            </View>
          </View>
        </View>
      </PhoneMockup>
    </View>
  );
};

const Step3Visual: React.FC<PhoneStepProps> = ({ title, description, phoneWidth, phoneHeight }) => {
  const pulseAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1200,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 0,
          duration: 1200,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
      ]),
    );
    animation.start();
    return () => {
      animation.stop();
    };
  }, [pulseAnim]);

  const buttonScale = pulseAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.1],
  });

  return (
    <View className="flex-1 items-center justify-center px-8">
      <StepText title={title} description={description} />
      <PhoneMockup width={phoneWidth} height={phoneHeight}>
        <View className="flex-1 bg-gray-900">
          {/* 카메라 프리뷰 영역 */}
          <View className="flex-1 items-center justify-center">
            {/* 그리드 라인 */}
            <View className="absolute inset-0">
              <View className="absolute top-1/3 left-0 right-0 h-px bg-white/20" />
              <View className="absolute top-2/3 left-0 right-0 h-px bg-white/20" />
              <View className="absolute top-0 bottom-0 left-1/3 w-px bg-white/20" />
              <View className="absolute top-0 bottom-0 left-2/3 w-px bg-white/20" />
            </View>

            {/* 포커스 프레임 */}
            <View className="h-24 w-24 items-center justify-center">
              <View className="absolute top-0 left-0 h-6 w-6 border-l-2 border-t-2 border-white/60 rounded-tl" />
              <View className="absolute top-0 right-0 h-6 w-6 border-r-2 border-t-2 border-white/60 rounded-tr" />
              <View className="absolute bottom-0 left-0 h-6 w-6 border-l-2 border-b-2 border-white/60 rounded-bl" />
              <View className="absolute bottom-0 right-0 h-6 w-6 border-r-2 border-b-2 border-white/60 rounded-br" />
            </View>

            <Feather name="camera" size={28} color="rgba(255,255,255,0.3)" />
          </View>

          {/* 미션 표시 */}
          <View className="absolute top-12 left-0 right-0 px-4">
            <View className="rounded-xl bg-black/50 px-4 py-3">
              <Text className="text-[9px] font-semibold uppercase tracking-widest text-white/60">
                오늘의 주제
              </Text>
              <Text className="mt-0.5 text-sm font-bold text-white">따뜻한 조명</Text>
            </View>
          </View>

          {/* 하단 컨트롤 */}
          <View className="items-center pb-8">
            <View className="flex-row items-center gap-8">
              <View className="h-10 w-10 items-center justify-center rounded-xl bg-white/20">
                <Feather name="image" size={18} color="#ffffff" />
              </View>

              <Animated.View style={{ transform: [{ scale: buttonScale }] }}>
                <View className="h-16 w-16 items-center justify-center rounded-full border-4 border-white">
                  <View className="h-12 w-12 rounded-full bg-white" />
                </View>
              </Animated.View>

              <View className="h-10 w-10" />
            </View>
          </View>
        </View>
      </PhoneMockup>
    </View>
  );
};

const Step4Visual: React.FC<PhoneStepProps> = ({ title, description, phoneWidth, phoneHeight }) => {
  const fillAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(fillAnim, {
          toValue: 1,
          duration: 2000,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: false,
        }),
        Animated.delay(1000),
        Animated.timing(fillAnim, {
          toValue: 0,
          duration: 0,
          useNativeDriver: false,
        }),
      ]),
    );
    animation.start();
    return () => {
      animation.stop();
    };
  }, [fillAnim]);

  // 캘린더 그리드 데이터
  const days = Array.from({ length: 31 }, (_, i) => i + 1);
  const completedDays = [1, 2, 3, 5, 6, 7, 8, 10, 11, 12, 14, 15, 16, 17, 19, 20, 21, 22, 24, 25, 26, 28, 29, 30];

  return (
    <View className="flex-1 items-center justify-center px-8">
      <StepText title={title} description={description} />
      <PhoneMockup width={phoneWidth} height={phoneHeight}>
        <View className="flex-1 bg-[#FFFBF5] p-3">
          {/* 월 헤더 */}
          <View className="mb-3 flex-row items-center justify-between">
            <Text className="text-lg font-bold text-gray-800">2026.01</Text>
            <View className="flex-row items-center rounded-full bg-emerald-100 px-3 py-1">
              <Feather name="check-circle" size={12} color="#10b981" />
              <Text className="ml-1 text-xs font-bold text-emerald-600">24일 완료</Text>
            </View>
          </View>

          {/* 요일 헤더 */}
          <View className="mb-1 flex-row">
            {['일', '월', '화', '수', '목', '금', '토'].map((day, i) => (
              <View key={day} className="flex-1 items-center py-1">
                <Text className={`text-[8px] font-bold ${i === 0 ? 'text-red-400' : i === 6 ? 'text-blue-400' : 'text-gray-400'}`}>
                  {day}
                </Text>
              </View>
            ))}
          </View>

          {/* 캘린더 그리드 */}
          <View className="flex-1">
            {/* 빈 칸 (1월 1일이 수요일이라고 가정) */}
            <View className="flex-row flex-wrap">
              {[null, null, null].map((_, i) => (
                <View key={`empty-${i}`} className="w-[14.28%] aspect-square p-0.5" />
              ))}
              {days.map((day) => {
                const isCompleted = completedDays.includes(day);
                return (
                  <View key={day} className="w-[14.28%] aspect-square p-0.5">
                    <View className={`flex-1 items-center justify-center rounded-lg ${isCompleted ? 'bg-emerald-100' : 'bg-gray-100'}`}>
                      {isCompleted ? (
                        <Feather name="check" size={10} color="#10b981" />
                      ) : (
                        <Text className="text-[8px] text-gray-300">{day}</Text>
                      )}
                    </View>
                  </View>
                );
              })}
            </View>
          </View>

          {/* 앨범 버튼 */}
          <View className="mt-2 flex-row items-center justify-center rounded-xl bg-gray-800 py-3">
            <Feather name="book-open" size={14} color="#ffffff" />
            <Text className="ml-2 text-xs font-bold text-white">1월 앨범 만들기</Text>
          </View>
        </View>
      </PhoneMockup>
    </View>
  );
};

const Step5Visual: React.FC<Step5Props> = ({ title, description, onComplete }) => {
  const insets = useSafeAreaInsets();
  const bottomPadding = Math.max(insets.bottom, 16);
  const pulseAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1500,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 0,
          duration: 1500,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
      ]),
    );
    animation.start();
    return () => {
      animation.stop();
    };
  }, [pulseAnim]);

  const iconScale = pulseAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.08],
  });

  return (
    <View className="flex-1 bg-white">
      <View className="flex-1 items-center justify-center px-8">
        <StepText title={title} description={description} />
        <View className="items-center justify-center">
          <Animated.View
            style={{ transform: [{ scale: iconScale }] }}
            className="h-32 w-32 items-center justify-center rounded-[40px] border border-emerald-100 bg-emerald-50 shadow-xl"
          >
            <Feather name="camera" size={44} color="#10b981" />
          </Animated.View>
          <Text className="mt-4 text-sm text-gray-400">오늘의 첫 미션이 기다리고 있어요</Text>
        </View>
      </View>

      <View style={{ paddingBottom: bottomPadding + 16 }} className="px-8">
        <View className="gap-2.5">
          <Pressable
            onPress={() => onComplete('signIn')}
            className="w-full rounded-2xl bg-[#191F28] py-4 active:opacity-90"
          >
            <Text className="text-center text-base font-bold text-white">로그인</Text>
          </Pressable>
          <Pressable
            onPress={() => onComplete('signUp')}
            className="w-full rounded-2xl border border-gray-100 bg-white py-4 active:opacity-90"
          >
            <Text className="text-center text-base font-bold text-[#191F28]">회원가입</Text>
          </Pressable>
        </View>
        <View className="mt-4 flex-row items-center justify-center gap-2">
          <Feather name="check-circle" size={12} color="#9ca3af" />
          <Text className="text-[11px] font-medium text-gray-400">
            가입 시 이용약관 및 개인정보 처리방침에 동의하게 됩니다.
          </Text>
        </View>
      </View>
    </View>
  );
};

export default Onboarding;
