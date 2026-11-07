"use client";

import Link from "next/link";
import { useScrollPagination } from "@/shared/hooks/use-scroll-pagination";
import { PaginationStatus } from "@/shared/ui/pagination-status";
import { getApiErrorMessage } from "@/shared/api/error";
import { ChevronRightIcon, ClearIcon, SearchIcon } from "@/shared/ui/icon";
import { HighlightedChatText } from "./ui/message/highlighted-chat-text";
import { useChatSearch } from "./model/use-chat-search";
import styles from "./chat-search-screen.module.scss";

export function ChatSearchScreen() {
  const {
    keyword,
    setKeyword,
    debouncedKeyword,
    showResults,
    query,
    reachedLastPage,
  } = useChatSearch();
  const items = query.data?.pages.flatMap((page) => page.items) ?? [];
  const loadMoreRef = useScrollPagination({
    enabled: showResults && query.hasNextPage && !query.isFetchNextPageError,
    isFetching: query.isFetching,
    fetchNextPage: query.fetchNextPage,
  });

  return (
    <>
      <div>
        <div className={styles.searchField} role="search">
          <SearchIcon aria-hidden="true" className={styles.searchIcon} />
          <label className={styles.visuallyHidden} htmlFor="chat-search">
            대화 내용 검색
          </label>
          <input
            id="chat-search"
            maxLength={100}
            onChange={(event) => setKeyword(event.target.value)}
            placeholder="대화 내용 검색"
            type="search"
            value={keyword}
          />
          {keyword && (
            <button
              aria-label="검색어 지우기"
              className={styles.clearButton}
              onClick={() => setKeyword("")}
              type="button"
            >
              <ClearIcon />
            </button>
          )}
        </div>
      </div>
      <div>
        {showResults && query.isLoading && (
          <p className={styles.message} role="status">
            대화를 검색하는 중...
          </p>
        )}
        {showResults && query.isError && !query.data && (
          <p className={styles.message} role="alert">
            {getApiErrorMessage(query.error, "대화를 검색하지 못했어요.")}
          </p>
        )}
        {showResults &&
          query.data &&
          (items.length === 0 ? (
            <p className={styles.message}>일치하는 대화가 없습니다.</p>
          ) : (
            <ul aria-label="검색 결과" className={styles.results}>
              {items.map((item) => (
                <li key={`${item.chatRoomId}-${item.messageId}`}>
                  <Link
                    className={styles.card}
                    href={`/chat/${item.chatRoomId}?messageId=${item.messageId}&keyword=${encodeURIComponent(debouncedKeyword)}`}
                    scroll={false}
                  >
                    <div className={styles.cardTitle}>
                      <strong>{item.title}</strong>
                      <ChevronRightIcon aria-hidden="true" />
                    </div>
                    <p className={styles.snippet}>
                      <HighlightedChatText
                        text={item.message}
                        keyword={debouncedKeyword}
                      />
                    </p>
                  </Link>
                </li>
              ))}
            </ul>
          ))}
        {showResults && (query.hasNextPage || query.isFetchNextPageError) && (
          <div className={styles.loadMore} ref={loadMoreRef}>
            <PaginationStatus
              isLoading={query.isFetchingNextPage}
              isError={query.isFetchNextPageError}
              loadingLabel="검색 결과를 더 불러오는 중"
              errorMessage="추가 검색 결과를 불러오지 못했어요."
              onRetry={() => void query.fetchNextPage()}
            />
          </div>
        )}
        {reachedLastPage && (
          <p className={styles.message} role="status">
            모든 검색 결과를 확인했어요.
          </p>
        )}
      </div>
    </>
  );
}
