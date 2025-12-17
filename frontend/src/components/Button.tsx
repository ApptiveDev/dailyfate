import { Pressable, Text } from 'react-native';
import React from 'react';

interface ButtonProps {
  title: string;
  onPress: () => void;
}

export const Button: React.FC<ButtonProps> = ({ title, onPress }) => {
  return (
    <Pressable className="rounded-lg bg-blue-500 px-6 py-3 active:opacity-90" onPress={onPress}>
      <Text className="text-center font-semibold text-white">{title}</Text>
    </Pressable>
  );
};
