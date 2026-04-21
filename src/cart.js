import { sdk } from "./medusa";
const baseUrl = import.meta.env.VITE_MEDUSA_URL || "";
const publishableKey = import.meta.env.VITE_MEDUSA_PUBLISHABLE_KEY;

const commonHeaders = {
  "x-publishable-api-key": publishableKey,
  "Content-Type": "application/json",
};

export async function createCart() {
  const res = await fetch(`${baseUrl}/store/carts`, {
    method: "POST",
    headers: commonHeaders,
    body: JSON.stringify({
      currency_code: "aud",
      region_id: "reg_01KPDGM7GBNF3N9NX06YTQDRR4",
      sales_channel_id: "sc_01KPCFP6TAVDF75JY4P66GD4JM",
    }),
  });

  if (!res.ok) {
    throw new Error(`Failed to create cart: ${await res.text()}`);
  }

  const data = await res.json();
  return data.cart;
}

export async function getCart(cartId) {
  const res = await fetch(`${baseUrl}/store/carts/${cartId}`, {
    method: "GET",
    headers: commonHeaders,
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error(`Failed to get cart: ${await res.text()}`);
  }

  const data = await res.json();
  return data.cart;
}

export async function addLineItem(cartId, variantId, quantity = 1) {
  const res = await fetch(`${baseUrl}/store/carts/${cartId}/line-items`, {
    method: "POST",
    headers: commonHeaders,
    body: JSON.stringify({
      variant_id: variantId,
      quantity,
    }),
  });

  if (!res.ok) {
    throw new Error(`Failed to add line item: ${await res.text()}`);
  }

  const data = await res.json();
  return data.cart;
}

export async function updateLineItem(cartId, lineItemId, quantity) {
  const res = await fetch(`${baseUrl}/store/carts/${cartId}/line-items/${lineItemId}`, {
    method: "POST",
    headers: commonHeaders,
    body: JSON.stringify({ quantity }),
  });

  if (!res.ok) {
    throw new Error(`Failed to update line item: ${await res.text()}`);
  }

  const data = await res.json();
  return data.cart;
}

export async function removeLineItem(cartId, lineItemId) {
  const res = await fetch(`${baseUrl}/store/carts/${cartId}/line-items/${lineItemId}`, {
    method: "DELETE",
    headers: commonHeaders,
  });

  if (!res.ok) {
    throw new Error(`Failed to remove line item: ${await res.text()}`);
  }

  const data = await res.json();
  return data.cart;
}

// 1) Initialize Stripe payment session on the cart
export async function initializeStripePayment(cart) {
  const updatedCart = await sdk.store.payment.initiatePaymentSession(cart, {
    provider_id: "pp_stripe_stripe",
  });

  return updatedCart;
}

// 2) Complete cart after Stripe confirms payment
export async function completeCart(cartId) {
  const res = await fetch(`${baseUrl}/store/carts/${cartId}/complete`, {
    method: "POST",
    headers: commonHeaders,
  });

  if (!res.ok) {
    throw new Error(`Failed to complete cart: ${await res.text()}`);
  }

  return res.json();
}
export async function updateCartDetails(cartId, payload) {
  const res = await fetch(`${baseUrl}/store/carts/${cartId}`, {
    method: "POST",
    headers: commonHeaders,
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    throw new Error(`Failed to update cart: ${await res.text()}`);
  }

  const data = await res.json();
  return data.cart;
}

export async function listCartShippingOptions(cartId) {
  const res = await fetch(
    `${baseUrl}/store/shipping-options?cart_id=${encodeURIComponent(cartId)}`,
    {
      method: "GET",
      headers: commonHeaders,
    }
  );

  if (!res.ok) {
    throw new Error(`Failed to get shipping options: ${await res.text()}`);
  }

  const data = await res.json();
  return data.shipping_options || [];
}

export async function addShippingMethod(cartId, optionId) {
  const res = await fetch(`${baseUrl}/store/carts/${cartId}/shipping-methods`, {
    method: "POST",
    headers: commonHeaders,
    body: JSON.stringify({
      option_id: optionId,
    }),
  });

  if (!res.ok) {
    throw new Error(`Failed to add shipping method: ${await res.text()}`);
  }

  const data = await res.json();
  return data.cart;
}