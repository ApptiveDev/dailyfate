import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  AuthenticationDetails,
  CognitoUser,
  CognitoUserAttribute,
  CognitoUserPool,
  CognitoUserSession,
} from 'amazon-cognito-identity-js';
import type { CodeDeliveryDetails } from 'amazon-cognito-identity-js';

import { API_CONFIG, COGNITO_CONFIG } from '@/constants/config';

export class AuthError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AuthError';
  }
}

export interface AuthTokens {
  accessToken: string;
  idToken: string;
  refreshToken: string;
  accessTokenExp: number;
  idTokenExp: number;
}

export interface SignUpResult {
  username: string;
  userConfirmed: boolean;
  delivery: CodeDeliveryDetails | null;
}

const AUTH_TOKENS_KEY = 'authTokens';
const AUTH_LAST_USER_KEY = 'authLastUser';
const TOKEN_EXPIRY_LEEWAY_MS = 60_000;

let cachedTokens: AuthTokens | null = null;
let cachedUser: string | null = null;
let cacheLoaded = false;

const getUserPool = () => {
  const { USER_POOL_ID, CLIENT_ID } = COGNITO_CONFIG;
  if (!USER_POOL_ID || !CLIENT_ID) {
    throw new AuthError('Cognito 설정이 필요합니다.');
  }
  return new CognitoUserPool({
    UserPoolId: USER_POOL_ID,
    ClientId: CLIENT_ID,
  });
};

const mapSessionTokens = (session: CognitoUserSession): AuthTokens => ({
  accessToken: session.getAccessToken().getJwtToken(),
  idToken: session.getIdToken().getJwtToken(),
  refreshToken: session.getRefreshToken().getToken(),
  accessTokenExp: session.getAccessToken().getExpiration() * 1000,
  idTokenExp: session.getIdToken().getExpiration() * 1000,
});

const loadCache = async () => {
  if (cacheLoaded) return;
  const [tokenRaw, lastUserRaw] = await Promise.all([
    AsyncStorage.getItem(AUTH_TOKENS_KEY),
    AsyncStorage.getItem(AUTH_LAST_USER_KEY),
  ]);
  if (tokenRaw) {
    try {
      cachedTokens = JSON.parse(tokenRaw) as AuthTokens;
    } catch (_err) {
      cachedTokens = null;
    }
  } else {
    cachedTokens = null;
  }
  cachedUser = lastUserRaw ?? null;
  cacheLoaded = true;
};

const saveTokens = async (tokens: AuthTokens | null) => {
  cachedTokens = tokens;
  cacheLoaded = true;
  if (!tokens) {
    await AsyncStorage.removeItem(AUTH_TOKENS_KEY);
    return;
  }
  await AsyncStorage.setItem(AUTH_TOKENS_KEY, JSON.stringify(tokens));
};

const saveLastUser = async (username: string | null) => {
  cachedUser = username;
  if (!username) {
    await AsyncStorage.removeItem(AUTH_LAST_USER_KEY);
    return;
  }
  await AsyncStorage.setItem(AUTH_LAST_USER_KEY, username);
};

const isExpired = (exp: number) => Date.now() > exp - TOKEN_EXPIRY_LEEWAY_MS;

const pickToken = (tokens: AuthTokens | null) => {
  if (!tokens) return null;
  const useIdToken = COGNITO_CONFIG.TOKEN_USE === 'id';
  const token = useIdToken ? tokens.idToken : tokens.accessToken;
  const exp = useIdToken ? tokens.idTokenExp : tokens.accessTokenExp;
  if (!exp || isExpired(exp)) return null;
  return token;
};

export const getStoredTokens = async () => {
  await loadCache();
  return cachedTokens;
};

export const getLastUsername = async () => {
  await loadCache();
  return cachedUser;
};

export const getAuthToken = async () => {
  await loadCache();
  const storedToken = pickToken(cachedTokens);
  if (storedToken) return storedToken;
  return API_CONFIG.AUTH_TOKEN || null;
};

export const signIn = async (username: string, password: string) => {
  if (!username.trim() || !password) {
    throw new AuthError('아이디와 비밀번호를 입력해주세요.');
  }

  const user = new CognitoUser({
    Username: username.trim(),
    Pool: getUserPool(),
  });
  const authDetails = new AuthenticationDetails({
    Username: username.trim(),
    Password: password,
  });

  return new Promise<AuthTokens>((resolve, reject) => {
    user.authenticateUser(authDetails, {
      onSuccess: async (session) => {
        const tokens = mapSessionTokens(session);
        await Promise.all([saveTokens(tokens), saveLastUser(username.trim())]);
        resolve(tokens);
      },
      onFailure: (error) => {
        const message =
          error instanceof Error ? error.message : '로그인에 실패했습니다.';
        reject(new AuthError(message));
      },
      newPasswordRequired: () => {
        reject(new AuthError('새 비밀번호 설정이 필요합니다.'));
      },
      mfaRequired: () => {
        reject(new AuthError('MFA 설정이 필요합니다.'));
      },
    });
  });
};

export const signUp = async (username: string, password: string, email?: string) => {
  const trimmedUsername = username.trim();
  const trimmedEmail = email?.trim();
  if (!trimmedUsername || !password) {
    throw new AuthError('아이디와 비밀번호를 입력해주세요.');
  }

  const attributes: CognitoUserAttribute[] = [];
  if (trimmedEmail) {
    attributes.push(new CognitoUserAttribute({ Name: 'email', Value: trimmedEmail }));
  }

  return new Promise<SignUpResult>((resolve, reject) => {
    getUserPool().signUp(trimmedUsername, password, attributes, [], async (error, result) => {
      if (error || !result) {
        const message =
          error instanceof Error ? error.message : '회원가입에 실패했습니다.';
        reject(new AuthError(message));
        return;
      }
      await saveLastUser(trimmedUsername);
      resolve({
        username: trimmedUsername,
        userConfirmed: result.userConfirmed,
        delivery: result.codeDeliveryDetails ?? null,
      });
    });
  });
};

export const confirmSignUp = async (username: string, code: string) => {
  const trimmedUsername = username.trim();
  const trimmedCode = code.trim();
  if (!trimmedUsername || !trimmedCode) {
    throw new AuthError('인증 코드를 입력해주세요.');
  }

  const user = new CognitoUser({
    Username: trimmedUsername,
    Pool: getUserPool(),
  });

  return new Promise<void>((resolve, reject) => {
    user.confirmRegistration(trimmedCode, true, async (error) => {
      if (error) {
        const message =
          error instanceof Error ? error.message : '인증에 실패했습니다.';
        reject(new AuthError(message));
        return;
      }
      await saveLastUser(trimmedUsername);
      resolve();
    });
  });
};

export const resendSignUpCode = async (username: string) => {
  const trimmedUsername = username.trim();
  if (!trimmedUsername) {
    throw new AuthError('아이디를 입력해주세요.');
  }

  const user = new CognitoUser({
    Username: trimmedUsername,
    Pool: getUserPool(),
  });

  return new Promise<CodeDeliveryDetails | null>((resolve, reject) => {
    user.resendConfirmationCode(async (error, result) => {
      if (error) {
        const message =
          error instanceof Error ? error.message : '인증 코드 재전송에 실패했습니다.';
        reject(new AuthError(message));
        return;
      }
      await saveLastUser(trimmedUsername);
      resolve((result as CodeDeliveryDetails | undefined) ?? null);
    });
  });
};

export const signOut = async () => {
  await Promise.all([saveTokens(null), saveLastUser(null)]);
};
