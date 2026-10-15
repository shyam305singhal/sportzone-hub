import { createFileRoute, Link } from "@tanstack/react-router";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useCart } from "@/lib/cart-context";
import { cartTotal, formatPrice } from "@/lib/shop";

export const Route = createFileRoute("/cart")({
  head: () => ({
    meta: [
      { title: "Your Cart — SportZone" },
      { name: "description", content: "Review items in your SportZone shopping cart." },
      { property: "og:title", content: "Cart — SportZone" },
      { property: "og:description", content: "Your SportZone shopping cart." },
    ],
  }),
  component: CartPage,
});

function CartPage() {
  const { items, update } = useCart();
  if (items.length === 0)
    return (
      <div className="mx-auto max-w-md px-4 py-20 text-center">
        <h1 className="text-2xl font-bold">Your cart is empty</h1>
        <Button asChild className="mt-6"><Link to="/shop">Start shopping</Link></Button>
      </div>
    );

  return (
    <div className="mx-auto grid max-w-5xl gap-8 px-4 py-8 md:grid-cols-[1fr_300px]">
      <div>
        <h1 className="mb-4 text-3xl font-bold">Cart</h1>
        <ul className="divide-y rounded-xl border bg-card">
          {items.map((i) => (
            <li key={i.product_id} className="flex items-center gap-4 p-4">
              {i.image_url && <img src={i.image_url} alt="" className="size-16 rounded-lg object-cover" />}
              <div className="flex-1">
                <p className="font-semibold">{i.name}</p>
                <p className="text-sm text-muted-foreground">{formatPrice(i.price)} · max {i.stock}</p>
              </div>
              <Input type="number" min={1} max={i.stock} value={i.quantity} onChange={(e) => update(i.product_id, Number(e.target.value) || 1)} className="w-20" />
              <Button variant="ghost" size="icon" onClick={() => update(i.product_id, 0)} aria-label="Remove"><Trash2 className="size-4" /></Button>
            </li>
          ))}
        </ul>
      </div>
      <aside className="h-fit rounded-xl border bg-card p-5">
        <div className="flex justify-between text-lg font-bold"><span>Total</span><span>{formatPrice(cartTotal(items))}</span></div>
        <Button asChild className="mt-4 w-full" size="lg"><Link to="/checkout">Checkout</Link></Button>
      </aside>
    </div>
  );
}
