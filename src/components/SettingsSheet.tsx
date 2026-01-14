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

const ITEM_HEIGHT = 36;
const VISIBLE_ITEMS = 5;
const DEFAULT_NOTIFICATION_TIME = '08:00';
const NOTIFICATION_MINUTE_STEP = 5;
const DEFAULT_BIRTHDATE = '1990-01-01';
const DEFAULT_BIRTH_TIME = '00:00';
const MIN_BIRTH_YEAR = 1900;

const pad2 = (value: number) => String(value).padStart(2, '0');

const splitDateTime = (value: string) => {
  const trimmed = value.trim();
  if (!trimmed) return { datePart: '', timePart: '' };
  if (trimmed.includes('T')) {
    const [datePart, timePart = ''] = trimmed.split('T');
    return { datePart, timePart };
  }
  if (trimmed.includes(' ')) {
    const [datePart, timePart = ''] = trimmed.split(' ');
    return { datePart, timePart };
  }
  return { datePart: trimmed, timePart: '' };
};

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

const getDaysInMonth = (year: number, month: number) => new Date(year, month, 0).getDate();

const parseBirthdateParts = (value: string, fallback: string, maxYear: number) => {
  const fallbackMatch = fallback.match(/(\d{4})-(\d{2})-(\d{2})/);
  const fallbackYearNumber = fallbackMatch ? Number(fallbackMatch[1]) : MIN_BIRTH_YEAR;
  const fallbackMonthNumber = fallbackMatch ? Number(fallbackMatch[2]) : 1;
  const fallbackDayNumber = fallbackMatch ? Number(fallbackMatch[3]) : 1;

  const fallbackYear = Math.min(Math.max(fallbackYearNumber, MIN_BIRTH_YEAR), maxYear);
  const fallbackMonth = Math.min(Math.max(fallbackMonthNumber, 1), 12);
  const fallbackDay = Math.min(
    Math.max(fallbackDayNumber, 1),
    getDaysInMonth(fallbackYear, fallbackMonth),
  );

  const toFallback = () => ({
    year: String(fallbackYear),
    month: pad2(fallbackMonth),
    day: pad2(fallbackDay),
  });

  const match = value.match(/(\d{4})-(\d{1,2})-(\d{1,2})/);
  if (!match) return toFallback();

  const yearNumber = Number(match[1]);
  const monthNumber = Number(match[2]);
  const dayNumber = Number(match[3]);
  if (!Number.isFinite(yearNumber) || !Number.isFinite(monthNumber) || !Number.isFinite(dayNumber)) {
    return toFallback();
  }

  const year = Math.min(Math.max(yearNumber, MIN_BIRTH_YEAR), maxYear);
  const month = Math.min(Math.max(monthNumber, 1), 12);
  const day = Math.min(Math.max(dayNumber, 1), getDaysInMonth(year, month));

  return {
    year: String(year),
    month: pad2(month),
    day: pad2(day),
  };
};

const clampBirthDay = (year: string, month: string, day: string) => {
  const maxDay = getDaysInMonth(Number(year), Number(month));
  const dayNumber = Number(day);
  if (!Number.isFinite(dayNumber)) return pad2(1);
  return pad2(Math.min(Math.max(dayNumber, 1), maxDay));
};

const buildBirthDateTime = (
  year: string,
  month: string,
  day: string,
  hour: string,
  minute: string,
) => {
  const yearNumber = Number(year) || MIN_BIRTH_YEAR;
  const monthNumber = Number(month) || 1;
  const safeDay = clampBirthDay(String(yearNumber), pad2(monthNumber), day);
  const safeHour = pad2(Number(hour) || 0);
  const safeMinute = pad2(Number(minute) || 0);
  return `${yearNumber}-${pad2(monthNumber)}-${safeDay} ${safeHour}:${safeMinute}:00`;
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
    <View className="flex-1 items-center justify-center bg-black/40 px-6">
      <Pressable className="absolute inset-0" onPress={onClose} />
      <View className="w-full max-w-sm rounded-2xl bg-white p-5">
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
  const [isBirthModalOpen, setIsBirthModalOpen] = useState(false);
  const [isBirthTimeModalOpen, setIsBirthTimeModalOpen] = useState(false);
  const { isLoading } = useAuth();
  const isBusy = isFetching || isSaving;
  const currentYear = useMemo(() => new Date().getFullYear(), []);
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

  const { datePart: rawBirthDatePart, timePart: rawBirthTimePart } = useMemo(
    () => splitDateTime(form.birthdate),
    [form.birthdate],
  );
  const birthDatePart = rawBirthDatePart || DEFAULT_BIRTHDATE;
  const birthTimePart = rawBirthTimePart || DEFAULT_BIRTH_TIME;

  const { year: birthYear, month: birthMonth, day: birthDay } = useMemo(
    () =>
      parseBirthdateParts(
        birthDatePart,
        DEFAULT_BIRTHDATE,
        currentYear,
      ),
    [birthDatePart, currentYear],
  );
  const { hour: birthHour, minute: birthMinute } = useMemo(
    () => parseTimeParts(birthTimePart, DEFAULT_BIRTH_TIME),
    [birthTimePart],
  );

  const hourOptions = useMemo(() => Array.from({ length: 24 }, (_, i) => pad2(i)), []);
  const birthMinuteOptions = useMemo(() => Array.from({ length: 60 }, (_, i) => pad2(i)), []);
  const notifyMinuteOptions = useMemo(
    () =>
      Array.from({ length: 60 / NOTIFICATION_MINUTE_STEP }, (_, i) =>
        pad2(i * NOTIFICATION_MINUTE_STEP),
      ),
    [],
  );
  const birthYearOptions = useMemo(
    () =>
      Array.from({ length: currentYear - MIN_BIRTH_YEAR + 1 }, (_, i) =>
        String(currentYear - i),
      ),
    [currentYear],
  );
  const birthMonthOptions = useMemo(() => Array.from({ length: 12 }, (_, i) => pad2(i + 1)), []);
  const birthDayOptions = useMemo(() => {
    const daysInMonth = getDaysInMonth(Number(birthYear), Number(birthMonth));
    return Array.from({ length: daysInMonth }, (_, i) => pad2(i + 1));
  }, [birthMonth, birthYear]);

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
    if (!form.birthdate.trim()) return;
    const normalizedDay = clampBirthDay(birthYear, birthMonth, birthDay);
    if (normalizedDay !== birthDay) {
      setForm((prev) => ({
        ...prev,
        birthdate: buildBirthDateTime(
          birthYear,
          birthMonth,
          normalizedDay,
          birthHour,
          birthMinute,
        ),
      }));
    }
  }, [birthDay, birthMonth, birthYear, birthHour, birthMinute, form.birthdate]);

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
      const trimmedBirthdate = settings.birthdate.trim();
      const normalizedBirthdate = trimmedBirthdate
        ? (() => {
            const { datePart, timePart } = splitDateTime(trimmedBirthdate);
            const parsedBirthdate = parseBirthdateParts(
              datePart || DEFAULT_BIRTHDATE,
              DEFAULT_BIRTHDATE,
              currentYear,
            );
            const parsedTime = parseTimeParts(timePart || DEFAULT_BIRTH_TIME, DEFAULT_BIRTH_TIME);
            return buildBirthDateTime(
              parsedBirthdate.year,
              parsedBirthdate.month,
              parsedBirthdate.day,
              parsedTime.hour,
              parsedTime.minute,
            );
          })()
        : settings.birthdate;
      setForm({
        ...settings,
        notificationTime: trimmed ? normalizedTime : settings.notificationTime,
        birthdate: trimmedBirthdate ? normalizedBirthdate : settings.birthdate,
      });
    }
  }, [visible, settings, currentYear]);

  useEffect(() => {
    if (!visible) {
      setIsFetching(false);
      setIsNotifyModalOpen(false);
      setIsBirthModalOpen(false);
      setIsBirthTimeModalOpen(false);
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
    setIsBirthModalOpen(false);
    setIsBirthTimeModalOpen(false);
    const normalizedTime = `${notifyHour}:${notifyMinute}`;
    if (form.notificationTime.trim() !== normalizedTime) {
      update({ notificationTime: normalizedTime });
    }
  };

  const openBirthModal = () => {
    setIsBirthModalOpen(true);
    setIsBirthTimeModalOpen(false);
    setIsNotifyModalOpen(false);
    if (!form.birthdate.trim()) {
      update({
        birthdate: buildBirthDateTime(birthYear, birthMonth, birthDay, birthHour, birthMinute),
      });
    }
  };

  const openBirthTimeModal = () => {
    setIsBirthTimeModalOpen(true);
    setIsBirthModalOpen(false);
    setIsNotifyModalOpen(false);
    if (!form.birthdate.trim()) {
      update({
        birthdate: buildBirthDateTime(birthYear, birthMonth, birthDay, birthHour, birthMinute),
      });
    }
  };

  const birthDateSummary = `${birthYear}-${birthMonth}-${birthDay}`;
  const birthTimeSummary = `${birthHour}:${birthMinute}`;
  const hasBirthdate = form.birthdate.trim() !== '';

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
            className="absolute bottom-0 right-0 top-0 gap-4 rounded-l-2xl border-l border-gray-200 bg-white px-4"
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
            <View className="flex-row items-center justify-between py-2">
              <View className="flex-row items-center space-x-2">
                <Text className="text-lg font-extrabold text-gray-900">설정</Text>
                {isFetching && <ActivityIndicator size="small" color="#6b7280" />}
              </View>
              <Pressable
                onPress={onClose}
                hitSlop={12}
                className="rounded-full p-2 active:opacity-70"
              >
                <Feather name="x" size={22} color="#6b7280" />
              </Pressable>
            </View>

            <View className="gap-4">
              <Text className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                내 정보
              </Text>
              <View className="overflow-hidden rounded-xl border border-gray-200 bg-white">
                <Row label="닉네임" divider>
                  <TextInput
                    value={form.nickname}
                    onChangeText={(text) => update({ nickname: text })}
                    placeholder="입력해주세요"
                    placeholderTextColor="#d1d5db"
                    className="min-w-[120] text-right text-[15px] text-gray-900"
                  />
                </Row>
                <Row label="생년월일" divider>
                  <Pressable
                    onPress={openBirthModal}
                    disabled={isBusy}
                    className={`flex-row items-center space-x-2 ${
                      isBusy ? 'opacity-60' : 'active:opacity-70'
                    }`}
                  >
                    <Text
                      className={`text-[15px] font-semibold ${
                        hasBirthdate ? 'text-gray-900' : 'text-gray-400'
                      }`}
                    >
                      {hasBirthdate ? birthDateSummary : 'YYYY-MM-DD'}
                    </Text>
                    <Feather name="chevron-down" size={16} color="#9ca3af" />
                  </Pressable>
                </Row>
                <Row label="출생시간">
                  <Pressable
                    onPress={openBirthTimeModal}
                    disabled={isBusy}
                    className={`flex-row items-center space-x-2 ${
                      isBusy ? 'opacity-60' : 'active:opacity-70'
                    }`}
                  >
                    <Text
                      className={`text-[15px] font-semibold ${
                        hasBirthdate ? 'text-gray-900' : 'text-gray-400'
                      }`}
                    >
                      {hasBirthdate ? birthTimeSummary : 'HH:MM'}
                    </Text>
                    <Feather name="chevron-down" size={16} color="#9ca3af" />
                  </Pressable>
                </Row>
              </View>
            </View>

            <View className="gap-4">
              <Text className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                알림
              </Text>
              <View className="overflow-hidden rounded-xl border border-gray-200 bg-white">
                <Row label="알림 시간">
                  <Pressable
                    onPress={openNotifyModal}
                    disabled={isBusy}
                    className={`flex-row items-center space-x-2 ${
                      isBusy ? 'opacity-60' : 'active:opacity-70'
                    }`}
                  >
                    <Text className="text-[15px] font-semibold text-gray-900">
                      {`${notifyHour}:${notifyMinute}`}
                    </Text>
                    <Feather name="chevron-down" size={16} color="#9ca3af" />
                  </Pressable>
                </Row>
              </View>
            </View>

            <Pressable
              className={`rounded-xl py-3.5 active:opacity-90 ${
                isBusy ? 'bg-gray-900/60' : 'bg-gray-900'
              }`}
              onPress={handleSave}
              disabled={isBusy}
            >
              <View className="flex-row items-center justify-center space-x-2">
                {isSaving && <ActivityIndicator size="small" color="#fff" />}
                <Text className="text-center text-lg font-extrabold text-white">저장하기</Text>
              </View>
            </Pressable>

            <View className="gap-4">
              <Text className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                계정
              </Text>
              <Pressable
                className="rounded-xl border border-rose-200 bg-rose-50 py-3.5 active:opacity-90"
                onPress={handleLogout}
                disabled={isLoading}
              >
                <Text className="text-center text-base font-bold text-rose-600">로그아웃</Text>
              </Pressable>
            </View>
          </Animated.View>
        </View>

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

        <PickerModal
          visible={isBirthModalOpen}
          title="생년월일"
          onClose={() => setIsBirthModalOpen(false)}
        >
          <View className="mb-2 flex-row">
            <Text className="flex-1 text-center text-xs font-semibold text-gray-500">년</Text>
            <Text className="flex-1 text-center text-xs font-semibold text-gray-500">월</Text>
            <Text className="flex-1 text-center text-xs font-semibold text-gray-500">일</Text>
          </View>
          <View className="flex-row items-center">
            <View className="flex-1 items-center">
              <WheelPicker
                options={birthYearOptions}
                value={birthYear}
                onChange={(nextYear) => {
                  const nextDay = clampBirthDay(nextYear, birthMonth, birthDay);
                  update({
                    birthdate: buildBirthDateTime(
                      nextYear,
                      birthMonth,
                      nextDay,
                      birthHour,
                      birthMinute,
                    ),
                  });
                }}
                itemTextClassName="text-sm"
              />
            </View>
            <View className="flex-1 items-center">
              <WheelPicker
                options={birthMonthOptions}
                value={birthMonth}
                onChange={(nextMonth) => {
                  const nextDay = clampBirthDay(birthYear, nextMonth, birthDay);
                  update({
                    birthdate: buildBirthDateTime(
                      birthYear,
                      nextMonth,
                      nextDay,
                      birthHour,
                      birthMinute,
                    ),
                  });
                }}
              />
            </View>
            <View className="flex-1 items-center">
              <WheelPicker
                options={birthDayOptions}
                value={birthDay}
                onChange={(nextDay) => {
                  update({
                    birthdate: buildBirthDateTime(
                      birthYear,
                      birthMonth,
                      nextDay,
                      birthHour,
                      birthMinute,
                    ),
                  });
                }}
              />
            </View>
          </View>
        </PickerModal>

        <PickerModal
          visible={isBirthTimeModalOpen}
          title="출생시간"
          onClose={() => setIsBirthTimeModalOpen(false)}
        >
          <View className="mb-2 flex-row">
            <Text className="flex-1 text-center text-xs font-semibold text-gray-500">시</Text>
            <Text className="flex-1 text-center text-xs font-semibold text-gray-500">분</Text>
          </View>
          <View className="flex-row items-center">
            <View className="flex-1 items-center">
              <WheelPicker
                options={hourOptions}
                value={birthHour}
                onChange={(nextHour) =>
                  update({
                    birthdate: buildBirthDateTime(
                      birthYear,
                      birthMonth,
                      birthDay,
                      nextHour,
                      birthMinute,
                    ),
                  })
                }
              />
            </View>
            <View className="flex-1 items-center">
              <WheelPicker
                options={birthMinuteOptions}
                value={birthMinute}
                onChange={(nextMinute) =>
                  update({
                    birthdate: buildBirthDateTime(
                      birthYear,
                      birthMonth,
                      birthDay,
                      birthHour,
                      nextMinute,
                    ),
                  })
                }
              />
            </View>
          </View>
        </PickerModal>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const Row: React.FC<{ label: string; children: React.ReactNode; divider?: boolean }> = ({
  label,
  children,
  divider,
}) => (
  <View className={`flex-row items-center px-4 py-3 ${divider ? 'border-b border-gray-200' : ''}`}>
    <Text className="text-[15px] font-semibold text-gray-900">{label}</Text>
    <View className="flex-1 items-end">{children}</View>
  </View>
);

export default SettingsSheet;
