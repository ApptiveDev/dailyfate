import React, { useCallback, useEffect, useLayoutEffect, useState } from 'react';
import { ActivityIndicator, Alert, Platform, View } from 'react-native';
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
import { registerForPushNotificationsAsync } from '@/services/pushNotifications';
import { updatePushToken } from '@/services/pushTokenService';
import {
  fetchUserProfile,
  ProfileApiError,
  updateUserProfile,
} from '@/services/userProfileService';

const HAS_ONBOARDED_KEY = 'hasOnboarded';
const USER_SETTINGS_KEY = 'userSettings';
const HAS_LOGGED_IN_KEY = 'hasLoggedIn';
type LoginMode = 'signIn' | 'signUp';

export default function Home() {
  const navigation = useNavigation();

  const [bootLoading, setBootLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [hasOnboarded, setHasOnboarded] = useState(false);
  const [hasLoggedIn, setHasLoggedIn] = useState(false);
  const [userSettings, setUserSettings] = useState<UserSettings | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [needsProfileSetup, setNeedsProfileSetup] = useState(false);
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileLoading, setProfileLoading] = useState(false);
  const [forceLogin, setForceLogin] = useState(false);
  const [pushToken, setPushToken] = useState<string | null>(null);
  const [loginMode, setLoginMode] = useState<LoginMode>('signIn');

  const { isBootstrapping: authBootstrapping, isSignedIn, signOut } = useAuth();

  const shouldShowLogin = forceLogin || (!isSignedIn && !hasLoggedIn);

  const canLoadFortune =
    hasOnboarded &&
    !shouldShowLogin &&
    (isSignedIn || hasLoggedIn) &&
    !!userSettings &&
    !needsProfileSetup &&
    !profileLoading;

  const {
    fortune,
    loading: loadingFortune,
    error,
  } = useFortune(currentDate, canLoadFortune);

  // Load persisted state
  useEffect(() => {
    const load = async () => {
      try {
        const [onboardedRaw, settingsRaw, loggedInRaw] = await Promise.all([
          AsyncStorage.getItem(HAS_ONBOARDED_KEY),
          AsyncStorage.getItem(USER_SETTINGS_KEY),
          AsyncStorage.getItem(HAS_LOGGED_IN_KEY),
        ]);

        if (onboardedRaw === 'true') setHasOnboarded(true);
        if (settingsRaw) setUserSettings(JSON.parse(settingsRaw));
        if (loggedInRaw === 'true') setHasLoggedIn(true);
      } catch (error) {
        console.warn('Failed to load saved state', error);
      } finally {
        setBootLoading(false);
      }
    };

    load();
  }, []);

  useEffect(() => {
    let active = true;

    const registerPushToken = async () => {
      try {
        const token = await registerForPushNotificationsAsync();
        if (token) {
          console.log('Expo push token:', token);
          if (active) {
            setPushToken(token);
          }
        }
      } catch (error) {
        console.warn('Failed to register for push notifications', error);
      }
    };

    registerPushToken();

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!isSignedIn || !pushToken) return;

    const platform = Platform.OS === 'ios' || Platform.OS === 'android' ? Platform.OS : null;
    if (!platform) return;

    const syncPushToken = async () => {
      try {
        const result = await updatePushToken({ pushToken, platform });
        console.log('Push token synced:', result);
      } catch (error) {
        console.warn('Failed to sync push token', error);
      }
    };

    syncPushToken();
  }, [isSignedIn, pushToken]);

  useEffect(() => {
    if (isSignedIn) return;
    setIsSettingsOpen(false);
    setNeedsProfileSetup(false);
    setProfileLoading(false);
  }, [isSignedIn]);

  const requireLogin = useCallback(() => {
    setForceLogin(true);
    setLoginMode('signIn');
    setIsSettingsOpen(false);
    void signOut();
  }, [signOut]);

  useEffect(() => {
    if (!isSignedIn) return;

    let active = true;
    setProfileLoading(true);

    const loadProfile = async () => {
      try {
        const profile = await fetchUserProfile();
        if (!active) return;
        if (profile) {
          setNeedsProfileSetup(false);
          setUserSettings(profile);
          await AsyncStorage.setItem(USER_SETTINGS_KEY, JSON.stringify(profile));
        } else {
          setNeedsProfileSetup(true);
          setUserSettings(null);
          await AsyncStorage.removeItem(USER_SETTINGS_KEY);
        }
      } catch (error) {
        if (!active) return;
        if (error instanceof ProfileApiError && error.status === 401) {
          Alert.alert('로그인이 필요합니다', '다시 로그인해주세요.');
          requireLogin();
          return;
        }
        const message = error instanceof Error ? error.message : '프로필을 불러오지 못했어요.';
        Alert.alert('프로필 조회 실패', message);
      } finally {
        if (active) setProfileLoading(false);
      }
    };

    loadProfile();

    return () => {
      active = false;
    };
  }, [isSignedIn, requireLogin]);

  // Header: show only when main screen is active
  useLayoutEffect(() => {
    navigation.setOptions({ headerShown: false });
  }, [navigation]);

  const persistHasOnboarded = async () => {
    setHasOnboarded(true);
    await AsyncStorage.setItem(HAS_ONBOARDED_KEY, 'true');
  };

  const persistHasLoggedIn = useCallback(async () => {
    setHasLoggedIn(true);
    await AsyncStorage.setItem(HAS_LOGGED_IN_KEY, 'true');
  }, []);

  const persistUserSettings = async (settings: UserSettings) => {
    setUserSettings(settings);
    await AsyncStorage.setItem(USER_SETTINGS_KEY, JSON.stringify(settings));
  };

  const handleAccountDeleted = useCallback(async () => {
    await AsyncStorage.multiRemove([HAS_LOGGED_IN_KEY, USER_SETTINGS_KEY]);
    setHasLoggedIn(false);
    setUserSettings(null);
    setNeedsProfileSetup(false);
    setIsSettingsOpen(false);
    setForceLogin(false);
    await signOut();
  }, [signOut]);

  const handleSignUpSuccess = useCallback(() => {
    void persistHasLoggedIn();
    setForceLogin(false);
    setNeedsProfileSetup(true);
    setLoginMode('signIn');
  }, [persistHasLoggedIn]);

  const handleSignInSuccess = useCallback(() => {
    void persistHasLoggedIn();
    setForceLogin(false);
    setNeedsProfileSetup(false);
    setProfileLoading(true);
    setLoginMode('signIn');
  }, [persistHasLoggedIn]);

  const handleOnboardingComplete = (mode: LoginMode = 'signIn') => {
    setLoginMode(mode);
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
        requireLogin();
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
      requireLogin();
      Alert.alert('로그인이 필요합니다', '다시 로그인해주세요.');
      return;
    }
    Alert.alert('오늘의 기록을 불러오지 못했어요', error.message);
  }, [error, requireLogin]);

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

  if (bootLoading || authBootstrapping || (profileLoading && !forceLogin)) {
    return (
      <View className="flex-1 items-center justify-center bg-stone-200">
        <ActivityIndicator size="large" color="#191F28" />
      </View>
    );
  }

  if (!hasOnboarded) {
    return <Onboarding onComplete={handleOnboardingComplete} />;
  }

  if (shouldShowLogin) {
    return (
      <LoginScreen
        onSignUpSuccess={handleSignUpSuccess}
        onSignInSuccess={handleSignInSuccess}
        initialMode={loginMode}
      />
    );
  }

  const showUserForm = needsProfileSetup;

  return (
    <View className="flex-1 bg-white">
      {showUserForm ? (
        <UserInfoForm
          initialValues={userSettings || undefined}
          onSubmit={handleUserInfoSubmit}
          isSubmitting={profileSaving}
        />
      ) : (
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
          onLogout={requireLogin}
          onUnauthorized={requireLogin}
          onAccountDeleted={handleAccountDeleted}
        />
      )}
    </View>
  );
}
