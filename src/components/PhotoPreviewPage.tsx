import React, { useState } from 'react';
import {
  Dimensions,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MissionData } from '../types/fortune';

interface Props {
  photoUri: string;
  mission: MissionData | null;
  date: Date;
  onSave: (caption: string) => void;
  onRetake: () => void;
  onClose: () => void;
  isSaving?: boolean;
}

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const PhotoPreviewPage: React.FC<Props> = ({
  photoUri,
  mission,
  date,
  onSave,
  onRetake,
  onClose,
  isSaving = false,
}) => {
  const insets = useSafeAreaInsets();
  const [caption, setCaption] = useState('');

  const month = date.getMonth() + 1;
  const day = date.getDate();

  const handleSave = () => {
    if (isSaving) return;
    onSave(caption);
  };

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-[#FFFBF5]"
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      {/* 헤더 */}
      <View
        className="z-10 flex-row items-center justify-between px-4"
        style={{ paddingTop: insets.top + 8 }}
      >
        <Pressable
          onPress={onClose}
          hitSlop={12}
          className="rounded-full bg-stone-100 p-2.5"
        >
          <Feather name="x" size={22} color="#57534e" />
        </Pressable>

        <View className="flex-row items-baseline">
          <Text className="font-serif text-xl font-bold text-stone-800">
            {month}.{day}
          </Text>
          <Text className="ml-2 text-sm text-stone-400">미리보기</Text>
        </View>

        <View style={{ width: 42 }} />
      </View>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 40 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* 미션 테마 */}
        {mission && (
          <View className="mx-4 mt-4 rounded-xl bg-stone-100 px-4 py-3">
            <Text className="text-xs font-semibold uppercase tracking-widest text-stone-400">
              오늘의 주제
            </Text>
            <Text className="mt-1 font-serif text-lg font-bold text-stone-700">
              {mission.theme}
            </Text>
          </View>
        )}

        {/* 사진 미리보기 */}
        <View className="mx-4 mt-4 overflow-hidden rounded-2xl shadow-lg">
          <View
            className="items-center justify-center bg-stone-200"
            style={{
              width: SCREEN_WIDTH - 32,
              height: SCREEN_WIDTH - 32,
            }}
          >
            {/* 사진 플레이스홀더 */}
            <View className="items-center">
              <View className="mb-3 h-20 w-20 items-center justify-center rounded-full bg-stone-300">
                <Feather name="image" size={36} color="#a8a29e" />
              </View>
              <Text className="text-sm text-stone-400">촬영된 사진</Text>
              <Text className="mt-1 text-xs text-stone-300">{photoUri || 'photo_uri'}</Text>
            </View>
          </View>
        </View>

        {/* 캡션 입력 */}
        <View className="mx-4 mt-6">
          <Text className="mb-2 text-sm font-semibold text-stone-500">
            한 줄 캡션 (선택)
          </Text>
          <TextInput
            value={caption}
            onChangeText={setCaption}
            placeholder="이 순간을 기록해보세요..."
            placeholderTextColor="#a8a29e"
            multiline
            maxLength={100}
            className="rounded-xl border border-stone-200 bg-white px-4 py-4 text-base text-stone-700"
            style={{ minHeight: 80, textAlignVertical: 'top' }}
          />
          <Text className="mt-2 text-right text-xs text-stone-300">
            {caption.length}/100
          </Text>
        </View>

        {/* 버튼 영역 */}
        <View className="mx-4 mt-6 gap-3">
          <Pressable
            onPress={handleSave}
            disabled={isSaving}
            className={`flex-row items-center justify-center rounded-xl py-4 ${
              isSaving ? 'bg-emerald-400' : 'bg-emerald-500'
            }`}
          >
            {isSaving ? (
              <Text className="text-base font-bold text-white">저장 중...</Text>
            ) : (
              <>
                <Feather name="check" size={20} color="#ffffff" />
                <Text className="ml-2 text-base font-bold text-white">저장하기</Text>
              </>
            )}
          </Pressable>

          <Pressable
            onPress={onRetake}
            disabled={isSaving}
            className="flex-row items-center justify-center rounded-xl border border-stone-200 bg-white py-4"
          >
            <Feather name="camera" size={20} color="#78716c" />
            <Text className="ml-2 text-base font-bold text-stone-600">다시 촬영</Text>
          </Pressable>
        </View>

        {/* 안내 텍스트 */}
        <View className="mx-4 mt-6 flex-row items-start rounded-xl bg-amber-50 p-4">
          <Feather name="info" size={16} color="#d97706" style={{ marginTop: 2 }} />
          <Text className="ml-3 flex-1 text-sm leading-5 text-amber-700">
            저장된 사진은 월말 앨범에 자동으로 포함됩니다.{'\n'}
            하루에 한 장만 저장할 수 있어요.
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

export default PhotoPreviewPage;
