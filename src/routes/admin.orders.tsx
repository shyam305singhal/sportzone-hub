import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { ORDER_STATUSES, formatPrice } from "@/lib/shop";

export const Route = createFileRoute("/admin/orders")({ component: AdminOrders });

function AdminOrders() {
  const qc = useQueryClient();
  const [open, setOpen] = useState<string | null>(null);
  const { data: orders = [], isLoading } = useQuery({
    queryKey: ["admin", "orders-full"],
    queryFn: async () => {
      const { data, error } = await supabase.from("orders").select("*, order_items(*)").order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const setStatus = async (id: string, status: string) => {
    const { error } = await supabase.from("orders").update({ status }).eq("id", id);
    if (error) { toast.error(error.message); return; }
    toast.success("Order updated");
    qc.invalidateQueries({ queryKey: ["admin"] });
  };

  return (
    <div>
      <h1 className="mb-4 text-2xl font-bold">Orders</h1>
      {isLoading ? <p>Loading…</p> : orders.length === 0 ? <p className="text-muted-foreground">No orders yet.</p> : (
        <div className="space-y-3">
          {orders.map((o) => (
            <div key={o.id} className="rounded-xl border bg-card p-4">
              <div className="flex flex-wrap items-center gap-3">
                <button className="text-left" onClick={() => setOpen(open === o.id ? null : o.id)}>
                  <p className="font-semibold">#{o.id.slice(0, 8).toUpperCase()} · {o.customer_name}</p>
                  <p className="text-xs text-muted-foreground">{new Date(o.created_at).toLocaleString()} · {o.order_items.length} items</p>
                </button>
                <span className="ml-auto font-bold">{formatPrice(Number(o.total))}</span>
                <select className="h-9 rounded-md border bg-card px-2 text-sm capitalize" value={o.status} onChange={(e) => setStatus(o.id, e.target.value)}>
                  {ORDER_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              {open === o.id && (
                <div className="mt-3 grid gap-3 border-t pt-3 text-sm md:grid-cols-2">
                  <div>
                    <p>{o.email} · {o.phone}</p>
                    <p className="text-muted-foreground">{o.address}</p>
                  </div>
                  <ul>
                    {o.order_items.map((i) => (
                      <li key={i.id} className="flex justify-between"><span>{i.product_name} × {i.quantity}</span><span>{formatPrice(Number(i.price) * i.quantity)}</span></li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
