GRANT SELECT, INSERT, UPDATE, DELETE ON public.products, public.categories TO anon, authenticated;
GRANT SELECT, UPDATE ON public.orders TO anon, authenticated;
GRANT SELECT ON public.order_items TO anon, authenticated;
CREATE POLICY "open products write" ON public.products FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "open categories write" ON public.categories FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "open orders read" ON public.orders FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "open orders update" ON public.orders FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "open items read" ON public.order_items FOR SELECT TO anon, authenticated USING (true);