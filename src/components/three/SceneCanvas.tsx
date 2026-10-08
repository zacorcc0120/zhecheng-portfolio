"use client";
import { Canvas, useFrame, useThree, useLoader } from "@react-three/fiber";
import { Suspense, useEffect, useLayoutEffect, useMemo, useRef } from "react";
import {
  Box3,
  BoxGeometry,
  Color,
  EdgesGeometry,
  Group,
  InstancedMesh,
  Object3D,
  Spherical,
  Vector3,
} from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { modelAssets } from "@/data/model-assets";
import { buildLattice, type LatticeParameters } from "@/lib/lattice";
import type { ArchitectureParameters } from "@/lib/architecture";
import type { CameraCommand, SceneSpec, TowerParameters } from "./types";

function Controls({
  autoRotate,
  command,
}: {
  autoRotate: boolean;
  command: CameraCommand;
}) {
  const { camera, gl, invalidate } = useThree();
  const ref = useRef<OrbitControls | null>(null);
  useEffect(() => {
    const controls = new OrbitControls(camera, gl.domElement);
    controls.enablePan = false;
    controls.enableZoom = false;
    controls.enableDamping = false;
    controls.minPolarAngle = 0.15;
    controls.maxPolarAngle = Math.PI * 0.8;
    controls.autoRotateSpeed = 0.4;
    controls.target.set(0, 0, 0);
    const onChange = () => invalidate();
    controls.addEventListener("change", onChange);
    controls.update();
    ref.current = controls;
    return () => {
      controls.removeEventListener("change", onChange);
      controls.dispose();
      ref.current = null;
    };
  }, [camera, gl, invalidate]);
  useEffect(() => {
    if (ref.current) {
      ref.current.autoRotate = autoRotate;
      invalidate();
    }
  }, [autoRotate, invalidate]);
  useEffect(() => {
    const controls = ref.current;
    if (!controls) return;
    const offset = camera.position.clone().sub(controls.target);
    const spherical = new Spherical().setFromVector3(offset);
    switch (command.action) {
      case "left":
        spherical.theta -= 0.25;
        break;
      case "right":
        spherical.theta += 0.25;
        break;
      case "up":
        spherical.phi = Math.max(0.15, spherical.phi - 0.18);
        break;
      case "down":
        spherical.phi = Math.min(Math.PI * 0.8, spherical.phi + 0.18);
        break;
      case "in":
        spherical.radius = Math.max(3.3, spherical.radius * 0.84);
        break;
      case "out":
        spherical.radius = Math.min(22, spherical.radius * 1.18);
        break;
      case "reset":
        spherical.setFromVector3(new Vector3(7, 5, 8));
        break;
    }
    camera.position.copy(
      new Vector3().setFromSpherical(spherical).add(controls.target),
    );
    controls.update();
    invalidate();
  }, [command, camera, invalidate]);
  useFrame((_, delta) => {
    if (ref.current?.autoRotate) ref.current.update(delta);
  });
  return null;
}

function Lattice({ parameters }: { parameters: LatticeParameters }) {
  const edges = useMemo(() => buildLattice(parameters), [parameters]);
  const ref = useRef<InstancedMesh>(null);
  const invalidate = useThree((state) => state.invalidate);
  useLayoutEffect(() => {
    const mesh = ref.current;
    if (!mesh) return;
    const obj = new Object3D();
    const up = new Vector3(0, 1, 0);
    const start = new Vector3();
    const end = new Vector3();
    const direction = new Vector3();
    for (let i = 0; i < edges.length; i++) {
      start.fromArray(edges[i][0]);
      end.fromArray(edges[i][1]);
      direction.subVectors(end, start);
      obj.position.copy(start).add(end).multiplyScalar(0.5);
      obj.quaternion.setFromUnitVectors(up, direction.clone().normalize());
      obj.scale.set(
        parameters.strutDiameter,
        direction.length(),
        parameters.strutDiameter,
      );
      obj.updateMatrix();
      mesh.setMatrixAt(i, obj.matrix);
      mesh.setColorAt(i, new Color(i % 9 === 0 ? "#858e6a" : "#3c4431"));
    }
    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
    mesh.computeBoundingSphere();
    invalidate();
  }, [edges, parameters.strutDiameter, invalidate]);
  return (
    <instancedMesh
      ref={ref}
      args={[undefined, undefined, edges.length]}
      frustumCulled={false}
    >
      <cylinderGeometry args={[0.5, 0.5, 1, 7]} />
      <meshStandardMaterial color="#667052" roughness={0.7} metalness={0.12} />
    </instancedMesh>
  );
}

function Building({
  x,
  z,
  width,
  depth,
  roofHeight,
}: {
  x: number;
  z: number;
  width: number;
  depth: number;
  roofHeight: number;
}) {
  const wallHeight = 0.85;
  const roofRise = (roofHeight - 2.2) * 0.25;
  const roof = useMemo(() => {
    const w = width / 2 + 0.13,
      d = depth / 2 + 0.13,
      y = wallHeight;
    return new Float32Array([
      -w,
      y,
      -d,
      w,
      y,
      -d,
      w,
      y + roofRise,
      0,
      -w,
      y,
      -d,
      w,
      y + roofRise,
      0,
      -w,
      y + roofRise,
      0,
      -w,
      y,
      d,
      w,
      y + roofRise,
      0,
      w,
      y,
      d,
      -w,
      y,
      d,
      -w,
      y + roofRise,
      0,
      w,
      y + roofRise,
      0,
      -w,
      y,
      -d,
      -w,
      y + roofRise,
      0,
      -w,
      y,
      d,
      w,
      y,
      -d,
      w,
      y,
      d,
      w,
      y + roofRise,
      0,
    ]);
  }, [width, depth, roofRise]);
  const outline = useMemo(() => {
    const box = new BoxGeometry(width, wallHeight, depth);
    const edges = new EdgesGeometry(box);
    box.dispose();
    return edges;
  }, [width, depth]);
  useEffect(() => () => outline.dispose(), [outline]);
  return (
    <group position={[x, -1.25, z]}>
      <mesh position={[0, wallHeight / 2, 0]}>
        <boxGeometry args={[width, wallHeight, depth]} />
        <meshStandardMaterial color="#c6c8b7" roughness={0.9} />
      </mesh>
      <lineSegments geometry={outline} position={[0, wallHeight / 2, 0]}>
        <lineBasicMaterial color="#737963" />
      </lineSegments>
      <mesh>
        <bufferGeometry
          onUpdate={(geometry) => geometry.computeVertexNormals()}
        >
          <bufferAttribute attach="attributes-position" args={[roof, 3]} />
        </bufferGeometry>
        <meshStandardMaterial color="#4e5541" roughness={0.85} side={2} />
      </mesh>
    </group>
  );
}

function Architecture({
  parameters: p,
}: {
  parameters: ArchitectureParameters;
}) {
  const width = p.bay * 0.78 + 0.35;
  const step = p.courtyard ? 1.65 + (p.courtyardSize - 1) * 0.19 : 1.02;
  const start = (-p.depth * step) / 2;
  return (
    <group rotation={[0, -0.22, 0]}>
      {Array.from({ length: p.depth + 1 }, (_, i) => (
        <Building
          key={`hall${i}`}
          x={0}
          z={start + i * step}
          width={width}
          depth={0.9}
          roofHeight={p.roofHeight}
        />
      ))}
      {p.courtyard &&
        Array.from({ length: p.depth }, (_, i) =>
          [-1, 1].map((side) => (
            <Building
              key={`wing${i}${side}`}
              x={side * (width / 2 - 0.29)}
              z={start + (i + 0.5) * step}
              width={0.6}
              depth={step - 0.8}
              roofHeight={p.roofHeight - 0.7}
            />
          )),
        )}
      {p.screenWall && (
        <mesh position={[0, -0.8, start - 0.82]}>
          <boxGeometry args={[width * 0.45, 0.85, 0.1]} />
          <meshStandardMaterial color="#8f987d" />
        </mesh>
      )}
      <mesh position={[0, -1.32, 0]}>
        <boxGeometry args={[width + 1, 0.12, (p.depth + 1) * step + 0.6]} />
        <meshStandardMaterial color="#d2d4c7" />
      </mesh>
    </group>
  );
}

function Tower({ parameters: p }: { parameters: TowerParameters }) {
  const tiers = Array.from({ length: p.floorCount }, (_, i) => i);
  const totalHeight = p.height * 0.52;
  const base = -totalHeight / 2;
  const spacing = totalHeight / p.floorCount;
  return (
    <group>
      {tiers.map((i) => {
        const radius = (2.0 - (i / p.floorCount) * 1.2) * p.roofScale;
        const y = base + (i + 0.55) * spacing;
        return (
          <group
            key={i}
            position={[0, y, 0]}
            rotation={[0, (i * p.rotation * Math.PI) / 180, 0]}
          >
            <mesh>
              <cylinderGeometry
                args={[radius * 0.5, radius, 0.38, 8, 1, false]}
              />
              <meshStandardMaterial
                color={i % 2 ? "#7d846e" : "#5d664e"}
                roughness={0.85}
              />
            </mesh>
            <mesh position={[0, 0.16, 0]}>
              <cylinderGeometry args={[radius * 0.48, radius * 0.5, 0.05, 8]} />
              <meshStandardMaterial color="#394330" />
            </mesh>
            {Array.from({ length: 8 }, (_, j) => {
              const angle = (j / 8) * Math.PI * 2;
              return (
                <mesh
                  key={j}
                  position={[
                    Math.cos(angle) * radius * 0.48,
                    -spacing / 2,
                    Math.sin(angle) * radius * 0.48,
                  ]}
                >
                  <cylinderGeometry args={[0.035, 0.035, spacing, 6]} />
                  <meshStandardMaterial color="#5a604d" />
                </mesh>
              );
            })}
          </group>
        );
      })}
      <mesh position={[0, base - 0.25, 0]}>
        <cylinderGeometry
          args={[2.25 * p.roofScale, 2.4 * p.roofScale, 0.2, 8]}
        />
        <meshStandardMaterial color="#c8cbbd" />
      </mesh>
    </group>
  );
}

function ExternalModel({ url }: { url: string }) {
  const gltf = useLoader(GLTFLoader, url);
  const model = useMemo(() => {
    const clone = gltf.scene.clone(true);
    const bounds = new Box3().setFromObject(clone);
    const size = bounds.getSize(new Vector3());
    const center = bounds.getCenter(new Vector3());
    const scale = 5 / Math.max(size.x, size.y, size.z, 0.001);
    clone.position.sub(center);
    const group = new Group();
    group.add(clone);
    group.scale.setScalar(scale);
    return group;
  }, [gltf]);
  return <primitive object={model} dispose={null} />;
}
function Model({ scene }: { scene: SceneSpec }) {
  const modelUrl =
    scene.kind === "lattice"
      ? modelAssets.lattice[scene.parameters.type]
      : modelAssets[scene.kind];
  const procedural =
    scene.kind === "lattice" ? (
      <Lattice parameters={scene.parameters} />
    ) : scene.kind === "architecture" ? (
      <Architecture parameters={scene.parameters} />
    ) : (
      <Tower parameters={scene.parameters} />
    );
  return modelUrl ? (
    <Suspense fallback={procedural}>
      <ExternalModel url={modelUrl} />
    </Suspense>
  ) : (
    procedural
  );
}

export default function SceneCanvas({
  scene,
  autoRotate,
  active,
  command,
}: {
  scene: SceneSpec;
  autoRotate: boolean;
  active: boolean;
  command: CameraCommand;
}) {
  return (
    <Canvas
      dpr={[1, 1.5]}
      frameloop={autoRotate && active ? "always" : "demand"}
      camera={{ position: [7, 5, 8], fov: 35, near: 0.1, far: 100 }}
      gl={{ antialias: true, alpha: true, powerPreference: "low-power" }}
      fallback={<p className="caption">3D unavailable — WebGL is required.</p>}
    >
      <ambientLight intensity={1.7} />
      <directionalLight position={[5, 8, 4]} intensity={3} />
      <directionalLight position={[-3, 2, -4]} intensity={1} />
      <Model scene={scene} />
      <gridHelper
        args={[14, 28, "#b5bba8", "#ccd0c0"]}
        position={[0, -3.4, 0]}
      />
      <Controls autoRotate={autoRotate} command={command} />
    </Canvas>
  );
}
