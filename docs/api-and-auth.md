# API와 인증

마지막 업데이트: 2026-10-18

이 문서는 백엔드 전체 API 명세가 아니라 프론트엔드의 통신 및 인증 처리 기준을 설명합니다.

## 공통 응답

백엔드 공통 응답은 `code`, `data`, `message`를 갖는 `ApiResponse<T>`로 표현합니다.

- 도메인별 요청 함수와 Schema는 `features/<domain>`에 둡니다.
- 여러 도메인이 공유하는 API 설정과 응답 타입은 `shared/api`에 둡니다.
- 서버의 원문 오류 메시지는 사용자에게 직접 노출하지 않습니다.

## 브라우저 요청

브라우저 요청은 `src/shared/api/client.ts`의 Ky Client를 사용합니다.

- 기준 URL: `NEXT_PUBLIC_API_BASE_URL`
- Cookie 전달: `credentials: "include"`
- Timeout: 10초
- Retry 한도: 1회
- 오프라인, 네트워크 연결 실패와 Timeout은 사용자용 안내 문구로 변환

`NEXT_PUBLIC_` 접두사가 붙은 환경 변수는 브라우저 번들에 포함되므로 비밀 값을 저장하지 않습니다.

TanStack Query mutation은 오프라인 상태에서 대기하지 않고 즉시 실패하도록 `networkMode: "always"`를 사용합니다.

채팅과 알림 SSE는 브라우저의 `EventSource` 대신 Ky 응답 Stream을 읽습니다. 기존 401 Token 갱신과 연결 취소 흐름을 재사용하기 위해서입니다. 장기 연결에는 공통 10초 Timeout과 자동 Retry를 적용하지 않습니다. 알림 SSE는 서비스 영역에서 연결 하나를 유지하며, 연결이 종료되면 3초 뒤 다시 연결합니다.

## 서버 요청

Server Component과 Route Handler에서는 `src/shared/api/server.ts`의 `serverApi`를 사용합니다.

- 기준 URL: 서버 전용 `API_BASE_URL`
- 현재 Next.js 요청의 Cookie를 백엔드 요청의 `Cookie` 헤더로 전달
- 호출부가 `signal`을 제공하지 않으면 10초 Timeout 적용
- 2xx가 아닌 응답은 status를 포함한 오류로 변환
- 공통 Client 수준의 자동 Retry는 적용하지 않음

`API_BASE_URL`이 없으면 초기화 단계에서 오류를 발생시키며, `server-only`로 클라이언트 번들 포함을 방지합니다.

## API 모킹

개발 환경에서 `NEXT_PUBLIC_API_MOCKING=enabled`를 설정하면 MSW가 활성화됩니다.

- 브라우저의 `apiClient` 요청은 Service Worker로 처리합니다. 개발 모킹에서는 최초 API 요청도 MSW 시작 완료를 기다리며, 시작 Promise를 공유해 중복 시작을 방지합니다.
- Node.js 서버의 `serverApi` 요청은 `setupServer`로 처리합니다.
- 두 환경은 `src/mocks/handlers.ts`의 Handler를 공유합니다.
- Handler가 없는 요청은 경고를 출력하고 실제 API로 전달합니다.
- 현재 Profile 조회·등록과 전신 사진 검증 Handler는 선택 입력 연동을 위해 인메모리 상태를 사용하며, 개발 서버를 재시작하면 초기화됩니다.

## 인증 갱신

인증은 HttpOnly Cookie를 기반으로 합니다.

1. 일반 API 요청이 `401`을 반환하면 Next Route Handler인 `/bff/auth/refresh`로 Access Token 갱신을 요청합니다.
2. Route Handler는 현재 요청의 Cookie를 Spring `/auth/refresh`에 전달하고, Spring 응답의 `Set-Cookie`를 브라우저에 전달합니다.
3. SSR 데이터 요청이 `401`이면 `/bff/auth/refresh`로 이동해 Cookie를 갱신한 뒤 원래 경로로 돌아와 SSR을 다시 실행합니다. 갱신 쿠키가 없으면 갱신 요청 없이 로그인으로 이동합니다. 갱신이 거절되거나 두 번째 `401`을 받으면 로그인 화면에서 세션 만료를 안내합니다.
4. 동시에 여러 요청이 실패해도 갱신 요청은 하나만 실행합니다.
5. 갱신이 성공하면 원래 요청을 한 번 다시 시도합니다.
6. 갱신 요청도 `401`이면 세션 만료 상태를 알리고 로그인 화면으로 이동합니다.

로그인, 회원가입, Token 갱신 요청 자체에는 이 갱신 흐름을 재적용하지 않습니다.
로그아웃은 `/bff/auth/logout` Route Handler를 통해 Spring 응답의 Cookie 삭제 명령을 브라우저에 전달합니다.

## 서비스 접근 제어

`(service)` 영역은 `GET /members/me`의 결과와 Token 갱신 결과를 기준으로 접근을 제어합니다.

- 인증되지 않은 사용자는 `/login`으로 이동합니다. 서버에서 리다이렉트할 때는 원래 서비스 경로와 쿼리를 `returnTo`로 전달하고, 프로필이 완료된 회원은 로그인 후 해당 내부 경로로 돌아갑니다.
- 프로필을 완료하지 않은 사용자: `/profile/setup`
- 프로필을 완료한 사용자가 `/profile/setup`에 접근: `/chat`
- 사용자 정보 조회가 짧게 끝나면 로딩 화면을 생략하고, 조회가 이어질 때만 현재 상태를 안내
- 사용자 정보 조회 실패: 현재 화면에서 재시도 UI 제공

## 오류 표시 원칙

- 입력 오류: 해당 입력 필드에 표시
- 일시적인 작업 결과: Toast로 안내
- 화면 전체 조회 실패: Error State로 표시
- 인증 만료: 로그인 화면으로 이동하고 세션 만료 안내
- 존재하지 않는 Route 또는 리소스: `not-found.tsx`로 복구 동선 제공
- 처리되지 않은 서비스 Route 렌더링 오류: `(service)/error.tsx`에서 기록하고 재시도 제공
- Root Layout까지 렌더링할 수 없는 오류: `global-error.tsx`에서 최종 처리

인증 Cookie 이름, 만료 시간, 갱신 주기와 CSRF 정책은 백엔드와 합의 후 이 문서에 반영합니다.

## 전신 사진 제공 비교 실험

인증 이미지 BFF 실험은 철회했습니다. 현재 `/fitting`은 프로필 API가 반환한 S3 presigned URL을 `unoptimized`로 직접 표시하고, 전신 사진의 S3 경로는 Next 이미지 최적화 허용 목록에서 제거했습니다. AI의 WebP 저장은 아직 확인하지 않았으므로 PNG URL이면 원본 PNG를 그대로 다운로드합니다. `/_next/image`는 소유자 인증을 하지 않으며 변환 캐시 만료는 S3 서명 만료와 연동되지 않습니다. 원본 서명 만료 뒤 변환본까지 접근 차단하는 보안 요구를 만족한 것으로 간주하지 않습니다. 기존 변환 캐시 파일을 삭제하거나 운영 배포한 것은 아닙니다. 측정 이력과 보류 사항은 [피팅 성능 기록](./performance/fitting.md)을 참고합니다.

## 자동 재시도

조회(GET·HEAD)는 ky에서 네트워크 오류 및 408·429·500·502·503·504 응답에 최대 2회 재시도합니다(최초 포함 총 3회). 400·403·404와 변경 요청(POST·PUT·PATCH·DELETE)은 일반 자동 재시도를 하지 않습니다. Query·Mutation 자동 재시도는 `Providers`에서 한 번만 꺼 중복 재시도를 방지합니다. 401은 기존 토큰 갱신 후 요청 재전송 흐름을 유지하며, 스트림 연결처럼 개별 요청에서 재시도를 끈 경우는 해당 설정을 따릅니다.

### 긴 작업과 재시도 대기 시간

`timeout`은 한 HTTP 요청의 응답 대기 시간이며 `Retry-After`는 실패한 요청의 다음 시도까지 대기할 시간입니다. 둘은 별개이고 요청별 옵션으로 재정의할 수 있습니다. 현재 채팅 SSE는 `timeout: false`·일반 재시도 없음, 전신 사진 검증은 120초를 사용합니다. 가상 피팅 생성은 기본 HTTP 타임아웃으로 작업을 접수하고, 생성 작업은 별도 상태 조회로 확인합니다. 이번 변경에서 이 대기 시간은 바꾸지 않습니다. 인증 갱신 여부는 일반 재시도 횟수와 분리하며, 갱신 후 재전송에서도 이미 사용한 일반 재시도 예산을 복원하지 않습니다.
