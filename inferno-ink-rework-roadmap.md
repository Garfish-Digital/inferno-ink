# Inferno Ink — Rework Roadmap
### Garfish Digital | Demo Site Rebuild

> **How to use this document:** Work through phases sequentially. Do not skip ahead.
> Each phase includes a recommended Claude Code model, a goal statement, and explicit tasks.
> Complete all tasks in a phase before proceeding. Some phases include notes marked
> **⚠ Judgment Call** — these are points where you should review the output before continuing.

---

## Phase 1 — Code Archaeology & Dead Code Removal
> **Recommended model: Sonnet**
> Goal: Produce a clean, single-responsibility codebase with no orphaned logic.

The uploaded source files were concatenated exports, not their actual file structure.
Before any creative work begins, the project must be surgically cleaned.

### 1.1 — JavaScript

- **Delete the entire `ScrollAnimations` class** (the vanilla `IntersectionObserver` implementation).
  It predates the GSAP setup and is never called. It is dead weight.

- **Delete the following unused methods** from `ScrollAnimationController`:
  - `setupTextReveal()`
  - `addStaggeredAnimation()`
  - `setupFallbackObserver()` — evaluate whether this is actually wired up; if not, delete it.

- **Fix the critical animation bug in `createHeroAnimations()`:**
  The `gsap.set()` calls that define initial states for `.hero-title`, `.hero-tagline`,
  `.hero-description`, and `.hero-cta` appear *after* the `.to()` timeline calls.
  Move all `gsap.set()` calls to `setupInitialStates()` where they belong.
  They must execute before any timeline runs.

- **Audit `MagicalCursorController`:** This class will be fully replaced in Phase 5.
  For now, comment out its instantiation so the rest of the site runs without it.
  Do not delete it yet — Phase 5 will use its canvas/particle logic as a starting
  reference before discarding it.

- **Remove all wand/magic vocabulary** from comments and variable names in the
  animation controller. Rename easing aliases to match the brand:
  - `fireBlast` → keep, rename if desired
  - `emberFloat` → keep
  - `flameFlicker` → keep
  - `magicSpell` → rename to `ashFall`
  - `phoenixRise` → rename to `riseFromBlack`
  - `sparkBurst` → rename to `heatBurst`
  - `infernoWave` → keep
  - `smokeRise` → keep

### 1.2 — SASS / Variables

- The uploaded SASS file contains **three concatenated variable blocks** separated by
  `========================`. These need to be resolved into a single canonical
  `_variables.scss` file. See Phase 2 for the full variable specification.

- **Audit all SASS files for unused selectors.** Specifically check:
  - `.nav-brand` — may become unused if the navbar is removed (see Phase 3)
  - `.mobile-menu-overlay` and all `.mobile-nav-*` selectors — same
  - `.hamburger-line` — same
  - Any selector referencing `.text-reveal` or `.char-reveal` (tied to the deleted JS method)
  - `.fade-in`, `.slide-left`, `.slide-right` — tied to the deleted IntersectionObserver class

### 1.3 — HTML (Astro)

- **Fix the contact form artist name mismatch.** The `<select>` options reference
  `Raven Blackthorne`, `Phoenix Martinez`, and `Ash Steele`. The artist cards show
  `Avery Blackthorne`, `Pepe Martinez`, and `Ashton Starke`. Align them. Use the
  card names as the source of truth.

- **Note all eight empty `<div class="gallery-overlay">` elements.** They will receive
  content in Phase 3. Do not fill them yet — just confirm they exist and are accessible.

---

## Phase 2 — Variable Consolidation & Typography System
> **Recommended model: Sonnet**
> Goal: One authoritative `_variables.scss`. Two font families. Zero ambiguity.

### 2.1 — Canonical Color Tokens

Replace all three existing variable blocks with the following single token system.
Do not keep any legacy aliases — find and replace all references throughout the SASS files.

```scss
// ─── CORE PALETTE ───────────────────────────────────────────────────────────
$void:            #080808;   // true black — hero background, deepest surfaces
$ash:             #111111;   // default body background
$cinder:          #1C1C1C;   // elevated surfaces (cards, navbar)
$iron:            #2E2E2E;   // borders, dividers
$smoke:           #6B6B6B;   // muted text, inactive states
$bone:            #E8E2D9;   // primary text
$bone-dim:        #A09890;   // secondary text

// ─── HEAT PALETTE ────────────────────────────────────────────────────────────
$heat-deep:       #8B0000;   // deep blood — used sparingly, darkest accent
$heat-core:       #CC2200;   // primary brand red — CTAs, active states
$heat-mid:        #E84A1A;   // fire orange — hover states, highlights
$heat-bright:     #FF6B35;   // bright ember — tip of the flame, never dominant
$heat-glow:       #FF9A5C;   // glow halos only — never used as a fill color

// ─── FUNCTIONAL ──────────────────────────────────────────────────────────────
$overlay:         rgba($void, 0.75);
$glass:           rgba($cinder, 0.6);
```

### 2.2 — Typography System

Remove all current font imports and replace with the following two families only.

```scss
// Import
@import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@400;600;700;900&family=Inter:wght@300;400;500&display=swap');

// Tokens
$font-display:    'Cinzel', Georgia, serif;       // All headings, nav, labels
$font-body:       'Inter', system-ui, sans-serif; // Body copy, form fields, captions

// Scale
$size-xs:    0.75rem;   // 12px — labels, legal, timestamps
$size-sm:    0.875rem;  // 14px — captions, secondary copy
$size-base:  1rem;      // 16px — body
$size-md:    1.125rem;  // 18px — lead text
$size-lg:    1.5rem;    // 24px — subheadings
$size-xl:    2rem;      // 32px — section titles
$size-2xl:   3rem;      // 48px — hero tagline
$size-3xl:   4.5rem;    // 72px — hero title (desktop)

// Tracking
$tracking-tight:  -0.02em;
$tracking-base:    0;
$tracking-wide:    0.08em;
$tracking-wider:   0.15em;
$tracking-widest:  0.25em;  // Cinzel display use — uppercase headings
```

### 2.3 — Spacing, Layout & Effects

```scss
// Spacing
$space-1:   0.25rem;
$space-2:   0.5rem;
$space-3:   0.75rem;
$space-4:   1rem;
$space-6:   1.5rem;
$space-8:   2rem;
$space-12:  3rem;
$space-16:  4rem;
$space-24:  6rem;
$space-32:  8rem;

// Layout
$container-width:   1200px;
$container-padding: clamp(1rem, 5vw, 3rem);

// Radii — minimal; dark luxury does not over-round
$radius-sm:   2px;
$radius-base: 4px;
$radius-none: 0;

// Transitions
$ease-heat:    cubic-bezier(0.4, 0, 0.2, 1);
$ease-rise:    cubic-bezier(0.16, 1, 0.3, 1);   // fast in, slow settle
$ease-reveal:  cubic-bezier(0.77, 0, 0.175, 1); // dramatic reveal
$t-fast:   0.2s;
$t-base:   0.35s;
$t-slow:   0.6s;
$t-crawl:  1.2s;
```

---

## Phase 3 — HTML Structure & Navbar Decision
> **Recommended model: Sonnet**
> Goal: Clean semantic markup. No emoji. Purposeful content in every element.

### 3.1 — Remove the Navbar

**Recommendation: remove the navbar entirely from this demo.**

Rationale: This page is consumed as an iframe embed within the Garfish Digital site.
The visitor is not navigating — they are watching. The scroll *is* the experience.
A navbar in an iframe creates visual noise, eats 60-70px of prime viewport, and
implies a navigational context that doesn't exist in an embed.

If a directional cue is desired, consider floating minimal section indicators
on the right edge (a vertical stack of short lines that highlight as sections pass)
rather than a traditional nav. This is optional — the phase below does not require it.

**If you decide to keep a minimal navbar:** strip it down to the pitchfork SVG mark
on the left, no links, no hamburger, no mobile overlay. Pure brand mark.

### 3.2 — Pitchfork SVG Mark

Replace the 🔥 emoji nav icon (and any other brand mark placeholders) with a custom
pitchfork SVG. Below is a starter geometry — **⚠ Judgment Call**: have Claude Code
refine the path or trace over a reference if you have one. The goal is a minimal,
almost heraldic mark — not illustrated, not decorative.

```svg
<svg class="brand-mark" viewBox="0 0 40 60" fill="none" xmlns="http://www.w3.org/2000/svg">
  <!-- Shaft -->
  <line x1="20" y1="18" x2="20" y2="58" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"/>
  <!-- Tines: center, left, right -->
  <line x1="20" y1="6"  x2="20" y2="26" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"/>
  <line x1="10" y1="2"  x2="10" y2="20" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"/>
  <line x1="30" y1="2"  x2="30" y2="20" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"/>
  <!-- Crossbar connecting tines to shaft -->
  <path d="M10 20 Q10 26 20 26 Q30 26 30 20" stroke="currentColor" stroke-width="2" fill="none"/>
</svg>
```

Color: `$bone` at rest. On scroll past hero: `$heat-core`. Transition: `$t-base`.

### 3.3 — Section Structure

The page should flow in this order, with no section reordering:

1. **Hero** — full viewport height (`100dvh`). Title, tagline, description, CTA.
   Background: `$void`. The Three.js scene (Phase 6) does *not* live here —
   the hero should feel like cold, still darkness. Heat comes later.
2. **Services** — dark surface (`$ash`). 4 cards. No emoji icons — replace with
   minimal inline SVGs or remove the icon elements entirely and let the heading carry.
3. **Artists** — same surface or subtle elevation to `$cinder`. 3 cards.
4. **Gallery** — full-width grid. Dark background. Overlays need content (see 3.4).
5. **Contact** — `$ash`. Form + info side by side.
6. **Hell Floor** — the Three.js scene (Phase 6). Full-width. ~400px tall.
   This is the final element on the page. It should feel like the page ends at the
   edge of a pit. No footer text, no copyright line below the scene.

### 3.4 — Gallery Overlays

Each `.gallery-overlay` should contain at minimum:

```html
<div class="gallery-overlay">
  <span class="overlay-style">Blackwork</span>  <!-- style tag, varies per item -->
</div>
```

On hover: overlay fades in (`opacity: 0` → `opacity: 1`), style label slides up
from below. Keep it minimal. No "View Project" buttons. No icons. Just the style name
in Cinzel, tracked wide, bone colored.

### 3.5 — Service Cards

Remove the `<div class="service-icon">` elements. The icon emoji (🖊️, 🔱, 🌑, ⚡)
actively undermine the aesthetic. The card headings — Custom Designs, Traditional,
Blackwork, Cover-ups — are strong enough to stand without decoration.
If you want a visual accent, use a single 1px `$heat-core` top border on each card.

---

## Phase 4 — GSAP Animation Rework
> **Recommended model: Opus**
> Goal: Restraint over spectacle. Every animation earns its place.

### Core Principles for This Phase

Before writing any code in this phase, give Claude Code this directive:

> "Dark luxury animation is not the absence of movement — it is the *precision* of
> movement. Entrances should feel inevitable, not theatrical. Nothing rotates in 3D
> unless it has a physical reason to. Nothing bounces. Nothing scales from zero.
> We are revealing something that was always there, not launching something into existence."

### 4.1 — Remove These Animations Entirely

- All `rotationX`, `rotationY`, `rotationZ` on cards and section titles
- `scale: 0` on gallery items — use `scale: 0.97` to `1` at most
- The random rotation logic on gallery items (`Math.random() - 0.5) * 90`) — delete
- The `scale: 0.8` + `rotationX: 45` on section titles
- The `x: -200` + `rotationZ: -15` + `scale: 0.7` on artist cards
- `createHeroParticleExplosion()` — the burst on hero load is excessive; delete or
  replace with a very subtle heat shimmer effect only (see 4.3)

### 4.2 — Replacement Animation Vocabulary

Use only these movement types going forward:

**Fade-rise** (default entrance):
```js
gsap.set(el, { y: 30, opacity: 0 });
gsap.to(el, { y: 0, opacity: 1, duration: 0.8, ease: 'power2.out' });
```

**Clip-path reveal** (section titles):
```js
gsap.set(el, { clipPath: 'inset(0 100% 0 0)' });
gsap.to(el, { clipPath: 'inset(0 0% 0 0)', duration: 1.1, ease: 'expo.inOut' });
```

**Stagger fade-rise** (cards):
```js
gsap.from(cards, {
  y: 40, opacity: 0, duration: 0.7, ease: 'power2.out',
  stagger: { amount: 0.4, from: 'start' }
});
```

**Gallery reveal** (subtle scale + fade):
```js
gsap.from(item, { scale: 0.97, opacity: 0, duration: 0.6, ease: 'power1.out' });
```

### 4.3 — Hero Animations

The hero entrance should feel like a slow emergence from darkness:

1. Background stays `$void` — fully opaque, no gradient on load
2. Title: clip-path reveal, left to right, 1.4s, `expo.inOut`
3. Tagline: fade-rise, starts 0.6s after title begins
4. Description: fade-rise, starts 0.9s after title begins, slightly slower
5. CTA: fade-rise + very subtle scale from 0.98, starts 1.1s after title
6. After CTA appears: a slow, continuous `box-shadow` pulse using `$heat-core` at
   low opacity — this is the only persistent animation on the hero. Keep it subtle.
   Shadow spread should not exceed `40px` at peak. It should breathe, not throb.

### 4.4 — ScrollTrigger Configuration

All scroll-triggered animations should use these baseline settings unless
there is a specific reason to deviate:

```js
scrollTrigger: {
  trigger: el,
  start: 'top 80%',
  end: 'top 40%',
  toggleActions: 'play none none none'
}
```

Do not use `scrub` on text or card entrances. `scrub` is reserved for parallax
elements (if any) and the Three.js scene intensity (Phase 6).

---

## Phase 5 — Cursor Rebuild
> **Recommended model: Opus**
> Goal: A cursor that feels like a heated needle moving through dark air.
> Not a wand. Not a fireball. Contained. Dangerous. Minimal.

### 5.1 — What to Remove

Delete the entire `MagicalCursorController` class and its associated HTML markup:

- `.magical-cursor-container`
- `.cursor-wand` and all children (`.wand-tip`, `.wand-shaft`, `.wand-aura`)
- `.cursor-ball` and all children (`.ball-core`, `.ball-flames`, `.ball-embers`)
- `.sparkle-canvas`, `.ember-canvas` (as separate injected elements)
- All keyframe animations tied to the above: `tipGlow`, `tipPulse`, `tipHalo`,
  `shaftShimmer`, `auraBreath`, `auraRotate`, `coreFlicker`, `flamesFlicker`,
  `flamesOuter`, `embersGlow`, `embersOuter`

Keep the canvas particle *logic* for reference (the `updateParticles()` and
`render()` methods) — the math is reusable. The visual expression changes entirely.

### 5.2 — New Cursor: The Needle

The cursor is a single small element. No compound shapes. No glow halos at rest.

**Cursor element (CSS-rendered):**
- A circle, `10px` diameter
- Background: `$heat-bright` — the only hot color the cursor should ever be
- No `box-shadow` at rest
- `mix-blend-mode: difference` — this is key. Against dark backgrounds it appears
  as a bright hot point. Against light elements (bone-colored text) it inverts.
  This creates natural, contextual feedback without any JavaScript state management.
- Movement: GSAP `.to()` with `duration: 0.12`, `ease: 'power2.out'` — tight
  follow, not laggy, not immediate

**On hover over interactive elements (`a`, `button`):**
- Scale to `2.5x` over `0.2s`
- `mix-blend-mode` remains `difference`
- No color change — scale alone is enough signal

**On mousedown:**
- Scale to `0.6x` over `0.1s` — the cursor "punctures"
- Return to base scale on mouseup

### 5.3 — Ember Trail

A single canvas element, `position: fixed`, full viewport, `pointer-events: none`,
`z-index` below the cursor element but above page content.

Trail behavior:
- On each `mousemove`, emit **1 ember** (not a burst — a single point)
- Ember properties:
  - Position: cursor position
  - Velocity: small inherited vector from cursor movement direction, magnitude `0.5–1.5px/frame`
  - Upward drift: `vy -= 0.04` per frame (embers rise)
  - Lateral wobble: `vx += (Math.random() - 0.5) * 0.1` per frame
  - Size: `2–4px` (randomized at spawn)
  - Color: starts at `$heat-bright`, decays toward `$heat-deep`
  - Life: `0.8s` maximum
  - Opacity tied directly to life remaining — linear decay

**What this produces:** a thin, sparse trail of slowly rising sparks that dissipates
quickly. It reads as heat residue, not fireworks. The trail should feel like the
air is warm where the cursor has been, not that the cursor is on fire.

**On click:** emit `8–12 embers` in a tight radial burst. Low velocity (`2–4px/frame`).
Same decay as trail embers. This is the maximum drama the cursor is allowed.

### 5.4 — Mobile

Disable the custom cursor and all canvas rendering on touch devices.
Detect via `window.matchMedia('(pointer: coarse)')`. Restore `cursor: auto` on body.

---

## Phase 6 — The Hell Floor (Three.js Scene)
> **Recommended model: Opus**
> Goal: A volumetric heat scene at the bottom of the page. The scroll ends at the
> edge of a pit. Hell is below. It does not announce itself — it simply *is*.

### 6.1 — Concept Brief

The final section of the page is not a footer. It is a threshold.
The Three.js scene should communicate:

- **Depth** — there is something below the visible surface
- **Heat** — crimson/deep orange light, not yellow, not cheerful
- **Stillness with menace** — slow movement, not frenetic; embers that drift, not explode
- **Boundary** — the scene should feel like the world ends here

The camera looks down into the scene. The viewer is at the top of the pit.

### 6.2 — Scene Composition

**Background plane:**
- A `PlaneGeometry` filling the canvas, `$void` colored
- A radial gradient texture baked in, `$heat-deep` concentrated at center bottom,
  fading to `$void` at edges — this creates the illusion of a glowing abyss

**Ember particle system (Three.js Points):**
- `800–1200` particles
- Distribution: concentrated in the lower half of the scene, sparse at the top
- Movement: upward drift (`y += 0.003–0.008` per frame), slight lateral sway
  using `sin(time + offset)` per particle
- Colors: range from `$heat-deep` (deepest particles, barely visible) to
  `$heat-bright` (highest particles, near the surface boundary)
- Particles that exit the top of the scene reset to the bottom with randomized X position
- Size attenuation: particles near the top (closest to viewer) should be slightly larger
- Use `AdditiveBlending` — this is critical for the glow effect; particles will
  bloom against the dark background without needing post-processing

**Heat shimmer (optional — implement last):**
A subtle displacement pass using a noise texture to distort the scene slightly,
simulating rising heat. Implement only if the base scene feels static.
Use a custom `ShaderMaterial` with a time uniform. Keep distortion magnitude low
(`0.003–0.008` in UV space) — it should be subliminal, not obvious.

### 6.3 — ScrollTrigger Integration

Wire the scene intensity to scroll position:

```js
ScrollTrigger.create({
  trigger: '.hell-floor',
  start: 'top bottom',
  end: 'top center',
  scrub: 1,
  onUpdate: (self) => {
    // Increase particle speed and brightness as scene enters viewport
    scene.userData.intensity = self.progress;
  }
});
```

At `intensity = 0` (scene just off-screen): particles barely moving, very dim.
At `intensity = 1` (scene centered in viewport): full drift speed, full color range.

### 6.4 — Canvas Setup

```html
<section class="hell-floor">
  <canvas id="hell-canvas"></canvas>
</section>
```

```scss
.hell-floor {
  width: 100%;
  height: 400px;
  position: relative;
  overflow: hidden;
  background: $void;

  canvas {
    width: 100%;
    height: 100%;
    display: block;
  }
}
```

The scene must handle `ResizeObserver` to recompute camera aspect ratio and
renderer size when the iframe width changes.

### 6.5 — Performance Budget

- Target: **60fps** on mid-range hardware
- Particle count should be a constant — no dynamic spawning (unlike the cursor trail)
- If frame time exceeds 16ms, reduce particle count; do not add dynamic fallback
  complexity at this stage
- The renderer should use `antialias: false` and `powerPreference: 'high-performance'`
- Pause rendering when the section is not in the viewport using an
  `IntersectionObserver` on `.hell-floor`

---

## Phase 7 — Final Audit
> **Recommended model: Sonnet**
> Goal: QA pass before the demo is considered complete.

### Checklist

- [ ] No emoji anywhere in the rendered output
- [ ] Contact form artist names match artist card names exactly
- [ ] All gallery overlays have style labels
- [ ] Cursor disabled on touch/mobile, page is fully usable without it
- [ ] Three.js scene pauses when off-screen
- [ ] Hero entrance animation plays correctly on first load (no flash of unstyled content)
- [ ] No `rotationX`, `rotationY`, or `rotationZ` in any scroll animation
- [ ] No `scale: 0` in any entrance animation (minimum `scale: 0.95`)
- [ ] Cinzel is the only display typeface used
- [ ] Inter is the only body typeface used
- [ ] No legacy color variables remain — all references use the Phase 2 token system
- [ ] `requestIdleCallback` is still used for non-critical GSAP setup (keep this — it is correct)
- [ ] `ScrollTrigger.refresh()` is still called after all animations initialize
- [ ] The page reads well with `prefers-reduced-motion: reduce` — all animations should
      respect this flag; the Three.js scene should be static (no particle movement) under
      reduced motion

---

*Roadmap version 1.0 — Inferno Ink only. Prepared by Garfish Digital / Claude.*


=========

Here are all the adjustable values in HellFloor.js:

  Spawning
  - maxEmbers: 64 — hard cap on simultaneous embers across all clusters
  - randomSpawnDelay(): 4 + Math.random() * 4 — seconds between clusters (4–8s)
  - Cluster size: 3 + Math.floor(Math.random() * 6) — embers per cluster (3–8)
  - clusterX: (Math.random() - 0.5) * this.width * 0.7 — horizontal spread of cluster origins (70% of section width, centered)
  - spread: 30 + Math.random() * 40 — pixel spread of embers within a cluster (30–70px)

  Ember physics
  - vy (rise speed): 15 + Math.random() * 35 — pixels/sec (15–50)
  - vx (initial lateral velocity): (Math.random() - 0.5) * 8 — pixels/sec (-4 to 4)
  - vx damping: *= 0.97 per frame — how quickly lateral drift settles
  - wobbleFreq: 1.5 + Math.random() * 2 — oscillations/sec for lateral wobble (1.5–3.5)
  - wobbleAmp: 8 + Math.random() * 15 — force magnitude of wobble (8–23)
  - Kill boundary: halfH * 0.4 — embers are removed when they rise above 40% up from center (roughly the upper 10% of the section)

  Ember appearance
  - size: 8 + Math.random() * 8 — point sprite size in pixels (8–16)
  - Size decay: e.size * (1.0 - t * 0.4) — shrinks to 60% of original by end of life
  - Aspect ratio: 3.5 in the fragment shader — long axis to short axis ratio of the sliver shape
  - Taper: mix(1.0, 0.3, ...) — base of ember is full width, tip narrows to 30%

  Ember lifetime & fading
  - maxLife: 2.5 + Math.random() * 4 — total lifespan in seconds (2.5–6.5s)
  - Fade-in: first 8% of life (t < 0.08)
  - Sustain: 8%–60% of life (full opacity)
  - Fade-out: final 40% of life (60%–100%)
  - Alpha cap: * 0.95 — never fully opaque

  Ember color
  - Birth color: rgb(1.0, 0.6, 0.36) — approximates $heat-glow (#FF9A5C)
  - Death color: rgb(0.545, 0.0, 0.0) — $heat-deep (#8B0000)
  - Interpolation: linear from bright to deep over lifetime
  - tipHeat: 0.3 brightness boost at the base/hot end of each sliver

  Ember rotation
  - angleSmooth: 0.08 + Math.random() * 0.04 — how fast the sliver reorients to match travel direction (0.08–0.12, per-frame lerp factor)
  - Initial angle: Math.PI / 2 — pointing upward at spawn

  Glow plane
  - Base intensity: 0.55
  - Pulse layers: three sine waves at 0.3Hz/amp 0.12, 0.7Hz/amp 0.08, 1.3Hz/amp 0.05
  - Vertical reach: smoothstep(0.38, 0.0, y) — fades from bottom to ~38% up the section
  - Horizontal falloff: quadratic curve, strongest at center
  - Alpha output: glow * 0.45 — max opacity ~45%
  - Deep color: rgb(0.545, 0.0, 0.0) — #8B0000
  - Core color: rgb(0.8, 0.133, 0.0) — #CC2200