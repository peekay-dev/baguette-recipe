# Baguette Scoring Spec — `previews/d-rise.html`

Numeric reference for the scored-crust pattern drawn on the canvas loaf in
the rise animation. Derived from a pixel-grid measurement of a reference
photo (classic overlapping-diagonal-cut sourdough baguettes), not eyeballed.
Every future edit to the scoring must be checked against this doc, not
against memory of what it "should" look like.

## Reference photo measurement method

If a new reference photo ever needs to be measured:

1. Save the photo, crop tightly on the clearest, most in-focus loaf.
2. Overlay a pixel coordinate grid (Python/PIL, `ImageDraw.line` every 50px
   plus coordinate labels) and re-save.
3. Read the grid image directly (the `Read` tool renders images) and pick two
   points on a ridge line and two points on the loaf's own long edge to
   compute both angles as vectors; the score angle is the difference between
   them, not the raw angle off horizontal (the photo itself is rarely level).
4. Measure score-stripe width vs. gap width in pixels along the loaf's own
   axis, at the same crop scale.

## What the reference shows

- **Shape family**: rounded-corner **parallelograms** — straight, angled
  short edges with a small radius. NOT a pointed leaf/lens/vesica shape.
- **Orientation (the actual bug in every early attempt)**: the
  parallelogram's long edges run **across** the loaf, not along it. The cut
  angle measured **~60–65° off the loaf's own length axis** (~27° off
  vertical). A score that merely "leans" while still being long-axis-aligned
  along the loaf is structurally wrong.
- **No overlap, ever.** Consecutive scores are separated by a clean straight
  gap of plain, unpainted crust — same angle as the scores, constant width.
  If two score shapes can mathematically intersect, the model is wrong.
- **Coverage**: each score spans **~90% of the loaf's local visible crust
  height** (a thin plain rim survives top and bottom) — "majority of the
  baguette," not a small shape floating mid-crust.
- **Score : gap width ratio ≈ 4:1** — gaps are distinctly thinner than
  scores; a thin dividing line, not equal-width alternation.
- **Extent along the loaf (horizontal / left-right)**: scoring stretches as
  close to the tapered tips as possible — this is a separate axis from the
  next bullet and must not be confused with it. (Earlier revisions of this
  spec said "central 60–65%," which undershot; corrected after user
  feedback.)
- **Top/bottom crust margin (vertical, NOT the tips)**: "the edges of the
  baguette" means the plain-crust rim above and below the scored band, and
  it must be the **same width as the gaps between scores** — not the margin
  before the left/right tips. Getting this confused with the horizontal
  extent above is exactly the mistake made mid-session: an `edgeExtra`
  margin was added at the left/right tips (moving scoring away from them,
  which was never the ask) while the real complaint — the top/bottom rim
  being far thinner than the between-score gaps — went unaddressed for two
  rounds. The two are unrelated: keep scoring close to the tips (previous
  bullet) AND make the top/bottom rim equal the gap width (this bullet).
- **Count**: **5** scores, evenly spaced, identical width/angle — no
  per-score hand-tuned variation (that reads as sloppy, not organic).

## Chosen implementation parameters (`previews/d-rise.html`)

Mental model: the scored region is a **diagonal stripe pattern painted
across a band of the loaf** — alternating "cut" (painted) and "crust"
(unpainted, loaf gradient shows through) stripes, clipped to the loaf's own
silhouette so top/bottom edges follow the loaf's curve for free. This is
NOT a set of small shapes positioned at x-centers and leaned; shearing a set
of vertical stripes produces the parallel diagonal bands directly.

| Parameter | Value | Meaning |
|---|---|---|
| `Zf` | `0.94` | Half-width of the scored zone, as a fraction of `P.L`. Zone = `x ∈ [-0.94·L, 0.94·L]` — scoring runs as close to the tapered tips as possible. This is the **horizontal** extent; do not conflate with the top/bottom margin below. |
| Zone inset | **`gapW`, additive** | `topY(x,P)+gapW` / `botY(x,P)-gapW` (clamped so it can't invert past center) — a constant absolute margin, not a `%` multiplier. This is what makes the top/bottom crust rim read as the same width as the horizontal gaps everywhere along the zone, including near the tips where `topY`/`botY` shrink toward 0. A multiplicative inset (e.g. `topY*0.96`) shrinks to nothing near the tips and was the bug in an earlier revision. |
| `N` | `5` | Score count, evenly spaced across the zone. |
| score:gap ratio | `4:1` | `scoreW = 4·gapW`. |
| `shear` | `-0.52` | Horizontal shear applied once to the whole clipped zone (~27° off vertical, ~62.5° off the loaf's length axis). Negative so the top of each stripe leans toward the tail end, matching the photo. |
| `H` (rect height passed to `drawScoreStripe`) | `P.R*1.7` | **Must stay small enough that the rect's own top/bottom edges land inside the zone clip**, or the corner radius below is a visual no-op (see next paragraph). Was `P.R*2.2` (oversized) in an earlier revision. |
| corner radius | `~16%` of score width | Softened once for real from an initial `~12%` — see the `H`-must-be-small caveat above. A later overcorrection to `~26%` → `~38%` did nothing visually (no-op, see below) until `H` was fixed, then `42%` at the smaller `H` over-rounded the corners into full curves that erased the parallelogram's straight edges ("lost their parallelogram shape"); `16%` is the settled value — visibly rounded corners with the diagonal edges still reading as straight lines for most of their length. |

**Corner-radius no-op trap.** `drawScoreStripe`'s `H` argument is passed
straight through as the rect height to `rrect(x,y,w,h,r)`, and at full
"open" (baked, resting state) `h` equals `H` exactly. If `H` is oversized
(e.g. `P.R*2.2`, well beyond the zone clip's actual visible height), the
rect's own top/bottom edges — and therefore its rounded corners — sit
entirely outside the visible clipped region, so the *zone clip's silhouette
curve* becomes the only thing visible at top/bottom, not the rrect's
rounding. Increasing `r` in that state changes nothing on screen; this
wasted a full round of edits (`12%→26%→38%`, all visually identical) before
being caught by rendering **and comparing pixel-for-pixel against the
previous screenshot**, not just glancing at the new one. Always confirm `H`
is close enough to the local zone height that the rect is the *binding*
constraint before tuning `r`.

**Vertical recenter.** The loaf's cross-section is not symmetric around
local `y=0` (`topY` includes the bulge term, `botY` doesn't), so a
score rect centered on `y=0` drifts noticeably closer to one edge than the
other once `H` is reduced enough for the rect (not the clip) to be the
binding constraint. Center on `yc=(topY(0,P)+botY(0,P))/2` instead, passed
into `drawScoreStripe` as its last argument, so the top and bottom margins
come out equal (verified: ~27px top, ~28px bottom, ~26–27px horizontal gap,
all at the same render).

**Horizontal gaps (between scores and at the left/right zone edges) are all
equal.** The zone holds `N` scores and `N+1` horizontal gaps — one before the
first score, one after the last, same width as the `N-1` gaps between them.
Solve `zoneW = N·scoreW + (N+1)·gapW` with `scoreW = 4·gapW`:
`gapW = zoneW/(5N+1)`, and score `i`'s left edge is
`-zoneHalf + gapW + i·(scoreW+gapW)`.

**The top/bottom crust margin uses that same `gapW`, additively, against
`topY`/`botY`.** This is a *different axis* from the horizontal gaps above —
conflating the two wasted two rounds of edits mid-session (an `edgeExtra`
margin was added at the left/right *tips* in response to a complaint that
was actually about the top/bottom *rim*). Keep them mentally and in code
separate: `Zf` controls horizontal reach toward the tips; the additive
`gapW` inset on `topY`/`botY` controls the vertical rim width. Both happen
to reuse the same `gapW` value so all gaps in the piece — horizontal and
vertical — read as one consistent width, but they are applied on different
axes for different reasons.

Reused helpers: `rrect(x,y,w,h,r)` (already in the file) draws each stripe;
the loaf-body path construction (`topY`/`botY` walk, same pattern used for
the main body fill) is reused at a reduced `x`-range for the zone clip — no
new path function needed.

## Verification protocol (mandatory before calling a score edit done)

Never judge a score edit by reasoning about the code — render it. And a
full-loaf screenshot glanced at from a distance is NOT sufficient — it has
already twice missed real defects (an insufficient tip gap, then a top/bottom
margin roughly 7x thinner than the horizontal gaps) that were only obvious
once measured. Any claim about a **gap width, angle, or coverage** must be
backed by step 3 (numeric pixel measurement), not step 2 (a look at the
image) alone. "I looked at it and it seems fine" is not verification for
this file.

1. Copy `previews/d-rise.html` to a scratch path (use the session scratchpad
   directory, never edit in place). Inject one line before the transport
   `let t=0, playing=...` block:
   ```js
   { const qp=new URLSearchParams(location.search); if(qp.has('t')){ t=parseFloat(qp.get('t')); scrub.value=Math.round(t*1000); playing=false; } }
   ```
   This lets a `?t=0.70` URL param jump the canvas straight to that point in
   the animation instead of relying on `--virtual-time-budget` (which does
   NOT work here — the rAF loop clamps `dt`, so fast-forwarding real/virtual
   time does not advance the animation state; confirmed by testing).
2. Render with headless Edge (`Microsoft Edge` is installed at
   `C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe` on this
   machine):
   ```
   "<edge>" --headless=new --disable-gpu --screenshot=out.png --window-size=1400,900 --hide-scrollbars "file:///<scratch>/debug.html?t=0.70"
   ```
   Repeat at `t=0.46` (score just cut, still a raw flat slash), `t=0.70`
   (oven spring, ears open, light browning), `t=0.85` (baked, full brown).
   Crop to the loaf region (`~(250,400)-(1150,610)` at this window size) and
   view it with `Read` — this catches shape/count/overlap regressions and is
   enough for those, but is NOT enough on its own for any claim about a gap
   width, margin, or angle (see step 3).
3. **For any claim about gap/margin/angle, measure it in pixels — don't
   eyeball it.** Load the screenshot with PIL and sample scanlines:
   ```python
   from PIL import Image
   im = Image.open('out.png').convert('RGB')
   px = im.load()
   # horizontal scanline through the score band (pick a y clear of the lip-shadow
   # gradient band, e.g. y=500 mid-crop): sample brightness = sum(px[x,y])/3,
   # threshold ~105-110 separates dark score interior from lighter gap/crust,
   # then measure contiguous run widths to get gap vs score widths in px.
   # vertical scanline through the middle of a score (fixed x): the same
   # brightness-run approach gives the top-margin and bottom-margin widths —
   # compare directly against the horizontal gap width from the same render.
   ```
   Background ≈ 220 brightness, plain crust ≈ 130–190, score interior ≈
   50–150 (varies with the internal gradient/lip-shadow, so pick a scanline
   position and threshold empirically per render rather than reusing fixed
   numbers blindly). What matters is that gap-vs-score run widths, and
   top/bottom-margin-vs-horizontal-gap run widths, come out comparable when
   the spec says they should be.
4. Check the numeric results and the crop against the checklist below. Only
   then report the change as done, and only after actually showing the
   rendered crop to the user — do not describe the result in prose instead
   of showing it.
5. Delete the scratch/debug files and screenshots when finished.

## Regression checklist

Every score edit must still satisfy all of these — if any fails, it's a
regression, not a variant:

- [ ] Scores do **not** overlap — a continuous plain-crust gap separates
      every pair.
- [ ] Each score's long edges run at ~60–65° off the loaf's length axis
      (steep), not roughly parallel to it.
- [ ] Horizontal gaps (between scores, and between the end scores and the
      zone's left/right edges) are visibly thinner than scores (~1:4),
      constant width — **measured in pixels**, not eyeballed.
- [ ] Scoring reaches almost to the tapered tips (`Zf ≈ 0.94`) — only a
      small bare point survives at each end, not a wide bare margin. This is
      the horizontal axis — do not touch it when the real complaint is about
      the next item.
- [ ] The **top and bottom crust margin** (vertical rim above/below the
      scored band) is the same width as the horizontal gaps — **measured in
      pixels via a vertical scanline compared against a horizontal one**, not
      eyeballed. This is a different axis from the tip-closeness item above;
      confusing the two caused two wasted rounds of edits.
- [ ] Exactly 5 scores, evenly spaced, uniform width/angle.
- [ ] Shape is a rounded-corner **parallelogram** — no pointed leaf/lens
      tips. Corner radius ~16% of score width: enough to visibly soften the
      4 corners, but the diagonal side edges must still read as straight
      lines for most of their length, not full curves ("lost their
      parallelogram shape" is the failure mode at high radius + small `H`).
- [ ] Before touching corner radius at all: confirm `H` (`previews/d-rise.html`,
      `drawScores`) is small enough that the rect's own edges — not the zone
      clip's silhouette curve — are what's visible at each score's top/bottom.
      Otherwise radius changes are a silent no-op. Zoom into one score at 3–4x
      in the rendered screenshot to check this, don't infer it from the code.
