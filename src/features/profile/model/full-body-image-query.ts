import { useMutation } from "@tanstack/react-query";
import { validateFullBodyImage } from "../api/full-body-image";

export function useValidateFullBodyImageMutation() {
  return useMutation({ mutationFn: validateFullBodyImage });
}
