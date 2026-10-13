import Image from "next/image";
import type { ProductItemType } from "@/shared/schema/product";
import styles from "./fitting-product-combination.module.scss";

type FittingProduct = {
  productId: number;
  itemType: ProductItemType;
  productName: string;
  productImageUrl: string;
  purchaseUrl?: string;
};

type FittingProductCombinationProps = {
  compact?: boolean;
  products: FittingProduct[];
  onProductClick?: (productId: number) => void;
};

function ProductContent({ product }: { product: FittingProduct }) {
  return (
    <>
      <span className={styles.productImageArea}>
        <Image
          alt=""
          className={styles.productImage}
          fill
          sizes="48px"
          src={product.productImageUrl}
          unoptimized
        />
      </span>
      <span>
        <small>{product.itemType === "TOP" ? "상의" : "하의"}</small>
        <strong>{product.productName}</strong>
      </span>
    </>
  );
}

export function FittingProductCombination({
  compact = false,
  products,
  onProductClick,
}: FittingProductCombinationProps) {
  if (products.length === 0) return null;

  const orderedProducts = (["TOP", "BOTTOM"] as const).flatMap((itemType) =>
    products.filter((product) => product.itemType === itemType),
  );

  return (
    <section
      className={`${styles.productsSection} ${compact ? styles.compact : ""}`}
    >
      <h2>선택한 상품 조합</h2>
      <div className={styles.products}>
        {orderedProducts.map((product) =>
          product.purchaseUrl ? (
            <a
              aria-label={`${product.productName} 구매 페이지로 이동`}
              className={styles.productCard}
              href={product.purchaseUrl}
              key={product.productId}
              onClick={() => onProductClick?.(product.productId)}
              rel="noopener noreferrer"
              target="_blank"
            >
              <ProductContent product={product} />
            </a>
          ) : (
            <article className={styles.productCard} key={product.productId}>
              <ProductContent product={product} />
            </article>
          ),
        )}
      </div>
    </section>
  );
}
