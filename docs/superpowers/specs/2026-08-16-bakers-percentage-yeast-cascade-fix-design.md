# Baker's-percentage yeast cascade fix

**Date:** 2026-08-16
**Reference:** `docs/Baker Percentages Worked Example.xlsx`

## The authoritative model

The spreadsheet defines how a target total dough weight cascades down to
every ingredient weight:

1. **Total flour weight** = total dough weight ÷ (1 + hydration% + salt% +
   yeast%). This single `yeast%` (0.33%, `YEAST_PCT` in code) represents
   *all* the yeast used in the dough — poolish and final addition combined.
2. Water and salt weights derive directly from that total flour weight.
3. The poolish is a **breakdown of those same totals**, not an addition to
   them: poolish flour = a % of total flour, poolish water = an equal
   weight (100% hydration), poolish yeast = 0.2% of the poolish flour
   (`POOLISH_YEAST_PCT_OF_POOLISH_FLOUR` in code).
4. Because poolish yeast is *part of* the total yeast already accounted for
   in step 1, the final-dough yeast addition (sprinkled in at the Salt,
   Yeast & Bassinage step) is **whatever remains**: `total yeast weight −
   poolish yeast weight`.

Worked example values (900g dough, 78% hydration, 20% poolish, 25°C
reference): total flour 499.64g, salt 8.99g, total yeast 1.65g, poolish
yeast 0.20g, final-dough yeast 1.45g (the remainder).

## The bug

`baguette.html` computed `finalYeastPct` independently from the same 0.33%
constant, then **added** `poolishYeastPct` to it to get a combined
`yeastPct` used for the total-flour cascade:

```js
const finalYeastPct = finalDoughYeastPct(method, yeastMult); // 0.33%, scaled
const yeastPct = poolishYeastPct + finalYeastPct;             // added on top
const totalFlour = totalDough / (1 + baseHyd + SALT_PCT + yeastPct);
...
const finalYeast = totalFlour * finalYeastPct;                // full 0.33%, not reduced
```

This double-counted poolish's yeast: the final-dough addition never
accounted for the yeast the poolish had already used, so it delivered the
full 0.33% (temp-scaled) on top of whatever the poolish got. At the app's
default settings (30% poolish, 18°C) this inflated the final-dough yeast
dose by **≈18%** (≈0.42% actual vs. ≈0.34% per the spreadsheet's method).

## The fix

`finalDoughYeastWeight(totalYeastWeightG, poolishYeastWeightG, activeMethod)`
replaces `finalDoughYeastPct()`. The total-flour cascade now uses one
combined `totalYeastPct = YEAST_PCT * yeastMult` (unscaled by method — this
represents the nominal total, matching the spreadsheet), and the
final-dough addition is that total's weight minus poolish's already-used
share:

```js
const totalYeastPct = YEAST_PCT * yeastMult;
const totalFlour = totalDough / (1 + baseHyd + SALT_PCT + totalYeastPct);
...
const finalYeast = finalDoughYeastWeight(totalFlour * totalYeastPct, poolishYeast, method);
```

Shaped Retard's existing 40% cut (`SHAPED_FINAL_YEAST_FACTOR`) is applied
to this remainder, same as before — only Same Day and Cold Retard's actual
yeast weights change as a result of this fix (Shaped Retard's relative
reduction logic is unchanged, just computed off a corrected base).

Poolish flour, poolish water, and poolish yeast formulas were already
correct and are untouched.

## Verification

Running the corrected cascade with the spreadsheet's own inputs (900g
dough, 78% hydration, 20% poolish, yeast multiplier = 1) reproduces its
values exactly: total flour 499.6391g, salt 8.9935g, total yeast 1.6488g,
poolish yeast 0.19986g, final-dough yeast 1.44895g — summing to exactly
900g. `test/logic.test.js` covers `finalDoughYeastWeight()`'s subtraction,
method factor, and floor-at-zero behavior.
