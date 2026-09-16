<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# LOOK DDAK FE 작업 규칙

## 기준 문서

- 작업 전에 `README.md`와 `docs/project-decisions.md`를 확인한다.
- 확정되지 않은 기술이나 정책을 임의로 도입하지 않는다.
- 새로운 결정을 내리면 코드와 `docs/project-decisions.md`를 함께 갱신한다.

## 프로젝트 규칙

- Node.js `24.21.0`, pnpm `10.12.1`, Next.js `16.3.5`를 기준으로 한다.
- 패키지 설치와 스크립트 실행에는 pnpm을 사용한다.
- App Router의 최상위 영역은 `(public)`과 `(service)`로 구분한다.
- 컴포넌트 스타일은 `*.module.scss`를 사용하고 클래스 이름은 camelCase로 작성한다.
- Tailwind CSS와 다크 모드는 현재 범위에 포함하지 않는다.
- 공통 스타일 구조와 디자인 토큰은 확정 전까지 임의로 만들지 않는다.
- 인증 구현은 BE와 HttpOnly Cookie 세부 정책이 합의된 뒤 진행한다.

## 완료 조건

- 변경 후 `pnpm check`를 실행한다.
- 라우팅, 빌드 설정 또는 의존성을 변경했다면 `pnpm build`도 실행한다.
- 테스트 도구가 확정되기 전까지 테스트 설정을 임의로 추가하지 않는다.
