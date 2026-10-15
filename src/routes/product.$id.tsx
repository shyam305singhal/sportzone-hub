import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useCart } from "@/lib/cart-context";
import { formatPrice, isLowStock } from "@/lib/shop";
import type { Product } from "@/lib/queries";

export const Route = createFileRoute("/product/$id")({
  head: () => ({
    meta: [
      { title: "Product Details — SportZone" },
      { name: "description", content: "View product details, price and stock availability at SportZone." },
      { property: "og:title", content: "Product — SportZone" },
      { property: "og:description", content: "Sports gear from SportZone." },
    ],
  }),
  component: ProductPage,
});

function ProductPage() {
  const { id } = Route.useParams();
  const { add, items } = useCart();
  const [qty, setQty] = useState(1);
  const { data: p, isLoading } = useQuery({
    queryKey: ["product", id],
    queryFn: async () => {
      const { data, error } = await supabase.from("products").select("*, categories(name)").eq("id", id).maybeSingle();
      if (error) throw error;
      return data as Product | null;
    },
  });

  if (isLoading) return <p className="p-8 text-muted-foreground">Loading…</p>;
  if (!p) return <div className="p-8">Product not found. <Link to="/shop" className="text-primary">Back to shop</Link></div>;

  const inCart = items.find((i) => i.product_id === p.id)?.quantity ?? 0;
  const available = p.stock - inCart;

  return (
    <div className="mx-auto grid max-w-6xl gap-8 px-4 py-8 md:grid-cols-2">
      <div className="aspect-square overflow-hidden rounded-2xl border bg-muted">
        {p.image_url && <img src={p.image_url} alt={p.name} className="h-full w-full object-cover" />}
      </div>
      <div>
        <Link to="/shop" className="text-sm text-muted-foreground">← Back to shop</Link>
        <p className="mt-4 text-sm font-semibold uppercase text-secondary">{p.categories?.name}</p>
        <h1 className="mt-1 text-3xl font-bold">{p.name}</h1>
        <p className="mt-3 text-3xl font-extrabold text-primary">{formatPrice(Number(p.price))}</p>
        <p className="mt-4 text-muted-foreground">{p.description}</p>
        <p className={`mt-4 text-sm font-semibold ${p.stock === 0 ? "text-destructive" : isLowStock(p.stock, p.low_stock_threshold) ? "text-warning-foreground" : "text-success-foreground"}`}>
          {p.stock === 0 ? "Out of stock" : `${p.stock} in stock`}{inCart > 0 && ` · ${inCart} in your cart`}
        </p>
        <div className="mt-6 flex items-center gap-3">
          <Input type="number" min={1} max={Math.max(available, 1)} value={qty} onChange={(e) => setQty(Math.max(1, Math.min(Number(e.target.value) || 1, available)))} className="w-24" disabled={available <= 0} />
          <Button
            size="lg"
            disabled={available <= 0}
            onClick={() => {
              add({ product_id: p.id, name: p.name, price: Number(p.price), image_url: p.image_url, stock: p.stock }, qty);
              toast.success("Added to cart");
              setQty(1);
            }}
          >
            {p.stock === 0 ? "Sold out" : available <= 0 ? "All stock in cart" : "Add to cart"}
          </Button>
        </div>
      </div>
    </div>
  );
}
