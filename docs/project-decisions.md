# FE 프로젝트 결정 사항

마지막 업데이트: 2026-09-23

## 개발 환경

### 런타임 및 프레임워크

- Node.js 24를 사용한다. 현재 프로젝트 고정 버전은 `24.21.0`이다.
- Next.js `16.3.5`를 사용한다.
- 패키지 관리자는 pnpm을 사용하며 현재 고정 버전은 `10.12.1`이다.

### 언어 및 코드 품질

- 애플리케이션 코드는 TypeScript로 작성하며 JavaScript 소스 파일은 허용하지 않는다.
- 파일명과 폴더명은 kebab-case를 사용한다. Next.js 예약 파일명은 프레임워크 규칙을 따른다.
- 코드 검사는 ESLint, 코드 포맷은 Prettier, SCSS 검사는 Stylelint가 담당한다.

## 애플리케이션 구조

### 라우팅

- App Router의 최상위 라우트 그룹은 `(public)`과 `(service)`로 구분한다.
- `/`는 `/login`으로 이동하고, 로그인 완료 후 진입 화면은 `/chat`으로 한다.
- 회원가입 직후 기본 정보 입력 화면은 `/profile/setup`을 사용한다.
- 인증이 필요한 화면은 `(service)`에 배치한다. 주요 탭 화면은 하단 내비게이션을 제공하는 `(main)`에, 기본 정보 입력처럼 독립된 흐름은 `(standalone)`에 배치한다.
- 같은 헤더가 여러 하위 경로에서 유지되면 가장 가까운 공통 `layout.tsx`에 배치하고, 한 화면에만 적용되면 `page.tsx`에서 선언한다.

### 폴더 구조

- 폴더는 실제 코드가 필요해지는 시점에 생성한다.
- 빈 폴더를 유지하기 위한 `.gitkeep`은 추가하지 않는다.
- `app`에는 Route, Layout, Page와 해당 라우트에서만 사용하는 코드를 배치한다.
- `features`에는 비즈니스 기능별 UI, API 타입, Fixture를 배치한다.
- `shared/ui`에는 둘 이상의 Feature에서 동일하게 사용하는 공통 UI를 배치한다.
- `shared/utils`에는 특정 비즈니스 기능에 종속되지 않는 Utility를 배치한다.
- 공통 UI는 컴포넌트별 폴더에 스타일과 함께 배치하고 `index.ts`를 통해 공개한다.

```text
src/
├── app/           # Route, Layout, Page와 Route 전용 코드
├── features/      # 비즈니스 기능별 UI, API 타입, Fixture
├── shared/
│   ├── api/        # 공통 API 응답 타입과 요청 설정
│   ├── ui/         # 비즈니스 도메인에 종속되지 않는 공통 UI
│   └── utils/      # 범용 Utility
└── styles/         # 전역 Style, Design Token과 Mixin
```

## API 통신

### 공통 응답

- BE의 공통 응답은 `code`, `data`, `message`를 갖는 `ApiResponse<T>`로 표현한다.
- 도메인별 요청·응답 타입은 `features/<domain>/api`에, 여러 도메인이 공유하는 API 설정과 응답 타입은 `shared/api`에 배치한다.

### 브라우저 요청

- 브라우저 API Client는 Ky를 사용하고 기준 URL은 `NEXT_PUBLIC_API_BASE_URL`로 설정한다.
- 브라우저의 서버 상태와 mutation은 TanStack Query로 관리한다.
- HttpOnly Cookie 기반 인증을 위해 `credentials: 'include'`를 적용한다.
- timeout은 10초, retry 한도는 2회로 설정한다.
- `NEXT_PUBLIC_` 접두사가 붙은 환경 변수는 브라우저에 공개되므로 비밀 값을 저장하지 않는다.

### 서버 요청

- 서버 전용 API Client는 Next.js의 `fetch`를 사용하며 `server-only`로 클라이언트 번들 포함을 방지한다.
- 기준 URL은 서버 전용 `API_BASE_URL`로 설정하고, 환경 변수가 없으면 초기화 단계에서 오류를 발생시킨다.
- Next.js `cookies()`로 읽은 현재 요청의 Cookie를 `Cookie` 헤더로 BE에 전달한다.
- 호출부가 `signal`을 제공하지 않으면 10초 timeout을 적용하고, 제공하면 해당 `signal`을 우선한다.
- 2xx가 아닌 응답은 status를 포함한 오류로 변환하여 호출부에 전파하며, 서버 공통 로직에서는 자동 retry를 적용하지 않는다.

## 디자인 시스템

### 기본 원칙

- 기준 디자인은 Figma에서 관리한다.
- 스타일은 SCSS Modules를 사용한다.
- 다크 모드는 현재 범위에서 지원하지 않는다.
- shadow는 현재 사용하지 않는다.

### 색상

- 브랜드 기본 색상은 `#114b36`이며, 이를 기준으로 10단계 초록 팔레트를 사용한다.
- 중립색은 white와 black을 별도로 두고, UI에 사용하는 gray를 50부터 900까지 10단계로 관리한다.
- 기본 페이지 배경은 `#f2f4f6`, 기본 콘텐츠 표면은 `#ffffff`을 사용한다.
- 색상은 원시 팔레트와 용도별 시맨틱 토큰으로 구분한다. 컴포넌트에서는 시맨틱 토큰을 사용한다.
- 원시 팔레트 이름은 `color-색상-단계`, 시맨틱 토큰 이름은 `color-용도-역할-상태` 순서를 따른다.

### 타이포그래피

- 기본 서체는 Pretendard이며 `400`, `500`, `600`, `700` 네 가지 굵기만 사용한다.
- 타이포그래피는 display, heading-large, heading-medium, heading-small, body-large, body-medium, label, caption SCSS mixin을 사용한다.
- 화면 너비에 따라 타이포그래피 크기를 변경하지 않는다.

### 레이아웃 및 간격

- 타이포그래피는 rem, Figma와 직접 대응하는 레이아웃·간격·radius·컨트롤·아이콘 크기는 px 단위를 사용한다.
- 서비스 본체는 최대 `480px` 단일 컬럼으로 유지한다.
- 넓은 화면에서는 서비스 본체를 중앙에 배치하며 외부 영역의 디자인은 추후 결정한다.
- 모든 페이지의 기본 콘텐츠 좌우 여백은 root layout의 `pageContent`에서 `20px`로 공통 적용한다.
- 페이지에서는 기본 좌우 여백을 중복 적용하지 않고, 필요한 세로 여백과 내부 컴포넌트 간격만 관리한다.
- 공통 간격은 4px, 8px, 12px, 16px, 24px, 32px의 6단계 spacing 토큰을 사용한다.
- 화면 좌우 기본 여백은 20px로 별도 관리한다.
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

### 헤더

- `Header`는 공통 높이와 배경만 담당한다.
- `left`, `center`, `right` 슬롯은 모두 선택 사항이며 텍스트, 제목, 버튼 등 실제 콘텐츠는 사용하는 쪽에서 전달한다.
- `center`가 있으면 좌·중·우 3열로 배치하고, 좌우 영역의 너비를 동일하게 유지해 가운데 콘텐츠가 화면 중앙에 위치하도록 한다.
- `center`가 없으면 좌·우 2열로 배치한다.
- 내용 없이 헤더 높이만 필요하면 슬롯을 전달하지 않은 `Header`를 렌더링한다.
- 헤더 아이콘 액션은 일반 `IconButton`을 합성한 `HeaderIconButton`을 사용한다.
- `HeaderIconButton`은 52px 터치 영역을 유지하면서 24px 아이콘이 화면의 20px 기준선에 정렬되도록 한다.
- 헤더에서 페이지 이동을 나타내는 아이콘은 `HeaderIconLink`, 현재 화면에서 동작을 실행하는 아이콘은 `HeaderIconButton`을 사용한다.

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
- 공통 BottomSheet는 Radix Dialog를 기반으로 구현하며 Portal은 Radix의 기본 동작을 사용한다. Backdrop과 Content는 CSS로 App Shell 최대 너비에 맞춘다.
- BottomSheet, Modal, AlertDialog의 open/close lifecycle은 OverlayKit으로 관리하고 각 UI 컴포넌트의 접근성과 Portal은 Radix가 담당한다.
- Dropdown은 Radix DropdownMenu를 기반으로 구현하며 open/close, 키보드 탐색, focus와 위치 계산은 Radix가 담당한다. Dropdown 내부에서는 API 요청이나 도메인 상태를 처리하지 않고 선택 콜백만 상위에 전달한다.
- Toast는 노출 시간과 큐 정책이 별도로 필요하므로 OverlayKit 관리 범위에 포함하지 않는다.
- Toast의 lifecycle, stacking, dismiss, id 갱신은 Sonner가 담당한다. Sonner의 기본 UI는 사용하지 않고 프로젝트의 `ToastContent`로 렌더링한다.
- 화면에서는 Sonner를 직접 호출하지 않고 `showToast` 공통 API를 사용한다.
- Toast는 success와 error 타입 및 닫기 버튼을 제공하며 기본 노출 시간은 각각 3초와 4초, 최대 동시 노출 개수는 3개로 한다.
- 같은 작업에서 반복되는 Toast는 안정적인 id로 기존 Toast를 갱신한다.
- 일시적인 작업 결과는 Toast로 안내하고, 입력 오류는 해당 필드에, 화면 전체 조회 오류는 Error State로 표시한다. 서버의 raw error message는 사용자에게 직접 노출하지 않는다.
- BottomSheet는 콘텐츠 높이에 맞추는 `content`와 화면 높이의 60%를 사용하는 `large` 크기를 제공한다.
- BottomSheet는 배경 클릭, 닫기 버튼, Escape 키로 닫을 수 있으며 drag-to-close와 snap point는 현재 지원하지 않는다.

## 인증

- 인증은 BE와 HttpOnly Cookie 방식으로 협의한다.

## 빌드 및 배포

- Docker 배포를 위해 Next.js 빌드 결과를 `standalone` 형식으로 생성한다.

## 보류 항목

- 테스트 도구와 테스트 범위
- Husky 및 pre-commit hook 도입
- 타이포그래피 토큰의 실제 화면 적용 후 세부 조정
- 인증 쿠키의 이름, 만료, 갱신, CSRF 정책
- 데스크톱 외부 영역 디자인
- Input과 Textarea 공통 컴포넌트의 세부 규칙

보류 항목은 기능 개발에 필요해지는 시점에 검토하며, 결정 전에는 임의로 확정하지 않는다.
