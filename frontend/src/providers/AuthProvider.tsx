import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

import {
  AuthError,
  confirmSignUp as confirmSignUpService,
  getAuthToken,
  resendSignUpCode as resendSignUpCodeService,
  signIn as signInService,
  signOut,
  signUp as signUpService,
} from '@/services/authService';
import type { SignUpResult } from '@/services/authService';

interface AuthContextValue {
  isBootstrapping: boolean;
  isLoading: boolean;
  isSignedIn: boolean;
  error: string | null;
  signIn: (username: string, password: string) => Promise<void>;
  signUp: (username: string, password: string, email?: string) => Promise<SignUpResult>;
  confirmSignUp: (username: string, code: string) => Promise<void>;
  resendSignUpCode: (username: string) => Promise<SignUpResult['delivery']>;
  signOut: () => Promise<void>;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isBootstrapping, setIsBootstrapping] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [isSignedIn, setIsSignedIn] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    const load = async () => {
      try {
        const token = await getAuthToken();
        if (active) setIsSignedIn(Boolean(token));
      } catch {
        if (active) setIsSignedIn(false);
      } finally {
        if (active) setIsBootstrapping(false);
      }
    };

    load();
    return () => {
      active = false;
    };
  }, []);

  const signIn = useCallback(async (username: string, password: string) => {
    setIsLoading(true);
    setError(null);
    try {
      await signInService(username, password);
      setIsSignedIn(true);
    } catch (err) {
      if (err instanceof AuthError) {
        setError(err.message);
      } else if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('로그인에 실패했습니다.');
      }
      setIsSignedIn(false);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const signUp = useCallback(
    async (username: string, password: string, email?: string) => {
      setIsLoading(true);
      setError(null);
      try {
        return await signUpService(username, password, email);
      } catch (err) {
        if (err instanceof AuthError) {
          setError(err.message);
        } else if (err instanceof Error) {
          setError(err.message);
        } else {
          setError('회원가입에 실패했습니다.');
        }
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [],
  );

  const confirmSignUp = useCallback(async (username: string, code: string) => {
    setIsLoading(true);
    setError(null);
    try {
      await confirmSignUpService(username, code);
    } catch (err) {
      if (err instanceof AuthError) {
        setError(err.message);
      } else if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('인증에 실패했습니다.');
      }
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const resendSignUpCode = useCallback(async (username: string) => {
    setIsLoading(true);
    setError(null);
    try {
      return await resendSignUpCodeService(username);
    } catch (err) {
      if (err instanceof AuthError) {
        setError(err.message);
      } else if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('인증 코드 재전송에 실패했습니다.');
      }
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleSignOut = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      await signOut();
      setIsSignedIn(false);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const value = useMemo(
    () => ({
      isBootstrapping,
      isLoading,
      isSignedIn,
      error,
      signIn,
      signUp,
      confirmSignUp,
      resendSignUpCode,
      signOut: handleSignOut,
      clearError,
    }),
    [
      clearError,
      confirmSignUp,
      error,
      handleSignOut,
      isBootstrapping,
      isLoading,
      isSignedIn,
      resendSignUpCode,
      signIn,
      signUp,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
