import { Text as RNText, TextProps as RNTextProps } from 'react-native';

export interface TextProps extends RNTextProps {
  className?: string;
}

export const Text = ({ className, ...props }: TextProps) => {
  return <RNText className={className} {...props} />;
};

export const Heading = ({ className, ...props }: TextProps) => {
  return <RNText className={`font-bold ${className}`} {...props} />;
};
