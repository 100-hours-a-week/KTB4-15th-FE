"use client";

import * as Dialog from "@radix-ui/react-dialog";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { overlay } from "overlay-kit";
import { Button, IconButton } from "@/shared/ui/button";
import { Dropdown, DropdownItem } from "@/shared/ui/dropdown";
import {
  CloseIcon,
  DeleteIcon,
  EditIcon,
  MoreIcon,
  PlusIcon,
} from "@/shared/ui/icon";
import {
  DeleteChatDialog,
  RenameChatDialog,
} from "@/features/chat/ui/dialog/chat-dialogs";
import { formatKoreanRelativeDateTime } from "@/shared/utils/date-format";
import { useInfiniteQuery } from "@tanstack/react-query";
import { getChatRooms } from "../../api/chat";
import styles from "./chat-sidebar.module.scss";

type ChatSidebarProps = {
  onOpenChange: (open: boolean) => void;
  open: boolean;
};

export function ChatSidebar({ open, onOpenChange }: ChatSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();

  const chatRoomQuery = useInfiniteQuery({
    queryKey: ["chatRooms"],
    queryFn: ({ pageParam }) => getChatRooms(pageParam),
    initialPageParam: null as number | null,
    getNextPageParam: (lastPage) =>
      lastPage.hasNext ? lastPage.nextCursor : undefined,
    enabled: open,
  });

  const chatRooms =
    chatRoomQuery.data?.pages.flatMap((page) => page.items) ?? [];

  const startNewChat = () => {
    onOpenChange(false);
    router.push("/chat");
  };

  const openRenameDialog = (chatRoomId: number, currentTitle: string) => {
    overlay.open(({ close, isOpen, unmount }) => (
      <RenameChatDialog
        initialTitle={currentTitle}
        onConfirm={() => {}}
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

          {/* <div className={styles.searchField}>
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
          </div> */}

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

          <nav aria-label="대화 목록" className={styles.chatRoomList}>
            {chatRooms.map((chatRoom) => {
              const href = `/chat/${chatRoom.chatRoomId}`;
              const isActive = pathname === href;

              return (
                <div
                  className={`${styles.chatRoom} ${isActive ? styles.active : ""}`}
                  key={chatRoom.chatRoomId}
                >
                  <Link
                    aria-current={isActive ? "page" : undefined}
                    className={styles.chatRoomLink}
                    href={href}
                    onClick={() => onOpenChange(false)}
                  >
                    <strong>{chatRoom.title}</strong>
                    <span>
                      {formatKoreanRelativeDateTime(chatRoom.lastMessageAt)}
                    </span>
                  </Link>
                  <Dropdown
                    trigger={
                      <IconButton
                        aria-label={`${chatRoom.title} 메뉴 열기`}
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
                        openRenameDialog(chatRoom.chatRoomId, chatRoom.title)
                      }
                    >
                      이름 수정
                    </DropdownItem>
                    <DropdownItem
                      destructive
                      icon={<DeleteIcon />}
                      onSelect={() => openDeleteDialog(chatRoom.chatRoomId)}
                    >
                      삭제하기
                    </DropdownItem>
                  </Dropdown>
                </div>
              );
            })}
          </nav>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
