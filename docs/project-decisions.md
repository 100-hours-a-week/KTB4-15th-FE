# FE 프로젝트 결정 사항

마지막 업데이트: 2026-11-01

프로젝트 전반에 영향을 주는 기술 선택, 아키텍처, 보안·운영 정책과 보류 항목만 기록합니다. 개별 화면의 동작·UI 수치·구현 방법은 주제별 문서에, 측정 결과와 실험 이력은 `docs/performance/`에 기록합니다.

## 기록 기준

- 여러 기능에 공통으로 적용하거나 변경 시 프로젝트 전반의 검토가 필요한 결정을 기록합니다.
- 개별 기능 변경이나 성능 실험만으로 이 문서를 갱신하지 않습니다.
- 상세 규칙은 해당 문서를 원본으로 관리하고, 여기에서는 선택한 기준과 필요한 근거·링크만 남깁니다.

## 개발 환경과 품질 기준

- TypeScript와 Next.js App Router를 사용합니다. Node.js·pnpm·Next.js·React 버전은 `package.json`, Volta와 `.nvmrc`에서 관리합니다.
- ESLint·Stylelint·Prettier·TypeScript 검사를 `pnpm check`로 실행합니다.
- 함수와 Route Handler는 Node.js 내장 Test Runner, 핵심 사용자 흐름은 Playwright로 검증합니다. 테스트 API는 MSW를 재사용해 실제 서비스와 격리합니다.
- `develop`·`main` 대상 PR에서 Unit·Chromium 브라우저 테스트를 실행합니다. Docker Image 생성 전에는 검사와 프로덕션 빌드가 통과해야 합니다.

상세 기준은 [개발 규칙](./conventions.md)과 [테스트](./testing.md)를 따릅니다.

## 애플리케이션 구조와 상태 관리

- 공개 영역 `(public)`과 인증이 필요한 영역 `(service)`을 구분합니다.
- `/`는 공개 랜딩으로 제공하며 온보딩 완료 쿠키 분기는 제거합니다. 서비스 인증과 프로필 확인은 보호된 경로에서 수행합니다. 화면 구성과 스크롤 연출은 [랜딩 화면](./screens/landing.md)에서 관리합니다.
- Route 전용 코드는 `app`, 비즈니스 기능은 `features`, 여러 기능이 공유하는 코드는 `shared`에 배치합니다.
- 서버 상태는 TanStack Query, 서버 저장 전 여러 화면이 공유하는 임시 상태는 Zustand로 관리합니다.
- 사용자 흐름과 비즈니스 규칙은 [도메인 문서](./domains/README.md)에서 관리합니다.

라우팅·렌더링·상태 관리의 상세 규칙은 [아키텍처](./architecture.md)를 따릅니다.

## API와 인증

- 브라우저 요청은 Ky, 서버 요청은 Next.js `fetch`를 사용합니다. API 응답은 런타임 스키마로 검증하고 사용자에게 원문 서버 오류를 직접 노출하지 않습니다.
- 인증은 HttpOnly Cookie를 사용합니다. 서버 요청은 현재 요청의 Cookie를 전달합니다.
- 로그인은 Spring API를 직접 사용하고, Token 갱신과 로그아웃은 Spring의 `Set-Cookie`를 중계하는 Next Route Handler를 사용합니다.
- `401`은 BFF를 통한 Token 갱신을 한 번 시도하며, 갱신 실패 시 사용자별 클라이언트 상태를 정리하고 로그인으로 이동합니다.
- 채팅·알림 SSE는 인증 갱신과 연결 취소 흐름을 재사용하기 위해 `EventSource` 대신 Ky 응답 Stream을 사용합니다.
- MSW 모킹은 명시적으로 활성화한 개발 환경에서만 사용합니다.
- `(public)/(auth)`의 로그인·회원가입은 인증된 사용자를 프로필 상태에 따라 `/chat` 또는 `/profile/setup`으로 보냅니다.
- `(service)`는 인증과 프로필 완료 여부가 확인된 경우에만 화면을 렌더링합니다.

상세 계약과 복구 흐름은 [API와 인증](./api-and-auth.md)을 따릅니다. 기능별 캐시 정책은 해당 도메인 문서에서 관리합니다.

## 디자인과 접근성

- 기준 디자인은 Figma, 구현 방식은 SCSS Modules와 프로젝트 디자인 토큰입니다.
- 서비스는 모바일 중심의 단일 Column으로 구성합니다.
- 공통 UI는 비즈니스 로직과 API 요청을 직접 소유하지 않습니다.
- 접근성과 `prefers-reduced-motion`을 지원합니다. 다크 모드와 Shadow는 현재 지원하지 않습니다.

화면 폭·Control 크기·타이포그래피·컴포넌트 규칙은 [디자인 시스템](./design-system.md)을 따릅니다.

## 분석과 개인정보

- Microsoft Clarity는 설정값이 있는 Production Build에서만 사용자 행동을 수집합니다.
- Sentry는 Production의 Browser·Node.js·Edge Runtime 오류를 수집합니다.
- Sentry의 사용자 정보, Cookie, Header·Body·Query, Local Variable, 성능 추적과 Session Replay는 수집하지 않습니다.
- Source Map은 운영 Build에서만 업로드하고 인증 Token은 Docker Build Secret으로 전달합니다.
- 전역 렌더링 오류는 복구 UI를 제공하면서 Sentry에 전달합니다.

상세 설정은 [분석과 모니터링](./analytics-and-monitoring.md)을 따릅니다.

## 빌드와 배포

- Docker 배포 결과는 Next.js `standalone` 형식으로 생성합니다.
- `NEXT_PUBLIC_*`는 Browser Bundle에 공개되는 값만 사용하고 Build Argument로 전달합니다.
- 운영 배포는 GitHub Actions에서 ECR Image를 생성한 뒤 AWS SSM을 통해 요청합니다. 문서만 변경된 Commit은 자동 배포하지 않습니다.
- Liveness는 외부 의존성을 조회하지 않는 `GET /health`로 확인합니다.

## 보류 항목

- UI Component 단위 Test 도구 및 범위
- Firefox·WebKit·시각적 회귀 테스트 도입
- Husky 및 Pre-commit Hook 도입
- 인증 Cookie 이름, 만료, 갱신 주기와 CSRF 정책
- Desktop 외부 영역 디자인
- Clarity Cookie, 동의 모드와 Masking의 개인정보 처리 정책

보류 항목은 기능 개발에 필요해지는 시점에 검토하며, 결정 전에는 임의로 확정하지 않습니다.

## 랭킹

- 로그인된 SSR과 5분 Next.js 데이터 캐시를 사용합니다. ECS별 갱신 시점 차이를 허용하며 페이지 전체 ISR은 보류합니다.
- 현행 쿠키 인증과 공통 캐시 키를 유지하기 위해 `unstable_cache`를 사용합니다. `use cache` 전환은 Cache Components와 조회 인증 경계를 함께 검토하는 별도 작업으로 둡니다. 선택 근거와 대안은 [랭킹 캐시 문서](./domains/ranking.md#데이터-캐시)를 참고합니다.
- 표시·이미지·점진 렌더링 규칙은 [랭킹 도메인](./domains/ranking.md), 측정 근거와 실험 이력은 [랭킹 성능 개선 기록](./performance/ranking.md)에서 관리합니다.

## 2026-11-01 피팅 메인 사진 로딩

- 서버 프로필 조회와 Query 초기 데이터로 첫 HTML에 전신 사진 URL을 포함합니다. 사진 변경 후 Query 무효화는 유지합니다.
- AI·BE와 S3 원본을 유지하고, FE의 Next.js 이미지 최적화로 화면 크기에 맞게 축소·WebP 변환합니다. 카드 너비 기준은 320px이며 eager 로딩과 높은 요청 우선순위를 사용합니다.
- 흐린 배경 이미지와 blur 스타일을 제거하고 전신 사진 한 장을 contain으로 표시합니다.
- 개발 S3 버킷의 `/body-images/**`만 허용합니다. hostname 환경변수 분리는 롤백했으며 다른 환경은 정확한 도메인을 별도로 허용해야 합니다.
- 공통 최소 캐시 TTL은 60초로 29cm에도 적용됩니다. 캐시 상한이나 S3 서명 만료 후 접근 차단을 보장하지 않습니다. 최적화 URL 자체에서 별도 사용자 인증을 확인하지 않습니다.
- 단계별 측정값, 검증과 캐시 한계는 [피팅 성능 개선 기록](./performance/fitting.md)에서 관리합니다. 초기 JS 조사는 별도 변경으로 진행합니다.

- `/fitting` 서버 페이지는 필요한 피팅 UI 두 개를 파일 경로로 직접 import합니다. 공통 index를 통해 옷장·진행·결과 화면이 같은 클라이언트 청크 묶음에 포함되는 것을 피하며, 이동 기능과 prefetch는 유지합니다. 빌드 청크 비교는 피팅 성능 기록을 참고합니다.

- 착장 선택 컴포넌트의 프로필 Query와 전신 사진 mutation key도 모델 파일에서 직접 import합니다. 프로필 공통 index를 통해 연결되던 설정·계정·로그인·회원가입 폼이 피팅 클라이언트 JS에서 제외됨을 번들 분석기로 검증했습니다.

- 사진 카드와 파일 선택 동작은 초기 화면에 유지하고, 검증 API 모듈과 처리 모달만 필요할 때 지연 로딩합니다. 저장·오류·이탈 방지 흐름을 유지합니다. import 정리와 합친 최종 LCP 중앙값은 1.538초이며, 개별 변경의 인과 효과는 분리 측정하지 않았습니다.

- 버튼·사진 처리 모달·채팅 이전 메시지 로딩은 공통 `shared/ui/spinner`를 사용합니다. 회전과 모션 감소 처리를 공통화하고 각 사용처가 상태 안내와 배치·색상을 소유합니다.
