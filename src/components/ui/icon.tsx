import { View } from 'react-native';
import { Feather } from '@expo/vector-icons';

type IconSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';

export interface IconProps {
  as?: React.ComponentType<{ size?: number; color?: string; name?: string }>;
  name?: React.ComponentProps<typeof Feather>['name'];
  size?: IconSize;
  color?: string;
  className?: string;
}

const sizeMap: Record<IconSize, number> = {
  xs: 12,
  sm: 16,
  md: 20,
  lg: 24,
  xl: 28,
  '2xl': 32,
};

export const Icon = ({
  as: IconComponent,
  name,
  size = 'md',
  color = '#000',
  className = '',
}: IconProps) => {
  const iconSize = sizeMap[size];

  if (IconComponent) {
    return (
      <View className={className}>
        <IconComponent size={iconSize} color={color} />
      </View>
    );
  }

  if (name) {
    return (
      <View className={className}>
        <Feather name={name} size={iconSize} color={color} />
      </View>
    );
  }

  return null;
};
