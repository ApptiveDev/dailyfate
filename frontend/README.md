# Frontend

React Native + Expo 프로젝트

## 기술 스택

- **Framework**: React Native with Expo
- **Language**: TypeScript
- **Styling**: NativeWind (TailwindCSS for React Native)
- **Navigation**: Expo Router
- **State Management**: Ready to integrate (Zustand, Redux, etc.)
- **Package Manager**: pnpm

## 프로젝트 구조

```
frontend/
├── app/                    # Expo Router 파일 기반 라우팅
│   ├── _layout.tsx        # 루트 레이아웃
│   └── (tabs)/            # 탭 네비게이션
├── src/
│   ├── assets/            # 이미지, 폰트 등 정적 파일
│   ├── components/        # 재사용 가능한 컴포넌트
│   ├── constants/         # 상수 정의
│   ├── hooks/             # 커스텀 훅
│   ├── providers/         # Context Providers
│   ├── schemas/           # 데이터 스키마
│   ├── services/          # API 서비스
│   ├── stores/            # 상태 관리 스토어
│   ├── styles/            # 전역 스타일
│   ├── types/             # TypeScript 타입 정의
│   └── utils/             # 유틸리티 함수
└── @types/                # 타입 선언 파일

```

## 설치 및 실행

### 설치

\`\`\`bash
pnpm install
\`\`\`

### 개발 서버 실행

\`\`\`bash
pnpm start
\`\`\`

### 플랫폼별 실행

\`\`\`bash

# iOS

pnpm ios

# Android

pnpm android

# Web

pnpm web
\`\`\`

## 스크립트

- `pnpm start` - Expo 개발 서버 시작
- `pnpm android` - Android 앱 실행
- `pnpm ios` - iOS 앱 실행
- `pnpm web` - 웹 버전 실행
- `pnpm lint` - ESLint로 코드 검사
- `pnpm lint:fix` - ESLint로 코드 자동 수정
- `pnpm format` - Prettier로 코드 포맷팅
- `pnpm type-check` - TypeScript 타입 체크

## 개발 가이드

### Path Aliases

프로젝트에서 다음과 같은 경로 별칭을 사용할 수 있습니다:

- `@/*` → `./src/*`
- `@components/*` → `./src/components/*`
- `@hooks/*` → `./src/hooks/*`
- `@utils/*` → `./src/utils/*`
- `@services/*` → `./src/services/*`
- `@stores/*` → `./src/stores/*`
- `@types/*` → `./src/types/*`
- `@constants/*` → `./src/constants/*`
- `@assets/*` → `./src/assets/*`
- `@styles/*` → `./src/styles/*`

### NativeWind (TailwindCSS)

NativeWind를 사용하여 TailwindCSS 스타일을 적용할 수 있습니다:

\`\`\`tsx
<View className="flex-1 items-center justify-center bg-white">
<Text className="text-2xl font-bold">Hello World</Text>
</View>
\`\`\`

## Git Hooks

Husky와 lint-staged를 사용하여 커밋 전 자동으로 린트와 포맷팅이 실행됩니다.
