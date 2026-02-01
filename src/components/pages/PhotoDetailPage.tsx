import React from 'react';
import { Dimensions, Image, Pressable, ScrollView } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MissionData, PhotoEntry } from '@/types/fortune';
import {
  Box,
  Text,
  Heading,
  VStack,
  HStack,
  Center,
  Card,
} from '../ui';

interface Props {
  photo: PhotoEntry;
  mission: MissionData | null;
  onClose: () => void;
  onDelete: () => void;
  onShare: () => void;
}

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const WEEKDAY_KR = ['일', '월', '화', '수', '목', '금', '토'];
const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June',
                     'July', 'August', 'September', 'October', 'November', 'December'];

const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  const year = date.getFullYear();
  const month = date.getMonth();
  const day = date.getDate();
  const weekday = date.getDay();

  return {
    year,
    month,
    day,
    weekday: WEEKDAY_KR[weekday],
    monthName: MONTH_NAMES[month],
  };
};

const PhotoDetailPage: React.FC<Props> = ({
  photo,
  mission,
  onClose,
  onDelete,
  onShare,
}) => {
  const insets = useSafeAreaInsets();
  const dateInfo = formatDate(photo.date);

  const isDummyPhoto = photo.photoUri.startsWith('dummy://');

  return (
    <Box className="flex-1 bg-white">
      {/* Header */}
      <Box className="px-6" style={{ paddingTop: insets.top + 16 }}>
        <HStack className="justify-between items-center">
          <Pressable
            onPress={onClose}
            hitSlop={16}
            className="h-10 w-10 items-center justify-center rounded-full bg-black"
          >
            <Feather name="arrow-left" size={18} color="#fff" />
          </Pressable>

          <Heading className="text-lg text-black">
            {dateInfo.monthName.slice(0, 3)} {dateInfo.day}
          </Heading>

          <HStack space="sm">
            <Pressable
              onPress={onShare}
              hitSlop={16}
              className="h-10 w-10 items-center justify-center rounded-full bg-neutral-100"
            >
              <Feather name="share" size={18} color="#000" />
            </Pressable>
            <Pressable
              onPress={onDelete}
              hitSlop={16}
              className="h-10 w-10 items-center justify-center rounded-full bg-red-50"
            >
              <Feather name="trash-2" size={18} color="#ef4444" />
            </Pressable>
          </HStack>
        </HStack>
      </Box>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: insets.bottom + 40 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Photo */}
        <Box className="mx-6 mt-6">
          {isDummyPhoto ? (
            <Center
              className="rounded-2xl bg-neutral-100"
              style={{
                width: SCREEN_WIDTH - 48,
                height: SCREEN_WIDTH - 48,
              }}
            >
              <Feather name="image" size={48} color="#ccc" />
              <Text className="mt-2 text-neutral-400 text-sm">
                더미 이미지
              </Text>
            </Center>
          ) : (
            <Box
              className="rounded-2xl overflow-hidden"
              style={{
                width: SCREEN_WIDTH - 48,
                height: SCREEN_WIDTH - 48,
              }}
            >
              <Image
                source={{ uri: photo.photoUri }}
                style={{ width: '100%', height: '100%' }}
                resizeMode="cover"
              />
            </Box>
          )}
        </Box>

        {/* Mission */}
        {mission && (
          <Card variant="elevated" className="mx-6 mt-6 bg-black p-5 rounded-2xl">
            <VStack space="xs" className="items-start">
              <Text className="text-xs text-neutral-500 tracking-widest font-wanted-semibold">MISSION</Text>
              <Heading className="text-left text-lg text-white font-wanted-bold">
                {mission.theme}
              </Heading>
              {mission.seasonTag && (
                <Box className="mt-2 px-3 py-1 rounded-full bg-neutral-800">
                  <Text className="text-xs text-neutral-400">{mission.seasonTag}</Text>
                </Box>
              )}
            </VStack>
          </Card>
        )}

        {/* Caption */}
        {photo.caption && (
          <Card variant="outline" className="mx-6 mt-4 p-5 rounded-2xl">
            <Text className="text-base leading-6 text-neutral-600">
              {photo.caption}
            </Text>
          </Card>
        )}

        {/* Meta Info */}
        <Box className="mx-6 mt-8">
          <HStack className="justify-between items-center">
            <HStack space="sm" className="items-center">
              <Center className="h-8 w-8 rounded-full bg-neutral-100">
                <Feather name="calendar" size={14} color="#666" />
              </Center>
              <Text className="text-sm text-neutral-500">
                {dateInfo.year}.{String(dateInfo.month + 1).padStart(2, '0')}.{String(dateInfo.day).padStart(2, '0')} ({dateInfo.weekday})
              </Text>
            </HStack>

            <Text className="text-sm text-neutral-400">
              {new Date(photo.createdAt).toLocaleTimeString('ko-KR', {
                hour: '2-digit',
                minute: '2-digit',
              })}
            </Text>
          </HStack>
        </Box>
      </ScrollView>
    </Box>
  );
};

export default PhotoDetailPage;
