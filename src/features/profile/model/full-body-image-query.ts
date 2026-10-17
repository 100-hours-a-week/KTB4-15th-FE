import { useMutation } from "@tanstack/react-query";
import { validateFullBodyImage } from "../api/full-body-image";

export const fullBodyImageMutationKey = [
  "member",
  "profile",
  "full-body-image",
] as const;

export function useValidateFullBodyImageMutation() {
  return useMutation({
    mutationKey: [...fullBodyImageMutationKey, "validate"],
    mutationFn: validateFullBodyImage,
  });
}
