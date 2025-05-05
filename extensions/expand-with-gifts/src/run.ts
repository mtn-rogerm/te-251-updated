import type {
  RunInput,
  FunctionRunResult,
} from "../generated/api";

const NO_CHANGES: FunctionRunResult = {
  operations: [],
};

export function run(input: RunInput): FunctionRunResult {
  const numberOfCustomerOrders = input.cart.buyerIdentity?.customer?.numberOfOrders;
  const firstCartLineItem = input.cart.lines[0];
  switch (numberOfCustomerOrders) {
    case 0:
      return {
        operations: [
          {
            expand: {
              title: `${firstCartLineItem.merchandise.title || firstCartLineItem.merchandise.product.title} with gift`,
              cartLineId: firstCartLineItem.id,
              expandedCartItems: [{
                merchandiseId: "gid://shopify/ProductVariant/45962997924120",
                quantity: 1
              }]
            }
          }
        ]
      }
    case 1:
      return {
        operations: [
          {
            expand: {
              title: `${firstCartLineItem.merchandise.title || firstCartLineItem.merchandise.product.title} with gift`,
              cartLineId: firstCartLineItem.id,
              expandedCartItems: [{
                merchandiseId: "gid://shopify/ProductVariant/45962997858584",
                quantity: 1
              }]
            }
          }
        ]
      }
    case 2:
      return {
        operations: [
          {
            expand: {
              title: `${firstCartLineItem.merchandise.title || firstCartLineItem.merchandise.product.title} with gift`,
              cartLineId: firstCartLineItem.id,
              expandedCartItems: [{
                merchandiseId: "gid://shopify/ProductVariant/45962997825816",
                quantity: 1
              }]
            }
          }
        ]
      }
    default:
      break;
  }
  return NO_CHANGES;
};
