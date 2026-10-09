/**
 * Page motion tokens for the JIKO case study.
 *
 * The whole portfolio already has one motion identity: a long decelerating
 * ease-out (--ease-out / cubic-bezier(0.16, 1, 0.3, 1)) used by MaskReveal,
 * the cover seams and the chapter wipes. Re-introducing a second curve for one
 * page would make it feel like a guest on someone else's site, so the JIKO
 * signature easing is that same curve and only the amplitudes differ.
 *
 * Personality: Premium. Duration sits in the 350-600ms band, overshoot is 0,
 * and entrances decelerate while exits accelerate. Nothing on this page
 * bounces, and nothing rotates more than the 2-6px pointer parallax.
 *
 * Four levels, and only one thing on the page is allowed to reach level 4:
 *   L1 micro  — hover, press, focus rings, toggles
 *   L2 UI     — buttons, chips, tab state, image mask reveals
 *   L3 content— section entrances, gallery plates, editor blocks
 *   L4 hero   — the page-load sequence (once, never replayed)
 *   Signature — TIME INTO MEMORY, driven by scroll position, not by a clock
 */

export const motion = {
  /** L1 — must feel instant. Hover/press/focus feedback. */
  micro: 0.15,
  /** L2 — a visible state change that still answers the click immediately. */
  ui: 0.22,
  /** L3 — a block arriving, or a plate being read. */
  content: 0.42,
  /** L4 — the page-load sequence. Long enough to stage five beats. */
  hero: 0.82,
  /** Signature crossfade between product stages (brief asks 350-550ms). */
  stage: 0.46,
} as const;

/** The one signature easing, and the one exit curve. */
export const ease = {
  /** Entrance / on-screen. Fast departure, long deceleration into place. */
  out: [0.16, 1, 0.3, 1] as [number, number, number, number],
  /** Exit / dismissal. Slow lift, fast departure. */
  in: [0.5, 0, 0.9, 0.4] as [number, number, number, number],
  /** On-screen continuity: a value that follows scroll should not pulse. */
  inOut: [0.65, 0, 0.35, 1] as [number, number, number, number],
};

/**
 * Stagger budgets. The total is what matters: a cascade is finished and gone
 * before a reader has finished the sentence above it.
 */
export const stagger = {
  micro: 0.028,
  ui: 0.06,
  content: 0.075,
} as const;

/**
 * Hero entrance beats, in seconds. Gaps rather than durations, because each
 * beat is allowed to finish before the next one starts — five overlapping
 * animations read as noise, five sequenced ones read as a sentence.
 */
export const heroBeats = {
  display: 0.05,
  chinese: 0.42,
  phones: 0.72,
  meta: 1.16,
  indicator: 1.5,
} as const;

/**
 * Reduced motion is a first-class mode, not a downgrade: every distance in the
 * journey collapses to 0 and every duration collapses to 0, so the same
 * component tree renders the same information with nothing moving.
 */
export const calm = {
  duration: 0,
  distance: 0,
} as const;