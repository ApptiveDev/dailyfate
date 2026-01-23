import { View } from 'react-native';

type ProgressSize = 'xs' | 'sm' | 'md' | 'lg';

export interface ProgressProps {
  value: number;
  className?: string;
  size?: ProgressSize;
}

const sizeStyles: Record<ProgressSize, string> = {
  xs: 'h-0.5',
  sm: 'h-1',
  md: 'h-2',
  lg: 'h-3',
};

export const Progress = ({
  value,
  className = '',
  size = 'sm',
}: ProgressProps) => {
  const clampedValue = Math.min(100, Math.max(0, value));

  return (
    <View className={`overflow-hidden rounded-full bg-neutral-100 ${sizeStyles[size]} ${className}`}>
      <View
        className={`${sizeStyles[size]} rounded-full bg-black`}
        style={{ width: `${clampedValue}%` }}
      />
    </View>
  );
};
