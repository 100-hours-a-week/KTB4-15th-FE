# 채팅방 초기 로딩 개선 기록

## 현재 채택 상태

`perf/chat-detail-cwv-integration`은 `9dead3e`의 스크롤 수정 위에 초기 로딩 개선을 통합했다. 일반 채팅방은 서버에서 인증 쿠키를 전달해 최근 메시지 20개를 `cache: "no-store"`로 조회하고, `initialPage`를 클라이언트 쿼리의 `initialData`로 전달한다. 같은 초기 페이지로 마운트할 때 중복 조회를 억제한다. 현재 구현은 QueryClient/HydrationBoundary를 사용했던 초기 실험과 구성이 다르다.

최신 메시지의 실제 목록 행과 상품 이미지를 초기 HTML에 출력하고 hydration 이후에도 같은 DOM을 유지한다. 최신 행은 처음부터 일반 흐름에 두며 초기 위치 확정 전까지만 하단에 붙인다. 화면 밖 상품 이미지는 영역 진입까지 생성을 지연한다. 직접 import와 Sentry tracing 코드의 빌드 제외도 유지한다.

검색 결과의 유효한 `messageId`로 진입하면 기존 클라이언트 주변 메시지 조회를 사용한다. 서버 초기 조회가 실패하면 클라이언트 조회로 돌아간다. 프로덕션의 일반 진입에서 초기 데이터가 없고 `NEXT_PUBLIC_API_BASE_URL`이 설정돼 있으면 최근 메시지 API fetch preload를 출력한다.

최종 통합본의 고정 모의 API 결과와 한계는 문서 마지막의 develop 통합 기록에 있다. 아래 기준선부터 각 실험 절까지는 당시 구현과 측정 조건의 기록이다. 서버 데이터만 전달했던 초기 실험은 한 차례 철회했고, 이후 초기 HTML 표시와 DOM 유지를 함께 적용해 서버 조회를 다시 채택했다. 실험별 개선량은 합산하지 않으며 실제 백엔드·Lighthouse·운영 방문 결과와 구분한다.

## 측정 실행과 로컬 자료

기본 모의 데이터 측정은 저장소의 fixture와 이미지로 실행할 수 있다. 다음은 실행 예시다.

```bash
BENCH_LABEL=synthetic-check pnpm bench:chat chat-lcp.spec.ts
```

러너가 모의 API(3101번 포트)와 일반 프로덕션 빌드 서버(3100번 포트)를 시작한다. 서버·브라우저 API 주소도 테스트 설정에서 모의 API로 지정한다. 해당 포트는 비어 있어야 하며 실제 로컬 백엔드나 로그인 계정은 필요하지 않다. 결과는 Git에서 제외된 `performance-results/chat-lcp/<label>/`에 저장한다. 기존 결과를 보존하려면 새 label을 사용한다.

`BENCH_ROOM239=1`은 실제 응답을 고정해 모의 API로 재생하는 별도 모드다. Git 외부의 고정 응답과 이미지가 필요하다. 준비 파일·검증 조건·실험 옵션의 추가 의존성은 [239번 측정 자료 준비](./chat-room239-images.md#239번-측정-자료-준비)를 따른다. 실제 로컬 백엔드의 `/chat/239`를 직접 측정하는 방식과 구분한다.

## 측정 조건

- 기준 커밋: `13fefb0`, 브랜치 `perf/chat-detail-lcp`. 앱 구현 변경 없이 측정 도구만 추가.
- `pnpm bench:chat chat-lcp.spec.ts`: 일반 `pnpm build` 후 `pnpm start`. React profiling 빌드 아님.
- Chromium, 390×844, DPR 1, CPU 4배 감속.
- CDP 네트워크 설정: 지연 150ms, 다운로드 1.6Mbps, 업로드 0.75Mbps.
- 5회 모두 새 브라우저 컨텍스트 및 브라우저 캐시 비활성화. 서버 프로세스와 이미지 최적화 캐시는 공유하므로 서버 콜드 스타트 비교는 아님.
- 직접 `/chat/1` 진입. 같은 메시지 20개(사용자/AI 교대), AI 상품 2개. 모의 API와 로컬 상품 이미지 사용.
- 메시지 로딩 후 조작 없이 8초 관측. 스크린샷과 LCP 후보·Navigation/Paint/Resource Timing을 기록.
- 원본: `performance-results/chat-lcp/baseline/results.json`, 각 회차 `run-N.png` (git 제외).

## 결과

시간 단위 ms, 페이지 탐색 시작 기준.

| 회차 | 최종 LCP | 메시지 요청 시작 | 메시지 응답 끝 | LCP 이미지 요청 시작 | 이미지 응답 끝 |
| ---- | -------- | ---------------- | -------------- | -------------------- | -------------- |
| 1    | 3540     | 2833             | 3086           | 3157                 | 3536           |
| 2    | 3384     | 2787             | 3041           | 3098                 | 3379           |
| 3    | 3380     | 2786             | 3042           | 3097                 | 3371           |
| 4    | 3384     | 2788             | 3041           | 3098                 | 3378           |
| 5    | 3392     | 2804             | 3064           | 3116                 | 3385           |

- LCP 중앙값 **3,384ms**, 범위 **3,380–3,540ms**. 5회 모두 최종 LCP는 최신 AI 답변의 상품 이미지.
- 메시지 요청 시작 중앙값 **2,788ms**. 메시지 응답 이후 이미지 요청이 시작되는 직렬 경로가 관측됨.
- 이미지 전송 크기는 약 14KB이며, 이미지 요청부터 LCP까지 약 0.3초(첫 회 약 0.4초).
- 회차별 JS 전송 합계 372,673바이트. 이 값에는 다운로드와 실행 비용이 섞여 있지 않으며, 실행 비용은 별도 trace로 확인해야 함.

## 기준선 당시 해석과 다음 순서

1. 이미지보다 앞선 약 2.8초 구간을 먼저 확인한다. 기준선 당시 메시지 조회는 클라이언트 `ChatRoomScreen`의 `useChatRoomHistory` → `useInfiniteQuery`에서 시작한다. JS 다운로드·실행·hydration 이후에 조회가 시작되는 구조와 측정 결과가 일치한다. 각 작업의 정확한 기여도는 아직 분리하지 않았다.
2. 서버에서 최초 메시지 조회 및 query hydration이 가능한지 검토한다. 인증·오류 처리·검색 문맥 경로를 유지하며 요청 시작을 앞당기는 것이 우선 후보다.
3. 실제 보이는 상품 이미지의 로딩 우선순위를 확인한다. 모든 과거 이미지에 일괄 eager/preload를 적용하지 않는다.

실제 백엔드·외부 상품 이미지·운영 서버 TTFB·다른 메시지 구성·채팅 목록에서의 클라이언트 이동은 이번 측정에 포함하지 않았다. 이 결과는 배포 환경 점수나 실제 사용자의 p75가 아닌, 이후 전후 비교용 로컬 기준선이다.

## 초기 서버 데이터 전달 실험 — 이후 철회

일반 채팅방 페이지의 Server Component에서 인증 쿠키를 전달해 최근 20개를 `cache: no-store`로 조회한다. 요청별 QueryClient에 첫 페이지를 넣고 HydrationBoundary로 클라이언트에 전달한다. 쿼리의 staleTime은 10초로 두어 전달 직후 중복 조회를 막는다. 서버 조회 실패 시 데이터를 주입하지 않고 기존 클라이언트 조회·인증 갱신·오류 UI로 돌아간다. 검색 문맥의 around 조회는 기존 클라이언트 경로를 유지한다.

재측정: `BENCH_LABEL=server-history pnpm bench:chat chat-lcp.spec.ts`. 빌드·메시지·화면·CPU·네트워크·캐시·횟수는 기준선과 동일하다. 원본은 `performance-results/chat-lcp/server-history/results.json`과 회차별 스크린샷에 있다.

| 회차 | 이전 LCP (ms) | 서버 조회 후 LCP (ms) |
| ---- | ------------- | --------------------- |
| 1    | 3540          | 3412                  |
| 2    | 3384          | 3144                  |
| 3    | 3380          | 3116                  |
| 4    | 3384          | 3328                  |
| 5    | 3392          | 3116                  |

- 중앙값: **3,384 → 3,144ms**, **240ms(약 7.1%) 감소**.
- 적용 후 범위: **3,116–3,412ms**. 모두 같은 상품 이미지가 최종 LCP.
- 브라우저의 최초 메시지 요청: 회차당 **1 → 0회**. 서버 조회가 없어졌다는 의미가 아니라 서버가 조회한 결과를 전달한다는 의미다. 서버 API의 정확한 시작 시각은 브라우저 Resource Timing에 잡히지 않는다.
- LCP 이미지 요청 시작 중앙값: **3,098 → 2,856ms**. 메시지 응답을 브라우저에서 추가로 기다리던 구간이 줄었다.
- 초기 이미지 표시가 여전히 JS 초기화 이후여서 개선 폭은 제한적이다. 다음 후보는 가상 목록의 초기 서버 출력과 실제 표시 이미지의 발견 시점이다. 추가 작업은 이번 비교에 포함하지 않았다.

서버→백엔드 구간은 로컬 통신이고 CDP 감속은 브라우저 통신에 적용된다. 실제 배포에서는 서버→백엔드 지연과 HTML/RSC 응답 증가도 영향을 주므로 운영 환경의 개선 폭을 보장하지 않는다. 5회 수치이며 통계적 유의성 검정은 하지 않았다.

## Chrome Performance trace 분석

초기 서버 데이터 전달 실험 구현에 `BENCH_LABEL=server-history-trace BENCH_TRACE=1 pnpm bench:chat chat-lcp.spec.ts`를 실행했다. 기존과 같은 프로덕션 빌드, CPU 4배, 390×844, 1.6Mbps/150ms, 새 컨텍스트/캐시 비활성화, 같은 20개 메시지로 5회 기록했다. React profiling 빌드나 소스맵 설정은 변경하지 않았다.

### 원본과 열기

- `performance-results/chat-lcp/server-history-trace/run-1.trace.json`부터 `run-5.trace.json`까지: CDP Tracing 원본. 압축하지 않은 Chrome Performance 형식이다.
- Chrome DevTools → Performance 탭으로 파일을 드래그하거나 Load profile로 연다. Playwright trace viewer용 zip과 다르다.
- 같은 폴더 `results.json`: 브라우저 Performance API 기록. `analysis.json`: trace 구간 집계.
- 중앙값 회차는 **run-3.trace.json**, LCP 3,156ms.

trace는 `devtools.timeline`, `loading`, `blink.user_timing`, V8 CPU sampling 등을 기록했다. 기록 부하가 추가되므로 기존 비기록 측정과 속도 전후 비교로 사용하지 않는다. trace 5회의 LCP 중앙값은 3,156ms이고, 첫 회는 4,124ms로 느렸다. 첫 회를 제외하지 않고 모두 아래에 표시한다.

| 회차 | LCP ms | 이미지 이전 마지막 JS 응답 끝 ms | 이미지 요청 시작 ms | LCP 이전 메인 작업 합집합 ms | 50ms 이상 작업 수 |
| ---- | ------ | -------------------------------- | ------------------- | ---------------------------- | ----------------- |
| 1    | 4124   | 2951                             | 3326                | 1095                         | 5                 |
| 2    | 3136   | 2671                             | 2855                | 638                          | 3                 |
| 3    | 3156   | 2672                             | 2858                | 637                          | 3                 |
| 4    | 3496   | 3015                             | 3150                | 909                          | 2                 |
| 5    | 3152   | 2672                             | 2867                | 600                          | 3                 |

### 어디를 기다리는가

대표 회차(run 3)의 순서는 다음과 같다. 시간은 탐색 시작 기준이며, 구간끼리 겹칠 수 있어 아래 수치를 합산하지 않는다.

1. **초기 JS 다운로드:** 초기 JS는 약 0.17초부터 요청되고, 가장 큰 청크(전송 약 119KB)는 2.439초에 완료된다. 이후 작은 global-error 청크가 2.672초에 완료된다. 이미지 요청 이전 JS 전송 합계는 373,388바이트(약 373KB)다. 제한된 네트워크에서 초기 JS의 준비를 기다리는 구간이 가장 길게 나타난다. 마지막 청크가 마지막이라는 사실만으로 그 청크를 전체 지연의 원인으로 단정하지 않는다.
2. **초기 실행·목록 표시:** 메시지 이미지 요청은 **2.858초**에 시작한다. 마지막 JS 응답 후 약 186ms의 간격이 있다. LCP 이전 메인 스레드 RunTask 합집합은 **637ms**, 그중 이미지 요청 전은 **534ms**다. 메인 스레드가 3초 내내 바쁜 상황은 아니다. RunTask 기준 50ms 이상 작업 3개, 최장 약 80ms다.
3. **이미지와 표시:** 상품 이미지 응답 끝 **3.136초**, LCP **3.156초**다. 이미지 요청부터 응답까지 약 278ms, 응답 후 표시까지 약 20ms다. 이 구간보다 앞선 이미지 발견 지연이 더 크다.

trace의 JS FunctionCall에는 React scheduler의 최소화된 `O` 같은 이름이 보인다. 빌드 청크를 확인하면 scheduler wrapper이며, 이 이름만으로 특정 사용자 컴포넌트를 병목으로 지목할 수 없다. 대표 회차의 Layout 합집합은 약 43ms, Paint는 약 13ms다. CPU sample에서도 런타임/Turbopack/React 관련 청크가 관측되지만 소스맵 없는 현재 기록으로 개별 원본 함수의 비용을 확정하지 않았다.

### 코드와 연결한 결론

**이번 조건의 주 병목은 서버 메시지 조회나 이미지 압축보다는, 초기 JS가 준비된 뒤에야 가상 목록과 상품 이미지가 나타나는 경로다.**

`ChatMessageList`는 `virtualizer.getVirtualItems()`로 메시지를 출력한다. 해당 실험에서는 initialRect를 지정하지 않아 라이브러리 기본값(높이 0)을 쓰며, virtual-core는 표시 range가 없으면 빈 indexes를 반환한다. 따라서 서버에 메시지 데이터가 있어도 메시지 행/상품 이미지가 초기 HTML의 표시 요소로 먼저 출력되지 않고, 브라우저에서 영역 측정 후 표시된다. trace에서 이미지 요청이 JS 완료 뒤 발생하는 현상과 일치한다.

다음 실험의 우선순위는 (1) 실제 첫 화면의 메시지/상품 이미지를 JS 전체 초기화 전에 발견할 수 있도록 초기 가상 목록 출력을 검토하고, (2) 최초 경로의 JS 구성과 불필요한 초기 의존성을 분석하는 것이다. 이미지에 eager만 붙여도 요소 자체가 늦게 생성되는 문제는 남는다. 전체 JS를 무조건 동적 import하거나 모든 과거 이미지를 preload하는 변경은 이번 분석에 포함하지 않았다.

### 집계 방법과 한계

해당 페이지 navigationStart의 renderer main thread를 기준으로 최종 LCP 시각까지 `RunTask` X 이벤트의 시간 구간 합집합을 계산했다. Layout/Paint 등의 이벤트도 이름별 합집합이며 부모 JS/RunTask와 겹치므로 서로 더하지 않는다. main 작업 밖의 시간을 전부 네트워크 시간으로 분류하지 않았다. CPU sampling은 근사치다. 서버 내부 API 요청 시간은 이 브라우저 trace로 분해할 수 없다.

프로덕션 LCP 측정 5회와 `pnpm check`를 통과했다. 앱 구현은 이번 trace 분석에서 변경하지 않았다. 실제 백엔드/외부 이미지, 운영 환경, 서버 선조회 이전 코드의 trace 비교는 포함하지 않았다.

## CSR 복귀 당시 초기 import 범위 축소

서버 메시지 API, QueryClient/HydrationBoundary와 staleTime 10초 설정을 모두 되돌렸다. 메시지 조회와 서버 조회 실패 fallback도 원래 CSR 경로로 돌아갔다. 서버 선조회 전용 테스트는 제거했고 기존 이전 내역 테스트도 원복했다. 서버 선조회 결과는 비교용 실험 기록으로 남긴다.

`pnpm exec next experimental-analyze --output`으로 CSR 상세 경로의 의존성을 확인했다. 분석 결과에는 지연 로딩 경로도 포함되므로 HEIC 변환 등 큰 모듈이 보인다는 이유만으로 초기 다운로드라고 판단하지 않았다.

적용한 앱 변경은 다음 import 경로 변경뿐이다.

- 채팅방 페이지: `features/chat/index.ts`에서 가져오던 ChatHeader/ChatRoomScreen을 각 구현 파일에서 직접 가져온다.
- 추천 상품 카드: `features/fitting/index.ts`, `features/wishlist/index.ts` 대신 실제 query 모듈에서 필요한 훅만 가져온다.
- 기능과 화면을 함께 re-export하는 barrel 경유를 줄인다. 인증·검증·모니터링·상품 동작은 제거하지 않는다. 새로운 동적 import나 SSR 출력 변경도 하지 않았다.

재측정: `BENCH_LABEL=csr-direct-imports pnpm bench:chat chat-lcp.spec.ts`. 동일한 일반 프로덕션 빌드, 모바일 화면, CPU 4배, 1.6Mbps/150ms, 메시지 20개, 캐시 비활성화, 5회, trace 비활성화 조건이다. 원본은 `performance-results/chat-lcp/csr-direct-imports/results.json`과 `run-N.png`다. 기존 CSR baseline을 비교 대상으로 사용했으며, 교차 순서 실험이나 통계적 유의성 검정은 하지 않았다.

| 회차 | 기존 CSR LCP ms | 직접 import CSR LCP ms |
| ---- | --------------- | ---------------------- |
| 1    | 3540            | 3348                   |
| 2    | 3384            | 3120                   |
| 3    | 3380            | 3116                   |
| 4    | 3384            | 3116                   |
| 5    | 3392            | 3144                   |

| 항목                         | 기존 CSR      | 직접 import CSR   |
| ---------------------------- | ------------- | ----------------- |
| LCP 중앙값                   | 3,384ms       | **3,120ms**       |
| LCP 이미지 발견 전 JS 전송량 | 372,673 bytes | **316,703 bytes** |
| 위 JS 요청 수                | 21            | **18**            |
| 메시지 API 요청 시작 중앙값  | 2,788ms       | **2,516ms**       |
| LCP 이미지 요청 시작 중앙값  | 3,098ms       | **2,828ms**       |

- LCP 중앙값 **264ms(약 7.8%) 감소**. 범위 3,116–3,348ms.
- JS 전송량 **55,970 bytes(약 15.0%) 감소**. Resource Timing 중 LCP 이미지 요청 전에 시작한 `.js` 요청을 집계한 값으로, raw source/minified size와 다르다.
- 앱 코드가 줄어든 양과 다운로드가 줄어든 양은 다르다. 실제 다운로드 차이로 import 경로 변경의 효과를 확인했다. 다만 세 import 변경 각각의 기여도는 분리하지 않았다.
- 서버 선조회 실험 중앙값 3,144ms와 비슷한 수준이며, 24ms 차이로 CSR의 우월성을 주장하지 않는다. 지금은 더 단순한 CSR을 유지한다.
- 가상 목록 초기 출력과 이미지 발견 지연은 여전히 남아 있고, 이번에는 변경하지 않았다.

검증: 프로덕션 빌드 및 LCP 5회 측정, `pnpm check`, 이전 내역·검색·스크롤·추천 상품·피팅 진입·찜 관련 브라우저 테스트 19개 통과.

## 오류 화면 청크 preload 분리 실험 (2026-11-09)

Sentry 분리 실험은 원복한 상태다. 앱 코드·청크 구성을 바꾸지 않고 오류 경계 코드의 늦은 요청 자체가 LCP에 미치는 영향을 확인했다. 운영 앱에는 preload를 적용하지 않았다.

### 방법과 통제

`tests/performance/chat-lcp.spec.ts`에 실험 옵션 `BENCH_ERROR_PRELOAD=0|1`을 추가했다. 빌드 산출물에서 서비스 오류 화면 문구를 포함한 JS가 정확히 하나인지 검증하고, 해당 청크 URL을 찾는다. 두 조건 모두 Playwright가 문서 응답을 받아 전달하며, `1`일 때만 HTML head 시작에 `<link rel="preload" as="script">`를 삽입한다. 청크 해시를 앱 코드에 하드코딩하지 않는다. 이 문구 검색은 실험용으로만 사용하며 제품 코드의 자산 탐색 방식으로 채택하지 않는다.

HTML 교체 응답은 Chromium의 주소 공간 분류가 달라져 로컬 API 요청이 차단되므로 양쪽 모두 해당 origin에 `local-network-access` 권한을 부여했다. 권한 적용 전 실패한 실행은 결과에서 제외했다. 문서 응답을 버퍼링하고 전달하므로 아래 값은 실제 운영의 HTML 스트리밍을 그대로 재현한 결과가 아니다. 일반 기준선과 직접 차이를 계산하지 않고 동일 개입을 거친 대조군과 실험군을 비교한다.

- 일반 프로덕션 빌드, `--profile` 없음, source map 없음.
- 알림 SSE ON. 회차마다 연결 로그, HTTP 200, 스트림 1개 및 미종료 상태를 검증했다.
- 239번 방 고정 메시지 20개와 로컬 상품 이미지 바이트, 이전과 동일한 snapshot SHA-256 `94a068ad8a56d4559d3cd9177b8fd6af550fd91aedacf91d14901ee9dca6f466`.
- CPU 4배 감속, 390×844/DPR 1, 다운로드 1.6Mbps/업로드 0.75Mbps/지연 150ms, 새 context와 캐시 비활성화, trace ON, 각 5회.
- 전후 클라이언트 JS 40개 파일의 이름·SHA-256이 전부 동일하다. 양쪽 LCP 이미지도 동일하다.
- 빌드별 전체 실행을 순차 수행했다. 무작위 교차 측정이나 통계적 유의성 검정은 하지 않았다.

재현: 아래 명령을 각각 실행한다.

```bash
BENCH_ROOM239=1 BENCH_TRACE=1 BENCH_EXPECT_NOTIFICATION_SSE=1 BENCH_ERROR_PRELOAD=0 BENCH_LABEL=room239-error-preload-control pnpm bench:chat chat-lcp.spec.ts
BENCH_ROOM239=1 BENCH_TRACE=1 BENCH_EXPECT_NOTIFICATION_SSE=1 BENCH_ERROR_PRELOAD=1 BENCH_LABEL=room239-error-preload-after pnpm bench:chat chat-lcp.spec.ts
```

### 결과

| 회차 | preload OFF LCP ms | preload ON LCP ms |
| ---- | ------------------ | ----------------- |
| 1    | 3284               | 3348              |
| 2    | 2876               | 2640              |
| 3    | 2820               | 2744              |
| 4    | 2792               | 2744              |
| 5    | 3336               | 2708              |

| 지표 중앙값               | OFF          | ON           |
| ------------------------- | ------------ | ------------ |
| LCP                       | 2876ms       | 2744ms       |
| 오류 청크 요청 시작       | 2230ms       | 56ms         |
| 오류 청크 응답 완료       | 2401ms       | 272ms        |
| LCP 이미지 요청 시작      | 2607ms       | 2492ms       |
| 가장 큰 공용 JS 응답 완료 | 2140ms       | 2139ms       |
| FCP                       | 488ms        | 476ms        |
| 이미지 요청 전 JS 전송량  | 316869 bytes | 316869 bytes |

LCP 중앙값은 **132ms(약 4.6%) 감소**, 이미지 요청은 약 115ms 빨라졌다. trace 10개에서 오류 청크 요청은 회차당 정확히 하나였고, ON은 HTML 파서의 link preload, OFF는 script 요청임을 확인했다. 오류 청크 전송량은 양쪽 862 bytes로 동일하다. 개입 없는 일반 기준선 5회의 LCP 중앙값은 2888ms였지만, 조건 차이가 있어 개선율 계산에는 쓰지 않았다.

오류 경계 코드가 늦게 발견되는 것은 초기 경로의 대기 일부와 연결된다. 그러나 요청을 2초 이상 앞당겨도 LCP는 그만큼 줄지 않는다. 가장 큰 공용 JS 완료가 약 2.14초로 같고 그 이후 첫 메시지/상품 이미지가 생성되는 경로도 남는다. 작은 오류 청크 preload만으로 주 병목이 해결됐다고 판단하지 않는다. 실행별 변동과 첫 회차 outlier도 있어 132ms를 운영에서 보장되는 개선량으로 해석하지 않는다.

원본은 `performance-results/chat-lcp/room239-error-preload-control/`, `room239-error-preload-after/`의 `results.json`, `run-N.trace.json`, `run-N.png`, `build-hashes.json`과 `performance-results/chat-lcp/error-preload-comparison.json`에 있다. 측정 옵션과 기록만 추가했으며 앱 구현은 변경하지 않았다. 프로덕션 빌드와 전후 5회 측정, `pnpm check`를 통과했다.

## Turbopack의 Sentry tracing 제거 (2026-11-09)

로컬 Chrome Performance trace(`BENCH_TRACE=1`)와 Sentry SDK의 tracing은 별개다. 앱에는 `tracesSampleRate`/`tracesSampler`가 없으며 운영 성능 추적 전송을 새로 끄는 변경이 아니다. 사용하지 않는 SDK 성능 추적 코드를 빌드에서 제거한다. 오류 수집, 개인정보 수집 제한, 알림 SSE는 유지한다.

### 원인과 변경

기존 `withSentryConfig`의 `bundleSizeOptimizations.excludeTracing: true`만으로는 현재 Next 16.3.5/Turbopack + Sentry 11.0.0의 일반 빌드에서 tracing 코드가 제거되지 않았다. 설치된 SDK의 Turbopack 후처리 경로는 release/debug ID/source map 처리를 수행하며, Webpack의 define 치환과 다르다. 실제 변경 전 공용 청크에 `BrowserTracing`, `browserTracingIntegration`, `__SENTRY_TRACING__`, `largest-contentful-paint` 코드가 남아 있었다.

`next.config.ts`에 Next의 `compiler.define: { __SENTRY_TRACING__: false }`만 추가했다. 이 정의는 클라이언트·서버·Edge 빌드에 적용된다. 기존 debug 제거 설정, Sentry 초기화와 error boundary, SDK 버전은 바꾸지 않았다. 변경 후 일반 빌드의 모든 클라이언트 JS에서 위 tracing 문자열이 사라졌고, 공용 청크의 `captureException` 오류 수집 코드는 남아 있다. 향후 Sentry 성능 추적을 도입하려면 이 빌드 정의도 재검토해야 한다.

### 동일 조건 전후 측정

오류 청크 preload 실험은 OFF(HTML 개입 없음). 239번 방 고정 응답/로컬 이미지, 일반 빌드, 알림 SSE ON, CPU 4배, 390×844/DPR 1, 다운로드 1.6Mbps/업로드 0.75Mbps/지연 150ms, 새 context/캐시 비활성화, Chrome trace ON으로 각각 5회 측정했다. snapshot SHA-256과 최종 LCP 상품 이미지는 전후 동일하다. 알림 SSE는 매회 연결 로그·HTTP 200·스트림 1개·미종료 상태를 검증했다. 첫 기준선 시도의 SSE 확인 실패 실행은 비교에서 제외하고 기준선을 다시 측정했다.

```bash
BENCH_ROOM239=1 BENCH_TRACE=1 BENCH_EXPECT_NOTIFICATION_SSE=1 BENCH_LABEL=room239-tracing-removal-before pnpm bench:chat chat-lcp.spec.ts
BENCH_ROOM239=1 BENCH_TRACE=1 BENCH_EXPECT_NOTIFICATION_SSE=1 BENCH_LABEL=room239-tracing-removal-after pnpm bench:chat chat-lcp.spec.ts
```

| 회차 | 변경 전 LCP ms | 변경 후 LCP ms |
| ---- | -------------- | -------------- |
| 1    | 3176           | 3720           |
| 2    | 2948           | 2860           |
| 3    | 2888           | 2668           |
| 4    | 2880           | 2772           |
| 5    | 2872           | 2752           |

| 지표                        | 변경 전      | 변경 후      |
| --------------------------- | ------------ | ------------ |
| LCP 중앙값                  | 2888ms       | 2772ms       |
| LCP 이미지 요청 시작 중앙값 | 2648ms       | 2522ms       |
| 가장 큰 초기 공용 JS 전송량 | 119013 bytes | 96280 bytes  |
| 위 청크 압축 전 크기        | 372913 bytes | 300240 bytes |
| 이미지 요청 전 JS 전송량    | 316869 bytes | 294085 bytes |
| 큰 공용 JS 응답 완료 중앙값 | 2231ms       | 2118ms       |
| FCP 중앙값                  | 576ms        | 564ms        |

LCP 중앙값 **116ms(약 4.0%) 감소**, 초기 JS 전송량 **22784 bytes(약 7.2%) 감소**. 가장 큰 공용 청크 전송량은 **22733 bytes(약 19.1%) 감소**했다. JS 용량 감소는 산출물·네트워크에서 확인했지만, LCP는 회차 편차(특히 변경 후 첫 회 3720ms)가 있다. 순차 5회 측정이며 무작위 교차 측정이나 통계적 유의성 검정은 하지 않았다. 운영에서도 같은 LCP 개선량이 나온다고 보장하지 않는다. 오류 청크 preload의 개선량과 합산하지 않는다.

원본: `performance-results/chat-lcp/room239-tracing-removal-before/`와 `room239-tracing-removal-after/`의 `results.json`, `run-N.trace.json`, `run-N.png`, `bundle-evidence.json`, `largest-chunk.js.txt`. 집계는 `performance-results/chat-lcp/tracing-removal-comparison.json`에 있다.

검증: 전후 일반 프로덕션 빌드/각 5회 측정과 `pnpm check` 통과. 운영 DSN으로 실제 오류를 전송하는 검증과 Lighthouse 재측정은 하지 않았다.

## Sentry 기본 부가 기능 제한 실험 — 미채택 (2026-11-09)

브라우저 `instrumentation-client.ts`에서 기본 integrations 콜백으로 `ConversationId`, `BrowserSession`, `Console`을 제외하고 `consoleIntegration({ levels: ["warn", "error"] })`를 추가했다. 서버/Edge 설정, 오류 경계, 개인정보 제한, 앞서 적용한 tracing 빌드 제거는 유지했다.

### 동작 검증

실제 초기화 옵션을 추출해 설치된 브라우저 SDK와 외부 통신 없는 테스트 transport로 검증했다. 두 integration이 제외되고 GlobalHandlers/BrowserApiErrors/LinkedErrors/Dedupe/EventFilters가 유지됨을 확인했다. 테스트 오류 envelope가 생성되고 warn/error breadcrumb가 남으며 info breadcrumb와 session envelope는 생성되지 않았다. 이는 Node에서 브라우저 SDK의 선택/수집 동작을 검사한 것이며 운영 Sentry 서버의 수신까지 검증한 결과는 아니다. 검증 스크립트는 `performance-results/chat-lcp/room239-sentry-defaults-before/self-check.mjs.txt`에 보관했다.

### 동일 조건 비교

일반 빌드, 239번 방 고정 메시지 20개/로컬 이미지, 알림 SSE ON, CPU 4배, 390×844/DPR 1, 다운로드 1.6Mbps/업로드 0.75Mbps/지연 150ms, 매회 새 context/캐시 비활성화, Chrome trace ON으로 각 5회 측정했다. 오류 청크 preload는 OFF이며 HTML 교체도 없다. 전후 조건 객체·snapshot hash·최종 LCP 상품 이미지는 동일하다. SSE 연결 로그/HTTP 200/스트림 1개/미종료 검증을 전 회차 통과했다.

```bash
BENCH_ROOM239=1 BENCH_TRACE=1 BENCH_EXPECT_NOTIFICATION_SSE=1 BENCH_LABEL=room239-sentry-defaults-before pnpm bench:chat chat-lcp.spec.ts
BENCH_ROOM239=1 BENCH_TRACE=1 BENCH_EXPECT_NOTIFICATION_SSE=1 BENCH_LABEL=room239-sentry-defaults-after pnpm bench:chat chat-lcp.spec.ts
```

| 회차 | 기존 LCP ms | 제한 후 LCP ms |
| ---- | ----------- | -------------- |
| 1    | 3536        | 3336           |
| 2    | 2892        | 2852           |
| 3    | 2752        | 2908           |
| 4    | 2836        | 2768           |
| 5    | 2772        | 2772           |

| 지표                         | 기존         | 제한 후      |
| ---------------------------- | ------------ | ------------ |
| LCP 중앙값                   | 2836ms       | 2852ms       |
| 상품 이미지 요청 시작 중앙값 | 2578ms       | 2582ms       |
| 큰 공용 JS 전송량            | 96280 bytes  | 96316 bytes  |
| 위 청크 압축 전 크기         | 300240 bytes | 300382 bytes |
| 이미지 요청 전 JS 전송량     | 294085 bytes | 294123 bytes |
| 큰 공용 JS 응답 완료 중앙값  | 2118ms       | 2118ms       |

**성능 개선 효과를 확인하지 못해 실험 설정은 원복했다.** LCP 중앙값 차이 +16ms는 실행별 변동 범위에서 해석해야 하며 실제 악화를 입증하지 않는다. JS 전송량도 줄지 않았다. SDK는 기본 integration 목록을 만든 뒤 런타임에서 필터링하므로 ConversationId/BrowserSession 구현이 번들에 남았고, 초기화 설정 코드만 소폭 추가됐다. 기능을 사용하지 않는 것과 빌드에서 코드가 제거되는 것은 다르다. 세션 기반 지표와 일부 콘솔 기록을 포기하면서 이 설정을 LCP 최적화로 채택할 근거가 없다. 앞서 적용한 `__SENTRY_TRACING__: false`는 유지한다.

원본은 `performance-results/chat-lcp/room239-sentry-defaults-before/`와 `room239-sentry-defaults-after/`의 `results.json`, `run-N.trace.json`, `run-N.png`, 실험군 `bundle-evidence.json` 및 `performance-results/chat-lcp/sentry-defaults-comparison.json`에 있다. 원복 전후 `pnpm check`와 전후 일반 빌드/각 5회 측정을 통과했다. 순차 측정이며 통계적 유의성 검정, 운영 오류 수신, Lighthouse 재측정은 하지 않았다.

## Sentry 디버그 빌드 플래그 실험 — 미채택 (2026-11-09)

`next.config.ts`의 기존 `compiler.define`에 `__SENTRY_DEBUG__: false`를 추가했다. tracing 제거는 유지하고 SDK 초기 import·오류 경계·Console breadcrumb·기본 integrations·개인정보 제한은 바꾸지 않았다. 이 정의는 클라이언트·서버·Edge와 개발 빌드에도 적용되므로 SDK 내부 디버그 진단을 조사하려면 재검토해야 한다. 앱 자체의 console 출력이나 오류 전송을 끄는 설정은 아니다.

### 실제 적용과 제거 한계

일반 빌드 전후 클라이언트 청크를 검사했다. 기존 `__SENTRY_DEBUG__` 참조 8개는 0개가 됐고 SDK 공유 모듈의 `DEBUG_BUILD` export가 `false`인 것도 확인했다. 공용 청크의 `captureException` 코드는 남아 있다.

다만 `Integration installed` 1개와 `Event dropped` 6개 문자열은 그대로 남았다. 공용 청크가 별도 공유 모듈의 `DEBUG_BUILD`를 `p.DEBUG_BUILD && ...` 형태로 참조하는 부분은 상수 치환 후에도 청크 사이에서 제거되지 않았다. 따라서 **디버그 기능은 비활성화되고 일부 코드는 줄었지만, 모든 디버그 코드가 제거된 것은 아니다.** SDK 내부 경로 alias, 소스 변경 loader, 청크 구성 변경은 추가하지 않았다.

### 동일 조건 비교

239번 방 고정 메시지 20개/로컬 이미지, 일반 빌드(`--profile` 없음), 알림 SSE ON, CPU 4배, 390×844/DPR 1, 다운로드 1.6Mbps/업로드 0.75Mbps/지연 150ms, 매회 새 context/캐시 비활성화, Chrome trace ON으로 각 5회 측정했다. 오류 청크 preload는 OFF이고 HTML 개입은 없다. 전후 조건 객체·snapshot hash·최종 LCP 상품 이미지는 동일하다. 모든 회차에서 SSE 연결 로그/HTTP 200/스트림 1개/미종료 검증을 통과했다.

```bash
BENCH_ROOM239=1 BENCH_TRACE=1 BENCH_EXPECT_NOTIFICATION_SSE=1 BENCH_LABEL=room239-sentry-debug-before pnpm bench:chat chat-lcp.spec.ts
BENCH_ROOM239=1 BENCH_TRACE=1 BENCH_EXPECT_NOTIFICATION_SSE=1 BENCH_LABEL=room239-sentry-debug-after pnpm bench:chat chat-lcp.spec.ts
```

| 회차 | 기존 LCP ms | debug false LCP ms |
| ---- | ----------- | ------------------ |
| 1    | 3000        | 3152               |
| 2    | 2772        | 2764               |
| 3    | 2768        | 2776               |
| 4    | 2752        | 2820               |
| 5    | 2736        | 3168               |

| 지표                         | 기존         | debug false  |
| ---------------------------- | ------------ | ------------ |
| LCP 중앙값                   | 2768ms       | 2820ms       |
| 상품 이미지 요청 시작 중앙값 | 2526ms       | 2569ms       |
| 큰 공용 JS 전송량            | 96280 bytes  | 95973 bytes  |
| 위 청크 압축 전 크기         | 300240 bytes | 299373 bytes |
| 이미지 요청 전 JS 전송량     | 294085 bytes | 293318 bytes |
| 큰 공용 JS 응답 완료 중앙값  | 2118ms       | 2124ms       |
| FCP 중앙값                   | 564ms        | 564ms        |

초기 JS 전송량은 **767 bytes(약 0.26%) 감소**했다. LCP 중앙값은 +52ms로, 이 측정에서 개선은 확인하지 못했다. 회차 편차가 있고 순차 5회 측정이므로 실제 악화나 통계적 차이를 단정하지 않는다. 디버그 플래그는 최종 변경에서 되돌렸다. SDK 기능을 유지하며 import 경로를 더 복잡하게 바꿀 근거도 되지 않는다.

원본은 `performance-results/chat-lcp/room239-sentry-debug-before/`와 `room239-sentry-debug-after/`의 `results.json`, `run-N.trace.json`, `run-N.png`, `bundle-evidence.json`, `common-chunk.js.txt` 및 `performance-results/chat-lcp/sentry-debug-comparison.json`에 있다. 실험군에는 false 상수를 export하는 공유 JS도 `.txt`로 보관했다.

검증: 전후 일반 프로덕션 빌드/각 5회 측정, 빌드 상수·진단 문자열·오류 수집 코드 검사와 `pnpm check` 통과. 운영 DSN으로 실제 오류 수신, Lighthouse 재측정, 통계적 유의성 검정은 하지 않았다.

## 추천 상품 버튼 API 지연 로딩 — 미채택

초기 JS 절감이 작아 클릭 시 API 로딩과 query key 분리는 최종 변경에서 되돌렸다. 아래 수치는 실험 당시의 기록이다.

찜·피팅 mutation을 조회 설정에서 분리하고, 각 API와 응답 검증 모듈을 클릭 후 불러오도록 변경했다. 알림 Provider는 피팅 query key 전용 모듈을 참조한다. 피팅룸 진입에 필요한 현재 작업 조회도 클릭 후 로드한다.

239번 방 고정 메시지·이미지, 알림 SSE ON, 일반 프로덕션 빌드, CPU 4배 감속, 1.6Mbps 다운로드와 150ms 지연, 새 브라우저 컨텍스트 및 캐시 비활성화 조건에서 각각 5회 측정했다. 모든 회차에서 알림 SSE 연결을 검증했다.

| 지표                        | 분리 전  | 분리 후  |
| --------------------------- | -------- | -------- |
| LCP 중앙값                  | 2,884ms  | 2,768ms  |
| LCP 이미지 요청 시작 중앙값 | 2,579ms  | 2,530ms  |
| 이미지 요청 전 JS 전송량    | 293,318B | 291,931B |

회차별 LCP는 분리 전 3,008 / 2,888 / 2,788 / 2,884 / 2,772ms, 분리 후 3,132 / 2,872 / 2,752 / 2,756 / 2,768ms였다. 초기 JS는 1,387B 감소했다. LCP 중앙값 차이 116ms에는 회차별 편차가 포함된다.

분리 후 첫 회차 trace에서 찜 등록·피팅 후보 추가·현재 피팅 작업 조회 API 구현을 포함한 청크가 초기 로딩에서 요청되지 않았다. 일반 빌드의 찜·피팅 E2E 11개가 통과했다. 첫 클릭에 추가되는 모듈 다운로드 시간은 별도로 측정하지 않았다.

측정 원본은 `performance-results/chat-lcp/room239-product-actions-before/`, `room239-product-actions-after/`에 있고, 집계는 `performance-results/chat-lcp/product-actions-comparison.json`에 있다.

## 239번 방 LCP 이미지 한 장 선요청

상품 버튼 분리 후 저장한 결과에서 다섯 회차의 최종 LCP 이미지 URL이 같은지 확인하고, 그 URL의 최적화된 이미지 한 장을 사용했다. 대조군과 실험군 모두 Playwright가 문서 HTML을 받아 전달한다. 실험군에만 `as="image"`와 `fetchpriority="high"`를 지정한 preload를 추가했다. 앱 코드에는 적용하지 않았다.

일반 빌드, 239번 방 고정 데이터, 알림 SSE ON, CPU 4배 감속, 1.6Mbps 다운로드, 지연 150ms, 새 브라우저 컨텍스트 및 캐시 비활성화 조건에서 5회씩 측정했다. 매회 최종 LCP 이미지가 동일하며 해당 이미지의 Resource Timing 항목이 하나인지 확인했다. 실험군은 link가 요청을 시작했는지도 확인했다.

| 지표 중앙값              | 대조군  | 이미지 선요청 |
| ------------------------ | ------- | ------------- |
| 이미지 요청 시작         | 2,450ms | 45ms          |
| 이미지 응답 완료         | 2,655ms | 452ms         |
| 이미지 응답 완료부터 LCP | 24ms    | 2,096ms       |
| LCP                      | 2,684ms | 2,532ms       |

회차별 LCP는 대조군 3,976 / 2,740 / 2,680 / 2,664 / 2,684ms, 실험군 3,012 / 2,668 / 2,460 / 2,512 / 2,532ms였다. 중앙값은 152ms 감소했고 실험군 5회 중 1회가 2.5초 아래였다. 이미지가 일찍 도착해도 화면에 그려질 때까지 남는 대기가 크다. 이 구간에는 JS 준비와 메시지·상품 카드 표시가 포함되며 각 단계의 기여도는 이번 실험에서 분리하지 않았다.

```bash
BENCH_ROOM239=1 BENCH_TRACE=1 BENCH_EXPECT_NOTIFICATION_SSE=1 BENCH_IMAGE_PRELOAD=0 BENCH_LABEL=room239-lcp-image-control pnpm bench:chat chat-lcp.spec.ts
BENCH_ROOM239=1 BENCH_TRACE=1 BENCH_EXPECT_NOTIFICATION_SSE=1 BENCH_IMAGE_PRELOAD=1 BENCH_LABEL=room239-lcp-image-preload pnpm bench:chat chat-lcp.spec.ts
```

원본과 집계는 `performance-results/chat-lcp/`의 각 라벨 디렉터리와 `lcp-image-preload-comparison.json`에 있다. HTML 전달에 개입하고 실제 LCP 이미지를 미리 알고 시작한 실험이므로 운영 효과와는 별도로 해석한다.

## Core Web Vitals 실험실 보조 계측

`BENCH_VITALS=1`을 기존 초기 로딩 벤치마크에 추가하면 LCP 기록을 저장한 뒤 입력창을 클릭하고 키 두 개를 입력한다. 브라우저에서 Next.js에 번들된 Web Vitals 구현으로 그 세션의 CLS와 INP를 기록한다. 이 옵션은 테스트 러너에서만 작동한다. 실험실 INP는 이 입력 시나리오에 한정되며 상품 버튼, 메시지 전송, 실제 사용자 세션의 응답성을 대표하지 않는다. 실험실의 다섯 회차와 실제 사용자 p75는 별도로 판단한다.

첫 실험에서는 카드별 찜·피팅 mutation 세 개를 캐러셀 단위로 공유했다. `b50b7fd`에서 시작한 별도 작업 트리의 일반 프로덕션 빌드에서 239번 방 고정 응답, 모바일 CPU 4배·지연 150ms·다운로드 1.6Mbps·알림 SSE ON·trace OFF로 각 5회 비교했다. LCP 중앙값은 2,756 → 2,752ms였고, nearest-rank p75는 2,764 → 2,752ms였다. 변경 후 첫 회를 포함한 모든 결과를 사용했다. 회차 편차에 비해 중앙값 차이가 작아 앱 변경은 되돌렸다. 로컬 원본 라벨은 `cwv-baseline`과 `cwv-card-actions`다. 후자는 LCP 관측을 마친 뒤 입력창 시나리오를 실행했으며, 해당 실험실 INP p75는 64ms, CLS p75는 약 0.0091이었다.

두 번째 실험은 권한이 있는 일반 채팅방의 최신 추천 메시지와 첫 상품 이미지를 서버 HTML에 출력하고, 기존 목록이 최신 위치를 확정하면 서버 화면을 숨기는 방식이다. 서버 요청은 `no-store`이며 검색 문맥은 기존 경로를 사용한다. 두 빌드는 239번 방 고정 응답, 390×844, CPU 4배, 1.6Mbps/150ms, SSE ON, trace OFF, 동일 입력 시나리오로 각 5회 비교했다.

| 실험실 p75 (nearest-rank) | 기존 CSR | 서버 첫 화면 |
| ------------------------- | -------: | -----------: |
| LCP                       |  2,892ms |      2,632ms |
| INP                       |     56ms |         64ms |
| CLS                       |   0.0091 |       0.0158 |

원본은 `performance-results/chat-lcp/cwv-baseline-all/results.json`과 `cwv-server-first/results.json`이다. 양쪽 다섯 회차의 최종 LCP 상품은 동일하다. 변경 후 브라우저 메시지 API 요청은 0회였고 서버에서 첫 페이지를 제공했다. 실험군 3회차에서 이미지 요청은 176ms, 네트워크 응답 완료는 618ms, 첫 이미지 후보는 624ms였다. 목록 전환 뒤 같은 URL의 새 이미지가 더 큰 후보로 2,604ms에 잡혔다. 같은 이미지 URL의 네트워크 요청은 한 건이었다. 다음 검증 대상은 첫 화면에서 그린 상품 이미지 DOM을 목록 활성화 이후에도 유지하는 구조다. 기존 실험으로는 LCP 2.5초 기준을 충족하지 못했다.

후속 실험 `cwv-server-stable-row`는 별도 서버 미리보기 대신 최신 메시지의 실제 가상 행을 초기 HTML에 포함한다. 브라우저 테스트에서 JS 없이 추천 이미지가 표시되고 hydration 이후에도 같은 이미지 DOM이 유지되는 것을 확인했다. 기존 검색, 이전 내역과 스크롤 동작을 포함한 11개 테스트가 통과했다. 동일 조건의 실험실 p75는 LCP 2,664ms, INP 48ms, CLS 0.0161이었다. 3회차에서는 같은 이미지가 552ms에 48,609px² 후보로 나타났고 2,580ms에 48,705px² 후보로 다시 기록됐다. 두 후보에 대응하는 네트워크 요청은 한 건이었다. 초기 위치와 활성화 이후 위치에서 동일한 콘텐츠가 어떻게 다시 후보가 되는지 확인하기 위해 후보 요소의 화면 좌표를 계측한다.

`cwv-server-row-geometry`에서는 첫 행을 수평으로 배치할 때 transform 대신 양쪽 inset과 자동 여백을 사용해 초기 이미지의 가시 면적을 맞췄다. 동일 모바일 조건에서 LCP는 632 / 716 / 660 / 624 / 644ms, p75는 660ms였다. INP p75는 56ms, CLS p75는 0.0161이었다. 전 회차에서 같은 상품 이미지가 48,705px²의 최종 후보였으며 뒤늦은 이미지 후보가 없었다. 이 결과는 고정 모의 API의 실험실 검증이며 실제 방문 p75는 별도다.

### 데스크톱과 상품 캐러셀 검증

동일한 고정 응답, 일반 빌드, CPU 4배 및 CDP 네트워크 조건으로 모바일(390×844)과 데스크톱(1440×900)을 각각 5회 측정했다. LCP를 기록한 뒤 입력창 클릭, 키 입력과 삭제, 추천 상품 두 번째 페이지 버튼 클릭을 수행했다. 두 조건 모두 SSE ON, trace OFF였다.

| 실험실 p75 (nearest-rank) | 모바일 | 데스크톱 |
| ------------------------- | -----: | -------: |
| LCP                       |  672ms |    692ms |
| INP                       |   56ms |     72ms |
| CLS                       | 0.0161 |   0.0033 |

원본 라벨은 `cwv-mobile-carousel`과 `cwv-desktop-carousel`이다. `BENCH_CAROUSEL_INTERACTION=1`을 `BENCH_VITALS=1`과 함께 사용하며 데스크톱 측정에는 `BENCH_DESKTOP=1`을 추가한다. 앱 회귀 검증은 확장 E2E에서 통과한 49건과 최초 서버 조회에 맞게 픽스처·요청 검증을 수정한 뒤 다시 통과한 4건으로 확인했다. 실제 방문 판정 절차는 [모니터링 문서](../analytics-and-monitoring.md)를 참고한다.

### develop 통합에서 관측한 레이아웃 이동

기존 스크롤 수정(`9dead3e`) 위에 통합한 첫 후보는 모바일 실험실 p75가 LCP 2,604ms, INP 56ms, CLS 0.5962였다. `BENCH_LAYOUT_SHIFTS=1`로 재실행한 결과 첫 화면 고정 행을 일반 목록에 편입하는 구간에서 0.5801의 이동 항목이 관측됐다. 한 회차에서 상품 이미지는 556ms에 처음 표시됐고, 초기 행의 위치가 바뀐 뒤 2,576ms에 더 큰 최종 LCP 후보로 다시 잡혔다. 이후 같은 목록 기준에 배치하고 높이를 예약하는 후보를 검증했으며, 최종적으로 아래 일반 흐름 방식을 채택했다. 로컬 라벨은 `cwv-develop-mobile` 및 `cwv-develop-layout-shifts`다.

최신 행을 같은 목록 기준에 절대 배치하고 화면을 즉시 맞춘 실험은 LCP 기준을 충족했지만 CLS p75 0.5882가 남았다. `cwv-develop-in-flow`에서는 최신 행을 처음부터 일반 흐름에 두고 초기 위치 확정 전까지만 하단에 붙게 했다. 고정 위치에서 일반 행으로 편입하거나 최신 행의 높이를 따로 예약하는 경로가 사라졌다. 모바일 5회 p75는 LCP 688ms, INP 64ms, CLS 0.0091이며 0.58 수준의 이동은 재현되지 않았다.

같은 통합 코드의 데스크톱 5회 p75는 LCP 608ms, INP 56ms, CLS 0.0017이었다. 모바일과 데스크톱 모두 고정 응답과 입력창·상품 캐러셀 시나리오를 사용했다. `pnpm check`, 채팅 E2E 26건, 일반 빌드에서의 모바일·데스크톱 벤치마크가 통과했다. 원본 라벨은 `cwv-develop-in-flow`, `cwv-develop-in-flow-desktop`이다. 배포 후 실제 방문으로 별도 판정한다.
