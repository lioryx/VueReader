# txt reader

## Project Snapshot

- This is a Vue 3 + TypeScript + Vite PWA for local TXT novel reading, optimized for mobile/offline use. See [README.md](README.md) for the product overview and roadmap.
- The app stores all user data locally in IndexedDB via Dexie; avoid introducing backend assumptions unless explicitly requested.
- Vite uses `base: '/VueReader/'`; keep asset paths, router behavior, and GitHub Pages deployment compatibility in mind.

## Commands Agents Should Run

- Install: `pnpm install`
- Dev server: `pnpm dev`
- Production build and type check: `pnpm build`
- Type check only: `pnpm type-check`
- Lint with fixes: `pnpm lint`
- Format source: `pnpm format`
- Preview PWA build: `pnpm build && pnpm preview`

Use Node `^20.19.0 || >=22.12.0`, matching [package.json](package.json). There is no test script currently; for behavior changes, verify with focused manual checks and at least `pnpm build`.

## Source Boundaries

- `src/views/` contains route-level screens. `ReaderView.vue` is the main reference for reader interaction, pagination, TTS, wake lock, and progress tracking.
- `src/components/` contains reusable/presentational UI. Prefer props and emits for parent communication.
- `src/stores/` contains Pinia composition stores. DB reads/writes and cross-table transactions belong here when tied to app state.
- `src/db/index.ts` defines Dexie tables and types. Update schema, indexes, and affected store logic together.
- `src/utils/` contains pure domain utilities such as encoding detection, chapter parsing, and pagination measurement.
- `src/workers/parser.worker.ts` handles TXT decoding and chapter parsing off the main thread. Keep large-file parsing work out of UI components.
- `src/router/index.ts` is route-only wiring using `createWebHistory(import.meta.env.BASE_URL)`.

## Project-Specific Pitfalls

- TXT parsing normalizes CRLF/CR to LF before chapter offsets are stored; preserve offset math when changing parser or reader slicing logic.
- Chapter detection is tuned for Chinese novel headings and falls back to a single `全文` chapter.
- Reading progress percent is based on full-book character offset, not just the current chapter.
- Import and delete flows touch multiple IndexedDB tables; keep related writes in Dexie transactions.
- Reader pagination depends on DOM measurements and resize/font settings. Re-check both scroll and paged reading modes after layout changes.
- E-ink mode is controlled by a global `data-eink-mode` attribute and strips motion/shadows; avoid adding UI effects that ignore that mode.

## Coding Guidelines

### 1. Think Before Coding

**Don't assume. Don't hide confusion. Surface tradeoffs.**

Before implementing:

- State your assumptions explicitly. If uncertain, ask.
- If multiple interpretations exist, present them - don't pick silently.
- If a simpler approach exists, say so. Push back when warranted.
- If something is unclear, stop. Name what's confusing. Ask.

### 2. Simplicity First

**Minimum code that solves the problem. Nothing speculative.**

- No features beyond what was asked.
- No abstractions for single-use code.
- No "flexibility" or "configurability" that wasn't requested.
- No error handling for impossible scenarios.
- If you write 200 lines and it could be 50, rewrite it.

Ask yourself: "Would a senior engineer say this is overcomplicated?" If yes, simplify.

### 3. Surgical Changes

**Touch only what you must. Clean up only your own mess.**

When editing existing code:

- Don't "improve" adjacent code, comments, or formatting.
- Don't refactor things that aren't broken.
- Match existing style, even if you'd do it differently.
- If you notice unrelated dead code, mention it - don't delete it.

When your changes create orphans:

- Remove imports/variables/functions that YOUR changes made unused.
- Don't remove pre-existing dead code unless asked.

The test: Every changed line should trace directly to the user's request.

### 4. Goal-Driven Execution

**Define success criteria. Loop until verified.**

Transform tasks into verifiable goals:

- "Add validation" → "Write tests for invalid inputs, then make them pass"
- "Fix the bug" → "Write a test that reproduces it, then make it pass"
- "Refactor X" → "Ensure tests pass before and after"

For multi-step tasks, state a brief plan:

```
1. [Step] → verify: [check]
2. [Step] → verify: [check]
3. [Step] → verify: [check]
```

Strong success criteria let you loop independently. Weak criteria ("make it work") require constant clarification.

---

**These guidelines are working if:** fewer unnecessary changes in diffs, fewer rewrites due to overcomplication, and clarifying questions come before implementation rather than after mistakes.
