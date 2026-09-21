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
├── app/                         # Route, Layout, Page
│   ├── (public)/
│   └── (service)/
│       ├── (main)/             # 하단 내비게이션이 있는 주요 화면
│       └── (standalone)/       # 독립된 서비스 흐름
├── features/                    # 비즈니스 기능별 UI, API 타입, Fixture
├── shared/
│   ├── api/                     # 공통 API 응답 타입과 서버·클라이언트 요청 설정
│   ├── ui/                      # 기능에 종속되지 않는 공통 UI
│   └── utils/                   # 범용 Utility
└── styles/                      # 전역 Design Token과 Mixin
```

라우트 그룹 이름은 URL에 포함되지 않습니다. 라우트 전용 코드는 `app`에, 도메인 기능은 `features`에, 둘 이상의 기능에서 재사용하는 UI와 Utility는 `shared`에 배치합니다.

## 공통 API 처리

공통 API 로직은 `src/shared/api`에서 관리합니다.

- `response.ts`: BE 공통 응답 형식인 `ApiResponse<T>`(`code`, `data`, `message`)를 정의합니다.
- `client.ts`: 브라우저 요청에 사용할 Ky 인스턴스를 구성합니다. `NEXT_PUBLIC_API_BASE_URL`을 기준 URL로 사용하고, Cookie를 포함하며, 10초 timeout과 최대 2회 retry를 적용합니다.
- `server.ts`: Server Component과 Route Handler 등 서버 환경의 요청에 사용할 `serverApi`를 제공합니다. `API_BASE_URL`을 기준 URL로 사용하고, 현재 요청의 Cookie를 BE로 전달하며, 별도의 `signal`이 없으면 10초 timeout을 적용합니다. 2xx가 아닌 응답은 오류로 처리합니다.

`NEXT_PUBLIC_API_BASE_URL`은 브라우저 번들에 포함되므로 비밀 값을 사용하지 않습니다.

## 개발 기준

- App Router를 사용합니다.
- `/`는 현재 `/login`으로 이동합니다.
- 컴포넌트 스타일은 `*.module.scss`를 사용합니다.
- 전역 스타일은 필요한 최소 범위로 제한합니다.
- 기본 서체는 Pretendard를 사용합니다.
- 브랜드 초록 팔레트와 용도별 시맨틱 색상 토큰을 사용합니다.
- 현재 다크 모드는 지원하지 않습니다.
- 인증은 BE와 HttpOnly Cookie 방식으로 협의합니다.
- spacing과 radius는 프로젝트 토큰을 사용하며 shadow는 현재 사용하지 않습니다.
- 테스트 도구와 테스트 범위는 아직 확정하지 않았습니다.

확정 사항과 보류 항목은 [프로젝트 결정 사항](./docs/project-decisions.md)에서 관리합니다.
