import type { RunInput, FunctionRunResult } from "../generated/api";

const NO_CHANGES: FunctionRunResult = {
  operations: [],
};

// Gift configuration mapping based on customer order count
const GIFT_VARIANTS_BY_ORDER_COUNT: Record<number, string> = {
  0: "gid://shopify/ProductVariant/45962997924120",
  1: "gid://shopify/ProductVariant/45962997858584",
  2: "gid://shopify/ProductVariant/45962997825816",
};

function createExpandOperation(
  cartLineId: string,
  productTitle: string,
  giftVariantId: string,
) {
  return {
    operations: [
      {
        expand: {
          title: `${productTitle} with gift`,
          cartLineId,
          expandedCartItems: [
            {
              merchandiseId: giftVariantId,
              quantity: 1,
            },
          ],
        },
      },
    ],
  };
}

export function run(input: RunInput): FunctionRunResult {
  const numberOfCustomerOrders =
    input.cart.buyerIdentity?.customer?.numberOfOrders;
  const firstCartLineItem = input.cart.lines.filter((line) => {
    return line.noImage?.value !== "true" && line.merchandise.__typename === "ProductVariant" && line.merchandise.product?.bundledComponentData?.value !== "" && !line.merchandise.bundleId?.value && !line.merchandise.product.bundleId?.value
  })[0];

  if (!firstCartLineItem || firstCartLineItem.merchandise.__typename !== "ProductVariant") {
    return NO_CHANGES;
  }

  // Check if customer qualifies for a gift based on order count
  if (
    numberOfCustomerOrders !== undefined &&
    numberOfCustomerOrders in GIFT_VARIANTS_BY_ORDER_COUNT
  ) {
    const giftVariantId = GIFT_VARIANTS_BY_ORDER_COUNT[numberOfCustomerOrders];
    const productTitle = firstCartLineItem.merchandise.product.title;

    return createExpandOperation(
      firstCartLineItem.id,
      productTitle,
      giftVariantId,
    );
  }

  return NO_CHANGES;
}
