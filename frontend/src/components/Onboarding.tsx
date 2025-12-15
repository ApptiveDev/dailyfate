import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';

interface Props {
  onComplete: () => void;
}

const Onboarding: React.FC<Props> = ({ onComplete }) => {
  return (
    <View className="absolute inset-0 z-10 items-center justify-center bg-stone-200 px-5 py-6">
      <View className="w-full max-w-xl rounded-2xl bg-white p-5 shadow-2xl shadow-black/10">
        <View className="items-center space-y-3.5">
          <View className="h-14 w-14 items-center justify-center rounded-full bg-gray-100">
            <Feather name="star" size={26} color="#111827" />
          </View>
          <Text className="text-2xl font-bold text-gray-900">하루 일력</Text>
          <Text className="text-center text-sm leading-5 text-gray-500">
            매일 아침, 종이 일력을 뜯듯 당신의 하루를 확인해보세요.
          </Text>

          <View className="w-full space-y-3 rounded-xl border border-gray-200 bg-gray-50 p-4">
            <GuideItem
              icon="scissors"
              title="다음 날로 넘기기"
              text="상단을 눌러 종이를 뜯듯 내일로 넘어가요."
            />
            <GuideItem
              icon="calendar"
              title="오늘의 총평"
              text="큰 날짜 아래 핵심 운세를 바로 볼 수 있어요."
            />
            <GuideItem
              icon="chevron-down"
              title="상세 운세"
              text="스크롤로 재물·애정·성공운을 확인하세요."
            />
          </View>
        </View>

        <Pressable
          className="mt-5 rounded-xl bg-gray-900 py-3.5 active:opacity-90"
          onPress={onComplete}
          accessibilityLabel="온보딩 완료"
        >
          <Text className="text-center text-lg font-bold text-white">시작하기</Text>
        </Pressable>
      </View>
    </View>
  );
};

const GuideItem = ({
  icon,
  title,
  text,
}: {
  icon: React.ComponentProps<typeof Feather>['name'];
  title: string;
  text: string;
}) => (
  <View className="flex-row space-x-3">
    <Feather name={icon} size={16} color="#6b7280" style={{ marginTop: 2 }} />
    <View className="flex-1">
      <Text className="text-sm font-bold text-gray-900">{title}</Text>
      <Text className="mt-0.5 text-xs leading-5 text-gray-500">{text}</Text>
    </View>
  </View>
);

export default Onboarding;
