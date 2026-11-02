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

- Keep the GlobalCougar prototype self-contained in `public/globalcougar.html` so it can be tested or shared as one runnable file.
- Shared student data (milestone progress, discussion posts) is stored in Lovable Cloud `public` tables and reached through the API route under `src/routes/api/public/`, because a class demo needs one board and one checklist that every visitor sees; the HTML keeps its localStorage fallback so the single file still runs standalone.
- Journey task definitions, date rules, and modal rendering remain data-driven inside the standalone HTML; semantic task keys map legacy progress conservatively, avoiding index-based completion of unrelated tasks. The journey API stores only explicitly public demo progress and planning dates, never sensitive documents or private identities.
