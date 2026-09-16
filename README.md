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
└── app/
    ├── (public)/
    │   └── login/ # /login
    └── (service)/
        └── chat/  # /chat
```

라우트 그룹 이름은 URL에 포함되지 않습니다. 기능이 늘어나면 합의된 아키텍처에 따라 `features`, `components`, `lib`, `config`, `styles`를 추가합니다.

## 개발 기준

- App Router를 사용합니다.
- `/`는 현재 `/login`으로 이동합니다.
- 컴포넌트 스타일은 `*.module.scss`를 사용합니다.
- 전역 스타일은 필요한 최소 범위로 제한합니다.
- 현재 다크 모드는 지원하지 않습니다.
- 인증은 BE와 HttpOnly Cookie 방식으로 협의합니다.
- 테스트 도구, 디자인 토큰 및 공통 SCSS 세부 구조는 아직 확정하지 않았습니다.

확정 사항과 보류 항목은 [프로젝트 결정 사항](./docs/project-decisions.md)에서 관리합니다.
