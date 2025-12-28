import React, { useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useAuth } from '@/providers/AuthProvider';
import { AuthError } from '@/services/authService';

type AuthMode = 'signIn' | 'signUp';

interface Props {
  onSignUpSuccess?: () => void;
}

const LoginScreen: React.FC<Props> = ({ onSignUpSuccess }) => {
  const { signIn, signUp, isLoading, error, clearError } = useAuth();
  const [mode, setMode] = useState<AuthMode>('signIn');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [localError, setLocalError] = useState<string | null>(null);
  const [infoMessage, setInfoMessage] = useState<string | null>(null);

  const usernameTrimmed = username.trim();
  const canSubmit = useMemo(
    () => usernameTrimmed !== '' && password !== '',
    [password, usernameTrimmed],
  );
  const errorMessage = localError || error;

  const resetMessages = () => {
    setLocalError(null);
    setInfoMessage(null);
    clearError();
  };

  const handleModeChange = (nextMode: AuthMode) => {
    if (nextMode === mode) return;
    resetMessages();
    setMode(nextMode);
    setPassword('');
  };

  const handleSignIn = async () => {
    resetMessages();
    if (usernameTrimmed === '' || password === '') {
      setLocalError('아이디와 비밀번호를 입력해주세요.');
      return;
    }
    try {
      await signIn(usernameTrimmed, password);
    } catch (err) {
      if (err instanceof AuthError && err.code === 'UserNotConfirmedException') {
        clearError();
        setLocalError('계정이 인증되지 않았습니다. 관리자에게 문의해주세요.');
      }
    }
  };

  const handleSignUp = async () => {
    resetMessages();
    if (usernameTrimmed === '' || password === '') {
      setLocalError('아이디와 비밀번호를 입력해주세요.');
      return;
    }
    const submittedPassword = password;
    try {
      const result = await signUp(usernameTrimmed, submittedPassword);
      if (result.userConfirmed) {
        await signIn(usernameTrimmed, submittedPassword);
        setPassword('');
        onSignUpSuccess?.();
        return;
      }
      setPassword('');
      setInfoMessage(
        '회원가입은 완료되었지만 계정이 활성화되지 않았습니다. 관리자에게 문의해주세요.',
      );
      setMode('signIn');
    } catch (err) {
      if (err instanceof AuthError) {
        if (err.code === 'UsernameExistsException' || err.code === 'AliasExistsException') {
          clearError();
          setLocalError('이미 가입된 아이디입니다. 로그인해주세요.');
          setMode('signIn');
          return;
        }
        if (err.code === 'InvalidParameterException' && /email/i.test(err.message)) {
          clearError();
          setLocalError('현재 설정상 이메일이 필요합니다. 관리자에게 문의해주세요.');
          return;
        }
      }
    }
  };

  const title = mode === 'signIn' ? '로그인' : '회원가입';
  const description =
    mode === 'signIn'
      ? '아이디와 비밀번호로 로그인해주세요.'
      : '아이디와 비밀번호만으로 가입할 수 있어요.';
  const submitLabel = mode === 'signIn' ? '로그인' : '회원가입';

  return (
    <SafeAreaView edges={['top']} className="flex-1 bg-stone-200">
      <View className="flex-1 items-center justify-center px-5 py-6">
        <View className="w-full max-w-xl gap-6 rounded-2xl bg-white p-5 shadow-2xl shadow-black/10">
          <View className="space-y-2">
            <Text className="text-2xl font-extrabold text-gray-900">{title}</Text>
            <Text className="text-sm text-gray-500">{description}</Text>
          </View>

          {infoMessage ? (
            <View className="rounded-xl bg-emerald-50 px-3.5 py-3">
              <Text className="text-sm font-semibold text-emerald-700">{infoMessage}</Text>
            </View>
          ) : null}

          <View className="space-y-4">
            <View className="space-y-2">
              <Text className="text-sm font-bold text-gray-700">아이디</Text>
              <TextInput
                value={username}
                onChangeText={setUsername}
                placeholder="아이디"
                placeholderTextColor="#9ca3af"
                autoCapitalize="none"
                autoCorrect={false}
                className="rounded-xl bg-gray-100 px-3.5 py-3.5 text-base text-gray-900"
                textContentType="username"
              />
            </View>
            <View className="space-y-2">
              <Text className="text-sm font-bold text-gray-700">비밀번호</Text>
              <TextInput
                value={password}
                onChangeText={setPassword}
                placeholder="비밀번호"
                placeholderTextColor="#9ca3af"
                secureTextEntry
                className="rounded-xl bg-gray-100 px-3.5 py-3.5 text-base text-gray-900"
                textContentType="password"
              />
            </View>
          </View>

          {errorMessage ? (
            <View className="rounded-xl bg-rose-50 px-3.5 py-3">
              <Text className="text-sm font-semibold text-rose-600">{errorMessage}</Text>
            </View>
          ) : null}

          <Pressable
            className={`rounded-xl py-3.5 ${canSubmit ? 'bg-gray-900' : 'bg-gray-900/40'}`}
            disabled={!canSubmit || isLoading}
            onPress={mode === 'signIn' ? handleSignIn : handleSignUp}
          >
            {isLoading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text className="text-center text-lg font-extrabold text-white">{submitLabel}</Text>
            )}
          </Pressable>

          {mode === 'signIn' && (
            <Pressable className="items-center" onPress={() => handleModeChange('signUp')}>
              <Text className="text-sm font-semibold text-gray-600">
                아직 계정이 없나요? 회원가입
              </Text>
            </Pressable>
          )}

          {mode === 'signUp' && (
            <Pressable className="items-center" onPress={() => handleModeChange('signIn')}>
              <Text className="text-sm font-semibold text-gray-600">
                이미 계정이 있나요? 로그인
              </Text>
            </Pressable>
          )}
        </View>
      </View>
    </SafeAreaView>
  );
};

export default LoginScreen;
