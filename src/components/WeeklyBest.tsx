import React, { useState } from 'react';
import {
  Pressable,
  ScrollView,
  Text,
  View,
  Share,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { PromptType, BestSentence, WeekInfo } from '../types/writing';

interface Props {
  weeklyBests: WeekInfo[];
  currentWeek: WeekInfo;
  onSelectSentence: (sentence: BestSentence) => void;
  onRemoveBest: (sentenceId: string) => void;
  onClose: () => void;
}

const PROMPT_TYPE_COLORS: Record<PromptType, { color: string; bgColor: string }> = {
  copywriting: { color: '#7c3aed', bgColor: '#ede9fe' },
  narrative: { color: '#059669', bgColor: '#d1fae5' },
  constraint: { color: '#d97706', bgColor: '#fef3c7' },
  question: { color: '#2563eb', bgColor: '#dbeafe' },
};

const WeeklyBest: React.FC<Props> = ({
  weeklyBests,
  currentWeek,
  onSelectSentence,
  onRemoveBest,
  onClose,
}) => {
  const insets = useSafeAreaInsets();
  const [selectedWeekIdx, setSelectedWeekIdx] = useState(0);

  const selectedWeek = selectedWeekIdx === 0 ? currentWeek : weeklyBests[selectedWeekIdx - 1];

  // 공유 기능
  const handleShare = async (sentence: BestSentence) => {
    try {
      await Share.share({
        message: `"${sentence.text}"\n\n- 1분 글감 일력에서`,
      });
    } catch {
      // 공유 실패 처리
    }
  };

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

          <View className="items-center">
            <Text className="text-lg font-wanted-semibold text-gray-900">
              나의 베스트 문장
            </Text>
            <Text className="text-xs text-gray-400 font-wanted-regular mt-0.5">
              직접 선정한 주간 베스트
            </Text>
          </View>

          <View style={{ width: 24 }} />
        </View>

        {/* 주차 선택 */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          className="px-5 pb-4"
          contentContainerStyle={{ gap: 8 }}
        >
          <WeekTab
            label="이번 주"
            count={currentWeek.sentences.length}
            isSelected={selectedWeekIdx === 0}
            onPress={() => setSelectedWeekIdx(0)}
            isCurrentWeek
          />
          {weeklyBests.map((week, idx) => (
            <WeekTab
              key={`${week.year}-${week.weekNumber}`}
              label={formatWeekRange(week.startDate, week.endDate)}
              count={week.sentences.length}
              isSelected={selectedWeekIdx === idx + 1}
              onPress={() => setSelectedWeekIdx(idx + 1)}
            />
          ))}
        </ScrollView>
      </View>

      {/* 베스트 문장 목록 */}
      <ScrollView
        className="flex-1 bg-gray-50"
        contentContainerStyle={{ padding: 20 }}
      >
        {!selectedWeek || selectedWeek.sentences.length === 0 ? (
          <View className="items-center py-16">
            <View className="w-20 h-20 rounded-full bg-amber-50 items-center justify-center mb-4">
              <Feather name="star" size={36} color="#f59e0b" />
            </View>
            <Text className="text-base text-gray-500 font-wanted-semibold">
              아직 선정한 문장이 없어요
            </Text>
            <Text className="mt-2 text-sm text-gray-400 font-wanted-regular text-center">
              내 글 모아보기에서{'\n'}마음에 드는 문장을 베스트로 선정해보세요
            </Text>
          </View>
        ) : (
          <View className="gap-4">
            {selectedWeek.sentences.map((sentence, idx) => {
              const typeColor = PROMPT_TYPE_COLORS[sentence.promptType];
              const writtenDate = sentence.writtenAt;

              return (
                <Pressable
                  key={sentence.id}
                  onPress={() => onSelectSentence(sentence)}
                  className="bg-white rounded-2xl overflow-hidden"
                  style={{
                    shadowColor: '#000',
                    shadowOpacity: 0.06,
                    shadowRadius: 12,
                    shadowOffset: { width: 0, height: 4 },
                    elevation: 3,
                  }}
                >
                  {/* 메인 카드 */}
                  <View className="p-5">
                    {/* 순위 뱃지 */}
                    <View className="flex-row items-center justify-between mb-4">
                      <View className="flex-row items-center gap-2">
                        <View
                          className={`w-8 h-8 rounded-full items-center justify-center ${
                            idx === 0
                              ? 'bg-amber-400'
                              : idx === 1
                              ? 'bg-gray-300'
                              : idx === 2
                              ? 'bg-amber-600'
                              : 'bg-gray-200'
                          }`}
                        >
                          {idx < 3 ? (
                            <Feather name="award" size={16} color="#fff" />
                          ) : (
                            <Text className="text-xs font-wanted-semibold text-gray-500">
                              {idx + 1}
                            </Text>
                          )}
                        </View>

                        <View
                          className="px-2 py-1 rounded-md"
                          style={{ backgroundColor: typeColor.bgColor }}
                        >
                          <Text
                            className="text-xs font-wanted-semibold"
                            style={{ color: typeColor.color }}
                          >
                            {sentence.promptType === 'copywriting' && '카피'}
                            {sentence.promptType === 'narrative' && '서사'}
                            {sentence.promptType === 'constraint' && '제약'}
                            {sentence.promptType === 'question' && '질문'}
                          </Text>
                        </View>
                      </View>

                      {/* 액션 버튼들 */}
                      <View className="flex-row items-center gap-2">
                        <Pressable
                          onPress={() => handleShare(sentence)}
                          hitSlop={8}
                          className="p-2"
                        >
                          <Feather name="share" size={16} color="#9ca3af" />
                        </Pressable>
                        <Pressable
                          onPress={() => onRemoveBest(sentence.id)}
                          hitSlop={8}
                          className="p-2"
                        >
                          <Feather name="x" size={16} color="#d1d5db" />
                        </Pressable>
                      </View>
                    </View>

                    {/* 문장 내용 */}
                    <View className="bg-gray-50 rounded-xl p-4 mb-3">
                      <Text className="text-lg text-gray-800 font-noto leading-8">
                        &quot;{sentence.text}&quot;
                      </Text>
                    </View>

                    {/* 글감 정보 */}
                    <View className="flex-row items-center justify-between">
                      <Text className="text-xs text-gray-400 font-wanted-regular" numberOfLines={1}>
                        {sentence.promptTitle}
                      </Text>
                      <Text className="text-xs text-gray-300 font-wanted-regular">
                        {formatDate(writtenDate)}
                      </Text>
                    </View>
                  </View>
                </Pressable>
              );
            })}
          </View>
        )}

        {/* 하단 안내 */}
        {selectedWeek && selectedWeek.sentences.length > 0 && (
          <View className="mt-8 p-4 bg-white rounded-xl border border-gray-100">
            <View className="flex-row items-start">
              <Feather name="info" size={16} color="#9ca3af" />
              <Text className="ml-2 text-sm text-gray-400 font-wanted-regular flex-1">
                베스트 문장은 내 글 모아보기에서 별표를 눌러 선정할 수 있어요.
                매주 최대 7개까지 선정 가능합니다.
              </Text>
            </View>
          </View>
        )}
      </ScrollView>
    </View>
  );
};

// 주차 탭 컴포넌트
interface WeekTabProps {
  label: string;
  count: number;
  isSelected: boolean;
  onPress: () => void;
  isCurrentWeek?: boolean;
}

const WeekTab: React.FC<WeekTabProps> = ({
  label,
  count,
  isSelected,
  onPress,
  isCurrentWeek,
}) => (
  <Pressable
    onPress={onPress}
    className={`px-4 py-2.5 rounded-xl ${
      isSelected ? 'bg-gray-900' : 'bg-gray-100'
    }`}
  >
    <View className="flex-row items-center">
      {isCurrentWeek && (
        <View
          className={`w-2 h-2 rounded-full mr-2 ${
            isSelected ? 'bg-green-400' : 'bg-green-500'
          }`}
        />
      )}
      <Text
        className={`text-sm font-wanted-semibold ${
          isSelected ? 'text-white' : 'text-gray-600'
        }`}
      >
        {label}
      </Text>
      {count > 0 && (
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
      )}
    </View>
  </Pressable>
);

// 날짜 포맷 유틸
const formatDate = (date: Date): string => {
  const month = date.getMonth() + 1;
  const day = date.getDate();
  return `${month}/${day}`;
};

const formatWeekRange = (start: Date, end: Date): string => {
  const startMonth = start.getMonth() + 1;
  const startDay = start.getDate();
  const endMonth = end.getMonth() + 1;
  const endDay = end.getDate();

  if (startMonth === endMonth) {
    return `${startMonth}/${startDay}-${endDay}`;
  }
  return `${startMonth}/${startDay}-${endMonth}/${endDay}`;
};

export default WeeklyBest;
