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

interface UserSettings {
  nickname: string;
  notificationEnabled: boolean;
  notificationTime: string;
  preferredPromptTypes: string[];
}

interface WritingStats {
  totalEntries: number;
  totalDays: number;
  longestStreak: number;
  currentStreak: number;
  totalCharacters: number;
  bestSentenceCount: number;
}

interface Props {
  visible: boolean;
  onClose: () => void;
  settings: UserSettings;
  stats: WritingStats;
  onUpdateSettings: (settings: Partial<UserSettings>) => void;
  onOpenBookmarks: () => void;
  onOpenWeeklyBest: () => void;
  onLogout: () => void;
  onDeleteAccount: () => void;
}

const WritingSettingsSheet: React.FC<Props> = ({
  visible,
  onClose,
  settings,
  stats,
  onUpdateSettings,
  onOpenBookmarks,
  onOpenWeeklyBest,
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
          className="flex-1"
          contentContainerStyle={{ paddingBottom: insets.bottom + 20 }}
        >
          {/* 프로필 섹션 */}
          <View className="px-5 py-6">
            <View className="flex-row items-center">
              <View className="w-14 h-14 rounded-full bg-gray-100 items-center justify-center">
                <Feather name="user" size={24} color="#6b7280" />
              </View>
              <View className="ml-4 flex-1">
                <Text className="text-lg font-noto-bold text-gray-900">
                  {settings.nickname}
                </Text>
                <Text className="text-sm text-gray-400 font-wanted-regular mt-0.5">
                  글쓰기 {stats.totalDays}일째
                </Text>
              </View>
              <Pressable className="p-2">
                <Feather name="edit-2" size={16} color="#9ca3af" />
              </Pressable>
            </View>
          </View>

          {/* 점선 구분 */}
          <View className="border-t border-dashed border-gray-200 mx-5" />

          {/* 통계 섹션 */}
          <View className="px-5 py-5">
            <Text className="text-sm text-gray-400 font-wanted-regular mb-4">
              나의 기록
            </Text>

            <View className="flex-row flex-wrap -mx-1.5">
              <StatCard
                label="총 글 수"
                value={stats.totalEntries.toString()}
                icon="file-text"
              />
              <StatCard
                label="연속 기록"
                value={`${stats.currentStreak}일`}
                icon="zap"
                highlight={stats.currentStreak > 0}
              />
              <StatCard
                label="최장 연속"
                value={`${stats.longestStreak}일`}
                icon="award"
              />
              <StatCard
                label="베스트 문장"
                value={stats.bestSentenceCount.toString()}
                icon="star"
              />
            </View>

            <View className="mt-4 border border-gray-100 rounded-xl p-4">
              <View className="flex-row items-center justify-between">
                <Text className="text-sm text-gray-500 font-wanted-regular">
                  총 작성 글자 수
                </Text>
                <Text className="text-xl text-gray-900 font-noto-bold">
                  {stats.totalCharacters.toLocaleString()}자
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
                저장한 글감
              </Text>
              <Feather name="chevron-right" size={20} color="#d1d5db" />
            </Pressable>

            <Pressable
              onPress={onOpenWeeklyBest}
              className="flex-row items-center py-3"
            >
              <View className="w-10 h-10 rounded-lg bg-gray-100 items-center justify-center">
                <Feather name="star" size={18} color="#6b7280" />
              </View>
              <Text className="ml-3 flex-1 text-base text-gray-800 font-wanted-regular">
                나의 베스트 문장
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
                  글쓰기 알림
                </Text>
                <Text className="text-sm text-gray-400 font-wanted-regular mt-0.5">
                  매일 글쓰기 시간을 알려드려요
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
              1분 글감 일력 v1.0.0
            </Text>
          </View>
        </ScrollView>
      </Animated.View>
    </View>
  );
};

// 통계 카드 컴포넌트
interface StatCardProps {
  label: string;
  value: string;
  icon: string;
  highlight?: boolean;
}

const StatCard: React.FC<StatCardProps> = ({ label, value, icon, highlight }) => (
  <View className="w-1/2 px-1.5 mb-3">
    <View
      className={`rounded-xl p-4 border ${highlight ? 'border-green-200 bg-green-50' : 'border-gray-100'}`}
    >
      <View className="flex-row items-center mb-2">
        <Feather
          name={icon as keyof typeof Feather.glyphMap}
          size={14}
          color={highlight ? '#059669' : '#9ca3af'}
        />
        <Text
          className={`ml-1.5 text-xs font-wanted-regular ${
            highlight ? 'text-green-600' : 'text-gray-400'
          }`}
        >
          {label}
        </Text>
      </View>
      <Text
        className={`text-xl font-noto-bold ${
          highlight ? 'text-green-700' : 'text-gray-800'
        }`}
      >
        {value}
      </Text>
    </View>
  </View>
);

export default WritingSettingsSheet;
