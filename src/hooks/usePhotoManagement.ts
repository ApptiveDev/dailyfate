import { useCallback, useState } from 'react';
import { Alert } from 'react-native';

import type { MissionData, PhotoEntry } from '@/types';

export interface PhotoManagementState {
  capturedPhotoUri: string | null;
  selectedPhoto: PhotoEntry | null;
  isSaving: boolean;
}

export interface PhotoManagementActions {
  capturePhoto: (uri: string) => void;
  selectPhoto: (photo: PhotoEntry) => void;
  clearCapturedPhoto: () => void;
  clearSelectedPhoto: () => void;
  savePhoto: (caption: string, mission: MissionData) => Promise<void>;
  deletePhoto: (photoId: string) => Promise<void>;
  confirmDelete: (onConfirm: () => void) => void;
}

export interface UsePhotoManagementReturn extends PhotoManagementState, PhotoManagementActions {}

export const usePhotoManagement = (): UsePhotoManagementReturn => {
  const [capturedPhotoUri, setCapturedPhotoUri] = useState<string | null>(null);
  const [selectedPhoto, setSelectedPhoto] = useState<PhotoEntry | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const capturePhoto = useCallback((uri: string) => {
    setCapturedPhotoUri(uri);
  }, []);

  const selectPhoto = useCallback((photo: PhotoEntry) => {
    setSelectedPhoto(photo);
  }, []);

  const clearCapturedPhoto = useCallback(() => {
    setCapturedPhotoUri(null);
  }, []);

  const clearSelectedPhoto = useCallback(() => {
    setSelectedPhoto(null);
  }, []);

  const savePhoto = useCallback(async (caption: string, _mission: MissionData) => {
    if (isSaving) return;

    setIsSaving(true);
    try {
      // TODO: 실제 저장 로직 구현 (API 호출 등)
      console.log('Photo saved with caption:', caption);
      Alert.alert('저장 완료', '사진이 저장되었습니다!');
      setCapturedPhotoUri(null);
    } catch (error) {
      const message = error instanceof Error ? error.message : '사진 저장에 실패했습니다.';
      Alert.alert('저장 실패', message);
      throw error;
    } finally {
      setIsSaving(false);
    }
  }, [isSaving]);

  const deletePhoto = useCallback(async (photoId: string) => {
    try {
      // TODO: 실제 삭제 로직 구현 (API 호출 등)
      console.log('Photo deleted:', photoId);
      setSelectedPhoto(null);
    } catch (error) {
      const message = error instanceof Error ? error.message : '사진 삭제에 실패했습니다.';
      Alert.alert('삭제 실패', message);
      throw error;
    }
  }, []);

  const confirmDelete = useCallback((onConfirm: () => void) => {
    Alert.alert('삭제', '정말 삭제하시겠습니까?', [
      { text: '취소', style: 'cancel' },
      {
        text: '삭제',
        style: 'destructive',
        onPress: onConfirm,
      },
    ]);
  }, []);

  return {
    capturedPhotoUri,
    selectedPhoto,
    isSaving,
    capturePhoto,
    selectPhoto,
    clearCapturedPhoto,
    clearSelectedPhoto,
    savePhoto,
    deletePhoto,
    confirmDelete,
  };
};
