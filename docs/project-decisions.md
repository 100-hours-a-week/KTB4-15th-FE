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

### 폴더 구조

- 폴더는 실제 코드가 필요해지는 시점에 생성한다.
- 빈 폴더를 유지하기 위한 `.gitkeep`은 추가하지 않는다.
- 애플리케이션 코드는 `app`, `features`, `shared` 세 영역을 기본 축으로 구성한다.
- `features`에는 특정 비즈니스 기능에 종속된 API, 상태와 UI를 함께 배치한다.
- `shared`에는 특정 비즈니스 기능에 종속되지 않고 여러 기능에서 재사용하는 코드만 배치한다.
- 공통 API Client와 API 기반 코드는 `shared/api`, 실제 기능별 API 요청은 해당 `features/*/api`에서 관리한다.
- 특정 기능에 종속된 React Hook은 필요할 때 해당 `features/*/hooks`에서 관리한다.
- 여러 기능에서 재사용하는 React Hook은 `shared/hooks`에서 관리한다.
- 외부 라이브러리 설정과 순수 Utility는 `shared/lib`, 환경변수·Route·전역 상수는 `shared/config`에서 관리한다.
- 기능 전용 Schema는 해당 `features/*/model`, 공통 API Schema는 `shared/api`, 여러 기능에서 재사용하는 검증 도구는 `shared/lib`에서 관리한다.
- 정적 이미지와 SVG 원본은 `public/images`, `public/icons`에서 관리하고 고정 URL로 참조한다.
- React 컴포넌트로 구현한 공통 아이콘은 `shared/ui/icon`에서 관리한다.

```text
src/
├── app/                    # Route, Layout, Page와 Route 전용 코드
├── features/               # 비즈니스 기능별 코드
│   └── feature-name/
│       ├── api/            # 해당 기능의 API 요청
│       ├── hooks/          # 해당 기능에 종속된 React Hook
│       ├── model/          # 상태, 타입, Schema와 비즈니스 로직
│       └── ui/             # 해당 기능에 종속된 UI
├── shared/                 # 비즈니스 기능에 종속되지 않는 공통 코드
│   ├── api/                # 공통 HTTP Client, Error와 API 기반 Type
│   ├── ui/                 # 공통 UI와 React 아이콘 컴포넌트
│   ├── hooks/              # 여러 기능에서 재사용하는 React Hook
│   ├── lib/                # 외부 라이브러리 설정과 순수 Utility
│   ├── config/             # 환경변수, Route와 전역 상수
│   └── styles/             # Design Token과 Mixin
└── testing/                # Test 설정, Fixture와 Mock

public/
├── icons/                  # 고정 URL로 제공하는 SVG 원본
└── images/                 # 고정 URL로 제공하는 정적 이미지

e2e/                        # End-to-End Test
```

## 디자인 시스템

### 기본 원칙

- 기준 디자인은 Figma에서 관리한다.
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

### 버튼

- 버튼은 small 44px, medium 48px, large 52px 높이를 사용한다.
- 버튼 너비는 size와 분리하고 `fullWidth` 속성으로 제어한다.
- 버튼 계열은 `shared/ui/button`에서 관리한다.
- 저수준 ButtonBase를 Button과 IconButton이 합성해 사용한다.
- Button variant는 primary, secondary, outlined, text, danger로 구분한다.
- 연한 브랜드 배경의 tonal 버튼은 별도 variant를 추가하지 않고 secondary로 표현한다.
- 테두리가 있는 중립 버튼은 outlined로 표현한다.
- 독립 Toggle은 ButtonBase를 사용하지 않고 `role="switch"`와 `aria-checked`로 상태를 표현한다.

### 아이콘

- 아이콘 라이브러리는 현재 도입하지 않고 Figma의 SVG를 기준으로 필요한 아이콘만 추가한다.
- 아이콘은 16px, 20px, 24px 크기를 기본으로 한다.
- 아이콘 색상은 가능한 경우 `currentColor`를 사용한다.
- 장식용 아이콘은 접근성 트리에서 제외한다.
- 아이콘만 있는 버튼에는 접근 가능한 이름을 필수로 제공한다.
- IconButton의 standard는 투명 배경, outlined는 테두리가 있는 표면으로 표현한다.

### 인터랙션 및 접근성

- 키보드 사용자를 위해 `focus-visible` 상태를 제공한다.
- 인터랙션 컴포넌트는 hover, pressed, disabled 상태를 구분한다.
- 기본 모션 시간은 120ms, 200ms, 300ms 세 단계와 공통 easing을 사용한다.
- 로딩 spinner의 회전 시간은 800ms를 사용한다.
- `prefers-reduced-motion` 설정을 지원한다.
- z-index는 sticky 5, dropdown 10, overlay 15, modal 20, toast 25 단계로 관리한다.

## 테스트

- 단위 테스트와 컴포넌트 테스트 파일은 테스트 대상 코드 가까이에 함께 배치한다.
- 테스트 파일명은 대상 파일명을 기준으로 `*.test.ts` 또는 `*.test.tsx`를 사용한다.
- `src/testing`에는 여러 테스트가 공유하는 설정, Fixture, Mock과 테스트 Utility만 배치한다.
- 사용자 흐름을 검증하는 E2E 테스트는 프로젝트 루트의 `e2e`에서 관리한다.
- 테스트 도구와 구체적인 테스트 범위는 도입 시점에 확정한다.
- 테스트 도구가 확정되기 전에는 빈 테스트 폴더와 설정 파일을 만들지 않는다.

## 인증

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
