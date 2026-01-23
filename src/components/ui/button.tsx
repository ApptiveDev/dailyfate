import { Pressable, PressableProps, Text, View } from 'react-native';
import { ReactNode } from 'react';

type ButtonVariant = 'solid' | 'outline' | 'ghost';
type ButtonSize = 'sm' | 'md' | 'lg' | 'xl';

export interface ButtonProps extends Omit<PressableProps, 'children'> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  className?: string;
  children?: ReactNode;
}

const variantStyles: Record<ButtonVariant, string> = {
  solid: 'bg-black',
  outline: 'bg-transparent border-2 border-neutral-200',
  ghost: 'bg-transparent',
};

const sizeStyles: Record<ButtonSize, string> = {
  sm: 'h-9 px-4',
  md: 'h-11 px-5',
  lg: 'h-14 px-6',
  xl: 'h-16 px-8',
};

const textSizeStyles: Record<ButtonSize, string> = {
  sm: 'text-sm',
  md: 'text-base',
  lg: 'text-base',
  xl: 'text-lg',
};

export const Button = ({
  variant = 'solid',
  size = 'md',
  className = '',
  children,
  disabled,
  ...props
}: ButtonProps) => {
  const baseStyles = 'flex-row items-center justify-center rounded-full';
  const disabledStyles = disabled ? 'opacity-50' : '';

  return (
    <Pressable
      className={`${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${disabledStyles} ${className}`}
      disabled={disabled}
      {...props}
    >
      {children}
    </Pressable>
  );
};

export interface ButtonTextProps {
  className?: string;
  children?: ReactNode;
  variant?: ButtonVariant;
  size?: ButtonSize;
}

export const ButtonText = ({
  className = '',
  children,
  variant = 'solid',
  size = 'md',
}: ButtonTextProps) => {
  const textColor = variant === 'solid' ? 'text-white' : 'text-black';

  return (
    <Text className={`font-semibold ${textColor} ${textSizeStyles[size]} ${className}`}>
      {children}
    </Text>
  );
};

export interface ButtonIconProps {
  as: React.ComponentType<{ size?: number; color?: string }>;
  className?: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
}

export const ButtonIcon = ({
  as: Icon,
  className = '',
  variant = 'solid',
  size = 'md',
}: ButtonIconProps) => {
  const iconColor = variant === 'solid' ? '#fff' : '#000';
  const iconSize = size === 'sm' ? 16 : size === 'md' ? 18 : size === 'lg' ? 20 : 22;

  return (
    <View className={className}>
      <Icon size={iconSize} color={iconColor} />
    </View>
  );
};
