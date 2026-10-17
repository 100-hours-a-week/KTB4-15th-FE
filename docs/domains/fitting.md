# 피팅 도메인

마지막 업데이트: 2026-10-18

## 목적

채팅에서 담은 상품 중 상의와 하의를 선택하고, 회원의 전신 사진과 체형 정보를 기반으로 가상 피팅 이미지를 생성해 결과를 보여줍니다.

## 핵심 개념

- **Fitting Candidate**: 사용자가 피팅에 사용할 수 있도록 담아둔 상품입니다.
- **Fitting Selection**: 현재 피팅할 상의와 하의 선택입니다.
- **Fitting Job**: 선택한 상품으로 가상 피팅 결과를 생성하는 비동기 작업입니다.
- **Item Type**: 상품은 `TOP` 또는 `BOTTOM`입니다.
- **Job Status**: `GENERATING`, `COMPLETED`, `FAILED` 중 하나입니다.

## 화면과 경로

| Path                                  | 역할                                  |
| ------------------------------------- | ------------------------------------- |
| `/fitting`                            | 전신 사진, 체형과 현재 착장 선택 확인 |
| `/fitting/wardrobe`                   | 피팅 후보 조회·선택·삭제              |
| `/fitting/jobs/[fittingJobId]`        | 생성 진행 상태와 실패 표시            |
| `/fitting/jobs/[fittingJobId]/result` | 저장 전 임시 결과 표시                |

`/fitting/wardrobe?itemType=TOP|BOTTOM`으로 진입하면 해당 종류를 초기 Filter로 사용하며, 그 외 값은 전체 Filter로 처리합니다.

## 피팅 후보와 옷장

- 후보는 채팅 추천 상품에서 추가합니다.
- 목록은 `TOP`, `BOTTOM`, 전체로 Filter할 수 있습니다.
- 한 번에 20개씩 Cursor 기반으로 조회하고 Intersection Observer로 다음 Page를 불러옵니다.
- 일반 모드에서는 상품을 누르면 해당 Item Type의 선택을 교체합니다.
- 후보 조회가 끝나면 `TOP` 또는 `BOTTOM` Filter에는 해당 종류의 기본 항목이, 전체 Filter에는 상·하의 기본 항목이 함께 표시됩니다.
- Filter 선택은 URL에 반영되어 새로고침 후에도 유지됩니다.
- 편집 모드에서는 현재 화면의 후보를 개별 또는 전체 선택해 일괄 삭제할 수 있습니다.
- 삭제한 후보가 현재 선택된 상품이면 해당 Item Type 선택도 제거합니다.

## 착장 선택 상태

상의와 하의는 각각 최대 하나씩 선택할 수 있으며, 둘 중 하나 이상을 선택해야 피팅을 시작할 수 있습니다.
전신 사진을 변경해 검증하거나 저장하는 동안에는 기존 사진으로 피팅을 시작하거나 다른 화면으로 이동할 수 없습니다. 브라우저에서 페이지를 벗어나려 하면 이탈 경고를 표시합니다.

- Zustand Store를 사용합니다.
- 선택한 값만 `sessionStorage`의 `fitting-selection`에 저장합니다.
- Server Rendering과 Hydration 충돌을 피하기 위해 Client Mount 후 수동으로 복원합니다.
- 피팅 작업을 생성하면 선택을 비웁니다.
- 로그인과 로그아웃 성공 시 이전 사용자의 선택과 저장값을 제거합니다.

## 피팅 작업 흐름

1. 선택한 상의와 하의의 `productId`로 `POST /fitting-jobs`를 요청합니다.
2. 성공하면 활성 Job id와 시작 시간을 `localStorage`에 저장합니다.
3. `/fitting/jobs/[fittingJobId]`로 이동합니다.
4. Job 상태를 조회하고 `GENERATING`이면 생성 진행 화면을 표시합니다.
   SSE 알림이 유실되어도 완료 상태를 확인할 수 있도록 5초마다 현재 Job을 다시 조회합니다.
5. `COMPLETED`이면 진행률을 100%로 표시한 뒤 900ms 후 `/fitting/jobs/[fittingJobId]/result`로 이동합니다.
6. `FAILED` 작업은 피팅 홈 이동 시 확인 처리 API가 성공하면 활성 Job과 진행 시간 정보를 제거합니다.
7. `COMPLETED`이면 활성 Job과 진행 시간 정보를 제거합니다.

활성 Job이 남아 있는 상태에서 `/fitting`에 진입하면 해당 Job 화면으로 이동합니다. 진행 화면의 Percentage는 서버 진행률이 아니라 시작 시간을 이용한 시각적 추정치이며 완료 전 최대 92%까지만 표시합니다.

## 피팅 결과

결과에는 다음 정보가 포함됩니다.

- 가상 피팅 결과 이미지
- 코디명
- AI 스타일리스트 Comment
- 선택한 상품과 외부 구매 링크 정보

결과 이미지는 확대해서 볼 수 있으며 Backdrop, 닫기 버튼과 Escape 키로 닫습니다. 임시 결과는 저장 여부에 따라 `가상 피팅 저장` 또는 `목록으로 가기`를 표시하고, 저장된 결과 상세에서는 코디명 수정과 삭제를 제공합니다.
저장 목록에서 상세로 이동할 때 목록 이미지가 결과 이미지로 자연스럽게 전환되며, 상품이 하나인 조합은 상품명을 줄이지 않고 표시합니다.

## API

| Method   | Path                                         | 역할                    |
| -------- | -------------------------------------------- | ----------------------- |
| `GET`    | `/fitting-candidates`                        | 후보 목록 조회          |
| `POST`   | `/fitting-candidates`                        | 상품을 피팅 후보에 추가 |
| `DELETE` | `/fitting-candidates`                        | 후보 일괄 삭제          |
| `POST`   | `/fitting-jobs`                              | 피팅 작업 생성          |
| `GET`    | `/fitting-jobs/{fittingJobId}`               | 피팅 작업 상태 조회     |
| `GET`    | `/fitting-jobs/current`                      | 최근 미확인 작업 조회   |
| `GET`    | `/fitting-jobs/{fittingJobId}/result`        | 임시 결과 조회          |
| `PATCH`  | `/fitting-jobs/{fittingJobId}/result/viewed` | 결과 확인 처리          |

## 오류와 예외 처리

- 후보 목록 조회 실패는 옷장 안에 Error State로 표시합니다.
- 후보 삭제 실패는 삭제 영역에 안내합니다.
- 작업 생성 실패는 피팅 시작 버튼 아래에 안내합니다.
- Job 조회 실패와 생성 실패는 각각 전용 화면 상태로 표시합니다.
- Job 조회 실패와 `FAILED` 상태 화면에서는 활성 Job과 진행 정보를 정리하고 피팅 홈으로 돌아갈 수 있습니다.
- `FAILED` Job은 활성 Job에서 제거하여 사용자가 피팅 홈에서 다시 시작할 수 있게 합니다.
- 이미 확인한 Job은 피팅 홈 진입 시 작업 화면으로 다시 이동시키지 않습니다.

## 관련 코드

- `src/features/fitting/api`: 후보와 Job API 및 Query
- `src/features/fitting/schema`: 후보와 Job Schema
- `src/features/fitting/store`: 선택, 활성 Job과 진행 시간 저장
- `src/features/fitting/ui`: 피팅 홈, 옷장, 진행과 결과 UI
- `src/app/(service)/fitting`: 피팅 홈, 옷장과 Job Route

## 보류 항목

- 진행률을 서버에서 제공할지 여부
- Job 상태 변경을 전달할 전역 SSE 연동
