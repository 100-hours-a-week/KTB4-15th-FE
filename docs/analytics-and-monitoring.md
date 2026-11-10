# FE 분석과 모니터링

마지막 업데이트: 2026-09-28

## Microsoft Clarity

Microsoft Clarity는 배포된 서비스의 사용자 행동을 세션 녹화와 히트맵으로 분석하는 데 사용합니다.

- Microsoft가 제공하는 추적 코드를 Next.js `Script`로 로드합니다.
- `NEXT_PUBLIC_CLARITY_PROJECT_ID`가 설정된 프로덕션 빌드에서만 초기화합니다.
- 로컬 개발과 프로젝트 ID가 없는 빌드에서는 데이터를 수집하지 않습니다.
- 프로젝트 ID는 공개 가능한 식별자이며 GitHub `production` Environment Variable로 관리합니다.
- 사용자 식별 정보와 Custom Event는 수집 목적과 정책이 정해지기 전에는 추가하지 않습니다.

배포 전 GitHub 저장소의 `production` Environment에 다음 변수를 등록합니다.

```text
NEXT_PUBLIC_CLARITY_PROJECT_ID=<Clarity project ID>
```

배포 후 브라우저 Network 탭의 `clarity.ms` 요청과 Clarity 대시보드의 실시간 세션으로 연동을 확인합니다.

Clarity의 쿠키, 동의 모드와 마스킹 설정은 실제 수집 전에 서비스의 개인정보 처리 정책에 맞게 검토합니다.

채팅방 초기 로딩의 운영 검증은 배포 이후 구간의 실제 방문을 사용합니다. Clarity가 연결된 경우 [Performance 위젯의 URL Performance](https://learn.microsoft.com/en-us/clarity/insights/performance-widget)에서 채팅방 상세 페이지를 확인하고 [기기 필터](https://learn.microsoft.com/en-us/clarity/filters/clarity-filters)로 모바일과 데스크톱을 나눕니다. 방 번호별 p75만 제공되는 경우 그 값들을 평균해 상세 경로 전체의 p75로 해석하지 않습니다. 해당 경로군의 방문 단위 집계가 있어야 전체를 판정할 수 있습니다. 배포 버전, 기간, 기기, 각 지표의 표본 수와 p75를 기록합니다. 검증 기록에는 방 번호, 계정 정보, 세션 녹화 링크를 포함하지 않습니다.

## Sentry

Sentry는 배포된 Next.js 애플리케이션의 브라우저, Node.js 서버와 Edge Runtime 오류를 수집하는 데 사용합니다.

- 공식 `@sentry/nextjs` SDK를 사용합니다.
- `NEXT_PUBLIC_SENTRY_DSN`이 설정된 프로덕션 빌드에서만 오류를 전송합니다.
- 사용자 정보, 쿠키, HTTP 헤더·본문·URL 쿼리, 로컬 변수 등 자동 데이터 수집을 비활성화합니다.
- 성능 추적과 Session Replay는 활성화하지 않습니다.
- Turbopack 일반 빌드에서도 사용하지 않는 tracing 코드를 제거하도록 `next.config.ts`의 `compiler.define`에 `__SENTRY_TRACING__: false`를 지정합니다. 성능 추적 도입 시 이 정의도 재검토합니다. 로컬 Chrome Performance 기록과는 별개입니다.
- App Router의 전역 렌더링 오류와 서버 요청 오류를 함께 수집합니다.
- 소스맵 업로드는 운영 빌드에서만 수행하며 인증 토큰은 Docker BuildKit secret으로 전달합니다.

GitHub 저장소의 `production` Environment에 다음 값을 등록합니다.

| 분류     | 이름                     | 확인 위치                                                           |
| -------- | ------------------------ | ------------------------------------------------------------------- |
| Variable | `NEXT_PUBLIC_SENTRY_DSN` | Sentry Project Settings → Client Keys (DSN)                         |
| Variable | `SENTRY_ORG`             | Sentry Organization Settings → General Settings의 Organization Slug |
| Variable | `SENTRY_PROJECT`         | Sentry Project Settings → General Settings의 Project Slug           |
| Secret   | `SENTRY_AUTH_TOKEN`      | Sentry Organization Settings → Auth → Auth Tokens                   |

DSN은 이벤트 전송 대상을 식별하는 공개 설정값입니다. `SENTRY_AUTH_TOKEN`은 소스맵 업로드를 위한 `org:ci` 권한의 Organization Token을 사용하며, 코드, 로그 또는 Docker 이미지에 포함하지 않습니다.

배포 후 테스트 오류가 Sentry Issues에 생성되는지 확인하고, 스택 트레이스가 원본 TypeScript 파일과 줄 번호를 가리키는지 확인합니다.
