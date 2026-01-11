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
import { Gender, UserSettings } from '../types/fortune';
import { SafeAreaView } from 'react-native-safe-area-context';

interface Props {
  onSubmit: (settings: UserSettings) => void;
  initialValues?: UserSettings;
  isSubmitting?: boolean;
}

const genderOptions: { val: Gender; label: string }[] = [
  { val: 'male', label: '남성' },
  { val: 'female', label: '여성' },
];

const ITEM_HEIGHT = 36;
const VISIBLE_ITEMS = 5;
const DEFAULT_NOTIFICATION_TIME = '08:00';
const DEFAULT_BIRTH_TIME = '00:00';
const NOTIFICATION_MINUTE_STEP = 5;

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

const parseDateParts = (value: string) => {
  const [yearRaw, monthRaw, dayRaw] = value.split('-');
  const now = new Date();
  const fallback = {
    year: String(now.getFullYear()),
    month: pad2(now.getMonth() + 1),
    day: pad2(now.getDate()),
  };
  if (!yearRaw || !monthRaw || !dayRaw) return fallback;
  const year = yearRaw.trim();
  const month = pad2(Number(monthRaw));
  const day = pad2(Number(dayRaw));
  if (!Number(year) || !Number(month) || !Number(day)) return fallback;
  return { year, month, day };
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

const buildBirthdate = (year: string, month: string, day: string) => {
  const yearNum = Number(year);
  const monthNum = Number(month);
  const dayNum = Number(day);
  if (!yearNum || !monthNum || !dayNum) {
    return `${year}-${month}-${day}`;
  }
  const maxDay = getDaysInMonth(yearNum, monthNum);
  const safeDay = pad2(Math.min(Math.max(dayNum, 1), maxDay));
  return `${yearNum}-${pad2(monthNum)}-${safeDay}`;
};

const buildBirthDateTime = (
  year: string,
  month: string,
  day: string,
  hour: string,
  minute: string,
) => {
  const datePart = buildBirthdate(year, month, day);
  const safeHour = pad2(Number(hour) || 0);
  const safeMinute = pad2(Number(minute) || 0);
  return `${datePart} ${safeHour}:${safeMinute}:00`;
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

const DatePickerModal: React.FC<{
  visible: boolean;
  title: string;
  onClose: () => void;
  year: string;
  month: string;
  day: string;
  yearOptions: string[];
  monthOptions: string[];
  dayOptions: string[];
  onChangeYear: (value: string) => void;
  onChangeMonth: (value: string) => void;
  onChangeDay: (value: string) => void;
}> = ({
  visible,
  title,
  onClose,
  year,
  month,
  day,
  yearOptions,
  monthOptions,
  dayOptions,
  onChangeYear,
  onChangeMonth,
  onChangeDay,
}) => (
  <PickerModal visible={visible} title={title} onClose={onClose}>
    <View className="mb-2 flex-row">
      <Text className="flex-1 text-center text-xs font-semibold text-gray-500">년</Text>
      <Text className="flex-1 text-center text-xs font-semibold text-gray-500">월</Text>
      <Text className="flex-1 text-center text-xs font-semibold text-gray-500">일</Text>
    </View>
    <View className="flex-row items-center">
      <View className="flex-1 items-center">
        <WheelPicker
          options={yearOptions}
          value={year}
          onChange={onChangeYear}
          itemTextClassName="text-xl"
        />
      </View>
      <View className="flex-1 items-center">
        <WheelPicker
          options={monthOptions}
          value={month}
          onChange={onChangeMonth}
          itemTextClassName="text-xl"
        />
      </View>
      <View className="flex-1 items-center">
        <WheelPicker
          options={dayOptions}
          value={day}
          onChange={onChangeDay}
          itemTextClassName="text-xl"
        />
      </View>
    </View>
  </PickerModal>
);

const UserInfoForm: React.FC<Props> = ({ onSubmit, initialValues, isSubmitting = false }) => {
  const [form, setForm] = useState<UserSettings>(
    initialValues || {
      nickname: '',
      gender: 'male',
      birthdate: '',
      notificationTime: DEFAULT_NOTIFICATION_TIME,
      notificationEnabled: true,
    },
  );
  const [isBirthDateModalOpen, setIsBirthDateModalOpen] = useState(false);
  const [isBirthTimeModalOpen, setIsBirthTimeModalOpen] = useState(false);
  const [isNotifyModalOpen, setIsNotifyModalOpen] = useState(false);

  const defaultBirthdate = useMemo(() => {
    const now = new Date();
    return `${now.getFullYear()}-${pad2(now.getMonth() + 1)}-${pad2(now.getDate())}`;
  }, []);
  const { datePart, timePart } = useMemo(() => splitDateTime(form.birthdate), [form.birthdate]);
  const birthDatePart = datePart || defaultBirthdate;
  const { year, month, day } = useMemo(() => parseDateParts(birthDatePart), [birthDatePart]);
  const { hour: birthHour, minute: birthMinute } = useMemo(
    () => parseTimeParts(timePart || DEFAULT_BIRTH_TIME, DEFAULT_BIRTH_TIME),
    [timePart],
  );
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

  const yearOptions = useMemo(() => {
    const currentYear = new Date().getFullYear();
    const years: string[] = [];
    for (let y = currentYear; y >= 1900; y -= 1) {
      years.push(String(y));
    }
    return years;
  }, []);
  const monthOptions = useMemo(() => Array.from({ length: 12 }, (_, i) => pad2(i + 1)), []);
  const dayOptions = useMemo(() => {
    const yearNum = Number(year) || new Date().getFullYear();
    const monthNum = Number(month) || 1;
    const totalDays = getDaysInMonth(yearNum, monthNum);
    return Array.from({ length: totalDays }, (_, i) => pad2(i + 1));
  }, [month, year]);
  const hourOptions = useMemo(() => Array.from({ length: 24 }, (_, i) => pad2(i)), []);
  const birthMinuteOptions = useMemo(() => Array.from({ length: 60 }, (_, i) => pad2(i)), []);
  const notifyMinuteOptions = useMemo(
    () =>
      Array.from({ length: 60 / NOTIFICATION_MINUTE_STEP }, (_, i) =>
        pad2(i * NOTIFICATION_MINUTE_STEP),
      ),
    [],
  );

  const isValid = useMemo(() => form.nickname.trim() !== '' && form.birthdate !== '', [form]);

  const update = useCallback(
    (patch: Partial<UserSettings>) => setForm((prev) => ({ ...prev, ...patch })),
    [],
  );

  useEffect(() => {
    if (!form.birthdate) return;
    if (!dayOptions.includes(day)) {
      const nextDay = dayOptions[dayOptions.length - 1] ?? '01';
      update({ birthdate: buildBirthDateTime(year, month, nextDay, birthHour, birthMinute) });
    }
  }, [birthHour, birthMinute, dayOptions, day, form.birthdate, month, update, year]);

  useEffect(() => {
    if (form.birthdate.trim()) return;
    update({ birthdate: buildBirthDateTime(year, month, day, birthHour, birthMinute) });
  }, [birthHour, birthMinute, day, form.birthdate, month, update, year]);

  useEffect(() => {
    if (!form.notificationTime.trim()) return;
    const normalizedTime = `${notifyHour}:${notifyMinute}`;
    if (form.notificationTime.trim() !== normalizedTime) {
      update({ notificationTime: normalizedTime });
    }
  }, [form.notificationTime, notifyHour, notifyMinute, update]);

  const birthSummary = buildBirthdate(year, month, day);
  const birthTimeSummary = `${birthHour}:${birthMinute}`;
  const notificationSummary = `${notifyHour}:${notifyMinute}`;

  const openBirthDateModal = useCallback(() => {
    setIsBirthDateModalOpen(true);
    setIsBirthTimeModalOpen(false);
    setIsNotifyModalOpen(false);
    if (!form.birthdate.trim()) {
      update({ birthdate: buildBirthDateTime(year, month, day, birthHour, birthMinute) });
    }
  }, [birthHour, birthMinute, form.birthdate, month, update, year, day]);

  const openBirthTimeModal = useCallback(() => {
    setIsBirthTimeModalOpen(true);
    setIsBirthDateModalOpen(false);
    setIsNotifyModalOpen(false);
    if (!form.birthdate.trim()) {
      update({ birthdate: buildBirthDateTime(year, month, day, birthHour, birthMinute) });
    }
  }, [birthHour, birthMinute, form.birthdate, month, update, year, day]);

  const openNotifyModal = useCallback(() => {
    setIsNotifyModalOpen(true);
    setIsBirthDateModalOpen(false);
    setIsBirthTimeModalOpen(false);
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
    <SafeAreaView edges={['top']} className="flex-1 bg-white">
      <ScrollView
        className="flex-1 bg-white"
        contentContainerStyle={{ padding: 48, paddingBottom: 72 }}
        keyboardShouldPersistTaps="handled"
      >
        <View className="gap-8">
          <View className="gap-4">
            <Text className="text-3xl font-extrabold text-gray-900 ">
              반가워요!{'\n'}정보를 입력해주세요
            </Text>
            <Text className="text-lg text-gray-500">정확한 운세 분석을 위해 필요해요.</Text>
          </View>

          <View className="gap-4">
            <Text className="text-xl font-bold text-gray-700">닉네임</Text>
            <TextInput
              value={form.nickname}
              onChangeText={(text) => update({ nickname: text })}
              placeholder="홍길동"
              placeholderTextColor="#9ca3af"
              className="rounded-xl bg-gray-100 px-4 py-5 text-xl text-gray-900"
            />
          </View>

          <View className="gap-4">
            <Text className="text-xl font-bold text-gray-700">성별</Text>
            <View className="flex-row gap-4">
              {genderOptions.map((opt) => {
                const active = form.gender === opt.val;
                return (
                  <Pressable
                    key={opt.val}
                    className={`flex-1 items-center rounded-xl p-4 ${
                      active ? 'bg-gray-900' : 'bg-gray-100'
                    }`}
                    onPress={() => update({ gender: opt.val })}
                  >
                    <Text
                      className={`text-lg font-bold ${active ? 'text-white' : 'text-gray-500'}`}
                    >
                      {opt.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          <View className="gap-4">
            <Text className="text-xl font-bold text-gray-700">생년월일</Text>
            <Pressable className="rounded-xl bg-gray-100 px-4 py-4" onPress={openBirthDateModal}>
              <View className="flex-row items-center justify-between">
                <Text className="text-lg font-semibold text-gray-900">{birthSummary}</Text>
                <Text className="text-sm font-semibold text-gray-500">선택</Text>
              </View>
            </Pressable>
          </View>

          <View className="gap-4">
            <Text className="text-xl font-bold text-gray-700">태어난 시간</Text>
            <Pressable className="rounded-xl bg-gray-100 px-4 py-4" onPress={openBirthTimeModal}>
              <View className="flex-row items-center justify-between">
                <Text className="text-lg font-semibold text-gray-900">{birthTimeSummary}</Text>
                <Text className="text-sm font-semibold text-gray-500">선택</Text>
              </View>
            </Pressable>
          </View>

          <View className="gap-4">
            <Text className="text-xl font-bold text-gray-700">매일 알림</Text>
            <Pressable className="rounded-xl bg-gray-100 px-4 py-4" onPress={openNotifyModal}>
              <View className="flex-row items-center justify-between">
                <Text className="text-lg font-semibold text-gray-900">{notificationSummary}</Text>
                <Text className="text-sm font-semibold text-gray-500">선택</Text>
              </View>
            </Pressable>
          </View>

          <Pressable
            className={`mt-2 rounded-xl py-3.5 ${
              isValid && !isSubmitting ? 'bg-gray-900' : 'bg-gray-900/40'
            }`}
            disabled={!isValid || isSubmitting}
            onPress={handleSubmit}
          >
            {isSubmitting ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text className="text-center text-lg font-extrabold text-white">시작하기</Text>
            )}
          </Pressable>

          <DatePickerModal
            visible={isBirthDateModalOpen}
            title="생년월일"
            onClose={() => setIsBirthDateModalOpen(false)}
            year={year}
            month={month}
            day={day}
            yearOptions={yearOptions}
            monthOptions={monthOptions}
            dayOptions={dayOptions}
            onChangeYear={(nextYear) =>
              update({
                birthdate: buildBirthDateTime(nextYear, month, day, birthHour, birthMinute),
              })
            }
            onChangeMonth={(nextMonth) =>
              update({
                birthdate: buildBirthDateTime(year, nextMonth, day, birthHour, birthMinute),
              })
            }
            onChangeDay={(nextDay) =>
              update({
                birthdate: buildBirthDateTime(year, month, nextDay, birthHour, birthMinute),
              })
            }
          />

          <PickerModal
            visible={isBirthTimeModalOpen}
            title="태어난 시간"
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
                      birthdate: buildBirthDateTime(year, month, day, nextHour, birthMinute),
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
                      birthdate: buildBirthDateTime(year, month, day, birthHour, nextMinute),
                    })
                  }
                />
              </View>
            </View>
          </PickerModal>

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
