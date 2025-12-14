import { View, Text, StyleSheet } from 'react-native';
import React from 'react';

interface ButtonProps {
  title: string;
  onPress: () => void;
}

export const Button: React.FC<ButtonProps> = ({ title, onPress }) => {
  return (
    <View className="bg-blue-500 px-6 py-3 rounded-lg" onTouchEnd={onPress}>
      <Text className="text-white font-semibold text-center">{title}</Text>
    </View>
  );
};
