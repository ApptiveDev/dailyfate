import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';

import type { PhotoEntry } from '@/types';
import { DUMMY_PHOTOS } from '@/data/mockData';

interface PhotoContextValue {
  photos: PhotoEntry[];
  getPhotosByMonth: (year: number, month: number) => PhotoEntry[];
  getPhotoByDate: (dateKey: string) => PhotoEntry | null;
  addPhoto: (photo: PhotoEntry) => void;
  removePhoto: (photoId: string) => void;
  updatePhoto: (photoId: string, updates: Partial<PhotoEntry>) => void;
}

const PhotoContext = createContext<PhotoContextValue | undefined>(undefined);

export const PhotoProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [photos, setPhotos] = useState<PhotoEntry[]>(DUMMY_PHOTOS);

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

  const addPhoto = useCallback((photo: PhotoEntry) => {
    setPhotos((prev) => {
      // 같은 날짜의 사진이 있으면 교체, 없으면 추가
      const existingIndex = prev.findIndex((p) => p.date === photo.date);
      if (existingIndex >= 0) {
        const updated = [...prev];
        updated[existingIndex] = photo;
        return updated;
      }
      return [...prev, photo];
    });
  }, []);

  const removePhoto = useCallback((photoId: string) => {
    setPhotos((prev) => prev.filter((p) => p.id !== photoId));
  }, []);

  const updatePhoto = useCallback((photoId: string, updates: Partial<PhotoEntry>) => {
    setPhotos((prev) =>
      prev.map((p) => (p.id === photoId ? { ...p, ...updates } : p))
    );
  }, []);

  const value = useMemo(
    () => ({
      photos,
      getPhotosByMonth,
      getPhotoByDate,
      addPhoto,
      removePhoto,
      updatePhoto,
    }),
    [photos, getPhotosByMonth, getPhotoByDate, addPhoto, removePhoto, updatePhoto]
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
