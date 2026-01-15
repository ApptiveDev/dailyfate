import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { UserSettings } from '../types/fortune';
import { SafeAreaView } from 'react-native-safe-area-context';

interface Props {
  onSubmit: (settings: UserSettings) => void;
  initialValues?: UserSettings;
  isSubmitting?: boolean;
}

const ITEM_HEIGHT = 36;
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
}> = ({ options, value, onChange, itemTextClassName = 'text-base' }) => {
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
    <View className="flex-1 justify-end bg-black/40 px-5 pb-8">
      <Pressable className="absolute inset-0" onPress={onClose} />
      <View className="rounded-2xl bg-white p-5">
        <View className="mb-4 flex-row items-center justify-between">
          <Text className="text-lg font-extrabold text-gray-900">{title}</Text>
          <Pressable onPress={onClose} hitSlop={10} className="rounded-full px-2 py-1">
            <Text className="text-sm font-semibold text-gray-500">닫기</Text>
          </Pressable>
        </View>
        {children}
        <Pressable className="mt-4 rounded-xl bg-gray-900 py-3" onPress={onClose}>
          <Text className="text-center text-base font-bold text-white">완료</Text>
        </Pressable>
      </View>
    </View>
  </Modal>
);

const UserInfoForm: React.FC<Props> = ({ onSubmit, initialValues, isSubmitting = false }) => {
  const [form, setForm] = useState<UserSettings>(
    initialValues || {
      nickname: '',
      gender: 'other',
      birthdate: '',
      notificationTime: DEFAULT_NOTIFICATION_TIME,
      notificationEnabled: true,
    },
  );
  const [isNotifyModalOpen, setIsNotifyModalOpen] = useState(false);

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

  const isValid = useMemo(() => form.nickname.trim() !== '', [form.nickname]);

  const update = useCallback(
    (patch: Partial<UserSettings>) => setForm((prev) => ({ ...prev, ...patch })),
    [],
  );

  useEffect(() => {
    if (!form.notificationTime.trim()) return;
    const normalizedTime = `${notifyHour}:${notifyMinute}`;
    if (form.notificationTime.trim() !== normalizedTime) {
      update({ notificationTime: normalizedTime });
    }
  }, [form.notificationTime, notifyHour, notifyMinute, update]);

  const notificationSummary = `${notifyHour}:${notifyMinute}`;

  const openNotifyModal = useCallback(() => {
    setIsNotifyModalOpen(true);
    const normalizedTime = `${notifyHour}:${notifyMinute}`;
    if (form.notificationTime.trim() !== normalizedTime) {
      update({ notificationTime: normalizedTime });
    }
  }, [form.notificationTime, notifyHour, notifyMinute, update]);

  const handleSubmit = () => {
    if (!isValid || isSubmitting) return;
    onSubmit(form);
  };

  return (
    <SafeAreaView edges={['top']} className="flex-1 bg-[#FFFBF5]">
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ padding: 32, paddingBottom: 72 }}
        keyboardShouldPersistTaps="handled"
      >
        <View className="gap-8">
          {/* 헤더 */}
          <View className="gap-4">
            <View className="mb-2 h-16 w-16 items-center justify-center rounded-2xl bg-emerald-100">
              <Feather name="camera" size={28} color="#10b981" />
            </View>
            <Text className="text-3xl font-extrabold text-stone-800">
              반가워요!{'\n'}프로필을 설정해주세요
            </Text>
            <Text className="text-lg text-stone-500">
              사진 미션 알림을 받을 닉네임과 시간을 설정해요.
            </Text>
          </View>

          {/* 닉네임 */}
          <View className="gap-3">
            <Text className="text-lg font-bold text-stone-700">닉네임</Text>
            <TextInput
              value={form.nickname}
              onChangeText={(text) => update({ nickname: text })}
              placeholder="사진작가"
              placeholderTextColor="#a8a29e"
              className="rounded-xl bg-white px-4 py-5 text-xl text-stone-800 shadow-sm"
              style={{
                shadowColor: '#000',
                shadowOpacity: 0.05,
                shadowRadius: 8,
                shadowOffset: { width: 0, height: 2 },
              }}
            />
          </View>

          {/* 알림 시간 */}
          <View className="gap-3">
            <Text className="text-lg font-bold text-stone-700">매일 미션 알림</Text>
            <Pressable
              className="flex-row items-center justify-between rounded-xl bg-white px-4 py-4 shadow-sm"
              style={{
                shadowColor: '#000',
                shadowOpacity: 0.05,
                shadowRadius: 8,
                shadowOffset: { width: 0, height: 2 },
              }}
              onPress={openNotifyModal}
            >
              <View className="flex-row items-center">
                <View className="mr-3 h-10 w-10 items-center justify-center rounded-full bg-amber-100">
                  <Feather name="bell" size={18} color="#f59e0b" />
                </View>
                <View>
                  <Text className="text-lg font-semibold text-stone-800">{notificationSummary}</Text>
                  <Text className="text-sm text-stone-400">매일 이 시간에 알림을 보내드려요</Text>
                </View>
              </View>
              <Feather name="chevron-right" size={20} color="#a8a29e" />
            </Pressable>
          </View>

          {/* 안내 */}
          <View className="flex-row items-start rounded-xl bg-stone-100 p-4">
            <Feather name="info" size={16} color="#78716c" style={{ marginTop: 2 }} />
            <Text className="ml-3 flex-1 text-sm leading-5 text-stone-500">
              매일 새로운 사진 주제가 주어져요.{'\n'}
              알림 시간에 오늘의 미션을 확인해보세요!
            </Text>
          </View>

          {/* 시작 버튼 */}
          <Pressable
            className={`mt-4 flex-row items-center justify-center rounded-xl py-4 ${
              isValid && !isSubmitting ? 'bg-stone-800' : 'bg-stone-800/40'
            }`}
            disabled={!isValid || isSubmitting}
            onPress={handleSubmit}
          >
            {isSubmitting ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Text className="text-center text-lg font-extrabold text-white">시작하기</Text>
                <Feather name="arrow-right" size={20} color="#ffffff" style={{ marginLeft: 8 }} />
              </>
            )}
          </Pressable>

          {/* 알림 시간 선택 모달 */}
          <PickerModal
            visible={isNotifyModalOpen}
            title="알림 시간"
            onClose={() => setIsNotifyModalOpen(false)}
          >
            <View className="mb-2 flex-row">
              <Text className="flex-1 text-center text-xs font-semibold text-gray-500">시</Text>
              <Text className="flex-1 text-center text-xs font-semibold text-gray-500">분</Text>
            </View>
            <View className="flex-row items-center">
              <View className="flex-1 items-center">
                <WheelPicker
                  options={hourOptions}
                  value={notifyHour}
                  onChange={(nextHour) =>
                    update({ notificationTime: `${nextHour}:${notifyMinute}` })
                  }
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
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default UserInfoForm;
