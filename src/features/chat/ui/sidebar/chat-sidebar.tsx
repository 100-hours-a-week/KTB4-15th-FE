"use client";

import * as Dialog from "@radix-ui/react-dialog";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Button, IconButton } from "@/shared/ui/button";
import { ConfirmDialog, RenameDialog } from "@/shared/ui/dialog";
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
import { formatKoreanRelativeDateTime } from "@/shared/utils/date-format";
import { useInfiniteQuery } from "@tanstack/react-query";
import { CHAT_ROOM_TITLE_MAX_LENGTH } from "../../schema/chat";
import {
  chatRoomListQueryOptions,
  useDeleteChatRoomMutation,
  useRenameChatRoomMutation,
} from "../../model/chat-room-query";
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
  const [renameTarget, setRenameTarget] = useState<{
    id: number;
    title: string;
  } | null>(null);
  const [deleteTargetId, setDeleteTargetId] = useState<number | null>(null);

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
                          setRenameTarget({
                            id: chatRoom.chatRoomId,
                            title: chatRoom.title,
                          })
                        }
                      >
                        이름 수정
                      </DropdownItem>
                      <DropdownItem
                        destructive
                        icon={<DeleteIcon />}
                        onSelect={() => setDeleteTargetId(chatRoom.chatRoomId)}
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

      <RenameDialog
        description="나중에 쉽게 찾을 수 있는 이름을 지어주세요."
        initialValue={renameTarget?.title ?? ""}
        isLoading={renameChatRoomMutation.isPending}
        key={renameTarget?.id ?? "closed"}
        label="채팅 이름"
        maxLength={CHAT_ROOM_TITLE_MAX_LENGTH}
        onConfirm={(title) => {
          if (!renameTarget) return;

          renameChatRoomMutation.mutate(
            { chatRoomId: renameTarget.id, title },
            {
              onSuccess: () => {
                setRenameTarget(null);
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
        onOpenChange={(nextOpen) => {
          if (!nextOpen) setRenameTarget(null);
        }}
        open={renameTarget !== null}
        title="채팅 이름 변경"
      />
      <ConfirmDialog
        confirmLabel="삭제하기"
        description="삭제된 대화 내역은 복구할 수 없습니다."
        isLoading={deleteChatRoomMutation.isPending}
        onConfirm={() => {
          if (deleteTargetId === null) return;

          deleteChatRoomMutation.mutate(deleteTargetId, {
            onSuccess: () => {
              setDeleteTargetId(null);
              showToast.success("채팅방을 삭제했어요.", {
                id: "delete-chat-room",
              });

              if (pathname === `/chat/${deleteTargetId}`) {
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
        onOpenChange={(nextOpen) => {
          if (!nextOpen) setDeleteTargetId(null);
        }}
        open={deleteTargetId !== null}
        title="채팅을 삭제하시겠습니까?"
      />
    </Dialog.Root>
  );
}
