"use client";

import { HTTPError } from "ky";
import { useRouter } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import { getMemberMe } from "@/features/member/api/member";
import { RefreshUnauthorizedError } from "@/shared/api/client";
import { ApiError } from "@/shared/api/error";

type LandingStartButtonProps = { className?: string };

export function LandingStartButton({ className }: LandingStartButtonProps) {
  const router = useRouter();
  const { mutate, isPending } = useMutation({
    mutationFn: getMemberMe,
    retry: false,
    onSuccess: (member) => {
      router.push(member.profileCompleted ? "/chat" : "/profile/setup");
    },
    onError: (error) => {
      if (
        error instanceof RefreshUnauthorizedError ||
        (error instanceof ApiError && error.status === 401) ||
        (error instanceof HTTPError && error.response.status === 401)
      ) {
        router.push("/signup");
        return;
      }
      router.push("/login");
    },
  });

  return (
    <button
      type="button"
      className={className}
      disabled={isPending}
      aria-busy={isPending}
      onClick={() => mutate()}
    >
      {isPending ? "확인 중…" : "룩딱 시작하기"}
    </button>
  );
}
