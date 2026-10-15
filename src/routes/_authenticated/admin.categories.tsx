import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { categoriesQuery } from "@/lib/queries";

export const Route = createFileRoute("/_authenticated/admin/categories")({ component: AdminCategories });

function AdminCategories() {
  const qc = useQueryClient();
  const { data: categories = [] } = useQuery(categoriesQuery);
  const [name, setName] = useState("");
  const [editing, setEditing] = useState<{ id: string; name: string } | null>(null);
  const refresh = () => { qc.invalidateQueries({ queryKey: ["categories"] }); qc.invalidateQueries({ queryKey: ["products"] }); };

  const add = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    const { error } = await supabase.from("categories").insert({ name: name.trim() });
    if (error) return toast.error(error.message);
    setName(""); refresh();
  };
  const rename = async () => {
    if (!editing?.name.trim()) return;
    const { error } = await supabase.from("categories").update({ name: editing.name.trim() }).eq("id", editing.id);
    if (error) return toast.error(error.message);
    setEditing(null); refresh();
  };
  const remove = async (id: string) => {
    if (!confirm("Delete category? Products keep existing without a category.")) return;
    const { error } = await supabase.from("categories").delete().eq("id", id);
    if (error) return toast.error(error.message);
    refresh();
  };

  return (
    <div className="max-w-xl">
      <h1 className="mb-4 text-2xl font-bold">Categories</h1>
      <form onSubmit={add} className="mb-4 flex gap-2">
        <Input placeholder="New category name" value={name} onChange={(e) => setName(e.target.value)} />
        <Button type="submit">Add</Button>
      </form>
      <ul className="divide-y rounded-xl border bg-card">
        {categories.map((c) => (
          <li key={c.id} className="flex items-center gap-2 p-3">
            {editing?.id === c.id ? (
              <>
                <Input value={editing.name} onChange={(e) => setEditing({ ...editing, name: e.target.value })} />
                <Button size="sm" onClick={rename}>Save</Button>
                <Button size="sm" variant="ghost" onClick={() => setEditing(null)}>Cancel</Button>
              </>
            ) : (
              <>
                <span className="flex-1 font-medium">{c.name}</span>
                <Button size="sm" variant="ghost" onClick={() => setEditing({ id: c.id, name: c.name })}>Edit</Button>
                <Button size="sm" variant="ghost" className="text-destructive" onClick={() => remove(c.id)}>Delete</Button>
              </>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
