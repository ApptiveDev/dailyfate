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
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from 'react-native';
import { UserSettings } from '../types/fortune';
import { Feather } from '@expo/vector-icons';
import { useAuth } from '@/providers/AuthProvider';
import {
  fetchUserProfile,
  ProfileApiError,
  updateUserProfile,
} from '@/services/userProfileService';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface Props {
  visible: boolean;
  onClose: () => void;
  settings: UserSettings;
  onSave: (settings: UserSettings) => void;
  onLogout: () => void;
  onUnauthorized: () => void;
}

const ITEM_HEIGHT = 40;
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
  itemTextClassName?: string;
}> = ({ options, value, onChange, itemTextClassName = 'text-lg' }) => {
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
    <View className="overflow-hidden" style={{ height: ITEM_HEIGHT * VISIBLE_ITEMS }}>
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
            <View
              key={option}
              style={{ height: ITEM_HEIGHT }}
              className="items-center justify-center"
            >
              <Text
                className={`${isSelected ? 'text-gray-900' : 'text-gray-400'} ${itemTextClassName} `}
              >
                {option}
              </Text>
            </View>
          );
        })}
      </ScrollView>
      <View
        pointerEvents="none"
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          top: padding,
          height: ITEM_HEIGHT,
          borderTopWidth: 1,
          borderBottomWidth: 1,
          borderColor: '#e5e7eb',
        }}
      />
    </View>
  );
};

const PickerModal: React.FC<{
  visible: boolean;
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}> = ({ visible, title, onClose, children }) => (
  <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
    <View className="flex-1 items-center justify-center bg-black/40 px-6">
      <Pressable className="absolute inset-0" onPress={onClose} />
      <View className="w-full max-w-sm rounded-2xl bg-white p-6">
        <View className="mb-5 flex-row items-center justify-between">
          <Text className="text-xl font-extrabold text-gray-900">{title}</Text>
          <Pressable onPress={onClose} hitSlop={10} className="rounded-full px-2 py-1">
            <Text className="text-base font-semibold text-gray-500">닫기</Text>
          </Pressable>
        </View>
        {children}
        <Pressable className="mt-5 rounded-xl bg-gray-900 py-3.5" onPress={onClose}>
          <Text className="text-center text-lg font-bold text-white">완료</Text>
        </Pressable>
      </View>
    </View>
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
  const panelWidth = Math.min(windowWidth * 0.88, 420);
  const panelTranslateX = useRef(new Animated.Value(panelWidth)).current;
  const overlayOpacity = useRef(new Animated.Value(0)).current;
  const [isRendered, setIsRendered] = useState(visible);
  const panelWidthRef = useRef(panelWidth);

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
  const notifyMinuteOptions = useMemo(
    () =>
      Array.from({ length: 60 / NOTIFICATION_MINUTE_STEP }, (_, i) =>
        pad2(i * NOTIFICATION_MINUTE_STEP),
      ),
    [],
  );

  useEffect(() => {
    panelWidthRef.current = panelWidth;
    if (!visible && !isRendered) {
      panelTranslateX.setValue(panelWidth);
      overlayOpacity.setValue(0);
    }
  }, [panelWidth, isRendered, overlayOpacity, panelTranslateX, visible]);

  useEffect(() => {
    if (!visible) return;
    setIsRendered(true);
    panelTranslateX.setValue(panelWidthRef.current);
    overlayOpacity.setValue(0);
    Animated.parallel([
      Animated.timing(panelTranslateX, {
        toValue: 0,
        duration: 240,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(overlayOpacity, {
        toValue: 1,
        duration: 240,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();
  }, [visible, overlayOpacity, panelTranslateX]);

  useEffect(() => {
    if (visible || !isRendered) return;
    Animated.parallel([
      Animated.timing(panelTranslateX, {
        toValue: panelWidthRef.current,
        duration: 200,
        easing: Easing.in(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(overlayOpacity, {
        toValue: 0,
        duration: 200,
        easing: Easing.in(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start(() => {
      setIsRendered(false);
    });
  }, [visible, isRendered, overlayOpacity, panelTranslateX]);

  useEffect(() => {
    if (visible) {
      const trimmed = settings.notificationTime.trim();
      const parsed = parseTimeParts(
        trimmed || DEFAULT_NOTIFICATION_TIME,
        DEFAULT_NOTIFICATION_TIME,
      );
      const normalizedTime = `${parsed.hour}:${normalizeMinuteToStep(
        parsed.minute,
        NOTIFICATION_MINUTE_STEP,
      )}`;
      setForm({
        ...settings,
        notificationTime: trimmed ? normalizedTime : settings.notificationTime,
      });
    }
  }, [visible, settings]);

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

  const openNotifyModal = () => {
    setIsNotifyModalOpen(true);
    const normalizedTime = `${notifyHour}:${notifyMinute}`;
    if (form.notificationTime.trim() !== normalizedTime) {
      update({ notificationTime: normalizedTime });
    }
  };

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

  const handleLogout = () => {
    onLogout();
  };

  const insets = useSafeAreaInsets();

  if (!isRendered) return null;

  return (
    <Modal visible={isRendered} animationType="none" transparent onRequestClose={onClose}>
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View className="flex-1">
          <Animated.View
            pointerEvents="none"
            className="absolute inset-0 bg-black/40"
            style={{ opacity: overlayOpacity }}
          />
          <Pressable
            className="absolute inset-0"
            onPress={onClose}
            accessibilityLabel="설정 닫기"
          />

          <Animated.View
            className="absolute bottom-0 right-0 top-0 rounded-l-2xl border-l border-stone-200 bg-[#FFFBF5]"
            style={[
              {
                width: panelWidth,
                paddingTop: insets.top + 8,
                paddingBottom: 24 + insets.bottom,
                transform: [{ translateX: panelTranslateX }],
                shadowColor: '#000',
                shadowOpacity: 0.14,
                shadowRadius: 18,
                shadowOffset: { width: -6, height: 0 },
                elevation: 12,
              },
            ]}
          >
            <ScrollView className="flex-1 px-5" showsVerticalScrollIndicator={false}>
              {/* 헤더 */}
              <View className="flex-row items-center justify-between py-3">
                <View className="flex-row items-center space-x-2">
                  <Text className="text-xl font-extrabold text-stone-800">설정</Text>
                  {isFetching && <ActivityIndicator size="small" color="#78716c" />}
                </View>
                <Pressable
                  onPress={onClose}
                  hitSlop={12}
                  className="rounded-full p-2 active:opacity-70"
                >
                  <Feather name="x" size={22} color="#78716c" />
                </Pressable>
              </View>

              {/* 프로필 섹션 */}
              <View className="mt-4 gap-4">
                <Text className="text-sm font-semibold uppercase tracking-wide text-stone-400">
                  내 프로필
                </Text>
                <View className="overflow-hidden rounded-xl bg-white shadow-sm">
                  <View className="flex-row items-center px-4 py-4 border-b border-stone-100">
                    <View className="mr-3 h-10 w-10 items-center justify-center rounded-full bg-emerald-100">
                      <Feather name="user" size={18} color="#10b981" />
                    </View>
                    <View className="flex-1">
                      <Text className="text-sm text-stone-400">닉네임</Text>
                      <TextInput
                        value={form.nickname}
                        onChangeText={(text) => update({ nickname: text })}
                        placeholder="입력해주세요"
                        placeholderTextColor="#d1d5db"
                        className="text-base font-semibold text-stone-700"
                      />
                    </View>
                  </View>
                </View>
              </View>

              {/* 알림 섹션 */}
              <View className="mt-6 gap-4">
                <Text className="text-sm font-semibold uppercase tracking-wide text-stone-400">
                  알림
                </Text>
                <Pressable
                  onPress={openNotifyModal}
                  disabled={isBusy}
                  className="overflow-hidden rounded-xl bg-white shadow-sm"
                >
                  <View className="flex-row items-center justify-between px-4 py-4">
                    <View className="flex-row items-center">
                      <View className="mr-3 h-10 w-10 items-center justify-center rounded-full bg-amber-100">
                        <Feather name="bell" size={18} color="#f59e0b" />
                      </View>
                      <View>
                        <Text className="text-sm text-stone-400">미션 알림 시간</Text>
                        <Text className="text-base font-semibold text-stone-700">
                          {`${notifyHour}:${notifyMinute}`}
                        </Text>
                      </View>
                    </View>
                    <Feather name="chevron-right" size={20} color="#a8a29e" />
                  </View>
                </Pressable>
              </View>

              {/* 저장 버튼 */}
              <Pressable
                className={`mt-6 flex-row items-center justify-center rounded-xl py-4 ${
                  isBusy ? 'bg-stone-700' : 'bg-stone-800'
                }`}
                onPress={handleSave}
                disabled={isBusy}
              >
                {isSaving && <ActivityIndicator size="small" color="#fff" style={{ marginRight: 8 }} />}
                <Text className="text-center text-lg font-extrabold text-white">저장하기</Text>
              </Pressable>

              {/* 계정 섹션 */}
              <View className="mt-8 gap-4">
                <Text className="text-sm font-semibold uppercase tracking-wide text-stone-400">
                  계정
                </Text>
                <Pressable
                  className="flex-row items-center justify-center rounded-xl border border-rose-200 bg-rose-50 py-4"
                  onPress={handleLogout}
                  disabled={isLoading}
                >
                  <Feather name="log-out" size={18} color="#e11d48" />
                  <Text className="ml-2 text-center text-base font-bold text-rose-600">로그아웃</Text>
                </Pressable>
              </View>

              {/* 앱 정보 */}
              <View className="mt-8 items-center pb-4">
                <Text className="text-xs text-stone-300">사진 미션 일력 v1.0.0</Text>
              </View>
            </ScrollView>
          </Animated.View>
        </View>

        {/* 알림 시간 선택 모달 */}
        <PickerModal
          visible={isNotifyModalOpen}
          title="알림 시간"
          onClose={() => setIsNotifyModalOpen(false)}
        >
          <View className="mb-3 flex-row">
            <Text className="flex-1 text-center text-sm font-semibold text-gray-500">시</Text>
            <Text className="flex-1 text-center text-sm font-semibold text-gray-500">분</Text>
          </View>
          <View className="flex-row items-center">
            <View className="flex-1 items-center">
              <WheelPicker
                options={hourOptions}
                value={notifyHour}
                onChange={(nextHour) => update({ notificationTime: `${nextHour}:${notifyMinute}` })}
              />
            </View>
            <View className="flex-1 items-center">
              <WheelPicker
                options={notifyMinuteOptions}
                value={notifyMinute}
                onChange={(nextMinute) =>
                  update({ notificationTime: `${notifyHour}:${nextMinute}` })
                }
              />
            </View>
          </View>
        </PickerModal>
      </KeyboardAvoidingView>
    </Modal>
  );
};

export default SettingsSheet;
