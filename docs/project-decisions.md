# FE 프로젝트 결정 사항

마지막 업데이트: 2026-10-24

프로젝트 전반에 영향을 주는 확정 사항과 보류 항목을 요약합니다. 현재 구현의 상세한 동작은 [FE 문서 목록](./README.md)과 [도메인 문서](./domains/README.md)를 기준으로 합니다.

## 개발 환경

- Node.js, pnpm, Next.js와 React 버전은 `package.json`, Volta와 `.nvmrc`에 고정합니다.
- 애플리케이션 코드는 TypeScript와 Next.js App Router로 작성합니다.
- ESLint, Stylelint, Prettier와 TypeScript 검사를 `pnpm check`로 실행합니다.
- Docker 배포 결과는 Next.js `standalone` 형식으로 생성합니다.

## 애플리케이션 구조

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
- `(public)`은 인증된 사용자를 프로필 상태에 따라 `/chat` 또는 `/profile/setup`으로 보냅니다.
- `(service)`는 인증과 프로필 완료 여부가 확인된 경우에만 화면을 렌더링합니다.

## 디자인 시스템

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

## 랭킹 집계 수 표시

- 찜·조회 수는 `Intl.NumberFormat`의 영어 compact 표기를 사용해 K·M·B 단위로 표시합니다.
- 소수점 이하는 버리고 정수와 단위만 표시합니다. `999,999 → 999K`처럼 단위 경계에서도 반올림하지 않습니다.
- 단위별 경계와 MSW 고정 데이터 검증은 [테스트 문서](./testing.md)를 참고합니다.

## 보류 항목

- UI Component 단위 Test 도구 및 범위
- Husky 및 Pre-commit Hook 도입
- 인증 Cookie 이름, 만료, 갱신 주기와 CSRF 정책
- Desktop 외부 영역 디자인
- Input과 Textarea 공통 Component의 세부 규칙
- Clarity Cookie, 동의 모드와 Masking의 개인정보 처리 정책

보류 항목은 기능 개발에 필요해지는 시점에 검토하며, 결정 전에는 임의로 확정하지 않습니다.

## 랭킹 썸네일 최적화

- 랭킹의 원본 URL 반환 로더를 제거하고 찜 목록과 동일하게 Next.js 기본 이미지 최적화를 사용합니다. 기존 허용 호스트와 `sizes="80px"`를 유지합니다.
- 확대창은 원본 URL을 유지합니다. 측정 절차는 [테스트 문서](./testing.md)의 랭킹 이미지 최적화 검증을 참고합니다.

## 랭킹 최초 데이터 서버 조회

- `/ranking`은 서버에서 기본 찜순 랭킹을 조회해 `RankingScreen`의 초기 데이터로 제공합니다. 로그인 쿠키와 기존 인증 갱신 경로를 사용하고 조회는 `no-store`로 처리합니다. 이번 단계는 ISR이나 사용자 간 공통 캐시를 도입하지 않습니다.
- 서버 조회 실패 중 401은 기존 인증 갱신 경로로 이동하고, 나머지 실패는 클라이언트 조회·재시도로 복구합니다.
- 찜 목록과 같이 서버 초기 데이터가 있는 쿼리는 30초 동안 최신으로 취급해 hydration 직후 중복 조회를 막습니다. 조회순은 첫 선택 시 클라이언트에서 조회합니다. 이미지 preload와 확대창 로딩은 이번 단계에서 변경하지 않습니다.

## 랭킹 공통 데이터 캐시

- 최초 찜순 서버 조회는 Next.js `unstable_cache`로 성공한 데이터만 300초 재사용하고 이후 요청에서 백그라운드 재검증합니다. 기존 프로젝트 설정을 유지하기 위해 Cache Components 전역 도입은 이번 범위에 포함하지 않습니다.
- 캐시를 읽기 전 `members/me`를 `no-store`로 호출해 요청별 인증을 확인합니다. 쿠키는 캐시 밖에서 읽고 원본 API 호출에만 전달합니다. 랭킹은 사용자별 필드가 없으므로 캐시 키는 버전과 API URL(기준 포함)로 구성하고 사용자 쿠키는 제외합니다. 인증 응답과 실패 결과는 저장하지 않습니다.
- 페이지 전체 ISR은 아닌 동적 SSR + 재검증 가능한 Data Cache입니다. 조회순 브라우저 호출은 기존 방식으로 유지합니다.
- ECS 인스턴스별 갱신 시점 차이를 허용합니다. Next.js 기본 캐시가 컨테이너 간 자동 공유되지는 않으며, 배포·재시작 시 캐시 보존 여부는 볼륨 구성에 따라 달라집니다. 재검증 실패 시 이전 데이터가 더 오래 유지될 수 있습니다.

## 랭킹 렌더링 방식 확정

- 현재는 SSR + Next.js 공통 데이터 캐시를 유지합니다. ECS별 캐시 갱신 시점 차이를 허용하며 페이지 전체 ISR과 서버 전용 랭킹 API 도입은 보류합니다.
- 최초 HTML에서 이미지 URL이 있는 첫 상품 한 개에만 찜 목록과 같은 `preload`를 적용합니다. 나머지는 기존 지연 로딩을 유지합니다. 이미지가 없는 첫 행은 건너뜁니다.
- 이번 변경의 효과는 SSE를 끈 동일 조건의 기준값(LCP 중앙값 4.558초)과 비교합니다. 실제 서비스의 SSE 기능 제거는 성능 개선 범위가 아닙니다.

- 첫 랭킹 이미지의 preload에는 `fetchPriority="high"`를 지정해 브라우저에 높은 요청 우선순위를 전달합니다. 다른 상품 이미지의 우선순위는 기본값을 유지합니다.

- 랭킹 이미지 확대창은 찜 목록과 같은 동적 import를 사용하고 열려 있을 때만 마운트합니다. 닫힌 확대창을 상품마다 초기 렌더링하는 비용을 줄입니다.

- 랭킹 최초 행은 페이지 서버 컴포넌트에서 생성해 `RankingScreen`에 전달합니다. 찜 목록과 같이 상품명·가격·순위·집계 표시를 서버에서 구성하고 이미지 확대·구매 클릭만 클라이언트 액션으로 분리합니다. 탭 전환과 클라이언트 재조회 후에는 최신 쿼리 데이터로 행을 렌더링합니다.

- 랭킹 데이터는 기존처럼 기준별 최대 100개를 한 번에 받되 최초 HTML과 초기 화면에는 20개만 표시합니다. 목록 끝 200px 이내에서 20개씩 추가 렌더링하고 탭 전환 시 표시 개수를 20개로 초기화합니다. 추가 표시는 API 요청을 발생시키지 않으며 수동 `상품 더 보기` 버튼도 제공합니다. 전체 스크롤 후에는 최대 100개가 렌더링되는 방식이며 가상화나 서버 페이지네이션은 아닙니다.
