# AGENTS.md

## Project Overview

- This is a Vue 3 frontend application built with Vite.
- Use Pinia for shared state and Vue Router for routing.
- Use npm as the package manager.

## Environment

- Use Node.js `^22.18.0 || >=24.12.0`.
- Install dependencies with `npm install`.
- Refer to `.env.example` for environment variables.
- Never commit `.env` files, credentials, tokens, or other secrets.

## Commands

- Start the development server with `npm run dev`.
- Create a production build with `npm run build`.
- Preview the production build with `npm run preview`.
- Format source files with `npm run format`.
- The current `npm test` script does not run an actual test suite. Do not report it as test verification.

## Project Structure

- `src/pages/`: route-level page components
- `src/components/`: reusable UI components
- `src/router/`: Vue Router configuration
- `src/stores/`: Pinia stores
- `src/api/`: API clients and adapters
- `src/utils/`: shared utility functions
- `src/assets/`: styles, fonts, and images
- `public/`: static files served without bundling

## Coding Conventions

- Prefer the Vue Composition API and `<script setup>` for Vue components.
- Follow the JavaScript patterns already established in nearby files.
- Keep component-local state inside the component and use Pinia only for shared state.
- Extract reusable logic into utilities or composables rather than duplicating it.
- Check existing components and styles before introducing a new pattern.
- Follow the formatting rules in `.prettierrc.json`.
- Do not modify files unrelated to the requested change.

## CSS Rules

- Do not modify `src/assets/css/main.css`.
- When a page or component needs new or changed styling, create a separate CSS file for that page or component and import it where needed.
- Keep page-specific and component-specific styles out of `main.css`.
- Name new CSS files after the related page or component so their ownership is clear.

## Dependency Policy

- Check whether existing dependencies can solve the problem before adding a new package.
- Ask for confirmation before adding a new production dependency.
- When dependencies change, update both `package.json` and `package-lock.json`.

## Verification

- Check syntax and import paths in every changed file.
- Apply the repository's formatting rules when needed.
- Run `npm run build` after code changes.
- For UI changes, verify loading, empty, error, and relevant responsive states.
- If verification cannot be run, clearly state what was not run and why.

## Continuous Improvement

- When the agent makes a mistake or the user corrects its work, fix the immediate problem first.
- After fixing it, automatically add a concise prevention rule to this `AGENTS.md` when the lesson is reusable for future work.
- Treat user corrections, broken builds caused by the change, regressions, and violations of repository conventions as mistakes worth evaluating.
- Add the new rule to the most relevant existing section instead of creating a disconnected list.
- Do not add a rule for a one-off typo unless it reveals a repeatable failure pattern.
- Before adding a rule, check for existing rules and update the relevant rule rather than creating duplicates or contradictions.
- Keep prevention rules specific, actionable, and verifiable.
- Never weaken or remove an existing rule while recording a new lesson unless the user explicitly requests it.
- Mention every automatic `AGENTS.md` rule addition in the final work summary.

## Git and Review

- Use Conventional Commits for commit messages.
- Do not modify or commit generated `dist/` files unless explicitly requested.
- Preserve existing user changes and do not overwrite unrelated work.
- Keep large refactors separate from functional changes.

## Code Review Rules

- Check that route changes do not break existing URLs or navigation.
- When adding an authenticated nested route, verify the post-login redirect allowlist accepts that nested path.
- Check that API-backed screens handle loading and error states.
- Check that source files do not contain environment variables, tokens, credentials, or personal data.
- Review UI changes for mobile layout and basic accessibility.
- Flag any change that modifies `src/assets/css/main.css`; page and component styling must use separate CSS files.
