import React, { useCallback, useEffect, useLayoutEffect, useState } from 'react';
import { ActivityIndicator, Alert, View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { useNavigation } from 'expo-router';

import { useFortune } from '@/hooks/useFortune';
import { UserSettings } from '@/types';
import Onboarding from '@/components/Onboarding';
import UserInfoForm from '@/components/UserInfoForm';
import CalendarPage from '@/components/CalendarPage';
import SettingsSheet from '@/components/SettingsSheet';
import LoginScreen from '@/components/LoginScreen';
import { useAuth } from '@/providers/AuthProvider';
import { ProfileApiError, updateUserProfile } from '@/services/userProfileService';

const HAS_ONBOARDED_KEY = 'hasOnboarded';
const USER_SETTINGS_KEY = 'userSettings';

export default function Home() {
  const navigation = useNavigation();

  const [bootLoading, setBootLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [hasOnboarded, setHasOnboarded] = useState(false);
  const [userSettings, setUserSettings] = useState<UserSettings | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [needsProfileSetup, setNeedsProfileSetup] = useState(false);
  const [needsOnboarding, setNeedsOnboarding] = useState(false);
  const [profileSaving, setProfileSaving] = useState(false);

  const { isBootstrapping: authBootstrapping, isSignedIn, signOut } = useAuth();

  const canLoadFortune =
    isSignedIn && !!userSettings && !needsProfileSetup && (!needsOnboarding || hasOnboarded);

  const {
    fortune,
    loading: loadingFortune,
    error,
  } = useFortune(currentDate, canLoadFortune);

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

  useEffect(() => {
    if (isSignedIn) return;
    setIsSettingsOpen(false);
    setNeedsProfileSetup(false);
    setNeedsOnboarding(false);
  }, [isSignedIn]);

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

  const handleSignUpSuccess = useCallback(() => {
    setNeedsProfileSetup(true);
    setNeedsOnboarding(true);
  }, []);

  const handleOnboardingComplete = () => {
    setNeedsOnboarding(false);
    void persistHasOnboarded();
  };

  const handleUserInfoSubmit = async (settings: UserSettings) => {
    if (profileSaving) return;
    setProfileSaving(true);
    try {
      const updatedSettings = await updateUserProfile(settings);
      await persistUserSettings(updatedSettings);
      setNeedsProfileSetup(false);
    } catch (error) {
      if (error instanceof ProfileApiError && error.status === 401) {
        Alert.alert('로그인이 필요합니다', '다시 로그인해주세요.');
        await signOut();
        return;
      }
      const message = error instanceof Error ? error.message : '프로필을 저장하지 못했어요.';
      Alert.alert('프로필 저장 실패', message);
    } finally {
      setProfileSaving(false);
    }
  };

  useEffect(() => {
    if (!error) return;
    if (error.status === 401) {
      signOut();
      Alert.alert('로그인이 필요합니다', '다시 로그인해주세요.');
      return;
    }
    Alert.alert('운세를 불러오지 못했어요', error.message);
  }, [error, signOut]);

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

  if (bootLoading || authBootstrapping) {
    return (
      <View className="flex-1 items-center justify-center bg-stone-200">
        <ActivityIndicator size="large" color="#191F28" />
      </View>
    );
  }

  if (!isSignedIn) {
    return <LoginScreen onSignUpSuccess={handleSignUpSuccess} />;
  }

  const showOnboarding = needsOnboarding && !needsProfileSetup;
  const showUserForm = needsProfileSetup;

  return (
    <View className="flex-1 bg-white">
      {showOnboarding && <Onboarding onComplete={handleOnboardingComplete} />}
      {showUserForm && !showOnboarding && (
        <UserInfoForm
          initialValues={userSettings || undefined}
          onSubmit={handleUserInfoSubmit}
          isSubmitting={profileSaving}
        />
      )}

      {!showOnboarding && !showUserForm && (
        <CalendarPage
          date={currentDate}
          onNext={handleNextDay}
          onPrev={handlePrevDay}
          fortune={fortune}
          loading={loadingFortune}
          onOpenSettings={() => {
            if (userSettings) {
              setIsSettingsOpen(true);
            } else {
              setNeedsProfileSetup(true);
            }
          }}
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
