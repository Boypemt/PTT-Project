Read CLAUDE.md and docs/PROJECT_BRIEF.md first.

Task: bootstrap the project in THIS folder (it already contains CLAUDE.md and docs/ — keep them).

1. The repo already exists with a first commit on `main` and remote `origin` = https://github.com/Boypemt/PTT-Project.git. Run `git pull` on main first.
2. Create branch `chore/bootstrap`.
3. Scaffold Vite + React + TypeScript (scaffold into a temp dir and move files in, since the folder is not empty). Package name `paton-phueng-customizer`. Enable TS strict, path alias `@/` -> `src/`.
4. Add Tailwind CSS (current stable, Vite plugin setup). Define theme tokens inspired by the eco-print palette in the brief (forest green, teak purple, marigold gold, warm off-white paper background). Add Google fonts: a Thai-capable sans (e.g. "IBM Plex Sans Thai" or "Noto Sans Thai") for body.
5. Create the empty folder structure from CLAUDE.md with a short README.md in each explaining its purpose (not .gitkeep).
6. Replace Vite demo content with a minimal placeholder page "Pa Ton Phueng Customizer — coming soon".
7. Root README.md: project summary, stack, `npm install` / `npm run dev` / `npm run build`, link to docs/.
8. .gitignore, .nvmrc (Node 24 LTS), and "engines": { "node": ">=24" } in package.json, .editorconfig.

Commit plan (separate commits, Conventional Commits):
- chore: scaffold vite react-ts app
- chore: enable strict ts and @ path alias
- chore(ui): add tailwind and theme tokens
- chore: add folder structure
- docs: add root readme

Then push the branch to origin and open the PR into main with `gh pr create`. If `gh` is unavailable, push and print the PR title + body for me.
