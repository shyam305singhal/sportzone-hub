<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

- Checkout goes through the `place_order` database function, which locks rows, checks and decrements stock atomically — never write orders or stock from the client directly.
- Admin access is the `admin` row in `user_roles` checked via `has_role`; RLS enforces it, the `/admin` route check is UX only. The first account to sign up becomes admin.
