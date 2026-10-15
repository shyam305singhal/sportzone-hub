import { queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const categoriesQuery = queryOptions({
  queryKey: ["categories"],
  queryFn: async () => {
    const { data, error } = await supabase.from("categories").select("*").order("name");
    if (error) throw error;
    return data;
  },
});

export const productsQuery = queryOptions({
  queryKey: ["products"],
  queryFn: async () => {
    const { data, error } = await supabase
      .from("products")
      .select("*, categories(name)")
      .order("created_at", { ascending: false });
    if (error) throw error;
    return data;
  },
});

export type Product = Awaited<ReturnType<NonNullable<typeof productsQuery.queryFn>>>[number];
