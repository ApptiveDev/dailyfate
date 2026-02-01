import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Linking,
  Platform,
  Pressable,
  ScrollView,
  Switch,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';

import type { PhotoEntry, UserSettings } from '@/types';
import { Box, Text, HStack, VStack, Center, Heading, Card, Input } from '../ui';

const CONTACT_EMAIL = 'bluebird.happier@gmail.com';
const DEFAULT_NOTIFICATION_TIME = '08:00';
const NOTIFICATION_MINUTE_STEP = 5;

const pad2 = (value: number) => String(value).padStart(2, '0');

const parseTimeParts = (value: string, fallback: string) => {
  const [fallbackHour, fallbackMinute] = fallback.split(':');
  const match = value.match(/(\d{1,2}):(\d{1,2})/);
  if (!match) return { hour: Number(fallbackHour), minute: Number(fallbackMinute) };
  const hourNumber = Number(match[1]);
  const minuteNumber = Number(match[2]);
  if (
    !Number.isFinite(hourNumber) ||
    !Number.isFinite(minuteNumber) ||
    hourNumber > 23 ||
    minuteNumber > 59
  ) {
    return { hour: Number(fallbackHour), minute: Number(fallbackMinute) };
  }
  return { hour: hourNumber, minute: minuteNumber };
};

const normalizeMinuteToStep = (minute: number, step: number) => {
  const normalized = Math.floor(minute / step) * step;
  return Math.min(Math.max(normalized, 0), 59);
};

interface ProfileStats {
  totalPhotos: number;
  totalStreak: number;
  longestStreak: number;
  joinedMonths: number;
}

interface Props {
  userSettings: UserSettings | null;
  photos: PhotoEntry[];
  onSelectPhoto: (photo: PhotoEntry) => void;
  onSaveSettings: (settings: UserSettings) => Promise<void>;
  onLogout: () => void;
  onDeleteAccount: () => void;
  isSaving?: boolean;
}

// Nickname Edit Modal
const NicknameEditModal: React.FC<{
  visible: boolean;
  onClose: () => void;
  nickname: string;
  onSave: (nickname: string) => void;
}> = ({ visible, onClose, nickname, onSave }) => {
  const [value, setValue] = useState(nickname);

  useEffect(() => {
    if (visible) setValue(nickname);
  }, [visible, nickname]);

  const handleSave = () => {
    if (value.trim()) {
      onSave(value.trim());
      onClose();
    }
  };

  if (!visible) return null;

  return (
    <Pressable
      className="absolute inset-0 items-center justify-center bg-black/60"
      onPress={onClose}
      style={{ zIndex: 100 }}
    >
      <Pressable
        className="w-80 rounded-3xl bg-white p-6"
        onPress={(e) => e.stopPropagation()}
      >
        <HStack className="justify-between items-center mb-6">
          <Heading className="text-xl text-black">닉네임 수정</Heading>
          <Pressable onPress={onClose} hitSlop={12}>
            <Feather name="x" size={24} color="#000" />
          </Pressable>
        </HStack>

        <Input
          value={value}
          onChangeText={setValue}
          placeholder="닉네임을 입력하세요"
          className="border border-neutral-200 rounded-xl px-4 py-3 text-base"
          autoFocus
        />

        <Pressable
          onPress={handleSave}
          disabled={!value.trim()}
          className="mt-6 py-4 rounded-2xl bg-black items-center"
          style={{ opacity: value.trim() ? 1 : 0.5 }}
        >
          <Text className="text-base font-semibold text-white">저장</Text>
        </Pressable>
      </Pressable>
    </Pressable>
  );
};

const ProfilePage: React.FC<Props> = ({
  userSettings,
  photos,
  onSelectPhoto,
  onSaveSettings,
  onLogout,
  onDeleteAccount,
  isSaving = false,
}) => {
  const insets = useSafeAreaInsets();
  const [isNicknameModalOpen, setIsNicknameModalOpen] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [localSettings, setLocalSettings] = useState<UserSettings | null>(userSettings);

  // Sync local settings when userSettings changes
  useEffect(() => {
    setLocalSettings(userSettings);
  }, [userSettings]);

  // Calculate profile stats
  const stats: ProfileStats = useMemo(() => {
    const totalPhotos = photos.length;
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

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    let totalStreak = 0;
    const checkDate = new Date(today);

    while (true) {
      const dateKey = `${checkDate.getFullYear()}-${String(checkDate.getMonth() + 1).padStart(2, '0')}-${String(checkDate.getDate()).padStart(2, '0')}`;
      if (sortedDates.includes(dateKey)) {
        totalStreak++;
        checkDate.setDate(checkDate.getDate() - 1);
      } else {
        break;
      }
    }

    const joinedMonths = sortedDates.length > 0
      ? Math.max(1, Math.ceil(
          (today.getTime() - new Date(sortedDates[0]).getTime()) /
            (1000 * 60 * 60 * 24 * 30)
        ))
      : 0;

    return { totalPhotos, totalStreak, longestStreak, joinedMonths };
  }, [photos]);

  // Get recent photos (last 6)
  const recentPhotos = useMemo(() => {
    return [...photos]
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 6);
  }, [photos]);

  // Parse notification time for display and picker
  const { notifyHour, notifyMinute, timePickerDate } = useMemo(() => {
    const parsed = parseTimeParts(
      localSettings?.notificationTime || DEFAULT_NOTIFICATION_TIME,
      DEFAULT_NOTIFICATION_TIME
    );
    const normalizedMinute = normalizeMinuteToStep(parsed.minute, NOTIFICATION_MINUTE_STEP);

    const date = new Date();
    date.setHours(parsed.hour, normalizedMinute, 0, 0);

    return {
      notifyHour: pad2(parsed.hour),
      notifyMinute: pad2(normalizedMinute),
      timePickerDate: date,
    };
  }, [localSettings?.notificationTime]);

  const nickname = localSettings?.nickname || '사용자';

  // Handlers
  const updateAndSave = async (patch: Partial<UserSettings>) => {
    if (!localSettings) return;
    const updated = { ...localSettings, ...patch };
    setLocalSettings(updated);
    try {
      await onSaveSettings(updated);
    } catch {
      setLocalSettings(localSettings);
    }
  };

  const handleNicknameSave = (newNickname: string) => {
    void updateAndSave({ nickname: newNickname });
  };

  const handleNotificationToggle = (enabled: boolean) => {
    void updateAndSave({ notificationEnabled: enabled });
  };

  const handleTimeChange = (event: DateTimePickerEvent, selectedDate?: Date) => {
    if (Platform.OS === 'android') {
      setShowTimePicker(false);
    }

    if (event.type === 'set' && selectedDate) {
      const hours = selectedDate.getHours();
      const minutes = normalizeMinuteToStep(selectedDate.getMinutes(), NOTIFICATION_MINUTE_STEP);
      void updateAndSave({ notificationTime: `${pad2(hours)}:${pad2(minutes)}` });
    }
  };

  const handleLogout = () => {
    Alert.alert('로그아웃', '정말 로그아웃하시겠습니까?', [
      { text: '취소', style: 'cancel' },
      { text: '로그아웃', style: 'destructive', onPress: onLogout },
    ]);
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      '회원탈퇴',
      '정말 탈퇴하시겠습니까?\n모든 데이터가 삭제되며 복구할 수 없습니다.',
      [
        { text: '취소', style: 'cancel' },
        { text: '탈퇴', style: 'destructive', onPress: onDeleteAccount },
      ]
    );
  };

  const handleContactEmail = () => {
    Linking.openURL(`mailto:${CONTACT_EMAIL}`).catch(() => {
      Alert.alert('이메일 앱을 열 수 없습니다', `문의: ${CONTACT_EMAIL}`);
    });
  };

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
            <Heading className="text-xl text-white font-wanted-bold">
              프로필
            </Heading>
            {isSaving && <ActivityIndicator size="small" color="#fff" />}
          </HStack>

          {/* Profile Info */}
          <Pressable onPress={() => setIsNicknameModalOpen(true)}>
            <VStack className="items-center">
              <Center className="w-20 h-20 rounded-full bg-neutral-800 mb-4">
                <Feather name="user" size={32} color="#fff" />
              </Center>
              <HStack className="items-center" space="xs">
                <Text className="text-white text-xl font-wanted-bold">
                  {nickname}
                </Text>
                <Feather name="edit-2" size={14} color="#666" />
              </HStack>
              <Text className="text-neutral-400 text-sm font-wanted-regular mt-1">
                {stats.joinedMonths > 0
                  ? `${stats.joinedMonths}개월째 기록 중`
                  : '오늘부터 기록을 시작해보세요'}
              </Text>
            </VStack>
          </Pressable>
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
            </Center>
          )}
        </Box>

        {/* Notification Settings */}
        <Box className="px-6 mt-8">
          <Text className="text-black text-lg font-wanted-bold mb-4">
            알림 설정
          </Text>

          {/* Notification Toggle */}
          <Box className="bg-neutral-50 rounded-2xl p-4 mb-3">
            <HStack className="items-center justify-between">
              <HStack className="items-center" space="md">
                <Center className="w-10 h-10 rounded-full bg-white">
                  <Feather name="bell" size={18} color="#000" />
                </Center>
                <VStack>
                  <Text className="text-black font-wanted-semibold">
                    미션 알림
                  </Text>
                  <Text className="text-neutral-400 text-xs font-wanted-regular">
                    매일 미션 알림을 받습니다
                  </Text>
                </VStack>
              </HStack>
              <Switch
                value={localSettings?.notificationEnabled ?? false}
                onValueChange={handleNotificationToggle}
                trackColor={{ false: '#e5e5e5', true: '#000' }}
                thumbColor="#fff"
              />
            </HStack>
          </Box>

          {/* Notification Time */}
          {localSettings?.notificationEnabled && (
            <Pressable
              onPress={() => setShowTimePicker(true)}
              className="bg-neutral-50 rounded-2xl p-4"
            >
              <HStack className="items-center justify-between">
                <HStack className="items-center" space="md">
                  <Center className="w-10 h-10 rounded-full bg-white">
                    <Feather name="clock" size={18} color="#000" />
                  </Center>
                  <VStack>
                    <Text className="text-black font-wanted-semibold">
                      알림 시간
                    </Text>
                    <Text className="text-neutral-400 text-xs font-wanted-regular">
                      설정한 시간에 알림을 보내드려요
                    </Text>
                  </VStack>
                </HStack>
                <HStack className="items-center" space="xs">
                  <Text className="text-black text-lg font-wanted-bold">
                    {notifyHour}:{notifyMinute}
                  </Text>
                  <Feather name="chevron-right" size={20} color="#a3a3a3" />
                </HStack>
              </HStack>
            </Pressable>
          )}
        </Box>

        {/* Support Section */}
        <Box className="px-6 mt-8">
          <Text className="text-black text-lg font-wanted-bold mb-4">
            고객 지원
          </Text>

          <Pressable
            onPress={handleContactEmail}
            className="bg-neutral-50 rounded-2xl p-4"
          >
            <HStack className="items-center justify-between">
              <HStack className="items-center" space="md">
                <Center className="w-10 h-10 rounded-full bg-white">
                  <Feather name="mail" size={18} color="#000" />
                </Center>
                <VStack>
                  <Text className="text-black font-wanted-semibold">
                    문의하기
                  </Text>
                  <Text className="text-neutral-400 text-xs font-wanted-regular">
                    {CONTACT_EMAIL}
                  </Text>
                </VStack>
              </HStack>
              <Feather name="external-link" size={18} color="#a3a3a3" />
            </HStack>
          </Pressable>
        </Box>

        {/* Account Section */}
        <Box className="px-6 mt-8">
          <Text className="text-black text-lg font-wanted-bold mb-4">
            계정
          </Text>

          <Pressable
            onPress={handleLogout}
            className="bg-neutral-50 rounded-2xl p-4 mb-3"
          >
            <HStack className="items-center" space="md">
              <Center className="w-10 h-10 rounded-full bg-red-50">
                <Feather name="log-out" size={18} color="#ef4444" />
              </Center>
              <Text className="text-red-500 font-wanted-semibold">
                로그아웃
              </Text>
            </HStack>
          </Pressable>

          <Pressable
            onPress={handleDeleteAccount}
            className="bg-neutral-50 rounded-2xl p-4"
          >
            <HStack className="items-center" space="md">
              <Center className="w-10 h-10 rounded-full bg-red-50">
                <Feather name="user-x" size={18} color="#ef4444" />
              </Center>
              <Text className="text-red-500 font-wanted-semibold">
                회원탈퇴
              </Text>
            </HStack>
          </Pressable>
        </Box>

        {/* App Info */}
        <Center className="mt-12">
          <Text className="text-neutral-300 text-xs">DailyFate v1.0.0</Text>
        </Center>
      </ScrollView>

      {/* Nickname Edit Modal */}
      <NicknameEditModal
        visible={isNicknameModalOpen}
        onClose={() => setIsNicknameModalOpen(false)}
        nickname={nickname}
        onSave={handleNicknameSave}
      />

      {/* Native Time Picker */}
      {showTimePicker && (
        Platform.OS === 'ios' ? (
          <Box className="absolute inset-0 justify-end bg-black/40" style={{ zIndex: 100 }}>
            <Pressable className="flex-1" onPress={() => setShowTimePicker(false)} />
            <Box className="bg-white rounded-t-3xl">
              <HStack className="justify-between items-center px-6 py-4 border-b border-neutral-100">
                <Pressable onPress={() => setShowTimePicker(false)}>
                  <Text className="text-neutral-500 text-base">취소</Text>
                </Pressable>
                <Text className="text-black text-lg font-wanted-bold">알림 시간</Text>
                <Pressable onPress={() => setShowTimePicker(false)}>
                  <Text className="text-black text-base font-wanted-semibold">완료</Text>
                </Pressable>
              </HStack>
              <Box className="items-center pb-8">
                <DateTimePicker
                  value={timePickerDate}
                  mode="time"
                  display="spinner"
                  onChange={handleTimeChange}
                  minuteInterval={NOTIFICATION_MINUTE_STEP}
                  locale="ko-KR"
                  style={{ height: 200 }}
                />
              </Box>
            </Box>
          </Box>
        ) : (
          <DateTimePicker
            value={timePickerDate}
            mode="time"
            display="spinner"
            onChange={handleTimeChange}
            minuteInterval={NOTIFICATION_MINUTE_STEP}
          />
        )
      )}
    </Box>
  );
};

export default ProfilePage;
