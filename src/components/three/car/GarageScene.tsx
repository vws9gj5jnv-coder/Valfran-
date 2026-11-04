'use client';

import * as THREE from 'three';
import { useEffect, useMemo, useRef } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Environment, Lightformer, ContactShadows, Html } from '@react-three/drei';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';
import { buildCar, makeCarMaterials, ZONES, type ZoneId } from './buildCar';
import { poseEngine } from '../engine/EngineScene';
import { CAR } from './carGeometry';

const HOME = { camera: new THREE.Vector3(4.7, 1.65, 4.1), target: new THREE.Vector3(0, 0.6, 0) };

function Studio({ quality }: { quality: 'high' | 'medium' }) {
  const mats = useMemo(() => makeCarMaterials(), []);
  return (
    <>
      <color attach="background" args={['#141518']} />
      <fog attach="fog" args={['#141518', 10, 22]} />
      {/* Sol béton technique */}
      <mesh rotation-x={-Math.PI / 2} receiveShadow>
        <circleGeometry args={[18, 64]} />
        <primitive object={mats.floor} attach="material" />
      </mesh>
      {/* Cyclorama sombre */}
      <mesh position={[0, 4, 0]}>
        <cylinderGeometry args={[14, 14, 8, 64, 1, true]} />
        <meshStandardMaterial color="#24252a" roughness={0.95} side={THREE.BackSide} />
      </mesh>
      {/* Rampes lumineuses architecturales visibles */}
      {[-2.4, 0, 2.4].map((z) => (
        <mesh key={z} position={[0, 5.2, z]} rotation-x={Math.PI / 2}>
          <planeGeometry args={[7, 0.12]} />
          <meshBasicMaterial color="#f3efe6" toneMapped={false} />
        </mesh>
      ))}
      <Environment resolution={quality === 'high' ? 512 : 256} frames={1}>
        <color attach="background" args={['#0e0f12']} />
        <Lightformer form="rect" intensity={5} color="#ffffff" position={[0, 5, 0]} rotation-x={Math.PI / 2} scale={[9, 2.2, 1]} />
        <Lightformer form="rect" intensity={3} color="#f6f1e8" position={[0, 4.5, 2.6]} rotation-x={Math.PI / 2} scale={[8, 0.5, 1]} />
        <Lightformer form="rect" intensity={3} color="#f6f1e8" position={[0, 4.5, -2.6]} rotation-x={Math.PI / 2} scale={[8, 0.5, 1]} />
        <Lightformer form="rect" intensity={2.2} color="#e9dfd0" position={[-7, 1.6, 0]} rotation-y={Math.PI / 2} scale={[10, 1.2, 1]} />
        <Lightformer form="rect" intensity={1.8} color="#d7dce4" position={[7, 2.2, 0]} rotation-y={-Math.PI / 2} scale={[10, 2, 1]} />
        <Lightformer form="ring" intensity={0.5} color="#b19776" position={[0, 1.5, -8]} scale={4} />
      </Environment>
      <directionalLight position={[3, 7, 4]} intensity={1.6} />
      <directionalLight position={[-5, 3, -3]} intensity={0.6} color="#d9cbb5" />
      <ambientLight intensity={0.15} />
      <ContactShadows position={[0, 0.002, 0]} opacity={0.82} scale={9} blur={2.2} far={1.6} resolution={quality === 'high' ? 1024 : 512} frames={1} color="#000000" />
    </>
  );
}

function Car({ selected, onReady, still }: { selected: ZoneId | null; onReady: () => void; still: boolean }) {
  const mats = useMemo(() => makeCarMaterials(), []);
  const car = useMemo(() => buildCar(mats), [mats]);
  const t = useRef(0);
  const { invalidate } = useThree();
  const ready = useRef(false);

  // Matériaux « radiographie » : carrosserie translucide quand une zone est sélectionnée
  useEffect(() => {
    const xray = selected !== null;
    for (const m of [mats.paint, mats.glass, mats.gloss]) {
      m.transparent = xray || m === mats.glass;
      m.opacity = xray ? (m === mats.glass ? 0.12 : 0.16) : m === mats.glass ? 0.86 : 1;
      m.depthWrite = !xray && m !== mats.glass;
      m.needsUpdate = true;
    }
    const wheelsXray = selected === 'freinage' || selected === 'suspension' || selected === 'direction';
    for (const w of car.wheels) for (const mesh of [w.tire, w.face, w.lip, w.barrel, w.hub]) {
      const mat = (mesh.material as THREE.Material).clone() as THREE.MeshStandardMaterial;
      mat.transparent = wheelsXray; mat.opacity = wheelsXray ? 0.14 : 1; mat.depthWrite = !wheelsXray;
      mesh.material = mat;
    }
    // Mise en évidence des organes de la zone
    car.root.traverse((o) => { if ((o as THREE.Mesh).isMesh && o.userData.origMat) { (o as THREE.Mesh).material = o.userData.origMat; delete o.userData.origMat; } });
    if (selected) for (const g of car.subsystems[selected]) g.traverse((o) => {
      const mesh = o as THREE.Mesh;
      if (!mesh.isMesh || mesh === undefined) return;
      if (selected === 'pneumatiques') return; // le pneu reste noir : on anime la roue
      mesh.userData.origMat = mesh.material;
      mesh.material = mats.highlight;
    });
    invalidate();
  }, [selected, car, mats, invalidate]);

  useFrame((_, dt) => {
    if (!ready.current) { ready.current = true; onReady(); }
    if (!selected || still) return;
    t.current += Math.min(dt, 1 / 20);
    const time = t.current;
    mats.highlight.emissiveIntensity = 0.35 + 0.25 * (0.5 + 0.5 * Math.sin(time * 2.4));
    if (selected === 'moteur') poseEngine(car.engine, 0.6 + time * 2.2);
    if (selected === 'freinage' || selected === 'pneumatiques') for (const w of car.wheels) w.spin.rotation.z = -time * (selected === 'freinage' ? 1.2 * Math.max(0, 1 - (time % 4) / 3) * 3 : 1.6);
    if (selected === 'direction') { const a = Math.sin(time * 1.2) * 0.22; for (const w of car.wheels) if (w.front) w.group.rotation.y = a; }
    if (selected === 'suspension') car.bodyGroup.position.y = -0.025 * (0.5 + 0.5 * Math.sin(time * 2.2));
    invalidate();
  });

  useEffect(() => {
    if (selected !== 'direction') for (const w of car.wheels) w.group.rotation.y = 0;
    if (selected !== 'suspension') car.bodyGroup.position.y = 0;
    invalidate();
  }, [selected, car, invalidate]);

  return <primitive object={car.root} />;
}

function Hotspots({ selected, onSelect }: { selected: ZoneId | null; onSelect: (z: ZoneId | null) => void }) {
  const { camera } = useThree();
  const refs = useRef<Record<string, HTMLButtonElement | null>>({});
  const v = useMemo(() => new THREE.Vector3(), []);
  useFrame(() => {
    for (const [id, z] of Object.entries(ZONES)) {
      const el = refs.current[id];
      if (!el) continue;
      v.set(...z.anchor);
      const toCam = camera.position.clone().sub(v).normalize();
      const n = new THREE.Vector3(...z.normal).normalize();
      const visible = toCam.dot(n) > 0.05 || selected === id;
      el.style.opacity = visible ? '1' : '0';
      el.style.pointerEvents = visible ? 'auto' : 'none';
      el.tabIndex = visible ? 0 : -1;
    }
  });
  return (
    <>
      {(Object.keys(ZONES) as ZoneId[]).map((id, i) => (
        <Html key={id} position={ZONES[id].anchor} center zIndexRange={[20, 10]}>
          <button
            ref={(el) => { refs.current[id] = el; }}
            type="button"
            onClick={() => onSelect(selected === id ? null : id)}
            aria-pressed={selected === id}
            aria-label={`${ZONES[id].label} : voir les interventions`}
            className={`group flex items-center gap-2 whitespace-nowrap rounded-full border px-1 py-1 pr-3 text-[0.8125rem] font-semibold transition-[opacity,background-color] duration-300 ${selected === id ? 'border-champagne bg-champagne text-graphite' : 'border-paper/30 bg-graphite/70 text-paper hover:bg-graphite'}`}
          >
            <span className={`flex size-6 items-center justify-center rounded-full text-[0.75rem] tabular-nums ${selected === id ? 'bg-graphite text-paper' : 'bg-paper text-graphite'}`}>{i + 1}</span>
            {ZONES[id].label}
          </button>
        </Html>
      ))}
    </>
  );
}

/** Caméra : déplacements doux vers les cadrages de zone ; l'utilisateur garde la main à tout moment. */
function CameraRig({ selected, controls, posterMode }: { selected: ZoneId | null; controls: React.RefObject<OrbitControlsImpl | null>; posterMode: boolean }) {
  const { camera, invalidate } = useThree();
  const flying = useRef(true);
  const dest = useRef({ cam: HOME.camera.clone(), target: HOME.target.clone() });
  useEffect(() => {
    const z = selected ? ZONES[selected] : null;
    dest.current = z ? { cam: new THREE.Vector3(...z.camera), target: new THREE.Vector3(...z.target) } : { cam: HOME.camera.clone(), target: HOME.target.clone() };
    flying.current = true;
    if (posterMode) {
      const cam = new URLSearchParams(window.location.search).get('cam');
      if (cam && !selected) dest.current.cam = new THREE.Vector3(...cam.split(',').map(Number));
      camera.position.copy(dest.current.cam); controls.current?.target.copy(dest.current.target); controls.current?.update();
    }
    invalidate();
  }, [selected, camera, controls, invalidate, posterMode]);
  useEffect(() => {
    const c = controls.current;
    if (!c) return;
    const stop = () => { flying.current = false; };
    c.addEventListener('start', stop);
    return () => c.removeEventListener('start', stop);
  }, [controls]);
  useFrame((_, dt) => {
    const c = controls.current;
    if (!c || !flying.current) return;
    const k = 1 - Math.pow(0.0025, Math.min(dt, 0.05));
    camera.position.lerp(dest.current.cam, k);
    c.target.lerp(dest.current.target, k);
    c.update();
    if (camera.position.distanceTo(dest.current.cam) < 0.01) flying.current = false;
    invalidate();
  });
  return null;
}

export default function GarageCanvas({ selected, onSelect, onReady, onError, quality, posterMode }: {
  selected: ZoneId | null; onSelect: (z: ZoneId | null) => void; onReady: () => void; onError: () => void; quality: 'high' | 'medium'; posterMode: boolean;
}) {
  const controls = useRef<OrbitControlsImpl | null>(null);
  return (
    <Canvas
      frameloop="demand"
      dpr={quality === 'high' ? [1, 1.6] : [1, 1.2]}
      gl={{ antialias: true, powerPreference: 'high-performance', preserveDrawingBuffer: posterMode, toneMapping: THREE.NeutralToneMapping, toneMappingExposure: 1.0 }}
      camera={{ fov: 32, near: 0.1, far: 60, position: HOME.camera.toArray() }}
      onCreated={({ gl }) => gl.domElement.addEventListener('webglcontextlost', (e) => { e.preventDefault(); onError(); }, { once: true })}
    >
      <Studio quality={quality} />
      <Car selected={selected} onReady={onReady} still={posterMode} />
      {!posterMode && <Hotspots selected={selected} onSelect={onSelect} />}
      <OrbitControls
        ref={controls}
        target={HOME.target.toArray()}
        enablePan={false}
        enableDamping
        dampingFactor={0.08}
        minDistance={3.1}
        maxDistance={9}
        minPolarAngle={0.25}
        maxPolarAngle={1.47}
        rotateSpeed={0.55}
        zoomSpeed={0.6}
      />
      <CameraRig selected={selected} controls={controls} posterMode={posterMode} />
      <mesh visible={false} position={[0, CAR.wheelY, 0]}><boxGeometry args={[0.01, 0.01, 0.01]} /></mesh>
    </Canvas>
  );
}
