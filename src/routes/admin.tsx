import { createFileRoute, Link, Outlet, redirect } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/admin")({
  beforeLoad: async ({ context }) => {
    const { data } = await supabase.rpc("has_role", { _user_id: context.user.id, _role: "admin" });
    if (!data) throw redirect({ to: "/" });
  },
  head: () => ({ meta: [{ title: "Admin — SportZone" }, { name: "robots", content: "noindex" }] }),
  component: AdminLayout,
});

const tabs = [
  { to: "/admin", label: "Dashboard", exact: true },
  { to: "/admin/products", label: "Products" },
  { to: "/admin/categories", label: "Categories" },
  { to: "/admin/orders", label: "Orders" },
] as const;

function AdminLayout() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-6">
      <nav className="mb-6 flex gap-1 overflow-x-auto rounded-xl bg-sidebar p-1">
        {tabs.map((t) => (
          <Link
            key={t.to}
            to={t.to}
            activeOptions={{ exact: "exact" in t }}
            className="whitespace-nowrap rounded-lg px-4 py-2 text-sm font-semibold text-sidebar-foreground hover:bg-sidebar-accent"
            activeProps={{ className: "bg-sidebar-primary text-sidebar-primary-foreground hover:bg-sidebar-primary" }}
          >
            {t.label}
          </Link>
        ))}
      </nav>
      <Outlet />
    </div>
  );
}
