import { apiClient } from "@/shared/api/client";

export async function recordPurchaseLinkClick(productId: number) {
  await apiClient.post(`products/${productId}/purchase-link-clicks`);
}
