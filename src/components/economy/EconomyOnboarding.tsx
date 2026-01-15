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

const EconomyOnboarding: React.FC<OnboardingProps> = ({ onComplete }) => {
  const { width } = useWindowDimensions();
  const [activeIndex, setActiveIndex] = useState(0);
  const scrollRef = useRef<ScrollView>(null);

  const steps = [
    {
      key: 'intro',
      render: () => (
        <IntroStep
          title={'매일 1분,\n경제 감각 키우기'}
          description={'하루에 딱 하나,\n경제 용어를 쉽게 익혀보세요.'}
        />
      ),
    },
    {
      key: 'term',
      render: () => (
        <TermStep
          title={'오늘의 용어'}
          description={'매일 새로운 경제 용어와\n쉬운 설명이 도착해요.'}
        />
      ),
    },
    {
      key: 'quiz',
      render: () => (
        <QuizStep
          title={'퀴즈로 확인'}
          description={'간단한 퀴즈로\n배운 내용을 확인해보세요.'}
        />
      ),
    },
    {
      key: 'streak',
      render: () => (
        <StreakStep
          title={'잔디를 심어요'}
          description={'매일 학습하면 잔디가 자라요.\n연속 기록에 도전해보세요!'}
        />
      ),
    },
    {
      key: 'start',
      render: () => (
        <StartStep
          title={'경제 감각,\n지금 시작해요'}
          description={'오늘의 첫 용어가 기다리고 있어요.'}
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

        {/* 다음 버튼 */}
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
            <Feather name="trending-up" size={24} color="#2563eb" />
          </View>
        </View>
      </Animated.View>

      <StepText title={title} description={description} />
    </View>
  );
};

// Step 2: 용어 소개
const TermStep: React.FC<StepProps> = ({ title, description }) => {
  return (
    <View className="flex-1 justify-center">
      {/* 용어 카드 예시 */}
      <View className="items-center mb-12 px-8">
        <View className="w-full max-w-xs bg-white border border-gray-200 rounded-2xl overflow-hidden">
          {/* 카테고리 바 */}
          <View className="h-1 bg-blue-500" />

          <View className="p-5">
            <View className="flex-row items-center justify-between mb-3">
              <View className="px-3 py-1 rounded-full bg-blue-50">
                <Text className="text-xs text-blue-600 font-wanted-semibold">
                  거시경제
                </Text>
              </View>
              <View className="flex-row items-center">
                <View className="w-2 h-2 rounded-full bg-green-500 mr-1" />
                <Text className="text-xs text-gray-400 font-wanted-regular">입문</Text>
              </View>
            </View>

            <Text className="text-2xl font-noto-bold text-gray-900 mb-1">
              기준금리
            </Text>
            <Text className="text-sm text-gray-400 font-wanted-regular mb-4">
              Base Rate
            </Text>

            <View className="border-t border-dashed border-gray-200 pt-4">
              <Text className="text-sm text-gray-600 font-noto leading-6">
                한국은행이 금융기관과 거래할 때 기준이 되는 금리입니다.
              </Text>
            </View>
          </View>
        </View>
      </View>

      <StepText title={title} description={description} />
    </View>
  );
};

// Step 3: 퀴즈
const QuizStep: React.FC<StepProps> = ({ title, description }) => {
  const [selected, setSelected] = useState<number | null>(null);

  return (
    <View className="flex-1 justify-center">
      {/* 퀴즈 예시 */}
      <View className="items-center mb-12 px-8">
        <View className="w-full max-w-xs bg-white border border-gray-200 rounded-2xl p-5">
          <View className="flex-row items-center mb-4">
            <View className="w-8 h-8 rounded-full bg-gray-900 items-center justify-center">
              <Text className="text-sm text-white font-wanted-semibold">Q</Text>
            </View>
            <Text className="ml-3 text-sm text-gray-500 font-wanted-semibold">
              오늘의 퀴즈
            </Text>
          </View>

          <Text className="text-base font-noto-semibold text-gray-900 mb-4">
            기준금리를 결정하는 기관은?
          </Text>

          <View className="gap-2">
            {['금융위원회', '한국은행', '기획재정부', '국회'].map((option, idx) => (
              <Pressable
                key={idx}
                onPress={() => setSelected(idx)}
                className={`border rounded-xl p-3 flex-row items-center ${
                  selected === idx
                    ? idx === 1
                      ? 'border-green-300 bg-green-50'
                      : 'border-gray-400 bg-gray-50'
                    : 'border-gray-200'
                }`}
              >
                <View
                  className={`w-6 h-6 rounded-full items-center justify-center mr-2 ${
                    selected === idx && idx === 1
                      ? 'bg-green-500'
                      : selected === idx
                      ? 'bg-gray-900'
                      : 'bg-gray-100'
                  }`}
                >
                  {selected === idx && idx === 1 ? (
                    <Feather name="check" size={14} color="#fff" />
                  ) : (
                    <Text
                      className={`text-xs font-wanted-semibold ${
                        selected === idx ? 'text-white' : 'text-gray-500'
                      }`}
                    >
                      {idx + 1}
                    </Text>
                  )}
                </View>
                <Text className="text-sm font-wanted-regular text-gray-700">
                  {option}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>
      </View>

      <StepText title={title} description={description} />
    </View>
  );
};

// Step 4: 잔디
const StreakStep: React.FC<StepProps> = ({ title, description }) => {
  // 샘플 잔디 데이터
  const grassData = [
    [true, true, false, true, true, false, true],
    [true, false, true, true, true, true, false],
    [true, true, true, false, true, true, true],
    [false, true, true, true, false, true, true],
  ];

  return (
    <View className="flex-1 justify-center">
      {/* 잔디 예시 */}
      <View className="items-center mb-12 px-8">
        <View className="w-full max-w-xs bg-white border border-gray-200 rounded-2xl p-5">
          {/* 연속 일수 */}
          <View className="items-center mb-4">
            <Text className="text-4xl font-noto-bold text-gray-900">12</Text>
            <Text className="text-sm text-gray-500 font-wanted-regular">일 연속 학습</Text>
          </View>

          <View className="border-t border-dashed border-gray-200 pt-4">
            {/* 요일 헤더 */}
            <View className="flex-row mb-2">
              {WEEKDAY_HANJA.map((day, idx) => (
                <View key={day} className="flex-1 items-center">
                  <Text
                    className="text-xs font-noto-semibold"
                    style={{
                      color: idx === 0 ? '#dc2626' : idx === 6 ? '#2563eb' : '#9ca3af',
                    }}
                  >
                    {day}
                  </Text>
                </View>
              ))}
            </View>

            {/* 잔디 그리드 */}
            {grassData.map((week, weekIdx) => (
              <View key={weekIdx} className="flex-row mb-1">
                {week.map((learned, dayIdx) => (
                  <View key={dayIdx} className="flex-1 aspect-square p-0.5">
                    <View
                      className={`flex-1 rounded-sm ${
                        learned ? 'bg-green-500' : 'bg-gray-200'
                      }`}
                    />
                  </View>
                ))}
              </View>
            ))}
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
      {/* 비주얼 */}
      <View className="items-center mb-12">
        <Animated.View
          className="bg-blue-100 rounded-2xl p-6 items-center"
          style={{ transform: [{ scale: scaleAnim }] }}
        >
          <Feather name="trending-up" size={32} color="#2563eb" />
          <Text className="mt-3 text-sm text-blue-600 font-wanted-semibold">
            경제 감각 UP
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

export default EconomyOnboarding;
