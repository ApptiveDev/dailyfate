import { View, ViewProps } from 'react-native';
import { cssInterop } from 'nativewind';

cssInterop(View, { className: 'style' });

export interface BoxProps extends ViewProps {
  className?: string;
}

export const Box = ({ className, ...props }: BoxProps) => {
  return <View className={className} {...props} />;
};
