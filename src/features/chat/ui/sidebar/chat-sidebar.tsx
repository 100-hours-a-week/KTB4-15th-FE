"use client";

import * as Dialog from "@radix-ui/react-dialog";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { overlay } from "overlay-kit";
import { Button, IconButton } from "@/shared/ui/button";
import { Dropdown, DropdownItem } from "@/shared/ui/dropdown";
import {
  CloseIcon,
  DeleteIcon,
  EditIcon,
  MoreIcon,
  PlusIcon,
  SearchIcon,
} from "@/shared/ui/icon";
import {
  DeleteChatDialog,
  RenameChatDialog,
} from "@/features/chat/ui/dialog/chat-dialogs";
import styles from "./chat-sidebar.module.scss";

const INITIAL_CONVERSATIONS = [
  {
    chatRoomId: 501,
    title: "5만원대 캐주얼 니트 추천",
    lastMessageAt: "오전 10:24",
  },
  {
    chatRoomId: 502,
    title: "검정 슬랙스에 어울리는 상의",
    lastMessageAt: "오전 08:12",
  },
  {
    chatRoomId: 503,
    title: "청바지에 어울리는 아우터",
    lastMessageAt: "10월 22일",
  },
  {
    chatRoomId: 504,
    title: "흰 블라우스에 어울리는 하의",
    lastMessageAt: "10월 20일",
  },
  {
    chatRoomId: 505,
    title: "결혼식 하객 8만원대 셋업",
    lastMessageAt: "10월 18일",
  },
  {
    chatRoomId: 506,
    title: "주말 데이트용 미니멀 셔츠",
    lastMessageAt: "10월 15일",
  },
];

type Conversation = (typeof INITIAL_CONVERSATIONS)[number];

type ChatSidebarProps = {
  onOpenChange: (open: boolean) => void;
  open: boolean;
};

export function ChatSidebar({ open, onOpenChange }: ChatSidebarProps) {
  const [conversations, setConversations] = useState<Conversation[]>(() => [
    ...INITIAL_CONVERSATIONS,
  ]);
  const [query, setQuery] = useState("");
  const pathname = usePathname();
  const router = useRouter();
  const normalizedQuery = query.trim().toLocaleLowerCase("ko-KR");
  const filteredConversations = conversations.filter((conversation) =>
    conversation.title.toLocaleLowerCase("ko-KR").includes(normalizedQuery),
  );

  const startNewChat = () => {
    onOpenChange(false);
    router.push("/chat");
  };

  const openRenameDialog = (chatRoomId: number, currentTitle: string) => {
    overlay.open(({ close, isOpen, unmount }) => (
      <RenameChatDialog
        initialTitle={currentTitle}
        onConfirm={(title) => {
          setConversations((currentConversations) =>
            currentConversations.map((conversation) =>
              conversation.chatRoomId === chatRoomId
                ? { ...conversation, title }
                : conversation,
            ),
          );
          close();
        }}
        onExit={unmount}
        onOpenChange={(nextOpen) => {
          if (!nextOpen) close();
        }}
        open={isOpen}
      />
    ));
  };

  const openDeleteDialog = (chatRoomId: number) => {
    overlay.open(({ close, isOpen, unmount }) => (
      <DeleteChatDialog
        onConfirm={() => {
          setConversations((currentConversations) =>
            currentConversations.filter(
              (conversation) => conversation.chatRoomId !== chatRoomId,
            ),
          );
          close();

          if (pathname === `/chat/${chatRoomId}`) {
            router.push("/chat");
          }
        }}
        onExit={unmount}
        onOpenChange={(nextOpen) => {
          if (!nextOpen) close();
        }}
        open={isOpen}
      />
    ));
  };

  return (
    <Dialog.Root onOpenChange={onOpenChange} open={open}>
      <Dialog.Portal>
        <Dialog.Overlay className={styles.backdrop} />
        <Dialog.Content aria-describedby={undefined} className={styles.sidebar}>
          <header className={styles.sidebarHeader}>
            <div className={styles.heading}>
              <Dialog.Title className={styles.title}>채팅</Dialog.Title>
              <span className={styles.badge}>AI 룩딱</span>
            </div>
            <Dialog.Close asChild>
              <IconButton aria-label="채팅 목록 닫기" size="small">
                <CloseIcon />
              </IconButton>
            </Dialog.Close>
          </header>

          <div className={styles.searchField}>
            <SearchIcon />
            <label className={styles.visuallyHidden} htmlFor="chat-search">
              대화 내용 검색
            </label>
            <input
              id="chat-search"
              onChange={(event) => setQuery(event.target.value)}
              placeholder="대화 내용 검색"
              type="search"
              value={query}
            />
          </div>

          <Button
            className={styles.newChatButton}
            fullWidth
            leadingIcon={<PlusIcon />}
            onClick={startNewChat}
            size="small"
          >
            새 채팅
          </Button>

          <div className={styles.divider} />

          <nav aria-label="대화 목록" className={styles.conversationList}>
            {filteredConversations.map((conversation) => {
              const href = `/chat/${conversation.chatRoomId}`;
              const isActive = pathname === href;

              return (
                <div
                  className={`${styles.conversation} ${isActive ? styles.active : ""}`}
                  key={conversation.chatRoomId}
                >
                  <Link
                    aria-current={isActive ? "page" : undefined}
                    className={styles.conversationLink}
                    href={href}
                    onClick={() => onOpenChange(false)}
                  >
                    <strong>{conversation.title}</strong>
                    <span>{conversation.lastMessageAt}</span>
                  </Link>
                  <Dropdown
                    trigger={
                      <IconButton
                        aria-label={`${conversation.title} 메뉴 열기`}
                        className={styles.moreButton}
                        size="small"
                      >
                        <MoreIcon />
                      </IconButton>
                    }
                  >
                    <DropdownItem
                      icon={<EditIcon />}
                      onSelect={() =>
                        openRenameDialog(
                          conversation.chatRoomId,
                          conversation.title,
                        )
                      }
                    >
                      이름 수정
                    </DropdownItem>
                    <DropdownItem
                      destructive
                      icon={<DeleteIcon />}
                      onSelect={() => openDeleteDialog(conversation.chatRoomId)}
                    >
                      삭제하기
                    </DropdownItem>
                  </Dropdown>
                </div>
              );
            })}
            {filteredConversations.length === 0 && (
              <p className={styles.empty}>검색 결과가 없습니다.</p>
            )}
          </nav>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
