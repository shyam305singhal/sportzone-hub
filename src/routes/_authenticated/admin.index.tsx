import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { productsQuery } from "@/lib/queries";
import { formatPrice, isLowStock } from "@/lib/shop";

export const Route = createFileRoute("/_authenticated/admin/")({ component: Dashboard });

function Dashboard() {
  const { data: products = [] } = useQuery(productsQuery);
  const { data: orders = [] } = useQuery({
    queryKey: ["admin", "orders"],
    queryFn: async () => {
      const { data, error } = await supabase.from("orders").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });
  const revenue = orders.filter((o) => o.status !== "cancelled").reduce((s, o) => s + Number(o.total), 0);
  const low = products.filter((p) => isLowStock(p.stock, p.low_stock_threshold));

  const stats = [
    { label: "Total products", value: products.length },
    { label: "Total orders", value: orders.length },
    { label: "Revenue", value: formatPrice(revenue) },
    { label: "Low stock", value: low.length },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {stats.map((s, i) => (
          <div key={s.label} className={`rounded-xl border p-5 ${i % 2 ? "bg-secondary text-secondary-foreground" : "bg-primary text-primary-foreground"}`}>
            <p className="text-sm opacity-90">{s.label}</p>
            <p className="mt-1 text-2xl font-extrabold">{s.value}</p>
          </div>
        ))}
      </div>
      <div className="grid gap-6 md:grid-cols-2">
        <section className="rounded-xl border bg-card p-5">
          <h2 className="mb-3 font-bold">Low-stock alerts</h2>
          {low.length === 0 ? <p className="text-sm text-muted-foreground">All products well stocked.</p> : (
            <ul className="space-y-2">
              {low.map((p) => (
                <li key={p.id} className="flex justify-between rounded-lg bg-warning px-3 py-2 text-sm text-warning-foreground">
                  <span>{p.name}</span><span className="font-bold">{p.stock} left</span>
                </li>
              ))}
            </ul>
          )}
          <Link to="/admin/products" className="mt-3 inline-block text-sm font-semibold text-primary">Manage inventory →</Link>
        </section>
        <section className="rounded-xl border bg-card p-5">
          <h2 className="mb-3 font-bold">Recent orders</h2>
          {orders.length === 0 ? <p className="text-sm text-muted-foreground">No orders yet.</p> : (
            <ul className="divide-y text-sm">
              {orders.slice(0, 6).map((o) => (
                <li key={o.id} className="flex justify-between py-2">
                  <span>{o.customer_name} <span className="text-muted-foreground">· {o.status}</span></span>
                  <span className="font-semibold">{formatPrice(Number(o.total))}</span>
                </li>
              ))}
            </ul>
          )}
          <Link to="/admin/orders" className="mt-3 inline-block text-sm font-semibold text-primary">All orders →</Link>
        </section>
      </div>
    </div>
  );
}
