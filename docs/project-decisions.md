# FE 프로젝트 결정 사항

마지막 업데이트: 2026-10-01

프로젝트 전반에 영향을 주는 확정 사항과 보류 항목을 요약합니다. 현재 구현의 상세한 동작은 [FE 문서 목록](./README.md)과 [도메인 문서](./domains/README.md)를 기준으로 합니다.

## 개발 환경

- Node.js, pnpm, Next.js와 React 버전은 `package.json`, Volta와 `.nvmrc`에 고정합니다.
- 애플리케이션 코드는 TypeScript와 Next.js App Router로 작성합니다.
- ESLint, Stylelint, Prettier와 TypeScript 검사를 `pnpm check`로 실행합니다.
- Docker 배포 결과는 Next.js `standalone` 형식으로 생성합니다.

## 애플리케이션 구조

- 최상위 Route Group은 공개 화면의 `(public)`과 인증이 필요한 `(service)`로 구분합니다.
- 서비스 화면은 하단 Navigation이 있는 `(main)`, 상세·작업 화면인 `(subpage)`, 독립 흐름인 `(standalone)`으로 나눕니다.
- Route 전용 코드는 `app`, 비즈니스 기능은 `features`, 둘 이상의 Feature가 공유하는 코드는 `shared`에 배치합니다.
- 폴더는 실제 코드가 필요한 시점에 만들며 빈 폴더 유지를 위한 파일은 추가하지 않습니다.
- 서버 상태는 TanStack Query, 서버 저장 전 여러 화면에서 공유하는 임시 상태는 Zustand로 관리합니다.
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
- 오프라인 요청은 `OfflineError`, 문자열 오류 Code가 있는 HTTP 오류는 `ApiError`로 정규화합니다.
- Feature는 HTTP 응답을 다시 파싱하지 않고 필요한 오류만 `ApiError.code`로 처리합니다.
- 서버 요청은 Next.js `fetch`와 서버 전용 `API_BASE_URL`을 사용하며 현재 요청의 Cookie를 전달합니다.
- 서버의 원문 오류 메시지는 사용자에게 직접 노출하지 않습니다.

자세한 내용은 [API와 인증](./api-and-auth.md)을 참고합니다.

## 인증과 접근 제어

- 인증은 HttpOnly Cookie를 사용합니다.
- 일반 API 요청이 `401`이면 Access Token 갱신을 한 번 시도하고 원래 요청을 다시 보냅니다.
- 갱신도 `401`이면 Client Cache와 피팅 선택을 제거한 뒤 로그인 화면으로 이동합니다.
- `(public)`은 인증된 사용자를 프로필 상태에 따라 `/chat` 또는 `/profile/setup`으로 보냅니다.
- `(service)`는 인증과 프로필 완료 여부가 확인된 경우에만 화면을 렌더링합니다.

## 디자인 시스템

- 기준 디자인은 Figma, 구현 방식은 SCSS Modules와 프로젝트 토큰입니다.
- 서비스 본체는 최대 `480px`의 단일 Column으로 유지합니다.
- Header `52px`, 하단 Navigation `56px`, 기본 터치 영역 최소 `44px`의 Mobile Compact 규격을 사용합니다.
- 공통 UI는 비즈니스 로직과 API 요청을 직접 소유하지 않습니다.
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

## 보류 항목

- UI Component와 Browser 동작의 Test 도구 및 범위
- Husky 및 Pre-commit Hook 도입
- 인증 Cookie 이름, 만료, 갱신 주기와 CSRF 정책
- Desktop 외부 영역 디자인
- Input과 Textarea 공통 Component의 세부 규칙
- Clarity Cookie, 동의 모드와 Masking의 개인정보 처리 정책

보류 항목은 기능 개발에 필요해지는 시점에 검토하며, 결정 전에는 임의로 확정하지 않습니다.
