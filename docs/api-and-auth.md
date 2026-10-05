# API와 인증

마지막 업데이트: 2026-10-05

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
- 오프라인 상태: 요청 전에 확인하여 `OfflineError`로 변환

`NEXT_PUBLIC_` 접두사가 붙은 환경 변수는 브라우저 번들에 포함되므로 비밀 값을 저장하지 않습니다.

TanStack Query mutation은 오프라인 상태에서 대기하지 않고 즉시 실패하도록 `networkMode: "always"`를 사용합니다.

## 서버 요청

Server Component과 Route Handler에서는 `src/shared/api/server.ts`의 `serverApi`를 사용합니다.

- 기준 URL: 서버 전용 `API_BASE_URL`
- 현재 Next.js 요청의 Cookie를 백엔드 요청의 `Cookie` 헤더로 전달
- 호출부가 `signal`을 제공하지 않으면 10초 Timeout 적용
- 2xx가 아닌 응답은 status를 포함한 오류로 변환
- 공통 Client 수준의 자동 Retry는 적용하지 않음

`API_BASE_URL`이 없으면 초기화 단계에서 오류를 발생시키며, `server-only`로 클라이언트 번들 포함을 방지합니다.

## 인증 갱신

인증은 HttpOnly Cookie를 기반으로 합니다.

1. 일반 API 요청이 `401`을 반환하면 `/auth/refresh`로 Access Token 갱신을 요청합니다.
2. 동시에 여러 요청이 실패해도 갱신 요청은 하나만 실행합니다.
3. 갱신이 성공하면 원래 요청을 한 번 다시 시도합니다.
4. 갱신 요청도 `401`이면 세션 만료 상태를 알리고 로그인 화면으로 이동합니다.

로그인, 회원가입, Token 갱신 요청 자체에는 이 갱신 흐름을 재적용하지 않습니다.

## 서비스 접근 제어

`(service)` 영역은 `GET /members/me`의 결과와 Token 갱신 결과를 기준으로 접근을 제어합니다.

- 인증되지 않은 사용자: `/login?reason=session-expired`
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
