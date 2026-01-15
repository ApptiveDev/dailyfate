import React from 'react';
import {
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { LearningStats, LearningRecord, TermCategory, CATEGORY_INFO } from '../../types/economy';

interface Props {
  stats: LearningStats;
  learningHistory: LearningRecord[];
  onClose: () => void;
}

const WEEKDAY_HANJA = ['日', '月', '火', '水', '木', '金', '土'];

const LearningStreak: React.FC<Props> = ({
  stats,
  learningHistory,
  onClose,
}) => {
  const insets = useSafeAreaInsets();

  // 잔디 데이터 생성 (최근 12주)
  const generateGrassData = () => {
    const today = new Date();
    const weeks: { date: Date; learned: boolean; isCorrect?: boolean }[][] = [];

    // 12주 전부터 시작
    const startDate = new Date(today);
    startDate.setDate(startDate.getDate() - 83); // 약 12주

    // 시작일을 일요일로 맞춤
    startDate.setDate(startDate.getDate() - startDate.getDay());

    let currentWeek: { date: Date; learned: boolean; isCorrect?: boolean }[] = [];

    for (let i = 0; i < 84; i++) {
      const date = new Date(startDate);
      date.setDate(startDate.getDate() + i);

      // 학습 기록 확인
      const record = learningHistory.find(
        (r) => r.date.toDateString() === date.toDateString()
      );

      currentWeek.push({
        date,
        learned: !!record,
        isCorrect: record?.isCorrect,
      });

      if (currentWeek.length === 7) {
        weeks.push(currentWeek);
        currentWeek = [];
      }
    }

    return weeks;
  };

  const grassData = generateGrassData();

  // 잔디 색상 결정
  const getGrassColor = (learned: boolean, isCorrect?: boolean) => {
    if (!learned) return '#e5e7eb'; // 미학습
    if (isCorrect === true) return '#22c55e'; // 정답
    if (isCorrect === false) return '#fbbf24'; // 오답
    return '#86efac'; // 학습만 (퀴즈 없음)
  };

  // 정답률
  const accuracy =
    stats.totalQuizAnswered > 0
      ? Math.round((stats.correctAnswers / stats.totalQuizAnswered) * 100)
      : 0;

  // 카테고리별 진행률
  const categoryEntries = Object.entries(stats.categoryProgress) as [TermCategory, number][];

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
            학습 기록
          </Text>

          <View className="w-20" />
        </View>

        {/* 점선 구분 */}
        <View className="border-t border-dashed border-gray-300" />
      </View>

      {/* 본문 */}
      <ScrollView
        style={{ flex: 1 }}
        className="bg-white"
        contentContainerStyle={{ paddingBottom: insets.bottom + 24 }}
      >
        {/* 연속 학습 */}
        <View className="px-6 py-8">
          <View className="items-center">
            <View className="flex-row items-end">
              <Text className="text-6xl font-noto-bold text-gray-900">
                {stats.currentStreak}
              </Text>
              <Text className="text-xl text-gray-500 font-wanted-regular mb-2 ml-1">
                일
              </Text>
            </View>
            <Text className="text-base text-gray-500 font-wanted-regular mt-2">
              연속 학습 중
            </Text>

            {stats.longestStreak > stats.currentStreak && (
              <View className="flex-row items-center mt-4 bg-amber-50 rounded-full px-4 py-2">
                <Feather name="award" size={14} color="#f59e0b" />
                <Text className="ml-1 text-sm text-amber-700 font-wanted-semibold">
                  최장 기록: {stats.longestStreak}일
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* 점선 구분 */}
        <View className="border-t border-dashed border-gray-200 mx-6" />

        {/* 잔디 그래프 */}
        <View className="px-6 py-6">
          <Text className="text-sm text-gray-400 font-wanted-regular mb-4">
            학습 잔디 (최근 12주)
          </Text>

          {/* 요일 레이블 */}
          <View className="flex-row mb-2">
            <View className="w-6" />
            {WEEKDAY_HANJA.map((day, idx) => (
              <View key={day} className="flex-1 items-center">
                <Text
                  className="text-xs font-noto-semibold"
                  style={{
                    color: idx === 0 ? '#dc2626' : idx === 6 ? '#2563eb' : '#9ca3af',
                  }}
                >
                  {day}
                </Text>
              </View>
            ))}
          </View>

          {/* 잔디 그리드 */}
          <View className="flex-row">
            <View className="w-6" />
            <View className="flex-1">
              {grassData.map((week, weekIdx) => (
                <View key={weekIdx} className="flex-row mb-1">
                  {week.map((day, dayIdx) => (
                    <View key={dayIdx} className="flex-1 aspect-square p-0.5">
                      <View
                        className="flex-1 rounded-sm"
                        style={{ backgroundColor: getGrassColor(day.learned, day.isCorrect) }}
                      />
                    </View>
                  ))}
                </View>
              ))}
            </View>
          </View>

          {/* 범례 */}
          <View className="flex-row items-center justify-center mt-4 gap-4">
            <View className="flex-row items-center">
              <View className="w-3 h-3 rounded-sm bg-gray-200 mr-1" />
              <Text className="text-xs text-gray-400 font-wanted-regular">미학습</Text>
            </View>
            <View className="flex-row items-center">
              <View className="w-3 h-3 rounded-sm bg-green-500 mr-1" />
              <Text className="text-xs text-gray-400 font-wanted-regular">정답</Text>
            </View>
            <View className="flex-row items-center">
              <View className="w-3 h-3 rounded-sm bg-amber-400 mr-1" />
              <Text className="text-xs text-gray-400 font-wanted-regular">오답</Text>
            </View>
          </View>
        </View>

        {/* 점선 구분 */}
        <View className="border-t border-dashed border-gray-200 mx-6" />

        {/* 통계 카드 */}
        <View className="px-6 py-6">
          <Text className="text-sm text-gray-400 font-wanted-regular mb-4">
            학습 통계
          </Text>

          <View className="flex-row gap-3 mb-3">
            <View className="flex-1 bg-stone-100 rounded-xl p-4">
              <Text className="text-sm text-gray-500 font-wanted-regular mb-1">
                학습 용어
              </Text>
              <Text className="text-2xl font-noto-bold text-gray-900">
                {stats.totalTermsLearned}개
              </Text>
            </View>
            <View className="flex-1 bg-stone-100 rounded-xl p-4">
              <Text className="text-sm text-gray-500 font-wanted-regular mb-1">
                퀴즈 정답률
              </Text>
              <Text className="text-2xl font-noto-bold text-gray-900">
                {accuracy}%
              </Text>
            </View>
          </View>

          <View className="bg-stone-100 rounded-xl p-4">
            <View className="flex-row items-center justify-between">
              <Text className="text-sm text-gray-500 font-wanted-regular">
                총 풀이 횟수
              </Text>
              <Text className="text-lg font-noto-bold text-gray-900">
                {stats.totalQuizAnswered}회
              </Text>
            </View>
            <View className="flex-row items-center mt-3">
              <View className="flex-row items-center mr-4">
                <View className="w-2 h-2 rounded-full bg-green-500 mr-1.5" />
                <Text className="text-sm text-gray-600 font-wanted-regular">
                  정답 {stats.correctAnswers}회
                </Text>
              </View>
              <View className="flex-row items-center">
                <View className="w-2 h-2 rounded-full bg-red-400 mr-1.5" />
                <Text className="text-sm text-gray-600 font-wanted-regular">
                  오답 {stats.totalQuizAnswered - stats.correctAnswers}회
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* 점선 구분 */}
        <View className="border-t border-dashed border-gray-200 mx-6" />

        {/* 카테고리별 진행률 */}
        <View className="px-6 py-6">
          <Text className="text-sm text-gray-400 font-wanted-regular mb-4">
            카테고리별 학습 진행률
          </Text>

          <View className="gap-3">
            {categoryEntries.map(([category, progress]) => {
              const categoryInfo = CATEGORY_INFO[category];
              const percentage = Math.min(progress, 100);

              return (
                <View key={category} className="bg-white border border-gray-100 rounded-xl p-4">
                  <View className="flex-row items-center justify-between mb-3">
                    <View className="flex-row items-center">
                      <View
                        className="w-8 h-8 rounded-lg items-center justify-center mr-3"
                        style={{ backgroundColor: categoryInfo.bgColor }}
                      >
                        <Feather
                          name={categoryInfo.icon as keyof typeof Feather.glyphMap}
                          size={16}
                          color={categoryInfo.color}
                        />
                      </View>
                      <Text className="text-base font-wanted-semibold text-gray-800">
                        {categoryInfo.label}
                      </Text>
                    </View>
                    <Text className="text-sm font-wanted-semibold text-gray-600">
                      {percentage}%
                    </Text>
                  </View>

                  {/* 프로그레스 바 */}
                  <View className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <View
                      className="h-full rounded-full"
                      style={{
                        width: `${percentage}%`,
                        backgroundColor: categoryInfo.color,
                      }}
                    />
                  </View>
                </View>
              );
            })}
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

export default LearningStreak;
