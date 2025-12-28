import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  Switch,
  Text,
  TextInput,
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

interface Props {
  visible: boolean;
  onClose: () => void;
  settings: UserSettings;
  onSave: (settings: UserSettings) => void;
}

const SettingsSheet: React.FC<Props> = ({ visible, onClose, settings, onSave }) => {
  const [form, setForm] = useState<UserSettings>(settings);
  const [isFetching, setIsFetching] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const { signOut, isLoading } = useAuth();
  const isBusy = isFetching || isSaving;

  useEffect(() => {
    if (visible) {
      setForm(settings);
    }
  }, [visible, settings]);

  useEffect(() => {
    if (!visible) {
      setIsFetching(false);
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
          void signOut();
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
  }, [signOut, visible]);

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
        void signOut();
        return;
      }
      const message = error instanceof Error ? error.message : '프로필을 저장하지 못했어요.';
      Alert.alert('저장 실패', message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleLogout = async () => {
    await signOut();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <KeyboardAvoidingView
        className="flex-1 justify-end bg-black/25 "
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <Pressable className="absolute inset-0" onPress={onClose} />

        <View className="gap-4 rounded-t-2xl bg-stone-100 px-4 pb-6 pt-3">
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

          <View className="space-y-2">
            <Text className="text-xs font-semibold uppercase tracking-wide text-gray-500">
              내 정보
            </Text>
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

          <View className="space-y-2">
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
        </View>
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
