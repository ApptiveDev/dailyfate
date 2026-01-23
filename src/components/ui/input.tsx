import { TextInput, TextInputProps } from 'react-native';

type InputVariant = 'outline' | 'filled' | 'underlined';
type InputSize = 'sm' | 'md' | 'lg' | 'xl';

export interface InputProps extends TextInputProps {
  className?: string;
  variant?: InputVariant;
  size?: InputSize;
  isDisabled?: boolean;
  isInvalid?: boolean;
}

const variantStyles: Record<InputVariant, string> = {
  outline: 'border border-neutral-200 bg-white',
  filled: 'bg-neutral-100 border-0',
  underlined: 'border-b border-neutral-200 bg-transparent rounded-none',
};

const sizeStyles: Record<InputSize, string> = {
  sm: 'h-9 px-3 text-sm',
  md: 'h-11 px-4 text-base',
  lg: 'h-14 px-5 text-base',
  xl: 'h-16 px-6 text-lg',
};

export const Input = ({
  className = '',
  variant = 'filled',
  size = 'md',
  isDisabled = false,
  isInvalid = false,
  ...props
}: InputProps) => {
  const invalidStyles = isInvalid ? 'border-red-500' : '';
  const disabledStyles = isDisabled ? 'opacity-50' : '';
  const roundedStyles = variant === 'underlined' ? '' : 'rounded-xl';

  return (
    <TextInput
      className={`text-black ${roundedStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${invalidStyles} ${disabledStyles} ${className}`}
      placeholderTextColor="#a3a3a3"
      editable={!isDisabled}
      {...props}
    />
  );
};

export interface TextareaProps extends TextInputProps {
  className?: string;
  variant?: InputVariant;
  isDisabled?: boolean;
  isInvalid?: boolean;
}

export const Textarea = ({
  className = '',
  variant = 'filled',
  isDisabled = false,
  isInvalid = false,
  ...props
}: TextareaProps) => {
  const invalidStyles = isInvalid ? 'border-red-500' : '';
  const disabledStyles = isDisabled ? 'opacity-50' : '';

  return (
    <TextInput
      className={`min-h-24 rounded-xl px-4 py-3 text-base text-black ${variantStyles[variant]} ${invalidStyles} ${disabledStyles} ${className}`}
      placeholderTextColor="#a3a3a3"
      editable={!isDisabled}
      multiline
      textAlignVertical="top"
      {...props}
    />
  );
};
