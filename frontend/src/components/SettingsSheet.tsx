import React, { useEffect, useState } from 'react';
import { Modal, Pressable, Switch, Text, TextInput, View } from 'react-native';
import { UserSettings } from '../types/fortune';
import { Feather } from '@expo/vector-icons';

interface Props {
  visible: boolean;
  onClose: () => void;
  settings: UserSettings;
  onSave: (settings: UserSettings) => void;
}

const SettingsSheet: React.FC<Props> = ({ visible, onClose, settings, onSave }) => {
  const [form, setForm] = useState<UserSettings>(settings);

  useEffect(() => {
    if (visible) {
      setForm(settings);
    }
  }, [visible, settings]);

  const update = (patch: Partial<UserSettings>) => setForm((prev) => ({ ...prev, ...patch }));

  const handleSave = () => {
    onSave(form);
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View className="flex-1 justify-end bg-black/25">
        <Pressable className="absolute inset-0" onPress={onClose} />

        <View className="gap-4 rounded-t-2xl bg-stone-100 px-4 pb-6 pt-3">
          <View className="flex-row items-center justify-between py-2">
            <Text className="text-lg font-extrabold text-gray-900">설정</Text>
            <Pressable onPress={onClose} hitSlop={12} className="rounded-full p-2 active:opacity-70">
              <Feather name="x" size={22} color="#6b7280" />
            </Pressable>
          </View>

          <View className="space-y-2">
            <Text className="text-xs font-semibold uppercase tracking-wide text-gray-500">내 정보</Text>
            <View className="overflow-hidden rounded-xl border border-gray-200 bg-white">
              <Row label="닉네임">
                <TextInput
                  value={form.nickname}
                  onChangeText={(text) => update({ nickname: text })}
                  placeholder="입력해주세요"
                  placeholderTextColor="#d1d5db"
                  className="min-w-[120] text-right text-[15px] text-gray-900"
                />
              </Row>
              <Row label="생년월일" divider>
                <TextInput
                  value={form.birthdate}
                  onChangeText={(text) => update({ birthdate: text })}
                  placeholder="YYYY-MM-DD"
                  placeholderTextColor="#d1d5db"
                  className="min-w-[120] text-right text-[15px] text-gray-900"
                />
              </Row>
            </View>
          </View>

          <View className="space-y-2">
            <Text className="text-xs font-semibold uppercase tracking-wide text-gray-500">알림</Text>
            <View className="overflow-hidden rounded-xl border border-gray-200 bg-white">
              <Row label="매일 알림 받기" divider>
                <Switch
                  value={form.notificationEnabled}
                  onValueChange={(value) => update({ notificationEnabled: value })}
                  thumbColor="#fff"
                  trackColor={{ false: '#e5e7eb', true: '#111827' }}
                />
              </Row>
              {form.notificationEnabled && (
                <Row label="알림 시간">
                  <TextInput
                    value={form.notificationTime}
                    onChangeText={(text) => update({ notificationTime: text })}
                    placeholder="08:00"
                    placeholderTextColor="#d1d5db"
                    className="min-w-[120] text-right text-[15px] text-gray-900"
                  />
                </Row>
              )}
            </View>
          </View>

          <Pressable
            className="rounded-xl bg-gray-900 py-3.5 active:opacity-90"
            onPress={handleSave}
          >
            <Text className="text-center text-lg font-extrabold text-white">저장하기</Text>
          </Pressable>
        </View>
      </View>
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
