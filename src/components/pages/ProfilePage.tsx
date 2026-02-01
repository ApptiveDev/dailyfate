import React, { useMemo } from 'react';
import { Image, Pressable, ScrollView } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import type { PhotoEntry, UserSettings } from '@/types';
import { Box, Text, HStack, VStack, Center, Heading, Card } from '../ui';

interface ProfileStats {
  totalPhotos: number;
  totalStreak: number;
  longestStreak: number;
  joinedMonths: number;
}

interface Props {
  userSettings: UserSettings | null;
  photos: PhotoEntry[];
  onOpenSettings: () => void;
  onSelectPhoto: (photo: PhotoEntry) => void;
}

const ProfilePage: React.FC<Props> = ({
  userSettings,
  photos,
  onOpenSettings,
  onSelectPhoto,
}) => {
  const insets = useSafeAreaInsets();

  // Calculate profile stats
  const stats: ProfileStats = useMemo(() => {
    const totalPhotos = photos.length;

    // Calculate longest streak (consecutive days with photos)
    const sortedDates = [...new Set(photos.map((p) => p.date))].sort();
    let currentStreak = 0;
    let longestStreak = 0;

    for (let i = 0; i < sortedDates.length; i++) {
      if (i === 0) {
        currentStreak = 1;
      } else {
        const prevDate = new Date(sortedDates[i - 1]);
        const currDate = new Date(sortedDates[i]);
        const diffDays = Math.floor(
          (currDate.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24)
        );

        if (diffDays === 1) {
          currentStreak++;
        } else {
          longestStreak = Math.max(longestStreak, currentStreak);
          currentStreak = 1;
        }
      }
    }
    longestStreak = Math.max(longestStreak, currentStreak);

    // Calculate current streak (from today backwards)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    let totalStreak = 0;
    let checkDate = new Date(today);

    while (true) {
      const dateKey = `${checkDate.getFullYear()}-${String(checkDate.getMonth() + 1).padStart(2, '0')}-${String(checkDate.getDate()).padStart(2, '0')}`;
      if (sortedDates.includes(dateKey)) {
        totalStreak++;
        checkDate.setDate(checkDate.getDate() - 1);
      } else {
        break;
      }
    }

    // Calculate how many months since first photo
    const joinedMonths = sortedDates.length > 0
      ? Math.max(1, Math.ceil(
          (today.getTime() - new Date(sortedDates[0]).getTime()) /
            (1000 * 60 * 60 * 24 * 30)
        ))
      : 0;

    return {
      totalPhotos,
      totalStreak,
      longestStreak,
      joinedMonths,
    };
  }, [photos]);

  // Get recent photos (last 6)
  const recentPhotos = useMemo(() => {
    return [...photos]
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 6);
  }, [photos]);

  const nickname = userSettings?.nickname || '사용자';

  return (
    <Box className="flex-1 bg-white">
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 120 }}
      >
        {/* Header */}
        <Box
          className="bg-black px-6"
          style={{ paddingTop: insets.top + 16, paddingBottom: 32 }}
        >
          <HStack className="justify-between items-center mb-8">
            <Heading size="lg" className="text-white font-wanted-bold">
              프로필
            </Heading>
            <Pressable onPress={onOpenSettings} hitSlop={12}>
              <Feather name="settings" size={22} color="#fff" />
            </Pressable>
          </HStack>

          {/* Profile Info */}
          <VStack className="items-center">
            <Center className="w-20 h-20 rounded-full bg-neutral-800 mb-4">
              <Feather name="user" size={32} color="#fff" />
            </Center>
            <Text className="text-white text-xl font-wanted-bold mb-1">
              {nickname}
            </Text>
            <Text className="text-neutral-400 text-sm font-wanted-regular">
              {stats.joinedMonths > 0
                ? `${stats.joinedMonths}개월째 기록 중`
                : '오늘부터 기록을 시작해보세요'}
            </Text>
          </VStack>
        </Box>

        {/* Stats Cards */}
        <Box className="px-6 -mt-4">
          <Card variant="elevated" className="bg-white rounded-2xl p-4">
            <HStack className="justify-between">
              <VStack className="items-center flex-1">
                <Text className="text-neutral-400 text-xs font-wanted-regular mb-1">
                  총 사진
                </Text>
                <Text className="text-black text-2xl font-wanted-bold">
                  {stats.totalPhotos}
                </Text>
                <Text className="text-neutral-400 text-xs font-wanted-regular">
                  장
                </Text>
              </VStack>
              <Box className="w-px h-12 bg-neutral-100 self-center" />
              <VStack className="items-center flex-1">
                <Text className="text-neutral-400 text-xs font-wanted-regular mb-1">
                  현재 연속
                </Text>
                <HStack className="items-center" space="xs">
                  <Feather name="zap" size={18} color="#f59e0b" />
                  <Text className="text-black text-2xl font-wanted-bold">
                    {stats.totalStreak}
                  </Text>
                </HStack>
                <Text className="text-neutral-400 text-xs font-wanted-regular">
                  일
                </Text>
              </VStack>
              <Box className="w-px h-12 bg-neutral-100 self-center" />
              <VStack className="items-center flex-1">
                <Text className="text-neutral-400 text-xs font-wanted-regular mb-1">
                  최장 기록
                </Text>
                <Text className="text-black text-2xl font-wanted-bold">
                  {stats.longestStreak}
                </Text>
                <Text className="text-neutral-400 text-xs font-wanted-regular">
                  일 연속
                </Text>
              </VStack>
            </HStack>
          </Card>
        </Box>

        {/* Recent Photos Section */}
        <Box className="px-6 mt-8">
          <HStack className="justify-between items-center mb-4">
            <Text className="text-black text-lg font-wanted-bold">
              최근 기록
            </Text>
            <Text className="text-neutral-400 text-sm font-wanted-regular">
              {recentPhotos.length}장
            </Text>
          </HStack>

          {recentPhotos.length > 0 ? (
            <Box className="flex-row flex-wrap justify-between">
              {recentPhotos.map((photo) => (
                <Pressable
                  key={photo.id}
                  onPress={() => onSelectPhoto(photo)}
                  style={{
                    width: '32%',
                    aspectRatio: 1,
                    marginBottom: 8,
                    borderRadius: 12,
                    overflow: 'hidden',
                  }}
                >
                  {photo.photoUri.startsWith('dummy://') ? (
                    <Center className="flex-1 bg-neutral-100">
                      <Feather name="image" size={24} color="#a3a3a3" />
                    </Center>
                  ) : (
                    <Image
                      source={{ uri: photo.photoUri }}
                      style={{ width: '100%', height: '100%' }}
                      resizeMode="cover"
                    />
                  )}
                </Pressable>
              ))}
            </Box>
          ) : (
            <Center className="py-12 bg-neutral-50 rounded-2xl">
              <Feather name="camera" size={32} color="#d4d4d4" />
              <Text className="text-neutral-400 text-sm mt-3 font-wanted-regular">
                아직 기록된 사진이 없습니다
              </Text>
              <Text className="text-neutral-300 text-xs mt-1 font-wanted-regular">
                오늘의 미션을 완료해보세요
              </Text>
            </Center>
          )}
        </Box>

        {/* Quick Actions */}
        <Box className="px-6 mt-8">
          <Text className="text-black text-lg font-wanted-bold mb-4">
            빠른 설정
          </Text>

          <Pressable
            onPress={onOpenSettings}
            className="bg-neutral-50 rounded-2xl p-4 mb-3"
          >
            <HStack className="items-center justify-between">
              <HStack className="items-center" space="md">
                <Center className="w-10 h-10 rounded-full bg-white">
                  <Feather name="bell" size={18} color="#000" />
                </Center>
                <VStack>
                  <Text className="text-black font-wanted-semibold">
                    알림 설정
                  </Text>
                  <Text className="text-neutral-400 text-xs font-wanted-regular">
                    미션 알림 시간을 설정하세요
                  </Text>
                </VStack>
              </HStack>
              <Feather name="chevron-right" size={20} color="#a3a3a3" />
            </HStack>
          </Pressable>

          <Pressable
            onPress={onOpenSettings}
            className="bg-neutral-50 rounded-2xl p-4"
          >
            <HStack className="items-center justify-between">
              <HStack className="items-center" space="md">
                <Center className="w-10 h-10 rounded-full bg-white">
                  <Feather name="user" size={18} color="#000" />
                </Center>
                <VStack>
                  <Text className="text-black font-wanted-semibold">
                    프로필 수정
                  </Text>
                  <Text className="text-neutral-400 text-xs font-wanted-regular">
                    닉네임 및 정보를 수정하세요
                  </Text>
                </VStack>
              </HStack>
              <Feather name="chevron-right" size={20} color="#a3a3a3" />
            </HStack>
          </Pressable>
        </Box>
      </ScrollView>
    </Box>
  );
};

export default ProfilePage;
