import React, { useMemo } from 'react';
import { Alert, Image, Pressable, ScrollView, Share } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import type { MonthlyStats, PhotoEntry } from '@/types';
import { Box, Text, HStack, VStack, Center, Heading, Button, Card } from '../ui';

// Monthly colors based on CLAUDE.md design system
const MONTH_COLORS: Record<number, string> = {
  1: '#E5EBF0',
  2: '#E8F0E8',
  3: '#D8EAD4',
  4: '#D5E5D8',
  5: '#D8E8D0',
  6: '#F0E8D0',
  7: '#EDE4D4',
  8: '#E8E4D8',
  9: '#E8E0D8',
  10: '#E5DCD4',
  11: '#E2DDD8',
  12: '#DCE4EB',
};

interface Props {
  year: number;
  month: number;
  photos: PhotoEntry[];
  stats: MonthlyStats;
  onClose: () => void;
  onSelectPhoto: (photo: PhotoEntry) => void;
}

const MonthlyAlbumDetailPage: React.FC<Props> = ({
  year,
  month,
  photos,
  stats,
  onClose,
  onSelectPhoto,
}) => {
  const insets = useSafeAreaInsets();
  const backgroundColor = MONTH_COLORS[month] || '#f5f5f5';

  // Calculate achievement rate
  const achievementRate = useMemo(() => {
    if (stats.totalDays === 0) return 0;
    return Math.round((stats.completedDays / stats.totalDays) * 100);
  }, [stats]);

  // Sort photos by date
  const sortedPhotos = useMemo(() => {
    return [...photos].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );
  }, [photos]);

  // Calculate grid layout (max 6 columns)
  const gridColumns = useMemo(() => {
    const count = sortedPhotos.length;
    if (count <= 4) return 2;
    if (count <= 9) return 3;
    return 4;
  }, [sortedPhotos.length]);

  const handleShare = async () => {
    try {
      await Share.share({
        message: `${year}년 ${month}월 DailyFate 앨범\n\n📊 미션 완료: ${stats.completedDays}/${stats.totalDays}일\n🎯 달성률: ${achievementRate}%\n⚡ 최장 연속: ${stats.longestStreak}일`,
      });
    } catch {
      Alert.alert('공유 실패', '공유할 수 없습니다.');
    }
  };

  const handleSave = () => {
    // TODO: Implement actual save to gallery using expo-media-library
    Alert.alert('저장', '앨범 저장 기능은 준비 중입니다.');
  };

  return (
    <Box className="flex-1" style={{ backgroundColor }}>
      {/* Header */}
      <Box
        className="px-6"
        style={{ paddingTop: insets.top + 16 }}
      >
        <HStack className="justify-between items-center mb-4">
          <Pressable onPress={onClose} hitSlop={12}>
            <Feather name="arrow-left" size={24} color="#000" />
          </Pressable>
          <VStack className="items-center">
            <Text className="text-neutral-500 text-xs font-wanted-regular">
              {year}년
            </Text>
            <Heading className="text-xl font-wanted-bold">
              {month}월 앨범
            </Heading>
          </VStack>
          <Pressable onPress={handleShare} hitSlop={12}>
            <Feather name="share" size={22} color="#000" />
          </Pressable>
        </HStack>
      </Box>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 120 }}
      >
        {/* Photo Collage */}
        <Box className="px-6 mt-4">
          <Card variant="elevated" className="bg-white rounded-3xl p-4 overflow-hidden">
            {sortedPhotos.length > 0 ? (
              <Box className="flex-row flex-wrap">
                {sortedPhotos.map((photo, index) => {
                  const widthPercent = `${100 / gridColumns}%` as const;
                  return (
                    <Pressable
                      key={photo.id}
                      onPress={() => onSelectPhoto(photo)}
                      style={{
                        width: widthPercent as unknown as number,
                        aspectRatio: 1,
                        padding: 2,
                      }}
                    >
                      <Box className="flex-1 rounded-lg overflow-hidden">
                        {photo.photoUri.startsWith('dummy://') ? (
                          <Center className="flex-1 bg-neutral-100">
                            <Text className="text-neutral-400 text-xs font-wanted-semibold">
                              {index + 1}
                            </Text>
                          </Center>
                        ) : (
                          <Image
                            source={{ uri: photo.photoUri }}
                            style={{ width: '100%', height: '100%' }}
                            resizeMode="cover"
                          />
                        )}
                      </Box>
                    </Pressable>
                  );
                })}
              </Box>
            ) : (
              <Center className="py-20">
                <Feather name="image" size={48} color="#d4d4d4" />
                <Text className="text-neutral-400 mt-4 font-wanted-regular">
                  이 달에는 아직 사진이 없습니다
                </Text>
              </Center>
            )}
          </Card>
        </Box>

        {/* Stats Section */}
        <Box className="px-6 mt-8">
          <Text className="text-black text-lg font-wanted-bold mb-4">
            📊 통계
          </Text>

          <Card variant="elevated" className="bg-white rounded-2xl p-5">
            <VStack space="lg">
              {/* Mission Completion */}
              <HStack className="justify-between items-center">
                <HStack className="items-center" space="md">
                  <Center className="w-10 h-10 rounded-full bg-green-50">
                    <Feather name="check-circle" size={20} color="#22c55e" />
                  </Center>
                  <Text className="text-neutral-600 font-wanted-regular">
                    미션 완료
                  </Text>
                </HStack>
                <HStack className="items-baseline" space="xs">
                  <Text className="text-black text-xl font-wanted-bold">
                    {stats.completedDays}
                  </Text>
                  <Text className="text-neutral-400 font-wanted-regular">
                    /{stats.totalDays}일
                  </Text>
                </HStack>
              </HStack>

              {/* Success Rate */}
              <HStack className="justify-between items-center">
                <HStack className="items-center" space="md">
                  <Center className="w-10 h-10 rounded-full bg-blue-50">
                    <Feather name="target" size={20} color="#3b82f6" />
                  </Center>
                  <Text className="text-neutral-600 font-wanted-regular">
                    달성률
                  </Text>
                </HStack>
                <Text className="text-black text-xl font-wanted-bold">
                  {achievementRate}%
                </Text>
              </HStack>

              {/* Achievement Progress Bar */}
              <Box className="h-2 bg-neutral-100 rounded-full overflow-hidden">
                <Box
                  className="h-full bg-black rounded-full"
                  style={{ width: `${achievementRate}%` }}
                />
              </Box>

              {/* Longest Streak */}
              <HStack className="justify-between items-center">
                <HStack className="items-center" space="md">
                  <Center className="w-10 h-10 rounded-full bg-amber-50">
                    <Feather name="zap" size={20} color="#f59e0b" />
                  </Center>
                  <Text className="text-neutral-600 font-wanted-regular">
                    최장 연속
                  </Text>
                </HStack>
                <HStack className="items-baseline" space="xs">
                  <Text className="text-black text-xl font-wanted-bold">
                    {stats.longestStreak}
                  </Text>
                  <Text className="text-neutral-400 font-wanted-regular">
                    일
                  </Text>
                </HStack>
              </HStack>

              {/* Current Streak */}
              <HStack className="justify-between items-center">
                <HStack className="items-center" space="md">
                  <Center className="w-10 h-10 rounded-full bg-purple-50">
                    <Feather name="trending-up" size={20} color="#8b5cf6" />
                  </Center>
                  <Text className="text-neutral-600 font-wanted-regular">
                    현재 연속
                  </Text>
                </HStack>
                <HStack className="items-baseline" space="xs">
                  <Text className="text-black text-xl font-wanted-bold">
                    {stats.streak}
                  </Text>
                  <Text className="text-neutral-400 font-wanted-regular">
                    일
                  </Text>
                </HStack>
              </HStack>
            </VStack>
          </Card>
        </Box>

        {/* Photo List by Date */}
        {sortedPhotos.length > 0 && (
          <Box className="px-6 mt-8">
            <Text className="text-black text-lg font-wanted-bold mb-4">
              📅 날짜별 기록
            </Text>

            <VStack space="sm">
              {sortedPhotos.map((photo) => {
                const date = new Date(photo.date);
                const dayOfWeek = ['일', '월', '화', '수', '목', '금', '토'][date.getDay()];

                return (
                  <Pressable
                    key={photo.id}
                    onPress={() => onSelectPhoto(photo)}
                  >
                    <Card variant="elevated" className="bg-white rounded-xl p-3">
                      <HStack className="items-center" space="md">
                        <Box
                          className="rounded-lg overflow-hidden"
                          style={{ width: 56, height: 56 }}
                        >
                          {photo.photoUri.startsWith('dummy://') ? (
                            <Center className="flex-1 bg-neutral-100">
                              <Feather name="image" size={20} color="#a3a3a3" />
                            </Center>
                          ) : (
                            <Image
                              source={{ uri: photo.photoUri }}
                              style={{ width: '100%', height: '100%' }}
                              resizeMode="cover"
                            />
                          )}
                        </Box>
                        <VStack className="flex-1">
                          <Text className="text-black font-wanted-semibold">
                            {date.getDate()}일 ({dayOfWeek})
                          </Text>
                          {photo.caption && (
                            <Text
                              className="text-neutral-400 text-sm font-wanted-regular"
                              numberOfLines={1}
                            >
                              {photo.caption}
                            </Text>
                          )}
                        </VStack>
                        <Feather name="chevron-right" size={18} color="#d4d4d4" />
                      </HStack>
                    </Card>
                  </Pressable>
                );
              })}
            </VStack>
          </Box>
        )}
      </ScrollView>

      {/* Bottom Actions */}
      <Box
        className="absolute left-0 right-0 px-6"
        style={{ bottom: insets.bottom + 24 }}
      >
        <Button
          onPress={handleSave}
          className="bg-black rounded-full py-4"
        >
          <HStack className="items-center justify-center" space="sm">
            <Feather name="download" size={18} color="#fff" />
            <Text className="text-white font-wanted-semibold">
              앨범 저장하기
            </Text>
          </HStack>
        </Button>
      </Box>
    </Box>
  );
};

export default MonthlyAlbumDetailPage;
