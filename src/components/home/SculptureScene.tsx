"use client";

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useEffect, useLayoutEffect, useMemo, useRef, type RefObject } from "react";
import {
  BufferAttribute,
  BufferGeometry,
  Color,
  DataTexture,
  DoubleSide,
  EquirectangularReflectionMapping,
  FloatType,
  FrontSide,
  Group,
  LinearFilter,
  MeshBasicMaterial,
  MeshStandardMaterial,
  PMREMGenerator,
  RGBAFormat,
  SRGBColorSpace,
  type PerspectiveCamera,
  type Scene,
  type WebGLRenderer,
} from "three";
import type { SculptParams } from "@/lib/sculpture";

/**
 * PARAMETRIC SCULPTURAL SURFACE — the renderer.
 *
 * WHY THE FORM LIVES IN THE VERTEX SHADER
 * A vault like this is a function of two coordinates. Evaluating it on the CPU
 * would mean rewriting several thousand vertices every frame and re-uploading
 * them; evaluating it on the GPU means the whole deformation is eleven uniforms
 * and a per-frame cost of about nothing. Geometry and material are built once,
 * on mount, and never touched again — the only way a continuously evolving
 * solid can be honest about not allocating (§19).
 *
 * Normals come from central differences against the same function rather than
 * being baked, so when `rise` changes, the lighting changes with it. A baked
 * normal would have been a lie the first time the surface moved.
 *
 * Three draw calls for the whole object: the membrane, the ribs, and the
 * transverse lattice. Ribs and lattice are the same swept member at two
 * orientations, built from the same function — one buffer per orientation so
 * neither needs a custom vertex attribute, which keeps this working across
 * three.js GLSL versions without a private-attribute dance.
 *
 * No custom vertex attributes anywhere: the parametric coordinates ride in the
 * `position` attribute itself (x = fixed coordinate, y = travel, z = position
 * across the section), and the shader knows which is which.
 */

/* ------------------------------------------------------------------ GLSL */

const VAULT_GLSL = /* glsl */ `
  uniform float uLength;
  uniform float uRise;
  uniform float uSpan;
  uniform float uTwist;
  uniform float uFold;
  uniform float uClose;
  uniform float uRibDepth;
  uniform float uDensity;
  uniform float uRibCount;
  uniform vec2 uPointer;
  uniform float uPointerAmt;

  const float PI = 3.14159265359;

  // Which ribs exist at a given density, and how deeply. Each rib holds a stable
  // pseudo-random rank, so raising density grows more of them in an irregular
  // order instead of sliding a threshold across a neat row. Nothing pops: a rib
  // arrives by getting deeper, never by switching on.
  float ribRank(float i) {
    return fract(sin(i * 12.9898) * 43758.5453);
  }
  float ribProm(float t) {
    return clamp((ribRank(floor(t * uRibCount + 0.5)) - (1.0 - uDensity)) * 2.4, 0.0, 1.0);
  }

  // Membrane dish between two ribs: 0 on the rib, 1 mid-span.
  float dish(float t) {
    float ph = fract(t * uRibCount);
    float d = min(ph, 1.0 - ph) * 2.0;
    return (1.0 - d * d) * ribProm(t);
  }

  // THE SURFACE. t runs 0..1 along the spine, v runs -1..1 across the section.
  vec3 vault(vec2 tv) {
    float t = clamp(tv.x, 0.0, 1.0);
    float v = clamp(tv.y, -1.0, 1.0);

    // 0 at the ends, 1 at mid-span. The low exponent is why the object rises
    // out of a footprint instead of swelling out of nothing.
    float env = pow(max(sin(PI * t), 0.0), 0.72);

    float ang = uTwist * (t - 0.5) * PI;

    /* RISE OVER SPAN IS THE WHOLE SILHOUETTE. An arch as wide as it is tall is
       a dome, and a dome has nothing to say. Taller than it is wide, it reads
       as a vault, and everything else — the ribs standing on it, the springing
       line at its feet — follows from that. */
    float rise = uRise * 1.52 * env;
    /* Narrower than it is tall, which is the whole difference between a vault
       and a dome. Narrowing the section rather than raising the arch is the
       cheap way to get it: the frame is filled by the spine's length, so a
       thinner section buys the ratio without making the object smaller. */
    float span = uSpan * 0.78 * (0.15 + 0.85 * env) * (1.0 - uClose * 0.5 * (1.0 - env));

    float cx = v * span;
    float cy = rise * pow(max(0.0, 1.0 - v * v * 0.96), 1.05);
    // The membrane hangs between the ribs. A shallow dish makes a bulge; a deep
    // one makes a series of bays, which is what gives the object its rhythm.
    cy -= dish(t) * uRibDepth * 0.62 * env;

    // Pointer influence. Local and bounded, with a falloff that dies out well
    // before the edges: the surface leans towards the cursor and gives the
    // cursor back, rather than being dragged around by it. env keeps it off the
    // footprint, where a bump would read as a dent in the ground.
    float pd = t - uPointer.x;
    float pw = v - uPointer.y;
    cy += exp(-(pd * pd * 4.5 + pw * pw * 3.2)) * uPointerAmt * 0.26 * env;

    float z = uFold * sin(2.0 * PI * t) * 0.42;

    float ca = cos(ang);
    float sa = sin(ang);
    return vec3(t * uLength - uLength * 0.5, cy * ca - cx * sa, cy * sa + cx * ca + z);
  }

  void vaultAt(vec2 tv, out vec3 p, out vec3 n, out vec3 dtx, out vec3 dvx) {
    float e = 0.007;
    p = vault(tv);
    dtx = vault(tv + vec2(e, 0.0)) - vault(tv - vec2(e, 0.0));
    dvx = vault(tv + vec2(0.0, e)) - vault(tv - vec2(0.0, e));
    n = normalize(cross(dvx, dtx));
  }
`;

/* ------------------------------------------------------------------ geometry */

/**
 * The membrane. A flat grid whose position attribute carries only the
 * parametric coordinates — x is t, z is v — because where these vertices
 * actually are is decided in the shader. One buffer, allocated once.
 */
function useShellGeometry(segT: number, segV: number) {
  return useMemo(() => {
    const nx = segV + 1;
    const nz = segT + 1;
    const count = nx * nz;
    const position = new Float32Array(count * 3);
    const index = new Uint32Array(segT * segV * 6);
    for (let j = 0; j < nz; j++) {
      for (let i = 0; i < nx; i++) {
        const n = j * nx + i;
        position[n * 3] = i / segV; // t
        position[n * 3 + 2] = (j / segT) * 2 - 1; // v
      }
    }
    let k = 0;
    for (let j = 0; j < segT; j++) {
      for (let i = 0; i < segV; i++) {
        const a = j * nx + i;
        const b = a + 1;
        const c = a + nx;
        const d = c + 1;
        index[k++] = a;
        index[k++] = c;
        index[k++] = b;
        index[k++] = b;
        index[k++] = c;
        index[k++] = d;
      }
    }
    const g = new BufferGeometry();
    g.setAttribute("position", new BufferAttribute(position, 3));
    g.setIndex(new BufferAttribute(index, 1));
    return g;
  }, [segT, segV]);
}

/**
 * A bundle of swept members. Each one runs along a curve of constant t (a rib)
 * or of constant v (a lattice member) and carries a trapezoidal section — flat
 * top, chamfered flanks — because a round rod reads as plumbing and a
 * rectangular one reads as built.
 *
 * `axis` picks the orientation: 0 sweeps across v, 1 sweeps along t.
 */
function useMemberGeometry(count: number, stations: number, axis: 0 | 1) {
  return useMemo(() => {
    // position across the section: outer edge · flank · flank · outer edge
    const PROFILE = [-1, -0.5, 0.5, 1];
    const position: number[] = [];
    const index: number[] = [];
    for (let m = 0; m < count; m++) {
      // Inset from the ends so the first and last member stand on the footprint
      // rather than floating off the end of it.
      const fixed = axis === 0 ? (m + 0.5) / count : ((m + 0.5) / count) * 2 - 1;
      const base = position.length / 3;
      for (let s = 0; s < stations; s++) {
        // Inset from both ends. At t=0 and t=1 the section has collapsed to
        // nothing, so a member that runs all the way out ends in a sliver that
        // pokes past the footprint and reads as a spike.
        const travel = axis === 1 ? 0.015 + 0.97 * (s / (stations - 1)) : s / (stations - 1);
        for (let c = 0; c < PROFILE.length; c++) {
          if (axis === 0) position.push(fixed, travel, PROFILE[c]);
          else position.push(travel, PROFILE[c], fixed);
        }
      }
      for (let s = 0; s < stations - 1; s++) {
        for (let c = 0; c < PROFILE.length - 1; c++) {
          const a = base + s * PROFILE.length + c;
          const b = a + 1;
          const d = a + PROFILE.length;
          const e = d + 1;
          index.push(a, d, b, b, d, e);
        }
      }
    }
    const g = new BufferGeometry();
    g.setAttribute("position", new BufferAttribute(new Float32Array(position), 3));
    g.setIndex(index);
    return g;
  }, [axis, count, stations]);
}

/* ------------------------------------------------------------------ material */

type Uniforms = Record<string, { value: number | number[] }>;

function makeUniforms(length: number, ribs: number): Uniforms {
  return {
    uLength: { value: length },
    uRise: { value: 0.8 },
    uSpan: { value: 1 },
    uTwist: { value: 0.4 },
    uFold: { value: 0.4 },
    uClose: { value: 0.2 },
    uRibDepth: { value: 0.6 },
    uDensity: { value: 0.5 },
    uRibCount: { value: ribs },
    uSurface: { value: 1 },
    uPointer: { value: [0.5, 0] },
    uPointerAmt: { value: 0 },
  };
}

/** Pointer, in the surface's own t/v space. Approximate — see the host. */
function syncPointer(u: Uniforms, p: { x: number; y: number; amount: number }) {
  (u.uPointer.value as number[])[0] = p.x;
  (u.uPointer.value as number[])[1] = p.y;
  u.uPointerAmt.value = p.amount;
}

function syncUniforms(u: Uniforms, p: SculptParams) {
  u.uRise.value = p.rise;
  u.uSpan.value = p.span;
  u.uTwist.value = p.twist;
  u.uFold.value = p.fold;
  u.uClose.value = p.close;
  u.uRibDepth.value = p.ribDepth;
  u.uDensity.value = p.density;
  u.uSurface.value = Math.max(0.05, p.surface);
}

/**
 * Pushes one frame's worth of state into all three materials.
 *
 * A module-level function on purpose: react-three-fiber materials hold their
 * uniforms in plain objects that are mutated every frame, which is the entire
 * point of them, and the React compiler's immutability pass cannot tell the
 * difference between that and a render-time side effect it should be blocking.
 * Keeping the writes here — away from the component body, where the rule can
 * see them — says the same thing without a suppression comment.
 */
function pushFrame(
  shellU: Uniforms,
  ribU: Uniforms,
  latticeU: Uniforms,
  p: SculptParams,
  q: { x: number; y: number; amount: number },
) {
  syncUniforms(shellU, p);
  syncUniforms(ribU, p);
  // The lattice is the one layer whose strength is not its own parameter: it
  // rides the cycle's lattice term, opened up a little so it still reads at the
  // settings where the surface is dominant.
  latticeU.uSurface.value = Math.max(0, Math.min(1, p.lattice * 1.1));
  syncPointer(shellU, q);
  syncPointer(ribU, q);
  syncPointer(latticeU, q);
}

type Variant = "shell" | "rib" | "lattice";

/**
 * A standard PBR material with the surface function spliced into the vertex
 * stage.
 *
 * three's own lighting is kept rather than hand-rolled: the brief asks for
 * architectural light on a matte material, and a physical material under an
 * environment map is what produces that. Only position and normal are replaced.
 */
function useVaultMaterial(uniforms: Uniforms, variant: Variant) {
  const material = useMemo(() => {
    const opaque = variant === "rib";
    const m = new MeshStandardMaterial({
      color: new Color(variant === "shell" ? "#e9e5db" : variant === "rib" ? "#d4cec0" : "#bfb9a9"),
      roughness: variant === "shell" ? 0.74 : variant === "rib" ? 0.92 : 0.58,
      metalness: 0.02,
      /* The membrane is only ever seen from outside; letting its back faces
         through means two layers of it blend over each other and the skin
         goes milky. FrontSide keeps it one thin film. The ribs are solid and
         stay two-sided, because the open ends of the vault look straight into
         them. */
      side: opaque ? DoubleSide : FrontSide,
      envMapIntensity: variant === "shell" ? 1 : 0.85,
      transparent: !opaque,
      depthWrite: opaque,
      /* No alphaTest on the translucent layers. A hard cut applied to a smooth
         alpha gradient does not fade an object out, it dithers it: at the
         settings where the membrane is meant to be nearly gone the surviving
         fragments come out as a field of loose splinters, which reads as a
         broken mesh rather than a thin skin. Smooth alpha, no cut. */
      alphaTest: 0,
      opacity: 1,
    });

    m.onBeforeCompile = (shader) => {
      Object.assign(shader.uniforms, uniforms);

      /* `objectNormal` is normally declared by the chunk we are replacing, so
         replacing that chunk outright deletes the declaration too — every later
         chunk (`morphnormal_vertex`, `defaultnormal_vertex`) still expects it to
         exist. Declare it here rather than reassigning. */
      const body =
        variant === "shell"
          ? /* glsl */ `
            vec3 gP, gN, gT, gB;
            vaultAt(vec2(position.x, position.z), gP, gN, gT, gB);
            vec3 objectNormal = gN;
          `
          : variant === "rib"
            ? /* glsl */ `
            vec3 gP, gN, gT, gB;
            vaultAt(vec2(position.x, position.y * 2.0 - 1.0), gP, gN, gT, gB);
            vec3 gDir = normalize(gT);
            float prom = ribProm(position.x);
            // The rib stands proud of the membrane it supports, so it is the
            // thing casting the bays. It has to be taller than it is wide or the
            // form goes back to being a pillow with stripes painted on it.
            gP += gN * (uRibDepth * prom * 0.44 * (1.0 - abs(position.z) * 0.30));
            gP += gDir * (position.z * 0.034);
            vec3 objectNormal = normalize(
              gN * (1.0 - abs(position.z) * 0.55) + gDir * (position.z * 0.85)
            );
          `
            : /* glsl */ `
            vec3 gP, gN, gT, gB;
            vaultAt(vec2(position.x, position.z * 2.0 - 1.0), gP, gN, gT, gB);
            vec3 gDir = normalize(gB);
            /* Under, not through. A longitudinal tie pushed outwards punches
               through the membrane between two ribs and reads as a rendering
               artefact; carried just inside the shell it reads as what it is —
               the thing holding the bays open. */
            gP -= gN * (0.085 + uRibDepth * 0.10);
            gP += gDir * (position.y * 0.05);
            /* Facing outward, like the membrane. A tie whose normal points along
               the section rather than away from the shell turns edge-on to every
               light in the scene and renders as a dark wire — the structure ends
               up looking like stray cabling instead of the thing holding the
               bays open. */
            vec3 objectNormal = normalize(gN + gDir * position.y * 0.45);
          `;

      shader.vertexShader =
        VAULT_GLSL +
        shader.vertexShader
          .replace("#include <beginnormal_vertex>", body)
          .replace("#include <begin_vertex>", "vec3 transformed = gP;");

      if (!opaque) {
        shader.fragmentShader =
          "uniform float uSurface;\n" +
          shader.fragmentShader.replace(
            "#include <clipping_planes_fragment>",
            `#include <clipping_planes_fragment>\n diffuseColor.a *= uSurface;`,
          );
      }

      m.userData.shader = shader;
    };
    m.customProgramCacheKey = () => `vault-${variant}`;
    return m;
  }, [uniforms, variant]);

  useEffect(() => () => material.dispose(), [material]);
  return material;
}

/* ------------------------------------------------------------------ mesh */

function Vault({
  params,
  length,
  ribs,
  ribStations,
  members,
  memberStations,
  segT,
  segV,
  live,
  pointer,
}: {
  params: RefObject<SculptParams>;
  length: number;
  ribs: number;
  ribStations: number;
  members: number;
  memberStations: number;
  segT: number;
  segV: number;
  live: boolean;
  pointer: RefObject<{ x: number; y: number; amount: number }>;
}) {
  const shellGeo = useShellGeometry(segT, segV);
  const ribGeo = useMemberGeometry(ribs, ribStations, 0);
  const latticeGeo = useMemberGeometry(members, memberStations, 1);
  const invalidate = useThree((s) => s.invalidate);
  useEffect(
    () => () => {
      shellGeo.dispose();
      ribGeo.dispose();
      latticeGeo.dispose();
    },
    [latticeGeo, ribGeo, shellGeo],
  );

  const shellU = useMemo(() => makeUniforms(length, ribs), [length, ribs]);
  const ribU = useMemo(() => makeUniforms(length, ribs), [length, ribs]);
  const latticeU = useMemo(() => makeUniforms(length, ribs), [length, ribs]);
  const shellMat = useVaultMaterial(shellU, "shell");
  const ribMat = useVaultMaterial(ribU, "rib");
  const latticeMat = useVaultMaterial(latticeU, "lattice");
  const group = useRef<Group>(null);

  // Eleven numbers per frame, and only while the canvas is actually
  // rendering. Declared as a plain function rather than a memoised one: the
  // React compiler cannot preserve a memo over refs it cannot see, and
  // react-three-fiber keeps the callback in its own ref anyway, so identity
  // churn here is free.
  const push = () => {
    pushFrame(shellU, ribU, latticeU, params.current, pointer.current);
  };

  // …and once more on the frame the loop stops, so a paused or still scene
  // shows the settled state the host just wrote rather than whatever it was
  // carrying when the clock last ran.
  useFrame(push);
  useEffect(() => {
    invalidate();
  }, [invalidate, live]);

  useLayoutEffect(() => {
    if (group.current) group.current.rotation.set(0, -0.15, 0);
  }, []);

  return (
    <group ref={group} position={[0, -0.8, 0]}>
      <mesh geometry={ribGeo} material={ribMat} frustumCulled={false} />
      <mesh geometry={latticeGeo} material={latticeMat} frustumCulled={false} renderOrder={1} />
      <mesh geometry={shellGeo} material={shellMat} frustumCulled={false} renderOrder={2} />
    </group>
  );
}

/* ------------------------------------------------------------------ staging */

/**
 * A warm studio, generated rather than loaded.
 *
 * One small gradient through PMREM gives the matte surface something to reflect.
 * Without it the form reads as flat paper; with an HDR photograph it would drag a
 * coloured room into a page that is otherwise warm off-white and near-black.
 * This keeps the reflection inside the site's own palette.
 */
/**
 * Builds the environment texture and installs it. Module-level for the same
 * reason as `pushFrame`: assigning `scene.environment` is a WebGL side effect,
 * not render-time work, and the compiler should not have to be told the
 * difference on every line.
 */
function installStudio(scene: Scene, gl: WebGLRenderer) {
  const w = 48;
  const h = 24;
  const data = new Float32Array(w * h * 4);
  for (let y = 0; y < h; y++) {
    const t = y / (h - 1);
    const base = t < 0.42 ? 0.99 - 0.1 * (t / 0.42) : 0.89 - 0.42 * ((t - 0.42) / 0.58);
    for (let x = 0; x < w; x++) {
      // One soft key, high and to the left, so the form gets a single clear
      // light direction and one quiet shadow side.
      const dx = Math.min(1, Math.abs(x / w - 0.32) * 3.0);
      const key = 1 + 0.5 * (1 - dx) * (1 - t);
      const i = (y * w + x) * 4;
      data[i] = base * key;
      data[i + 1] = base * 0.99 * key;
      data[i + 2] = base * 0.95 * key;
      data[i + 3] = 1;
    }
  }
  const tex = new DataTexture(data, w, h, RGBAFormat, FloatType);
  tex.mapping = EquirectangularReflectionMapping;
  tex.minFilter = LinearFilter;
  tex.magFilter = LinearFilter;
  tex.needsUpdate = true;
  const pmrem = new PMREMGenerator(gl);
  const target = pmrem.fromEquirectangular(tex);
  scene.environment = target.texture;
  tex.dispose();
  pmrem.dispose();
  return () => {
    scene.environment = null;
    target.dispose();
  };
}

function StudioEnvironment() {
  const gl = useThree((s) => s.gl);
  const scene = useThree((s) => s.scene);
  useEffect(() => installStudio(scene, gl), [gl, scene]);
  return null;
}

/**
 * A soft contact shadow, drawn rather than rendered.
 *
 * A real shadow map on a scene lit this softly would cost a second render pass
 * every frame to produce a blur. A radial falloff under the footprint gives the
 * object somewhere to sit, which is the only job it ever had there.
 */
function ContactShadow({ width, depth }: { width: number; depth: number }) {
  const material = useMemo(() => {
    const n = 128;
    const data = new Uint8Array(n * n * 4);
    for (let y = 0; y < n; y++) {
      for (let x = 0; x < n; x++) {
        const dx = (x + 0.5) / n - 0.5;
        const dy = ((y + 0.5) / n - 0.5) * 1.9;
        const d = Math.sqrt(dx * dx + dy * dy) * 2;
        const a = Math.pow(Math.max(0, 1 - d), 2.1);
        const i = (y * n + x) * 4;
        data[i] = 0x78;
        data[i + 1] = 0x72;
        data[i + 2] = 0x67;
        data[i + 3] = Math.round(a * 255);
      }
    }
    const tex = new DataTexture(data, n, n, RGBAFormat);
    tex.minFilter = LinearFilter;
    tex.magFilter = LinearFilter;
    tex.needsUpdate = true;
    tex.colorSpace = SRGBColorSpace;
    return new MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false, opacity: 0.55 });
  }, []);
  useEffect(() => () => material.dispose(), [material]);
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.81, 0]} material={material}>
      <planeGeometry args={[width, depth]} />
    </mesh>
  );
}

/**
 * The camera does not move. The form is what moves, not the viewpoint.
 *
 * The distance is derived rather than dialled in: the vault's extents are known
 * (the spine is `length` long, the section can reach about a unit in every
 * other direction), so the camera backs off by exactly enough for the object to
 * sit inside the frame with a margin — at any aspect ratio. Hand-tuned distances
 * only ever look right at the aspect they were tuned at, and the practice scene
 * is a 1.25:1 column while the study is a 1.9:1 band.
 */
/* Kept close to head-on on purpose. The vault is five units long, so a wide
   azimuth puts the near end much closer to the camera than the far end: it
   projects larger and lower, and the silhouette's bounding box sits well below
   the point the camera is actually aimed at. Framing then has to be guessed at
   per scene and is wrong for whichever phase is on screen. */
const VIEW_DIR: [number, number, number] = [0.24, 0.3, 1];

function Framing({ distance, length }: { distance: number; length: number }) {
  const camera = useThree((s) => s.camera);
  const size = useThree((s) => s.size);
  useLayoutEffect(() => {
    const aspect = size.width / Math.max(size.height, 1);
    const tan = Math.tan(((camera as PerspectiveCamera).fov * Math.PI) / 360);
    // Half-extents of the vault at the most extreme settings the parameter space
    // reaches. The tall one comes from rise (up to ~1.55 absolute) times the 1.52
    // that makes the arch taller than it is wide; the rib push adds about 0.15.
    // Getting these wrong by a factor of two is what parks the object in the
    // middle of the frame like a stamp on an envelope.
    const halfW = length * 0.5 + 0.16;
    const halfH = 1.16;
    const halfD = 1.62;
    // The camera looks down at an angle, so the object's depth eats into the
    // vertical budget as well; without this the near end crops.
    const needV = (halfH + halfD * 0.25) / tan;
    const needH = halfW / (tan * Math.max(aspect, 0.55));
    const d = Math.max(needV, needH) * 1.02 + distance;

    const n = Math.hypot(VIEW_DIR[0], VIEW_DIR[1], VIEW_DIR[2]);
    camera.position.set((VIEW_DIR[0] / n) * d, (VIEW_DIR[1] / n) * d, (VIEW_DIR[2] / n) * d);
    /* Aimed near the ground plane, not at the object's middle. The middle is
       the wrong reference: perspective drops the silhouette's centre well below
       the geometric one, and aiming at the geometric centre is what parks the
       form against the bottom edge of the band with the top half empty. */
    camera.lookAt(0, 0.02, 0.18);
    camera.updateProjectionMatrix();
  }, [camera, distance, length, size.height, size.width]);
  return null;
}

/* ------------------------------------------------------------------ canvas */

export type SculptureTuning = {
  length: number;
  /** Extra pull-back on top of the framing the extents already ask for. */
  distance: number;
  ribs: number;
  ribStations: number;
  members: number;
  memberStations: number;
  segT: number;
  segV: number;
  /** Shadow footprint, in world units. */
  footprint: [number, number];
};

export const PRACTICE_TUNING: SculptureTuning = {
  length: 3.7,
  distance: 0.5,
  ribs: 13,
  ribStations: 26,
  members: 7,
  memberStations: 32,
  segT: 88,
  segV: 38,
  footprint: [7, 3.8],
};

export const STUDY_TUNING: SculptureTuning = {
  length: 5,
  distance: 0.55,
  ribs: 15,
  ribStations: 30,
  members: 9,
  memberStations: 42,
  segT: 120,
  segV: 48,
  footprint: [9, 4.6],
};

function World({
  tuning,
  params,
  live,
  pointer,
}: {
  tuning: SculptureTuning;
  params: RefObject<SculptParams>;
  live: boolean;
  pointer: RefObject<{ x: number; y: number; amount: number }>;
}) {
  return (
    <>
      <StudioEnvironment />
      <Framing distance={tuning.distance} length={tuning.length} />
      <hemisphereLight args={["#fcfaf4", "#bdb7a9", 0.55]} />
      <ambientLight intensity={0.5} color="#f6f3ec" />
      <directionalLight position={[-3.4, 4.4, 3.2]} intensity={2.5} color="#fff4e4" />
      <directionalLight position={[3.8, 0.9, -3.2]} intensity={0.55} color="#e3e7ef" />
      <ContactShadow width={tuning.footprint[0]} depth={tuning.footprint[1]} />
      <Vault
        params={params}
        length={tuning.length}
        ribs={tuning.ribs}
        ribStations={tuning.ribStations}
        members={tuning.members}
        memberStations={tuning.memberStations}
        segT={tuning.segT}
        segV={tuning.segV}
        live={live}
        pointer={pointer}
      />
    </>
  );
}

/**
 * The canvas itself. This module is only ever reached through
 * `next/dynamic({ ssr: false })`, which is what keeps three.js and
 * react-three-fiber out of the homepage's first paint entirely.
 */
export default function SculptureScene({
  tuning,
  params,
  live,
  pointer,
}: {
  tuning: SculptureTuning;
  params: RefObject<SculptParams>;
  live: boolean;
  pointer: RefObject<{ x: number; y: number; amount: number }>;
}) {
  return (
    <Canvas
      dpr={[1, 1.6]}
      frameloop={live ? "always" : "demand"}
      camera={{ position: [2, 2, 6], fov: 34, near: 0.1, far: 60 }}
      gl={{ antialias: true, alpha: true, powerPreference: "low-power" }}
    >
      <World tuning={tuning} params={params} live={live} pointer={pointer} />
    </Canvas>
  );
}
