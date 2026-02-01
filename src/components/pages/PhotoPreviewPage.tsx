import React, { useState } from 'react';
import {
  Dimensions,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MissionData } from '@/types/fortune';
import {
  Box,
  Text,
  Heading,
  VStack,
  HStack,
  Center,
  Textarea,
} from '../ui';

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
const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
                     'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

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

  const month = date.getMonth();
  const day = date.getDate();

  const isDummyPhoto = photoUri.startsWith('dummy://');

  const handleSave = () => {
    if (isSaving) return;
    onSave(caption);
  };

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-white"
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      {/* Header */}
      <Box className="px-6" style={{ paddingTop: insets.top + 16 }}>
        <HStack className="justify-between items-center">
          <Pressable
            onPress={onClose}
            hitSlop={16}
            className="h-10 w-10 items-center justify-center rounded-full bg-black"
          >
            <Feather name="x" size={18} color="#fff" />
          </Pressable>

          <Heading className="text-lg text-black">
            {MONTH_NAMES[month]} {day}
          </Heading>

          <Box style={{ width: 40 }} />
        </HStack>
      </Box>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 40 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Photo Preview */}
        <Box className="mx-6 mt-6">
          {isDummyPhoto ? (
            <Center
              className="rounded-2xl bg-neutral-100"
              style={{
                width: SCREEN_WIDTH - 48,
                height: SCREEN_WIDTH - 48,
              }}
            >
              <Feather name="image" size={48} color="#ccc" />
              <Text className="mt-2 text-neutral-400 text-sm">
                미리보기
              </Text>
            </Center>
          ) : (
            <Box
              className="rounded-2xl overflow-hidden"
              style={{
                width: SCREEN_WIDTH - 48,
                height: SCREEN_WIDTH - 48,
              }}
            >
              <Image
                source={{ uri: photoUri }}
                style={{ width: '100%', height: '100%' }}
                resizeMode="cover"
              />
            </Box>
          )}
        </Box>

        {/* Mission */}
        {mission && (
          <Box className="mx-6 mt-6">
            <Text className="text-left text-base text-neutral-500 font-wanted-semibold">
              {mission.theme}
            </Text>
          </Box>
        )}

        {/* Caption Input */}
        <Box className="mx-6 mt-8">
          <Textarea
            value={caption}
            onChangeText={setCaption}
            placeholder="한 줄 메모..."
            maxLength={100}
          />
          <Text className="mt-2 text-right text-xs text-neutral-300">
            {caption.length}/100
          </Text>
        </Box>

        {/* Buttons */}
        <VStack space="md" className="mx-6 mt-8">
          <Pressable
            onPress={handleSave}
            disabled={isSaving}
            className="flex-row items-center justify-center py-5 rounded-2xl bg-black"
            style={{ opacity: isSaving ? 0.5 : 1 }}
          >
            <Feather name="check" size={18} color="#fff" />
            <Text className="ml-3 text-base font-medium text-white">
              {isSaving ? '저장 중...' : '저장'}
            </Text>
          </Pressable>

          <Pressable
            onPress={onRetake}
            disabled={isSaving}
            className="flex-row items-center justify-center py-5 rounded-2xl border border-neutral-200"
          >
            <Feather name="camera" size={18} color="#000" />
            <Text className="ml-3 text-base font-medium text-black">다시 촬영</Text>
          </Pressable>
        </VStack>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

export default PhotoPreviewPage;
