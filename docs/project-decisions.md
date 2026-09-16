# FE 프로젝트 결정 사항

마지막 업데이트: 2026-09-16

## 확정

- Node.js 24를 사용한다. 현재 프로젝트 고정 버전은 `24.21.0`이다.
- Next.js `16.3.5`를 사용한다.
- 애플리케이션 코드는 TypeScript로 작성하며 JavaScript 소스 파일은 허용하지 않는다.
- 패키지 관리자는 pnpm을 사용한다.
- 코드 검사는 ESLint, 코드 포맷은 Prettier, SCSS 검사는 Stylelint가 담당한다.
- App Router의 최상위 라우트 그룹은 `(public)`과 `(service)`로 구분한다.
- `/`는 `/login`으로 이동하고, 로그인 완료 후 진입 화면은 `/chat`으로 한다.
- 스타일은 SCSS Modules를 사용한다.
- 다크 모드는 현재 범위에서 지원하지 않는다.
- 기준 디자인은 Figma에서 관리한다.
- 디자인 확정 전에는 검정, 회색, 흰색의 중립적인 임시 색상만 사용한다.
- 인증은 BE와 HttpOnly Cookie 방식으로 협의한다.
- Docker 배포를 위해 Next.js 빌드 결과를 `standalone` 형식으로 생성한다.

## 보류

- 테스트 도구와 테스트 범위
- Husky 및 pre-commit hook 도입
- 메인 및 보조 색상
- 폰트 종류와 굵기
- 디자인 토큰
- `styles/base/_font.scss`를 포함한 공통 SCSS 세부 구조
- 인증 쿠키의 이름, 만료, 갱신, CSRF 정책

보류 항목은 기능 개발에 필요해지는 시점에 검토하며, 결정 전에는 임의로 확정하지 않는다.

## 예정 폴더 구조

폴더는 실제 코드가 필요해지는 시점에 생성한다. 빈 폴더를 유지하기 위한 `.gitkeep`은 추가하지 않는다.

```text
src/
├── app/
│   ├── (public)/
│   └── (service)/
├── features/
├── components/
├── lib/
├── config/
└── styles/
```

`components`에는 둘 이상의 Feature에서 동일하게 사용하는 UI만 배치한다.
