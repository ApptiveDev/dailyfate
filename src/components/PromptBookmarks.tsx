import React, { useState } from 'react';
import {
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type PromptType = 'copywriting' | 'narrative' | 'constraint' | 'question';

interface WritingPrompt {
  id: string;
  type: PromptType;
  category: string;
  title: string;
  description?: string;
  constraint?: string;
  bookmarkedAt: Date;
  isCompleted?: boolean; // 이미 작성한 글감인지
}

interface Props {
  bookmarks: WritingPrompt[];
  onSelectPrompt: (prompt: WritingPrompt) => void;
  onRemoveBookmark: (promptId: string) => void;
  onClose: () => void;
}

const PROMPT_TYPE_LABELS: Record<PromptType, { label: string; color: string; bgColor: string; icon: string }> = {
  copywriting: { label: '카피라이팅', color: '#7c3aed', bgColor: '#ede9fe', icon: 'edit-2' },
  narrative: { label: '서사 글감', color: '#059669', bgColor: '#d1fae5', icon: 'book-open' },
  constraint: { label: '제약 글쓰기', color: '#d97706', bgColor: '#fef3c7', icon: 'lock' },
  question: { label: '오늘의 질문', color: '#2563eb', bgColor: '#dbeafe', icon: 'help-circle' },
};

const PromptBookmarks: React.FC<Props> = ({
  bookmarks,
  onSelectPrompt,
  onRemoveBookmark,
  onClose,
}) => {
  const insets = useSafeAreaInsets();
  const [selectedType, setSelectedType] = useState<PromptType | 'all'>('all');
  const [showCompleted, setShowCompleted] = useState(true);

  // 필터링
  const filteredBookmarks = bookmarks.filter((prompt) => {
    const typeMatch = selectedType === 'all' || prompt.type === selectedType;
    const completedMatch = showCompleted || !prompt.isCompleted;
    return typeMatch && completedMatch;
  });

  // 타입별 개수
  const typeCounts = bookmarks.reduce(
    (acc, p) => {
      acc[p.type] = (acc[p.type] || 0) + 1;
      return acc;
    },
    {} as Record<PromptType, number>
  );

  return (
    <View className="flex-1 bg-white">
      {/* 헤더 */}
      <View
        className="bg-white border-b border-gray-100"
        style={{ paddingTop: insets.top }}
      >
        <View className="flex-row items-center justify-between px-5 py-4">
          <Pressable onPress={onClose} hitSlop={12}>
            <Feather name="x" size={24} color="#111827" />
          </Pressable>

          <Text className="text-lg font-wanted-semibold text-gray-900">
            저장한 글감
          </Text>

          <View style={{ width: 24 }} />
        </View>

        {/* 타입 필터 탭 */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          className="px-5 pb-4"
          contentContainerStyle={{ gap: 8 }}
        >
          <FilterTab
            label="전체"
            count={bookmarks.length}
            isSelected={selectedType === 'all'}
            onPress={() => setSelectedType('all')}
          />
          {(Object.entries(PROMPT_TYPE_LABELS) as [PromptType, typeof PROMPT_TYPE_LABELS[PromptType]][]).map(
            ([type, info]) => (
              <FilterTab
                key={type}
                label={info.label}
                count={typeCounts[type] || 0}
                isSelected={selectedType === type}
                onPress={() => setSelectedType(type)}
                color={info.color}
              />
            )
          )}
        </ScrollView>

        {/* 완료된 글감 표시 토글 */}
        <View className="flex-row items-center justify-between px-5 pb-4">
          <Text className="text-sm text-gray-500 font-wanted-regular">
            {filteredBookmarks.length}개의 글감
          </Text>

          <Pressable
            onPress={() => setShowCompleted(!showCompleted)}
            className="flex-row items-center"
          >
            <View
              className={`w-5 h-5 rounded-md border items-center justify-center mr-2 ${
                showCompleted ? 'bg-gray-900 border-gray-900' : 'border-gray-300'
              }`}
            >
              {showCompleted && <Feather name="check" size={12} color="#fff" />}
            </View>
            <Text className="text-sm text-gray-600 font-wanted-regular">
              작성 완료 포함
            </Text>
          </Pressable>
        </View>
      </View>

      {/* 북마크 목록 */}
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ padding: 20 }}
      >
        {filteredBookmarks.length === 0 ? (
          <View className="items-center py-16">
            <View className="w-16 h-16 rounded-full bg-gray-100 items-center justify-center mb-4">
              <Feather name="bookmark" size={32} color="#d1d5db" />
            </View>
            <Text className="text-base text-gray-400 font-wanted-regular">
              저장한 글감이 없어요
            </Text>
            <Text className="mt-1 text-sm text-gray-300 font-wanted-regular text-center">
              마음에 드는 글감을 북마크하면{'\n'}여기서 모아볼 수 있어요
            </Text>
          </View>
        ) : (
          <View className="gap-3">
            {filteredBookmarks.map((prompt) => {
              const typeInfo = PROMPT_TYPE_LABELS[prompt.type];

              return (
                <Pressable
                  key={prompt.id}
                  onPress={() => onSelectPrompt(prompt)}
                  className={`bg-white border rounded-2xl p-4 active:bg-gray-50 ${
                    prompt.isCompleted ? 'border-gray-100 opacity-60' : 'border-gray-200'
                  }`}
                  style={{
                    shadowColor: '#000',
                    shadowOpacity: 0.03,
                    shadowRadius: 6,
                    shadowOffset: { width: 0, height: 2 },
                    elevation: 1,
                  }}
                >
                  {/* 상단: 타입 뱃지 + 삭제 버튼 */}
                  <View className="flex-row items-center justify-between mb-3">
                    <View className="flex-row items-center gap-2">
                      <View
                        className="w-8 h-8 rounded-lg items-center justify-center"
                        style={{ backgroundColor: typeInfo.bgColor }}
                      >
                        <Feather
                          name={typeInfo.icon as keyof typeof Feather.glyphMap}
                          size={14}
                          color={typeInfo.color}
                        />
                      </View>
                      <Text
                        className="text-xs font-wanted-semibold"
                        style={{ color: typeInfo.color }}
                      >
                        {typeInfo.label}
                      </Text>
                      {prompt.isCompleted && (
                        <View className="flex-row items-center bg-green-100 px-2 py-1 rounded-full">
                          <Feather name="check" size={10} color="#059669" />
                          <Text className="ml-1 text-xs text-green-600 font-wanted-semibold">
                            작성완료
                          </Text>
                        </View>
                      )}
                    </View>

                    <Pressable
                      onPress={() => onRemoveBookmark(prompt.id)}
                      hitSlop={12}
                      className="p-2"
                    >
                      <Feather name="x" size={16} color="#d1d5db" />
                    </Pressable>
                  </View>

                  {/* 글감 제목 */}
                  <Text className="text-base font-noto-semibold text-gray-900 leading-6 mb-1">
                    {prompt.title}
                  </Text>

                  {/* 카테고리 */}
                  {prompt.category && (
                    <Text className="text-xs text-gray-400 font-wanted-regular">
                      #{prompt.category}
                    </Text>
                  )}

                  {/* 제약조건 */}
                  {prompt.constraint && (
                    <View className="bg-amber-50 rounded-lg px-3 py-2 mt-3">
                      <Text className="text-xs text-amber-700 font-wanted-regular">
                        {prompt.constraint}
                      </Text>
                    </View>
                  )}

                  {/* 저장 날짜 */}
                  <View className="flex-row items-center mt-3 pt-3 border-t border-gray-50">
                    <Feather name="clock" size={12} color="#d1d5db" />
                    <Text className="ml-1 text-xs text-gray-300 font-wanted-regular">
                      {formatDate(prompt.bookmarkedAt)} 저장
                    </Text>
                  </View>
                </Pressable>
              );
            })}
          </View>
        )}
      </ScrollView>
    </View>
  );
};

// 필터 탭 컴포넌트
interface FilterTabProps {
  label: string;
  count: number;
  isSelected: boolean;
  onPress: () => void;
  color?: string;
}

const FilterTab: React.FC<FilterTabProps> = ({
  label,
  count,
  isSelected,
  onPress,
  color,
}) => (
  <Pressable
    onPress={onPress}
    className={`flex-row items-center px-4 py-2 rounded-full ${
      isSelected ? 'bg-gray-900' : 'bg-gray-100'
    }`}
  >
    <Text
      className={`text-sm font-wanted-semibold ${
        isSelected ? 'text-white' : 'text-gray-600'
      }`}
      style={!isSelected && color ? { color } : undefined}
    >
      {label}
    </Text>
    <View
      className={`ml-2 px-1.5 py-0.5 rounded-full ${
        isSelected ? 'bg-white/20' : 'bg-gray-200'
      }`}
    >
      <Text
        className={`text-xs font-wanted-semibold ${
          isSelected ? 'text-white' : 'text-gray-500'
        }`}
      >
        {count}
      </Text>
    </View>
  </Pressable>
);

// 날짜 포맷 유틸
const formatDate = (date: Date): string => {
  const month = date.getMonth() + 1;
  const day = date.getDate();
  return `${month}월 ${day}일`;
};

export default PromptBookmarks;
