import React, { useRef, useEffect } from 'react';
import {
  Animated,
  Pressable,
  ScrollView,
  Switch,
  Text,
  View,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { LearningStats, TermCategory } from '../../types/economy';

interface UserSettings {
  nickname: string;
  notificationEnabled: boolean;
  notificationTime: string;
  preferredCategories: TermCategory[];
}

interface Props {
  visible: boolean;
  onClose: () => void;
  settings: UserSettings;
  stats: LearningStats;
  onUpdateSettings: (settings: Partial<UserSettings>) => void;
  onOpenBookmarks: () => void;
  onLogout: () => void;
  onDeleteAccount: () => void;
}

const EconomySettingsSheet: React.FC<Props> = ({
  visible,
  onClose,
  settings,
  stats,
  onUpdateSettings,
  onOpenBookmarks,
  onLogout,
  onDeleteAccount,
}) => {
  const insets = useSafeAreaInsets();
  const slideAnim = useRef(new Animated.Value(0)).current;
  const backdropAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(slideAnim, {
          toValue: 1,
          friction: 8,
          tension: 65,
          useNativeDriver: true,
        }),
        Animated.timing(backdropAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(backdropAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible]);

  if (!visible) return null;

  const accuracy =
    stats.totalQuizAnswered > 0
      ? Math.round((stats.correctAnswers / stats.totalQuizAnswered) * 100)
      : 0;

  return (
    <View className="absolute inset-0 z-50">
      {/* 백드롭 */}
      <Animated.View
        className="absolute inset-0 bg-black"
        style={{ opacity: backdropAnim.interpolate({ inputRange: [0, 1], outputRange: [0, 0.5] }) }}
      >
        <Pressable className="flex-1" onPress={onClose} />
      </Animated.View>

      {/* 시트 */}
      <Animated.View
        className="absolute bottom-0 left-0 right-0 bg-white rounded-t-3xl"
        style={{
          maxHeight: '90%',
          transform: [
            {
              translateY: slideAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [600, 0],
              }),
            },
          ],
        }}
      >
        {/* 헤더 */}
        <View className="px-5 pt-5 pb-4">
          <View className="flex-row items-center justify-between">
            <Text className="text-xl font-noto-bold text-gray-900">설정</Text>
            <Pressable onPress={onClose} hitSlop={12}>
              <Feather name="x" size={22} color="#6b7280" />
            </Pressable>
          </View>
        </View>

        {/* 점선 구분 */}
        <View className="border-t border-dashed border-gray-300 mx-5" />

        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ paddingBottom: insets.bottom + 20 }}
        >
          {/* 프로필 섹션 */}
          <View className="px-5 py-6">
            <View className="flex-row items-center">
              <View className="w-14 h-14 rounded-full bg-blue-100 items-center justify-center">
                <Feather name="trending-up" size={24} color="#2563eb" />
              </View>
              <View className="ml-4 flex-1">
                <Text className="text-lg font-noto-bold text-gray-900">
                  {settings.nickname}
                </Text>
                <Text className="text-sm text-gray-400 font-wanted-regular mt-0.5">
                  {stats.currentStreak}일 연속 학습 중
                </Text>
              </View>
              <Pressable className="p-2">
                <Feather name="edit-2" size={16} color="#9ca3af" />
              </Pressable>
            </View>
          </View>

          {/* 점선 구분 */}
          <View className="border-t border-dashed border-gray-200 mx-5" />

          {/* 학습 통계 */}
          <View className="px-5 py-5">
            <Text className="text-sm text-gray-400 font-wanted-regular mb-4">
              나의 학습 기록
            </Text>

            <View className="flex-row gap-3 mb-3">
              <View className="flex-1 border border-gray-100 rounded-xl p-4">
                <View className="flex-row items-center mb-2">
                  <Feather name="book" size={14} color="#9ca3af" />
                  <Text className="ml-1.5 text-xs text-gray-400 font-wanted-regular">
                    학습 용어
                  </Text>
                </View>
                <Text className="text-xl font-noto-bold text-gray-800">
                  {stats.totalTermsLearned}개
                </Text>
              </View>
              <View className="flex-1 border border-green-200 bg-green-50 rounded-xl p-4">
                <View className="flex-row items-center mb-2">
                  <Feather name="target" size={14} color="#22c55e" />
                  <Text className="ml-1.5 text-xs text-green-600 font-wanted-regular">
                    정답률
                  </Text>
                </View>
                <Text className="text-xl font-noto-bold text-green-700">
                  {accuracy}%
                </Text>
              </View>
            </View>

            <View className="flex-row gap-3">
              <View className="flex-1 border border-gray-100 rounded-xl p-4">
                <View className="flex-row items-center mb-2">
                  <Feather name="zap" size={14} color="#9ca3af" />
                  <Text className="ml-1.5 text-xs text-gray-400 font-wanted-regular">
                    현재 연속
                  </Text>
                </View>
                <Text className="text-xl font-noto-bold text-gray-800">
                  {stats.currentStreak}일
                </Text>
              </View>
              <View className="flex-1 border border-gray-100 rounded-xl p-4">
                <View className="flex-row items-center mb-2">
                  <Feather name="award" size={14} color="#9ca3af" />
                  <Text className="ml-1.5 text-xs text-gray-400 font-wanted-regular">
                    최장 연속
                  </Text>
                </View>
                <Text className="text-xl font-noto-bold text-gray-800">
                  {stats.longestStreak}일
                </Text>
              </View>
            </View>
          </View>

          {/* 점선 구분 */}
          <View className="border-t border-dashed border-gray-200 mx-5" />

          {/* 바로가기 */}
          <View className="px-5 py-5">
            <Text className="text-sm text-gray-400 font-wanted-regular mb-4">
              바로가기
            </Text>

            <Pressable
              onPress={onOpenBookmarks}
              className="flex-row items-center py-3"
            >
              <View className="w-10 h-10 rounded-lg bg-amber-50 items-center justify-center">
                <Feather name="bookmark" size={18} color="#f59e0b" />
              </View>
              <Text className="ml-3 flex-1 text-base text-gray-800 font-wanted-regular">
                어려웠던 용어
              </Text>
              <Feather name="chevron-right" size={20} color="#d1d5db" />
            </Pressable>
          </View>

          {/* 점선 구분 */}
          <View className="border-t border-dashed border-gray-200 mx-5" />

          {/* 알림 설정 */}
          <View className="px-5 py-5">
            <Text className="text-sm text-gray-400 font-wanted-regular mb-4">
              알림
            </Text>

            <View className="flex-row items-center justify-between py-2">
              <View className="flex-1">
                <Text className="text-base text-gray-800 font-wanted-regular">
                  학습 알림
                </Text>
                <Text className="text-sm text-gray-400 font-wanted-regular mt-0.5">
                  매일 학습 시간을 알려드려요
                </Text>
              </View>
              <Switch
                value={settings.notificationEnabled}
                onValueChange={(value) =>
                  onUpdateSettings({ notificationEnabled: value })
                }
                trackColor={{ false: '#e5e7eb', true: '#111827' }}
                thumbColor="#fff"
              />
            </View>

            {settings.notificationEnabled && (
              <Pressable className="flex-row items-center justify-between py-3 mt-2 border border-gray-100 rounded-xl px-4">
                <Text className="text-base text-gray-600 font-wanted-regular">
                  알림 시간
                </Text>
                <View className="flex-row items-center">
                  <Text className="text-base text-gray-900 font-noto-semibold">
                    {settings.notificationTime}
                  </Text>
                  <Feather name="chevron-right" size={18} color="#9ca3af" />
                </View>
              </Pressable>
            )}
          </View>

          {/* 점선 구분 */}
          <View className="border-t border-dashed border-gray-200 mx-5" />

          {/* 계정 */}
          <View className="px-5 py-5">
            <Text className="text-sm text-gray-400 font-wanted-regular mb-4">
              계정
            </Text>

            <Pressable
              onPress={onLogout}
              className="flex-row items-center py-3"
            >
              <Feather name="log-out" size={18} color="#6b7280" />
              <Text className="ml-3 text-base text-gray-600 font-wanted-regular">
                로그아웃
              </Text>
            </Pressable>

            <Pressable
              onPress={onDeleteAccount}
              className="flex-row items-center py-3"
            >
              <Feather name="trash-2" size={18} color="#dc2626" />
              <Text className="ml-3 text-base text-red-500 font-wanted-regular">
                계정 삭제
              </Text>
            </Pressable>
          </View>

          {/* 앱 정보 */}
          <View className="px-5 py-4 items-center">
            <Text className="text-xs text-gray-300 font-wanted-regular">
              경제 감각 일력 v1.0.0
            </Text>
          </View>
        </ScrollView>
      </Animated.View>
    </View>
  );
};

export default EconomySettingsSheet;
