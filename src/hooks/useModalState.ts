import { useCallback, useState } from 'react';

export type ModalType = 'camera' | 'preview' | 'detail' | 'settings';

export interface ModalState {
  isCameraOpen: boolean;
  isPreviewOpen: boolean;
  isDetailOpen: boolean;
  isSettingsOpen: boolean;
}

export interface ModalActions {
  openModal: (modal: ModalType) => void;
  closeModal: (modal: ModalType) => void;
  closeAllModals: () => void;
  setModalState: (modal: ModalType, isOpen: boolean) => void;
}

export interface UseModalStateReturn extends ModalState, ModalActions {}

const initialState: ModalState = {
  isCameraOpen: false,
  isPreviewOpen: false,
  isDetailOpen: false,
  isSettingsOpen: false,
};

export const useModalState = (): UseModalStateReturn => {
  const [state, setState] = useState<ModalState>(initialState);

  const openModal = useCallback((modal: ModalType) => {
    setState((prev) => {
      switch (modal) {
        case 'camera':
          return { ...prev, isCameraOpen: true };
        case 'preview':
          return { ...prev, isPreviewOpen: true };
        case 'detail':
          return { ...prev, isDetailOpen: true };
        case 'settings':
          return { ...prev, isSettingsOpen: true };
        default:
          return prev;
      }
    });
  }, []);

  const closeModal = useCallback((modal: ModalType) => {
    setState((prev) => {
      switch (modal) {
        case 'camera':
          return { ...prev, isCameraOpen: false };
        case 'preview':
          return { ...prev, isPreviewOpen: false };
        case 'detail':
          return { ...prev, isDetailOpen: false };
        case 'settings':
          return { ...prev, isSettingsOpen: false };
        default:
          return prev;
      }
    });
  }, []);

  const closeAllModals = useCallback(() => {
    setState(initialState);
  }, []);

  const setModalState = useCallback((modal: ModalType, isOpen: boolean) => {
    if (isOpen) {
      openModal(modal);
    } else {
      closeModal(modal);
    }
  }, [openModal, closeModal]);

  return {
    ...state,
    openModal,
    closeModal,
    closeAllModals,
    setModalState,
  };
};
