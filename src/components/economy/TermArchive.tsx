import React, { useState } from 'react';
import {
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  EconomyTerm,
  TermCategory,
  CATEGORY_INFO,
  DIFFICULTY_INFO,
} from '../../types/economy';

interface Props {
  terms: EconomyTerm[];
  learnedTermIds: string[];
  bookmarkedTermIds: string[];
  onClose: () => void;
  onSelectTerm: (term: EconomyTerm) => void;
  onToggleBookmark: (termId: string) => void;
}

type FilterType = 'all' | 'learned' | 'bookmarked' | TermCategory;

const TermArchive: React.FC<Props> = ({
  terms,
  learnedTermIds,
  bookmarkedTermIds,
  onClose,
  onSelectTerm,
  onToggleBookmark,
}) => {
  const insets = useSafeAreaInsets();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');

  // 필터링된 용어
  const filteredTerms = terms.filter((term) => {
    // 검색어 필터
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      if (
        !term.term.toLowerCase().includes(query) &&
        !term.termEn?.toLowerCase().includes(query) &&
        !term.definition.toLowerCase().includes(query)
      ) {
        return false;
      }
    }

    // 카테고리/상태 필터
    switch (activeFilter) {
      case 'learned':
        return learnedTermIds.includes(term.id);
      case 'bookmarked':
        return bookmarkedTermIds.includes(term.id);
      case 'macro':
      case 'finance':
      case 'market':
      case 'policy':
        return term.category === activeFilter;
      default:
        return true;
    }
  });

  const filters: { key: FilterType; label: string }[] = [
    { key: 'all', label: '전체' },
    { key: 'learned', label: '학습완료' },
    { key: 'bookmarked', label: '북마크' },
    { key: 'macro', label: '거시경제' },
    { key: 'finance', label: '금융/투자' },
    { key: 'market', label: '시장/산업' },
    { key: 'policy', label: '정책/제도' },
  ];

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

          <Text className="text-sm text-gray-400 font-wanted-regular">
            용어 사전
          </Text>

          <View className="w-20" />
        </View>

        {/* 점선 구분 */}
        <View className="border-t border-dashed border-gray-300" />
      </View>

      {/* 본문 */}
      <View className="flex-1 bg-white">
        {/* 검색 */}
        <View className="px-5 py-4">
          <View className="flex-row items-center bg-gray-100 rounded-xl px-4 py-3">
            <Feather name="search" size={18} color="#9ca3af" />
            <TextInput
              className="flex-1 ml-3 text-base text-gray-800 font-wanted-regular"
              placeholder="용어 검색..."
              placeholderTextColor="#9ca3af"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {searchQuery.length > 0 && (
              <Pressable onPress={() => setSearchQuery('')} hitSlop={8}>
                <Feather name="x" size={18} color="#9ca3af" />
              </Pressable>
            )}
          </View>
        </View>

        {/* 필터 */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          className="border-b border-gray-100"
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 12 }}
        >
          {filters.map((filter) => (
            <Pressable
              key={filter.key}
              onPress={() => setActiveFilter(filter.key)}
              className={`px-4 py-2 rounded-full mr-2 ${
                activeFilter === filter.key ? 'bg-gray-900' : 'bg-gray-100'
              }`}
            >
              <Text
                className={`text-sm font-wanted-semibold ${
                  activeFilter === filter.key ? 'text-white' : 'text-gray-600'
                }`}
              >
                {filter.label}
              </Text>
            </Pressable>
          ))}
        </ScrollView>

        {/* 통계 */}
        <View className="px-5 py-4 flex-row items-center justify-between border-b border-dashed border-gray-200">
          <Text className="text-sm text-gray-500 font-wanted-regular">
            {filteredTerms.length}개의 용어
          </Text>
          <View className="flex-row items-center">
            <Text className="text-sm text-green-600 font-wanted-semibold">
              {learnedTermIds.length}
            </Text>
            <Text className="text-sm text-gray-400 font-wanted-regular">
              /{terms.length} 학습
            </Text>
          </View>
        </View>

        {/* 용어 리스트 */}
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ padding: 16, paddingBottom: insets.bottom + 16 }}
        >
          {filteredTerms.length === 0 ? (
            <View className="items-center py-16">
              <Feather name="book-open" size={40} color="#d1d5db" />
              <Text className="mt-4 text-base text-gray-400 font-noto">
                용어가 없습니다
              </Text>
              <Text className="mt-1 text-sm text-gray-300 font-wanted-regular">
                다른 필터를 선택해보세요
              </Text>
            </View>
          ) : (
            <View className="gap-3">
              {filteredTerms.map((term) => {
                const isLearned = learnedTermIds.includes(term.id);
                const isBookmarked = bookmarkedTermIds.includes(term.id);
                const categoryInfo = CATEGORY_INFO[term.category];
                const difficultyInfo = DIFFICULTY_INFO[term.difficulty];

                return (
                  <Pressable
                    key={term.id}
                    onPress={() => onSelectTerm(term)}
                    className="bg-white border border-gray-100 rounded-xl overflow-hidden"
                  >
                    {/* 카테고리 바 */}
                    <View
                      className="h-1"
                      style={{ backgroundColor: categoryInfo.color }}
                    />

                    <View className="p-4">
                      {/* 용어명 + 북마크 */}
                      <View className="flex-row items-start justify-between mb-2">
                        <View className="flex-1">
                          <View className="flex-row items-center">
                            <Text className="text-lg font-noto-bold text-gray-900">
                              {term.term}
                            </Text>
                            {isLearned && (
                              <View className="ml-2 w-5 h-5 rounded-full bg-green-100 items-center justify-center">
                                <Feather name="check" size={12} color="#22c55e" />
                              </View>
                            )}
                          </View>
                          {term.termEn && (
                            <Text className="text-sm text-gray-400 font-wanted-regular mt-0.5">
                              {term.termEn}
                            </Text>
                          )}
                        </View>

                        <Pressable
                          onPress={() => onToggleBookmark(term.id)}
                          hitSlop={12}
                        >
                          <Feather
                            name="bookmark"
                            size={18}
                            color={isBookmarked ? '#f59e0b' : '#d1d5db'}
                          />
                        </Pressable>
                      </View>

                      {/* 정의 미리보기 */}
                      <Text
                        className="text-sm text-gray-600 font-wanted-regular leading-5 mb-3"
                        numberOfLines={2}
                      >
                        {term.definition}
                      </Text>

                      {/* 메타 정보 */}
                      <View className="flex-row items-center justify-between">
                        <View className="flex-row items-center gap-2">
                          <View
                            className="px-2 py-1 rounded"
                            style={{ backgroundColor: categoryInfo.bgColor }}
                          >
                            <Text
                              className="text-xs font-wanted-semibold"
                              style={{ color: categoryInfo.color }}
                            >
                              {categoryInfo.label}
                            </Text>
                          </View>
                          <View className="flex-row items-center">
                            <View
                              className="w-1.5 h-1.5 rounded-full mr-1"
                              style={{ backgroundColor: difficultyInfo.color }}
                            />
                            <Text className="text-xs text-gray-400 font-wanted-regular">
                              {difficultyInfo.label}
                            </Text>
                          </View>
                        </View>

                        <Feather name="chevron-right" size={16} color="#d1d5db" />
                      </View>
                    </View>
                  </Pressable>
                );
              })}
            </View>
          )}
        </ScrollView>
      </View>
    </View>
  );
};

export default TermArchive;
