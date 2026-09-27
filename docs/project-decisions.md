# FE 프로젝트 결정 사항

마지막 업데이트: 2026-09-28

이 문서는 프로젝트의 핵심 결정과 아직 확정되지 않은 항목을 관리합니다. 현재 구현의 상세한 설명은 [FE 문서 목록](./README.md)에서 확인합니다.

## 확정된 결정

### 개발 환경

- Node.js, pnpm, Next.js와 React 버전은 `package.json`, Volta와 `.nvmrc`에 고정합니다.
- 애플리케이션은 TypeScript와 Next.js App Router를 사용합니다.
- 코드 검사는 ESLint, 스타일 검사는 Stylelint, 포맷은 Prettier가 담당합니다.

### 애플리케이션 구조

- 최상위 Route Group은 `(public)`과 `(service)`로 구분합니다.
- 비즈니스 기능은 `features`, 둘 이상의 기능이 공유하는 코드는 `shared`에 배치합니다.
- 서버 상태는 TanStack Query, 서버 저장 전 공유되는 임시 상태는 Zustand로 관리합니다.
- 사용자 흐름과 비즈니스 규칙은 주제별 [도메인 문서](./domains/README.md)에서 관리합니다.

자세한 내용은 [아키텍처](./architecture.md)를 참고합니다.

### API와 인증

- 브라우저 요청은 Ky, 서버 요청은 Next.js `fetch`를 사용합니다.
- 인증은 HttpOnly Cookie 방식이며, `401` 응답 시 Access Token 갱신을 한 번 시도합니다.
- 서비스 접근 여부는 `GET /members/me`의 프로필 완료 상태와 인증 갱신 결과를 기준으로 판단합니다.
- 서버의 원문 오류 메시지는 사용자에게 직접 노출하지 않습니다.

자세한 내용은 [API와 인증](./api-and-auth.md)을 참고합니다.

### 디자인 시스템

- 스타일은 SCSS Modules와 프로젝트 토큰을 사용합니다.
- 공통 UI는 비즈니스 로직과 분리하고 `shared/ui`에서 관리합니다.
- 접근성과 `prefers-reduced-motion`을 지원합니다.
- 다크 모드와 Shadow는 현재 지원하지 않습니다.

자세한 내용은 [디자인 시스템](./design-system.md)을 참고합니다.

### 빌드와 배포

- Docker 배포를 위해 Next.js 빌드 결과를 `standalone` 형식으로 생성합니다.
- Liveness 확인은 외부 의존성을 조회하지 않는 `GET /health`를 사용합니다.
- 정상 응답은 HTTP 200과 `{ "status": "UP" }`입니다.

## 보류 항목

- UI 컴포넌트와 브라우저 동작을 위한 테스트 도구 및 테스트 범위
- Husky 및 pre-commit Hook 도입
- 타이포그래피 토큰의 실제 화면 적용 후 세부 조정
- 인증 Cookie 이름, 만료, 갱신 주기와 CSRF 정책
- 데스크톱 외부 영역 디자인
- Input과 Textarea 공통 컴포넌트의 세부 규칙

보류 항목은 기능 개발에 필요해지는 시점에 검토하며, 결정 전에는 임의로 확정하지 않습니다.
