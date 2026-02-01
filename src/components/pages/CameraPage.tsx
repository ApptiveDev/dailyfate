import React, { useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, Alert } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CameraView, CameraType, useCameraPermissions } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import { MissionData } from '@/types/fortune';
import { Box, Text, HStack, Center, Card } from '../ui';

interface Props {
  mission: MissionData | null;
  onCapture: (uri: string) => void;
  onClose: () => void;
  onFlipCamera: () => void;
  onOpenGallery: (uri: string) => void;
}

const CameraPage: React.FC<Props> = ({
  mission,
  onCapture,
  onClose,
  onOpenGallery,
}) => {
  const insets = useSafeAreaInsets();
  const cameraRef = useRef<CameraView>(null);
  const [facing, setFacing] = useState<CameraType>('back');
  const [permission, requestPermission] = useCameraPermissions();
  const [isCapturing, setIsCapturing] = useState(false);

  useEffect(() => {
    if (permission === null) {
      return;
    }
    if (!permission.granted && permission.canAskAgain) {
      void requestPermission();
    }
  }, [permission, requestPermission]);

  const handleFlipCamera = () => {
    setFacing((current) => (current === 'back' ? 'front' : 'back'));
  };

  const handleCapture = async () => {
    if (!cameraRef.current || isCapturing) return;

    setIsCapturing(true);
    try {
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.8,
        skipProcessing: false,
      });
      if (photo?.uri) {
        onCapture(photo.uri);
      }
    } catch (error) {
      console.error('Failed to capture photo:', error);
      Alert.alert('오류', '사진 촬영에 실패했습니다.');
    } finally {
      setIsCapturing(false);
    }
  };

  const handleOpenGallery = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]?.uri) {
        onOpenGallery(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Failed to pick image:', error);
      Alert.alert('오류', '갤러리에서 사진을 선택할 수 없습니다.');
    }
  };

  // Permission not yet determined
  if (permission === null) {
    return (
      <Box className="flex-1 bg-black">
        <Center className="flex-1">
          <Text className="text-white">카메라 권한을 확인하는 중...</Text>
        </Center>
      </Box>
    );
  }

  // Permission denied
  if (!permission.granted) {
    return (
      <Box className="flex-1 bg-black">
        <Box
          className="absolute left-0 right-0 z-10 px-6"
          style={{ top: insets.top + 16 }}
        >
          <Pressable
            onPress={onClose}
            hitSlop={16}
            className="h-12 w-12 items-center justify-center rounded-full bg-white"
          >
            <Feather name="x" size={22} color="#000" />
          </Pressable>
        </Box>
        <Center className="flex-1 px-8">
          <Feather name="camera-off" size={48} color="#666" />
          <Text className="text-white text-center mt-4 text-lg font-wanted-semibold">
            카메라 권한이 필요합니다
          </Text>
          <Text className="text-neutral-400 text-center mt-2">
            설정에서 카메라 권한을 허용해주세요
          </Text>
          <Pressable
            onPress={() => void requestPermission()}
            className="mt-6 bg-white px-6 py-3 rounded-full"
          >
            <Text className="text-black font-wanted-semibold">권한 요청</Text>
          </Pressable>
        </Center>
      </Box>
    );
  }

  return (
    <Box className="flex-1 bg-black">
      {/* Camera Preview */}
      <CameraView
        ref={cameraRef}
        style={StyleSheet.absoluteFillObject}
        facing={facing}
      />

      {/* Top Header */}
      <Box
        className="absolute left-0 right-0 z-10 px-6"
        style={{ top: insets.top + 16 }}
      >
        <HStack className="justify-between">
          <Pressable
            onPress={onClose}
            hitSlop={16}
            className="h-12 w-12 items-center justify-center rounded-full bg-white"
          >
            <Feather name="x" size={22} color="#000" />
          </Pressable>

          <Pressable
            onPress={handleFlipCamera}
            hitSlop={16}
            className="h-12 w-12 items-center justify-center rounded-full bg-white"
          >
            <Feather name="refresh-cw" size={18} color="#000" />
          </Pressable>
        </HStack>

        {/* Mission Display */}
        {mission && (
          <Card variant="elevated" className="mt-6 bg-white p-4 rounded-2xl">
            <Text className="text-left text-base font-wanted-semibold text-black">
              {mission.theme}
            </Text>
          </Card>
        )}
      </Box>

      {/* Bottom Controls */}
      <Box
        className="absolute bottom-0 left-0 right-0 px-6"
        style={{ paddingBottom: insets.bottom + 32 }}
      >
        <HStack className="justify-center items-center">
          {/* Gallery */}
          <Pressable
            onPress={handleOpenGallery}
            className="h-14 w-14 items-center justify-center rounded-full bg-neutral-800"
          >
            <Feather name="image" size={22} color="#fff" />
          </Pressable>

          {/* Capture Button */}
          <Pressable
            onPress={handleCapture}
            disabled={isCapturing}
            className="mx-10 h-20 w-20 items-center justify-center rounded-full bg-white"
            style={{ opacity: isCapturing ? 0.6 : 1 }}
          >
            <Box className="h-16 w-16 rounded-full border-4 border-black" />
          </Pressable>

          {/* Empty Space */}
          <Box className="h-14 w-14" />
        </HStack>
      </Box>
    </Box>
  );
};

export default CameraPage;
