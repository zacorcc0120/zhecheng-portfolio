/**
 * PARAMETRIC SCULPTURAL SURFACE — the geometry both new scenes are built from.
 *
 * One surface function, four domain readings, one four-phase study. Nothing in
 * here knows about three.js: these are numbers, so the same file can be reasoned
 * about, tested, and handed straight to the renderer as uniforms. The renderer
 * never allocates geometry or material per frame either — the surface is
 * evaluated in the vertex shader from a dozen floats, which is why a slowly
 * evolving sculptural form costs almost nothing here.
 *
 * THE FORM
 * A vault. A spine runs along x; a parabolic cross-section rises from it and
 * lands at both ends; the cross-section rotates about the spine as it travels, so
 * the whole thing reads as a twisted shell rather than a tube. Ribs stand proud
 * of the membrane at regular stations, and the membrane dishes between them.
 *
 * Silhouette is the reason for the specific numbers: rise and fall to the ground
 * at t=0 and t=1, so the object has a footprint and a top edge instead of
 * fading into the page. Twist is capped well below a full quarter turn, because
 * past that it stops reading as architecture and starts reading as a funnel.
 *
 * THE FOUR DOMAINS (brief §06.3)
 * The four disciplines are parameter readings of the SAME surface, interpolated
 * continuously — never four models and never a swap. A reading is a vector, and
 * moving between two of them is a lerp, so every intermediate state is another
 * valid member of the family.
 */

/** Every knob the form has. Deliberately few: each one has to earn its place. */
export type SculptParams = {
  /** Crown height at mid-span. Curvature. */
  rise: number;
  /** Half-width at the base. Amplitude. */
  span: number;
  /** Radians the section rotates end to end. Kept under ~0.9π on purpose. */
  twist: number;
  /** How far the ribs stand proud of the membrane. */
  ribDepth: number;
  /** 0 = a handful of ribs, 1 = every rib. Rib density, grown not switched. */
  density: number;
  /** Plan-view curvature of the spine. Structural variation. */
  fold: number;
  /** How much the two ends curl in over the footprint. 0 straight, 1 closed. */
  close: number;
  /** Transverse members — the underlying grid the ribs are cut from. */
  lattice: number;
  /** Membrane opacity: 0 skeleton, 1 solid surface. */
  surface: number;
};

export const BASE: SculptParams = {
  rise: 0.82,
  span: 1,
  twist: 0.44,
  ribDepth: 0.58,
  density: 0.55,
  fold: 0.42,
  close: 0.18,
  lattice: 0.28,
  surface: 1,
};

/**
 * Domain readings. Kept close enough to each other that any pair interpolates
 * into something plausible — that constraint is what makes the selector feel
 * like one system being re-tuned rather than four things being swapped.
 */
export const DOMAIN_READINGS: Record<string, SculptParams> = {
  /* Curvature does the talking: wide, continuous, few pronounced ribs. */
  parametric: { ...BASE, rise: 1.06, twist: 0.26, ribDepth: 0.44, density: 0.3, fold: 0.62, close: 0.08, lattice: 0.08, surface: 1 },
  /* Structure branches: the twist carries the eye, ribs go deep and uneven,
     and enough of the underlying grid shows to read as a diagram of a process. */
  workflow: { ...BASE, rise: 0.74, span: 0.88, twist: 0.92, ribDepth: 0.86, density: 0.74, fold: 0.34, close: 0.4, lattice: 0.52, surface: 0.66 },
  /* Order: nearly no twist, the widest span, almost every rib. The surface is
     close to an organised array — geometry that is halfway to being an interface. */
  product: { ...BASE, rise: 0.54, span: 1.14, twist: 0.1, ribDepth: 0.34, density: 0.96, fold: 0.12, close: 0.04, lattice: 0.78, surface: 0.94 },
  /* Lattice: the object stops being a shell and becomes a structure you can see
     through. Membrane mostly gone, the full transverse grid present. */
  lattice: { ...BASE, rise: 0.9, span: 0.94, twist: 0.58, ribDepth: 0.72, density: 1, fold: 0.48, close: 0.26, lattice: 1, surface: 0.42 },
};

export const DOMAIN_KEYS = ["parametric", "workflow", "product", "lattice"] as const;

export function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

/** Reads a parameter vector at a continuous position along the domain cycle. */
export function readDomains(mix: number): SculptParams {
  const n = DOMAIN_KEYS.length;
  const t = ((mix % n) + n) % n;
  const i = Math.floor(t);
  const f = t - i;
  const a = DOMAIN_READINGS[DOMAIN_KEYS[i]];
  const b = DOMAIN_READINGS[DOMAIN_KEYS[(i + 1) % n]];
  // Smoothstep between neighbours: a linear ramp spends its time parked at one
  // end and then darts, which reads as a glitch on hover.
  const s = f * f * (3 - 2 * f);
  const out = {} as SculptParams;
  (Object.keys(a) as (keyof SculptParams)[]).forEach((k) => {
    out[k] = lerp(a[k], b[k], s);
  });
  return out;
}

/** Frame angle in radians, written as a name so the number appears once. */
const FULL_TURN = Math.PI * 2;

/**
 * The RULES study, as four phases of one trajectory.
 *
 * Brief §11: RULES → STRUCTURE → FORM → VARIATION, one cycle, no cut. Same
 * construction as the line work that preceded it — every term is periodic in θ,
 * so θ and θ+2π are the same object and there is no seam to hide — but now the
 * thing that loops is a solid with a material on it rather than a set of paths.
 *
 * FORM is the phase that has to be worth looking at (§11 says so outright), so
 * the envelope is weighted to hold there rather than sweeping evenly.
 */
export const PHASES = ["RULES", "STRUCTURE", "FORM", "VARIATION"] as const;
export type Phase = (typeof PHASES)[number];

export function sculptCycle(period: number, elapsed: number) {
  const theta = ((elapsed / period) % 1) * FULL_TURN;
  const cycle = theta / FULL_TURN;

  // One raised cosine, phase-shifted so the deepest part of the envelope lands
  // on FORM (the middle of the cycle) and the shallowest on RULES.
  const swing = 0.5 - 0.5 * Math.cos(theta - 1.62);
  const heavy = swing * swing * (3 - 2 * swing); // bias the dwell toward FORM

  // VARIATION is a different family member, not a replay: the drift terms run
  // on their own periods so by the time the envelope comes round again the
  // object is somewhere else in its own parameter space.
  const driftA = Math.sin(theta);
  const driftB = Math.cos(theta);

  const phase = (PHASES[Math.min(3, Math.floor(cycle * 4))] as Phase);

  const params: SculptParams = {
    // The shell starts as a ruled surface barely lifted off its grid and ends as
    // a volume. rise carries most of that, which is what makes FORM read as mass.
    // The range is deliberately narrow. The camera is framed once for the whole
    // family, so a phase that collapses towards a flat sheet — or a mode that
    // halves the height — does not just look different, it leaves the upper half
    // of the band empty with the object cropped against the bottom edge. FORM
    // has to be worth looking at, but not by being twice the size of its family.
    rise: lerp(0.78, 1.16, heavy) * (1 + 0.06 * driftA),
    span: lerp(1.16, 0.86, heavy),
    twist: 0.1 + 0.78 * heavy + 0.12 * driftB,
    // Structure arrives before mass: the ribs are at full depth while the
    // membrane is still only scaffolding, so FORM is the first moment the two
    // are both present.
    ribDepth: lerp(0.3, 0.92, Math.min(1, heavy * 1.35)),
    density: lerp(1, 0.46, heavy),
    fold: 0.16 + 0.52 * heavy + 0.08 * driftA * driftB,
    close: 0.04 + 0.34 * swing,
    lattice: lerp(1, 0.06, Math.min(1, heavy * 1.6)),
    /* The membrane never goes fully transparent. Each of the three display
       modes scales this term, so a floor near zero meant that at the RULES
       phase all three modes multiplied out to nothing and the scene looked
       identical in all of them — the controls looked like they did nothing. */
    surface: lerp(0.34, 1, Math.min(1, Math.pow(heavy, 1.2))),
  };

  return { theta, cycle, phase, params };
}

/**
 * Ambient drift for a live sculpture that is not running the four-phase study —
 * the practice scene. Small, slow, and periodic: enough to keep the object
 * breathing without ever leaving its own family.
 */
export function sculptBreathe(elapsed: number, period: number) {
  const theta = ((elapsed / period) % 1) * FULL_TURN;
  const a = Math.sin(theta);
  const b = Math.cos(theta);
  const slow = Math.sin(theta * 2);
  return {
    rise: 1 + 0.09 * a,
    twist: 1 + 0.16 * b,
    fold: 1 + 0.13 * slow,
    density: 1 + 0.07 * b * slow,
    ribDepth: 1 + 0.08 * a,
    span: 1 + 0.04 * b,
    close: 1 + 0.1 * a * b,
  };
}
