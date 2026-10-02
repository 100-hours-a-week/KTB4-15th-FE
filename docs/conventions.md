# FE 개발 규칙

마지막 업데이트: 2026-09-28

## 언어와 이름

- 애플리케이션 코드는 TypeScript로 작성하며 JavaScript 소스 파일은 추가하지 않습니다.
- 파일명과 폴더명은 kebab-case를 사용합니다. Next.js 예약 파일명은 프레임워크 규칙을 따릅니다.
- SCSS Module의 클래스 이름은 camelCase를 사용합니다.
- 컴포넌트와 타입은 PascalCase, 함수와 변수는 camelCase를 사용합니다.

## 코드 배치

- Route, Layout, Page와 해당 라우트에서만 쓰는 코드는 `app`에 둡니다.
- 도메인 기능 코드는 `features/<domain>`에 둡니다.
- 둘 이상의 Feature에서 재사용하는 UI와 Utility만 `shared`에 둡니다.
- 공통 UI는 `index.ts`로 외부에 공개하고 사용하는 쪽은 공개 경로에서 가져옵니다.
- 확정되지 않은 추상화나 빈 폴더를 미리 만들지 않습니다.

구체적인 구조는 [아키텍처](./architecture.md)를 참고합니다.

## 스타일

- 컴포넌트 스타일은 같은 폴더의 `*.module.scss`에 둡니다.
- 전역 스타일은 필요한 최소 범위로 제한합니다.
- 간격, 색상, Radius, Motion은 프로젝트 토큰을 우선 사용합니다.
- Tailwind CSS와 다크 모드는 현재 범위에 포함하지 않습니다.

세부 기준은 [디자인 시스템](./design-system.md)을 참고합니다.

## 품질 검사

```bash
pnpm format:check # Prettier 검사
pnpm lint         # ESLint와 Stylelint 검사
pnpm type-check   # Next.js Type 생성과 TypeScript 검사
pnpm test         # Health Route 테스트
pnpm check        # format, lint, type-check 일괄 실행
```

- 모든 변경 후 `pnpm check`를 실행합니다.
- 라우팅, 빌드 설정 또는 의존성을 변경했다면 `pnpm build`도 실행합니다.
- 기존 테스트 대상의 동작을 변경했다면 관련 테스트를 실행합니다.
- 테스트 도구와 범위가 확정되기 전까지 새로운 테스트 설정을 임의로 추가하지 않습니다.

## 문서 변경

- 새로운 기술적 결정을 내리면 관련 코드와 문서를 같은 작업에서 수정합니다.
- 현재 동작을 설명하는 상세 내용은 주제별 문서에 기록합니다.
- 결정의 결과와 보류 항목은 [프로젝트 결정 사항](./project-decisions.md)에 기록합니다.
- 날짜는 `YYYY-MM-DD` 형식으로 작성합니다.
