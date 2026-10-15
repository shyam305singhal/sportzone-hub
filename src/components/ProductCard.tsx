import { Link } from "@tanstack/react-router";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useCart } from "@/lib/cart-context";
import { formatPrice, isLowStock } from "@/lib/shop";
import type { Product } from "@/lib/queries";

export function ProductCard({ p }: { p: Product }) {
  const { add, items } = useCart();
  const inCart = items.find((i) => i.product_id === p.id)?.quantity ?? 0;
  const soldOut = p.stock === 0;
  const maxed = inCart >= p.stock;

  return (
    <div className="group flex flex-col overflow-hidden rounded-xl border bg-card transition-shadow hover:shadow-lg">
      <Link to="/product/$id" params={{ id: p.id }} className="relative aspect-square bg-muted">
        {p.image_url && (
          <img src={p.image_url} alt={p.name} loading="lazy" width={400} height={400} className="h-full w-full object-cover" />
        )}
        {soldOut ? (
          <Badge variant="destructive" className="absolute left-2 top-2">Sold out</Badge>
        ) : isLowStock(p.stock, p.low_stock_threshold) ? (
          <Badge className="absolute left-2 top-2 bg-warning text-warning-foreground">Only {p.stock} left</Badge>
        ) : null}
      </Link>
      <div className="flex flex-1 flex-col gap-1 p-4">
        <span className="text-xs font-semibold uppercase tracking-wide text-secondary">{p.categories?.name}</span>
        <Link to="/product/$id" params={{ id: p.id }} className="line-clamp-2 font-semibold hover:text-primary">{p.name}</Link>
        <div className="mt-auto flex items-center justify-between pt-3">
          <span className="text-lg font-bold">{formatPrice(Number(p.price))}</span>
          <Button
            size="sm"
            disabled={soldOut || maxed}
            onClick={() => {
              add({ product_id: p.id, name: p.name, price: Number(p.price), image_url: p.image_url, stock: p.stock });
              toast.success(`${p.name} added to cart`);
            }}
          >
            {soldOut ? "Sold out" : maxed ? "Max in cart" : "Add"}
          </Button>
        </div>
      </div>
    </div>
  );
}
