"use client";

import { useRouter } from "next/navigation";
import { useLogoutMutation } from "@/features/auth";
import { ButtonBase } from "@/shared/ui/button";
import { getApiErrorMessage } from "@/shared/api/error";
import { showToast } from "@/shared/ui/toast";
import styles from "./account-section.module.scss";

export function AccountSection() {
  const router = useRouter();
  const logoutMutation = useLogoutMutation();

  const handleLogoutSuccess = () => {
    router.replace("/login");
    router.refresh();
  };

  const handleLogoutError = (error: Error) => {
    showToast.error(
      getApiErrorMessage(error, "로그아웃하지 못했어요. 다시 시도해 주세요."),
      { id: "logout" },
    );
  };

  const handleLogout = () => {
    logoutMutation.mutate(undefined, {
      onError: handleLogoutError,
      onSuccess: handleLogoutSuccess,
    });
  };

  return (
    <section aria-labelledby="account-title" className={styles.card}>
      <h2 className={styles.title} id="account-title">
        계정
      </h2>
      <ButtonBase
        className={styles.logoutButton}
        disabled={logoutMutation.isPending}
        onClick={handleLogout}
      >
        {logoutMutation.isPending ? "로그아웃 중..." : "로그아웃"}
      </ButtonBase>
    </section>
  );
}
