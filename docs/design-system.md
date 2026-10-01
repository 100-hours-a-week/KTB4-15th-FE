# FE 디자인 시스템

마지막 업데이트: 2026-09-28

## 기본 원칙

- 기준 디자인은 Figma에서 관리합니다.
- 스타일은 SCSS Modules를 사용합니다.
- 컴포넌트에서는 원시 색상보다 용도별 시맨틱 토큰을 우선합니다.
- 다크 모드와 Shadow는 현재 지원 범위에 포함하지 않습니다.

## 색상과 타이포그래피

- 브랜드 기본 색상은 `#114b36`이며 10단계 초록 팔레트를 사용합니다.
- UI 중립색은 gray 50부터 900까지 관리하며 white와 black은 별도 토큰입니다.
- 기본 페이지 배경은 `#f8f9fb`, 기본 콘텐츠 표면은 `#ffffff`입니다.
- 원시 팔레트 이름은 `color-색상-단계`, 시맨틱 토큰 이름은 `color-용도-역할-상태` 순서를 따릅니다.
- 기본 서체는 Pretendard이며 `400`, `500`, `600`, `700` 굵기를 사용합니다.
- 타이포그래피는 display, heading-large, heading-medium, heading-small, body-large, body-medium, label, caption Mixin을 사용합니다.
- 화면 너비에 따라 타이포그래피 크기를 변경하지 않습니다.

색상 토큰은 `src/styles/_colors.scss`, 기초 토큰은 `src/styles/_foundations.scss`, 타이포그래피는 `src/styles/_typography.scss`가 원본입니다.

## 간격과 크기

- 공통 간격: `4px`, `8px`, `12px`, `16px`, `24px`, `32px`
- 화면 좌우 여백: `20px`
- Radius: small `8px`, medium `12px`, large `20px`, sheet `24px`, full pill
- Button 높이: small `44px`, medium `48px`, large `52px`
- 기본 아이콘 크기: `16px`, `20px`, `24px`

타이포그래피는 `rem`, Figma와 직접 대응하는 레이아웃·간격·Radius·Control·Icon 크기는 `px`을 사용합니다.

## 공통 UI

### Button

- `ButtonBase`를 `Button`과 `IconButton`이 합성해 사용합니다.
- Button의 너비는 크기와 분리하고 `fullWidth`로 제어합니다.
- Variant는 primary, secondary, outlined, text, danger입니다.
- 연한 브랜드 배경은 secondary, 테두리가 있는 중립 버튼은 outlined로 표현합니다.
- 독립 Toggle은 `role="switch"`와 `aria-checked`로 상태를 표현합니다.

### Header

- `Header`는 공통 높이와 배경을 담당하고 실제 콘텐츠는 `left`, `center`, `right` Slot으로 전달합니다.
- `center`가 있으면 좌우 영역 너비를 동일하게 유지해 가운데 콘텐츠를 화면 중앙에 둡니다.
- `center`가 없으면 좌우 2열로 배치하며, 내용 없이 높이만 필요하면 Slot을 전달하지 않습니다.
- 페이지 이동은 `HeaderIconLink`, 현재 화면의 동작은 `HeaderIconButton`을 사용합니다.
- `HeaderIconButton`은 `52px` 터치 영역 안에서 `24px` 아이콘을 화면의 `20px` 기준선에 맞춥니다.

### Icon

- 아이콘 라이브러리는 도입하지 않고 Figma의 SVG를 기준으로 필요한 아이콘만 추가합니다.
- 색상은 가능한 경우 `currentColor`를 사용합니다.
- `IconButton`의 standard는 투명 배경, outlined는 테두리가 있는 표면으로 표현합니다.

### Overlay와 Toast

- BottomSheet와 Dialog는 Radix Dialog를 기반으로 구현합니다.
- Overlay의 열고 닫는 Lifecycle은 OverlayKit이 관리합니다.
- Dropdown은 Radix DropdownMenu를 사용하며 도메인 상태나 API 요청을 내부에서 처리하지 않습니다.
- Toast Lifecycle은 Sonner가 담당하며 화면에서는 `showToast` 공통 API를 사용합니다.
- Toast는 success와 error를 제공하고 각각 기본 3초와 4초 동안, 최대 3개까지 동시에 노출합니다.
- 같은 작업에서 반복되는 Toast는 안정적인 id를 사용해 기존 Toast를 갱신합니다.
- BottomSheet는 콘텐츠 높이의 `content`와 화면 높이 60%의 `large` 크기를 제공합니다.
- BottomSheet는 배경 클릭, 닫기 버튼과 Escape 키로 닫을 수 있습니다. Drag-to-close와 Snap Point는 지원하지 않습니다.

## 인터랙션과 접근성

- 키보드 사용자를 위한 `focus-visible` 상태를 제공합니다.
- 인터랙션 컴포넌트는 hover, pressed, disabled 상태를 구분합니다.
- 아이콘만 있는 버튼에는 접근 가능한 이름을 제공합니다.
- 장식용 아이콘은 접근성 트리에서 제외합니다.
- 기본 모션 시간은 `120ms`, `200ms`, `300ms`이며 `prefers-reduced-motion`을 지원합니다.
- Loading Spinner의 회전 시간은 `800ms`입니다.
- 주요 하단 Tab 사이를 이동할 때 본문에 짧은 좌우 방향 전환을 적용하고 하단 Navigation은 고정합니다. 같은 Tab의 하위 경로 사이에는 적용하지 않습니다.
- Layer 순서는 sticky 5, dropdown 10, overlay 15, modal 20, toast 25입니다.

## 컴포넌트 추가 기준

1. 한 기능에서만 사용하면 해당 `features` 또는 Route 가까이에 둡니다.
2. 둘 이상의 기능에서 동일한 역할로 재사용될 때 `shared/ui`로 올립니다.
3. 공통 UI는 비즈니스 상태와 API 요청을 직접 소유하지 않고 Props와 Callback으로 전달받습니다.
4. 새 토큰이나 Variant가 필요하면 기존 표현으로 해결할 수 없는지 먼저 확인합니다.
