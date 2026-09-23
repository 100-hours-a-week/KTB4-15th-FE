"use client";

import { useRef, useState, type FormEvent } from "react";
import { Button } from "@/shared/ui/button";
import {
  Dialog,
  DialogClose,
  DialogDescription,
  DialogTitle,
} from "@/shared/ui/dialog";
import { ClearIcon } from "@/shared/ui/icon";
import styles from "./chat-dialogs.module.scss";

type DialogLifecycleProps = {
  onExit: () => void;
  onOpenChange: (open: boolean) => void;
  open: boolean;
};

type RenameChatDialogProps = DialogLifecycleProps & {
  initialTitle: string;
  onConfirm: (title: string) => void;
};

export function RenameChatDialog({
  initialTitle,
  onConfirm,
  onExit,
  onOpenChange,
  open,
}: RenameChatDialogProps) {
  const [title, setTitle] = useState(initialTitle);
  const inputRef = useRef<HTMLInputElement>(null);
  const trimmedTitle = title.trim();

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!trimmedTitle) return;

    onConfirm(trimmedTitle);
  };

  return (
    <Dialog
      className={`${styles.dialog} ${styles.renameDialog}`}
      onExit={onExit}
      onOpenAutoFocus={(event) => {
        event.preventDefault();
        inputRef.current?.focus();
        inputRef.current?.select();
      }}
      onOpenChange={onOpenChange}
      open={open}
    >
      <form onSubmit={handleSubmit}>
        <DialogTitle className={styles.title}>채팅 이름 변경</DialogTitle>
        <DialogDescription className={styles.description}>
          나중에 쉽게 찾을 수 있는 이름을 지어주세요.
        </DialogDescription>

        <div className={styles.inputField}>
          <label className={styles.visuallyHidden} htmlFor="chat-title">
            채팅 이름
          </label>
          <input
            id="chat-title"
            maxLength={50}
            onChange={(event) => setTitle(event.target.value)}
            ref={inputRef}
            value={title}
          />
          {title && (
            <button
              aria-label="채팅 이름 지우기"
              className={styles.clearButton}
              onClick={() => {
                setTitle("");
                inputRef.current?.focus();
              }}
              type="button"
            >
              <ClearIcon />
            </button>
          )}
        </div>

        <div className={styles.actions}>
          <DialogClose asChild>
            <Button fullWidth size="medium" variant="secondary">
              취소
            </Button>
          </DialogClose>
          <Button
            disabled={!trimmedTitle}
            fullWidth
            size="medium"
            type="submit"
          >
            변경 완료
          </Button>
        </div>
      </form>
    </Dialog>
  );
}

type DeleteChatDialogProps = DialogLifecycleProps & {
  onConfirm: () => void;
};

export function DeleteChatDialog({
  onConfirm,
  onExit,
  onOpenChange,
  open,
}: DeleteChatDialogProps) {
  return (
    <Dialog
      className={`${styles.dialog} ${styles.deleteDialog}`}
      onExit={onExit}
      onOpenChange={onOpenChange}
      open={open}
    >
      <DialogTitle className={styles.title}>
        채팅을 삭제하시겠습니까?
      </DialogTitle>
      <DialogDescription className={styles.description}>
        삭제된 대화 내역과 추천 코드는 복구할 수 없습니다.
      </DialogDescription>

      <div className={styles.actions}>
        <DialogClose asChild>
          <Button fullWidth size="medium" variant="secondary">
            취소
          </Button>
        </DialogClose>
        <Button fullWidth onClick={onConfirm} size="medium" variant="danger">
          삭제하기
        </Button>
      </div>
    </Dialog>
  );
}
