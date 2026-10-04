import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { memberMeQueryOptions } from "@/features/member";
import { getApiErrorMessage } from "@/shared/api/error";
import { showToast } from "@/shared/ui/toast";
import type { MemberProfileCreateRequest } from "../schema/member-profile";
import { useCreateMemberProfileMutation } from "../model/member-profile-query";

const COMPLETION_DURATION_MS = 1700;

export function useProfileSetup() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [isComplete, setIsComplete] = useState(false);
  const completionTimerRef = useRef<number>(undefined);
  const mutation = useCreateMemberProfileMutation();

  useEffect(
    () => () => {
      if (completionTimerRef.current) {
        window.clearTimeout(completionTimerRef.current);
      }
    },
    [],
  );

  const submit = (values: MemberProfileCreateRequest) => {
    mutation.mutate(values, {
      onSuccess: () => {
        setIsComplete(true);
        router.prefetch("/chat");
        completionTimerRef.current = window.setTimeout(() => {
          queryClient.setQueryData(memberMeQueryOptions.queryKey, {
            profileCompleted: true,
          });
          router.replace("/chat");
          router.refresh();
        }, COMPLETION_DURATION_MS);
      },
      onError: (error) => {
        showToast.error(
          getApiErrorMessage(
            error,
            "기본 정보를 등록하지 못했어요. 다시 시도해 주세요.",
          ),
          { id: "profile-setup" },
        );
      },
    },);
  };

  return {
    isComplete,
    isPending: mutation.isPending,
    reset: mutation.reset,
    submit,
  };
}
