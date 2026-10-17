"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ApiError, getApiErrorMessage } from "@/shared/api/error";
import { Button } from "@/shared/ui/button";
import { RefreshIcon } from "@/shared/ui/icon";
import { InputField } from "@/shared/ui/input-field";
import { LoadingMessage } from "@/shared/ui/loading-message";
import { showToast } from "@/shared/ui/toast";
import {
  fittingTempResultQueryOptions,
  useCreateFittingResultMutation,
  useMarkFittingResultViewedMutation,
} from "../../model/fitting-query";
import type { FittingTempResult } from "../../schema/fitting-job";
import {
  FITTING_OUTFIT_NAME_MAX_LENGTH,
  fittingOutfitNameSchema,
} from "../../schema/fitting-result";
import { FittingResultView } from "./fitting-result-view";
import styles from "./fitting-temp-result-screen.module.scss";

type SaveState = "idle" | "saved-confirmation" | "saved";

const SAVE_CONFIRMATION_DURATION = 500;

function FittingTempResultContent({ result }: { result: FittingTempResult }) {
  const router = useRouter();
  const [outfitName, setOutfitName] = useState(result.outfitName);
  const [nameError, setNameError] = useState("");
  const [saveState, setSaveState] = useState<SaveState>(
    result.saved ? "saved" : "idle",
  );
  const createFittingResultMutation = useCreateFittingResultMutation();

  useEffect(() => {
    if (saveState !== "saved-confirmation") return;

    const timer = window.setTimeout(
      () => setSaveState("saved"),
      SAVE_CONFIRMATION_DURATION,
    );

    return () => window.clearTimeout(timer);
  }, [saveState]);

  const handleSave = () => {
    if (saveState !== "idle") return;

    const normalizedOutfitName = outfitName.trim();
    if (!fittingOutfitNameSchema.safeParse(normalizedOutfitName).success) {
      setNameError("코디명을 1자 이상 입력해 주세요.");
      return;
    }

    setNameError("");
    createFittingResultMutation.mutate(
      { fittingJobId: result.fittingJobId, outfitName: normalizedOutfitName },
      {
        onError: (error) => {
          const message =
            error instanceof ApiError &&
            error.code === "FITTING_RESULT_ALREADY_SAVED"
              ? "이미 저장된 가상 피팅 결과예요."
              : getApiErrorMessage(
                  error,
                  "가상 피팅 결과를 저장하지 못했어요.",
                );
          showToast.error(message, { id: "create-fitting-result" });
        },
        onSuccess: () => {
          setOutfitName(normalizedOutfitName);
          setSaveState("saved-confirmation");
          showToast.success("가상 피팅 결과를 저장했어요.", {
            id: "create-fitting-result",
          });
        },
      },
    );
  };

  return (
    <FittingResultView
      actions={
        <>
          <Button
            disabled={saveState === "saved-confirmation"}
            fullWidth
            isLoading={createFittingResultMutation.isPending}
            onClick={
              saveState === "saved"
                ? () => router.push("/fitting-results")
                : handleSave
            }
            size="large"
            type="button"
          >
            {saveState === "idle"
              ? "가상 피팅 저장"
              : saveState === "saved-confirmation"
                ? "저장 완료"
                : "목록으로 가기"}
          </Button>
          <Link className={styles.retryLink} href="/fitting">
            <RefreshIcon />
            다른 조합 피팅하기
          </Link>
        </>
      }
      outfitName={
        <InputField
          className={styles.outfitName}
          disabled={createFittingResultMutation.isPending}
          endAdornment={
            <span className={styles.nameLength}>
              {outfitName.length}/{FITTING_OUTFIT_NAME_MAX_LENGTH}
            </span>
          }
          error={nameError || undefined}
          id="fitting-outfit-name"
          label="코디명"
          maxLength={FITTING_OUTFIT_NAME_MAX_LENGTH}
          onChange={(event) => {
            setOutfitName(
              event.target.value.slice(0, FITTING_OUTFIT_NAME_MAX_LENGTH),
            );
            setNameError("");
          }}
          readOnly={saveState !== "idle"}
          reserveHelperSpace={false}
          value={outfitName}
        />
      }
      result={result}
    />
  );
}

export function FittingTempResultScreen({
  fittingJobId,
}: {
  fittingJobId: number;
}) {
  const viewedRequestedJobIdRef = useRef<number | null>(null);
  const query = useQuery(fittingTempResultQueryOptions(fittingJobId));
  const markViewedMutation = useMarkFittingResultViewedMutation();

  useEffect(() => {
    if (
      !query.data ||
      query.data.resultViewed ||
      viewedRequestedJobIdRef.current === fittingJobId
    ) {
      return;
    }

    viewedRequestedJobIdRef.current = fittingJobId;
    markViewedMutation.mutate(fittingJobId);
  }, [fittingJobId, markViewedMutation, query.data]);

  if (query.isPending || query.isError) {
    return (
      <main className={styles.state}>
        {query.isPending ? (
          <LoadingMessage>가상 피팅 결과를 불러오고 있어요</LoadingMessage>
        ) : (
          <div role="alert">
            <p>가상 피팅 결과를 불러오지 못했어요.</p>
            <Button
              isLoading={query.isFetching}
              onClick={() => void query.refetch()}
              size="small"
              variant="secondary"
            >
              다시 시도
            </Button>
          </div>
        )}
      </main>
    );
  }

  return <FittingTempResultContent result={query.data} />;
}
