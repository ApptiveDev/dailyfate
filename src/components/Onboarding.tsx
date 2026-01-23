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
import { ContentType, CONTENT_CATEGORIES } from '../types/content';

type LoginMode = 'signIn' | 'signUp';

interface OnboardingProps {
  onComplete: (mode: LoginMode, selectedContent: ContentType) => void;
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

interface Step3SelectableProps extends StepProps {
  phoneWidth: number;
  phoneHeight: number;
  selectedContent: ContentType;
  onSelectContent: (type: ContentType) => void;
}

interface Step5Props extends StepProps {
  onComplete: (mode: LoginMode) => void;
}

const Onboarding: React.FC<OnboardingProps> = ({ onComplete }) => {
  const { width } = useWindowDimensions();
  const phoneWidth = Math.min(width * 0.74, 310);
  const phoneHeight = Math.round(phoneWidth * 1.68);
  const [activeIndex, setActiveIndex] = useState(0);
  const [selectedContent, setSelectedContent] = useState<ContentType>('fortune');

  const handleComplete = (mode: LoginMode) => {
    onComplete(mode, selectedContent);
  };

  const steps = [
    {
      key: 'intro',
      render: () => (
        <Step1Visual
          title={'매일 한 장씩 넘기는\n나만의 일력'}
          description={
            '매일 아침 일력을 뜯는 설렘을 담았습니다.\n운세, 명언, 사자성어 등 원하는 콘텐츠로 하루를 시작하세요!'
          }
        />
      ),
    },
    {
      key: 'tear',
      render: () => (
        <Step2Visual
          title={'뜯어서 확인하는\n오늘의 한마디'}
          description={'일력 상단을 드래그하여 일력을 뜯으면\n오늘의 메시지를 확인할 수 있어요.'}
          phoneWidth={phoneWidth}
          phoneHeight={phoneHeight}
        />
      ),
    },
    {
      key: 'category',
      render: () => (
        <Step3Selectable
          title={'나만의 콘텐츠\n직접 선택'}
          description={
            '운세, 역사 속 오늘, 사자성어, 동기부여 문구 등\n원하는 카테고리를 선택할 수 있어요.'
          }
          phoneWidth={phoneWidth}
          phoneHeight={phoneHeight}
          selectedContent={selectedContent}
          onSelectContent={setSelectedContent}
        />
      ),
    },
    {
      key: 'tap',
      render: () => (
        <Step4Visual
          title={'가볍게 탭!\n지난 일력 확인'}
          description={
            '왼쪽 영역을 탭하면 하루씩 과거로 이동해요.\n오른쪽 영역을 탭하면 하루씩 오늘 방향으로 돌아올 수 있어요.'
          }
          phoneWidth={phoneWidth}
          phoneHeight={phoneHeight}
        />
      ),
    },
    {
      key: 'lock',
      render: () => (
        <Step5Visual
          title={'오늘까지만\n확인할 수 있어요'}
          description={'일력은 오늘까지 제공돼요.\n내일의 일력은 내일 확인하세요!'}
          onComplete={handleComplete}
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

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const MockCalendar: React.FC<{
  day?: number;
  fullHeight?: boolean;
  className?: string;
}> = ({ day = 14, fullHeight = false, className = '' }) => (
  <View className={`w-full ${fullHeight ? 'flex-1' : 'px-4 pt-4'} ${className}`}>
    <View className="h-8 w-full rounded-t-sm border-b-2 border-dashed border-gray-100 bg-white items-center justify-center">
      <View className="absolute left-4 h-2 w-2 rounded-full bg-gray-200" />
      <View className="absolute right-4 h-2 w-2 rounded-full bg-gray-200" />
    </View>
    <View className="w-full flex-1 rounded-b-sm bg-white p-4">
      <View className="w-full flex-row justify-between">
        <Text className="text-[12px] font-bold text-gray-300">2024</Text>
        <Text className="text-[12px] font-bold text-gray-300">MAY</Text>
      </View>
      <View className="mt-12 w-full items-center">
        <Text
          className={`text-[120px] font-bold text-center ${
            day % 7 === 0 ? 'text-red-500' : 'text-[#191F28]'
          }`}
        >
          {day}
        </Text>
      </View>
      <View className="mt-12 items-center gap-4">
        <View className="h-2 w-32 rounded-full bg-gray-100 " />
        <View className="h-2 w-20 rounded-full bg-gray-100" />
      </View>
      <View className="mt-48 h-px w-full bg-gray-200" />
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
  const guideAnim = useRef(new Animated.Value(0)).current;
  const [trackWidth, setTrackWidth] = useState(0);

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(guideAnim, {
          toValue: 1,
          duration: 2400,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.delay(600),
      ]),
    );
    animation.start();
    return () => {
      animation.stop();
    };
  }, [guideAnim]);

  const travel = Math.max(trackWidth - 80, 0);
  const translateX = guideAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, travel],
  });
  const opacity = guideAnim.interpolate({
    inputRange: [0, 0.1, 0.9, 1],
    outputRange: [0, 1, 1, 0],
  });

  const handleTrackLayout = (event: LayoutChangeEvent) => {
    setTrackWidth(event.nativeEvent.layout.width);
  };

  return (
    <View className="flex-1 items-center justify-center px-8">
      <StepText title={title} description={description} />
      <PhoneMockup width={phoneWidth} height={phoneHeight}>
        <View
          className="h-20 bg-gray-50 border-b-2 border-dashed border-gray-200 justify-center"
          onLayout={handleTrackLayout}
        >
          <Animated.View
            pointerEvents="none"
            style={{
              position: 'absolute',
              left: 16,
              bottom: -28,
              transform: [{ translateX }],
              opacity,
            }}
          >
            <View className="h-16 w-16 items-center justify-center rounded-full border border-black/10 bg-black/5">
              <Feather name="mouse-pointer" size={22} color="rgba(0,0,0,0.45)" />
            </View>
          </Animated.View>
        </View>
        <View className="flex-1 items-center px-6 pt-6">
          <View className="w-full flex-row justify-between">
            <Text className="text-xs font-bold text-gray-300">2024</Text>
            <Text className="text-xs font-bold text-gray-300">MAY</Text>
          </View>
          <Text className="mt-10 text-[120px] font-bold text-gray-300 opacity-30">14</Text>
          <View className="mt-12 w-full items-center space-y-3">
            <View className="h-2.5 w-full max-w-[200px] rounded-full bg-gray-200 my-2" />
            <View className="h-2.5 w-3/4 max-w-[150px] rounded-full bg-gray-200 my-2" />
          </View>
        </View>
      </PhoneMockup>
    </View>
  );
};

const Step3Selectable: React.FC<Step3SelectableProps> = ({
  title,
  description,
  phoneWidth,
  phoneHeight,
  selectedContent,
  onSelectContent,
}) => {
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

  const selectedScale = pulseAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.02],
  });

  return (
    <View className="flex-1 items-center justify-center px-8">
      <StepText title={title} description={description} />
      <PhoneMockup width={phoneWidth} height={phoneHeight}>
        <View className="flex-1 bg-white px-4 pt-6">
          <Text className="text-center text-[13px] font-bold text-gray-400 mb-4">
            오늘의 콘텐츠 선택
          </Text>
          <View className="gap-3">
            {CONTENT_CATEGORIES.map((cat) => {
              const isSelected = cat.type === selectedContent;
              return (
                <Pressable key={cat.type} onPress={() => onSelectContent(cat.type)}>
                  <Animated.View
                    style={isSelected ? { transform: [{ scale: selectedScale }] } : undefined}
                  >
                    <View
                      className={`flex-row items-center px-4 py-3.5 rounded-2xl ${
                        isSelected ? 'bg-[#191F28]' : 'bg-gray-50 border border-gray-100'
                      }`}
                    >
                      <Text className="text-[20px] mr-3">{cat.icon}</Text>
                      <Text
                        className={`text-[15px] font-semibold flex-1 ${
                          isSelected ? 'text-white' : 'text-gray-600'
                        }`}
                      >
                        {cat.label}
                      </Text>
                      {isSelected && <Feather name="check" size={18} color="white" />}
                    </View>
                  </Animated.View>
                </Pressable>
              );
            })}
          </View>
          <View className="mt-6 items-center">
            <Text className="text-[11px] text-gray-300">설정에서 언제든 변경할 수 있어요</Text>
          </View>
        </View>
      </PhoneMockup>
    </View>
  );
};

const Step4Visual: React.FC<PhoneStepProps> = ({ title, description, phoneWidth, phoneHeight }) => {
  const leftPulse = useRef(new Animated.Value(0)).current;
  const rightPulse = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(leftPulse, {
          toValue: 1,
          duration: 1800,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(leftPulse, {
          toValue: 0,
          duration: 1800,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
      ]),
    );
    animation.start();
    return () => {
      animation.stop();
    };
  }, [leftPulse]);

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(rightPulse, {
          toValue: 1,
          duration: 1800,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.delay(600),
        Animated.timing(rightPulse, {
          toValue: 0,
          duration: 1800,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
      ]),
    );
    animation.start();
    return () => {
      animation.stop();
    };
  }, [rightPulse]);

  const leftOpacity = leftPulse.interpolate({
    inputRange: [0, 1],
    outputRange: [0.35, 0.65],
  });

  const rightOpacity = rightPulse.interpolate({
    inputRange: [0, 1],
    outputRange: [0.55, 0.3],
  });

  return (
    <View className="flex-1 items-center justify-center px-8">
      <StepText title={title} description={description} />
      <PhoneMockup width={phoneWidth} height={phoneHeight}>
        <View className="flex-1 bg-white">
          <View className="h-20 bg-gray-50 border-b-2 border-dashed border-gray-200" />
          <View className="flex-1 items-center px-6 pt-6">
            <View className="w-full flex-row justify-between">
              <Text className="text-xs font-bold text-gray-300">2024</Text>
              <Text className="text-xs font-bold text-gray-300">MAY</Text>
            </View>
            <Text className="mt-2 text-[120px] font-bold text-gray-300 opacity-30">14</Text>
            <View className="mt-12 w-full items-center gap-3">
              <View className="h-2.5 w-full max-w-[200px] rounded-full bg-gray-200" />
              <View className="h-2.5 w-3/4 max-w-[150px] rounded-full bg-gray-200" />
            </View>
          </View>
          <View className="absolute inset-0 flex-row">
            <Animated.View
              style={{ opacity: leftOpacity }}
              className="flex-1 border-r-2 border-dashed border-blue-200/50 bg-blue-500/15 items-center justify-center gap-4"
            >
              <View className="rounded-full bg-blue-500/10 px-4 py-2">
                <Text className="text-[11px] font-black tracking-[0.2em] text-blue-500/70">
                  BACK
                </Text>
              </View>
              <Feather name="arrow-left" size={30} color="#bfdbfe" />
            </Animated.View>
            <Animated.View
              style={{ opacity: rightOpacity }}
              className="flex-1 bg-emerald-500/15 items-center justify-center gap-4"
            >
              <View className="rounded-full bg-emerald-500/10 px-4 py-2">
                <Text className="text-[11px] font-black tracking-[0.2em] text-emerald-500/70">
                  NEXT
                </Text>
              </View>
              <Feather name="arrow-right" size={30} color="#bbf7d0" />
            </Animated.View>
          </View>
        </View>
      </PhoneMockup>
    </View>
  );
};

const Step5Visual: React.FC<Step5Props> = ({ title, description, onComplete }) => {
  const insets = useSafeAreaInsets();
  const bottomPadding = Math.max(insets.bottom, 16);

  return (
    <View className="flex-1 bg-white">
      <View className="flex-1 items-center justify-center px-8">
        <StepText title={title} description={description} />
        <View className="items-center justify-center">
          <View className="absolute h-32 w-32 rounded-full" />
          <View className="h-32 w-32 items-center justify-center rounded-[40px] border border-gray-100 bg-white shadow-xl">
            <Feather name="lock" size={44} color="#191F28" />
          </View>
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
