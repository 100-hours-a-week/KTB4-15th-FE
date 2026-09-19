# LOOK DDAK Frontend

LOOK DDAK의 Next.js 프론트엔드 프로젝트입니다.

## 실행 환경

- Node.js `24.21.0`
- pnpm `10.12.1`
- Next.js `16.3.5`
- React `19.2.8`

Node.js 버전은 Volta와 `.nvmrc`에 고정되어 있습니다.

## 시작하기

```bash
pnpm install
pnpm dev
```

개발 서버는 기본적으로 [http://localhost:3000](http://localhost:3000)에서 실행됩니다.

## 주요 명령어

```bash
pnpm dev          # 개발 서버
pnpm build        # 프로덕션 빌드
pnpm lint         # ESLint와 Stylelint 검사
pnpm lint:fix     # 수정 가능한 lint 오류 자동 수정
pnpm format       # Prettier 포맷 적용
pnpm format:check # 포맷 검사
pnpm type-check   # TypeScript 타입 검사
pnpm check        # 포맷, lint, 타입 검사 일괄 실행
```

## 프로젝트 구조

```text
src/
├── app/                    # Route, Layout, Page와 Route 전용 코드
├── features/               # 비즈니스 기능별 코드
│   └── feature-name/
│       ├── api/            # 해당 기능의 API 요청
│       ├── hooks/          # 해당 기능에 종속된 React Hook
│       ├── model/          # 상태, 타입, Schema와 비즈니스 로직
│       └── ui/             # 해당 기능에 종속된 UI
├── shared/                 # 비즈니스 기능에 종속되지 않는 공통 코드
│   ├── api/                # 공통 HTTP Client와 API 기반 코드
│   ├── ui/                 # 공통 UI와 React 아이콘 컴포넌트
│   ├── hooks/              # 여러 기능에서 재사용하는 React Hook
│   ├── lib/                # 외부 라이브러리 설정과 순수 Utility
│   ├── config/             # 환경변수, Route와 전역 상수
│   └── styles/             # Design Token과 Mixin
└── testing/                # Test 설정, Fixture와 Mock

public/
├── icons/                  # 고정 URL로 제공하는 SVG 원본
└── images/                 # 고정 URL로 제공하는 정적 이미지

e2e/                        # End-to-End Test
```

기능 전용 Schema는 `features/*/model`, 공통 API Schema는 `shared/api`, 공통 검증 도구는 `shared/lib`에서 관리합니다. 폴더는 실제 코드가 필요해질 때 생성하며 빈 폴더는 만들지 않습니다.

단위 테스트와 컴포넌트 테스트는 대상 코드 가까이에 배치합니다. 공통 테스트 설정, Fixture, Mock과 Utility는 `src/testing`, E2E 테스트는 루트의 `e2e`에서 관리합니다. 구체적인 테스트 도구와 범위는 도입 시점에 확정합니다.

## 개발 기준

- App Router를 사용합니다.
- `/`는 현재 `/login`으로 이동합니다.
- 컴포넌트 스타일은 `*.module.scss`를 사용합니다.
- 전역 스타일은 필요한 최소 범위로 제한합니다.
- 기본 서체는 Pretendard를 사용합니다.
- 브랜드 초록 팔레트와 용도별 시맨틱 색상 토큰을 사용합니다.
- 현재 다크 모드는 지원하지 않습니다.
- 인증은 BE와 HttpOnly Cookie 방식으로 협의합니다.
- 테스트 도구와 테스트 범위는 아직 확정하지 않았습니다.
- shadow는 현재 사용하지 않습니다.

확정 사항과 보류 항목은 [프로젝트 결정 사항](./docs/project-decisions.md)에서 관리합니다.
