import { createContext, type Dispatch, type SetStateAction } from "react";
import type { RecommendedProductResponse } from "../../schema/chat";

type ProductState = Partial<
  Pick<
    RecommendedProductResponse,
    "isWishlisted" | "wishlistId" | "isFittingCandidate" | "fittingCandidateId"
  >
> & { wishlistPending?: boolean; fittingPending?: boolean };

export const ChatProductState = createContext<{
  products: Record<number, ProductState>;
  setProducts: Dispatch<SetStateAction<Record<number, ProductState>>>;
} | null>(null);
