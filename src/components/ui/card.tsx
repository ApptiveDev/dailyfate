import { View, ViewProps } from 'react-native';

type CardVariant = 'elevated' | 'outline' | 'ghost' | 'filled';

export interface CardProps extends ViewProps {
  className?: string;
  variant?: CardVariant;
}

const variantStyles: Record<CardVariant, string> = {
  elevated: 'bg-white shadow-sm',
  outline: 'bg-white border border-neutral-200',
  ghost: 'bg-transparent',
  filled: 'bg-neutral-100',
};

export const Card = ({
  className = '',
  variant = 'filled',
  ...props
}: CardProps) => {
  return (
    <View
      className={`rounded-2xl p-5 ${variantStyles[variant]} ${className}`}
      {...props}
    />
  );
};
