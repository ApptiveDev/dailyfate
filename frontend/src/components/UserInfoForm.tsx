import React, { useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, Text, TextInput, View } from 'react-native';
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
  { val: 'other', label: '기타' },
];

const UserInfoForm: React.FC<Props> = ({ onSubmit, initialValues, isSubmitting = false }) => {
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
    if (!isValid || isSubmitting) return;
    onSubmit(form);
  };

  return (
    <SafeAreaView edges={['top']} className="flex-1 bg-white">
      <View className="flex-1 bg-white px-5 py-4">
        <View className="gap-8">
          <View className="gap-4">
            <Text className="text-4xl font-extrabold text-gray-900">
              반가워요!{'\n'}정보를 입력해주세요
            </Text>
            <Text className="text-lg text-gray-500">정확한 운세 분석을 위해 필요해요.</Text>
          </View>

          <View className="gap-4">
            <Text className="text-xl font-bold text-gray-700">닉네임</Text>
            <TextInput
              value={form.nickname}
              onChangeText={(text) => update({ nickname: text })}
              placeholder="김토스"
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
            <TextInput
              value={form.birthdate}
              onChangeText={(text) => update({ birthdate: text })}
              placeholder="YYYY-MM-DD"
              placeholderTextColor="#9ca3af"
              className="rounded-xl bg-gray-100 px-4 py-5 text-xl text-gray-900"
            />
          </View>

          <View className="gap-4">
            <Text className="text-xl font-bold text-gray-700">매일 알림</Text>
            <View className="flex-row items-center justify-between rounded-xl bg-gray-100 px-3.5 py-3.5">
              <Text className="text-base font-semibold text-gray-900">알림 시간</Text>
              <TextInput
                value={form.notificationTime}
                onChangeText={(text) => update({ notificationTime: text })}
                placeholder="08:00"
                placeholderTextColor="#9ca3af"
                className="rounded-xl bg-gray-100 px-4 py-4 text-xl text-gray-900"
              />
            </View>
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
        </View>
      </View>
    </SafeAreaView>
  );
};

export default UserInfoForm;
