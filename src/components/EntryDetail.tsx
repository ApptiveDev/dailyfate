import React, { useState } from 'react';
import {
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
  Alert,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { WritingEntry } from '../types/writing';

interface Props {
  entry: WritingEntry;
  onClose: () => void;
  onSave: (text: string, tags: string[]) => void;
  onDelete: () => void;
  onToggleBest: () => void;
}

const WEEKDAY_HANJA = ['日', '月', '火', '水', '木', '金', '土'];

const EntryDetail: React.FC<Props> = ({
  entry,
  onClose,
  onSave,
  onDelete,
  onToggleBest,
}) => {
  const insets = useSafeAreaInsets();
  const [isEditing, setIsEditing] = useState(false);
  const [editedText, setEditedText] = useState(entry.text);
  const [editedTags, setEditedTags] = useState<string[]>(entry.tags || []);
  const [newTag, setNewTag] = useState('');

  const writtenDate = entry.writtenAt;
  const year = writtenDate.getFullYear();
  const month = writtenDate.getMonth() + 1;
  const day = writtenDate.getDate();
  const weekday = writtenDate.getDay();
  const dayColor = weekday === 0 ? '#dc2626' : weekday === 6 ? '#2563eb' : '#111827';

  const charCount = editedText.length;

  const handleSave = () => {
    onSave(editedText, editedTags);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditedText(entry.text);
    setEditedTags(entry.tags || []);
    setIsEditing(false);
  };

  const handleDelete = () => {
    Alert.alert(
      '글 삭제',
      '이 글을 삭제하시겠습니까?\n삭제된 글은 복구할 수 없습니다.',
      [
        { text: '취소', style: 'cancel' },
        { text: '삭제', style: 'destructive', onPress: onDelete },
      ]
    );
  };

  const addTag = () => {
    if (newTag.trim() && !editedTags.includes(newTag.trim())) {
      setEditedTags([...editedTags, newTag.trim()]);
      setNewTag('');
    }
  };

  const removeTag = (tag: string) => {
    setEditedTags(editedTags.filter((t) => t !== tag));
  };

  return (
    <View className="flex-1 bg-stone-200">
      {/* 헤더 */}
      <View
        className="bg-white px-5"
        style={{ paddingTop: insets.top + 8 }}
      >
        <View className="flex-row items-center justify-between py-3">
          <Pressable
            onPress={onClose}
            className="flex-row items-center"
            hitSlop={12}
          >
            <Feather name="chevron-left" size={20} color="#374151" />
            <Text className="ml-1 text-base text-gray-700 font-wanted-semibold">
              돌아가기
            </Text>
          </Pressable>

          <View className="flex-row items-center gap-3">
            {isEditing ? (
              <>
                <Pressable onPress={handleCancel}>
                  <Text className="text-base text-gray-500 font-wanted-regular">
                    취소
                  </Text>
                </Pressable>
                <Pressable
                  onPress={handleSave}
                  className="bg-gray-900 px-5 py-2 rounded-full"
                >
                  <Text className="text-sm text-white font-wanted-semibold">
                    저장
                  </Text>
                </Pressable>
              </>
            ) : (
              <>
                <Pressable onPress={() => setIsEditing(true)} hitSlop={12}>
                  <Feather name="edit-2" size={18} color="#6b7280" />
                </Pressable>
                <Pressable onPress={onToggleBest} hitSlop={12}>
                  <Feather
                    name="star"
                    size={18}
                    color={entry.isBestSentence ? '#f59e0b' : '#d1d5db'}
                  />
                </Pressable>
                <Pressable onPress={handleDelete} hitSlop={12}>
                  <Feather name="trash-2" size={18} color="#d1d5db" />
                </Pressable>
              </>
            )}
          </View>
        </View>

        {/* 점선 구분 */}
        <View className="border-t border-dashed border-gray-300" />
      </View>

      {/* 본문 영역 */}
      <View className="flex-1 bg-white">
        {/* 날짜 표시 */}
        <View className="px-8 pt-8 pb-6">
          <View className="items-center">
            <Text
              className="text-4xl font-noto-bold"
              style={{ color: dayColor }}
            >
              {day}
            </Text>
            <View className="flex-row items-center mt-2">
              <Text
                className="text-lg font-noto-semibold"
                style={{ color: dayColor }}
              >
                {WEEKDAY_HANJA[weekday]}
              </Text>
            </View>
            <Text className="text-sm text-gray-400 font-wanted-regular mt-1">
              {year}년 {month}월
            </Text>
          </View>
        </View>

        {/* 구분선 */}
        <View className="border-t border-dashed border-gray-200" />

        <ScrollView
          className="flex-1"
          contentContainerStyle={{ padding: 24, paddingBottom: insets.bottom + 24 }}
        >
          {/* 글감 제목 */}
          <View className="mb-6">
            <Text className="text-sm text-gray-400 font-wanted-regular mb-2">
              글감
            </Text>
            <Text className="text-xl font-noto-bold text-gray-900 leading-8">
              {entry.promptTitle}
            </Text>
          </View>

          {/* 베스트 뱃지 */}
          {entry.isBestSentence && (
            <View className="flex-row items-center bg-amber-50 rounded-lg px-4 py-3 mb-6">
              <Feather name="star" size={14} color="#f59e0b" />
              <Text className="ml-2 text-sm text-amber-700 font-wanted-semibold">
                베스트 문장으로 선정됨
              </Text>
            </View>
          )}

          {/* 작성한 글 - 노트 줄 스타일 */}
          <View className="mb-6">
            <Text className="text-sm text-gray-400 font-wanted-regular mb-3">
              내가 쓴 글
            </Text>

            {isEditing ? (
              <View className="border border-gray-200 rounded-xl overflow-hidden">
                <View className="relative min-h-[200px] p-4">
                  {/* 노트 줄 배경 */}
                  <View className="absolute inset-0">
                    {Array.from({ length: 8 }).map((_, i) => (
                      <View
                        key={i}
                        className="absolute left-0 right-0 border-t border-gray-100"
                        style={{ top: 16 + i * 28 }}
                      />
                    ))}
                  </View>

                  <TextInput
                    className="text-base text-gray-800 font-noto"
                    multiline
                    textAlignVertical="top"
                    value={editedText}
                    onChangeText={setEditedText}
                    style={{ lineHeight: 28, minHeight: 180 }}
                    autoFocus
                  />
                </View>
                <View className="flex-row items-center justify-end px-4 py-3 border-t border-dashed border-gray-200">
                  <Text className="text-sm text-gray-500 font-wanted-semibold">
                    {charCount}자
                  </Text>
                </View>
              </View>
            ) : (
              <View className="border border-gray-100 rounded-xl overflow-hidden">
                <View className="relative p-4">
                  {/* 노트 줄 배경 */}
                  <View className="absolute inset-0">
                    {Array.from({ length: 6 }).map((_, i) => (
                      <View
                        key={i}
                        className="absolute left-0 right-0 border-t border-gray-100"
                        style={{ top: 16 + i * 28 }}
                      />
                    ))}
                  </View>

                  <Text className="text-base text-gray-800 font-noto leading-7">
                    {entry.text}
                  </Text>
                </View>
                <View className="flex-row items-center justify-end px-4 py-3 border-t border-dashed border-gray-100">
                  <Text className="text-xs text-gray-400 font-wanted-regular">
                    {entry.text.length}자
                  </Text>
                </View>
              </View>
            )}
          </View>

          {/* 태그 */}
          <View>
            <Text className="text-sm text-gray-400 font-wanted-regular mb-3">
              태그
            </Text>

            <View className="flex-row flex-wrap gap-2">
              {editedTags.map((tag) => (
                <View
                  key={tag}
                  className="flex-row items-center bg-gray-100 rounded-full px-3 py-1.5"
                >
                  <Text className="text-sm text-gray-600 font-wanted-regular">
                    #{tag}
                  </Text>
                  {isEditing && (
                    <Pressable
                      onPress={() => removeTag(tag)}
                      hitSlop={8}
                      className="ml-1"
                    >
                      <Feather name="x" size={14} color="#9ca3af" />
                    </Pressable>
                  )}
                </View>
              ))}

              {isEditing && (
                <View className="flex-row items-center bg-white border border-gray-200 rounded-full px-3 py-1">
                  <Text className="text-gray-400 mr-1">#</Text>
                  <TextInput
                    className="text-sm text-gray-600 font-wanted-regular min-w-[60px]"
                    placeholder="태그 추가"
                    placeholderTextColor="#d1d5db"
                    value={newTag}
                    onChangeText={setNewTag}
                    onSubmitEditing={addTag}
                    returnKeyType="done"
                  />
                </View>
              )}

              {!isEditing && editedTags.length === 0 && (
                <Text className="text-sm text-gray-300 font-wanted-regular">
                  태그 없음
                </Text>
              )}
            </View>
          </View>
        </ScrollView>
      </View>
    </View>
  );
};

export default EntryDetail;
