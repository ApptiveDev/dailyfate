import { useCallback, useEffect, useState } from 'react';
import { Alert, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

import type { UserSettings } from '@/types';
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

export type LoginMode = 'signIn' | 'signUp';

export interface AppBootstrapState {
  isBootLoading: boolean;
  hasOnboarded: boolean;
  hasLoggedIn: boolean;
  forceLogin: boolean;
  loginMode: LoginMode;
  userSettings: UserSettings | null;
  needsProfileSetup: boolean;
  profileLoading: boolean;
  profileSaving: boolean;
  pushToken: string | null;
}

export interface AppBootstrapActions {
  persistHasOnboarded: () => Promise<void>;
  persistHasLoggedIn: () => Promise<void>;
  persistUserSettings: (settings: UserSettings) => Promise<void>;
  handleOnboardingComplete: (mode?: LoginMode) => void;
  handleSignUpSuccess: () => void;
  handleSignInSuccess: () => void;
  handleUserInfoSubmit: (settings: UserSettings) => Promise<void>;
  requireLogin: () => void;
  setLoginMode: (mode: LoginMode) => void;
  shouldShowLogin: boolean;
  showUserForm: boolean;
}

export interface UseAppBootstrapReturn extends AppBootstrapState, AppBootstrapActions {}

export const useAppBootstrap = (): UseAppBootstrapReturn => {
  const { isBootstrapping: authBootstrapping, isSignedIn, signOut } = useAuth();

  // Core boot state
  const [isBootLoading, setIsBootLoading] = useState(true);
  const [hasOnboarded, setHasOnboarded] = useState(false);
  const [hasLoggedIn, setHasLoggedIn] = useState(false);
  const [userSettings, setUserSettings] = useState<UserSettings | null>(null);

  // Login state
  const [forceLogin, setForceLogin] = useState(false);
  const [loginMode, setLoginMode] = useState<LoginMode>('signIn');

  // Profile state
  const [needsProfileSetup, setNeedsProfileSetup] = useState(false);
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileSaving, setProfileSaving] = useState(false);

  // Push notifications
  const [pushToken, setPushToken] = useState<string | null>(null);

  const shouldShowLogin = forceLogin || (!isSignedIn && !hasLoggedIn);
  const showUserForm = needsProfileSetup;

  // Load persisted state on mount
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
        setIsBootLoading(false);
      }
    };

    load();
  }, []);

  // Register push token
  useEffect(() => {
    let active = true;

    const registerPushToken = async () => {
      try {
        const token = await registerForPushNotificationsAsync();
        if (token && active) {
          console.log('Expo push token:', token);
          setPushToken(token);
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

  // Sync push token when signed in
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

  // Reset state when signed out
  useEffect(() => {
    if (isSignedIn) return;
    setNeedsProfileSetup(false);
    setProfileLoading(false);
  }, [isSignedIn]);

  const requireLogin = useCallback(() => {
    setForceLogin(true);
    setLoginMode('signIn');
    void signOut();
  }, [signOut]);

  // Load profile when signed in
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

  const persistHasOnboarded = useCallback(async () => {
    setHasOnboarded(true);
    await AsyncStorage.setItem(HAS_ONBOARDED_KEY, 'true');
  }, []);

  const persistHasLoggedIn = useCallback(async () => {
    setHasLoggedIn(true);
    await AsyncStorage.setItem(HAS_LOGGED_IN_KEY, 'true');
  }, []);

  const persistUserSettings = useCallback(async (settings: UserSettings) => {
    setUserSettings(settings);
    await AsyncStorage.setItem(USER_SETTINGS_KEY, JSON.stringify(settings));
  }, []);

  const handleOnboardingComplete = useCallback((mode: LoginMode = 'signIn') => {
    setLoginMode(mode);
    void persistHasOnboarded();
  }, [persistHasOnboarded]);

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

  const handleUserInfoSubmit = useCallback(async (settings: UserSettings) => {
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
  }, [profileSaving, persistUserSettings, requireLogin]);

  return {
    // State
    isBootLoading: isBootLoading || authBootstrapping,
    hasOnboarded,
    hasLoggedIn,
    forceLogin,
    loginMode,
    userSettings,
    needsProfileSetup,
    profileLoading,
    profileSaving,
    pushToken,
    // Computed
    shouldShowLogin,
    showUserForm,
    // Actions
    persistHasOnboarded,
    persistHasLoggedIn,
    persistUserSettings,
    handleOnboardingComplete,
    handleSignUpSuccess,
    handleSignInSuccess,
    handleUserInfoSubmit,
    requireLogin,
    setLoginMode,
  };
};
