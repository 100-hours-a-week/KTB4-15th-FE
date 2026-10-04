"use client";

import * as Dialog from "@radix-ui/react-dialog";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { overlay } from "overlay-kit";
import { useEffect, useRef } from "react";
import { Button, IconButton } from "@/shared/ui/button";
import { Dropdown, DropdownItem } from "@/shared/ui/dropdown";
import { showToast } from "@/shared/ui/toast";
import { getApiErrorMessage } from "@/shared/api/error";
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
import {
  chatRoomListQueryOptions,
  useDeleteChatRoomMutation,
  useRenameChatRoomMutation,
} from "../../model/chat-query";
import styles from "./chat-sidebar.module.scss";

type ChatSidebarProps = {
  onOpenChange: (open: boolean) => void;
  open: boolean;
};

export function ChatSidebar({ open, onOpenChange }: ChatSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const chatRoomListRef = useRef<HTMLElement>(null);
  const loadMoreRef = useRef<HTMLDivElement>(null);

  const chatRoomQuery = useInfiniteQuery({
    ...chatRoomListQueryOptions,
    enabled: open,
  });

  const renameChatRoomMutation = useRenameChatRoomMutation();
  const deleteChatRoomMutation = useDeleteChatRoomMutation();

  const chatRooms =
    chatRoomQuery.data?.pages.flatMap((page) => page.items) ?? [];
  const {
    fetchNextPage,
    hasNextPage,
    isFetchNextPageError,
    isFetchingNextPage,
  } = chatRoomQuery;

  useEffect(() => {
    const root = chatRoomListRef.current;
    const target = loadMoreRef.current;

    if (!open || !root || !target || !hasNextPage) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (
          entry.isIntersecting &&
          !isFetchingNextPage &&
          !isFetchNextPageError
        ) {
          void fetchNextPage();
        }
      },
      { root, rootMargin: "0px 0px 200px" },
    );

    observer.observe(target);

    return () => observer.disconnect();
  }, [
    fetchNextPage,
    hasNextPage,
    isFetchNextPageError,
    isFetchingNextPage,
    open,
  ]);

  const startNewChat = () => {
    onOpenChange(false);
    router.push("/chat");
  };

  const openRenameDialog = (chatRoomId: number, currentTitle: string) => {
    overlay.open(({ close, isOpen, unmount }) => (
      <RenameChatDialog
        initialTitle={currentTitle}
        onConfirm={(title) => {
          renameChatRoomMutation.mutate(
            { chatRoomId, title },
            {
              onSuccess: () => {
                close();
                showToast.success("채팅방 이름을 수정했어요.", {
                  id: "rename-chat-room",
                });
              },
              onError: (error) => {
                showToast.error(
                  getApiErrorMessage(error, "채팅방 이름을 수정하지 못했어요."),
                  { id: "rename-chat-room" },
                );
              },
            },
          );
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
          deleteChatRoomMutation.mutate(chatRoomId, {
            onSuccess: () => {
              close();
              showToast.success("채팅방을 삭제했어요.", {
                id: "delete-chat-room",
              });

              if (pathname === `/chat/${chatRoomId}`) {
                router.push("/chat");
              }
            },
            onError: (error) => {
              showToast.error(
                getApiErrorMessage(error, "채팅방을 삭제하지 못했어요."),
                { id: "delete-chat-room" },
              );
            },
          });
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
        <div className={styles.portalViewport}>
          <Dialog.Overlay className={styles.backdrop} />
          <Dialog.Content
            aria-describedby={undefined}
            className={styles.sidebar}
          >
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

            <nav
              aria-busy={
                chatRoomQuery.isPending || chatRoomQuery.isFetchingNextPage
              }
              aria-label="대화 목록"
              className={styles.chatRoomList}
              ref={chatRoomListRef}
            >
              {chatRoomQuery.isPending && (
                <div aria-label="대화 목록을 불러오는 중" role="status">
                  {Array.from({ length: 4 }, (_, index) => (
                    <div className={styles.skeleton} key={index}>
                      <span />
                      <span />
                    </div>
                  ))}
                </div>
              )}

              {chatRoomQuery.isError && chatRooms.length === 0 && (
                <div className={styles.state} role="alert">
                  <p>대화 목록을 불러오지 못했어요</p>
                  <Button
                    isLoading={chatRoomQuery.isFetching}
                    onClick={() => void chatRoomQuery.refetch()}
                    size="small"
                    variant="secondary"
                  >
                    {chatRoomQuery.isFetching ? "불러오는 중..." : "다시 시도"}
                  </Button>
                </div>
              )}

              {chatRoomQuery.isSuccess && chatRooms.length === 0 && (
                <p className={styles.empty}>아직 대화가 없어요</p>
              )}

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

              {chatRooms.length > 0 && (
                <div className={styles.loadMore} ref={loadMoreRef}>
                  {chatRoomQuery.isFetchingNextPage && (
                    <span aria-live="polite">대화를 더 불러오는 중...</span>
                  )}
                  {chatRoomQuery.isFetchNextPageError && (
                    <>
                      <span role="alert">추가 대화를 불러오지 못했어요</span>
                      <Button
                        onClick={() => void chatRoomQuery.fetchNextPage()}
                        size="small"
                        variant="text"
                      >
                        다시 시도
                      </Button>
                    </>
                  )}
                </div>
              )}
            </nav>
          </Dialog.Content>
        </div>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
