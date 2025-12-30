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
  code?: string;

  constructor(message: string, code?: string) {
    super(message);
    this.name = 'AuthError';
    this.code = code;
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

const AUTH_ERROR_MESSAGES: Record<string, string> = {
  UsernameExistsException: '이미 가입된 아이디입니다. 로그인해주세요.',
  AliasExistsException: '이미 사용 중인 이메일입니다.',
  UserNotConfirmedException: '계정이 인증되지 않았습니다. 관리자에게 문의해주세요.',
  NotAuthorizedException: '아이디 또는 비밀번호가 올바르지 않습니다.',
  UserNotFoundException: '존재하지 않는 계정입니다.',
  InvalidPasswordException: '비밀번호 정책에 맞지 않습니다.',
  CodeMismatchException: '인증 코드가 올바르지 않습니다.',
  ExpiredCodeException: '인증 코드가 만료되었습니다.',
  LimitExceededException: '요청 횟수를 초과했습니다. 잠시 후 다시 시도해주세요.',
};

let cachedTokens: AuthTokens | null = null;
let cachedUser: string | null = null;
let cacheLoaded = false;

const getErrorCode = (error: unknown) => {
  if (!error || typeof error !== 'object') return undefined;
  const candidate = (error as { code?: string; name?: string }).code;
  if (typeof candidate === 'string') return candidate;
  const name = (error as { name?: string }).name;
  return typeof name === 'string' ? name : undefined;
};

const buildAuthError = (error: unknown, fallback: string) => {
  const code = getErrorCode(error);
  const mappedMessage = code ? AUTH_ERROR_MESSAGES[code] : undefined;
  const message =
    mappedMessage ?? (error instanceof Error ? error.message : fallback);
  return new AuthError(message, code);
};

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
    } catch {
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
        reject(buildAuthError(error, '로그인에 실패했습니다.'));
      },
      newPasswordRequired: () => {
        reject(new AuthError('새 비밀번호 설정이 필요합니다.', 'NewPasswordRequired'));
      },
      mfaRequired: () => {
        reject(new AuthError('MFA 설정이 필요합니다.', 'MFARequired'));
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
        reject(buildAuthError(error, '회원가입에 실패했습니다.'));
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
        reject(buildAuthError(error, '인증에 실패했습니다.'));
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
        reject(buildAuthError(error, '인증 코드 재전송에 실패했습니다.'));
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
