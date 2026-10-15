import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { addToCart, setQuantity, type CartItem } from "./shop";

type CartCtx = {
  items: CartItem[];
  add: (item: Omit<CartItem, "quantity">, qty?: number) => void;
  update: (id: string, qty: number) => void;
  clear: () => void;
  count: number;
};

const Ctx = createContext<CartCtx | null>(null);
const KEY = "sportzone-cart";

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) setItems(JSON.parse(raw));
    } catch {}
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (loaded) localStorage.setItem(KEY, JSON.stringify(items));
  }, [items, loaded]);

  return (
    <Ctx.Provider
      value={{
        items,
        add: (item, qty = 1) => setItems((c) => addToCart(c, item, qty)),
        update: (id, qty) => setItems((c) => setQuantity(c, id, qty)),
        clear: () => setItems([]),
        count: items.reduce((s, i) => s + i.quantity, 0),
      }}
    >
      {children}
    </Ctx.Provider>
  );
}

export function useCart() {
  const c = useContext(Ctx);
  if (!c) throw new Error("useCart outside CartProvider");
  return c;
}
