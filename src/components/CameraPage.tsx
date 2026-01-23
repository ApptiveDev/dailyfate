import React from 'react';
import { Pressable } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MissionData } from '../types/fortune';
import { Box, Text, HStack, Center, Card } from './ui';

interface Props {
  mission: MissionData | null;
  onCapture: () => void;
  onClose: () => void;
  onFlipCamera: () => void;
  onOpenGallery: () => void;
}

const CameraPage: React.FC<Props> = ({
  mission,
  onCapture,
  onClose,
  onFlipCamera,
  onOpenGallery,
}) => {
  const insets = useSafeAreaInsets();

  return (
    <Box className="flex-1 bg-black">
      {/* Camera Preview */}
      <Center className="flex-1 bg-neutral-900">
        <Feather name="camera" size={48} color="#333" />
      </Center>

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
            onPress={onFlipCamera}
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
            onPress={onOpenGallery}
            className="h-14 w-14 items-center justify-center rounded-full bg-neutral-800"
          >
            <Feather name="image" size={22} color="#fff" />
          </Pressable>

          {/* Capture Button */}
          <Pressable
            onPress={onCapture}
            className="mx-10 h-20 w-20 items-center justify-center rounded-full bg-white"
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
