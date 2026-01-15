import React, { useState } from 'react';
import {
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { WritingPrompt, WritingEntry } from '../types/writing';

interface Props {
  prompt: WritingPrompt | null;
  recentEntries?: WritingEntry[]; // 최근 작성된 글들 (커뮤니티/내 글)
  totalWritten?: number; // 총 작성된 글 수
  onStartWriting: () => void;
  onOpenArchive: () => void;
  onOpenSettings: () => void;
  onSelectEntry?: (entry: WritingEntry) => void;
  onRefreshPrompt?: () => void;
}

const WritingPromptCard: React.FC<Props> = ({
  prompt,
  recentEntries = [],
  totalWritten = 0,
  onStartWriting,
  onOpenArchive,
  onOpenSettings,
  onSelectEntry,
  onRefreshPrompt,
}) => {
  const insets = useSafeAreaInsets();
  const [sortBy, setSortBy] = useState<'latest' | 'popular'>('latest');

  if (!prompt) return null;

  return (
    <View className="flex-1 bg-[#f8f8f8]">
      {/* 헤더 */}
      <View
        className="flex-row items-center justify-between px-5"
        style={{ paddingTop: insets.top + 12 }}
      >
        <Pressable
          onPress={onOpenArchive}
          className="flex-row items-center bg-white px-4 py-2 rounded-full"
          style={{
            shadowColor: '#000',
            shadowOpacity: 0.04,
            shadowRadius: 4,
            shadowOffset: { width: 0, height: 1 },
          }}
        >
          <Feather name="chevron-left" size={16} color="#374151" />
          <Text className="ml-1 text-sm text-gray-700 font-wanted-semibold">
            내 글
          </Text>
        </Pressable>

        <Pressable onPress={onOpenSettings} hitSlop={12}>
          <Feather name="settings" size={20} color="#9ca3af" />
        </Pressable>
      </View>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: insets.bottom + 20 }}
        showsVerticalScrollIndicator={false}
      >
        {/* 글감 영역 */}
        <View className="px-8 pt-16 pb-8">
          {/* 글감 제목 */}
          <Text className="text-2xl font-noto-bold text-gray-900 text-center leading-9 mb-8">
            {prompt.title}
          </Text>

          {/* 글감 본문/설명 */}
          {prompt.description && (
            <Text className="text-base text-gray-500 font-noto text-center leading-7 mb-6">
              {prompt.description}
            </Text>
          )}

          {/* 출처 (있는 경우) */}
          {prompt.category && (
            <Text className="text-sm text-gray-400 font-wanted-regular text-center mb-8">
              #{prompt.category}
            </Text>
          )}

          {/* 글쓰기 버튼 */}
          <Pressable
            onPress={onStartWriting}
            className="flex-row items-center justify-center bg-white mx-4 py-4 rounded-2xl"
            style={{
              shadowColor: '#000',
              shadowOpacity: 0.06,
              shadowRadius: 12,
              shadowOffset: { width: 0, height: 4 },
              elevation: 3,
            }}
          >
            <Feather name="edit-3" size={18} color="#374151" />
            <Text className="ml-2 text-base text-gray-700 font-wanted-semibold">
              &apos;{prompt.title.slice(0, 10)}{prompt.title.length > 10 ? '...' : ''}&apos;으로 글쓰기
            </Text>
          </Pressable>

          {/* 다른 글감 보기 */}
          {onRefreshPrompt && (
            <Pressable
              onPress={onRefreshPrompt}
              className="flex-row items-center justify-center mt-4"
            >
              <Feather name="refresh-cw" size={14} color="#9ca3af" />
              <Text className="ml-1.5 text-sm text-gray-400 font-wanted-regular">
                다른 글감 보기
              </Text>
            </Pressable>
          )}
        </View>

        {/* 구분선 */}
        <View className="h-2 bg-gray-100" />

        {/* 최근 글 목록 */}
        <View className="px-5 pt-5">
          {/* 통계 + 정렬 */}
          <View className="flex-row items-center justify-between mb-4">
            <View className="bg-white px-3 py-1.5 rounded-full">
              <Text className="text-xs text-gray-600 font-wanted-semibold">
                {totalWritten.toLocaleString()}편 작성됨
              </Text>
            </View>

            <Pressable
              onPress={() => setSortBy(sortBy === 'latest' ? 'popular' : 'latest')}
              className="flex-row items-center bg-white px-3 py-1.5 rounded-full"
            >
              <Feather name="sliders" size={12} color="#6b7280" />
              <Text className="ml-1.5 text-xs text-gray-600 font-wanted-semibold">
                {sortBy === 'latest' ? '최신순' : '인기순'}
              </Text>
            </Pressable>
          </View>

          {/* 글 카드 목록 */}
          {recentEntries.length > 0 ? (
            <View className="gap-3">
              {recentEntries.map((entry) => (
                <EntryCard
                  key={entry.id}
                  entry={entry}
                  promptTitle={prompt.title}
                  onPress={() => onSelectEntry?.(entry)}
                />
              ))}
            </View>
          ) : (
            <View className="items-center py-12">
              <Text className="text-sm text-gray-400 font-wanted-regular">
                아직 작성된 글이 없어요
              </Text>
              <Text className="text-xs text-gray-300 font-wanted-regular mt-1">
                첫 번째 글을 작성해보세요
              </Text>
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
};

// 글 카드 컴포넌트
interface EntryCardProps {
  entry: WritingEntry;
  promptTitle: string;
  onPress: () => void;
}

const EntryCard: React.FC<EntryCardProps> = ({ entry, promptTitle, onPress }) => {
  const formatDate = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hour = String(date.getHours()).padStart(2, '0');
    return `${year}년 ${month}월 ${day}일 ${hour}시`;
  };

  return (
    <Pressable
      onPress={onPress}
      className="bg-white rounded-2xl p-5 border border-gray-100"
      style={{
        shadowColor: '#000',
        shadowOpacity: 0.02,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 2 },
      }}
    >
      {/* 글감 제목 */}
      <Text className="text-lg font-noto-semibold text-gray-800 text-center mb-4">
        {promptTitle.slice(0, 15)}{promptTitle.length > 15 ? '...' : ''}
      </Text>

      {/* 작성한 글 */}
      <Text
        className="text-base text-gray-600 font-noto leading-7 text-center"
        numberOfLines={4}
      >
        {entry.text}
      </Text>

      {/* 작성자 + 날짜 */}
      <View className="items-center mt-5 pt-4 border-t border-gray-50">
        <Text className="text-xs text-gray-400 font-wanted-regular">
          {entry.userId === 'user-1' ? '나의 글' : '익명'}
        </Text>
        <Text className="text-xs text-gray-300 font-wanted-regular mt-0.5">
          {formatDate(entry.writtenAt)}
        </Text>
      </View>
    </Pressable>
  );
};

export default WritingPromptCard;
