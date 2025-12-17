import React, { useMemo, useState } from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';
import { Gender, UserSettings } from '../types/fortune';

interface Props {
  onSubmit: (settings: UserSettings) => void;
  initialValues?: UserSettings;
}

const genderOptions: { val: Gender; label: string }[] = [
  { val: 'male', label: '남성' },
  { val: 'female', label: '여성' },
  { val: 'other', label: '기타' },
];

const UserInfoForm: React.FC<Props> = ({ onSubmit, initialValues }) => {
  const [form, setForm] = useState<UserSettings>(
    initialValues || {
      nickname: '',
      gender: 'male',
      birthdate: '',
      notificationTime: '08:00',
      notificationEnabled: true,
    },
  );

  const isValid = useMemo(() => form.nickname.trim() !== '' && form.birthdate !== '', [form]);

  const update = (patch: Partial<UserSettings>) => setForm((prev) => ({ ...prev, ...patch }));

  const handleSubmit = () => {
    if (!isValid) return;
    onSubmit(form);
  };

  return (
    <View className="absolute inset-0 z-10 bg-white px-5 pt-8">
      <View className="space-y-5">
        <View className="space-y-1">
          <Text className="text-2xl font-extrabold text-gray-900">반가워요! 정보를 입력해주세요</Text>
          <Text className="text-sm text-gray-500">정확한 운세 분석을 위해 필요해요.</Text>
        </View>

        <View className="space-y-2.5">
          <Text className="text-sm font-bold text-gray-700">닉네임</Text>
          <TextInput
            value={form.nickname}
            onChangeText={(text) => update({ nickname: text })}
            placeholder="김토스"
            placeholderTextColor="#9ca3af"
            className="rounded-xl bg-gray-100 px-3.5 py-3.5 text-base text-gray-900"
          />
        </View>

        <View className="space-y-2.5">
          <Text className="text-sm font-bold text-gray-700">성별</Text>
          <View className="flex-row space-x-2.5">
            {genderOptions.map((opt) => {
              const active = form.gender === opt.val;
              return (
                <Pressable
                  key={opt.val}
                  className={`flex-1 items-center rounded-xl px-4 py-3 ${
                    active ? 'bg-gray-900' : 'bg-gray-100'
                  }`}
                  onPress={() => update({ gender: opt.val })}
                >
                  <Text
                    className={`text-base font-bold ${active ? 'text-white' : 'text-gray-500'}`}
                  >
                    {opt.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        <View className="space-y-2.5">
          <Text className="text-sm font-bold text-gray-700">생년월일</Text>
          <TextInput
            value={form.birthdate}
            onChangeText={(text) => update({ birthdate: text })}
            placeholder="YYYY-MM-DD"
            placeholderTextColor="#9ca3af"
            className="rounded-xl bg-gray-100 px-3.5 py-3.5 text-base text-gray-900"
          />
        </View>

        <View className="space-y-2.5">
          <Text className="text-sm font-bold text-gray-700">매일 알림</Text>
          <View className="flex-row items-center justify-between rounded-xl bg-gray-100 px-3.5 py-3.5">
            <Text className="text-base font-semibold text-gray-900">알림 시간</Text>
            <TextInput
              value={form.notificationTime}
              onChangeText={(text) => update({ notificationTime: text })}
              placeholder="08:00"
              placeholderTextColor="#9ca3af"
              className="min-w-[80] text-right text-base text-gray-900"
            />
          </View>
        </View>

        <Pressable
          className={`mt-2 rounded-xl py-3.5 ${isValid ? 'bg-gray-900' : 'bg-gray-900/40'}`}
          disabled={!isValid}
          onPress={handleSubmit}
        >
          <Text className="text-center text-lg font-extrabold text-white">시작하기</Text>
        </Pressable>
      </View>
    </View>
  );
};

export default UserInfoForm;
