import React, { useState, useRef, useEffect } from 'react';
import {
  Animated,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { WritingPrompt } from '../types/writing';

interface Props {
  prompt: WritingPrompt;
  onSave: (text: string) => void;
  onClose: () => void;
  initialText?: string;
}

const WritingEditor: React.FC<Props> = ({
  prompt,
  onSave,
  onClose,
  initialText = '',
}) => {
  const insets = useSafeAreaInsets();
  const [text, setText] = useState(initialText);
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const inputRef = useRef<TextInput>(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const charCount = text.length;
  const isValidLength = charCount >= 1;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();

    const timer = setTimeout(() => {
      inputRef.current?.focus();
    }, 400);

    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const showSub = Keyboard.addListener('keyboardWillShow', () => setKeyboardVisible(true));
    const hideSub = Keyboard.addListener('keyboardWillHide', () => setKeyboardVisible(false));

    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  const handleSave = () => {
    if (isValidLength) {
      onSave(text.trim());
    }
  };

  const handleClose = () => {
    Keyboard.dismiss();
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 200,
      useNativeDriver: true,
    }).start(() => {
      onClose();
    });
  };

  return (
    <Animated.View
      className="flex-1 bg-stone-200"
      style={{ opacity: fadeAnim }}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
      >
        {/* 헤더 */}
        <View
          className="bg-white px-5"
          style={{ paddingTop: insets.top + 8 }}
        >
          <View className="flex-row items-center justify-between py-3">
            <Pressable
              onPress={handleClose}
              className="flex-row items-center"
              hitSlop={12}
            >
              <Feather name="x" size={20} color="#6b7280" />
              <Text className="ml-1 text-base text-gray-500 font-wanted-regular">
                취소
              </Text>
            </Pressable>

            <Text className="text-sm text-gray-400 font-wanted-regular">
              글쓰기
            </Text>

            <Pressable
              onPress={handleSave}
              disabled={!isValidLength}
              className={`px-5 py-2 rounded-full ${
                isValidLength ? 'bg-gray-900' : 'bg-gray-200'
              }`}
            >
              <Text
                className={`text-sm font-wanted-semibold ${
                  isValidLength ? 'text-white' : 'text-gray-400'
                }`}
              >
                완료
              </Text>
            </Pressable>
          </View>

          {/* 점선 구분 */}
          <View className="border-t border-dashed border-gray-300" />
        </View>

        {/* 본문 영역 */}
        <View className="flex-1 bg-white mx-0">
          {/* 글감 표시 */}
          <View className="px-8 pt-8 pb-6">
            <Text className="text-2xl font-noto-bold text-gray-900 text-center leading-9">
              {prompt.title}
            </Text>
            {prompt.constraint && (
              <View className="mt-3 items-center">
                <View className="bg-amber-50 px-3 py-1.5 rounded-full">
                  <Text className="text-xs text-amber-600 font-wanted-semibold">
                    {prompt.constraint}
                  </Text>
                </View>
              </View>
            )}
          </View>

          {/* 구분선 */}
          <View className="mx-8 h-px bg-gray-100" />

          {/* 글쓰기 입력 영역 - 노트 줄 스타일 */}
          <View className="flex-1 px-8 pt-6">
            <View className="flex-1 relative">
              {/* 노트 줄 배경 */}
              <View className="absolute inset-0">
                {Array.from({ length: 12 }).map((_, i) => (
                  <View
                    key={i}
                    className="absolute left-0 right-0 border-t border-gray-100"
                    style={{ top: i * 32 }}
                  />
                ))}
              </View>

              <TextInput
                ref={inputRef}
                className="flex-1 text-lg text-gray-800 font-noto"
                placeholder="여기에 글을 써보세요..."
                placeholderTextColor="#d1d5db"
                multiline
                textAlignVertical="top"
                value={text}
                onChangeText={setText}
                style={{ lineHeight: 32 }}
                scrollEnabled
              />
            </View>
          </View>

          {/* 하단 글자수 표시 */}
          <View
            className="flex-row items-center justify-between px-8 py-4 border-t border-dashed border-gray-200"
            style={{ paddingBottom: keyboardVisible ? 12 : insets.bottom + 12 }}
          >
            <Text className="text-sm text-gray-500 font-wanted-semibold">
              {charCount}자
            </Text>

            <Text className="text-xs text-gray-300 font-wanted-regular">
              100~300자 권장
            </Text>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Animated.View>
  );
};

export default WritingEditor;
