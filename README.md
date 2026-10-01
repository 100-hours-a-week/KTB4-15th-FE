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
pnpm test         # Health Route 테스트
pnpm lint         # ESLint와 Stylelint 검사
pnpm lint:fix     # 수정 가능한 lint 오류 자동 수정
pnpm format       # Prettier 포맷 적용
pnpm format:check # 포맷 검사
pnpm type-check   # TypeScript 타입 검사
pnpm check        # 포맷, lint, 타입 검사 일괄 실행
```

## 문서

- [FE 문서 목록](./docs/README.md): 주제별 문서와 관리 원칙
- [아키텍처](./docs/architecture.md): 라우팅, 폴더 구조와 상태 관리
- [디자인 시스템](./docs/design-system.md): 디자인 토큰, 공통 UI와 접근성
- [API와 인증](./docs/api-and-auth.md): API Client, 인증 갱신과 접근 제어
- [도메인](./docs/domains/README.md): 인증, 채팅, 피팅과 회원·프로필의 기능 규칙
- [개발 규칙](./docs/conventions.md): 이름, 코드 배치와 품질 검사
- [프로젝트 결정 사항](./docs/project-decisions.md): 핵심 결정과 보류 항목

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

상세한 구조와 개발 기준은 [FE 문서](./docs/README.md)에서 관리합니다. README는 프로젝트 실행에 필요한 기본 정보와 문서 진입점에 집중합니다.
