import type {
  RunInput,
  FunctionRunResult,
} from "../generated/api";

const NO_CHANGES: FunctionRunResult = {
  operations: [],
};

export function run(input: RunInput): FunctionRunResult {
  const bundleGroups = {};

  for (const line of input.cart.lines) {
    if (line.merchandise.__typename !== "ProductVariant") continue;
    const bundleId = line.merchandise.bundleId?.value || line.merchandise.product.bundleId?.value;
    if (!bundleId) continue;
    if (!bundleGroups[bundleId]) bundleGroups[bundleId] = [];
    bundleGroups[bundleId].push({ id: line.id, quantity: line.quantity });
  }

  /** @type {CartOperation[]} */
  const operations = [];


  // For each group with at least 2 lines, merge into a bundle
  for (const [bundleId, lines] of Object.entries(bundleGroups)) {
    if (lines.length < 2) continue;

    /** @type {MergeOperation} */
    const mergeOp = {
      cartLines: lines.map(l => ({
        cartLineId: l.id,
        quantity: l.quantity,
      })),
      parentVariantId: "gid://shopify/ProductVariant/50189154681112",
      title: "Custom Bundle",
      price: {
        percentageDecrease: {
          value: "10.0",
        },
      },
      image: {
        url: "https://cdn.shopify.com/s/files/1/0800/5133/9544/products/wax-special.png?v=1690880896"
      },
      attributes: [],
    };

    operations.push({ merge: mergeOp });
  }

  return operations.length > 0 ? { operations } : NO_CHANGES;
};
