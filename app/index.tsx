import React, { useCallback, useLayoutEffect, useState } from 'react';
import { ActivityIndicator, Alert, Modal, View } from 'react-native';
import { useNavigation } from 'expo-router';

import { PhotoEntry } from '@/types';
import {
  TodayMissionPage,
  MonthlyAlbumPage,
  CalendarPage,
  CameraPage,
  PhotoPreviewPage,
  PhotoDetailPage,
  ProfilePage,
  MonthlyAlbumDetailPage,
  BottomTabBar,
  Onboarding,
  LoginScreen,
  UserInfoForm,
  SettingsSheet,
} from '@/components';
import type { TabType } from '@/components';
import { useMission } from '@/providers/MissionProvider';
import { usePhotos } from '@/providers/PhotoProvider';
import {
  useAppBootstrap,
  useModalState,
  usePhotoManagement,
  useMonthlyAlbum,
  useTodayMission,
} from '@/hooks';

export default function Home() {
  const navigation = useNavigation();

  // ===== Hooks =====
  const bootstrap = useAppBootstrap();
  const modals = useModalState();
  const photoManagement = usePhotoManagement();
  const monthlyAlbum = useMonthlyAlbum();
  const todayMission = useTodayMission();

  // Providers
  const { getMissionByKey } = useMission();
  const { photos, getPhotosByMonth } = usePhotos();

  // Tab state
  const [activeTab, setActiveTab] = useState<TabType>('today');

  // Album detail modal state
  const [showAlbumDetail, setShowAlbumDetail] = useState(false);

  // Hide header
  useLayoutEffect(() => {
    navigation.setOptions({ headerShown: false });
  }, [navigation]);

  // ===== Derived state =====
  const monthlyPhotos = getPhotosByMonth(monthlyAlbum.year, monthlyAlbum.month);

  // ===== Handlers =====
  const handleOpenCamera = useCallback(() => {
    modals.openModal('camera');
  }, [modals]);

  const handleCloseCamera = useCallback(() => {
    modals.closeModal('camera');
  }, [modals]);

  const handleCapture = useCallback((uri: string) => {
    photoManagement.capturePhoto(uri);
    modals.closeModal('camera');
    modals.openModal('preview');
  }, [photoManagement, modals]);

  const handleOpenGallery = useCallback((uri: string) => {
    photoManagement.capturePhoto(uri);
    modals.closeModal('camera');
    modals.openModal('preview');
  }, [photoManagement, modals]);

  const handleSavePhoto = useCallback((caption: string) => {
    void photoManagement.savePhoto(caption, todayMission.todayMission, todayMission.currentDate);
    modals.closeModal('preview');
  }, [photoManagement, todayMission.todayMission, todayMission.currentDate, modals]);

  const handleRetake = useCallback(() => {
    modals.closeModal('preview');
    photoManagement.clearCapturedPhoto();
    modals.openModal('camera');
  }, [modals, photoManagement]);

  const handleViewTodayPhoto = useCallback(() => {
    if (todayMission.todayPhoto) {
      photoManagement.selectPhoto(todayMission.todayPhoto);
      modals.openModal('detail');
    }
  }, [todayMission.todayPhoto, photoManagement, modals]);

  const handleSelectPhoto = useCallback((photo: PhotoEntry) => {
    photoManagement.selectPhoto(photo);
    modals.openModal('detail');
  }, [photoManagement, modals]);

  const handleSelectEmptyDay = useCallback((date: Date) => {
    todayMission.setCurrentDate(date);
    setActiveTab('today');
  }, [todayMission]);

  const handleDeletePhoto = useCallback(() => {
    photoManagement.confirmDelete(() => {
      if (photoManagement.selectedPhoto) {
        void photoManagement.deletePhoto(photoManagement.selectedPhoto.id);
      }
      modals.closeModal('detail');
    });
  }, [photoManagement, modals]);

  const handleSharePhoto = useCallback(() => {
    Alert.alert('공유', '공유 기능은 아직 구현되지 않았습니다.');
  }, []);

  const handleOpenSettings = useCallback(() => {
    modals.openModal('settings');
  }, [modals]);

  const handleCloseSettings = useCallback(() => {
    modals.closeModal('settings');
  }, [modals]);

  const handleCreateAlbum = useCallback(() => {
    setShowAlbumDetail(true);
  }, []);

  const handleCloseAlbumDetail = useCallback(() => {
    setShowAlbumDetail(false);
  }, []);

  // Navigate to specific month from MonthlyAlbumPage
  const handleNavigateToCalendar = useCallback((year: number, month: number) => {
    monthlyAlbum.goToMonth(year, month);
    setActiveTab('calendar');
  }, [monthlyAlbum]);

  // ===== Rendering =====

  // Loading state
  if (bootstrap.isBootLoading || (bootstrap.profileLoading && !bootstrap.forceLogin)) {
    return (
      <View className="flex-1 items-center justify-center bg-[#FFFBF5]">
        <ActivityIndicator size="large" color="#191F28" />
      </View>
    );
  }

  // Onboarding
  if (!bootstrap.hasOnboarded) {
    return <Onboarding onComplete={bootstrap.handleOnboardingComplete} />;
  }

  // Login
  if (bootstrap.shouldShowLogin) {
    return (
      <LoginScreen
        onSignUpSuccess={bootstrap.handleSignUpSuccess}
        onSignInSuccess={bootstrap.handleSignInSuccess}
        initialMode={bootstrap.loginMode}
      />
    );
  }

  // Profile setup
  if (bootstrap.showUserForm) {
    return (
      <UserInfoForm
        initialValues={bootstrap.userSettings || undefined}
        onSubmit={bootstrap.handleUserInfoSubmit}
        isSubmitting={bootstrap.profileSaving}
      />
    );
  }

  // Main screen
  return (
    <View className="flex-1 bg-[#FFFBF5]">
      {/* Tab Content */}
      {activeTab === 'today' && (
        <TodayMissionPage
          date={todayMission.currentDate}
          mission={todayMission.todayMission}
          todayPhoto={todayMission.todayPhoto}
          stats={todayMission.monthlyStats}
          loading={false}
          onOpenCamera={handleOpenCamera}
          onOpenGallery={() => modals.openModal('camera')}
          onOpenSettings={handleOpenSettings}
          onViewPhoto={handleViewTodayPhoto}
        />
      )}

      {activeTab === 'calendar' && (
        <CalendarPage
          year={monthlyAlbum.year}
          month={monthlyAlbum.month}
          photos={monthlyPhotos}
          stats={monthlyAlbum.stats}
          onPrevMonth={monthlyAlbum.goToPrevMonth}
          onNextMonth={monthlyAlbum.goToNextMonth}
          onSelectPhoto={handleSelectPhoto}
          onSelectEmptyDay={handleSelectEmptyDay}
          onOpenSettings={handleOpenSettings}
          onCreateAlbum={handleCreateAlbum}
        />
      )}

      {activeTab === 'album' && (
        <MonthlyAlbumPage
          year={monthlyAlbum.year}
          month={monthlyAlbum.month}
          photos={monthlyPhotos}
          stats={monthlyAlbum.stats}
          onPrevMonth={monthlyAlbum.goToPrevMonth}
          onNextMonth={monthlyAlbum.goToNextMonth}
          onSelectPhoto={handleSelectPhoto}
          onSelectEmptyDay={handleSelectEmptyDay}
          onOpenSettings={handleOpenSettings}
          onSelectMonth={handleNavigateToCalendar}
        />
      )}

      {activeTab === 'profile' && (
        <ProfilePage
          userSettings={bootstrap.userSettings}
          photos={photos}
          onSelectPhoto={handleSelectPhoto}
          onSaveSettings={async (settings) => {
            await bootstrap.persistUserSettings(settings);
          }}
          onLogout={bootstrap.requireLogin}
          onDeleteAccount={() => {
            // TODO: 실제 회원탈퇴 API 연동
            Alert.alert('회원탈퇴', '회원탈퇴 기능은 준비 중입니다.');
          }}
          isSaving={bootstrap.profileSaving}
        />
      )}

      {/* Bottom Tab Bar */}
      <BottomTabBar activeTab={activeTab} onTabPress={setActiveTab} />

      {/* Settings Sheet */}
      {bootstrap.userSettings && (
        <SettingsSheet
          visible={modals.isSettingsOpen}
          settings={bootstrap.userSettings}
          onClose={handleCloseSettings}
          onSave={async (nextSettings) => {
            await bootstrap.persistUserSettings(nextSettings);
            handleCloseSettings();
          }}
          onLogout={bootstrap.requireLogin}
          onUnauthorized={bootstrap.requireLogin}
        />
      )}

      {/* Camera Modal */}
      <Modal visible={modals.isCameraOpen} animationType="slide">
        <CameraPage
          mission={todayMission.todayMission}
          onCapture={handleCapture}
          onClose={handleCloseCamera}
          onFlipCamera={() => {}}
          onOpenGallery={handleOpenGallery}
        />
      </Modal>

      {/* Preview Modal */}
      <Modal visible={modals.isPreviewOpen} animationType="slide">
        <PhotoPreviewPage
          photoUri={photoManagement.capturedPhotoUri || ''}
          mission={todayMission.todayMission}
          date={todayMission.currentDate}
          onSave={handleSavePhoto}
          onRetake={handleRetake}
          onClose={() => {
            modals.closeModal('preview');
            photoManagement.clearCapturedPhoto();
          }}
          isSaving={photoManagement.isSaving}
        />
      </Modal>

      {/* Photo Detail Modal */}
      <Modal visible={modals.isDetailOpen} animationType="slide">
        {photoManagement.selectedPhoto && (
          <PhotoDetailPage
            photo={photoManagement.selectedPhoto}
            mission={getMissionByKey(photoManagement.selectedPhoto.date)}
            onClose={() => {
              modals.closeModal('detail');
              photoManagement.clearSelectedPhoto();
            }}
            onDelete={handleDeletePhoto}
            onShare={handleSharePhoto}
          />
        )}
      </Modal>

      {/* Monthly Album Detail Modal */}
      <Modal visible={showAlbumDetail} animationType="slide">
        <MonthlyAlbumDetailPage
          year={monthlyAlbum.year}
          month={monthlyAlbum.month}
          photos={monthlyPhotos}
          stats={monthlyAlbum.stats}
          onClose={handleCloseAlbumDetail}
          onSelectPhoto={(photo) => {
            handleCloseAlbumDetail();
            handleSelectPhoto(photo);
          }}
        />
      </Modal>
    </View>
  );
}
