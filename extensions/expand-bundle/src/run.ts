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

interface BundleComponent {
  id: string;
  quantity?: number;
  price: string;
}

/**
 * Validates and parses bundle data from JSON string
 * @param {string} bundleDataString - JSON string containing bundle data
 * @returns {BundleComponent[] | null} Parsed bundle data or null if invalid
 */
function parseBundleData(bundleDataString: string): BundleComponent[] | null {
  try {
    const bundleData = JSON.parse(bundleDataString);

    if (!Array.isArray(bundleData) || bundleData.length === 0) {
      return null;
    }

    // Validate each component has required fields
    const isValidBundle = bundleData.every(
      (component) =>
        component &&
        typeof component.id === "string" &&
        typeof component.price === "string",
    );

    return isValidBundle ? bundleData : null;
  } catch {
    return null;
  }
}

/**
 * Creates expanded cart items from bundle components
 * @param {BundleComponent[]} bundleData - Array of bundle components
 * @param {number} presentmentCurrencyRate - Currency conversion rate
 * @returns {Array} Array of expanded cart items
 */
function createExpandedCartItems(
  bundleData: BundleComponent[],
  presentmentCurrencyRate: number,
) {
  return bundleData.map((component) => ({
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
}

/**
 * @param {RunInput} input
 * @returns {FunctionRunResult}
 */
export function run(input: RunInput): FunctionRunResult {
  const operations: CartOperation[] = [];

  for (const cartLine of input.cart.lines) {
    const expandOperation = optionallyBuildExpandOperation(
      cartLine,
      input.presentmentCurrencyRate,
    );

    if (expandOperation) {
      operations.push({ expand: expandOperation });
    }
  }

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
  // Early return if not a ProductVariant
  if (cartLine.merchandise.__typename !== "ProductVariant") {
    return null;
  }

  const bundleDataString =
    cartLine.merchandise.product?.bundledComponentData?.value;
  if (!bundleDataString) {
    return null;
  }

  const bundleData = parseBundleData(bundleDataString);
  if (!bundleData) {
    console.warn(`Invalid bundle data for cart line ${cartLine.id}`);
    return null;
  }

  const expandedCartItems = createExpandedCartItems(
    bundleData,
    presentmentCurrencyRate,
  );

  return {
    cartLineId: cartLine.id,
    expandedCartItems,
  };
}
