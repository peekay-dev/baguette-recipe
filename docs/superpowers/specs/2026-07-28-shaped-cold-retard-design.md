# Third Method: Shaped Retard + Same Day Consistency Fixes — Design Spec

**Date:** 2026-07-28
**File:** `baguette.html`
**Status:** Draft for review

## Goal

Fix two consistency bugs in the existing Cold Retard / Same Day timing logic,
and add a third method — **Shaped Retard** — where the dough is shaped on
mix-day, cold-retarded *after* shaping instead of before, and baked directly
out of the fridge on day 3 with no room-temp final proof.

## Part 1 — Consistency fixes (existing methods)

Found while reviewing whether Same Day's rest times track ambient temperature
correctly. Bulk fermentation, détente, and final proof were all confirmed to
already be temperature-aware — verified numerically at 12/15/18/22/26/30°C.
One real bug was found, and one design simplification made as a result:

1. **Bug — `baguette.html:1412-1415`.** The "Visual cue & cap" tip under Bulk
   Fermentation was hardcoded to *"into the fridge at 30–50% expanded"*
   regardless of method. For Same Day this contradicted the paragraph
   immediately above it, which showed a different, method-specific
   `growthTarget` (70–80% for Same Day vs 50–60% for Cold Retard) — two
   numbers for the same stage, disagreeing with each other. Fixed by
   branching the "next action" wording (into the fridge / divide & preshape)
   while keeping one growth percentage.
2. **Simplification, per user decision:** rather than keep two different
   growth targets in sync (and having Same Day's clock under-shoot its own
   higher target — Cold Retard's copy already said "trust the visual cue
   over the clock" but Same Day's didn't), **all methods now target the same
   bulk growth (30–50% / "domed, jiggly, not doubled")** — Cold Retard's
   original number, which the user has relied on successfully. `growthTarget`
   removed as dead code; the visual-cue paragraph and tip are now unified,
   branching only on the next action, not the percentage.

No formula changes — copy/branching only. This also simplifies Part 2 below:
Shaped Retard's bulk fermentation needs no special-casing at all now, since
every method already shares the same bulk target.

## Part 2 — Shaped Retard method

### Flow

Poolish → Fermentolyse → Salt/Yeast/Bassinage → **Bulk Fermentation** →
Preshape → **Final Shape** → **Into the fridge** → **Score & Bake (straight
from the fridge)**.

Compare to today's Cold Retard (Poolish → ... → Bulk → **fridge** →
warm-up → Preshape → Shape → room-temp Proof → Bake): Shaped Retard moves
the fridge stage to *after* shaping and drops the post-fridge warm-up and
room-temp final proof entirely.

### Research basis for the bulk fermentation target

Initial assumption was that bulk should be minimal (~20–30%) since most
rise would happen cold after shaping. Web research (King Arthur Baking,
corroborated by a Fresh Loaf shape-then-retard writeup) found this is
backwards: a loaf only gets *one* of its two rises chilled, never both —
"Your yeast won't give you much love if it's asked to do both rises in the
fridge, so it's best to do one or the other at room temperature." Since
Shaped Retard chills the *second* rise (final proof), the first rise (bulk)
should NOT be shortened.

The user separately confirmed from direct experience: a recent bake with an
under-bulked shaped loaf came out flat after scoring — consistent with
insufficient structure/gas going into the long cold stage.

**Decision:** Shaped Retard's bulk fermentation reuses the *exact same*
formula and growth target as every other method now (see Part 1 — all
methods target 30–50% growth, ambient-temp-scaled
`bulkMins`/`bulkFormulaMins`/`fixedFoldsMins`/`undisturbedRestMins`,
unchanged). No method-specific bulk code needed for Shaped Retard at all.

### Détente (bench rest before final shape)

Reuses the **Same Day** détente formula (`samedayDetenteMins`), not Cold
Retard's. At this point in Shaped Retard the dough has never been chilled —
it's at full ambient temperature, same as Same Day's dough at the same
point — so the "dough starts at 10°C and warms up" model Cold Retard uses is
wrong here.

### Into the fridge (new step, after Final Shape)

Dough goes straight from final shape into the fridge — no bench rest in
between (matches how the user described the method). Tip: use a
well-floured couche with snug folds between loaves so a long chill doesn't
cause spreading.

### Retard duration

Per earlier decision: **no formula** — cold full-proof kinetics this close
to freezing don't extrapolate reliably from the app's Q10 model (confirmed
by how far off a naive extrapolation of the existing proof formula is: ~3h,
vs. the 8–24h range real bakers actually use). Fixed, user-adjustable
default:

- Default **15h** (matches the existing `retardHrs` anchor used by Cold
  Retard, which centers on the same "cold enough to slow fermentation,
  long enough for flavor, short enough to not over-proof" logic).
- Adjustable range **8–24h**, same stepper UI pattern as other advanced
  fields.
- Guidance copy: check firmness/puffiness before bed; if it looks under-
  proofed going in, lean toward the top of the range.

### Bake — straight from the fridge

No warm-up/temper stage at all (`warmupMins` doesn't apply to this method).
No finger-test checkpoint either, since there's no room-temp final proof to
judge — replace the finger-test tip with guidance to judge readiness by
pre-fridge shape/tension and elapsed time. Tip: cold dough scores more
cleanly and gives strong oven spring; bake may run ~2 min longer since the
loaf starts cold.

## UI / architecture changes

- **Method toggle** becomes 3-way: `Cold Retard` / `Same Day` / `Shaped
  Retard` (internal `method` value `'shaped'`).
- **Stage strip order is method-dependent.** Today `STAGES` is a single
  fixed array (`poolish, mix, bulk, retard, shape, bake`) and
  `visibleStages()` just filters `retard` in/out. Shaped Retard needs
  `retard` to appear *after* `shape`, not before — the stage strip's
  DOM/click-to-scroll order must reorder per method, not just show/hide.
- **`compareModal`** gets a third column, same bullet-list style as the
  other two (flavor/crust/crumb/handling/total-time summary).
- **Persistence:** `'shaped'` flows through the existing `method` field in
  both `localStorage` (`baguette_prefs`) and the share-link state — no
  schema change needed. The new retard-duration override follows the
  existing `userOverride`-style pattern used by other advanced fields.

## Out of scope

- No new Q10/Newton's-law formula work for the fridge stage (explicitly
  rejected in favor of a fixed default — see above).
- No changes to hydration, salt, yeast, or DDT/water-temp math — this is a
  scheduling/staging change only.
