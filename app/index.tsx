import React, { useCallback, useEffect, useLayoutEffect, useState } from 'react';
import { ActivityIndicator, Alert, Modal, Platform, View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { useNavigation } from 'expo-router';

import { MissionData, MonthlyStats, PhotoEntry, UserSettings } from '@/types';
import Onboarding from '@/components/Onboarding';
import UserInfoForm from '@/components/UserInfoForm';
import TodayMissionPage from '@/components/TodayMissionPage';
import MonthlyAlbumPage from '@/components/MonthlyAlbumPage';
import CameraPage from '@/components/CameraPage';
import PhotoPreviewPage from '@/components/PhotoPreviewPage';
import PhotoDetailPage from '@/components/PhotoDetailPage';
import SettingsSheet from '@/components/SettingsSheet';
import LoginScreen from '@/components/LoginScreen';
import BottomTabBar, { TabType } from '@/components/BottomTabBar';
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

// ===== 더미 데이터 =====
const DUMMY_MISSIONS: Record<string, MissionData> = {
  '2026-01-24': {
    id: '1',
    date: '2026-01-24',
    theme: '오늘 퇴근길 풍경은\n어땠나요?',
    hint: '일상에서 특별한 순간을 찾아보세요',
  },
};

const DUMMY_PHOTOS: PhotoEntry[] = [];
// ===== 더미 데이터 끝 =====

const getDummyStats = (year: number, month: number): MonthlyStats => {
  const daysInMonth = new Date(year, month, 0).getDate();
  const today = new Date();
  const isCurrentMonth = today.getFullYear() === year && today.getMonth() + 1 === month;
  const totalDays = isCurrentMonth ? today.getDate() : daysInMonth;
  const completedDays = DUMMY_PHOTOS.filter((p) => {
    const d = new Date(p.date);
    return d.getFullYear() === year && d.getMonth() + 1 === month;
  }).length;

  return {
    year,
    month,
    totalDays,
    completedDays,
    streak: 2,
    longestStreak: 5,
  };
};

const formatDateKey = (date: Date) => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};
// ===== 더미 데이터 끝 =====

export default function Home() {
  const navigation = useNavigation();

  // 기존 상태
  const [bootLoading, setBootLoading] = useState(true);
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

  // 새로운 상태 (사진 미션 앱)
  const [currentDate, setCurrentDate] = useState(new Date());
  const [activeTab, setActiveTab] = useState<TabType>('today');
  const [albumYear, setAlbumYear] = useState(new Date().getFullYear());
  const [albumMonth, setAlbumMonth] = useState(new Date().getMonth() + 1);

  // 모달 상태
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [capturedPhotoUri, setCapturedPhotoUri] = useState<string | null>(null);
  const [selectedPhoto, setSelectedPhoto] = useState<PhotoEntry | null>(null);

  const { isBootstrapping: authBootstrapping, isSignedIn, signOut } = useAuth();

  const shouldShowLogin = forceLogin || (!isSignedIn && !hasLoggedIn);

  // 더미 데이터 기반 값들
  const dateKey = formatDateKey(currentDate);
  const todayMission = DUMMY_MISSIONS[dateKey] || {
    id: 'default',
    date: dateKey,
    theme: '오늘\n퇴근길 풍경은\n어땠나요?',
    // theme: 'How was your day? Tell me about it.',
    hint: '일상에서 특별한 순간을 찾아보세요',
  };
  const todayPhoto = DUMMY_PHOTOS.find((p) => p.date === dateKey) || null;
  const monthlyStats = getDummyStats(albumYear, albumMonth);
  const monthlyPhotos = DUMMY_PHOTOS.filter((p) => {
    const d = new Date(p.date);
    return d.getFullYear() === albumYear && d.getMonth() + 1 === albumMonth;
  });

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

  // ===== 사진 미션 앱 핸들러 =====
  const handleOpenCamera = () => {
    setIsCameraOpen(true);
  };

  const handleCloseCamera = () => {
    setIsCameraOpen(false);
  };

  const handleCapture = () => {
    // 더미: 촬영된 것처럼 처리
    setCapturedPhotoUri('dummy://captured.jpg');
    setIsCameraOpen(false);
    setIsPreviewOpen(true);
  };

  const handleOpenGallery = () => {
    // 더미: 갤러리에서 선택된 것처럼 처리
    setCapturedPhotoUri('dummy://gallery.jpg');
    setIsPreviewOpen(true);
  };

  const handleSavePhoto = (caption: string) => {
    // 더미: 저장된 것처럼 처리
    console.log('Photo saved with caption:', caption);
    setIsPreviewOpen(false);
    setCapturedPhotoUri(null);
    Alert.alert('저장 완료', '사진이 저장되었습니다!');
  };

  const handleRetake = () => {
    setIsPreviewOpen(false);
    setCapturedPhotoUri(null);
    setIsCameraOpen(true);
  };

  const handleViewTodayPhoto = () => {
    if (todayPhoto) {
      setSelectedPhoto(todayPhoto);
      setIsDetailOpen(true);
    }
  };

  const handleSelectPhoto = (photo: PhotoEntry) => {
    setSelectedPhoto(photo);
    setIsDetailOpen(true);
  };

  const handleSelectEmptyDay = (date: Date) => {
    setCurrentDate(date);
    setActiveTab('today');
  };

  const handlePrevMonth = () => {
    if (albumMonth === 1) {
      setAlbumYear(albumYear - 1);
      setAlbumMonth(12);
    } else {
      setAlbumMonth(albumMonth - 1);
    }
  };

  const handleNextMonth = () => {
    const now = new Date();
    const canGoNext =
      albumYear < now.getFullYear() ||
      (albumYear === now.getFullYear() && albumMonth < now.getMonth() + 1);

    if (canGoNext) {
      if (albumMonth === 12) {
        setAlbumYear(albumYear + 1);
        setAlbumMonth(1);
      } else {
        setAlbumMonth(albumMonth + 1);
      }
    }
  };

  const handleDeletePhoto = () => {
    Alert.alert('삭제', '정말 삭제하시겠습니까?', [
      { text: '취소', style: 'cancel' },
      {
        text: '삭제',
        style: 'destructive',
        onPress: () => {
          setIsDetailOpen(false);
          setSelectedPhoto(null);
        },
      },
    ]);
  };

  const handleSharePhoto = () => {
    Alert.alert('공유', '공유 기능은 아직 구현되지 않았습니다.');
  };

  // ===== 렌더링 =====
  if (bootLoading || authBootstrapping || (profileLoading && !forceLogin)) {
    return (
      <View className="flex-1 items-center justify-center bg-[#FFFBF5]">
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

  if (showUserForm) {
    return (
      <UserInfoForm
        initialValues={userSettings || undefined}
        onSubmit={handleUserInfoSubmit}
        isSubmitting={profileSaving}
      />
    );
  }

  // 메인 화면
  return (
    <View className="flex-1 bg-[#FFFBF5]">
      {/* 탭 콘텐츠 */}
      {activeTab === 'today' && (
        <TodayMissionPage
          date={currentDate}
          mission={todayMission}
          todayPhoto={todayPhoto}
          stats={monthlyStats}
          loading={false}
          onOpenCamera={handleOpenCamera}
          onOpenGallery={handleOpenGallery}
          onOpenSettings={() => setIsSettingsOpen(true)}
          onViewPhoto={handleViewTodayPhoto}
        />
      )}

      {activeTab === 'album' && (
        <MonthlyAlbumPage
          year={albumYear}
          month={albumMonth}
          photos={monthlyPhotos}
          stats={monthlyStats}
          onPrevMonth={handlePrevMonth}
          onNextMonth={handleNextMonth}
          onSelectPhoto={handleSelectPhoto}
          onSelectEmptyDay={handleSelectEmptyDay}
          onOpenSettings={() => setIsSettingsOpen(true)}
        />
      )}

      {activeTab === 'profile' && (
        <View className="flex-1 items-center justify-center">
          {/* 프로필/내 기록 탭 - 추후 구현 */}
        </View>
      )}

      {/* 하단 탭바 */}
      <BottomTabBar activeTab={activeTab} onTabPress={setActiveTab} />

      {/* 설정 시트 */}
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
        />
      )}

      {/* 카메라 모달 */}
      <Modal visible={isCameraOpen} animationType="slide">
        <CameraPage
          mission={todayMission}
          onCapture={handleCapture}
          onClose={handleCloseCamera}
          onFlipCamera={() => {}}
          onOpenGallery={() => {
            setIsCameraOpen(false);
            handleOpenGallery();
          }}
        />
      </Modal>

      {/* 미리보기 모달 */}
      <Modal visible={isPreviewOpen} animationType="slide">
        <PhotoPreviewPage
          photoUri={capturedPhotoUri || ''}
          mission={todayMission}
          date={currentDate}
          onSave={handleSavePhoto}
          onRetake={handleRetake}
          onClose={() => {
            setIsPreviewOpen(false);
            setCapturedPhotoUri(null);
          }}
        />
      </Modal>

      {/* 사진 상세 모달 */}
      <Modal visible={isDetailOpen} animationType="slide">
        {selectedPhoto && (
          <PhotoDetailPage
            photo={selectedPhoto}
            mission={DUMMY_MISSIONS[selectedPhoto.date] || null}
            onClose={() => {
              setIsDetailOpen(false);
              setSelectedPhoto(null);
            }}
            onDelete={handleDeletePhoto}
            onShare={handleSharePhoto}
          />
        )}
      </Modal>
    </View>
  );
}
