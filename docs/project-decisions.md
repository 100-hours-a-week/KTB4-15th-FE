# FE 프로젝트 결정 사항

마지막 업데이트: 2026-09-18

## 확정

- Node.js 24를 사용한다. 현재 프로젝트 고정 버전은 `24.21.0`이다.
- Next.js `16.3.5`를 사용한다.
- 애플리케이션 코드는 TypeScript로 작성하며 JavaScript 소스 파일은 허용하지 않는다.
- 파일명과 폴더명은 kebab-case를 사용한다. Next.js 예약 파일명은 프레임워크 규칙을 따른다.
- 패키지 관리자는 pnpm을 사용한다.
- 코드 검사는 ESLint, 코드 포맷은 Prettier, SCSS 검사는 Stylelint가 담당한다.
- App Router의 최상위 라우트 그룹은 `(public)`과 `(service)`로 구분한다.
- `/`는 `/login`으로 이동하고, 로그인 완료 후 진입 화면은 `/chat`으로 한다.
- 스타일은 SCSS Modules를 사용한다.
- 다크 모드는 현재 범위에서 지원하지 않는다.
- 기준 디자인은 Figma에서 관리한다.
- 브랜드 기본 색상은 `#114b36`이며, 이를 기준으로 10단계 초록 팔레트를 사용한다.
- 중립색은 white와 black을 별도로 두고, UI에 사용하는 gray를 50부터 900까지 10단계로 관리한다.
- 색상은 원시 팔레트와 용도별 시맨틱 토큰으로 구분한다. 컴포넌트에서는 시맨틱 토큰을 사용한다.
- 색상 토큰 이름은 원시 팔레트의 경우 `color-색상-단계`, 시맨틱 토큰의 경우 `color-용도-역할-상태` 순서를 따른다.
- 기본 페이지 배경은 `#f2f4f6`, 기본 콘텐츠 표면은 `#ffffff`을 사용한다.
- 인터랙션 색상은 primary, secondary, neutral, danger 유형별로 default, hover, pressed 상태를 구분하고 disabled 상태는 공통으로 사용한다.
- 기본 서체는 Pretendard이며 `400`, `500`, `600`, `700` 네 가지 굵기만 사용한다.
- 타이포그래피는 SCSS mixin으로 묶은 display, heading-large, heading-medium, heading-small, body-large, body-medium, label, caption을 사용한다.
- 화면 너비에 따라 타이포그래피 크기를 변경하지 않는다.
- 서비스 본체는 최대 `480px` 단일 컬럼으로 유지하고, 넓은 화면에서는 중앙에 배치해 바깥 배경과 구분한다.
- 공통 간격은 4px, 8px, 12px, 16px, 24px, 32px의 6단계 spacing 토큰을 사용하고 화면 좌우 기본 여백은 20px로 별도 관리한다.
- radius는 small 8px, medium 12px, large 20px, sheet 24px, full pill로 구분한다.
- 버튼은 기본 44px, large 52px 이상의 높이를 보장한다.
- z-index는 sticky 5, dropdown 10, overlay 15, modal 20, toast 25 단계로 관리한다.
- 인터랙션 모션은 120ms, 200ms, 300ms 세 단계와 공통 easing을 사용하며 reduced motion 설정을 지원한다.
- shadow는 현재 사용하지 않는다.
- 아이콘 라이브러리는 현재 도입하지 않고 Figma의 SVG를 기준으로 필요한 아이콘만 추가한다.
- 아이콘은 16px, 20px, 24px 크기를 기본으로 하며 색상은 가능한 경우 `currentColor`를 사용한다.
- 장식용 아이콘은 접근성 트리에서 제외하고, 아이콘만 있는 버튼에는 접근 가능한 이름을 제공한다.
- 웹 접근성을 위해 키보드 `focus-visible` 상태를 제공하고, 인터랙션 컴포넌트는 `hover`, `active`, `disabled` 상태를 구분한다.
- 인증은 BE와 HttpOnly Cookie 방식으로 협의한다.
- Docker 배포를 위해 Next.js 빌드 결과를 `standalone` 형식으로 생성한다.

## 보류

- 테스트 도구와 테스트 범위
- Husky 및 pre-commit hook 도입
- 타이포그래피 토큰의 실제 화면 적용 후 세부 조정
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
