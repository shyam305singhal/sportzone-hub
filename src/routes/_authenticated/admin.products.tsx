import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { categoriesQuery, productsQuery, type Product } from "@/lib/queries";
import { formatPrice, isLowStock } from "@/lib/shop";

export const Route = createFileRoute("/_authenticated/admin/products")({ component: AdminProducts });

type Form = { id?: string; name: string; description: string; price: string; stock: string; low_stock_threshold: string; category_id: string; image_url: string };
const empty: Form = { name: "", description: "", price: "", stock: "0", low_stock_threshold: "5", category_id: "", image_url: "" };

function AdminProducts() {
  const qc = useQueryClient();
  const { data: products = [] } = useQuery(productsQuery);
  const { data: categories = [] } = useQuery(categoriesQuery);
  const [form, setForm] = useState<Form | null>(null);
  const [filter, setFilter] = useState("");

  const refresh = () => qc.invalidateQueries({ queryKey: ["products"] });

  const save = async () => {
    if (!form) return;
    const price = Number(form.price), stock = parseInt(form.stock), thr = parseInt(form.low_stock_threshold);
    if (!form.name.trim() || !(price >= 0) || !(stock >= 0) || !(thr >= 0)) return toast.error("Enter a name, valid price and stock");
    const row = { name: form.name.trim(), description: form.description, price, stock, low_stock_threshold: thr, category_id: form.category_id || null, image_url: form.image_url || null };
    const { error } = form.id ? await supabase.from("products").update(row).eq("id", form.id) : await supabase.from("products").insert(row);
    if (error) return toast.error(error.message);
    toast.success("Product saved");
    setForm(null);
    refresh();
  };

  const remove = async (p: Product) => {
    if (!confirm(`Delete ${p.name}?`)) return;
    const { error } = await supabase.from("products").delete().eq("id", p.id);
    if (error) return toast.error(error.message);
    refresh();
  };

  const quickStock = async (p: Product, stock: number) => {
    if (stock < 0) return;
    const { error } = await supabase.from("products").update({ stock }).eq("id", p.id);
    if (error) return toast.error(error.message);
    refresh();
  };

  const list = products.filter((p) => p.name.toLowerCase().includes(filter.toLowerCase()));
  const f = (k: keyof Form) => ({ id: k, value: form?.[k] ?? "", onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => setForm({ ...form!, [k]: e.target.value }) });

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <h1 className="text-2xl font-bold">Products & inventory</h1>
        <Input placeholder="Search…" className="ml-auto w-48" value={filter} onChange={(e) => setFilter(e.target.value)} />
        <Button onClick={() => setForm(empty)}>Add product</Button>
      </div>
      <div className="overflow-x-auto rounded-xl border bg-card">
        <table className="w-full text-sm">
          <thead className="bg-muted text-left"><tr><th className="p-3">Product</th><th className="p-3">Category</th><th className="p-3">Price</th><th className="p-3">Stock</th><th className="p-3" /></tr></thead>
          <tbody>
            {list.map((p) => {
              const low = isLowStock(p.stock, p.low_stock_threshold);
              return (
                <tr key={p.id} className={`border-t ${low ? "bg-warning/60" : ""}`}>
                  <td className="p-3"><div className="flex items-center gap-2">{p.image_url && <img src={p.image_url} alt="" className="size-10 rounded object-cover" />}<span className="font-medium">{p.name}</span></div></td>
                  <td className="p-3">{p.categories?.name ?? "—"}</td>
                  <td className="p-3">{formatPrice(Number(p.price))}</td>
                  <td className="p-3">
                    <div className="flex items-center gap-1">
                      <Button size="icon" variant="outline" className="size-7" onClick={() => quickStock(p, p.stock - 1)}>−</Button>
                      <span className={`w-10 text-center font-semibold ${low ? "text-warning-foreground" : ""}`}>{p.stock}</span>
                      <Button size="icon" variant="outline" className="size-7" onClick={() => quickStock(p, p.stock + 1)}>+</Button>
                      {low && <span className="ml-1 text-xs font-bold text-warning-foreground">LOW</span>}
                    </div>
                  </td>
                  <td className="p-3 text-right whitespace-nowrap">
                    <Button size="sm" variant="ghost" onClick={() => setForm({ id: p.id, name: p.name, description: p.description, price: String(p.price), stock: String(p.stock), low_stock_threshold: String(p.low_stock_threshold), category_id: p.category_id ?? "", image_url: p.image_url ?? "" })}>Edit</Button>
                    <Button size="sm" variant="ghost" className="text-destructive" onClick={() => remove(p)}>Delete</Button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <Dialog open={!!form} onOpenChange={(o) => !o && setForm(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>{form?.id ? "Edit product" : "Add product"}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label htmlFor="name">Name</Label><Input {...f("name")} /></div>
            <div><Label htmlFor="description">Description</Label><Textarea {...f("description")} /></div>
            <div className="grid grid-cols-3 gap-3">
              <div><Label htmlFor="price">Price (₹)</Label><Input type="number" min={0} step="0.01" {...f("price")} /></div>
              <div><Label htmlFor="stock">Stock</Label><Input type="number" min={0} {...f("stock")} /></div>
              <div><Label htmlFor="low_stock_threshold">Low at</Label><Input type="number" min={0} {...f("low_stock_threshold")} /></div>
            </div>
            <div>
              <Label htmlFor="category_id">Category</Label>
              <select className="h-9 w-full rounded-md border bg-card px-3 text-sm" {...f("category_id")}>
                <option value="">None</option>
                {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div><Label htmlFor="image_url">Image URL</Label><Input placeholder="https://… or /images/products/…" {...f("image_url")} /></div>
            <Button className="w-full" onClick={save}>Save</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
