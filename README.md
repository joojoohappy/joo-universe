# JOO JOO — personal website

**I notice → I question → I build.** A single-page site built with React 19, Vite 8, TypeScript and Tailwind CSS v4, finished from the Figma Make export.

- **00 ME / 01 ATTENTION.** The hero: oversized JOO type, a digital portrait that tilts toward the pointer, and four photo fragments (pink cloud, moon, cat, live performance). Mouse users reveal a fragment by moving close to it. On touch devices, fragments reveal as you scroll past them, and a tap pins one open. Keyboard users reveal them with Tab.
- **02 QUESTIONS.** The project orbit. Select a project by clicking or tapping it, with ← → / Home / End, or by dragging or swiping the orbit.
- **03 NOW.** Where I am and what I'm working on, plus contact links.

All motion respects `prefers-reduced-motion`.

## Editing content

Text, project questions and links live in **`src/content.ts`**.

- If a contact link or project link is set to `undefined`, it isn't rendered. The site never falls back to a generic placeholder destination.
- The page title, description and social text are in `index.html`. The social preview image is `public/og-image.png`.

## Local development

```bash
pnpm install
pnpm dev          # http://localhost:5173
pnpm build        # production build → dist/
pnpm preview      # serve dist/
pnpm typecheck
```

Node 22 and pnpm 10 (see `.mise.toml`).

## Deploying to GitHub Pages

The workflow at `.github/workflows/deploy.yml` builds and deploys on every push to `main`. It reads the right base path from `actions/configure-pages`:

| Repository name | Site URL | Base path |
| --- | --- | --- |
| `joojoohappy.github.io` | `https://joojoohappy.github.io/` | `/` |
| `joos-universe` (any other name) | `https://joojoohappy.github.io/joos-universe/` | `/joos-universe/` |

First-time setup:

1. Create a repository on GitHub. Repo names can't contain spaces or apostrophes, so for "Joo's Universe" use something like `joos-universe`. Don't add a README or license there.
2. Push this folder:
   ```bash
   git init -b main
   git add .
   git commit -m "JOO JOO site"
   git remote add origin https://github.com/joojoohappy/joos-universe.git
   git push -u origin main
   ```
3. On GitHub, go to **Settings → Pages → Build and deployment → Source** and choose **GitHub Actions**.
4. Open **Actions → Deploy to GitHub Pages**. If the first run failed because Pages wasn't enabled yet, choose **Re-run all jobs**. When it's green, the URL appears on the `deploy` job.

To build locally for a project-site path, run `BASE_PATH=/joos-universe/ SITE_URL=https://joojoohappy.github.io/joos-universe pnpm build`.

## Assets

- **Fonts** are self-hosted in `public/fonts/`. They are Syne (variable, Latin subset) and IBM Plex Mono Regular, both under the SIL Open Font License 1.1 (see `public/fonts/`).
- **Images.** The original Figma exports are kept in `src/assets/` as source files. The site uses the responsive WebP versions in `src/assets/img/`, which you can regenerate with `scripts/optimize-images.mjs`.
- `.figma/` holds Figma Make tooling. The production build doesn't use it.
