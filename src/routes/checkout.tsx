import { createFileRoute, Link } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { z } from "zod";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useCart } from "@/lib/cart-context";
import { cartTotal, formatPrice } from "@/lib/shop";

export const Route = createFileRoute("/checkout")({
  head: () => ({
    meta: [
      { title: "Checkout — SportZone" },
      { name: "description", content: "Enter delivery details and place your SportZone order." },
      { property: "og:title", content: "Checkout — SportZone" },
      { property: "og:description", content: "Complete your SportZone order." },
    ],
  }),
  component: Checkout,
});

const schema = z.object({
  name: z.string().trim().min(2, "Enter your name").max(100),
  email: z.string().trim().email("Enter a valid email").max(255),
  phone: z.string().trim().min(7, "Enter a valid phone").max(20),
  address: z.string().trim().min(10, "Enter your full address").max(500),
});

function Checkout() {
  const { items, clear } = useCart();
  const qc = useQueryClient();
  const [form, setForm] = useState({ name: "", email: "", phone: "", address: "" });
  const [busy, setBusy] = useState(false);
  const [orderId, setOrderId] = useState<string | null>(null);

  if (orderId)
    return (
      <div className="mx-auto max-w-md px-4 py-20 text-center">
        <h1 className="text-3xl font-bold text-primary">Order placed!</h1>
        <p className="mt-3 text-muted-foreground">Order reference</p>
        <p className="font-mono text-sm">{orderId.slice(0, 8).toUpperCase()}</p>
        <p className="mt-3">We'll email you at {form.email} with updates. Payment on delivery.</p>
        <Button asChild className="mt-6"><Link to="/shop">Continue shopping</Link></Button>
      </div>
    );

  if (items.length === 0)
    return <div className="p-8 text-center">Your cart is empty. <Link to="/shop" className="text-primary">Shop now</Link></div>;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = schema.safeParse(form);
    if (!parsed.success) { toast.error(parsed.error.issues[0]?.message ?? "Invalid details"); return; }
    setBusy(true);
    const { data, error } = await supabase.rpc("place_order", {
      _customer_name: parsed.data.name,
      _email: parsed.data.email,
      _phone: parsed.data.phone,
      _address: parsed.data.address,
      _items: items.map((i) => ({ product_id: i.product_id, quantity: i.quantity })),
    });
    setBusy(false);
    if (error) {
      toast.error(error.message);
      qc.invalidateQueries({ queryKey: ["products"] });
      return;
    }
    clear();
    qc.invalidateQueries();
    setOrderId(data as string);
  };

  const field = (k: keyof typeof form) => ({ id: k, value: form[k], onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setForm({ ...form, [k]: e.target.value }) });

  return (
    <div className="mx-auto grid max-w-5xl gap-8 px-4 py-8 md:grid-cols-[1fr_320px]">
      <form onSubmit={submit} className="space-y-4 rounded-xl border bg-card p-6">
        <h1 className="text-2xl font-bold">Delivery details</h1>
        <div><Label htmlFor="name">Full name</Label><Input {...field("name")} /></div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div><Label htmlFor="email">Email</Label><Input type="email" {...field("email")} /></div>
          <div><Label htmlFor="phone">Phone</Label><Input {...field("phone")} /></div>
        </div>
        <div><Label htmlFor="address">Address</Label><Textarea {...field("address")} /></div>
        <p className="text-sm text-muted-foreground">Payment: cash on delivery.</p>
        <Button type="submit" size="lg" className="w-full" disabled={busy}>{busy ? "Placing order…" : "Place order"}</Button>
      </form>
      <aside className="h-fit rounded-xl border bg-card p-5">
        <h2 className="mb-3 font-bold">Summary</h2>
        {items.map((i) => (
          <div key={i.product_id} className="flex justify-between py-1 text-sm"><span>{i.name} × {i.quantity}</span><span>{formatPrice(i.price * i.quantity)}</span></div>
        ))}
        <div className="mt-3 flex justify-between border-t pt-3 font-bold"><span>Total</span><span>{formatPrice(cartTotal(items))}</span></div>
      </aside>
    </div>
  );
}
