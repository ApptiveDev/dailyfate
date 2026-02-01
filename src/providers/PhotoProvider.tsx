import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  documentDirectory,
  getInfoAsync,
  makeDirectoryAsync,
  copyAsync,
  deleteAsync,
} from 'expo-file-system/legacy';

import type { PhotoEntry } from '@/types';
import { DUMMY_PHOTOS } from '@/data/mockData';

const PHOTOS_STORAGE_KEY = '@dailyfate_photos';
const PHOTOS_DIRECTORY = `${documentDirectory ?? ''}photos/`;

interface PhotoContextValue {
  photos: PhotoEntry[];
  isLoading: boolean;
  getPhotosByMonth: (year: number, month: number) => PhotoEntry[];
  getPhotoByDate: (dateKey: string) => PhotoEntry | null;
  addPhoto: (photo: PhotoEntry) => Promise<void>;
  removePhoto: (photoId: string) => Promise<void>;
  updatePhoto: (photoId: string, updates: Partial<PhotoEntry>) => Promise<void>;
  saveImageToLocal: (tempUri: string, photoId: string) => Promise<string>;
}

const PhotoContext = createContext<PhotoContextValue | undefined>(undefined);

export const PhotoProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [photos, setPhotos] = useState<PhotoEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Ensure photos directory exists
  const ensureDirectory = useCallback(async () => {
    const dirInfo = await getInfoAsync(PHOTOS_DIRECTORY);
    if (!dirInfo.exists) {
      await makeDirectoryAsync(PHOTOS_DIRECTORY, { intermediates: true });
    }
  }, []);

  // Load photos from AsyncStorage on mount
  useEffect(() => {
    const loadPhotos = async () => {
      try {
        await ensureDirectory();
        const stored = await AsyncStorage.getItem(PHOTOS_STORAGE_KEY);
        if (stored) {
          const parsedPhotos = JSON.parse(stored) as PhotoEntry[];
          // Verify that photo files still exist
          const validPhotos = await Promise.all(
            parsedPhotos.map(async (photo) => {
              if (photo.photoUri.startsWith('file://')) {
                const fileInfo = await getInfoAsync(photo.photoUri);
                return fileInfo.exists ? photo : null;
              }
              return photo;
            })
          );
          setPhotos(validPhotos.filter((p): p is PhotoEntry => p !== null));
        } else {
          // Use dummy data for development
          setPhotos(DUMMY_PHOTOS);
        }
      } catch (error) {
        console.error('Failed to load photos:', error);
        setPhotos(DUMMY_PHOTOS);
      } finally {
        setIsLoading(false);
      }
    };

    void loadPhotos();
  }, [ensureDirectory]);

  // Persist photos to AsyncStorage
  const persistPhotos = useCallback(async (newPhotos: PhotoEntry[]) => {
    try {
      await AsyncStorage.setItem(PHOTOS_STORAGE_KEY, JSON.stringify(newPhotos));
    } catch (error) {
      console.error('Failed to persist photos:', error);
    }
  }, []);

  // Save image file to local storage
  const saveImageToLocal = useCallback(async (tempUri: string, photoId: string): Promise<string> => {
    await ensureDirectory();
    const extension = tempUri.split('.').pop() || 'jpg';
    const localPath = `${PHOTOS_DIRECTORY}${photoId}.${extension}`;

    await copyAsync({
      from: tempUri,
      to: localPath,
    });

    return localPath;
  }, [ensureDirectory]);

  const getPhotosByMonth = useCallback(
    (year: number, month: number): PhotoEntry[] => {
      return photos.filter((p) => {
        const d = new Date(p.date);
        return d.getFullYear() === year && d.getMonth() + 1 === month;
      });
    },
    [photos]
  );

  const getPhotoByDate = useCallback(
    (dateKey: string): PhotoEntry | null => {
      return photos.find((p) => p.date === dateKey) || null;
    },
    [photos]
  );

  const addPhoto = useCallback(async (photo: PhotoEntry) => {
    setPhotos((prev) => {
      // 같은 날짜의 사진이 있으면 교체, 없으면 추가
      const existingIndex = prev.findIndex((p) => p.date === photo.date);
      let updated: PhotoEntry[];
      if (existingIndex >= 0) {
        updated = [...prev];
        updated[existingIndex] = photo;
      } else {
        updated = [...prev, photo];
      }
      void persistPhotos(updated);
      return updated;
    });
  }, [persistPhotos]);

  const removePhoto = useCallback(async (photoId: string) => {
    const photoToRemove = photos.find((p) => p.id === photoId);

    // Delete the image file if it's a local file
    if (photoToRemove?.photoUri.startsWith('file://')) {
      try {
        await deleteAsync(photoToRemove.photoUri, { idempotent: true });
        if (photoToRemove.thumbnailUri?.startsWith('file://')) {
          await deleteAsync(photoToRemove.thumbnailUri, { idempotent: true });
        }
      } catch (error) {
        console.error('Failed to delete photo file:', error);
      }
    }

    setPhotos((prev) => {
      const updated = prev.filter((p) => p.id !== photoId);
      void persistPhotos(updated);
      return updated;
    });
  }, [photos, persistPhotos]);

  const updatePhoto = useCallback(async (photoId: string, updates: Partial<PhotoEntry>) => {
    setPhotos((prev) => {
      const updated = prev.map((p) => (p.id === photoId ? { ...p, ...updates } : p));
      void persistPhotos(updated);
      return updated;
    });
  }, [persistPhotos]);

  const value = useMemo(
    () => ({
      photos,
      isLoading,
      getPhotosByMonth,
      getPhotoByDate,
      addPhoto,
      removePhoto,
      updatePhoto,
      saveImageToLocal,
    }),
    [photos, isLoading, getPhotosByMonth, getPhotoByDate, addPhoto, removePhoto, updatePhoto, saveImageToLocal]
  );

  return <PhotoContext.Provider value={value}>{children}</PhotoContext.Provider>;
};

export const usePhotos = (): PhotoContextValue => {
  const context = useContext(PhotoContext);
  if (!context) {
    throw new Error('usePhotos must be used within PhotoProvider');
  }
  return context;
};
