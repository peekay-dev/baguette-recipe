# Flour Tuning Notes

Working notes on per-flour recipe adjustments. This is a staging document for
handling/formula tweaks that aren't yet built into `baguette.html`. When a note
here is validated across enough bakes, it graduates into a flour profile in the
`flourInfo` object (and, if needed, the `update()` logic).

**Implemented so far:** fold count is flour-driven (`flourInfo[].folds`), with a
manual override. Hydration is a simple `hydAdj` offset. Everything else below is
still manual — follow these notes by hand until coded in.

---

## Caputo (Pizzeria Blue / Nuvola / 00 AP)

Aggressively roller-milled to isolate pure centre endosperm — the bran, minerals,
and native enzymes are largely stripped out. Ultra-extensible, low elasticity,
low enzyme/diastatic activity. Designed to stretch flat, not to hold a loaf shape.

**Adjustments (not yet implemented):**

- **Add diastatic malt powder @ 0.5%** (baker's %, of total flour). Compensates
  for the stripped-out native enzymes — restores sugar availability for
  fermentation and crust colour. Without it, Caputo ferments sluggishly and bakes
  pale/leathery in a home oven.
- **Drop hydration to ~65%.** This flour releases water easily and turns sticky
  and slack if pushed higher for loaves. 65% is the sweet spot.
  (Current `hydAdj` for pizzeria is `0`; would need to bias toward ~65% target.)
- **Front-load heavy gluten development.** It lacks inherent elastic bounce, so
  build the structure early: intensive slap-and-folds (French folds) up front,
  continued **until the dough turns shiny and smooth**. Judge by the shine, not a
  fixed count.
- **Increase folds** overall vs. a strong flour. Caputo needs a built skeleton;
  the current profile (`['sf','sf','cf','cf']`, 4 folds) is a starting point but
  may want more, plus the front-loaded slap-and-fold phase above.

### To implement later

These would need new capability beyond the current fold-count system:

- Diastatic malt as an optional ingredient line at a per-flour rate (0.5%).
- Per-flour hydration *target* (not just an offset), so selecting Caputo pulls
  hydration toward 65%.
- A "front-load development" phase (slap-and-fold to shine) distinct from the
  scheduled stretch/coil folds — possibly a `develop: 'intensive'` profile flag.

---

## Miller & Baker Plain Flour (Mollerin stoneground Yitpi)

Australian hard-wheat Yitpi grain, stoneground and bolt-sifted. Highly unrefined:
very high native enzyme and mineral content, damaged starch that drinks water
easily. Strong elastic backbone that snaps back aggressively. Its strength is
**biochemical, not mechanical** — the exact opposite of Caputo. Do not develop it
like a weak flour; let time and gas do the work.

### Optimised protocol

1. **Skip diastatic malt.** Already packed with native enzymes and mineral ash.
   Adding malt makes it ferment too fast → risk of collapse or an over-proofed,
   gummy crumb. (This is the direct inverse of the Caputo advice above.)
2. **Keep hydration high (72–76%).** Thirsty flour; the extra water softens the
   tight gluten network so it becomes extensible enough to stretch into baguettes
   without snapping back. *Implemented:* `hydAdj: +5` (70% base → 75%).
3. **Extend the fermentolyse (45–60 min).** Long passive rest lets the intense
   gluten proteins fully hydrate and relax *before* any handling. Don't rush it.
   *Partly implemented:* `fermentolyseTime` is fixed at 45 (hard cap 60) — sits at
   the low end of the target; a per-flour bias toward ~60 would suit Yitpi.
4. **Gentle handling — max 2 coil folds.** No slap-and-folds. Aggressive agitation
   tightens the dough like a rubber band. Coil folds only *organise* structure
   without forcing tension. *Implemented:* `folds: ['cf','cf']`.
5. **Prioritise passive rise — leave it alone.** The single most important step:
   leave the dough strictly undisturbed for the final ~1.5 h of bulk, letting gas
   do the stretching. *Partly supported:* with only 2 folds, the formula's extra
   bulk time already lands as undisturbed rest after the last fold — verify it's
   reaching ~90 min for Yitpi at typical temps.
6. **Extended bench rest / détente (25–30 min).** Long rest before final shaping
   lets the resilient gluten lose its snap-back "memory" so baguettes roll to full
   length without shrinking. *Not flour-specific yet:* détente is temperature-
   computed with a 20-min floor; Yitpi wants a higher floor (~25–30).

- **Bake:** deep, fast caramelisation at 230–250°C from high native sugars and
  minerals — thick robust crust. *Bake temp/time still global at 240°C.*

### To implement later (Yitpi-specific)

- Per-flour fermentolyse bias (push toward 60 min).
- Per-flour minimum détente/bench rest (25–30 min floor).
- Confirm/guarantee the passive undisturbed rest reaches ~1.5 h for this flour.
