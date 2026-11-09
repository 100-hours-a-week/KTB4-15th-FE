import { useMutation } from "@tanstack/react-query";

export const fullBodyImageMutationKey = [
  "member",
  "profile",
  "full-body-image",
] as const;

export function useValidateFullBodyImageMutation() {
  return useMutation({
    mutationKey: [...fullBodyImageMutationKey, "validate"],
    mutationFn: async (file: File) => {
      const { validateFullBodyImage } = await import("../api/full-body-image");
      return validateFullBodyImage(file);
    },
  });
}
