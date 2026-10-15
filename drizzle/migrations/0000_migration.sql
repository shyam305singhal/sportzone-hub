create type public.app_role as enum ('admin','user');

create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  role app_role not null,
  unique (user_id, role)
);
grant select on public.user_roles to authenticated;
grant all on public.user_roles to service_role;
alter table public.user_roles enable row level security;
create policy "own roles readable" on public.user_roles for select to authenticated using (user_id = auth.uid());

create or replace function public.has_role(_user_id uuid, _role app_role)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.user_roles where user_id = _user_id and role = _role)
$$;

-- First account to sign up becomes admin; everyone else is a customer
create or replace function public.handle_new_user_role()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if not exists (select 1 from public.user_roles where role = 'admin') then
    insert into public.user_roles (user_id, role) values (new.id, 'admin');
  else
    insert into public.user_roles (user_id, role) values (new.id, 'user');
  end if;
  return new;
end $$;
create trigger on_auth_user_created_role after insert on auth.users
for each row execute function public.handle_new_user_role();

create table public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  created_at timestamptz not null default now()
);
grant select on public.categories to anon, authenticated;
grant insert, update, delete on public.categories to authenticated;
grant all on public.categories to service_role;
alter table public.categories enable row level security;
create policy "categories public read" on public.categories for select using (true);
create policy "categories admin write" on public.categories for all to authenticated
  using (public.has_role(auth.uid(),'admin')) with check (public.has_role(auth.uid(),'admin'));

create table public.products (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text not null default '',
  price numeric(10,2) not null check (price >= 0),
  stock integer not null default 0 check (stock >= 0),
  low_stock_threshold integer not null default 5,
  category_id uuid references public.categories(id) on delete set null,
  image_url text,
  created_at timestamptz not null default now()
);
grant select on public.products to anon, authenticated;
grant insert, update, delete on public.products to authenticated;
grant all on public.products to service_role;
alter table public.products enable row level security;
create policy "products public read" on public.products for select using (true);
create policy "products admin write" on public.products for all to authenticated
  using (public.has_role(auth.uid(),'admin')) with check (public.has_role(auth.uid(),'admin'));

create table public.orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid,
  customer_name text not null,
  email text not null,
  phone text not null,
  address text not null,
  total numeric(10,2) not null,
  status text not null default 'pending' check (status in ('pending','processing','shipped','delivered','cancelled')),
  created_at timestamptz not null default now()
);
grant select, update on public.orders to authenticated;
grant all on public.orders to service_role;
alter table public.orders enable row level security;
create policy "orders own read" on public.orders for select to authenticated using (user_id = auth.uid() or public.has_role(auth.uid(),'admin'));
create policy "orders admin update" on public.orders for update to authenticated
  using (public.has_role(auth.uid(),'admin')) with check (public.has_role(auth.uid(),'admin'));

create table public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  product_id uuid references public.products(id) on delete set null,
  product_name text not null,
  price numeric(10,2) not null,
  quantity integer not null check (quantity > 0)
);
grant select on public.order_items to authenticated;
grant all on public.order_items to service_role;
alter table public.order_items enable row level security;
create policy "items read" on public.order_items for select to authenticated using (
  exists (select 1 from public.orders o where o.id = order_id and (o.user_id = auth.uid() or public.has_role(auth.uid(),'admin'))));

-- Atomic checkout: validates stock, decrements inventory, creates order
create or replace function public.place_order(
  _customer_name text, _email text, _phone text, _address text, _items jsonb)
returns uuid language plpgsql security definer set search_path = public as $$
declare
  _order_id uuid;
  _item jsonb;
  _p public.products%rowtype;
  _qty int;
  _total numeric(10,2) := 0;
begin
  if _items is null or jsonb_array_length(_items) = 0 then raise exception 'Cart is empty'; end if;
  if coalesce(trim(_customer_name),'') = '' or coalesce(trim(_email),'') = '' or coalesce(trim(_address),'') = '' then
    raise exception 'Missing customer details'; end if;

  insert into public.orders (user_id, customer_name, email, phone, address, total)
  values (auth.uid(), _customer_name, _email, coalesce(_phone,''), _address, 0) returning id into _order_id;

  for _item in select * from jsonb_array_elements(_items) loop
    _qty := (_item->>'quantity')::int;
    if _qty is null or _qty <= 0 then raise exception 'Invalid quantity'; end if;
    select * into _p from public.products where id = (_item->>'product_id')::uuid for update;
    if not found then raise exception 'Product not found'; end if;
    if _p.stock < _qty then
      raise exception 'Only % of "%" left in stock', _p.stock, _p.name; end if;
    update public.products set stock = stock - _qty where id = _p.id;
    insert into public.order_items (order_id, product_id, product_name, price, quantity)
    values (_order_id, _p.id, _p.name, _p.price, _qty);
    _total := _total + _p.price * _qty;
  end loop;

  update public.orders set total = _total where id = _order_id;
  return _order_id;
end $$;
grant execute on function public.place_order(text,text,text,text,jsonb) to anon, authenticated;

insert into public.categories (name) values
 ('Cricket'),('Football'),('Badminton'),('Gym Equipment'),('Sportswear'),('Shoes'),('Fitness Accessories');

insert into public.products (name, description, price, stock, low_stock_threshold, category_id, image_url)
select p.name, p.descr, p.price, p.stock, 5, c.id, p.img from (values
 ('Pro English Willow Cricket Bat','Grade 1 English willow, full-size, balanced pickup for powerful strokes.', 4999.00, 12, 'Cricket','/images/products/cricket-bat.jpg'),
 ('Kashmir Willow Practice Bat','Durable bat ideal for practice and tennis-ball cricket.', 1499.00, 3, 'Cricket','/images/products/cricket-bat.jpg'),
 ('Leather Cricket Ball (Pack of 2)','Hand-stitched red leather match balls.', 899.00, 40, 'Cricket','/images/products/cricket-ball.jpg'),
 ('Match Football Size 5','FIFA-quality thermo-bonded match ball.', 1299.00, 25, 'Football','/images/products/football.jpg'),
 ('Training Football Size 4','Soft-touch ball for juniors and drills.', 699.00, 4, 'Football','/images/products/football.jpg'),
 ('Carbon Badminton Racket','Lightweight 85g full-carbon frame with high tension strings.', 2199.00, 18, 'Badminton','/images/products/badminton.jpg'),
 ('Feather Shuttlecocks (12)','Tournament grade goose-feather shuttles.', 1099.00, 2, 'Badminton','/images/products/badminton.jpg'),
 ('Adjustable Dumbbell Set 20kg','Chrome plates with secure spin-lock handles.', 3499.00, 9, 'Gym Equipment','/images/products/dumbbells.jpg'),
 ('Kettlebell 12kg','Cast iron kettlebell with wide grip handle.', 1899.00, 6, 'Gym Equipment','/images/products/dumbbells.jpg'),
 ('Dri-Fit Training T-Shirt','Breathable, quick-dry fabric for intense workouts.', 799.00, 50, 'Sportswear','/images/products/tshirt.jpg'),
 ('Performance Track Pants','Stretchable slim-fit joggers with zip pockets.', 1199.00, 22, 'Sportswear','/images/products/tshirt.jpg'),
 ('Velocity Running Shoes','Cushioned midsole, breathable mesh upper.', 3999.00, 15, 'Shoes','/images/products/shoes.jpg'),
 ('Football Studs Boots','Firm-ground studs for grip and control.', 2799.00, 1, 'Shoes','/images/products/shoes.jpg'),
 ('Non-Slip Yoga Mat 6mm','Extra-thick TPE mat with carry strap.', 999.00, 30, 'Fitness Accessories','/images/products/yoga-mat.jpg'),
 ('Resistance Bands Set','5 bands with handles, door anchor and ankle straps.', 849.00, 20, 'Fitness Accessories','/images/products/yoga-mat.jpg'),
 ('Skipping Rope Speed','Ball-bearing handles, adjustable steel cable.', 349.00, 35, 'Fitness Accessories','/images/products/yoga-mat.jpg')
) as p(name, descr, price, stock, cat, img)
join public.categories c on c.name = p.cat;