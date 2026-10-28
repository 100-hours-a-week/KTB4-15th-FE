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
pnpm test         # Unit 테스트
pnpm test:e2e     # Playwright 브라우저 테스트
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
fe/
├── docs/                            # 아키텍처, 도메인 규칙과 성능 개선 기록
├── public/                          # 정적 파일
├── src/
│   ├── app/                         # 라우트, 레이아웃과 라우트 전용 코드
│   │   ├── (public)/                # 온보딩과 인증 화면
│   │   │   ├── (auth)/              # 로그인, 회원가입
│   │   │   └── onboarding/          # 최초 진입 온보딩
│   │   ├── (service)/               # 인증이 필요한 서비스 화면
│   │   │   ├── layout.tsx           # 서비스 인증 공통 적용
│   │   │   ├── service-shell.tsx    # 내비게이션, 페이지 표면과 화면 전환
│   │   │   ├── chat/                # 채팅 목록과 대화방
│   │   │   ├── fitting/             # 피팅 홈, 옷장 목록과 작업 상태
│   │   │   ├── fitting-results/     # 피팅 결과 목록과 상세
│   │   │   ├── mypage/              # 마이 페이지
│   │   │   ├── notifications/       # 알림 목록
│   │   │   ├── profile/             # 프로필 설정
│   │   │   ├── ranking/             # 상품 랭킹
│   │   │   └── wishlists/           # 찜 목록
│   │   ├── bff/auth/                # 인증 갱신·로그아웃 Route Handler
│   │   └── health/                  # 상태 확인 Route Handler
│   ├── features/                    # 도메인별 UI, API, 스키마와 상태 관리
│   ├── mocks/                       # MSW 기반 API 모킹
│   ├── shared/
│   │   ├── api/                     # 공통 API 응답 타입과 요청 설정
│   │   ├── assets/                  # 공통 이미지
│   │   ├── monitoring/              # 모니터링 공통 설정
│   │   ├── schema/                  # 공통 데이터 스키마
│   │   ├── ui/                      # 공통 UI
│   │   └── utils/                   # 공통 유틸리티
│   └── styles/                      # 전역 디자인 토큰과 Mixin
└── tests/                           # 단위 테스트와 브라우저 테스트
```

서비스 라우트는 URL의 도메인 계층과 같은 폴더 구조로 구성합니다. `(service)/layout.tsx`는 인증을 공통 적용하고, `service-shell.tsx`는 현재 경로에 따른 네비게이션과 페이지 표면을 관리합니다. 라우트 전용 코드는 `app`에, 도메인 기능은 `features`에, 둘 이상의 기능에서 재사용하는 UI와 Utility는 `shared`에 배치합니다.

상세한 구조와 개발 기준은 [FE 문서](./docs/README.md)에서 관리합니다. README는 프로젝트 실행에 필요한 기본 정보와 문서 진입점에 집중합니다.
