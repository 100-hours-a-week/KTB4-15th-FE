# FE 프로젝트 결정 사항

마지막 업데이트: 2026-10-26

프로젝트 전반에 영향을 주는 확정 사항과 보류 항목을 요약합니다. 현재 구현의 상세한 동작은 [FE 문서 목록](./README.md)과 [도메인 문서](./domains/README.md)를 기준으로 합니다.

## 개발 환경

- Node.js, pnpm, Next.js와 React 버전은 `package.json`, Volta와 `.nvmrc`에 고정합니다.
- 애플리케이션 코드는 TypeScript와 Next.js App Router로 작성합니다.
- ESLint, Stylelint, Prettier와 TypeScript 검사를 `pnpm check`로 실행합니다.
- Docker 배포 결과는 Next.js `standalone` 형식으로 생성합니다.

## 애플리케이션 구조

- `/`는 공개 랜딩으로 제공하며 온보딩 완료 쿠키 분기는 제거합니다. 서비스 인증과 프로필 확인은 보호된 경로에서 수행합니다.

- 최상위 Route Group은 공개 화면의 `(public)`과 인증이 필요한 `(service)`로 구분합니다.
- 서비스 라우트는 URL과 같은 도메인 계층으로 구성하고, 공통 `ServiceShell`에서 경로별 하단 Navigation과 화면 표면을 결정합니다.
- 하단 Navigation은 표시 대상 화면에서 스크롤 방향에 따라 숨기거나 표시하고, 모바일 키보드가 열린 동안에는 숨깁니다. 채팅 입력창만 키보드 위에 유지합니다.
- Route 전용 코드는 `app`, 비즈니스 기능은 `features`, 둘 이상의 Feature가 공유하는 코드는 `shared`에 배치합니다.
- 폴더는 실제 코드가 필요한 시점에 만들며 빈 폴더 유지를 위한 파일은 추가하지 않습니다.
- 서버 상태는 TanStack Query, 서버 저장 전 여러 화면에서 공유하는 임시 상태는 Zustand로 관리합니다.
- 채팅 새 답변은 하단을 보는 중에만 자동 이동하며, 이전 대화를 읽는 중에는 위치를 유지하고 답변 이동 버튼을 제공합니다. 상세 기준은 [채팅 도메인](./domains/chat.md)을 따릅니다.
- 사용자 흐름과 비즈니스 규칙은 [도메인 문서](./domains/README.md)에서 관리합니다.

### TanStack Query 규칙

- Query key는 도메인부터 시작하는 배열로 작성합니다. 고정 segment는 소문자 단일 단어를 사용하고, 목록은 복수형, 단일 리소스는 단수형으로 구분합니다.
- 목록·상세·필터처럼 같은 리소스의 key가 반복되면 model의 key 정의나 factory를 재사용합니다. Query와 invalidation에서 같은 정의를 사용합니다.
- Query variable은 해당 Query key에 포함합니다.
- 재사용할 Query 설정은 `queryOptions` 또는 `infiniteQueryOptions`로 만들고, 컴포넌트에서는 `useQuery`나 `useInfiniteQuery`로 실행합니다.
- `staleTime`은 데이터의 기본 freshness 정책입니다. mutation으로 서버 데이터가 변경되면 관련 Query를 명시적으로 무효화합니다.
- Query 무효화는 캐시를 즉시 삭제하는 것이 아니라 stale 상태로 표시하는 동작입니다. 비활성 Query는 다음 활성화 시 최신 데이터를 가져옵니다.

자세한 구조는 [아키텍처](./architecture.md)를 참고합니다.

## API와 오류 처리

- 브라우저 API Client는 Ky와 `NEXT_PUBLIC_API_BASE_URL`을 사용하고 Cookie를 포함합니다.
- 브라우저 요청의 기본 Timeout은 10초, Retry 한도는 1회입니다.
- 채팅과 알림 SSE는 인증 갱신과 연결 취소 제어를 위해 `EventSource` 대신 Ky 응답 Stream을 사용합니다.
- 채팅 Sidebar는 첫 화면의 실행 비용을 줄이기 위해 목록 버튼을 처음 누를 때 동적으로 로드하고 이후에는 마운트를 유지합니다.
- 오프라인 요청은 `OfflineError`, 문자열 오류 Code가 있는 HTTP 오류는 `ApiError`로 정규화하고 Ky의 네트워크·Timeout 오류는 사용자용 문구로 변환합니다.
- Feature는 HTTP 응답을 다시 파싱하지 않고 필요한 오류만 `ApiError.code`로 처리합니다.
- 서버 요청은 Next.js `fetch`와 서버 전용 `API_BASE_URL`을 사용하며 현재 요청의 Cookie를 전달합니다.
- 서버의 원문 오류 메시지는 사용자에게 직접 노출하지 않습니다.

자세한 내용은 [API와 인증](./api-and-auth.md)을 참고합니다.

### API 모킹

- 개발 환경에서 `NEXT_PUBLIC_API_MOCKING=enabled`일 때만 MSW를 활성화합니다.
- 브라우저 요청은 Service Worker로, Node.js 서버 요청은 `setupServer`로 가로채며 Handler는 공유합니다.
- Handler가 없는 요청은 경고를 출력하고 실제 API로 전달합니다.

## 인증과 접근 제어

- 인증은 HttpOnly Cookie를 사용합니다.
- 일반 API 요청이 `401`이면 Next `/bff/auth/refresh`를 통해 Access Token 갱신을 한 번 시도하고 원래 요청을 다시 보냅니다.
- SSR 데이터 요청이 `401`이면 BFF 갱신 경로로 이동한 뒤 원래 경로의 SSR을 다시 실행하며, 두 번째 `401`은 로그인 화면으로 이동합니다.
- 로그인은 Spring API를 직접 사용하고, Token 갱신과 로그아웃은 Spring의 `Set-Cookie`를 중계하는 Next Route Handler를 사용합니다.
- 갱신도 `401`이면 Client Cache와 피팅 선택을 제거한 뒤 로그인 화면으로 이동합니다.
- `(public)/(auth)`의 로그인·회원가입은 인증된 사용자를 프로필 상태에 따라 `/chat` 또는 `/profile/setup`으로 보냅니다.
- `(service)`는 인증과 프로필 완료 여부가 확인된 경우에만 화면을 렌더링합니다.

## 디자인 시스템

- 피팅 성공 토스트는 5초 동안 결과 보기 동작을 제공하고, 해당 피팅 진행·결과 화면에서는 표시하지 않습니다.

- 헤더 알림 여부는 Next 서버에서 인증과 병렬로 조회해 초기값으로 전달하고 SSE와 읽음 응답으로 갱신합니다. 사용자별 응답은 캐시하지 않으며, 최대 1초 대기 후 실패 시 브라우저 조회로 복구합니다. 초기값이 있으면 마운트 직후 중복 조회하지 않습니다.

- 기준 디자인은 Figma, 구현 방식은 SCSS Modules와 프로젝트 토큰입니다.
- 서비스 본체는 최대 `480px`의 단일 Column으로 유지합니다.
- Header `52px`, 하단 Navigation `56px`, 기본 터치 영역 최소 `44px`의 Mobile Compact 규격을 사용합니다.
- 탭 전환 애니메이션은 종료 후 효과를 유지하지 않아 채팅 Header와 입력창의 viewport 고정을 보장합니다.
- 공통 UI는 비즈니스 로직과 API 요청을 직접 소유하지 않습니다.
- Dialog와 BottomSheet의 열림 상태는 사용하는 화면에서 관리합니다.
- 접근성과 `prefers-reduced-motion`을 지원합니다.
- 다크 모드와 Shadow는 현재 지원하지 않습니다.

자세한 내용은 [디자인 시스템](./design-system.md)을 참고합니다.

## 분석과 모니터링

- Microsoft Clarity는 설정값이 있는 Production Build에서만 사용자 행동을 수집합니다.
- Sentry는 Production의 Browser, Node.js와 Edge Runtime 오류를 수집합니다.
- Sentry의 사용자 정보, Cookie, Header·Body·Query, Local Variable, 성능 추적과 Session Replay는 수집하지 않습니다.
- Source Map은 운영 Build에서만 업로드하고 인증 Token은 Docker Build Secret으로 전달합니다.
- 전역 렌더링 오류는 복구 UI를 제공하면서 Sentry에 전달합니다.

자세한 내용은 [분석과 모니터링](./analytics-and-monitoring.md)을 참고합니다.

## 빌드와 배포

- Docker Builder 단계에서 `pnpm check`와 `pnpm build`가 모두 통과해야 Image를 생성합니다.
- `NEXT_PUBLIC_*` 설정은 Build Argument로 전달하며 Browser Bundle에 공개되는 값만 사용합니다.
- 운영 배포는 GitHub Actions에서 ECR Image를 생성한 뒤 AWS SSM을 통해 요청합니다.
- 문서만 변경된 Commit은 자동 배포를 실행하지 않습니다.
- Liveness 확인은 외부 의존성을 조회하지 않는 `GET /health`와 HTTP 200 `{ "status": "UP" }`을 사용합니다.

## 테스트

- 함수와 Route Handler의 동작은 Node.js 내장 Test Runner로 검증합니다.
- 핵심 사용자 흐름은 Chromium 기반 Playwright 브라우저 테스트로 검증합니다.
- 브라우저 테스트의 API 응답은 기존 MSW Handler를 재사용합니다.
- 채팅 브라우저 테스트는 MSW 응답을 로컬 HTTP API로 제공하여 SSR과 브라우저의 저장 상태를 공유합니다. 테스트별 초기화와 단일 Worker로 격리하며 실제 서버에는 연결하지 않습니다. 상세 범위는 [테스트 문서](./testing.md)를 참고합니다.
- `develop`·`main` 대상 PR의 CI에서 Unit 테스트와 Chromium 브라우저 테스트를 실행하며, Report와 실패 진단 자료를 7일간 보관합니다. 기존 Docker 검사·빌드와 별도 Job으로 실행합니다.
- E2E 코드는 기능별 Spec과 `fixtures`(준비·정리), `data`(고정 데이터), `helpers`(공통 조작), `mock-api`(서버·응답)로 나눕니다. 가짜 API의 Handler와 가변 상태는 함께 유지하고 HTTP 서버 실행부만 분리합니다.
- Firefox, WebKit과 시각적 회귀 테스트는 호환성 검증 필요가 생길 때 도입합니다.

## 보류 항목

- UI Component 단위 Test 도구 및 범위
- Husky 및 Pre-commit Hook 도입
- 인증 Cookie 이름, 만료, 갱신 주기와 CSRF 정책
- Desktop 외부 영역 디자인
- Input과 Textarea 공통 Component의 세부 규칙
- Clarity Cookie, 동의 모드와 Masking의 개인정보 처리 정책

보류 항목은 기능 개발에 필요해지는 시점에 검토하며, 결정 전에는 임의로 확정하지 않습니다.

## 랭킹

- 로그인된 SSR과 5분 Next.js 데이터 캐시를 사용합니다. ECS별 갱신 시점 차이를 허용하며 페이지 전체 ISR은 보류합니다.
- 현행 쿠키 인증과 공통 캐시 키를 유지하기 위해 `unstable_cache`를 사용합니다. `use cache` 전환은 Cache Components와 조회 인증 경계를 함께 검토하는 별도 작업으로 둡니다. 선택 근거와 대안은 [랭킹 캐시 문서](./domains/ranking.md#데이터-캐시)를 참고합니다.
- 표시·이미지·점진 렌더링 규칙은 [랭킹 도메인](./domains/ranking.md), 측정 근거와 실험 이력은 [랭킹 성능 개선 기록](./performance/ranking.md)에서 관리합니다.

## 서비스 공통 클라이언트 import

- 공통 레이아웃의 인증 가드와 알림 Provider는 구현 파일에서 직접 import해 다른 화면 코드가 초기 번들에 포함되지 않도록 합니다. 측정 근거는 [랭킹 성능 개선 기록](./performance/ranking.md)을 참고합니다.

## Zod import

- Zod는 `import * as z from "zod"`로 가져옵니다. 현재 빌드에서 미사용 코드 제거를 개선하며 응답 스키마와 런타임 검증은 유지합니다. 비교 결과는 [랭킹 성능 개선 기록](./performance/ranking.md)을 참고합니다.

## 랭킹 표시 개수 비교 실험

- 최초 표시와 추가 표시 묶음을 20개에서 12개로 줄여 비교합니다. API 응답·캐시·첫 이미지 우선순위는 유지하며 실제 이미지 요청 수·TBT·스크롤 반응 개선은 재측정 전입니다.

## 스크롤 랜딩 시안 (2026-10-31)

- 로그아웃 성공 후에는 로그인 화면 대신 공개 랜딩(`/`)으로 이동합니다.
- Hero는 제목·폰의 가운데 세로 배치를 유지하고 최대 1.2배 확대합니다. 한 화면 내 고정을 유지하면서 데모 높이와 제목 여백을 줄입니다.
- 고정 경계 보정은 히어로와 기능 소개에 `anticipatePin: 1`을 적용하며, 기능 소개의 의도적인 750px 대기와 기존 스크롤 거리는 유지합니다.
- 랜딩을 `/`로 제공하고 기존 `/landing`·`/onboarding`은 `/`로 연결합니다. 첫 방문 여부를 저장하지 않으며 남아 있는 기존 온보딩 쿠키는 무시합니다.
- 실제 채팅·피팅 API 대신 AI 제작 데모 소재와 GSAP ScrollTrigger로 서비스 흐름을 보여줍니다. 모션 감소 설정에는 정적인 대체 배치를 제공합니다.
- 랜딩의 화면 구성·스크롤 연출·반응형 기준은 [랜딩 화면](./screens/landing.md)에서 관리합니다.
