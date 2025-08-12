import type {
  RunInput,
  FunctionRunResult,
  CartLine,
  CartOperation,
} from "../generated/api";

const NO_CHANGES: FunctionRunResult = {
  operations: [],
};

// Configuration constants
const UPDATE_CONFIG = {
  DEFAULT_IMAGE_URL:
    "https://cdn.shopify.com/s/files/1/0800/5133/9544/files/Main.jpg?v=1690880894",
  DEFAULT_PRICE: "99.99",
  DEFAULT_TITLE: "Product with updated image",
} as const;

interface CartLineWithAttributes extends CartLine {
  noImage?: { value?: string };
}

/**
 * Checks if a cart line should have its image updated
 * @param line - Cart line to check
 * @returns True if the line needs image update
 */
function shouldUpdateImage(line: CartLine): boolean {
  const lineWithAttrs = line as CartLineWithAttributes;
  const noImageValue = lineWithAttrs.noImage?.value;

  return noImageValue === "true";
}

/**
 * Creates an update operation for a cart line
 * @param cartLineId - ID of the cart line to update
 * @returns Update operation object
 */
function createUpdateOperation(cartLineId: string) {
  return {
    update: {
      cartLineId,
      title: UPDATE_CONFIG.DEFAULT_TITLE,
      image: {
        url: UPDATE_CONFIG.DEFAULT_IMAGE_URL,
      },
      price: {
        adjustment: {
          fixedPricePerUnit: {
            amount: UPDATE_CONFIG.DEFAULT_PRICE,
          },
        },
      },
    },
  };
}

/**
 * Filters cart lines that need image updates
 * @param cartLines - Array of cart lines
 * @returns Array of cart lines that need updates
 */
function getLinesToUpdate(cartLines: CartLine[]): CartLine[] {
  return cartLines.filter(shouldUpdateImage);
}

export function run(input: RunInput): FunctionRunResult {
  const linesToUpdate = getLinesToUpdate(input.cart.lines as CartLine[]);

  if (linesToUpdate.length === 0) {
    return NO_CHANGES;
  }

  const operations: CartOperation[] = linesToUpdate.map((line) =>
    createUpdateOperation(line.id),
  );

  return { operations };
}
