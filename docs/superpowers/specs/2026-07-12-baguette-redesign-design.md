# Baguette App Redesign — Design Spec

**Date:** 2026-07-12
**Branch:** `feature/flour-profiles-ui`
**Status:** Draft for review

## Goal

Redesign the whole single-file baguette recipe app around a **flour-profile
architecture** (per-flour recipe parameters with user overrides), remove the now-
redundant season toggle, add "why this default" tooltips throughout, and re-skin
the entire UI in a new visual direction (Modern Boulangerie) with an intuitive,
mobile-first, two-tier control layout.

## Scope

**Build as a NEW file:** the redesign ships as `baguette-v2.html`, leaving the
current `baguette.html` untouched and still deployed on GitHub Pages. Both are
reachable (`…/baguette.html` and `…/baguette-v2.html`) so they can be compared
side by side. Once approved, `baguette-v2.html` is promoted to primary. Phase 0
copies the current file as the starting point.

**Mobile compatibility is a first-class requirement**, not an afterthought. The
app is used on a phone in the kitchen. Every phase is verified at a 360–390px
viewport first; ≥44px touch targets; no horizontal scroll; controls remain usable
one-handed with floury hands. A change that looks good on desktop but crowds the
phone is a defect.

**Must preserve (do not regress):**
- The **shaping GIFs** in the Final Shape step (`images/*.gif`) — same images,
  captions, and order; only their surrounding styling changes.
- **localStorage persistence** of all user inputs (`baguette_prefs`) — every control
  saves and restores, including the new `userOverride` object. Behaviour is at least
  as complete as today's `savePrefs`/`loadPrefs`.

**In scope (whole-app redesign):**
- Flour `{props, rx}` profile model + global→flour→user resolution cascade.
- Remove Summer/Winter season toggle and the `S{}` object.
- Two-tier control layout: grouped Essentials (visible) + collapsible Advanced/flour-tuning.
- New visual system (Modern Boulangerie): palette, type, components, motion.
- Informational tooltips explaining every default's reasoning.
- Restyle recipe output, schedule, and method-step cards to match.

**Out of scope (this pass):**
- New baking-science formulas (Q10, Newton's-law, DDT stay as-is; only how their
  inputs are sourced changes).
- Backend/hosting (stays a static single file on GitHub Pages).
- The two throwaway preview files (`theme-preview.html`, `boulangerie-fonts.html`)
  are design artifacts — remove or move to `docs/` before merge.

## Architecture decisions

### 1. Flour profile model — descriptive vs prescriptive

Split each `flourInfo` entry into intrinsic **props** (what the flour *is*) and
prescriptive **rx** (what the recipe *does*). Anything absent from `rx` inherits
the global baseline.

```js
const GLOBAL = { hydration: 72, fermentolyse: 45, folds: ['sf','sf','cf','cf'],
                 develop: 'standard', detenteFloor: 20, malt: 0, bakeC: 240 };

const flourInfo = {
  mb: {
    name: 'Miller & Baker Plain Flour',
    props: { strength: 5, extensibility: 2, activity: 5, absorption: 5 },
    rx: { hydration: 75, fermentolyse: 60, folds: ['cf','cf'],
          develop: 'gentle', detenteFloor: 28, malt: 0, bakeC: 245 }
  },
  pizzeria: {
    name: 'Caputo Pizzeria Blue',
    props: { strength: 2, extensibility: 5, activity: 1, absorption: 2 },
    rx: { hydration: 65, folds: ['sf','sf','cf','cf'], develop: 'intensive', malt: 0.5 }
  },
  // nuvola, bread, wholemeal migrated from current {hydAdj, folds}.
  // spelt + doppia REMOVED from the list.
};
```

Migration note: the current `hydAdj` *offset* becomes an absolute `rx.hydration`
*target* (mb +5 over the old 70 base → 75; Caputo → 65 per FLOUR_NOTES.md). Current
`folds` arrays move verbatim into `rx.folds`.

### Flour list & how much to categorise

Remaining flours: **mb, pizzeria, nuvola, bread, wholemeal** (spelt + doppia removed).

You do **not** need to fully characterise every flour. Two rules keep this light:

- **`rx` is sparse — only override what actually differs from `GLOBAL`.** A flour
  that behaves like the baseline carries an empty/near-empty `rx` and just inherits.
- **`props` are descriptive metadata, not functional.** They drive display/tooltips
  ("Strong · low extensibility") and are a hook for future derived logic; the recipe
  runs entirely off `rx`. Sparse props are fine.

Practical categorisation effort:
- **mb (Yitpi)** and **pizzeria (Caputo)** — full profiles; they're the two with
  real, opposite tuning data (FLOUR_NOTES.md).
- **wholemeal** — light profile (it's the default Flour B): `rx.hydration` up a
  little, otherwise inherits.
- **nuvola, bread** — minimal `rx` (mostly inherit GLOBAL); props filled loosely.

### 2. Resolution cascade

One resolver, used everywhere, generalizing today's `foldOverride == null` pattern:

```
effective value = userOverride[key]  ??  flourValue(key)  ??  GLOBAL[key]
```

- `userOverride` is a persisted object; a key present means the user set it.
- **Blending rule for a two-flour mix:**
  - *Continuous* params (`hydration`, `fermentolyse`, `detenteFloor`, `bakeC`):
    blend-weighted average of each flour's value (falling back to GLOBAL when a
    flour omits it) — matches how `hydAdj` is blended today.
  - *Discrete* params (`folds`, `develop`, `malt`): taken from the **dominant**
    flour by blend % — matches today's `domFlour` fold logic.

### 3. Effective-value-with-source display

Every derived control shows where its value came from and offers reset:

- User override → `custom · reset`
- Single flour → `auto · from {flourName}`
- Blend → `auto · blend of {A}+{B}`
- Pure global → `default`

### 4. Season removal

- Delete `season` state, `S{summer,winter}`, `#seasonToggle`, and season branches
  in `savePrefs`/`loadPrefs`.
- Nothing is lost: `poolishOffsetHrs` was 12 for both → a constant; poolish yeast,
  DDT, water temp, and fridge/ferment notes are already driven by `tempC`. Any
  season-worded copy becomes temperature-worded.
- **localStorage migration:** old prefs contain a `season` key; `loadPrefs`'s
  optional reads already ignore unknown keys, so no crash. Stop writing `season`.

## Visual direction — "Modern Boulangerie"

Committed-colour, light. One saturated brand colour carries the surface; confident,
magazine-like. Product register (design serves the task) with brand-forward voice.

**Scene sentence:** a home baker in a bright Perth kitchen, phone propped against a
flour canister, glancing at it between folds over two days — needs high legibility
in daylight and large tap targets.

### Tokens

```
--bg:            #FFFFFF   paper white
--surface:       #FBF7F4   warm off-white (panels, chips)
--ink:           #1C1B1A   primary text
--muted:         #6E5A54   secondary text (verified ≥4.5:1 on bg & surface)
--line:          #EADFD8   hairlines/borders
--accent:        #9E3B2E   terracotta — header block, active states, slider fill, primary
--accent-ink:    #F7ECE4   cream text on terracotta (≥4.5:1 on accent)
--accent-soft:   #F6E7E1   tint for source pills / info dots
--accent-soft-ink:#8A3226  text on soft tint
```
Semantic states standardised: hover, focus (visible ring), active, disabled,
selected, error. Accent used for primary action / current selection / state only —
never decoration.

### Type

- **Display:** Bricolage Grotesque (600/700) — h1, section headers, big values-in-header.
- **Body & UI & numerals:** Hanken Grotesk (400/500/600), numerals via
  `font-variant-numeric: tabular-nums`. No separate monospace.
- Fixed rem scale (product register), ratio ~1.2. `text-wrap: balance` on headings.

### Motion

- 150–250ms, ease-out. Motion conveys state only (disclosure open, toggle,
  value change) — no page-load choreography.
- **No layout-property animation** (addresses the impeccable `layout-transition`
  finding on today's `.tip`): collapsibles animate via `grid-template-rows: 0fr→1fr`
  or transform, not `max-height`/`padding`.
- Every transition has a `@media (prefers-reduced-motion: reduce)` fallback.

### Impeccable guardrails (honour, verify with the hook + `/impeccable audit`)

Absolute bans respected: no side-stripe borders, no gradient text, no default
glassmorphism, no tracked-caps eyebrow on every group, no identical card grids.
Heading copy tested for overflow at every breakpoint. Body/label contrast ≥4.5:1.

## Information architecture — two-tier controls

**Header block (terracotta):** app title + a live one-line formula summary
(e.g. `4 × 250g · 72% · retard · 18°C`). Season removed from this line.

**Essentials (always visible), grouped:**
- *Batch* — Quantity, Weight each
- *Dough* — Flour A/B blend, Hydration, Poolish %
- *Environment* — Room Temp
- *Method* — Cold Retard / Same Day

**Advanced · flour tuning (collapsible, default collapsed):**
- Bowl material (set-once equipment choice), Folds, Fermentolyse, Development style
  (Gentle/Standard/Intensive), Diastatic malt (switch + 0.5% when on), Bench-rest floor.
- Each row shows its effective-value source pill and reset.

Mobile behaviour is structural (mobile is a first-class requirement, see Scope):
groups stack in a single column at 360–390px; controls are ≥44px touch targets; no
horizontal scroll; Advanced stays out of the way until wanted; verified on-phone
each phase before desktop.

## Components & states

Reuse a single vocabulary across the whole app (product-register consistency):

| Component | Used for | States |
|---|---|---|
| Select | Flour A/B | default, focus, disabled |
| Stepper | Quantity, Weight, Room Temp, Poolish %, Folds, Fermentolyse | default, active, min/max-disabled |
| Slider | Hydration, Flour blend | default, focus, dragging |
| Toggle group | Method, Bowl, Development | default, active, focus |
| Switch | Diastatic malt | on, off, focus |
| Disclosure | Advanced panel, Schedule | open, closed |
| Tip / info dot | every "why this default" | open, closed |
| Source pill | effective-value provenance | auto, custom, default |

## Tooltips ("why this default")

Every control and derived value gets an info affordance (reuse `.tip` collapsible +
`info-btn`), each answering "why is this the default?". At minimum:
hydration (thirsty vs refined flour), fermentolyse (gluten relaxation), folds (flour
strength), development style, diastatic malt, DDT 24°C (Hamelman), water temp (DDT
formula), bowl τ (cooling model), poolish %, salt 1.8%, retard duration, bench-rest
floor, proof window. Copy is concrete and specific, not generic.

## Data / prefs schema changes

- `flourInfo` → `{name, props, rx}` (above).
- New `GLOBAL` defaults object.
- New `userOverride` object persisted in `baguette_prefs`; `foldOverride` folds into
  it as `userOverride.folds` (count/sequence).
- Remove `season` from prefs (read-tolerant of old value).

## States & edge cases

- First-run (no prefs): all values `default`/`auto`; Advanced collapsed.
- Extreme room temp (10 / 35°C): existing formula floors/caps unchanged.
- Single flour (blend 100/0): source reads `from {flour}`, no blend math.
- All overrides reset: returns cleanly to flour/global values.
- Old prefs with `season`: loads without error, season ignored.

## Testing

Single-file vanilla JS, no framework. **Right-sized, not exhaustive** — the new
architecture adds a resolver and blend math, which is exactly the kind of pure
logic worth a handful of tests; the UI/DOM is not worth heavy test scaffolding for
a personal single-file app. So:

- **A small Node + DOM-stub test file** (the pattern already used this session)
  covering *only the pure logic*: `eff()` cascade precedence (override > flour >
  global), continuous-blend vs dominant-discrete resolution, `buildFolds`,
  hydration/water-temp math, and prefs load tolerating a legacy `season` key.
  ~8–12 focused assertions, run with `node`. This is where the added complexity
  lives, so this is where the tests go.
- **No UI/DOM unit tests, no framework, no headless-browser harness** — overkill here.
- **Design verification:** impeccable PostToolUse hook on every edit + a final
  `/impeccable audit` pass (contrast, responsive, a11y).
- **Manual:** open in browser at **mobile width first (360–390px)** then desktop;
  verify tap targets, disclosure, reduced-motion, and side-by-side against the old
  `baguette.html`.

## Phasing (low-risk, foundation-first)

0. **Fork the file** — copy `baguette.html` → `baguette-v2.html`; remove spelt +
   doppia from the flour list. Old file stays deployed untouched.
1. **Architecture refactor** — `{props, rx}` + `GLOBAL` + `eff()` cascade, folds/
   hydration moved in. No visible change. Small pure-logic test file added here.
2. **Remove season** — delete toggle/`S{}`, temp-word the copy, migrate prefs.
3. **Control restructure** — two-tier grouping + new component logic (still old skin).
4. **Visual system** — Modern Boulangerie tokens, type, components, motion.
5. **Tooltips** — the full "why this default" set.
6. **Polish** — `/impeccable audit`, contrast, reduced-motion, remove preview files.

## Risks

- **Mobile clutter** from more controls → mitigated by two-tier disclosure.
- **Single-file growth** (~750 lines today, will grow) → keep single-file for
  GitHub Pages simplicity, but organise the `<script>` into clear labelled sections;
  revisit splitting only if it becomes unwieldy.
- **Contrast on terracotta** → cream `--accent-ink` verified ≥4.5:1; re-check in audit.
- **Whole-app scope is large** → the phasing above keeps each step shippable and
  independently reviewable.

## Open questions

None blocking. Defaults asserted: continuous params blend / discrete params take
dominant flour; single-file preserved; Advanced collapsed by default.

## Locked visual direction (confirmed 2026-07-12)

Confirmed by side-by-side preview review. **Source of truth:
`docs/previews/boulangerie-overdrive.html`.**

- **Palette:** Modern Boulangerie terracotta (`#9E3B2E`) on white, cream (`#F7ECE4`)
  on the colour blocks. Tokens as in the Visual direction section.
- **Fonts:** **Hedvig Letters Serif** (display) + **Figtree** (body, UI, and numerals
  via `tabular-nums`). Replaces the earlier Bricolage/Hanken pairing. Both Google Fonts.
- **Hero — "Oven Spring":** a side-on baguette on a steep angle that springs (rises
  from its base), the three grigne scores bloom open in sequence, with a warm oven
  glow and rising steam. All CSS/SVG, 60fps, `prefers-reduced-motion` fallback shows
  the sprung loaf with scores open, static. Treated as **fixed signature hero art**
  (the goal), with live status beside it.
- **Kept elevations:** status hero ("Now · <stage>", "<n>% risen", "Next …"), the
  6-step **stage strip** (Poolish → Bake, current lit), and the Flour-primary →
  numeric-cluster → method **hierarchy**.
- **Build-time data note:** the "% risen" figure needs a **bulk-progress estimate**
  (elapsed vs. computed bulk time); the "Next …" line reuses existing schedule timings.
- Motion follows impeccable `animate.md` (150–250ms, ease-out, no layout-property
  animation); honour reduced-motion throughout.
