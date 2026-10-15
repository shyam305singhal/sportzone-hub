import { Link } from "@tanstack/react-router";
import { ShoppingCart, LayoutDashboard, LogOut, User } from "lucide-react";
import { useCart } from "@/lib/cart-context";
import { useIsAdmin, useUser } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";

export function SiteHeader() {
  const { count } = useCart();
  const { user } = useUser();
  const { data: isAdmin } = useIsAdmin(user?.id);

  return (
    <header className="sticky top-0 z-40 border-b bg-card/95 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-4 px-4">
        <Link to="/" className="font-display text-2xl font-extrabold tracking-tight">
          <span className="text-secondary">Sport</span>
          <span className="text-primary">Zone</span>
        </Link>
        <nav className="ml-4 hidden gap-5 text-sm font-medium sm:flex">
          <Link to="/" className="hover:text-primary" activeProps={{ className: "text-primary" }} activeOptions={{ exact: true }}>Home</Link>
          <Link to="/shop" className="hover:text-primary" activeProps={{ className: "text-primary" }}>Shop</Link>
        </nav>
        <div className="ml-auto flex items-center gap-2">
          <Link to="/shop" className="text-sm font-medium sm:hidden">Shop</Link>
          {true && (
            <Button asChild variant="ghost" size="sm">
              <Link to="/admin"><LayoutDashboard className="size-4" /><span className="hidden sm:inline">Admin Panel</span></Link>
            </Button>
          )}
          {user ? (
            <Button variant="ghost" size="sm" onClick={() => supabase.auth.signOut()} aria-label="Sign out">
              <LogOut className="size-4" /><span className="hidden sm:inline">Sign out</span>
            </Button>
          ) : (
            <Button asChild variant="ghost" size="sm">
              <Link to="/auth"><User className="size-4" /><span className="hidden sm:inline">Sign in</span></Link>
            </Button>
          )}
          <Button asChild size="sm">
            <Link to="/cart" aria-label="Cart">
              <ShoppingCart className="size-4" />
              <span>{count}</span>
            </Link>
          </Button>
        </div>
      </div>
    </header>
  );
}
