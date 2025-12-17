import React, { useCallback, useEffect, useLayoutEffect, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { useNavigation } from 'expo-router';

import { fetchDailyFortune } from '../src/services/geminiService';
import { FortuneData, UserSettings } from '@/types';
import Onboarding from '@/components/Onboarding';
import UserInfoForm from '@/components/UserInfoForm';
import CalendarPage from '@/components/CalendarPage';
import SettingsSheet from '@/components/SettingsSheet';
import { Feather } from '@expo/vector-icons';

const HAS_ONBOARDED_KEY = 'hasOnboarded';
const USER_SETTINGS_KEY = 'userSettings';

export default function Home() {
  const navigation = useNavigation();

  const [bootLoading, setBootLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [hasOnboarded, setHasOnboarded] = useState(false);
  const [userSettings, setUserSettings] = useState<UserSettings | null>(null);
  const [fortune, setFortune] = useState<FortuneData | null>(null);
  const [loadingFortune, setLoadingFortune] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // Load persisted state
  useEffect(() => {
    const load = async () => {
      try {
        const [onboardedRaw, settingsRaw] = await Promise.all([
          AsyncStorage.getItem(HAS_ONBOARDED_KEY),
          AsyncStorage.getItem(USER_SETTINGS_KEY),
        ]);

        if (onboardedRaw === 'true') setHasOnboarded(true);
        if (settingsRaw) setUserSettings(JSON.parse(settingsRaw));
      } catch (error) {
        console.warn('Failed to load saved state', error);
      } finally {
        setBootLoading(false);
      }
    };

    load();
  }, []);

  // Header: show only when main screen is active
  useLayoutEffect(() => {
    navigation.setOptions({ headerShown: false });
  }, [navigation]);

  const persistHasOnboarded = async () => {
    setHasOnboarded(true);
    await AsyncStorage.setItem(HAS_ONBOARDED_KEY, 'true');
  };

  const persistUserSettings = async (settings: UserSettings) => {
    setUserSettings(settings);
    await AsyncStorage.setItem(USER_SETTINGS_KEY, JSON.stringify(settings));
  };

  // Fortune fetch on date/settings change
  useEffect(() => {
    let isMounted = true;

    const loadFortune = async () => {
      if (!hasOnboarded || !userSettings) return;
      setLoadingFortune(true);
      setFortune(null);
      try {
        const data = await fetchDailyFortune(currentDate, userSettings);
        if (isMounted) setFortune(data);
      } catch (error) {
        console.warn('Failed to fetch fortune', error);
        if (isMounted) {
          Alert.alert('운세를 불러오지 못했어요', '잠시 후 다시 시도해주세요.');
        }
      } finally {
        if (isMounted) setLoadingFortune(false);
      }
    };

    loadFortune();

    return () => {
      isMounted = false;
    };
  }, [currentDate, hasOnboarded, userSettings]);

  const handleNextDay = useCallback(() => {
    setCurrentDate((prev) => {
      const next = new Date(prev);
      next.setDate(prev.getDate() + 1);
      return next;
    });
  }, []);

  const handlePrevDay = useCallback(() => {
    setCurrentDate((prev) => {
      const prevDate = new Date(prev);
      prevDate.setDate(prev.getDate() - 1);
      return prevDate;
    });
  }, []);

  if (bootLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-stone-200">
        <ActivityIndicator size="large" color="#191F28" />
      </View>
    );
  }

  const showOnboarding = !hasOnboarded;
  const showUserForm = hasOnboarded && !userSettings;

  return (
    <View className="flex-1 bg-stone-200">
      {showOnboarding && <Onboarding onComplete={persistHasOnboarded} />}
      {showUserForm && !showOnboarding && (
        <UserInfoForm initialValues={userSettings || undefined} onSubmit={persistUserSettings} />
      )}

      {!showOnboarding && !showUserForm && (
        <CalendarPage
          date={currentDate}
          onNext={handleNextDay}
          onPrev={handlePrevDay}
          fortune={fortune}
          loading={loadingFortune}
          onOpenSettings={() => setIsSettingsOpen(true)}
        />
      )}

      {userSettings && (
        <SettingsSheet
          visible={isSettingsOpen}
          settings={userSettings}
          onClose={() => setIsSettingsOpen(false)}
          onSave={async (nextSettings) => {
            await persistUserSettings(nextSettings);
            setIsSettingsOpen(false);
          }}
        />
      )}
    </View>
  );
}
