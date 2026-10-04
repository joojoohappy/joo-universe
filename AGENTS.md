# JOO JOO personal website

React 19 + Vite 8 + TypeScript + Tailwind CSS v4. Originally exported from Figma Make. It now builds and deploys on its own to GitHub Pages; see README.md.

- `src/content.ts` holds all copy, links and projects. Edit content here.
- `src/components/` contains `Masthead`, `Hero` (portrait tilt, photo fragments), `Questions` (orbit) and `Now`.
- `src/index.css` contains the fonts, theme tokens and the scaled-canvas system. `.canvas` sets `--u`: 1440-based at ≥768px and 390-based below that. `.cv` elements are positioned from `--x/--y/--w/--h/--fs`, with mobile values in `--m*`.
- `vite.config.ts` reads `BASE_PATH` and `SITE_URL` from the environment, and the GitHub workflow sets both.
- Keep the visual direction in the Figma export. Don't add sections, stock imagery, a backend or a CMS.
