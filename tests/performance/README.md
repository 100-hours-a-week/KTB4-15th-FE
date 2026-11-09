# 채팅 런타임 벤치마크

포트 3100·3101을 비운 뒤 실행합니다. 실행기는 프로덕션 빌드와 로컬 목 API를 시작합니다. 브라우저가 없으면 `pnpm exec playwright install chromium`을 실행합니다.

```sh
BENCH_20K=1 BENCH_SCROLL_DOWN=1 BENCH_LABEL=runtime-218-loaded-20k pnpm bench:chat chat-scroll.spec.ts
BENCH_20K=1 BENCH_PREPEND=1 BENCH_LABEL=runtime-218-prepend-20k pnpm bench:chat chat-scroll.spec.ts
pnpm bench:chat chat-runtime.spec.ts chat-runtime-extra.spec.ts chat-stream.spec.ts
pnpm exec node tests/performance/analyze-runtime-traces.mts
```

`BENCH_SKIP_BUILD=1`은 같은 제품 코드와 API 환경으로 빌드한 `.next`가 있을 때 사용합니다. 결과는 Git에서 제외하는 `performance-results/`에 저장됩니다. `chat-runtime.spec.ts`와 `chat-runtime-extra.spec.ts`는 `BENCH_OUTPUT_DIR`로 결과 경로를 지정할 수 있습니다. 위 분석 명령은 기본 경로에 저장된 trace를 사용합니다. Chrome DevTools Performance에서 gzip trace를 열 수 있습니다.

측정 조건과 결과는 [채팅 런타임 성능 요약](../../docs/performance/chat-scroll.md)을 참고합니다.
