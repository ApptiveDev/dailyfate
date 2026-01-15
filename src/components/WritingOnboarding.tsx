import React, { useRef, useState } from 'react';
import {
  Animated,
  Easing,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Pressable,
  ScrollView,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

type LoginMode = 'signIn' | 'signUp';

interface OnboardingProps {
  onComplete: (mode: LoginMode) => void;
}

interface StepProps {
  title: string;
  description: string;
}

const WEEKDAY_HANJA = ['日', '月', '火', '水', '木', '金', '土'];

const WritingOnboarding: React.FC<OnboardingProps> = ({ onComplete }) => {
  const { width } = useWindowDimensions();
  const [activeIndex, setActiveIndex] = useState(0);
  const scrollRef = useRef<ScrollView>(null);

  const steps = [
    {
      key: 'intro',
      render: () => (
        <IntroStep
          title={'매일 1분,\n글 쓰는 습관'}
          description={'하루 한 줄도 좋아요.\n생각을 글로 옮기는 연습을 시작해보세요.'}
        />
      ),
    },
    {
      key: 'prompt',
      render: () => (
        <PromptStep
          title={'매일 새로운\n글감이 도착해요'}
          description={'카피라이팅, 짧은 서사, 질문 답변 등\n다양한 글감으로 영감을 얻어보세요.'}
        />
      ),
    },
    {
      key: 'write',
      render: () => (
        <WriteStep
          title={'1분이면 충분해요'}
          description={'100~300자 짧은 글로\n부담 없이 기록을 쌓아보세요.'}
        />
      ),
    },
    {
      key: 'archive',
      render: () => (
        <ArchiveStep
          title={'나만의 글 모음집'}
          description={'월별로 모아보고, 베스트 문장도 선정해보세요.\n꾸준히 쓴 기록이 자산이 됩니다.'}
        />
      ),
    },
    {
      key: 'start',
      render: () => (
        <StartStep
          title={'지금 시작해볼까요?'}
          description={'오늘의 첫 글감이 기다리고 있어요.'}
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

  const goToNext = () => {
    if (activeIndex < steps.length - 1) {
      scrollRef.current?.scrollTo({ x: width * (activeIndex + 1), animated: true });
    }
  };

  return (
    <SafeAreaView edges={['top']} className="flex-1 bg-stone-200">
      <View className="flex-1 bg-white">
        {/* 프로그레스 인디케이터 */}
        <View className="py-6 flex-row items-center justify-center gap-2">
          {steps.map((step, index) => (
            <View
              key={step.key}
              className={`h-1 rounded-full ${
                index === activeIndex ? 'w-6 bg-gray-900' : 'w-1.5 bg-gray-200'
              }`}
            />
          ))}
        </View>

        {/* 점선 구분 */}
        <View className="border-t border-dashed border-gray-200" />

        {/* 스크롤 컨텐츠 */}
        <ScrollView
          ref={scrollRef}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onScroll={handleScroll}
          scrollEventThrottle={16}
          className="flex-1"
        >
          {steps.map((step) => (
            <View key={step.key} style={{ width }} className="flex-1">
              {step.render()}
            </View>
          ))}
        </ScrollView>

        {/* 다음 버튼 (마지막 스텝 제외) */}
        {activeIndex < steps.length - 1 && (
          <View className="pb-10 items-center">
            <Pressable
              onPress={goToNext}
              className="flex-row items-center gap-2 px-6 py-3 bg-gray-100 rounded-full"
            >
              <Text className="text-sm text-gray-600 font-wanted-semibold">다음</Text>
              <Feather name="chevron-right" size={16} color="#6b7280" />
            </Pressable>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
};

// Step 텍스트 공통 컴포넌트
const StepText: React.FC<StepProps> = ({ title, description }) => (
  <View className="items-center px-8">
    <Text className="text-2xl font-noto-bold text-gray-900 text-center leading-9">
      {title}
    </Text>
    <Text className="mt-4 text-base font-wanted-regular text-gray-500 text-center leading-6">
      {description}
    </Text>
  </View>
);

// Step 1: 인트로
const IntroStep: React.FC<StepProps> = ({ title, description }) => {
  const floatAnim = useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim, {
          toValue: 1,
          duration: 1500,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(floatAnim, {
          toValue: 0,
          duration: 1500,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  const translateY = floatAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -10],
  });

  return (
    <View className="flex-1 justify-center">
      {/* 일력 비주얼 */}
      <Animated.View
        className="items-center mb-12"
        style={{ transform: [{ translateY }] }}
      >
        <View className="bg-stone-100 rounded-2xl p-6 items-center">
          <Text className="text-5xl font-noto-bold text-gray-900 mb-2">16</Text>
          <Text className="text-lg font-noto-semibold text-gray-600">木</Text>
          <View className="mt-3 border-t border-dashed border-gray-300 pt-3">
            <Feather name="edit-3" size={24} color="#374151" />
          </View>
        </View>
      </Animated.View>

      <StepText title={title} description={description} />
    </View>
  );
};

// Step 2: 글감 소개
const PromptStep: React.FC<StepProps> = ({ title, description }) => {
  return (
    <View className="flex-1 justify-center">
      {/* 글감 예시 카드 */}
      <View className="items-center mb-12 px-8">
        <View className="w-full max-w-xs bg-stone-100 rounded-2xl p-5">
          <Text className="text-sm text-gray-400 font-wanted-regular mb-3">
            오늘의 글감
          </Text>
          <Text className="text-xl font-noto-bold text-gray-900 leading-8 mb-4">
            당신의 하루를 한 문장으로 표현한다면?
          </Text>
          <View className="border-t border-dashed border-gray-300 pt-4">
            <View className="flex-row flex-wrap gap-2">
              <View className="bg-white rounded-full px-3 py-1.5">
                <Text className="text-xs text-gray-500 font-wanted-regular">카피라이팅</Text>
              </View>
              <View className="bg-white rounded-full px-3 py-1.5">
                <Text className="text-xs text-gray-500 font-wanted-regular">서사 글감</Text>
              </View>
              <View className="bg-white rounded-full px-3 py-1.5">
                <Text className="text-xs text-gray-500 font-wanted-regular">질문 답변</Text>
              </View>
            </View>
          </View>
        </View>
      </View>

      <StepText title={title} description={description} />
    </View>
  );
};

// Step 3: 글쓰기 입력
const WriteStep: React.FC<StepProps> = ({ title, description }) => {
  const cursorAnim = useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(cursorAnim, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.timing(cursorAnim, {
          toValue: 0,
          duration: 500,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  return (
    <View className="flex-1 justify-center">
      {/* 글쓰기 UI 미리보기 - 노트 스타일 */}
      <View className="items-center mb-12 px-8">
        <View className="w-full max-w-xs bg-white border border-gray-200 rounded-2xl overflow-hidden">
          {/* 글감 */}
          <View className="bg-stone-100 px-5 py-4">
            <Text className="text-lg font-noto-bold text-gray-900 leading-7">
              &quot;당신의 하루를 한 문장으로 표현한다면?&quot;
            </Text>
          </View>

          {/* 점선 구분 */}
          <View className="border-t border-dashed border-gray-200" />

          {/* 입력 영역 - 노트 줄 */}
          <View className="p-5 relative min-h-[120px]">
            {/* 노트 줄 배경 */}
            <View className="absolute inset-0">
              {Array.from({ length: 4 }).map((_, i) => (
                <View
                  key={i}
                  className="absolute left-0 right-0 border-t border-gray-100"
                  style={{ top: 20 + i * 28 }}
                />
              ))}
            </View>

            <View className="flex-row">
              <Text className="text-base text-gray-400 font-noto">
                오늘 하루는...
              </Text>
              <Animated.View
                className="w-0.5 h-5 bg-gray-400 ml-0.5"
                style={{ opacity: cursorAnim }}
              />
            </View>
          </View>

          {/* 글자수 - 점선 구분 */}
          <View className="border-t border-dashed border-gray-200 px-5 py-3">
            <Text className="text-xs text-gray-400 font-wanted-regular text-right">
              12자 / 100~300자 권장
            </Text>
          </View>
        </View>
      </View>

      <StepText title={title} description={description} />
    </View>
  );
};

// Step 4: 아카이브
const ArchiveStep: React.FC<StepProps> = ({ title, description }) => {
  const days = [
    { day: 12, weekday: 0 },
    { day: 13, weekday: 1 },
    { day: 14, weekday: 2 },
    { day: 15, weekday: 3 },
    { day: 16, weekday: 4 },
    { day: 17, weekday: 5 },
    { day: 18, weekday: 6 },
  ];
  const written = [12, 13, 15, 16, 18];

  return (
    <View className="flex-1 justify-center">
      {/* 캘린더 미리보기 */}
      <View className="items-center mb-12 px-8">
        <View className="w-full max-w-xs bg-white border border-gray-200 rounded-2xl overflow-hidden">
          {/* 월 헤더 */}
          <View className="px-5 py-4 flex-row items-center justify-between">
            <Text className="text-2xl font-noto-bold text-gray-900">1월</Text>
            <View className="flex-row items-center">
              <Text className="text-sm text-gray-900 font-wanted-semibold">5</Text>
              <Text className="text-sm text-gray-400 font-wanted-regular">일 / 7일 기록</Text>
            </View>
          </View>

          {/* 점선 구분 */}
          <View className="border-t border-dashed border-gray-200" />

          {/* 주간 뷰 */}
          <View className="px-4 py-4">
            <View className="flex-row">
              {days.map(({ day, weekday }) => {
                const isWritten = written.includes(day);
                const dayColor = weekday === 0 ? '#dc2626' : weekday === 6 ? '#2563eb' : '#374151';

                return (
                  <View key={day} className="flex-1 items-center">
                    <Text
                      className="text-xs font-noto-semibold mb-2"
                      style={{ color: weekday === 0 ? '#dc2626' : weekday === 6 ? '#2563eb' : '#9ca3af' }}
                    >
                      {WEEKDAY_HANJA[weekday]}
                    </Text>
                    <View
                      className={`w-9 h-9 rounded-xl items-center justify-center ${
                        isWritten ? 'bg-gray-100' : ''
                      }`}
                    >
                      <Text
                        className={`text-sm font-noto-semibold ${isWritten ? '' : 'opacity-30'}`}
                        style={{ color: dayColor }}
                      >
                        {day}
                      </Text>
                      {isWritten && (
                        <View className="w-1 h-1 rounded-full bg-gray-400 mt-0.5" />
                      )}
                    </View>
                  </View>
                );
              })}
            </View>
          </View>

          {/* 점선 구분 */}
          <View className="border-t border-dashed border-gray-200" />

          {/* 베스트 문장 */}
          <View className="px-5 py-4">
            <View className="flex-row items-center mb-2">
              <Feather name="star" size={12} color="#f59e0b" />
              <Text className="ml-1 text-xs text-amber-600 font-wanted-semibold">
                베스트 문장
              </Text>
            </View>
            <Text className="text-sm text-gray-700 font-noto leading-5">
              &quot;커피 한 잔에 담긴 여유, 그게 내 사치야.&quot;
            </Text>
          </View>
        </View>
      </View>

      <StepText title={title} description={description} />
    </View>
  );
};

// Step 5: 시작하기
interface StartStepProps extends StepProps {
  onComplete: (mode: LoginMode) => void;
}

const StartStep: React.FC<StartStepProps> = ({ title, description, onComplete }) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  React.useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(scaleAnim, {
          toValue: 1.05,
          duration: 1000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 1000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  return (
    <View className="flex-1 justify-center">
      {/* 비주얼 - 일력 스타일 */}
      <View className="items-center mb-12">
        <Animated.View
          className="bg-stone-100 rounded-2xl p-6 items-center"
          style={{ transform: [{ scale: scaleAnim }] }}
        >
          <Feather name="send" size={32} color="#374151" />
          <Text className="mt-3 text-sm text-gray-500 font-wanted-regular">
            글쓰기 시작
          </Text>
        </Animated.View>
      </View>

      <StepText title={title} description={description} />

      {/* 시작 버튼들 */}
      <View className="px-8 mt-12">
        <Pressable
          onPress={() => onComplete('signUp')}
          className="bg-gray-900 rounded-full py-4 items-center mb-3"
        >
          <Text className="text-base text-white font-wanted-semibold">
            새로 시작하기
          </Text>
        </Pressable>

        <Pressable
          onPress={() => onComplete('signIn')}
          className="border border-gray-200 rounded-full py-4 items-center"
        >
          <Text className="text-base text-gray-600 font-wanted-semibold">
            기존 계정으로 로그인
          </Text>
        </Pressable>
      </View>
    </View>
  );
};

export default WritingOnboarding;
