# Baguette App Redesign — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild the baguette recipe app as `baguette-v2.html` with a flour-profile
architecture (per-flour recipe params + user overrides), no season toggle, a two-tier
mobile-first control layout, "why this default" tooltips, and the Modern Boulangerie
visual system — leaving `baguette.html` untouched and deployed for comparison.

**Architecture:** One resolver, `eff(key)`, resolves every recipe parameter through
`userOverride ?? flour.rx ?? GLOBAL`. Continuous params blend across the two flours;
discrete params take the dominant flour. All UI reads effective values and shows their
source. Single self-contained HTML file, vanilla JS, no build step.

**Tech Stack:** HTML + CSS + vanilla JS (single file). Fonts: Bricolage Grotesque +
Hanken Grotesk (Google Fonts). Tests: Node ≥18 with a DOM stub (no framework).

## Progress (resume here)

- ✅ **Task 0** — fork `baguette-v2.html` + trim flour list to 5. (commit `aeafe2e`)
- ✅ **Task 1** — `{props,rx}` + `GLOBAL` + `eff()`/`sourceOf()` + `userOverride` + `test/logic.test.js`. (commit `aeafe2e`)
- ✅ **Task 2** — season removed, temperature-driven, legacy-prefs tolerant. (commit `729a60d`)
- 🔶 **Task 3 — IN PROGRESS** (committed as WIP). Done so far: two-tier controls markup (Batch/Dough/Environment/Method + Advanced panel with Bowl/Folds/Fermentolyse/Bench-rest/Development/Malt); handlers `stepOverride`/`setOverrideInput`/`resetOverride`/`setDevelop`/`setMalt`/`toggleAdvanced`; pill helpers `setPill`/`shortFlour`; CSS for `.group-label`/`.adv-toggle`/`.src`; `update()` now resolves **hydration/fermentolyse/detente via `eff()`**. **REMAINING:**
  1. In `update()` after `const salt = …`: add `const developV = eff('develop', ctx); const maltPct = eff('malt', ctx); const maltGrams = totalFlour * (maltPct/100);`
  2. At the **end** of `update()`: set `#hydration`.value = `Math.round(baseHyd*100)`, `#fermentolyse`.value = `fermentolyseTime`, `#detente`.value = `detenteFloorV`; toggle `#developToggle`/`#maltToggle` active buttons by `developV`/`maltPct`; call `setPill('hydration'|'fermentolyse'|'detente'|'develop'|'malt')`; set `#src-folds` pill (`foldOverride!=null ? 'custom' : shortFlour(flourInfo[domFlour].name)`).
  3. Add diastatic-malt row to the **Final Dough** table when `maltPct>0`.
  4. Add development guidance line to the **Bulk Fermentation** step (gentle → coil-only; intensive → slap-and-fold to shiny).
  5. Verify Advanced opens and all controls persist; `node test/logic.test.js` green.
- ⬜ **Task 4** — Oven-Spring visual system (Hedvig Letters + Figtree, terracotta tokens, hero SVG, stage strip, status hero + bulk-progress estimate, motion). Source: `docs/previews/boulangerie-overdrive.html`. This is where the Inter/DM-Serif `overused-font` findings clear.
- ⬜ **Task 5** — "why this default" tooltips.
- ⬜ **Task 6** — polish + `/impeccable audit` (+ critique/polish sonnet sub-agents).

Guardrail: run `node test/logic.test.js` after each change — it evals the `<script>` and runs `update()` under a DOM stub, so it catches crashes even though it can't verify visuals.

## Global Constraints

- Everything ships in one file `baguette-v2.html`; **do not modify `baguette.html`**.
- No build tooling, no dependencies, no framework — must open as a static file.
- **Preserve the shaping GIFs** (`images/*.gif`): same images, captions, order.
- **Preserve localStorage** (`baguette_prefs`): every control saves + restores,
  including the new `userOverride` object.
- **Mobile-first:** verify at 360–390px before desktop; ≥44px touch targets; no
  horizontal scroll.
- **Design:** Modern Boulangerie tokens from the spec; contrast ≥4.5:1 (body/labels);
  no layout-property animation (use `grid-template-rows: 0fr→1fr`); honour impeccable
  absolute bans; every animation has a `prefers-reduced-motion` fallback.
- Visual source of truth: **`docs/previews/boulangerie-overdrive.html`** (confirmed
  "Oven Spring" direction: Hedvig Letters Serif + Figtree, terracotta, the side-on
  animated baguette hero, stage strip, status hero, hierarchy). `theme-preview.html`
  and `boulangerie-fonts.html` are earlier exploration only.
- **Fonts are Hedvig Letters Serif (display) + Figtree (body/UI/numerals), not
  Bricolage/Hanken.** Task 4 steps referencing fonts use these.
- Task 4 builds the Oven-Spring hero (side-on baguette SVG: spring, opening scores,
  glow, steam) + stage strip + status hero. The status hero's "% risen" needs a
  bulk-progress estimate (elapsed vs. computed bulk time) — add it in Task 3.
- Design spec: `docs/superpowers/specs/2026-07-12-baguette-redesign-design.md`.
- Flour list is exactly: `mb, pizzeria, nuvola, bread, wholemeal` (spelt + doppia gone).

---

### Task 0: Fork the file and trim the flour list

**Files:**
- Create: `baguette-v2.html` (copy of `baguette.html`)

- [ ] **Step 1: Copy the file**

Run: `cp baguette.html baguette-v2.html`

- [ ] **Step 2: Update the title and remove spelt + doppia**

In `baguette-v2.html`: change `<title>` to `Perth Baguettes v2 — Poolish Method`.
Delete the `doppia` and `spelt` `<option>`s from both `#flourA` and `#flourB` selects,
and delete the `doppia` and `spelt` entries from the `flourInfo` object. Ensure
`#flourB` still defaults to `wholemeal` (keep its `selected` attribute).

- [ ] **Step 3: Verify it loads**

Open `baguette-v2.html` in a browser. Recipe renders, flour dropdowns show 5 options,
no console errors. `baguette.html` is unchanged.

- [ ] **Step 4: Commit**

```bash
git add baguette-v2.html
git commit -m "feat(v2): fork baguette-v2.html, trim flour list to 5"
```

---

### Task 1: Foundation — GLOBAL defaults, {props,rx} model, eff() resolver

Introduces the whole architecture with a test file. No layout change; some *values*
intentionally shift where a flour's `rx` differs (e.g. Caputo hydration → 65%).

**Files:**
- Create: `test/logic.test.mjs`
- Modify: `baguette-v2.html` (`<script>`: `flourInfo`, new `GLOBAL`, `eff()`,
  `userOverride`; route folds + hydration through `eff`)

**Interfaces:**
- Produces:
  - `const GLOBAL = { hydration:72, fermentolyse:45, folds:['sf','sf','cf','cf'], develop:'standard', detenteFloor:20, malt:0, bakeC:240 }`
  - `flourInfo[key] = { name, props:{strength,extensibility,activity,absorption}, rx:{...} }`
  - `eff(key, ctx)` where `ctx = { override, fA, fB, blendA }`; returns the effective value.
  - `sourceOf(key, ctx)` → `'custom' | {flour:name} | {blend:[a,b]} | 'default'`
  - `let userOverride = {}` (persisted in `baguette_prefs`)

- [ ] **Step 1: Write the failing tests**

Create `test/logic.test.mjs`. It loads the `<script>` from `baguette-v2.html` with a
DOM stub (same approach as the fold-count test used earlier) and asserts:

```js
import assert from 'node:assert';
import fs from 'node:fs';
const js = fs.readFileSync('baguette-v2.html','utf8').match(/<script>([\s\S]*?)<\/script>/)[1];
const vals = { count:'4', weight:'250', hydration:'', ambientTemp:'18', poolishPct:'30',
               flourA:'mb', flourB:'wholemeal', blend:'100', pctA:'100', pctB:'0', foldCount:'2' };
const stub = id => ({ get value(){return vals[id];}, set value(v){vals[id]=String(v);},
  set innerHTML(v){}, classList:{toggle(){},add(){},remove(){},contains(){return false;}},
  textContent:'', dataset:{}, max:'6', min:'1', querySelector(){return {textContent:''};} });
global.document = { getElementById: stub, querySelectorAll: () => [] };
global.localStorage = { getItem:()=>null, setItem:()=>{} };
global.window = {};
eval(js);

// precedence: override > flour > global
assert.equal(eff('hydration', {override:{hydration:80}, fA:'mb', fB:'mb', blendA:100}), 80);
assert.equal(eff('hydration', {override:{}, fA:'mb', fB:'mb', blendA:100}), 75);   // mb rx
assert.equal(eff('hydration', {override:{}, fA:'bread', fB:'bread', blendA:100}), 72); // GLOBAL
// continuous blend: 50/50 mb(75) + Caputo(65) = 70
assert.equal(eff('hydration', {override:{}, fA:'mb', fB:'pizzeria', blendA:50}), 70);
// discrete dominant: 70% mb -> mb folds (2 coil)
assert.deepEqual(eff('folds', {override:{}, fA:'mb', fB:'pizzeria', blendA:70}), ['cf','cf']);
assert.deepEqual(eff('folds', {override:{}, fA:'mb', fB:'pizzeria', blendA:40}), ['sf','sf','cf','cf']);
// buildFolds keeps coil-heavy tail
assert.deepEqual(buildFolds(['sf','sf','cf','cf'], 2), ['cf','cf']);
console.log('logic tests passed');
```

- [ ] **Step 2: Run to verify it fails**

Run: `node test/logic.test.mjs`
Expected: FAIL (`eff is not defined`).

- [ ] **Step 3: Implement GLOBAL, the {props,rx} model, and eff()**

In `baguette-v2.html`:
- Add the `GLOBAL` constant (above).
- Rewrite `flourInfo` so each entry is `{name, props, rx}`. Full profiles for `mb` and
  `pizzeria` (spec §Architecture); light `rx.hydration` for `wholemeal`; near-empty
  `rx` for `nuvola`, `bread`. Move each flour's existing `folds` into `rx.folds`.
- Add `let userOverride = {}`.
- Add the resolver:

```js
const CONTINUOUS = ['hydration','fermentolyse','detenteFloor','bakeC'];
function eff(key, ctx) {
  if (ctx.override[key] != null) return ctx.override[key];
  const a = flourInfo[ctx.fA].rx[key], b = flourInfo[ctx.fB].rx[key];
  if (CONTINUOUS.includes(key)) {
    const va = a != null ? a : GLOBAL[key], vb = b != null ? b : GLOBAL[key];
    return (va * ctx.blendA + vb * (100 - ctx.blendA)) / 100;
  }
  const dom = ctx.blendA >= (100 - ctx.blendA) ? a : b;
  return dom != null ? dom : GLOBAL[key];
}
function sourceOf(key, ctx) {
  if (ctx.override[key] != null) return 'custom';
  const a = flourInfo[ctx.fA].rx[key], b = flourInfo[ctx.fB].rx[key];
  if (a == null && b == null) return 'default';
  if (ctx.blendA === 100 || ctx.fA === ctx.fB) return { flour: flourInfo[ctx.fA].name };
  if (ctx.blendA === 0) return { flour: flourInfo[ctx.fB].name };
  return CONTINUOUS.includes(key) ? { blend: [flourInfo[ctx.fA].name, flourInfo[ctx.fB].name] }
                                  : { flour: flourInfo[ctx.blendA >= 50 ? ctx.fA : ctx.fB].name };
}
```
- In `update()`, build `ctx` once and route the existing folds + hydration derivations
  through `eff('folds', ctx)` and `eff('hydration', ctx)`. Fold the old `foldOverride`
  into `userOverride.folds`; fold the Hydration input into `userOverride.hydration`
  (empty input = no override).

- [ ] **Step 4: Run tests to verify they pass**

Run: `node test/logic.test.mjs`
Expected: `logic tests passed`.

- [ ] **Step 5: Verify no console errors and recipe still renders**

Open `baguette-v2.html`; switch flours; confirm hydration shows the flour target
(mb 75%, Caputo 65%) and folds match. No layout change yet.

- [ ] **Step 6: Commit**

```bash
git add baguette-v2.html test/logic.test.mjs
git commit -m "feat(v2): flour {props,rx} model + eff() resolution cascade"
```

---

### Task 2: Remove the season toggle

**Files:**
- Modify: `baguette-v2.html`
- Modify: `test/logic.test.mjs` (add legacy-prefs assertion)

**Interfaces:**
- Removes: `season` state, `S{}`, `setSeason`, `#seasonToggle`, season keys in prefs.

- [ ] **Step 1: Add a failing test for legacy prefs tolerance**

Append to `test/logic.test.mjs`: load `loadPrefs` with a stored blob containing
`{"season":"winter","hydration":"70"}` and assert it does not throw and applies
`hydration`. (Stub `localStorage.getItem` to return the blob.)

Run: `node test/logic.test.mjs` → Expected: FAIL if load path references `season`.

- [ ] **Step 2: Delete season**

Remove `let season`, the `S` object, `setSeason`, the `#seasonToggle` markup, and every
`season`/`s.` reference. Replace `s.poolishOffsetHrs` with `const POOLISH_OFFSET_HRS = 12`.
Reword any season-specific copy (e.g. `fridgeNote`, `samedayNote`) into temperature-based
sentences keyed off `tempC`. Drop `season` from `savePrefs`; leave `loadPrefs` tolerant of
an old `season` key (ignore it).

- [ ] **Step 3: Run tests**

Run: `node test/logic.test.mjs` → Expected: all pass.

- [ ] **Step 4: Verify**

Open the file: no Season control; formula summary no longer shows season; schedule +
notes still render. Old saved prefs (with `season`) load without error.

- [ ] **Step 5: Commit**

```bash
git add baguette-v2.html test/logic.test.mjs
git commit -m "feat(v2): remove season toggle; timing is temperature-driven"
```

---

### Task 3: Two-tier control restructure + new tuning controls

Structure and wiring only — still the old skin. New controls read `eff()` and write
`userOverride`, each with a source pill + reset.

**Files:**
- Modify: `baguette-v2.html`

**Interfaces:**
- Consumes: `eff`, `sourceOf`, `userOverride` (Task 1).
- Produces: `setOverride(key, val)`, `resetOverride(key)`, `renderSource(key, ctx)`;
  grouped Essentials markup + `#advanced` disclosure.

- [ ] **Step 1: Regroup Essentials**

Reorganise the controls markup into labelled groups: *Batch* (Quantity, Weight),
*Dough* (Flour A/B blend, Hydration, Poolish %), *Environment* (Room Temp), *Method*
(Cold Retard / Same Day). Pure markup regroup; existing handlers keep working.

- [ ] **Step 2: Add the Advanced disclosure with tuning controls**

Add a collapsed `#advanced` disclosure containing: Bowl material (moved here),
Fermentolyse (stepper), Development (Gentle/Standard/Intensive toggle), Diastatic malt
(switch + `0.5%` when on), Bench-rest floor (stepper), and the existing Folds stepper.
Wire each through `setOverride`/`resetOverride`:

```js
function setOverride(key, val) { userOverride[key] = val; savePrefs(); update(); }
function resetOverride(key) { delete userOverride[key]; savePrefs(); update(); }
```

- [ ] **Step 3: Add source pills + reset to every derived control**

Add `renderSource(key, ctx)` returning the pill HTML from `sourceOf` (`auto · from X` /
`auto · blend of X+Y` / `custom · reset` / `default`). Render it under each of:
hydration, fermentolyse, folds, develop, malt, detenteFloor, bakeC.

- [ ] **Step 4: Extend persistence**

Update `savePrefs`/`loadPrefs` to serialise/restore `userOverride` (and drop the old
standalone `foldOverride` key, now `userOverride.folds`). Verify all controls restore
after reload.

- [ ] **Step 5: Verify on mobile width**

At 360–390px: groups stack cleanly, Advanced toggles open/closed, overrides + resets
work, values persist across reload. No horizontal scroll.

- [ ] **Step 6: Commit**

```bash
git add baguette-v2.html
git commit -m "feat(v2): two-tier controls, tuning overrides, source pills"
```

---

### Task 4: Apply the Modern Boulangerie visual system

**Files:**
- Modify: `baguette-v2.html`

- [ ] **Step 1: Tokens + fonts**

Replace `:root` with the spec tokens (terracotta `#9E3B2E`, white bg, cream on-color,
etc.) and standard state variants. Swap the Google Fonts link to Bricolage Grotesque +
Hanken Grotesk; set display vs body/numeral families; numerals use
`font-variant-numeric: tabular-nums`. Fixed rem scale.

- [ ] **Step 2: Header + components**

Restyle to match `docs/previews/theme-preview.html`: terracotta header block with the
live formula line; the select / stepper / slider / toggle / switch / disclosure / tip /
source-pill vocabulary consistent across the whole app (including recipe + schedule +
step cards).

- [ ] **Step 3: Motion**

Convert collapsibles (Advanced, Schedule, tips) to `grid-template-rows: 0fr→1fr` (no
`max-height`/layout-property animation). Transitions 150–250ms ease-out. Add
`@media (prefers-reduced-motion: reduce)` fallbacks.

- [ ] **Step 4: Design audit**

Run `/impeccable audit` (or `node .claude/skills/impeccable/scripts/detect.mjs --json baguette-v2.html`).
Fix real findings; confirm no `overused-font`, `layout-transition`, contrast, or
absolute-ban hits. Verify GIFs still render with captions in the Final Shape step.

- [ ] **Step 5: Verify mobile-first + compare**

360–390px first, then desktop. Open old `baguette.html` and `baguette-v2.html`
side by side to confirm parity of information and the visual upgrade.

- [ ] **Step 6: Commit**

```bash
git add baguette-v2.html
git commit -m "feat(v2): apply Modern Boulangerie visual system"
```

---

### Task 5: "Why this default" tooltips

**Files:**
- Modify: `baguette-v2.html`

- [ ] **Step 1: Add tooltips to every control/derived value**

Add info affordances (reuse the `.tip` component) with concrete copy for: hydration,
fermentolyse, folds, development, diastatic malt, DDT 24°C, water temp (DDT formula),
bowl τ, poolish %, salt 1.8%, retard duration, bench-rest floor, proof window. Each
explains *why the default is where it is* — specific, not generic.

- [ ] **Step 2: Verify + audit**

Tooltips open/close (grid-rows motion, reduced-motion ok); readable on mobile.
Re-run `/impeccable audit`.

- [ ] **Step 3: Commit**

```bash
git add baguette-v2.html
git commit -m "feat(v2): add 'why this default' tooltips throughout"
```

---

### Task 6: Final polish & handoff

**Files:**
- Modify: `baguette-v2.html`

- [ ] **Step 1: Full pass**

Run `test/logic.test.mjs` (green) + `/impeccable audit` (clean). Re-check: contrast on
terracotta, ≥44px targets, no horizontal scroll at 360px, reduced-motion, GIFs intact,
every control persists across reload, all resets return to flour/global values.

- [ ] **Step 2: Commit**

```bash
git add baguette-v2.html
git commit -m "chore(v2): final polish pass"
```

- [ ] **Step 3: Promotion (defer to user)**

Do **not** replace `baguette.html` automatically. Once the user approves after
side-by-side comparison, promote `baguette-v2.html` to primary in a separate step.

---

## Self-Review

- **Spec coverage:** model (T1), cascade+source (T1/T3), season removal (T2), two-tier
  layout (T3), visual system (T4), tooltips (T5), GIF + localStorage preservation
  (Global Constraints + T3/T4), new-file + comparison (T0/T6), mobile-first (every
  task), tests right-sized (T1/T2). All spec sections map to a task.
- **Placeholder scan:** none — code shown for logic/tests; UI tasks point to committed
  preview files as the concrete visual source.
- **Type consistency:** `eff(key, ctx)`, `ctx={override,fA,fB,blendA}`, `sourceOf`,
  `setOverride`/`resetOverride`, `userOverride`, `GLOBAL`, `CONTINUOUS` are used
  consistently across Tasks 1→6.

## Execution Handoff

Plan complete and saved to `docs/superpowers/plans/2026-07-12-baguette-redesign.md`.
Two execution options:

1. **Subagent-Driven (recommended)** — a fresh subagent per task with review between
   tasks; fast iteration, each task gated.
2. **Inline Execution** — execute tasks in this session with checkpoints for review.

Which approach?
