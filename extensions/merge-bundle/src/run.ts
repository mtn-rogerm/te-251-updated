import type {
  RunInput,
  FunctionRunResult,
  CartOperation,
} from "../generated/api";

const NO_CHANGES: FunctionRunResult = {
  operations: [],
};

// Bundle configuration constants
const BUNDLE_CONFIG = {
  MIN_ITEMS_FOR_MERGE: 2,
  PARENT_VARIANT_ID: "gid://shopify/ProductVariant/50189154681112",
  DISCOUNT_PERCENTAGE: "10.0",
  DEFAULT_IMAGE_URL:
    "https://cdn.shopify.com/s/files/1/0800/5133/9544/products/wax-special.png?v=1690880896",
} as const;

interface BundleLineItem {
  id: string;
  quantity: number;
}

type BundleGroups = Record<string, BundleLineItem[]>;

/**
 * Extracts bundle ID from a cart line item
 * @param line - Cart line item
 * @returns Bundle ID or null if not found
 */
function extractBundleId(
  line: RunInput["cart"]["lines"][number],
): string | null {
  if (line.merchandise.__typename !== "ProductVariant") {
    return null;
  }

  return (
    line.merchandise.bundleId?.value ||
    line.merchandise.product.bundleId?.value ||
    null
  );
}

/**
 * Groups cart lines by bundle ID
 * @param cartLines - Array of cart lines
 * @returns Object with bundle IDs as keys and arrays of line items as values
 */
function groupLinesByBundleId(
  cartLines: RunInput["cart"]["lines"],
): BundleGroups {
  const bundleGroups: BundleGroups = {};

  for (const line of cartLines) {
    const bundleId = extractBundleId(line);
    if (!bundleId) continue;

    if (!bundleGroups[bundleId]) {
      bundleGroups[bundleId] = [];
    }

    bundleGroups[bundleId].push({
      id: line.id,
      quantity: line.quantity,
    });
  }

  return bundleGroups;
}

/**
 * Creates a merge operation for a bundle
 * @param bundleId - The bundle identifier
 * @param lines - Array of line items to merge
 * @returns Merge operation object
 */
function createMergeOperation(bundleId: string, lines: BundleLineItem[]) {
  return {
    cartLines: lines.map((line) => ({
      cartLineId: line.id,
      quantity: line.quantity,
    })),
    parentVariantId: BUNDLE_CONFIG.PARENT_VARIANT_ID,
    title: `Custom Bundle (${bundleId})`,
    price: {
      percentageDecrease: {
        value: BUNDLE_CONFIG.DISCOUNT_PERCENTAGE,
      },
    },
    image: {
      url: BUNDLE_CONFIG.DEFAULT_IMAGE_URL,
    },
    attributes: [
      {
        key: "bundleId",
        value: bundleId,
      },
    ],
  };
}

/**
 * Filters bundle groups to only include those eligible for merging
 * @param bundleGroups - Object containing all bundle groups
 * @returns Array of [bundleId, lines] tuples for eligible bundles
 */
function getEligibleBundles(
  bundleGroups: BundleGroups,
): [string, BundleLineItem[]][] {
  return Object.entries(bundleGroups).filter(
    ([, lines]) => lines.length >= BUNDLE_CONFIG.MIN_ITEMS_FOR_MERGE,
  );
}

export function run(input: RunInput): FunctionRunResult {
  const bundleGroups = groupLinesByBundleId(input.cart.lines);
  const eligibleBundles = getEligibleBundles(bundleGroups);

  if (eligibleBundles.length === 0) {
    return NO_CHANGES;
  }

  const operations: CartOperation[] = eligibleBundles.map(
    ([bundleId, lines]) => ({
      merge: createMergeOperation(bundleId, lines),
    }),
  );

  return { operations };
}
