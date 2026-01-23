import { View, ViewProps } from 'react-native';

type SpaceValue = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl';

export interface VStackProps extends ViewProps {
  className?: string;
  space?: SpaceValue;
  reversed?: boolean;
}

const spaceStyles: Record<SpaceValue, string> = {
  xs: 'gap-1',
  sm: 'gap-2',
  md: 'gap-3',
  lg: 'gap-4',
  xl: 'gap-5',
  '2xl': 'gap-6',
  '3xl': 'gap-8',
  '4xl': 'gap-10',
};

export const VStack = ({
  className = '',
  space = 'md',
  reversed = false,
  ...props
}: VStackProps) => {
  const flexDirection = reversed ? 'flex-col-reverse' : 'flex-col';

  return (
    <View
      className={`${flexDirection} ${spaceStyles[space]} ${className}`}
      {...props}
    />
  );
};
