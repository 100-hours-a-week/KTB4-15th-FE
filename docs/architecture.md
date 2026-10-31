# FE 아키텍처

마지막 업데이트: 2026-10-21

## 기술 구성

- Next.js App Router와 TypeScript를 사용합니다.
- 화면 스타일은 SCSS Modules로 작성합니다.
- API에서 가져온 서버 상태는 TanStack Query로 관리합니다.
- 서버에 저장하기 전 여러 화면에서 공유해야 하는 임시 상태는 Zustand로 관리합니다.

정확한 런타임 및 패키지 버전은 루트 [README](../README.md)와 `package.json`을 기준으로 합니다.

## 라우팅

App Router의 최상위 라우트 그룹은 `(public)`과 `(service)`로 구분합니다.

```text
src/app/
├── (public)/                  # 온보딩과 인증 화면
│   └── (auth)/               # 로그인 사용자를 서비스로 돌려보내는 인증 화면
├── (service)/                # 인증 및 프로필 확인이 필요한 화면
│   ├── chat/                  # 채팅 도메인 화면
│   ├── fitting/               # 피팅 도메인 화면
│   ├── mypage/                # 마이 페이지
│   └── profile/               # 프로필 도메인 화면
└── health/                    # 외부 의존성이 없는 상태 확인 Route
```

- `/`는 온보딩 완료 쿠키가 없으면 `/onboarding`, 있으면 `/login`으로 이동합니다. `/onboarding`은 첫 방문자에게 3단계 소개를 보여주며, 완료하거나 건너뛰면 쿠키를 저장하고 `/login`으로 이동합니다.
- 로그인 완료 후 기본 진입 화면은 `/chat`입니다.
- 회원가입 직후 기본 정보 입력 화면은 `/profile/setup`입니다.
- `/onboarding`은 정적으로 생성하며, 슬라이드 전환은 Client Component에서 처리합니다. 완료 쿠키가 `true`인 요청은 Proxy에서 `/login`으로 보냅니다.
- `/onboarding`은 회원 상태를 조회하지 않습니다. `/login`과 `/signup`은 화면을 바로 표시한 뒤 로그인 상태가 확인되면 프로필 상태에 맞는 서비스 화면으로 이동합니다.
- 서비스 공통 `ServiceShell`에서 현재 경로에 따라 하단 Navigation, 페이지 표면과 Tab 전환을 적용합니다.
- 하단 Navigation은 `/chat`과 하위 대화방, `/fitting`, `/wishlists`, `/ranking`, `/mypage`, `/notifications`에서 표시합니다. `/fitting/wardrobe`, `/fitting/jobs/...`, `/fitting-results/...`, `/profile/setup`에서는 표시하지 않습니다.
- 하단 Navigation은 아래로 스크롤하면 숨고 위로 스크롤하면 다시 표시하며, 모바일 키보드가 열린 동안에는 숨깁니다. 채팅 입력창은 키보드 바로 위에 유지합니다.
- 일반 화면의 Header는 문서 흐름에 두고 채팅 Header만 화면 상단에 고정합니다.
- 같은 헤더가 여러 하위 경로에서 유지되면 가장 가까운 공통 `layout.tsx`에 배치합니다. 한 화면에만 필요하면 `page.tsx`에서 선언합니다.

## 소스 구조

```text
src/
├── app/                       # Route, Layout, Page와 라우트 전용 코드
├── features/                  # 비즈니스 기능별 UI, API, Schema, Store
├── shared/
│   ├── api/                   # 공통 API 응답 타입과 요청 설정
│   ├── ui/                    # 비즈니스 도메인에 종속되지 않는 공통 UI
│   └── utils/                 # 범용 Utility
└── styles/                    # 전역 스타일, 디자인 토큰과 Mixin
```

- 폴더는 실제 코드가 필요해지는 시점에 생성하며, 빈 폴더 유지를 위한 `.gitkeep`은 추가하지 않습니다.
- 라우트에서만 쓰는 코드는 `app`에 둡니다.
- 비즈니스 기능에 속하는 UI, API 타입, Schema와 Store는 `features/<domain>`에 둡니다.
- 둘 이상의 Feature에서 동일하게 사용하는 UI와 Utility만 `shared`로 올립니다.
- 공통 UI는 컴포넌트별 폴더에 스타일과 함께 배치하고 `index.ts`를 통해 공개합니다.

### Feature 내부 코드 배치

TanStack Query를 사용하는 Feature는 서버 상태의 책임을 다음처럼 나눕니다.

- `api/`: HTTP 요청과 응답 파싱만 담당합니다.
- `hooks/`: 한 Feature 안에서 UI 상태와 사용자 흐름을 조율하는 Hook을 둡니다.
- `model/`: Query key, `queryOptions`, mutation hook과 캐시 동기화를 둡니다.
- `ui/`: Query option을 `useQuery`나 `useInfiniteQuery`로 실행하고, 사용자 입력과 화면 상태를 처리합니다.
- `index.ts`: 다른 Feature에서 필요한 Query option, Hook과 컴포넌트만 공개합니다. 같은 Feature 내부에서는 상대 경로 import를 사용할 수 있습니다.

Query option은 재사용할 설정과 key를 한곳에 모으고, `useQuery`는 해당 option을 실행하는 역할만 맡깁니다. 캐시 무효화처럼 여러 화면에 영향을 주는 서버 상태 동기화는 model hook에서 처리하고, 토스트·라우팅·완료 화면 같은 UI 효과는 화면에 남깁니다.

## 상태 관리

상태의 원본이 어디에 있는지를 기준으로 도구를 선택합니다.

- 서버가 원본인 데이터와 mutation: TanStack Query
- 여러 화면에서 유지되지만 아직 서버에 저장되지 않은 상태: Zustand
- 한 컴포넌트 또는 가까운 하위 트리에서만 사용하는 상태: React state

서버 상태를 Zustand에 복제하지 않습니다. 피팅 상품 선택처럼 임시 작업 상태만 Zustand에 저장합니다.

## 레이아웃

- 서비스 본체는 최대 `480px`의 단일 컬럼입니다.
- 넓은 화면에서는 서비스 본체를 중앙에 배치합니다.
- 기본 콘텐츠 좌우 여백 `20px`는 공통 레이아웃이 제공합니다. 페이지에서 같은 여백을 중복 적용하지 않습니다.
- 서비스 화면은 기본적으로 페이지 배경을 사용하며, 독립 화면만 필요한 경우 흰색 표면을 명시적으로 적용합니다.

세부 토큰과 공통 UI 규칙은 [디자인 시스템](./design-system.md)을 참고합니다.

## 도메인

사용자 흐름, 상태 전이와 도메인 간 연동은 [도메인 문서](./domains/README.md)에서 관리합니다.

## 랜딩 시안

`/landing`은 인증 없이 접근하는 독립 시안입니다. 라우트 전용 Client Component에서 GSAP ScrollTrigger를 관리하며 unmount 또는 모션 설정 변경 시 정리합니다. 이 경로만 앱의 480px 제한을 해제합니다. 기존 진입·인증 라우팅은 유지합니다. AI 제작 이미지와 SCSS Modules를 사용하고 모션 감소 설정에는 정적인 최종 착장을 제공합니다.

랜딩 하단은 별도로 제작한 투명 배경 3D 일러스트로 찜 기반 코디 추천(찜 10개 이상), 찜순·조회순 랭킹, 피팅 완료 알림을 소개합니다. 기존 `/onboarding` 화면은 변경하지 않습니다. 화면 높이에 관계없이 세로 스크롤에 따라 소개 3장이 왼쪽으로 이동하며 각 장이 중앙에서 750px의 추가 스크롤 동안 머무르고 장면 사이에는 900px 동안 이동하며 마지막 장 이후 시작 영역으로 이어집니다. 모션 감소 설정에서는 세로로 펼칩니다.

랜딩 첫 장면은 준비된 채팅 예시 → 초록 니트 추천 → 동일 니트의 착장 이미지 순서로 연결합니다. 스크롤 진행에만 연동하며 실제 채팅 API나 피팅 요청은 실행하지 않습니다. 모션 감소 설정에서는 채팅과 착장을 함께 표시합니다.

채팅과 피팅은 하나의 휴대폰 프레임 안에서 전환하며, 니트 이동도 화면 안으로 제한합니다. 이미지 초기화와 크기 변경 시 추천 카드의 실제 좌표를 기준으로 니트 위치를 맞춥니다.

추천 카드의 입어보기 강조 후 이미지 영역을 피팅 사진 크기로 확장하며, 처리 문구를 거쳐 착장 사진으로 전환합니다. 빈 피팅룸에서 니트만 이동하던 구간은 사용하지 않습니다.

화면은 `landing-hero.tsx`와 `landing-features.tsx`로 분리하고 전체 GSAP 초기화는 `landing-screen.tsx`에서 관리합니다. 왕관과 벨은 최초 진입 시에만 움직이며 찜 이미지는 정적으로 표시합니다. 랜딩에서는 공통 PageShell의 좌우 패딩을 제거합니다.
