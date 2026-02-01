import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Linking,
  Modal,
  Pressable,
  ScrollView,
  Switch,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import type { PhotoEntry, UserSettings } from '@/types';
import { Box, Text, HStack, VStack, Center, Heading, Card, Input } from '../ui';

const CONTACT_EMAIL = 'bluebird.happier@gmail.com';
const ITEM_HEIGHT = 48;
const VISIBLE_ITEMS = 5;
const DEFAULT_NOTIFICATION_TIME = '08:00';
const NOTIFICATION_MINUTE_STEP = 5;

const pad2 = (value: number) => String(value).padStart(2, '0');

const parseTimeParts = (value: string, fallback: string) => {
  const [fallbackHour, fallbackMinute] = fallback.split(':');
  const match = value.match(/(\d{1,2}):(\d{1,2})/);
  if (!match) return { hour: fallbackHour, minute: fallbackMinute };
  const hourNumber = Number(match[1]);
  const minuteNumber = Number(match[2]);
  const hour = pad2(hourNumber);
  const minute = pad2(minuteNumber);
  if (
    !Number.isFinite(hourNumber) ||
    !Number.isFinite(minuteNumber) ||
    hourNumber > 23 ||
    minuteNumber > 59
  ) {
    return { hour: fallbackHour, minute: fallbackMinute };
  }
  return { hour, minute };
};

const normalizeMinuteToStep = (minute: string, step: number) => {
  const numeric = Number(minute);
  if (!Number.isFinite(numeric)) return minute;
  const normalized = Math.floor(numeric / step) * step;
  const bounded = Math.min(Math.max(normalized, 0), 59);
  return pad2(bounded);
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

// WheelPicker for time selection
const WheelPicker: React.FC<{
  options: string[];
  value: string;
  onChange: (value: string) => void;
}> = ({ options, value, onChange }) => {
  const scrollRef = useRef<ScrollView | null>(null);
  const padding = ((VISIBLE_ITEMS - 1) / 2) * ITEM_HEIGHT;

  useEffect(() => {
    if (!options.length) return;
    const index = Math.max(0, options.indexOf(value));
    scrollRef.current?.scrollTo({ y: index * ITEM_HEIGHT, animated: false });
  }, [options, value]);

  const handleScrollEnd = (event: { nativeEvent: { contentOffset: { y: number } } }) => {
    if (!options.length) return;
    const offsetY = event.nativeEvent.contentOffset.y;
    const index = Math.round(offsetY / ITEM_HEIGHT);
    const bounded = Math.max(0, Math.min(index, options.length - 1));
    const nextValue = options[bounded];
    if (nextValue !== value) onChange(nextValue);
  };

  return (
    <Box className="overflow-hidden" style={{ height: ITEM_HEIGHT * VISIBLE_ITEMS }}>
      <ScrollView
        ref={scrollRef}
        showsVerticalScrollIndicator={false}
        snapToInterval={ITEM_HEIGHT}
        decelerationRate="fast"
        onMomentumScrollEnd={handleScrollEnd}
        onScrollEndDrag={handleScrollEnd}
        nestedScrollEnabled
        contentContainerStyle={{ paddingVertical: padding }}
      >
        {options.map((option) => {
          const isSelected = option === value;
          return (
            <Center key={option} style={{ height: ITEM_HEIGHT }}>
              <Text
                className={`text-2xl font-semibold ${isSelected ? 'text-white' : 'text-neutral-600'}`}
              >
                {option}
              </Text>
            </Center>
          );
        })}
      </ScrollView>
      <Box
        pointerEvents="none"
        className="absolute left-0 right-0 border-t border-b border-neutral-700"
        style={{ top: padding, height: ITEM_HEIGHT }}
      />
    </Box>
  );
};

// Time Picker Modal
const TimePickerModal: React.FC<{
  visible: boolean;
  onClose: () => void;
  hour: string;
  minute: string;
  onChangeHour: (value: string) => void;
  onChangeMinute: (value: string) => void;
  hourOptions: string[];
  minuteOptions: string[];
}> = ({ visible, onClose, hour, minute, onChangeHour, onChangeMinute, hourOptions, minuteOptions }) => (
  <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
    <Pressable className="flex-1 items-center justify-center bg-black/60" onPress={onClose}>
      <Pressable className="w-80 rounded-3xl bg-neutral-900 p-6" onPress={(e) => e.stopPropagation()}>
        <HStack className="justify-between items-center mb-6">
          <Heading className="text-xl text-white">알림 시간</Heading>
          <Pressable onPress={onClose} hitSlop={12}>
            <Feather name="x" size={24} color="#fff" />
          </Pressable>
        </HStack>

        <HStack className="mb-4">
          <Text className="flex-1 text-center text-sm text-neutral-500">시</Text>
          <Text className="flex-1 text-center text-sm text-neutral-500">분</Text>
        </HStack>

        <HStack>
          <Box className="flex-1">
            <WheelPicker options={hourOptions} value={hour} onChange={onChangeHour} />
          </Box>
          <Box className="flex-1">
            <WheelPicker options={minuteOptions} value={minute} onChange={onChangeMinute} />
          </Box>
        </HStack>

        <Pressable
          onPress={onClose}
          className="mt-6 py-4 rounded-2xl bg-white items-center"
        >
          <Text className="text-base font-semibold text-black">완료</Text>
        </Pressable>
      </Pressable>
    </Pressable>
  </Modal>
);

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

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable className="flex-1 items-center justify-center bg-black/60" onPress={onClose}>
        <Pressable className="w-80 rounded-3xl bg-white p-6" onPress={(e) => e.stopPropagation()}>
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
    </Modal>
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
  const [isTimePickerOpen, setIsTimePickerOpen] = useState(false);
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

  // Time picker options
  const hourOptions = useMemo(() => Array.from({ length: 24 }, (_, i) => pad2(i)), []);
  const minuteOptions = useMemo(
    () => Array.from({ length: 60 / NOTIFICATION_MINUTE_STEP }, (_, i) => pad2(i * NOTIFICATION_MINUTE_STEP)),
    []
  );

  const { hour: notifyHour, minute: notifyMinute } = useMemo(() => {
    const parsed = parseTimeParts(
      localSettings?.notificationTime || DEFAULT_NOTIFICATION_TIME,
      DEFAULT_NOTIFICATION_TIME
    );
    return {
      hour: parsed.hour,
      minute: normalizeMinuteToStep(parsed.minute, NOTIFICATION_MINUTE_STEP),
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
      // Revert on error
      setLocalSettings(localSettings);
    }
  };

  const handleNicknameSave = (newNickname: string) => {
    void updateAndSave({ nickname: newNickname });
  };

  const handleNotificationToggle = (enabled: boolean) => {
    void updateAndSave({ notificationEnabled: enabled });
  };

  const handleTimeChange = (hour: string, minute: string) => {
    void updateAndSave({ notificationTime: `${hour}:${minute}` });
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
              onPress={() => setIsTimePickerOpen(true)}
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

      {/* Time Picker Modal */}
      <TimePickerModal
        visible={isTimePickerOpen}
        onClose={() => setIsTimePickerOpen(false)}
        hour={notifyHour}
        minute={notifyMinute}
        onChangeHour={(h) => handleTimeChange(h, notifyMinute)}
        onChangeMinute={(m) => handleTimeChange(notifyHour, m)}
        hourOptions={hourOptions}
        minuteOptions={minuteOptions}
      />
    </Box>
  );
};

export default ProfilePage;
