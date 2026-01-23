import { View } from 'react-native';

type DividerOrientation = 'horizontal' | 'vertical';

export interface DividerProps {
  orientation?: DividerOrientation;
  className?: string;
}

export const Divider = ({
  orientation = 'horizontal',
  className = '',
}: DividerProps) => {
  const orientationStyles =
    orientation === 'horizontal'
      ? 'h-px w-full'
      : 'w-px h-full';

  return (
    <View className={`bg-neutral-200 ${orientationStyles} ${className}`} />
  );
};
