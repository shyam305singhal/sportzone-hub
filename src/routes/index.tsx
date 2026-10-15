import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { ProductCard } from "@/components/ProductCard";
import { categoriesQuery, productsQuery } from "@/lib/queries";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "SportZone — Sports Gear, Shoes & Fitness Equipment" },
      { name: "description", content: "Cricket bats, footballs, badminton rackets, gym equipment, sportswear and shoes — all at SportZone." },
      { property: "og:title", content: "SportZone — Sports Gear & Fitness Store" },
      { property: "og:description", content: "Shop top sports gear across cricket, football, badminton, gym and more." },
    ],
  }),
  component: Index,
});

function Index() {
  const { data: products = [] } = useQuery(productsQuery);
  const { data: categories = [] } = useQuery(categoriesQuery);

  return (
    <div>
      <section className="bg-hero text-primary-foreground">
        <div className="mx-auto grid max-w-7xl items-center gap-8 px-4 py-14 md:grid-cols-2 md:py-20">
          <div>
            <p className="mb-3 inline-block rounded-full bg-card/20 px-3 py-1 text-sm font-semibold">New season gear is here</p>
            <h1 className="text-4xl font-extrabold leading-tight md:text-6xl">Gear up.<br />Play hard.</h1>
            <p className="mt-4 max-w-md text-lg opacity-90">Everything for cricket, football, badminton, the gym and beyond.</p>
            <div className="mt-6 flex gap-3">
              <Button asChild size="lg"><Link to="/shop">Shop now</Link></Button>
              <Button asChild size="lg" variant="secondary"><Link to="/admin">Admin Panel</Link></Button>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {["/images/products/football.jpg", "/images/products/shoes.jpg", "/images/products/badminton.jpg", "/images/products/dumbbells.jpg"].map((src) => (
              <img key={src} src={src} alt="" width={300} height={300} className="aspect-square rounded-2xl bg-card object-cover shadow-xl" />
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-12">
        <h2 className="mb-5 text-2xl font-bold">Shop by category</h2>
        <div className="flex flex-wrap gap-2">
          {categories.map((c) => (
            <Link key={c.id} to="/shop" search={{ category: c.id }} className="rounded-full border-2 border-secondary px-4 py-2 text-sm font-semibold text-secondary hover:bg-secondary hover:text-secondary-foreground">
              {c.name}
            </Link>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 pb-16">
        <div className="mb-5 flex items-end justify-between">
          <h2 className="text-2xl font-bold">Featured products</h2>
          <Link to="/shop" className="text-sm font-semibold text-primary">View all →</Link>
        </div>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {products.slice(0, 8).map((p) => <ProductCard key={p.id} p={p} />)}
        </div>
      </section>
    </div>
  );
}
