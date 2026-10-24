# 채팅 도메인

마지막 업데이트: 2026-10-24

## 목적

사용자가 AI 스타일리스트에게 원하는 옷과 상황을 질문하고, 답변과 추천 상품을 확인하며 추천 상품을 가상 피팅으로 연결하도록 합니다.

## 핵심 개념

- **Chat Room**: 여러 User·AI Message를 묶는 대화 단위입니다.
- **User Message**: 사용자가 보낸 내용과 AI 생성 상태를 가집니다.
- **AI Message**: 생성된 답변이며 선택적으로 상품 Recommendation을 포함합니다.
- **Generation Status**: 생성 대기 `PENDING`, 생성 중 `GENERATING`, 완료 `COMPLETED`, 실패 `FAILED` 중 하나입니다.
- **Source Type**: 일반 질문은 `GENERAL`, 찜 목록 기반 질문은 `WISHLIST`입니다.

## 화면과 경로

| Path             | 역할                                |
| ---------------- | ----------------------------------- |
| `/chat`          | 새 대화 시작, 인사와 추천 질문 표시 |
| `/chat/[chatId]` | 기존 대화 조회와 후속 메시지 전송   |

양의 정수가 아닌 `chatId`는 Not Found로 처리합니다. Header의 Sidebar에서 새 채팅을 시작하거나 과거 대화로 이동할 수 있습니다.

Sidebar는 목록 버튼을 처음 누를 때 동적으로 로드합니다. 이후에는 마운트를 유지해 닫기 동작과 내부 상태를 보존합니다.
목록을 닫으면 열기 전의 버튼으로 키보드 포커스를 돌려줍니다.

## 메시지 흐름

### 새 대화

1. 사용자가 직접 입력하거나 추천 질문을 선택합니다.
2. 첫 메시지와 `sourceType`으로 `POST /chat-rooms`를 요청합니다.
3. 성공하면 응답받은 `chatRoomId`의 `/chat/[chatId]`로 현재 Route를 교체합니다.

찜한 상품이 10개 이상이면 새 대화 화면에 찜 목록 기반 코디 추천 질문을 표시하며, 선택 시 `WISHLIST`로 대화를 생성합니다. 찜 개수 조회가 완료되지 않았거나 실패하면 해당 질문만 표시하지 않습니다.

### 기존 대화

1. `GET /chat-rooms/{chatRoomId}`로 최근 메시지를 가져옵니다.
2. 사용자가 메시지를 보내면 `POST /chat-rooms/{chatRoomId}/messages`를 요청합니다.
3. 대화 Query를 무효화하여 새 User Message와 생성 상태를 반영합니다.
4. `PENDING` 또는 `GENERATING`인 User Message가 있으면 해당 Message의 SSE에 연결합니다. 최초 연결은 `PENDING`을 `GENERATING`으로 전환하며 AI 생성을 시작합니다.
5. `token`은 버퍼에 쌓아 임시 AI Message에 짧은 덩어리로 표시하고, 버퍼가 많이 쌓이면 출력량을 늘립니다. `done` 이후 남은 글자를 모두 표시한 다음 대화를 다시 조회하며, `error`는 즉시 반영합니다.
6. 종료 이벤트 없이 연결이 끊기면 오류를 안내하고 대화를 다시 조회합니다.

AI 답변 생성 중에는 추가 전송을 막습니다. 빠른 중복 입력도 별도의 Submission Lock으로 방지합니다.

### 입력 규칙

- 앞뒤 공백을 제거한 뒤 빈 메시지는 전송하지 않습니다.
- 최대 길이는 500자이며, 450자부터 글자 수를 표시합니다.
- 여러 줄 입력 시 텍스트는 전송 버튼 위에서 전체 너비를 사용합니다. 한 줄 상태의 너비로 확장 여부를 판단한 뒤 확장된 너비에서 높이를 계산합니다.
- 입력창은 최대 4줄(96px)까지 확장되며, 이후에는 내부 스크롤을 사용합니다. 페이지 하단 여백은 입력창 도크의 실제 높이에 맞춥니다.
- Desktop Keyboard에서는 `Enter`로 전송하고 `Shift+Enter`로 줄을 바꿉니다.
- IME 조합 중인 Enter 입력은 전송하지 않습니다.

## 새 답변과 스크롤

- 채팅방 진입 시 최신 대화로 이동합니다. 직접 메시지를 보내면 하단으로 부드럽게 이동합니다.
- 새 AI 답변 도착 직전 하단에서 120px 이내에 있으면 답변 시작으로 부드럽게 이동합니다.
- 이전 대화를 읽는 중이면 위치를 유지하고 입력창 위 중앙에 `↓ 새 답변 도착` 버튼을 표시합니다. 버튼을 누르면 새 답변 시작으로 이동하며, 직접 하단으로 돌아와도 버튼은 사라집니다.
- 동작 줄이기 설정에서는 스크롤 애니메이션을 생략합니다.

## 메시지 조회와 실패 처리

- 한 번에 20개씩 Cursor 기반으로 조회합니다.
- 이전 메시지를 더 불러오면 Page 순서를 뒤집어 시간 순서로 합칩니다.
- AI 생성이 `FAILED`인 User Message에는 원문으로 다시 전송하는 동작을 제공합니다.
- 메시지 전송 실패는 Toast로 안내하고 입력 내용을 유지합니다.
- 대화 목록 추가 조회가 실패하면 목록 하단에서 다시 시도할 수 있습니다.
- 이전 메시지 추가 조회가 최종 실패하면 현재 대화는 유지하고 토스트로 안내합니다. 위쪽에서 벗어났다가 다시 스크롤하면 재조회할 수 있습니다.

## 대화 목록

Sidebar가 열렸을 때 대화 목록을 20개씩 Cursor 기반으로 조회합니다.

- 새 채팅: `/chat`으로 이동
- 대화 선택: `/chat/[chatId]`로 이동
- 이름 수정: 앞뒤 공백을 제거한 1~20자 제목
- 삭제: 확인 Dialog를 거쳐 삭제
- 현재 보고 있는 대화를 삭제한 경우 `/chat`으로 이동

목록 끝이 가까워지면 Intersection Observer로 다음 Page를 불러옵니다.

## 추천 상품과 찜·피팅 연동

AI Message의 Recommendation은 하나 이상의 추천 상품을 포함할 수 있습니다.

- 상품 카드에서 가격, 색상, 추천 이유와 외부 구매 링크를 표시합니다.
- 하트 버튼으로 상품을 찜하거나 해제합니다.
- 피팅 후보가 아니면 `POST /fitting-candidates`로 추가합니다.
- 이미 피팅 후보이면 해당 상품을 상의 또는 하의 선택 상태에 저장하고 `/fitting`으로 이동합니다.
- 피팅 후보 추가 후 관련 Query를 무효화하여 옷장 목록을 갱신합니다.

## API

| Method   | Path                                                   | 역할                  |
| -------- | ------------------------------------------------------ | --------------------- |
| `POST`   | `/chat-rooms`                                          | 첫 메시지로 대화 생성 |
| `GET`    | `/chat-rooms`                                          | 대화 목록 조회        |
| `GET`    | `/chat-rooms/{chatRoomId}`                             | 대화와 메시지 조회    |
| `POST`   | `/chat-rooms/{chatRoomId}/messages`                    | 후속 메시지 전송      |
| `GET`    | `/chat-rooms/{chatRoomId}/messages/{messageId}/stream` | AI 답변 SSE 스트리밍  |
| `PATCH`  | `/chat-rooms/{chatRoomId}`                             | 대화 이름 수정        |
| `DELETE` | `/chat-rooms/{chatRoomId}`                             | 대화 삭제             |

## 관련 코드

- `src/features/chat/api`: 채팅 API
- `src/features/chat/schema`: 메시지, 추천 상품과 대화 Schema
- `src/features/chat/new-chat-screen.tsx`: 신규 채팅 생성 흐름
- `src/features/chat/chat-room-screen.tsx`: 채팅방 조회·전송·SSE 흐름
- `src/features/chat/ui/sidebar`: 대화 목록과 관리
- `src/features/chat/ui/product`: 추천 상품과 피팅 연동
- `src/app/(service)/chat`: 채팅 Route

## 보류 항목

- 대화 내용 검색
