import { View, Text } from 'react-native';
import { ReactNode } from 'react';

type BadgeVariant = 'solid' | 'outline';
type BadgeSize = 'sm' | 'md' | 'lg';
type BadgeAction = 'info' | 'success' | 'warning' | 'error' | 'muted';

export interface BadgeProps {
  variant?: BadgeVariant;
  size?: BadgeSize;
  action?: BadgeAction;
  className?: string;
  children?: ReactNode;
}

const actionStyles: Record<BadgeAction, { solid: string; outline: string; text: string }> = {
  info: {
    solid: 'bg-blue-100',
    outline: 'border-blue-200',
    text: 'text-blue-600',
  },
  success: {
    solid: 'bg-green-100',
    outline: 'border-green-200',
    text: 'text-green-600',
  },
  warning: {
    solid: 'bg-amber-100',
    outline: 'border-amber-200',
    text: 'text-amber-600',
  },
  error: {
    solid: 'bg-red-100',
    outline: 'border-red-200',
    text: 'text-red-600',
  },
  muted: {
    solid: 'bg-neutral-100',
    outline: 'border-neutral-200',
    text: 'text-neutral-600',
  },
};

const sizeStyles: Record<BadgeSize, string> = {
  sm: 'px-2 py-0.5',
  md: 'px-3 py-1',
  lg: 'px-4 py-1.5',
};

const textSizeStyles: Record<BadgeSize, string> = {
  sm: 'text-[10px]',
  md: 'text-xs',
  lg: 'text-sm',
};

export const Badge = ({
  variant = 'solid',
  size = 'md',
  action = 'muted',
  className = '',
  children,
}: BadgeProps) => {
  const actionStyle = actionStyles[action];
  const bgStyle = variant === 'solid' ? actionStyle.solid : `bg-white border ${actionStyle.outline}`;

  return (
    <View className={`rounded-full ${bgStyle} ${sizeStyles[size]} ${className}`}>
      <Text className={`font-medium ${actionStyle.text} ${textSizeStyles[size]}`}>
        {children}
      </Text>
    </View>
  );
};
