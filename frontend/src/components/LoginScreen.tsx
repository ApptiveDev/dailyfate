import React, { useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useAuth } from '@/providers/AuthProvider';

type AuthMode = 'signIn' | 'signUp' | 'confirm';

const LoginScreen: React.FC = () => {
  const { signIn, signUp, confirmSignUp, isLoading, error, clearError } = useAuth();
  const [mode, setMode] = useState<AuthMode>('signIn');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [confirmCode, setConfirmCode] = useState('');
  const [pendingUsername, setPendingUsername] = useState<string | null>(null);
  const [localError, setLocalError] = useState<string | null>(null);
  const [infoMessage, setInfoMessage] = useState<string | null>(null);
  const [deliveryMessage, setDeliveryMessage] = useState<string | null>(null);

  const isEmailValid = useMemo(() => {
    const trimmed = email.trim();
    if (!trimmed) return true;
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed);
  }, [email]);

  const canSubmit = useMemo(() => {
    if (mode === 'signIn') {
      return username.trim() !== '' && password !== '';
    }
    if (mode === 'signUp') {
      return (
        username.trim() !== '' &&
        password !== '' &&
        confirmPassword !== '' &&
        password === confirmPassword &&
        isEmailValid
      );
    }
    const resolvedUsername = pendingUsername?.trim() || username.trim();
    return resolvedUsername !== '' && confirmCode.trim() !== '';
  }, [confirmCode, confirmPassword, isEmailValid, mode, password, pendingUsername, username]);

  const errorMessage = localError || error;

  const resetMessages = () => {
    setLocalError(null);
    setInfoMessage(null);
    setDeliveryMessage(null);
    clearError();
  };

  const handleModeChange = (nextMode: AuthMode) => {
    if (nextMode === mode) return;
    resetMessages();
    setMode(nextMode);
    setPassword('');
    setConfirmPassword('');
    if (nextMode !== 'confirm') {
      setConfirmCode('');
      setPendingUsername(null);
    }
  };

  const handleSignIn = async () => {
    resetMessages();
    if (username.trim() === '' || password === '') {
      setLocalError('아이디와 비밀번호를 입력해주세요.');
      return;
    }
    try {
      await signIn(username.trim(), password);
    } catch (_err) {
      // handled by auth context
    }
  };

  const handleSignUp = async () => {
    resetMessages();
    if (username.trim() === '' || password === '' || confirmPassword === '') {
      setLocalError('아이디와 비밀번호를 입력해주세요.');
      return;
    }
    if (password !== confirmPassword) {
      setLocalError('비밀번호가 일치하지 않습니다.');
      return;
    }
    if (!isEmailValid) {
      setLocalError('올바른 이메일 형식을 입력해주세요.');
      return;
    }
    try {
      const result = await signUp(username.trim(), password, email.trim() || undefined);
      setPassword('');
      setConfirmPassword('');
      if (result.userConfirmed) {
        setInfoMessage('회원가입이 완료되었습니다. 로그인해주세요.');
        setMode('signIn');
        setPendingUsername(null);
        setConfirmCode('');
      } else {
        setPendingUsername(result.username);
        setMode('confirm');
        if (result.delivery) {
          const medium =
            result.delivery.DeliveryMedium === 'EMAIL'
              ? '이메일'
              : result.delivery.DeliveryMedium === 'SMS'
                ? 'SMS'
                : result.delivery.DeliveryMedium;
          const destination = result.delivery.Destination
            ? ` (${result.delivery.Destination})`
            : '';
          setDeliveryMessage(`${medium}로 인증 코드가 전송되었습니다${destination}.`);
        } else {
          setDeliveryMessage('인증 코드가 전송되었습니다.');
        }
        setInfoMessage('인증 코드를 입력해주세요.');
      }
    } catch (_err) {
      // handled by auth context
    }
  };

  const handleConfirm = async () => {
    resetMessages();
    const resolvedUsername = pendingUsername?.trim() || username.trim();
    if (!resolvedUsername) {
      setLocalError('회원가입한 아이디를 입력해주세요.');
      return;
    }
    if (confirmCode.trim() === '') {
      setLocalError('인증 코드를 입력해주세요.');
      return;
    }
    try {
      await confirmSignUp(resolvedUsername, confirmCode.trim());
      setInfoMessage('인증이 완료되었습니다. 로그인해주세요.');
      setMode('signIn');
      setConfirmCode('');
      setPendingUsername(null);
    } catch (_err) {
      // handled by auth context
    }
  };

  const title =
    mode === 'signIn' ? '로그인' : mode === 'signUp' ? '회원가입' : '이메일 인증';
  const description =
    mode === 'signIn'
      ? 'Cognito 계정으로 로그인해주세요.'
      : mode === 'signUp'
        ? '계정을 만들고 바로 시작해보세요.'
        : '전송된 인증 코드를 입력해주세요.';
  const submitLabel = mode === 'signIn' ? '로그인' : mode === 'signUp' ? '회원가입' : '인증하기';

  return (
    <SafeAreaView edges={['top']} className="flex-1 bg-stone-200">
      <View className="flex-1 items-center justify-center px-5 py-6">
        <View className="w-full max-w-xl gap-6 rounded-2xl bg-white p-5 shadow-2xl shadow-black/10">
          <View className="space-y-2">
            <Text className="text-2xl font-extrabold text-gray-900">{title}</Text>
            <Text className="text-sm text-gray-500">{description}</Text>
          </View>

          {(infoMessage || deliveryMessage) && (
            <View className="rounded-xl bg-emerald-50 px-3.5 py-3">
              {infoMessage ? (
                <Text className="text-sm font-semibold text-emerald-700">{infoMessage}</Text>
              ) : null}
              {deliveryMessage ? (
                <Text className="mt-1 text-xs text-emerald-700">{deliveryMessage}</Text>
              ) : null}
            </View>
          )}

          <View className="space-y-4">
            {mode !== 'confirm' && (
              <>
                <View className="space-y-2">
                  <Text className="text-sm font-bold text-gray-700">아이디</Text>
                  <TextInput
                    value={username}
                    onChangeText={setUsername}
                    placeholder="아이디 또는 이메일"
                    placeholderTextColor="#9ca3af"
                    autoCapitalize="none"
                    autoCorrect={false}
                    className="rounded-xl bg-gray-100 px-3.5 py-3.5 text-base text-gray-900"
                    textContentType="username"
                  />
                </View>
                {mode === 'signUp' && (
                  <View className="space-y-2">
                    <Text className="text-sm font-bold text-gray-700">이메일 (선택)</Text>
                    <TextInput
                      value={email}
                      onChangeText={setEmail}
                      placeholder="email@example.com"
                      placeholderTextColor="#9ca3af"
                      autoCapitalize="none"
                      autoCorrect={false}
                      keyboardType="email-address"
                      className="rounded-xl bg-gray-100 px-3.5 py-3.5 text-base text-gray-900"
                      textContentType="emailAddress"
                    />
                  </View>
                )}
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
                {mode === 'signUp' && (
                  <View className="space-y-2">
                    <Text className="text-sm font-bold text-gray-700">비밀번호 확인</Text>
                    <TextInput
                      value={confirmPassword}
                      onChangeText={setConfirmPassword}
                      placeholder="비밀번호 확인"
                      placeholderTextColor="#9ca3af"
                      secureTextEntry
                      className="rounded-xl bg-gray-100 px-3.5 py-3.5 text-base text-gray-900"
                      textContentType="password"
                    />
                  </View>
                )}
              </>
            )}

            {mode === 'confirm' && (
              <>
                <View className="space-y-2">
                  <Text className="text-sm font-bold text-gray-700">아이디</Text>
                  <TextInput
                    value={pendingUsername ?? username}
                    onChangeText={(text) => {
                      setUsername(text);
                      setPendingUsername(text);
                    }}
                    placeholder="아이디"
                    placeholderTextColor="#9ca3af"
                    autoCapitalize="none"
                    autoCorrect={false}
                    className="rounded-xl bg-gray-100 px-3.5 py-3.5 text-base text-gray-900"
                    textContentType="username"
                  />
                </View>
                <View className="space-y-2">
                  <Text className="text-sm font-bold text-gray-700">인증 코드</Text>
                  <TextInput
                    value={confirmCode}
                    onChangeText={setConfirmCode}
                    placeholder="인증 코드"
                    placeholderTextColor="#9ca3af"
                    keyboardType="number-pad"
                    className="rounded-xl bg-gray-100 px-3.5 py-3.5 text-base text-gray-900"
                    textContentType="oneTimeCode"
                  />
                </View>
              </>
            )}
          </View>

          {errorMessage ? (
            <View className="rounded-xl bg-rose-50 px-3.5 py-3">
              <Text className="text-sm font-semibold text-rose-600">{errorMessage}</Text>
            </View>
          ) : null}

          <Pressable
            className={`rounded-xl py-3.5 ${canSubmit ? 'bg-gray-900' : 'bg-gray-900/40'}`}
            disabled={!canSubmit || isLoading}
            onPress={mode === 'signIn' ? handleSignIn : mode === 'signUp' ? handleSignUp : handleConfirm}
          >
            {isLoading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text className="text-center text-lg font-extrabold text-white">{submitLabel}</Text>
            )}
          </Pressable>

          {mode === 'signIn' && (
            <Pressable
              className="items-center"
              onPress={() => handleModeChange('signUp')}
            >
              <Text className="text-sm font-semibold text-gray-600">
                아직 계정이 없나요? 회원가입
              </Text>
            </Pressable>
          )}

          {mode === 'signUp' && (
            <Pressable
              className="items-center"
              onPress={() => handleModeChange('signIn')}
            >
              <Text className="text-sm font-semibold text-gray-600">
                이미 계정이 있나요? 로그인
              </Text>
            </Pressable>
          )}

          {mode === 'confirm' && (
            <Pressable
              className="items-center"
              onPress={() => handleModeChange('signIn')}
            >
              <Text className="text-sm font-semibold text-gray-600">로그인으로 돌아가기</Text>
            </Pressable>
          )}
        </View>
      </View>
    </SafeAreaView>
  );
};

export default LoginScreen;
