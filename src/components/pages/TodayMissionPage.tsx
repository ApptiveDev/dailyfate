import React from 'react';
import { Dimensions, Pressable } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MissionData, MonthlyStats, PhotoEntry } from '@/types/fortune';
import {
  Box,
  Text,
  VStack,
  HStack,
  Center,
} from '../ui';

interface Props {
  date: Date;
  mission: MissionData | null;
  todayPhoto: PhotoEntry | null;
  stats: MonthlyStats | null;
  loading: boolean;
  onOpenCamera: () => void;
  onOpenGallery: () => void;
  onViewPhoto: () => void;
}

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

const TodayMissionPage: React.FC<Props> = ({
  date = new Date(),
  mission,
  todayPhoto,
  loading,
  onOpenCamera,
  onViewPhoto,
}) => {
  const insets = useSafeAreaInsets();

  const WEEKDAY_KR = ['일', '월', '화', '수', '목', '금', '토'];
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const weekday = date.getDay();

  // Split height
  const topHeight = SCREEN_HEIGHT * 0.52;
  const bottomHeight = SCREEN_HEIGHT - topHeight;

  return (
    <Box className="flex-1">
      {/* Upper Section - Black */}
      <Box
        style={{
          height: topHeight,
          paddingTop: insets.top,
          backgroundColor: '#000000'
        }}
        className="px-8"
      >
        {/* Header */}
        <HStack className="items-center justify-between pt-4">
          <Feather name="command" size={28} color="#FFFFFF" />
          <Box style={{ width: 24 }} />
        </HStack>

        {/* Mission Text Area */}
        <Box className="flex-1 justify-center pb-12">
          {loading ? (
            <Text className="text-2xl text-neutral-500 font-wanted-regular">Loading...</Text>
          ) : (
            <VStack space="xs">
              <Text className="text-[32px] font-wanted-bold text-neutral-400 leading-tight">
                {month}월 {day}일 ({WEEKDAY_KR[weekday]})
              </Text>
              <Text className="text-[42px] font-wanted-bold text-white leading-[48px]">
                {mission?.theme || 'Capture your\nDaily Life'}
              </Text>
            </VStack>
          )}
        </Box>
      </Box>

      {/* Lower Section - White */}
      <Box
        style={{
          height: bottomHeight,
          backgroundColor: '#FFFFFF'
        }}
        className="px-8"
      >
        <Text className="text-neutral-300 font-wanted-bold text-xs tracking-[2px] uppercase mt-8">
          {todayPhoto ? 'COMPLETED' : 'MISSION'}
        </Text>

        <Center className="flex-1" style={{ marginBottom: 100 }}>
          {todayPhoto ? (
            <Pressable onPress={onViewPhoto}>
              <Box
                className="items-center justify-center rounded-full bg-black shadow-xl"
                style={{ width: 200, height: 200 }}
              >
                <Feather name="check" size={80} color="#FFFFFF" />
              </Box>
            </Pressable>
          ) : (
            <Pressable onPress={onOpenCamera}>
              <Box
                className="items-center justify-center rounded-full bg-black shadow-2xl"
                style={{ width: 200, height: 200 }}
              >
                <Feather name="plus" size={100} color="#FFFFFF" />
              </Box>
            </Pressable>
          )}
        </Center>
      </Box>
    </Box>
  );
};

export default TodayMissionPage;
