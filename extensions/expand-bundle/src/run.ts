// @ts-check

import type {
  RunInput,
  FunctionRunResult,
  CartOperation,
} from "../generated/api";

/**
 * @type {FunctionRunResult}
 */
const NO_CHANGES = {
  operations: [],
};

/**
 * @param {RunInput} input
 * @returns {FunctionRunResult}
 */
export function run(input: RunInput): FunctionRunResult {
  const operations = input.cart.lines.reduce<CartOperation[]>(
    /** @param {CartOperation[]} acc */
    (acc, cartLine) => {
      const expandOperation = optionallyBuildExpandOperation(
        cartLine,
        input.presentmentCurrencyRate,
      );

      if (expandOperation) {
        return [...acc, { expand: expandOperation }];
      }

      return acc;
    },
    [],
  );

  return operations.length > 0 ? { operations } : NO_CHANGES;
}

/**
 * @param {RunInput['cart']['lines'][number]} cartLine
 * @param {number} presentmentCurrencyRate
 */
function optionallyBuildExpandOperation(
  cartLine: RunInput["cart"]["lines"][number],
  presentmentCurrencyRate: number,
) {
  if (
    cartLine.merchandise.__typename === "ProductVariant" &&
    cartLine.merchandise.product?.bundledComponentData?.value
  ) {
    const bundleData = JSON.parse(
      cartLine.merchandise.product.bundledComponentData.value,
    );

    if (!Array.isArray(bundleData) || bundleData.length === 0) {
      throw new Error("Invalid bundle composition");
    }

    const expandedCartItems = bundleData.map((component) => ({
      merchandiseId: component.id,
      quantity: component.quantity || 1,
      price: {
        adjustment: {
          fixedPricePerUnit: {
            amount: (
              parseFloat(component.price) * presentmentCurrencyRate
            ).toFixed(2),
          },
        },
      },
    }));

    return { cartLineId: cartLine.id, expandedCartItems };
  }

  return null;
}
