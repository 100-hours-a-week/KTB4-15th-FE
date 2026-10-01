# 인증 도메인

마지막 업데이트: 2026-09-28

## 목적

회원가입, 로그인과 로그아웃을 처리하고, 인증이 필요한 서비스 화면에 유효한 사용자만 접근하도록 합니다.

## 주요 사용자 흐름

### 회원가입

1. 사용자가 `/signup`에서 이메일, 비밀번호와 비밀번호 확인을 입력합니다.
2. 클라이언트 검증을 통과하면 `POST /auth/signup`을 요청합니다.
3. 성공하면 완료 Toast를 표시하고 `/login`으로 이동합니다.
4. 실패하면 서버 오류를 사용자용 메시지로 변환해 Toast로 표시합니다.

회원가입은 계정만 생성합니다. 프로필 입력은 첫 로그인 후 별도 흐름으로 진행합니다.

### 로그인

1. 사용자가 `/login`에서 이메일과 비밀번호를 입력합니다.
2. `POST /auth/login` 응답의 `profileCompleted`를 회원 상태 Query Cache에 저장합니다.
3. 이전 사용자의 피팅 선택 상태를 제거합니다.
4. 프로필을 완료한 사용자는 `/chat`, 완료하지 않은 사용자는 `/profile/setup`으로 이동합니다.

### 로그아웃

1. 마이 페이지에서 `POST /auth/logout`을 요청합니다.
2. 성공하면 피팅 선택과 모든 TanStack Query Cache를 제거합니다.
3. `/login`으로 이동한 뒤 Route를 새로 고칩니다.

### 세션 만료

1. 일반 API 요청이 `401`이면 공통 API Client가 Access Token 갱신을 한 번 시도합니다.
2. 갱신 요청도 `401`이면 `ServiceAccessGuard`가 `/login?reason=session-expired`로 이동시킵니다.
3. 로그인 화면은 세션 만료 Toast를 한 번 표시하고 주소의 Query String을 제거합니다.

상세한 Token 갱신 동작은 [API와 인증](../api-and-auth.md)을 참고합니다.

## 입력 규칙

### 이메일

- 앞뒤 공백을 제거합니다.
- 빈 값과 이메일 형식이 아닌 값을 허용하지 않습니다.
- 최대 길이는 254자입니다.

### 비밀번호

- 회원가입 비밀번호는 8자 이상 20자 이하입니다.
- 대문자, 소문자, 숫자와 특수문자를 각각 하나 이상 포함해야 합니다.
- 출력 가능한 ASCII 문자만 허용합니다.
- 비밀번호 확인 값은 비밀번호와 같아야 합니다.
- 로그인에서는 빈 값만 검사하고 비밀번호 정책을 다시 검증하지 않습니다.

## API

| Method | Path            | 역할                            |
| ------ | --------------- | ------------------------------- |
| `POST` | `/auth/signup`  | 계정 생성                       |
| `POST` | `/auth/login`   | 로그인 및 프로필 완료 여부 확인 |
| `POST` | `/auth/logout`  | 현재 세션 종료                  |
| `POST` | `/auth/refresh` | Access Token 갱신               |

## 오류와 예외 처리

- Form 입력 오류는 해당 필드 아래에 표시합니다.
- 인증 요청 실패는 안정적인 Toast id를 사용해 중복 Toast를 갱신합니다.
- 로그인 실패의 기본 메시지는 이메일 또는 비밀번호를 확인하도록 안내합니다.
- 인증 갱신에 실패한 상태에서는 보호된 화면을 렌더링하지 않습니다.
- 회원 상태 조회 자체가 실패하면 서비스 화면에서 재시도 UI를 제공합니다.

## 관련 코드

- `src/features/auth`: 인증 API, Schema와 Form
- `src/features/auth/ui/service-access-guard.tsx`: 서비스 접근 제어
- `src/shared/api/client.ts`: `401` 처리와 Token 갱신
- `src/app/(public)/login`, `src/app/(public)/signup`: 공개 Route
- `src/app/(service)/layout.tsx`: 보호된 Route의 Guard 적용

## 보류 항목

- 인증 Cookie 이름과 만료 시간
- Access Token 갱신 주기
- CSRF 방어 정책
