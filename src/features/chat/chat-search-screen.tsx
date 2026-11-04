"use client";

import Link from "next/link";
import { getApiErrorMessage } from "@/shared/api/error";
import { BackButton, Header, HeaderTitle } from "@/shared/ui/header";
import { ChevronRightIcon, ClearIcon, SearchIcon } from "@/shared/ui/icon";
import { splitByKeyword } from "./lib/chat-search";
import { useChatSearch } from "./model/use-chat-search";
import styles from "./chat-search-screen.module.scss";

export function ChatSearchScreen() {
  const { keyword, setKeyword, debouncedKeyword, showResults, query } =
    useChatSearch();

  return (
    <>
      <Header
        left={<BackButton />}
        center={<HeaderTitle>채팅 검색</HeaderTitle>}
      />
      <div className={styles.searchArea}>
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
      <main className={styles.main}>
        {showResults && query.isFetching && (
          <p className={styles.message} role="status">
            대화를 검색하는 중...
          </p>
        )}
        {showResults && query.isError && (
          <p className={styles.message} role="alert">
            {getApiErrorMessage(query.error, "대화를 검색하지 못했어요.")}
          </p>
        )}
        {showResults &&
          query.isSuccess &&
          (query.data.items.length === 0 ? (
            <p className={styles.message}>일치하는 대화가 없습니다.</p>
          ) : (
            <ul aria-label="검색 결과" className={styles.results}>
              {query.data.items.map((item) => (
                <li key={`${item.chatRoomId}-${item.messageId}`}>
                  <Link
                    className={styles.card}
                    href={`/chat/${item.chatRoomId}`}
                  >
                    <div className={styles.cardTitle}>
                      <strong>{item.title}</strong>
                      <ChevronRightIcon aria-hidden="true" />
                    </div>
                    <p className={styles.snippet}>
                      &quot;
                      {splitByKeyword(item.message, debouncedKeyword).map(
                        (part, index) =>
                          part.highlighted ? (
                            <mark key={index}>{part.text}</mark>
                          ) : (
                            part.text
                          ),
                      )}
                      &quot;
                    </p>
                  </Link>
                </li>
              ))}
            </ul>
          ))}
      </main>
    </>
  );
}
