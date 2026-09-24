"use client";

import { useRouter } from "next/navigation";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { logout } from "@/features/auth/api/auth";
import { ButtonBase } from "@/shared/ui/button";
import styles from "./account-section.module.scss";

export function AccountSection() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const logoutMutation = useMutation({
    mutationFn: logout,
    onSuccess: () => {
      queryClient.clear();
      router.replace("/login");
      router.refresh();
    },
  });

  return (
    <section aria-labelledby="account-title" className={styles.card}>
      <h2 className={styles.title} id="account-title">
        계정
      </h2>
      <ButtonBase
        className={styles.logoutButton}
        disabled={logoutMutation.isPending}
        onClick={() => logoutMutation.mutate()}
      >
        {logoutMutation.isPending ? "로그아웃 중..." : "로그아웃"}
      </ButtonBase>
      {logoutMutation.isError && (
        <p className={styles.error} role="alert">
          로그아웃하지 못했어요. 다시 시도해 주세요.
        </p>
      )}
    </section>
  );
}
