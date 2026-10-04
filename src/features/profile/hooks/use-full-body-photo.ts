import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
} from "react";
import { getApiErrorMessage } from "@/shared/api/error";
import { getLocalPhotoErrorMessage } from "../lib/full-body-image-validation";
import { useValidateFullBodyImageMutation } from "../model/full-body-image-query";

type UseFullBodyPhotoOptions = {
  onValidationChange: (validationId?: number) => void;
};

export function useFullBodyPhoto({
  onValidationChange,
}: UseFullBodyPhotoOptions) {
  const [photoUrl, setPhotoUrl] = useState<string>();
  const [errorMessage, setErrorMessage] = useState<string>();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const filePickerLockedRef = useRef(false);
  const validationMutation = useValidateFullBodyImageMutation();

  const validatePhoto = (file: File) => {
    validationMutation.mutate(file, {
      onSuccess: (result) => {
        if (!result.isValid) {
          setErrorMessage(result.message);
          return;
        }

        setErrorMessage(undefined);
        onValidationChange(result.data.validationId);
        setPhotoUrl(result.data.fullBodyImageUrl);
      },
    });
  };
  const displayedErrorMessage =
    errorMessage ??
    (validationMutation.error
      ? getApiErrorMessage(
          validationMutation.error,
          "전신 사진을 검증하지 못했어요. 다시 시도해 주세요.",
        )
      : undefined);

  useEffect(() => {
    return () => {
      if (photoUrl) URL.revokeObjectURL(photoUrl);
    };
  }, [photoUrl]);

  const handlePhotoChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    window.setTimeout(() => {
      filePickerLockedRef.current = false;
    }, 300);

    validationMutation.reset();
    onValidationChange(undefined);
    const localErrorMessage = getLocalPhotoErrorMessage(file);

    if (localErrorMessage) {
      setPhotoUrl(undefined);
      setErrorMessage(localErrorMessage);
      event.target.value = "";
      return;
    }

    setPhotoUrl(URL.createObjectURL(file));
    setErrorMessage(undefined);
    validatePhoto(file);
  };

  const handlePhotoPickerCancel = useCallback(async () => {
    filePickerLockedRef.current = false;
    let isCameraPermissionDenied = false;

    try {
      const permission = await navigator.permissions?.query({
        name: "camera" as PermissionName,
      });
      isCameraPermissionDenied = permission?.state === "denied";
    } catch {
      // Some browsers do not expose camera permission state for file inputs.
    }

    setErrorMessage(
      isCameraPermissionDenied
        ? "카메라 권한이 필요해요. 설정에서 권한을 허용하거나 로컬 사진 등록을 선택해주세요."
        : "사진 등록이 취소되었습니다.",
    );
  }, []);

  useEffect(() => {
    const input = fileInputRef.current;
    if (!input) return;

    const handleCancel = () => void handlePhotoPickerCancel();
    input.addEventListener("cancel", handleCancel);

    return () => input.removeEventListener("cancel", handleCancel);
  }, [handlePhotoPickerCancel]);

  const openPhotoPicker = () => {
    if (filePickerLockedRef.current || validationMutation.isPending) return;

    const input = fileInputRef.current;
    if (!input) return;

    filePickerLockedRef.current = true;
    window.addEventListener(
      "focus",
      () => {
        window.setTimeout(() => {
          filePickerLockedRef.current = false;
        }, 300);
      },
      { once: true },
    );
    input.value = "";
    input.click();
  };

  return {
    displayedErrorMessage,
    fileInputRef,
    handlePhotoChange,
    isPending: validationMutation.isPending,
    openPhotoPicker,
    photoUrl,
  };
}
