# 채팅 도메인

마지막 업데이트: 2026-09-28

## 목적

사용자가 AI 스타일리스트에게 원하는 옷과 상황을 질문하고, 답변과 추천 상품을 확인하며 추천 상품을 가상 피팅으로 연결하도록 합니다.

## 핵심 개념

- **Chat Room**: 여러 User·AI Message를 묶는 대화 단위입니다.
- **User Message**: 사용자가 보낸 내용과 AI 생성 상태를 가집니다.
- **AI Message**: 생성된 답변이며 선택적으로 상품 Recommendation을 포함합니다.
- **Generation Status**: `GENERATING`, `COMPLETED`, `FAILED` 중 하나입니다.
- **Source Type**: 일반 질문은 `GENERAL`, 찜 목록 기반 질문은 `WISHLIST`입니다. 현재 화면에서는 `GENERAL`만 사용합니다.

## 화면과 경로

| Path             | 역할                                |
| ---------------- | ----------------------------------- |
| `/chat`          | 새 대화 시작, 인사와 추천 질문 표시 |
| `/chat/[chatId]` | 기존 대화 조회와 후속 메시지 전송   |

양의 정수가 아닌 `chatId`는 Not Found로 처리합니다. Header의 Sidebar에서 새 채팅을 시작하거나 과거 대화로 이동할 수 있습니다.

## 메시지 흐름

### 새 대화

1. 사용자가 직접 입력하거나 추천 질문을 선택합니다.
2. 첫 메시지와 `sourceType`으로 `POST /chat-rooms`를 요청합니다.
3. 성공하면 응답받은 `chatRoomId`의 `/chat/[chatId]`로 현재 Route를 교체합니다.

### 기존 대화

1. `GET /chat-rooms/{chatRoomId}`로 최근 메시지를 가져옵니다.
2. 사용자가 메시지를 보내면 `POST /chat-rooms/{chatRoomId}/messages`를 요청합니다.
3. 대화 Query를 무효화하여 새 User Message와 생성 상태를 반영합니다.
4. `GENERATING`인 User Message가 있으면 2초마다 생성 상태를 확인합니다.
5. 상태가 `COMPLETED` 또는 `FAILED`가 되면 대화를 다시 조회합니다.

AI 답변 생성 중에는 추가 전송을 막습니다. 빠른 중복 입력도 별도의 Submission Lock으로 방지합니다.

### 입력 규칙

- 앞뒤 공백을 제거한 뒤 빈 메시지는 전송하지 않습니다.
- 최대 길이는 500자이며, 450자부터 글자 수를 표시합니다.
- Desktop Keyboard에서는 `Enter`로 전송하고 `Shift+Enter`로 줄을 바꿉니다.
- IME 조합 중인 Enter 입력은 전송하지 않습니다.

## 메시지 조회와 실패 처리

- 한 번에 20개씩 Cursor 기반으로 조회합니다.
- 이전 메시지를 더 불러오면 Page 순서를 뒤집어 시간 순서로 합칩니다.
- AI 생성이 `FAILED`인 User Message에는 원문으로 다시 전송하는 동작을 제공합니다.
- 메시지 전송 실패는 Toast로 안내하고 입력 내용을 유지합니다.
- 대화 목록 추가 조회가 실패하면 목록 하단에서 다시 시도할 수 있습니다.

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
| `GET`    | `/chat-rooms/{chatRoomId}/messages/{messageId}/status` | AI 생성 상태 조회     |
| `PATCH`  | `/chat-rooms/{chatRoomId}`                             | 대화 이름 수정        |
| `DELETE` | `/chat-rooms/{chatRoomId}`                             | 대화 삭제             |

## 관련 코드

- `src/features/chat/api`: 채팅 API
- `src/features/chat/schema`: 메시지, 추천 상품과 대화 Schema
- `src/features/chat/chat-screen.tsx`: 메시지 조회·전송·Polling 흐름
- `src/features/chat/ui/sidebar`: 대화 목록과 관리
- `src/features/chat/ui/product`: 추천 상품과 피팅 연동
- `src/app/(service)/chat`: 채팅 Route

## 보류 항목

- 찜 목록 기반 질문 활성화 조건과 `WISHLIST` 흐름
- 대화 내용 검색
