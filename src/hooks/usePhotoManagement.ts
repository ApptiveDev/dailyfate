import { useCallback, useState } from 'react';
import { Alert } from 'react-native';

import type { MissionData, PhotoEntry } from '@/types';
import { usePhotos } from '@/providers/PhotoProvider';
import { formatDateKey } from '@/data/mockData';

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
  savePhoto: (caption: string, mission: MissionData, date?: Date) => Promise<void>;
  deletePhoto: (photoId: string) => Promise<void>;
  confirmDelete: (onConfirm: () => void) => void;
}

export interface UsePhotoManagementReturn extends PhotoManagementState, PhotoManagementActions {}

export const usePhotoManagement = (): UsePhotoManagementReturn => {
  const [capturedPhotoUri, setCapturedPhotoUri] = useState<string | null>(null);
  const [selectedPhoto, setSelectedPhoto] = useState<PhotoEntry | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const { addPhoto, removePhoto, saveImageToLocal } = usePhotos();

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

  const savePhoto = useCallback(async (caption: string, mission: MissionData, date?: Date) => {
    if (isSaving || !capturedPhotoUri) return;

    setIsSaving(true);
    try {
      const photoId = `photo_${Date.now()}_${Math.random().toString(36).substring(7)}`;
      const targetDate = date || new Date();
      const dateKey = formatDateKey(targetDate);

      // Save image to local storage
      let localUri = capturedPhotoUri;
      if (!capturedPhotoUri.startsWith('dummy://')) {
        localUri = await saveImageToLocal(capturedPhotoUri, photoId);
      }

      const newPhoto: PhotoEntry = {
        id: photoId,
        missionId: mission.id,
        date: dateKey,
        photoUri: localUri,
        caption: caption || undefined,
        createdAt: new Date().toISOString(),
      };

      await addPhoto(newPhoto);
      setCapturedPhotoUri(null);
      Alert.alert('저장 완료', '사진이 저장되었습니다!');
    } catch (error) {
      const message = error instanceof Error ? error.message : '사진 저장에 실패했습니다.';
      Alert.alert('저장 실패', message);
      throw error;
    } finally {
      setIsSaving(false);
    }
  }, [isSaving, capturedPhotoUri, addPhoto, saveImageToLocal]);

  const deletePhoto = useCallback(async (photoId: string) => {
    try {
      await removePhoto(photoId);
      setSelectedPhoto(null);
    } catch (error) {
      const message = error instanceof Error ? error.message : '사진 삭제에 실패했습니다.';
      Alert.alert('삭제 실패', message);
      throw error;
    }
  }, [removePhoto]);

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
