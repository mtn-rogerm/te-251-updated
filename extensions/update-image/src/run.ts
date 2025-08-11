import type {
  RunInput,
  FunctionRunResult,
  CartLine,
  CartOperation
} from "../generated/api";

const NO_CHANGES: FunctionRunResult = {
  operations: [],
};

interface CartLineWithAttributes extends CartLine {
  noImage?: { value?: string };
}

const DEFAULT_IMAGE_URL =
  "https://cdn.shopify.com/s/files/1/0800/5133/9544/files/Main.jpg?v=1690880894";

export function run(input: RunInput): FunctionRunResult {
  const operations: CartOperation[] = [];

  (input.cart.lines as CartLineWithAttributes[]).forEach(line => {
    const isNoImage:string = line.noImage?.value || '';

    if (isNoImage === 'true') {
      operations.push({
        update: {
          cartLineId: line.id,
          title: "Product with updated image",
          image: {
            url: DEFAULT_IMAGE_URL
          },
          price: {
            adjustment: {
              fixedPricePerUnit: {
                amount: "99.99"
              }
            }
          }
        }
      })
    }
  });

  if (operations.length > 0) {
    return { operations };
  } else {
    return NO_CHANGES;
  }
}
