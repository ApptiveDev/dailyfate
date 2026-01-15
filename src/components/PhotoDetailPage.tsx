import React from 'react';
import {
  Dimensions,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MissionData, PhotoEntry } from '../types/fortune';

interface Props {
  photo: PhotoEntry;
  mission: MissionData | null;
  onClose: () => void;
  onDelete: () => void;
  onShare: () => void;
}

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const WEEKDAY_KR = ['일', '월', '화', '수', '목', '금', '토'];

const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const weekday = date.getDay();

  return {
    year,
    month,
    day,
    weekday: WEEKDAY_KR[weekday],
    formatted: `${year}년 ${month}월 ${day}일 ${WEEKDAY_KR[weekday]}요일`,
  };
};

const PhotoDetailPage: React.FC<Props> = ({
  photo,
  mission,
  onClose,
  onDelete,
  onShare,
}) => {
  const insets = useSafeAreaInsets();
  const dateInfo = formatDate(photo.date);

  return (
    <View className="flex-1 bg-[#FFFBF5]">
      {/* 헤더 */}
      <View
        className="z-10 flex-row items-center justify-between px-4"
        style={{ paddingTop: insets.top + 8 }}
      >
        <Pressable
          onPress={onClose}
          hitSlop={12}
          className="rounded-full bg-stone-100 p-2.5"
        >
          <Feather name="arrow-left" size={22} color="#57534e" />
        </Pressable>

        <View className="flex-row items-baseline">
          <Text className="font-serif text-2xl font-bold text-stone-800">
            {dateInfo.month}.{dateInfo.day}
          </Text>
          <Text className="ml-2 text-sm text-stone-400">{dateInfo.weekday}</Text>
        </View>

        <View className="flex-row gap-2">
          <Pressable
            onPress={onShare}
            hitSlop={12}
            className="rounded-full bg-stone-100 p-2.5"
          >
            <Feather name="share" size={18} color="#57534e" />
          </Pressable>
          <Pressable
            onPress={onDelete}
            hitSlop={12}
            className="rounded-full bg-rose-50 p-2.5"
          >
            <Feather name="trash-2" size={18} color="#e11d48" />
          </Pressable>
        </View>
      </View>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: insets.bottom + 40 }}
        showsVerticalScrollIndicator={false}
      >
        {/* 사진 */}
        <View className="mx-4 mt-4 overflow-hidden rounded-2xl shadow-xl">
          <View
            className="items-center justify-center bg-stone-200"
            style={{
              width: SCREEN_WIDTH - 32,
              height: SCREEN_WIDTH - 32,
            }}
          >
            {/* 사진 플레이스홀더 */}
            <View className="items-center">
              <View className="mb-3 h-20 w-20 items-center justify-center rounded-full bg-emerald-100">
                <Feather name="image" size={36} color="#10b981" />
              </View>
              <Text className="text-sm text-stone-400">저장된 사진</Text>
            </View>
          </View>
        </View>

        {/* 미션 정보 */}
        {mission && (
          <View className="mx-4 mt-6 rounded-2xl bg-white p-5 shadow-sm">
            <View className="mb-3 flex-row items-center">
              <View className="mr-3 h-10 w-10 items-center justify-center rounded-full bg-amber-100">
                <Feather name="target" size={20} color="#f59e0b" />
              </View>
              <View>
                <Text className="text-xs font-semibold uppercase tracking-widest text-stone-400">
                  이 날의 주제
                </Text>
                <Text className="mt-0.5 font-serif text-lg font-bold text-stone-700">
                  {mission.theme}
                </Text>
              </View>
            </View>

            {mission.seasonTag && (
              <View className="mt-2 flex-row">
                <View className="rounded-full bg-stone-100 px-3 py-1">
                  <Text className="text-xs font-semibold text-stone-500">
                    {mission.seasonTag}
                  </Text>
                </View>
              </View>
            )}
          </View>
        )}

        {/* 캡션 */}
        {photo.caption && (
          <View className="mx-4 mt-4 rounded-2xl bg-white p-5 shadow-sm">
            <View className="mb-2 flex-row items-center">
              <Feather name="edit-3" size={16} color="#a8a29e" />
              <Text className="ml-2 text-xs font-semibold uppercase tracking-widest text-stone-400">
                캡션
              </Text>
            </View>
            <Text className="text-base leading-6 text-stone-600 font-wanted-regular">
              {photo.caption}
            </Text>
          </View>
        )}

        {/* 메타 정보 */}
        <View className="mx-4 mt-4 rounded-2xl bg-stone-50 p-5">
          <Text className="mb-3 text-xs font-semibold uppercase tracking-widest text-stone-400">
            정보
          </Text>

          <View className="gap-3">
            <View className="flex-row items-center justify-between">
              <Text className="text-sm text-stone-500">촬영 날짜</Text>
              <Text className="text-sm font-semibold text-stone-700">
                {dateInfo.formatted}
              </Text>
            </View>

            <View className="flex-row items-center justify-between">
              <Text className="text-sm text-stone-500">저장 시간</Text>
              <Text className="text-sm font-semibold text-stone-700">
                {new Date(photo.createdAt).toLocaleTimeString('ko-KR', {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </Text>
            </View>
          </View>
        </View>

        {/* 액션 버튼 */}
        <View className="mx-4 mt-6 flex-row gap-3">
          <Pressable
            onPress={onShare}
            className="flex-1 flex-row items-center justify-center rounded-xl bg-stone-800 py-4"
          >
            <Feather name="share-2" size={18} color="#ffffff" />
            <Text className="ml-2 text-base font-bold text-white">공유하기</Text>
          </Pressable>

          <Pressable
            onPress={onDelete}
            className="flex-row items-center justify-center rounded-xl border border-rose-200 bg-rose-50 px-6 py-4"
          >
            <Feather name="trash-2" size={18} color="#e11d48" />
          </Pressable>
        </View>
      </ScrollView>
    </View>
  );
};

export default PhotoDetailPage;
