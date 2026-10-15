import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { z } from "zod";
import { Input } from "@/components/ui/input";
import { ProductCard } from "@/components/ProductCard";
import { categoriesQuery, productsQuery } from "@/lib/queries";

const search = z.object({
  q: z.string().optional(),
  category: z.string().optional(),
  sort: z.enum(["new", "price-asc", "price-desc"]).optional(),
  max: z.number().optional(),
  instock: z.boolean().optional(),
});

export const Route = createFileRoute("/shop")({
  validateSearch: search,
  head: () => ({
    meta: [
      { title: "Shop All Sports Products — SportZone" },
      { name: "description", content: "Browse and filter cricket, football, badminton, gym, sportswear and shoe products." },
      { property: "og:title", content: "Shop — SportZone" },
      { property: "og:description", content: "Search and filter the full SportZone catalogue." },
    ],
  }),
  component: Shop,
});

const selectCls = "h-9 rounded-md border bg-card px-3 text-sm";

function Shop() {
  const s = Route.useSearch();
  const navigate = useNavigate({ from: "/shop" });
  const set = (patch: Partial<z.infer<typeof search>>) => navigate({ search: (prev) => ({ ...prev, ...patch }), replace: true });
  const { data: products = [], isLoading } = useQuery(productsQuery);
  const { data: categories = [] } = useQuery(categoriesQuery);

  const q = (s.q ?? "").toLowerCase();
  let list = products.filter(
    (p) =>
      (!q || p.name.toLowerCase().includes(q) || p.description.toLowerCase().includes(q)) &&
      (!s.category || p.category_id === s.category) &&
      (!s.max || Number(p.price) <= s.max) &&
      (!s.instock || p.stock > 0),
  );
  if (s.sort === "price-asc") list = [...list].sort((a, b) => Number(a.price) - Number(b.price));
  if (s.sort === "price-desc") list = [...list].sort((a, b) => Number(b.price) - Number(a.price));

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <h1 className="mb-6 text-3xl font-bold">Shop</h1>
      <div className="mb-6 flex flex-wrap items-center gap-3 rounded-xl border bg-card p-4">
        <Input placeholder="Search products…" className="w-full sm:w-64" value={s.q ?? ""} onChange={(e) => set({ q: e.target.value || undefined })} />
        <select className={selectCls} value={s.category ?? ""} onChange={(e) => set({ category: e.target.value || undefined })}>
          <option value="">All categories</option>
          {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <select className={selectCls} value={s.max ?? ""} onChange={(e) => set({ max: e.target.value ? Number(e.target.value) : undefined })}>
          <option value="">Any price</option>
          <option value="500">Under ₹500</option>
          <option value="1000">Under ₹1,000</option>
          <option value="2500">Under ₹2,500</option>
          <option value="5000">Under ₹5,000</option>
        </select>
        <select className={selectCls} value={s.sort ?? "new"} onChange={(e) => set({ sort: e.target.value as "new" })}>
          <option value="new">Newest</option>
          <option value="price-asc">Price: low to high</option>
          <option value="price-desc">Price: high to low</option>
        </select>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={!!s.instock} onChange={(e) => set({ instock: e.target.checked || undefined })} /> In stock only
        </label>
      </div>
      {isLoading ? (
        <p className="text-muted-foreground">Loading…</p>
      ) : list.length === 0 ? (
        <p className="text-muted-foreground">No products match your filters.</p>
      ) : (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
          {list.map((p) => <ProductCard key={p.id} p={p} />)}
        </div>
      )}
    </div>
  );
}
