import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  Easing,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  useWindowDimensions,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { UserSettings } from '../types/fortune';
import { useAuth } from '@/providers/AuthProvider';
import {
  fetchUserProfile,
  ProfileApiError,
  updateUserProfile,
} from '@/services/userProfileService';
import {
  Box,
  Text,
  Heading,
  VStack,
  HStack,
  Card,
  Input,
  Center,
} from './ui';

interface Props {
  visible: boolean;
  onClose: () => void;
  settings: UserSettings;
  onSave: (settings: UserSettings) => void;
  onLogout: () => void;
  onUnauthorized: () => void;
}

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

const SettingsSheet: React.FC<Props> = ({
  visible,
  onClose,
  settings,
  onSave,
  onLogout,
  onUnauthorized,
}) => {
  const [form, setForm] = useState<UserSettings>(settings);
  const [isFetching, setIsFetching] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isNotifyModalOpen, setIsNotifyModalOpen] = useState(false);
  const { isLoading } = useAuth();
  const isBusy = isFetching || isSaving;
  const { width: windowWidth } = useWindowDimensions();
  const insets = useSafeAreaInsets();

  const translateX = useRef(new Animated.Value(windowWidth)).current;
  const [isRendered, setIsRendered] = useState(visible);

  const { hour: notifyHour, minute: notifyMinute } = useMemo(() => {
    const parsed = parseTimeParts(
      form.notificationTime || DEFAULT_NOTIFICATION_TIME,
      DEFAULT_NOTIFICATION_TIME,
    );
    return {
      hour: parsed.hour,
      minute: normalizeMinuteToStep(parsed.minute, NOTIFICATION_MINUTE_STEP),
    };
  }, [form.notificationTime]);

  const hourOptions = useMemo(() => Array.from({ length: 24 }, (_, i) => pad2(i)), []);
  const minuteOptions = useMemo(
    () => Array.from({ length: 60 / NOTIFICATION_MINUTE_STEP }, (_, i) => pad2(i * NOTIFICATION_MINUTE_STEP)),
    [],
  );

  // Animation: open
  useEffect(() => {
    if (!visible) return;
    setIsRendered(true);
    translateX.setValue(windowWidth);
    Animated.timing(translateX, {
      toValue: 0,
      duration: 300,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [visible, windowWidth, translateX]);

  // Animation: close
  useEffect(() => {
    if (visible || !isRendered) return;
    Animated.timing(translateX, {
      toValue: windowWidth,
      duration: 250,
      easing: Easing.in(Easing.cubic),
      useNativeDriver: true,
    }).start(() => {
      setIsRendered(false);
    });
  }, [visible, isRendered, windowWidth, translateX]);

  // Sync form with settings when opened
  useEffect(() => {
    if (visible) {
      const trimmed = settings.notificationTime.trim();
      const parsed = parseTimeParts(trimmed || DEFAULT_NOTIFICATION_TIME, DEFAULT_NOTIFICATION_TIME);
      const normalizedTime = `${parsed.hour}:${normalizeMinuteToStep(parsed.minute, NOTIFICATION_MINUTE_STEP)}`;
      setForm({
        ...settings,
        notificationTime: trimmed ? normalizedTime : settings.notificationTime,
      });
    }
  }, [visible, settings]);

  // Fetch profile when opened
  useEffect(() => {
    if (!visible) {
      setIsFetching(false);
      setIsNotifyModalOpen(false);
      return;
    }

    let isActive = true;
    setIsFetching(true);

    fetchUserProfile()
      .then((profile) => {
        if (!isActive || !profile) return;
        setForm(profile);
      })
      .catch((error) => {
        if (!isActive) return;
        if (error instanceof ProfileApiError && error.status === 401) {
          Alert.alert('로그인이 필요합니다', '다시 로그인해주세요.');
          onUnauthorized();
          return;
        }
        const message = error instanceof Error ? error.message : '프로필을 불러오지 못했어요.';
        Alert.alert('프로필 조회 실패', message);
      })
      .finally(() => {
        if (!isActive) return;
        setIsFetching(false);
      });

    return () => {
      isActive = false;
    };
  }, [onUnauthorized, visible]);

  const update = (patch: Partial<UserSettings>) => setForm((prev) => ({ ...prev, ...patch }));

  const handleSave = async () => {
    if (isBusy) return;
    setIsSaving(true);
    try {
      const nextSettings = await updateUserProfile(form);
      onSave(nextSettings);
    } catch (error) {
      if (error instanceof ProfileApiError && error.status === 401) {
        Alert.alert('로그인이 필요합니다', '다시 로그인해주세요.');
        onUnauthorized();
        return;
      }
      const message = error instanceof Error ? error.message : '프로필을 저장하지 못했어요.';
      Alert.alert('저장 실패', message);
    } finally {
      setIsSaving(false);
    }
  };

  if (!isRendered) return null;

  return (
    <Modal visible={isRendered} animationType="none" transparent onRequestClose={onClose}>
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <Animated.View
          className="flex-1 bg-white"
          style={{ transform: [{ translateX }] }}
        >
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

              <HStack space="sm" className="items-center">
                <Heading className="text-lg text-black">Settings</Heading>
                {isFetching && <ActivityIndicator size="small" color="#000" />}
              </HStack>

              <Box style={{ width: 40 }} />
            </HStack>
          </Box>

          <ScrollView
            className="flex-1"
            contentContainerStyle={{ paddingBottom: insets.bottom + 40 }}
            showsVerticalScrollIndicator={false}
          >
            {/* Profile Section */}
            <Box className="mx-6 mt-8">
              <Text className="text-xs text-neutral-400 tracking-widest mb-4">PROFILE</Text>

              <Card variant="elevated" className="bg-black p-5 rounded-2xl">
                <VStack space="md">
                  <Text className="text-sm text-neutral-400">닉네임</Text>
                  <Input
                    value={form.nickname}
                    onChangeText={(text) => update({ nickname: text })}
                    placeholder="닉네임을 입력하세요"
                    variant="underlined"
                    size="lg"
                    className="text-white"
                    placeholderTextColor="#666"
                    style={{ color: '#fff', borderBottomColor: '#333' }}
                  />
                </VStack>
              </Card>
            </Box>

            {/* Notification Section */}
            <Box className="mx-6 mt-8">
              <Text className="text-xs text-neutral-400 tracking-widest mb-4">NOTIFICATION</Text>

              <Pressable onPress={() => setIsNotifyModalOpen(true)} disabled={isBusy}>
                <Card variant="outline" className="p-5 rounded-2xl">
                  <HStack className="justify-between items-center">
                    <VStack space="xs">
                      <Text className="text-sm text-neutral-400">미션 알림 시간</Text>
                      <Text className="text-3xl font-light text-black">
                        {notifyHour}:{notifyMinute}
                      </Text>
                    </VStack>
                    <Center className="h-10 w-10 rounded-full bg-neutral-100">
                      <Feather name="chevron-right" size={20} color="#000" />
                    </Center>
                  </HStack>
                </Card>
              </Pressable>
            </Box>

            {/* Save Button */}
            <Box className="mx-6 mt-8">
              <Pressable
                onPress={handleSave}
                disabled={isBusy}
                className="py-5 rounded-2xl bg-black items-center flex-row justify-center"
                style={{ opacity: isBusy ? 0.5 : 1 }}
              >
                {isSaving && <ActivityIndicator size="small" color="#fff" style={{ marginRight: 8 }} />}
                <Text className="text-base font-medium text-white">
                  {isSaving ? '저장 중...' : '저장하기'}
                </Text>
              </Pressable>
            </Box>

            {/* Account Section */}
            <Box className="mx-6 mt-12">
              <Text className="text-xs text-neutral-400 tracking-widest mb-4">ACCOUNT</Text>

              <Pressable
                onPress={onLogout}
                disabled={isLoading}
                className="py-4"
              >
                <HStack space="md" className="items-center">
                  <Center className="h-10 w-10 rounded-full bg-red-50">
                    <Feather name="log-out" size={18} color="#ef4444" />
                  </Center>
                  <Text className="text-base font-medium text-red-500">로그아웃</Text>
                </HStack>
              </Pressable>
            </Box>

            {/* App Info */}
            <Center className="mt-16">
              <Text className="text-xs text-neutral-300">v1.0.0</Text>
            </Center>
          </ScrollView>
        </Animated.View>

        {/* Time Picker Modal */}
        <TimePickerModal
          visible={isNotifyModalOpen}
          onClose={() => setIsNotifyModalOpen(false)}
          hour={notifyHour}
          minute={notifyMinute}
          onChangeHour={(h) => update({ notificationTime: `${h}:${notifyMinute}` })}
          onChangeMinute={(m) => update({ notificationTime: `${notifyHour}:${m}` })}
          hourOptions={hourOptions}
          minuteOptions={minuteOptions}
        />
      </KeyboardAvoidingView>
    </Modal>
  );
};

export default SettingsSheet;
