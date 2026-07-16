# Baguette App Redesign — Research & Preview Spec

**Status:** Draft · planning stage
**Owner:** Paul
**Design process:** impeccable (brand register — the hero is a showcase surface)
**Created:** 2026-07-16

The goal of *this* doc is not to design the final app. It's to define **how we run
the research + preview stage** — what we explore, what we produce, and how we decide
— so the eventual full build is a confident pick, not a guess.

---

## 1. Why we're redesigning

The current `baguette-v2.html` works but doesn't excite. The header is a terracotta
band with a live dough-rise gauge; competent, but it reads as "a recipe with a
widget," not as a thing you'd screenshot and send to someone.

**What we want instead:** a hero that is genuinely *cool* and bread/baking-native —
allowed to break from the "recipe page" template and think outside the box.

**Non-negotiables carried over from the working app:**

- Single self-contained `.html` file (no build step, no server). Ships on GitHub Pages.
- The real recipe logic stays: poolish method, temperature-scaled rest times,
  per-flour tuning (see `FLOUR_NOTES.md`). The redesign is skin + hero, not a
  teardown of the baking math.
- Fast and responsive. Mobile is a first-class target (recipes get read one-handed
  in a kitchen).
- Accessible: real contrast, reduced-motion fallbacks, keyboard-usable controls.

## 2. The hook (what makes this brief non-generic)

Every "bakery website 2026" listicle is the same: warm hero photo → product grid →
CTA. That's the slop lane; we explicitly avoid it. Our differentiator is that this
isn't a storefront — it's a **living process**:

- a **poolish** pre-ferment that is literally alive (bubbling, rising, gassing off);
- **temperature-scaled** timings (the dough responds to its environment);
- **oven spring** and crust caramelisation (heat as a visible transformation).

So the design direction is **bread as a live physical process**, not bread as a
product photo. That single sentence is the anti-slop anchor for every concept below.

## 3. Research stage

### 3.1 What "research" means here

Two layers, both already begun:

1. **Landscape scan (avoid the reflex).** Confirm what the category defaults to so we
   can deliberately not do it. Finding so far: bakery listicles converge on
   warm-photo-hero + product grid + video-below-fold. Awwwards food/WebGL winners
   converge on full-bleed video and Three.js set-pieces. Both are known lanes; we
   treat them as things to *depart from*, not copy.
2. **Reference naming (aesthetic lane discipline).** Per impeccable's brand register,
   each concept must name a concrete reference before we build, so ambition doesn't
   collapse into beige. Each concept in §4 names its lane.

### 3.2 Research deliverable

A short "direction brief" per concept (captured in §4): three brand-voice words, the
named aesthetic reference, the palette strategy, and the one technical centerpiece.
That's enough to build a preview from — we don't over-research; we prototype to learn.

## 4. Concept directions (the three we'll preview)

Three distinct lanes so the previews actually *compare* something, rather than three
shades of one idea. Each is buildable in a single file with canvas 2D (robust,
dependency-light) rather than heavyweight WebGL.

### Concept A — **EMBER** · cinematic dark oven
- **Voice:** appetising, dramatic, 4am-bakery.
- **Lane / reference:** moody food cinematography — think a dark oven mouth with a
  loaf glowing inside; ember + gold-crust on charcoal. *Drenched-dark* color strategy.
- **Centerpiece:** a canvas heat/ember field with a loaf whose crust deepens and steam
  rises; warmth radiates as you scroll.
- **Why it could win:** most viscerally "hungry"; premium; farthest from the flat
  terracotta band we have now.
- **Risk:** dark + food legibility; must keep recipe body readable.

### Concept B — **FLOUR** · kinetic type + flour physics
- **Voice:** tactile, playful, hand-dusted.
- **Lane / reference:** oversized editorial/poster typography with a live flour-dust
  particle field that puffs and drifts on cursor/scroll. Light, paper-real (a *true*
  paper white or a bold accent — explicitly **not** the cream/sand AI default).
- **Centerpiece:** a giant wordmark that behaves like it's dusted in flour; particles
  react to the pointer.
- **Why it could win:** most fun and most "screenshot-able"; personality-forward.
- **Risk:** kinetic type can fight readability; must stay legible and calm on mobile.

### Concept C — **STARTER** · living fermentation
- **Voice:** alive, precise, craft-as-science.
- **Lane / reference:** a lab/instrument aesthetic meeting patisserie — a metaball CO₂
  bubble simulation of the poolish fermenting, with a live data readout (hydration %,
  dough temp, fermentation progress). Near-black lab surface, amber + teal.
- **Centerpiece:** the pre-ferment visibly *lives* — bubbles nucleate, merge, rise,
  tied to the recipe's real temperature/time model.
- **Why it could win:** most original and the tightest fit to *this* recipe's poolish
  hook; nobody else's baguette page looks like this.
- **Risk:** most technically involved; "scientific" must still feel warm, not clinical.

> These three map to three altitudes of the same anchor: appetite (A), play (B), and
> life/science (C). Whichever wins, the others' best moments can be folded in.

## 5. Preview stage

### 5.1 Format

- Each concept ships as a **standalone, openable HTML file** in `previews/`:
  - `previews/a-ember.html`
  - `previews/b-flour.html`
  - `previews/c-starter.html`
- Plus `previews/index.html` — a chooser page linking all three side by side.
- Each preview is **hero-complete + a taste of the fold below** (enough recipe content
  to prove the aesthetic survives contact with real UI), not a full port of the app.
- Each is real working code (motion, responsiveness, reduced-motion fallback), not a
  static mockup — we're evaluating feel, and feel is motion + interaction.

### 5.2 Scope guardrails for previews

To keep the stage fast:
- Hero + one representative content strip only. No full recipe engine yet.
- Placeholder-but-real copy from the actual recipe (poolish, folds, oven spring).
- Imagery: prefer generated canvas/SVG scenes over stock photos so previews stay
  self-contained and offline-safe; if a photo is needed, verify the URL resolves.

### 5.3 Evaluation criteria (how we pick)

Score each preview honestly against:

1. **Distinctiveness** — would someone ask "how was this made?" not "which AI made this?"
2. **Appetite/craft fit** — does it feel like bread, specifically *this* bread?
3. **Legibility & a11y** — contrast, reduced-motion, mobile one-handed use.
4. **Performance** — smooth on a mid phone; no jank on the hero animation.
5. **Portability** — can it wrap the existing recipe logic without a rewrite?

## 6. Decision gate

After previews are openable, Paul reviews and picks **one direction** (or a hybrid —
"A's mood with C's data readout"). Only then do we do the full build: port the chosen
hero + system onto the complete recipe engine from `baguette-v2.html`.

**We do not build the full app during the preview stage.** The point of previews is to
make the expensive build a sure thing.

## 7. Decisions (locked 2026-07-16)

- **Mood:** surprise me — build all three (A, B, C) across the full range.
- **Palette:** open season. Each concept picks its own palette; no obligation to keep
  terracotta. (Terracotta may still resurface if a concept earns it.)
- **Dependencies:** small libs OK. A lightweight animation lib (GSAP / Motion / Lenis)
  is allowed *in the previews* if it materially improves the hero. The final shipped
  file will weigh portability vs. payoff at the decision gate; canvas 2D remains the
  default centerpiece so a zero-dep fallback is always on the table.

## 8. Round 1 feedback (2026-07-16)

Paul reviewed A, B, C. Signal is clear and it points at a **synthesis**, not a single
winner:

**Liked in A — EMBER:**
- The **baguette wordmark** — the Bodoni Moda italic display face, and specifically the
  way it's executed (the letters that "bake" and glow with the animated fill mask).
  This is the signature move to keep.

**Liked in B — FLOUR:**
- The **colour palette** — bone paper, toasted-wheat gold, poppy-red micro accent, near-
  black ink. This becomes the base system.
- The **step structuring** — the horizontal ferment timeline (clock / title / blurb /
  progress bar cells).
- The **header treatment** — Big Shoulders Display uppercase headings with a Spectral
  italic accent word.

**Not carried forward (for now):** C's dark lab aesthetic as the primary surface, A's
charcoal drench as the base. C's *live-data* idea may still return as a component.

### Emerging direction

> **B's palette + structure + headers as the system, A's Bodoni baguette wordmark +
> bake-glow as the signature, and a hero centered on watching dough become bread.**

That last piece is the new request below.

## 9. New concept — the transformation animation

**Request:** a detailed animation of a baguette going from **dough → oven spring →
finished baguette**. Does not have to be set in an oven; a clean studio metamorphosis
is fine. "Pretty detailed" is the bar.

### Concept D — **THE RISE** (transformation hero)
- **Surface / system:** B's palette (bone paper, wheat, poppy, ink), B's timeline step
  structure, B/A's header pairing (Big Shoulders + Bodoni Moda italic for "Baguette").
- **Centerpiece:** a canvas metamorphosis of a single loaf through real baking phases:
  1. **Proof** — a pale dough ball, softly breathing (fermentation).
  2. **Shape** — the ball elongates into a torpedo/log.
  3. **Score** — the lame cut draws across the top.
  4. **Oven spring** — the loaf swells and lengthens; the score opens into a raised
     **ear**; surface tightens.
  5. **Bake** — crust colour deepens pale → golden-amber; steam rises; a warm bake-glow
     (the A move) blooms.
  6. **Baguette** — finished, scored, steaming; holds, then loops back to dough.
- **Interaction:** autoplay loop **plus a scrubber** so you can drag through the
  transformation frame by frame; phase labels (in B's cell style) highlight in sync.
- **Technique:** organic silhouette morph — the loaf outline is N control points
  interpolated between phase keyframes and re-rendered each frame (robust, no path-point
  mismatch); gradient fill for crust browning; canvas steam + flour + glow layers.
  Reduced-motion: render the finished baguette statically, scrubber still works.
- **Why:** directly fuses everything Paul liked and answers the new request; the "watch
  it happen" hero is the out-of-the-box hook the generic bakery lane never attempts.

### Round 2 refinements (2026-07-16)

- **Loaf modelled on Paul's own bakes** (reference photo of three baguettes on a rack):
  plump middle tapering to **pointed pointes** with **dark caramelised tips**; three
  overlapping **grigne ears** rendered as low curled lips over a thin pale crumb shelf
  with a cast shadow (not smooth slashes); heavier **flour dusting** that clings through
  the bake. Silhouette uses an added `e` (end-exponent) so the dough ball is round but
  the baked loaf points.
- **Fonts converged on A's pairing** at Paul's request: dropped Big Shoulders; the hero
  and section headings are now **Bodoni Moda** (mixed-case display + italic accent word),
  small labels and times are **Hanken Grotesk**, phase numbers are Bodoni italic (A's
  step-number style).
- **Buttons adopted A's styling:** pill radius, warm gradient fill with inset highlight
  and coloured shadow, translucent secondary — recoloured to D's wheat/crust palette.

> **Converged synthesis so far:** A's Bodoni + Hanken fonts and pill buttons · B's bone/
> wheat/poppy palette and timeline step structure · a transformation hero whose loaf is
> modelled on Paul's real baguettes. This is now the presumptive final direction.

> If a second take is useful (Concept E), it's a **horizontal film-strip** framing of the
> same six phases — the transformation laid out left-to-right as a scrubbable sequence
> rather than a centered morph. Build only if the centered version leaves an itch.

## 10. Next steps

1. ~~Build the three previews + chooser page.~~ ✓ (A, B, C, index)
2. ~~Round 1 review.~~ ✓ — feedback captured in §8.
3. Build **Concept D — THE RISE** (§9): the dough→baguette transformation hero, on B's
   palette/structure with A's wordmark. Add to the chooser.
4. Review D; decide whether Concept E (film-strip) adds anything.
5. Lock the synthesis direction, then write the full-build plan and port onto the
   complete recipe engine from `baguette-v2.html`.
