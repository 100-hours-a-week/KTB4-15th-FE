# 브라우저 테스트

Playwright로 Chromium에서 실제 화면을 조작합니다. 현재 범위는 로그인 상태의 채팅과 추천 상품 후속 행동이며, 실제 백엔드와 AI 서버는 연결하지 않습니다.

## 실행

Node.js `24.21.0`과 pnpm `10.12.1`을 사용합니다. `.nvmrc`와 `package.json`의 버전 지정만으로 모든 터미널의 Node.js가 자동 전환되지는 않으므로 실행 전 `node -v`를 확인합니다.

Volta가 설치되어 있지만 터미널이 다른 Node.js를 사용한다면 현재 터미널에서 다음과 같이 전환합니다.

```bash
export PATH="$HOME/.volta/bin:$PATH"
rehash
node -v # v24.21.0 확인
```

nvm을 사용하는 환경에서는 `nvm install`과 `nvm use`로 `.nvmrc`의 버전을 적용합니다.

```bash
pnpm exec playwright install chromium # 최초 실행 시 브라우저 설치
pnpm test:e2e                        # 전체 브라우저 테스트
pnpm test:e2e --grep "찜"             # 특정 시나리오
pnpm test:e2e --headed               # 브라우저를 보면서 실행
pnpm test:e2e chat-wishlist.spec.ts  # 찜 테스트 파일만 실행
```

Playwright가 테스트용 Next 개발 서버(`3100`)와 로컬 API(`3101`)를 시작하고 종료합니다. 두 포트는 비워 두어야 하며, 같은 Checkout에서 실행 중인 `pnpm dev`는 중지한 뒤 실행합니다. 실행 중인 개발 서버를 재사용하지 않습니다.

실패한 테스트의 스크린샷과 Trace는 `test-results/`에 남습니다. `pnpm exec playwright show-trace <trace.zip 경로>`로 실행 기록을 확인할 수 있습니다.

이전 메시지 조회 실패 디자인은 `pnpm test:e2e chat-history.spec.ts --grep "이전 대화 조회 실패" --ui`로 확인합니다. 이 테스트는 실패 토스트를 확인한 뒤 다시 스크롤하여 재시도하므로 최종 화면에는 오류가 남지 않습니다. 실행 후 Attachments에서 **이전 메시지 조회 실패 토스트**를 열면 재시도 전의 스크린샷을 볼 수 있습니다.

`api-server.mts`에서 `Cannot use import statement outside a module`과 Node.js `v20`이 출력되면 테스트용 API 서버를 시작하기 전 Node.js 버전부터 맞춥니다. 이 파일은 Node.js 24의 TypeScript 직접 실행 기능을 사용합니다.

## CI 실행

브라우저와 시스템 의존성 설치는 [Playwright 공식 CI 안내](https://playwright.dev/docs/ci)를 따릅니다.

`develop`·`main` 대상 PR을 열거나 업데이트하면 `frontend-ci.yml`의 **Unit and Playwright Tests** 작업이 실행됩니다. 기존 Docker 검사·빌드 작업과 병렬로 실행하며, 둘 중 하나라도 실패하면 CI는 실패합니다.

- `.nvmrc`의 Node.js와 `package.json`의 pnpm 버전으로 의존성을 고정 설치합니다.
- `pnpm test`를 실행한 뒤 Chromium과 Linux 시스템 의존성을 설치하고, `pnpm test:e2e --forbid-only --reporter=line,html`로 전체 브라우저 테스트를 실행합니다. `test.only`가 남아 있으면 실패합니다.
- 테스트가 Next 개발 서버와 로컬 API를 자동 실행하므로 별도 백엔드나 Secret 설정은 필요하지 않습니다.
- Actions 실행 페이지의 Artifacts에서 **playwright-results**를 내려받을 수 있습니다. HTML Report와 실패한 테스트의 스크린샷·Trace를 7일간 보관합니다. 압축을 푼 뒤 `pnpm exec playwright show-report <playwright-report 경로>`로 Report를 엽니다.

PR 머지를 막는 필수 검사로 지정하려면 GitHub 브랜치 규칙에서 **Unit and Playwright Tests**를 Required Status Check로 등록해야 합니다.

## 폴더 구조

```text
tests/e2e/
├── chat/                       # 기능별 테스트 시나리오 (*.spec.ts)
├── data/
│   └── chat.ts                 # 고정 데이터, 채팅방 생성 함수, Scenario 타입
├── fixtures/
│   └── test.ts                 # test.extend: 초기화·외부 요청 차단·종료 후 검증
├── helpers/
│   ├── chat.ts                 # 입력·추천 상품·답변 완료 등 공통 화면 조작
│   └── mock-api.ts             # 실패 시나리오 변경·POST 요청 기록 조회
└── mock-api/
    ├── api-server.mts          # HTTP 서버·CORS·요청 기록·응답 전달
    └── api-handlers.ts         # MSW 응답·가변 상태·초기화·SSE 스트림
```

`fixtures`에는 Playwright의 `test.extend`로 준비·정리하는 코드만 둡니다. 고정 데이터는 `data`, 재사용 조작은 `helpers`, 가짜 서버 구현은 `mock-api`에 둡니다. 새 기능 테스트는 `chat`과 같은 수준의 기능 폴더에 추가합니다.

Handler와 상태 초기화·스트림 종료는 동일한 상태를 다루므로 `api-handlers.ts`에 함께 둡니다. 서버는 이 모듈의 요청 기록을 공유하여 `/__test/reset` 이후에도 현재 기록에 요청을 추가합니다. 순환 참조나 별도 상태 저장소는 추가하지 않습니다.

참고한 기준과 공개 사례는 다음과 같습니다.

- [Playwright Fixture 문서](https://playwright.dev/docs/test-fixtures)는 환경의 준비·정리를, [Page Object 문서](https://playwright.dev/docs/pom)는 반복 조작의 재사용을 설명합니다. 위 폴더 이름을 강제하는 규칙은 아닙니다.
- [Cal.com 계열](https://github.com/calcom/cal.diy/tree/main/apps/web/playwright)은 기능별 테스트와 `fixtures`, `lib`를 구분합니다.
- [npmx.dev](https://github.com/npmx-dev/npmx.dev/blob/main/CONTRIBUTING.md#testing-connector-features)는 가짜 HTTP 서버 구현과 E2E 전용 보조 코드를 분리합니다.

현재 규모에서는 역할별 폴더와 함수로 충분하므로 Page Object 클래스나 별도 상태 저장소는 도입하지 않습니다.

## 데이터와 격리

- `tests/e2e/mock-api/api-server.mts`는 MSW의 `getResponse`로 로컬 HTTP 응답을 제공합니다. 회원 정보는 기존 `src/mocks/handlers.ts`를 재사용합니다.
- `mock-api/api-handlers.ts`에서 채팅, 찜, 피팅 후보와 실패 시나리오·스트림을 관리합니다. SSR과 브라우저가 같은 로컬 API를 조회하므로 저장 후 목록 이동과 새로고침도 검증합니다.
- 실제 로그인 대신 프로필을 완료한 회원 API 응답을 제공합니다. 브라우저의 401 응답에서 BFF 갱신 성공 후 재전송과 갱신 실패 후 로그인 이동은 검증하지만, 실제 인증 서버·JWT·인증 Cookie 발급은 검증하지 않습니다.
- 테스트마다 대화와 저장 목록을 초기화하고 새 Browser Context를 사용합니다. 로컬 API 상태를 공유하므로 Worker는 하나로 실행합니다.
- 개발용 Service Worker는 끄고, 브라우저의 외부 요청은 차단합니다. 정의되지 않은 로컬 API 호출도 테스트 실패로 처리합니다.
- 상품 보기의 외부 탭은 테스트 HTML로 응답합니다. 구매 URL과 새 탭 열기까지 확인하며 쇼핑몰 동작은 검증하지 않습니다.

## 채팅 검증 범위

기능별 Spec에 정상·실패 시나리오를 함께 둡니다. 메시지는 `chat-messages.spec.ts`, 찜은 `chat-wishlist.spec.ts`, 피팅은 `chat-fitting.spec.ts`, 외부 상품 링크는 `chat-product-link.spec.ts`에서 검증합니다. 공통 채팅 조작과 검증은 `helpers/chat.ts`를 재사용합니다.

이 테스트는 실제 Next 페이지와 여러 컴포넌트, API Client, Router를 함께 실행하는 브라우저 통합 테스트입니다. 컴포넌트 테스트는 페이지 대신 `ChatComposer`나 상품 카드 하나를 별도로 렌더링해 입력·버튼 상태 등의 동작을 검증하는 범위입니다.

| 시나리오                      | 핵심 검증                                                                               |
| ----------------------------- | --------------------------------------------------------------------------------------- |
| 새 채팅                       | 입력 메시지 전송, 스트림 중간 내용, 완료된 답변과 추천 상품, 새로고침 후 대화 유지      |
| 후속 메시지                   | 기존 채팅방에 메시지를 보내고 새 답변 수신                                              |
| 찜                            | 두 번째 추천 상품의 ID로 저장하고 찜 목록과 새로고침 후 같은 상품 확인                  |
| 피팅 목록                     | 추가 후 피팅룸에서 같은 하의 선택, 옷장과 새로고침 후 선택 유지                         |
| 상품 보기                     | 선택한 상품의 구매 URL을 새 탭으로 열고 채팅 탭 유지                                    |
| 빈 입력과 중복 전송           | 공백 전송 차단, 요청이 진행 중일 때 연속 클릭해도 채팅방 하나만 생성                    |
| 새 채팅·후속 메시지 전송 실패 | 오류 안내, 입력 유지, 재전송 성공                                                       |
| 스트림 오류·완료 전 종료      | 오류 안내, 추천 성공으로 표시하지 않음, 입력 잠금 해제, 재시도 성공                     |
| 찜 저장 실패                  | 미저장 상태 유지, 오류 안내, 재시도 후 목록 확인                                        |
| 찜 취소                       | 채팅과 찜 목록에서 취소 후 미선택 상태, 새로고침 후 해당 상품만 제거되고 다른 상품 유지 |
| 찜 취소 실패                  | 채팅과 찜 목록에서 오류 안내, 찜 상태 유지, 새로고침 후 저장된 상품 유지                |
| 피팅 목록 추가 실패           | 추가 버튼 유지, 오류 안내, 재시도 후 피팅룸 이동                                        |

스트림은 중간 Token을 보낸 뒤 테스트가 완료를 허용할 때까지 기다립니다. 임의의 시간만큼 대기하지 않고 화면에 중간 내용과 입력 잠금이 나타나는지 먼저 확인합니다. 추천 상품 두 개 중 두 번째를 조작하여 항상 첫 번째 상품을 저장하는 오류도 검출합니다.

## 채팅 전체 기능 대조

현재 구현된 채팅 기능을 기준으로 아래 범위를 추가 검증합니다. 각 파일은 다른 파일의 실행 결과에 의존하지 않습니다.

| 파일                     | 검증 내용                                                                                                                                                 |
| ------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `chat-input.spec.ts`     | 449·450·500·501자 경계, 글자 수 표시, 앞뒤 공백 제거, Shift+Enter 줄바꿈, Enter 전송, IME 조합 중 Enter 차단                                              |
| `chat-questions.spec.ts` | 일반 추천 질문 3개, 찜 9·10개 경계와 WISHLIST 요청, 찜 개수 조회 실패 시 일반 질문 유지                                                                   |
| `chat-rooms.spec.ts`     | 빈 목록, 열기·닫기·포커스 복원, 방 전환, 새 채팅, 이름 수정·20자 제한·실패·재시도, 삭제 확인·취소·현재/다른 방 삭제·실패·재시도, 목록 조회 오류·추가 조회 |
| `chat-history.spec.ts`   | 최근 20개와 이전 메시지의 순서·중복 방지, 추가 조회 실패 토스트·기존 메시지 유지·다시 스크롤하여 재시도                                                   |
| `chat-errors.spec.ts`    | 잘못된 ID, 없는 방·접근 거부, 초기 조회 실패·복구, 추천 없는 답변, Snapshot 복원, 잘못된 JSON·다른 메시지 ID, 생성 중 새 채팅 이동, 방 한도 안내          |
| `chat-products.spec.ts`  | 추천 상품 페이지 전환, 찜 한도, 피팅 작업 중·조회 실패 시 진입 차단과 재시도, 이미 추가한 피팅 상품 복원                                                  |
| `chat-session.spec.ts`   | 401에서 BFF를 통한 갱신·원래 요청 재전송, 갱신 실패 시 로그인 이동, 오프라인 안내·입력 보존·복구 후 재전송                                                |

IME 검증은 `isComposing` Keyboard Event를 합성하여 전송 방지 로직을 확인합니다. 운영체제의 실제 한글 입력기 동작과 모바일 가상 키보드는 별도 수동 확인이 필요합니다. 실패 시나리오의 4xx·5xx 응답과 브라우저 콘솔 오류는 의도적으로 발생하며, 최종 성공 여부는 Playwright의 passed/failed 결과로 판단합니다.

프론트엔드 테스트에서 확인한 상태 전이와 실패 처리를 정리한 범위이며, 모든 내부 분기의 코드 커버리지 100%를 의미하지 않습니다.

API 응답 고정 테스트는 프론트엔드 흐름을 검증합니다. 실제 API 계약과의 일치, 서버 저장, AI 추천 품질, 실제 피팅 이미지 생성, Firefox·WebKit 호환성은 별도 검증이 필요합니다.

이전 메시지 조회는 TanStack Query의 `retry: false`를 사용합니다. ky의 `retry.limit: 1`로 재시도 가능한 오류(예: 503)는 최초 요청을 포함해 최대 2회 요청한 뒤 실패 토스트를 표시합니다.
