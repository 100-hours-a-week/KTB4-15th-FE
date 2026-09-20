"use client";

import {
  useLayoutEffect,
  useRef,
  useState,
  type FormEvent,
  type KeyboardEvent,
} from "react";
import { IconButton } from "@/shared/ui/button";
import styles from "./chat-composer.module.scss";

const MAX_LENGTH = 500;
const COUNTER_VISIBLE_LENGTH = 450;

export interface ChatComposerProps {
  disabled?: boolean;
  isSubmitting: boolean;
  onSubmit: (content: string) => Promise<void>;
}

function SendIcon() {
  return (
    <svg aria-hidden="true" fill="none" viewBox="0 0 24 24">
      <path
        d="M12 20V4m0 0L5.5 10.5M12 4l6.5 6.5"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
      />
    </svg>
  );
}

export function ChatComposer({
  disabled = false,
  isSubmitting,
  onSubmit,
}: ChatComposerProps) {
  const [content, setContent] = useState("");
  const [isMultiline, setIsMultiline] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const trimmedContent = content.trim();
  const isInputDisabled = disabled || isSubmitting;
  const canSubmit = !isInputDisabled && trimmedContent.length > 0;

  useLayoutEffect(() => {
    const textarea = textareaRef.current;

    if (!textarea) {
      return;
    }

    textarea.style.height = "0px";
    textarea.style.height = `${textarea.scrollHeight}px`;
    setIsMultiline(textarea.scrollHeight > 28);
  }, [content]);

  const submit = async () => {
    if (!canSubmit) {
      return;
    }

    await onSubmit(trimmedContent);
    setContent("");
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    void submit().catch(() => undefined);
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    const isDesktopKeyboard = window.matchMedia(
      "(hover: hover) and (pointer: fine)",
    ).matches;

    if (
      event.key !== "Enter" ||
      event.shiftKey ||
      event.nativeEvent.isComposing ||
      !isDesktopKeyboard
    ) {
      return;
    }

    event.preventDefault();
    event.currentTarget.form?.requestSubmit();
  };

  return (
    <div className={styles.composerArea}>
      <form
        aria-label="채팅 메시지 입력"
        className={`${styles.composer} ${isMultiline ? styles.multiline : ""}`}
        onSubmit={handleSubmit}
      >
        <div className={styles.inputArea}>
          <textarea
            aria-label={`메시지, 최대 ${MAX_LENGTH}자`}
            className={styles.textarea}
            disabled={isInputDisabled}
            maxLength={MAX_LENGTH}
            onChange={(event) => setContent(event.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="오늘 필요한 옷을 입력하세요"
            ref={textareaRef}
            rows={1}
            value={content}
          />
        </div>
        <div className={styles.actions}>
          {content.length >= COUNTER_VISIBLE_LENGTH && (
            <span aria-live="polite" className={styles.counter}>
              {content.length}/{MAX_LENGTH}
            </span>
          )}
          <IconButton
            aria-label={isSubmitting ? "메시지 전송 중" : "메시지 전송"}
            className={styles.submitButton}
            disabled={!canSubmit}
            size="small"
            type="submit"
            variant="standard"
          >
            <SendIcon />
          </IconButton>
        </div>
      </form>
    </div>
  );
}
