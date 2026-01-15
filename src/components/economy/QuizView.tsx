import React, { useState } from 'react';
import {
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { EconomyTerm, Quiz, CATEGORY_INFO, NewsArticle } from '../../types/economy';

interface Props {
  term: EconomyTerm;
  quiz: Quiz | null;
  articles: NewsArticle[];
  onClose: () => void;
  onComplete: (isCorrect: boolean) => void;
  onOpenArticle?: (url: string) => void;
}

const QuizView: React.FC<Props> = ({
  term,
  quiz,
  articles,
  onClose,
  onComplete,
  onOpenArticle,
}) => {
  const insets = useSafeAreaInsets();
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [step, setStep] = useState<'definition' | 'quiz' | 'result' | 'articles'>('definition');

  const categoryInfo = CATEGORY_INFO[term.category];
  const isCorrect = selectedAnswer === quiz?.correctIndex;

  const handleSelectAnswer = (index: number) => {
    if (showResult) return;
    setSelectedAnswer(index);
  };

  const handleSubmit = () => {
    if (selectedAnswer === null) return;
    setShowResult(true);
    setStep('result');
  };

  const handleComplete = () => {
    onComplete(isCorrect);
  };

  const handleViewArticles = () => {
    setStep('articles');
  };

  const renderDefinitionStep = () => (
    <ScrollView
      style={{ flex: 1 }}
      contentContainerStyle={{ padding: 24, paddingBottom: insets.bottom + 24 }}
    >
      {/* 용어 */}
      <View className="items-center mb-8">
        <View
          className="px-4 py-1.5 rounded-full mb-4"
          style={{ backgroundColor: categoryInfo.bgColor }}
        >
          <Text
            className="text-sm font-wanted-semibold"
            style={{ color: categoryInfo.color }}
          >
            {categoryInfo.label}
          </Text>
        </View>
        <Text className="text-3xl font-noto-bold text-gray-900 text-center">
          {term.term}
        </Text>
        {term.termEn && (
          <Text className="text-base text-gray-400 font-wanted-regular mt-2">
            {term.termEn}
          </Text>
        )}
      </View>

      {/* 점선 구분 */}
      <View className="border-t border-dashed border-gray-200 mb-8" />

      {/* 정의 카드 */}
      <View className="bg-white border border-gray-100 rounded-2xl p-6 mb-6">
        <View className="flex-row items-center mb-4">
          <View className="w-8 h-8 rounded-lg bg-blue-50 items-center justify-center">
            <Feather name="book" size={16} color="#2563eb" />
          </View>
          <Text className="ml-3 text-sm text-gray-500 font-wanted-semibold">
            초간단 정의
          </Text>
        </View>
        <Text className="text-lg text-gray-800 font-noto leading-8">
          {term.definition}
        </Text>
      </View>

      {/* 예시 카드 */}
      <View className="bg-stone-100 rounded-2xl p-6 mb-6">
        <View className="flex-row items-center mb-4">
          <View className="w-8 h-8 rounded-lg bg-amber-50 items-center justify-center">
            <Feather name="zap" size={16} color="#f59e0b" />
          </View>
          <Text className="ml-3 text-sm text-gray-500 font-wanted-semibold">
            쉬운 예시
          </Text>
        </View>
        <Text className="text-base text-gray-700 font-noto leading-7">
          {term.example}
        </Text>
      </View>

      {/* 관련 기사 */}
      {articles.length > 0 && (
        <View className="mb-8">
          <View className="flex-row items-center mb-4">
            <View className="w-8 h-8 rounded-lg bg-green-50 items-center justify-center">
              <Feather name="external-link" size={16} color="#22c55e" />
            </View>
            <Text className="ml-3 text-sm text-gray-500 font-wanted-semibold">
              관련 기사로 더 알아보기
            </Text>
          </View>
          <View className="gap-3">
            {articles.map((article) => {
              const date = article.publishedAt;
              const dateStr = `${date.getMonth() + 1}.${date.getDate()}`;

              return (
                <Pressable
                  key={article.id}
                  onPress={() => onOpenArticle?.(article.url)}
                  className="bg-white border border-gray-200 rounded-xl p-4 flex-row items-center"
                >
                  <View className="flex-1">
                    <Text
                      className="text-base text-gray-800 font-wanted-regular leading-6"
                      numberOfLines={2}
                    >
                      {article.title}
                    </Text>
                    <View className="flex-row items-center mt-2">
                      <Text className="text-sm text-gray-400 font-wanted-regular">
                        {article.source}
                      </Text>
                      <View className="w-1 h-1 rounded-full bg-gray-300 mx-2" />
                      <Text className="text-sm text-gray-400 font-wanted-regular">
                        {dateStr}
                      </Text>
                    </View>
                  </View>
                  <Feather name="chevron-right" size={18} color="#9ca3af" />
                </Pressable>
              );
            })}
          </View>
        </View>
      )}

      {/* 다음 버튼 */}
      <Pressable
        onPress={() => setStep('quiz')}
        className="bg-gray-900 rounded-full py-4 items-center"
      >
        <Text className="text-base text-white font-wanted-semibold">
          퀴즈 풀기
        </Text>
      </Pressable>
    </ScrollView>
  );

  const renderQuizStep = () => (
    <ScrollView
      style={{ flex: 1 }}
      contentContainerStyle={{ padding: 24, paddingBottom: insets.bottom + 24 }}
    >
      {quiz && (
        <>
          {/* 퀴즈 문제 */}
          <View className="mb-8">
            <View className="flex-row items-center mb-4">
              <View className="w-8 h-8 rounded-full bg-gray-900 items-center justify-center">
                <Text className="text-sm text-white font-wanted-semibold">Q</Text>
              </View>
              <Text className="ml-3 text-sm text-gray-500 font-wanted-semibold">
                오늘의 체크 질문
              </Text>
            </View>
            <Text className="text-xl font-noto-bold text-gray-900 leading-8">
              {quiz.question}
            </Text>
          </View>

          {/* 점선 구분 */}
          <View className="border-t border-dashed border-gray-200 mb-8" />

          {/* 선택지 */}
          <View className="gap-3 mb-8">
            {quiz.options.map((option, index) => {
              const isSelected = selectedAnswer === index;
              const isCorrectOption = index === quiz.correctIndex;

              let bgColor = 'bg-white border-gray-200';
              let textColor = 'text-gray-800';

              if (showResult) {
                if (isCorrectOption) {
                  bgColor = 'bg-green-50 border-green-300';
                  textColor = 'text-green-700';
                } else if (isSelected && !isCorrectOption) {
                  bgColor = 'bg-red-50 border-red-300';
                  textColor = 'text-red-700';
                }
              } else if (isSelected) {
                bgColor = 'bg-gray-100 border-gray-400';
              }

              return (
                <Pressable
                  key={index}
                  onPress={() => handleSelectAnswer(index)}
                  className={`border rounded-xl p-4 flex-row items-center ${bgColor}`}
                  disabled={showResult}
                >
                  <View
                    className={`w-8 h-8 rounded-full items-center justify-center mr-3 ${
                      showResult && isCorrectOption
                        ? 'bg-green-500'
                        : showResult && isSelected && !isCorrectOption
                        ? 'bg-red-500'
                        : isSelected
                        ? 'bg-gray-900'
                        : 'bg-gray-100'
                    }`}
                  >
                    {showResult && isCorrectOption ? (
                      <Feather name="check" size={16} color="#fff" />
                    ) : showResult && isSelected && !isCorrectOption ? (
                      <Feather name="x" size={16} color="#fff" />
                    ) : (
                      <Text
                        className={`text-sm font-wanted-semibold ${
                          isSelected ? 'text-white' : 'text-gray-500'
                        }`}
                      >
                        {index + 1}
                      </Text>
                    )}
                  </View>
                  <Text className={`flex-1 text-base font-wanted-regular ${textColor}`}>
                    {option}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          {/* 제출 버튼 */}
          {!showResult && (
            <Pressable
              onPress={handleSubmit}
              disabled={selectedAnswer === null}
              className={`rounded-full py-4 items-center ${
                selectedAnswer !== null ? 'bg-gray-900' : 'bg-gray-200'
              }`}
            >
              <Text
                className={`text-base font-wanted-semibold ${
                  selectedAnswer !== null ? 'text-white' : 'text-gray-400'
                }`}
              >
                정답 확인
              </Text>
            </Pressable>
          )}
        </>
      )}
    </ScrollView>
  );

  const renderResultStep = () => (
    <ScrollView
      style={{ flex: 1 }}
      contentContainerStyle={{ padding: 24, paddingBottom: insets.bottom + 24 }}
    >
      {/* 결과 */}
      <View className="items-center mb-8">
        <View
          className={`w-20 h-20 rounded-full items-center justify-center mb-4 ${
            isCorrect ? 'bg-green-100' : 'bg-red-100'
          }`}
        >
          <Feather
            name={isCorrect ? 'check' : 'x'}
            size={40}
            color={isCorrect ? '#22c55e' : '#ef4444'}
          />
        </View>
        <Text className="text-2xl font-noto-bold text-gray-900">
          {isCorrect ? '정답입니다!' : '아쉬워요'}
        </Text>
        <Text className="text-base text-gray-500 font-wanted-regular mt-2">
          {isCorrect ? '경제 감각이 쑥쑥 자라고 있어요' : '다음엔 맞출 수 있을 거예요'}
        </Text>
      </View>

      {/* 점선 구분 */}
      <View className="border-t border-dashed border-gray-200 mb-8" />

      {/* 해설 */}
      {quiz?.explanation && (
        <View className="bg-stone-100 rounded-2xl p-5 mb-8">
          <View className="flex-row items-center mb-3">
            <Feather name="info" size={16} color="#6b7280" />
            <Text className="ml-2 text-sm text-gray-500 font-wanted-semibold">
              해설
            </Text>
          </View>
          <Text className="text-base text-gray-700 font-noto leading-7">
            {quiz.explanation}
          </Text>
        </View>
      )}

      {/* 버튼들 */}
      <View className="gap-3">
        {articles.length > 0 && (
          <Pressable
            onPress={handleViewArticles}
            className="border border-gray-200 rounded-full py-4 items-center flex-row justify-center"
          >
            <Feather name="file-text" size={18} color="#374151" />
            <Text className="ml-2 text-base text-gray-700 font-wanted-semibold">
              관련 기사 보기 ({articles.length})
            </Text>
          </Pressable>
        )}
        <Pressable
          onPress={handleComplete}
          className="bg-gray-900 rounded-full py-4 items-center"
        >
          <Text className="text-base text-white font-wanted-semibold">
            학습 완료
          </Text>
        </Pressable>
      </View>
    </ScrollView>
  );

  const renderArticlesStep = () => (
    <ScrollView
      style={{ flex: 1 }}
      contentContainerStyle={{ padding: 24, paddingBottom: insets.bottom + 24 }}
    >
      <Text className="text-xl font-noto-bold text-gray-900 mb-2">
        관련 기사
      </Text>
      <Text className="text-sm text-gray-500 font-wanted-regular mb-6">
        &quot;{term.term}&quot; 관련 최신 뉴스
      </Text>

      {/* 점선 구분 */}
      <View className="border-t border-dashed border-gray-200 mb-6" />

      {/* 기사 리스트 */}
      <View className="gap-4">
        {articles.map((article) => {
          const date = article.publishedAt;
          const dateStr = `${date.getMonth() + 1}.${date.getDate()}`;

          return (
            <Pressable
              key={article.id}
              onPress={() => onOpenArticle?.(article.url)}
              className="bg-white border border-gray-100 rounded-xl p-4"
            >
              <Text className="text-base text-gray-800 font-wanted-regular leading-6 mb-3">
                {article.title}
              </Text>
              <View className="flex-row items-center justify-between">
                <View className="flex-row items-center">
                  <Text className="text-sm text-gray-500 font-wanted-regular">
                    {article.source}
                  </Text>
                  <View className="w-1 h-1 rounded-full bg-gray-300 mx-2" />
                  <Text className="text-sm text-gray-400 font-wanted-regular">
                    {dateStr}
                  </Text>
                </View>
                <Feather name="external-link" size={14} color="#9ca3af" />
              </View>
            </Pressable>
          );
        })}
      </View>

      {/* 완료 버튼 */}
      <Pressable
        onPress={handleComplete}
        className="bg-gray-900 rounded-full py-4 items-center mt-8"
      >
        <Text className="text-base text-white font-wanted-semibold">
          학습 완료
        </Text>
      </Pressable>
    </ScrollView>
  );

  const getStepTitle = () => {
    switch (step) {
      case 'definition':
        return '용어 학습';
      case 'quiz':
        return '퀴즈';
      case 'result':
        return '결과';
      case 'articles':
        return '관련 기사';
      default:
        return '';
    }
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
            <Feather name="x" size={20} color="#6b7280" />
            <Text className="ml-1 text-base text-gray-500 font-wanted-regular">
              닫기
            </Text>
          </Pressable>

          <Text className="text-sm text-gray-400 font-wanted-regular">
            {getStepTitle()}
          </Text>

          <View className="w-16" />
        </View>

        {/* 진행 표시 */}
        <View className="flex-row gap-2 pb-4">
          {['definition', 'quiz', 'result'].map((s, idx) => (
            <View
              key={s}
              className={`flex-1 h-1 rounded-full ${
                ['definition', 'quiz', 'result', 'articles'].indexOf(step) >= idx
                  ? 'bg-gray-900'
                  : 'bg-gray-200'
              }`}
            />
          ))}
        </View>

        {/* 점선 구분 */}
        <View className="border-t border-dashed border-gray-300" />
      </View>

      {/* 본문 */}
      <View className="flex-1 bg-white">
        {step === 'definition' && renderDefinitionStep()}
        {step === 'quiz' && renderQuizStep()}
        {step === 'result' && renderResultStep()}
        {step === 'articles' && renderArticlesStep()}
      </View>
    </View>
  );
};

export default QuizView;
