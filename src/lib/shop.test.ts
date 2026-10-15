import { describe, expect, it } from "vitest";
import { addToCart, cartTotal, isLowStock, setQuantity } from "./shop";

const bat = { product_id: "a", name: "Bat", price: 100, image_url: null, stock: 3 };

describe("cart stock rules", () => {
  it("never adds more than available stock", () => {
    let cart = addToCart([], bat, 2);
    cart = addToCart(cart, bat, 5);
    expect(cart[0]?.quantity).toBe(3);
  });
  it("does not add out-of-stock products", () => {
    expect(addToCart([], { ...bat, stock: 0 })).toHaveLength(0);
  });
  it("caps manual quantity at stock and removes at zero", () => {
    const cart = addToCart([], bat, 1);
    expect(setQuantity(cart, "a", 10)[0]?.quantity).toBe(3);
    expect(setQuantity(cart, "a", 0)).toHaveLength(0);
  });
  it("totals price times quantity", () => {
    expect(cartTotal(addToCart([], bat, 2))).toBe(200);
  });
  it("flags stock at or below threshold as low", () => {
    expect(isLowStock(5, 5)).toBe(true);
    expect(isLowStock(6, 5)).toBe(false);
  });
});
