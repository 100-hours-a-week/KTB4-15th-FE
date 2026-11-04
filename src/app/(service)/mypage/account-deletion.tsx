"use client";

import { useRef, useState } from "react";
import { Button, ButtonBase } from "@/shared/ui/button";
import {
  Dialog,
  DialogClose,
  DialogDescription,
  DialogTitle,
} from "@/shared/ui/dialog";
import styles from "./account-deletion.module.scss";

export function AccountDeletion() {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);

  return (
    <div className={styles.container}>
      <ButtonBase
        aria-haspopup="dialog"
        className={styles.trigger}
        onClick={() => setOpen(true)}
        ref={triggerRef}
      >
        회원 탈퇴
      </ButtonBase>
      <Dialog
        className={styles.dialog}
        onCloseAutoFocus={(event) => {
          event.preventDefault();
          triggerRef.current?.focus();
        }}
        onOpenChange={setOpen}
        open={open}
      >
        <DialogTitle className={styles.title}>회원 탈퇴 안내</DialogTitle>
        <DialogDescription className={styles.description}>
          회원 탈퇴를 원하시면 아래 이메일로 연락해 주세요.
          <br />
          담당자가 확인 후 탈퇴를 진행하겠습니다.
        </DialogDescription>
        <a className={styles.email} href="mailto:master@lookddak.com">
          master@lookddak.com
        </a>
        <p className={styles.note}>
          문의 시 가입한 계정의 이메일을 함께 알려주세요.
        </p>
        <div className={styles.actions}>
          <DialogClose asChild>
            <Button fullWidth size="medium" variant="secondary">
              닫기
            </Button>
          </DialogClose>
          <a
            className={styles.mailButton}
            href="mailto:master@lookddak.com?subject=%ED%9A%8C%EC%9B%90%20%ED%83%88%ED%87%B4%20%EB%AC%B8%EC%9D%98"
          >
            메일로 문의하기
          </a>
        </div>
      </Dialog>
    </div>
  );
}
