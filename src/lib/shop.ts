export type CartItem = {
  product_id: string;
  name: string;
  price: number;
  image_url: string | null;
  quantity: number;
  stock: number;
};

export const ORDER_STATUSES = ["pending", "processing", "shipped", "delivered", "cancelled"] as const;

export function formatPrice(value: number) {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(value);
}

export function isLowStock(stock: number, threshold: number) {
  return stock <= threshold;
}

/** Adds qty of a product to the cart, never exceeding available stock. */
export function addToCart(cart: CartItem[], item: Omit<CartItem, "quantity">, qty = 1): CartItem[] {
  const existing = cart.find((c) => c.product_id === item.product_id);
  const current = existing?.quantity ?? 0;
  const next = Math.min(current + qty, item.stock);
  if (next <= 0) return cart;
  if (existing) return cart.map((c) => (c.product_id === item.product_id ? { ...c, ...item, quantity: next } : c));
  return [...cart, { ...item, quantity: next }];
}

export function setQuantity(cart: CartItem[], productId: string, qty: number): CartItem[] {
  return cart
    .map((c) => (c.product_id === productId ? { ...c, quantity: Math.min(Math.max(qty, 0), c.stock) } : c))
    .filter((c) => c.quantity > 0);
}

export function cartTotal(cart: CartItem[]) {
  return cart.reduce((s, c) => s + c.price * c.quantity, 0);
}
