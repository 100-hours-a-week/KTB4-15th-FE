"use client";

import { useMutation } from "@tanstack/react-query";
import Link from "next/link";
import { FormEvent, useState } from "react";
import { searchChatRooms } from "@/features/chat/api/chat";
import {
  groupChatSearchItems,
  splitByKeyword,
} from "@/features/chat/lib/chat-search";
import { getApiErrorMessage } from "@/shared/api/error";
import { BackButton } from "@/shared/ui/header";
import { ChevronRightIcon, ClearIcon, SearchIcon } from "@/shared/ui/icon";
import styles from "./page.module.scss";

export default function ChatSearchPage() {
  const [keyword, setKeyword] = useState("");
  const [validationMessage, setValidationMessage] = useState("");
  const searchMutation = useMutation({ mutationFn: searchChatRooms });
  const groups = searchMutation.data
    ? groupChatSearchItems(searchMutation.data.items)
    : [];

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmedKeyword = keyword.trim();

    if (!trimmedKeyword) {
      setValidationMessage("검색어를 입력해주세요.");
      return;
    }

    setValidationMessage("");
    searchMutation.mutate(trimmedKeyword);
  };

  return (
    <>
      <header className={styles.header}>
        <BackButton />
        <form className={styles.searchForm} onSubmit={handleSubmit}>
          <button
            aria-label="대화 검색"
            className={styles.searchButton}
            disabled={searchMutation.isPending}
            type="submit"
          >
            <SearchIcon />
          </button>
          <label className={styles.visuallyHidden} htmlFor="chat-search">
            대화 내용 검색
          </label>
          <input
            autoFocus
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
        </form>
      </header>
      <main className={styles.main}>
        {validationMessage && (
          <p className={styles.message} role="alert">
            {validationMessage}
          </p>
        )}

        {searchMutation.isPending && (
          <p className={styles.message} role="status">
            대화를 검색하는 중...
          </p>
        )}

        {searchMutation.isError && (
          <p className={styles.message} role="alert">
            {getApiErrorMessage(
              searchMutation.error,
              "대화를 검색하지 못했어요.",
            )}
          </p>
        )}

        {searchMutation.isSuccess &&
          (groups.length === 0 ? (
            <p className={styles.message}>일치하는 대화가 없습니다.</p>
          ) : (
            <>
              <p className={styles.summary}>
                <span aria-hidden="true" /> 대화 내역{" "}
                <strong>{groups.length}곳</strong>
                에서 찾았어요
              </p>
              <ul className={styles.results}>
                {groups.map((group) => (
                  <li key={group.chatRoomId}>
                    <Link href={`/chat/${group.chatRoomId}`}>
                      <div className={styles.cardTitle}>
                        <strong>{group.title}</strong>
                        <ChevronRightIcon />
                      </div>
                      <div className={styles.matches}>
                        {group.messages.map((item) => (
                          <p key={item.messageId}>
                            &quot;
                            {splitByKeyword(
                              item.message,
                              searchMutation.variables,
                            ).map((part, index) =>
                              part.highlighted ? (
                                <mark key={index}>{part.text}</mark>
                              ) : (
                                part.text
                              ),
                            )}
                            &quot;
                          </p>
                        ))}
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            </>
          ))}
      </main>
    </>
  );
}
