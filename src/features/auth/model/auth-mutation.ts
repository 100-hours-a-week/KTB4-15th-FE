import { useMutation, useQueryClient } from "@tanstack/react-query";
import { clearFittingSelection } from "@/features/fitting/store/fitting-selection-store";
import { logout } from "../api/auth";

export function useLogoutMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: logout,
    onSuccess: () => {
      clearFittingSelection();
      queryClient.clear();
    },
  });
}
