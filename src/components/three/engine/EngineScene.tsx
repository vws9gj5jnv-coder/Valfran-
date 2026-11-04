'use client';

import * as THREE from 'three';
import { useEffect, useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import {
  DIM, camRadius, sliderCrank, cylinderX, crankWebGeometry, rodGeometry, pistonGeometry, valveGeometry, springGeometry,
  camLobeGeometry, pulleyGeometry, pulleyWebGeometry, beltGeometry, blockGeometry, headGeometry, coverGeometry, oilPanGeometry,
  gasketGeometry, flywheelGeometry, sparkPlugGeometry,
} from './geometry';

/* ------------------------------------------------------------------ */
/* Chronologie (secondes)                                              */
/* ------------------------------------------------------------------ */
export const T_ASSEMBLED = 6.6;
const RUN_SECONDS = 26;
const OMEGA = Math.PI * 2 * 0.32; // 0,32 tr/s : mouvement lent et lisible

type Step = { from: [number, number, number]; t0: number; t1: number };
const STEPS = {
  crank: { from: [0, -1.0, 0], t0: 0.6, t1: 2.0 },
  flywheel: { from: [1.0, -1.0, 0], t0: 0.9, t1: 2.4 },
  pan: { from: [0, -1.8, 0], t0: 2.0, t1: 3.3 },
  pistons: { from: [0, 1.25, 0], t0: 1.3, t1: 3.0 },
  gasket: { from: [0, 1.45, 0], t0: 2.6, t1: 3.6 },
  head: { from: [0, 1.6, 0], t0: 2.9, t1: 4.1 },
  valves: { from: [0, 2.2, 0], t0: 3.3, t1: 4.5 },
  cams: { from: [0, 2.6, 0], t0: 3.7, t1: 4.9 },
  cover: { from: [0, 3.0, 0], t0: 4.3, t1: 5.5 },
  plugs: { from: [0, 3.5, 0], t0: 4.6, t1: 5.7 },
  timing: { from: [-1.0, 0, 0], t0: 4.9, t1: 6.1 },
  intake: { from: [0, 0, 1.1], t0: 5.2, t1: 6.4 },
  exhaust: { from: [0, 0, -1.1], t0: 5.3, t1: 6.5 },
} satisfies Record<string, Step>;

/** Levée maximale : admission ~105° après le PMH, échappement ~105° avant. */
const PEAK = (105 * Math.PI) / 180;

const easeInOut = (x: number) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);
const clamp01 = (x: number) => Math.min(1, Math.max(0, x));
const progress = (s: Step, t: number) => easeInOut(clamp01((t - s.t0) / (s.t1 - s.t0)));

/** Angle de vilebrequin cumulé à l'instant t (accélération et décélération douces). */
function crankAngleAt(t: number) {
  const base = 0.55;
  const ramp = 1.6;
  const t0 = T_ASSEMBLED;
  const t1 = T_ASSEMBLED + RUN_SECONDS;
  if (t <= t0) return base;
  // Intégrale d'une vitesse trapézoïdale
  const up = Math.min(t, t0 + ramp) - t0;
  let a = base + (OMEGA * up * up) / (2 * ramp);
  if (t > t0 + ramp) a += OMEGA * (Math.min(t, t1 - ramp) - (t0 + ramp));
  if (t > t1 - ramp) {
    const d = Math.min(t, t1) - (t1 - ramp);
    a += OMEGA * d - (OMEGA * d * d) / (2 * ramp);
  }
  return a;
}
export const ENGINE_DURATION = T_ASSEMBLED + RUN_SECONDS;

/* ------------------------------------------------------------------ */
/* Matériaux                                                           */
/* ------------------------------------------------------------------ */
function noiseTexture(size = 128, amp = 0.18) {
  const data = new Uint8Array(size * size * 4);
  let seed = 7;
  const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
  for (let i = 0; i < size * size; i++) {
    const v = 255 * (1 - amp + amp * rnd());
    data[i * 4] = data[i * 4 + 1] = data[i * 4 + 2] = v;
    data[i * 4 + 3] = 255;
  }
  const tex = new THREE.DataTexture(data, size, size);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(3, 3);
  tex.needsUpdate = true;
  return tex;
}

export function makeMaterials() {
  const grain = noiseTexture();
  const steel = new THREE.MeshPhysicalMaterial({ color: '#8b8f95', metalness: 1, roughness: 0.34, roughnessMap: grain });
  const polished = new THREE.MeshPhysicalMaterial({ color: '#b7babf', metalness: 1, roughness: 0.2, roughnessMap: grain });
  const forged = new THREE.MeshPhysicalMaterial({ color: '#6d7177', metalness: 1, roughness: 0.42, roughnessMap: grain });
  const alu = new THREE.MeshPhysicalMaterial({ color: '#9da1a7', metalness: 1, roughness: 0.48, roughnessMap: grain });
  const castAlu = new THREE.MeshPhysicalMaterial({ color: '#8f9399', metalness: 0.9, roughness: 0.58, roughnessMap: grain });
  const castIron = new THREE.MeshPhysicalMaterial({ color: '#4d4a47', metalness: 0.75, roughness: 0.62, roughnessMap: grain });
  const dark = new THREE.MeshPhysicalMaterial({ color: '#2e3136', metalness: 0.8, roughness: 0.4 });
  const spring = new THREE.MeshPhysicalMaterial({ color: '#2b2d31', metalness: 0.9, roughness: 0.36 });
  const rubber = new THREE.MeshPhysicalMaterial({ color: '#17181b', metalness: 0, roughness: 0.82 });
  const ceramic = new THREE.MeshPhysicalMaterial({ color: '#efede6', metalness: 0, roughness: 0.28, clearcoat: 0.6, clearcoatRoughness: 0.2 });
  const champagne = new THREE.MeshPhysicalMaterial({ color: '#b19776', metalness: 1, roughness: 0.3 });
  const ghost = new THREE.MeshPhysicalMaterial({ color: '#c3c8cf', metalness: 0.1, roughness: 0.2, transparent: true, opacity: 0.06, depthWrite: false, side: THREE.DoubleSide });
  const edge = new THREE.LineBasicMaterial({ color: '#c9cacd', transparent: true, opacity: 0.34, depthWrite: false });
  const construction = new THREE.LineDashedMaterial({ color: '#b19776', dashSize: 0.16, gapSize: 0.08, transparent: true, opacity: 0, depthWrite: false });
  // Collecteurs : matériaux propres, fondus à l'entrée (ils n'encombrent pas la vue éclatée).
  const intakeMat = castAlu.clone();
  const exhaustMat = castIron.clone();
  return { steel, polished, forged, alu, castAlu, castIron, dark, spring, rubber, ceramic, champagne, ghost, edge, construction, intakeMat, exhaustMat };
}
type Mats = ReturnType<typeof makeMaterials>;

function mesh(geo: THREE.BufferGeometry, mat: THREE.Material, pos?: [number, number, number], cast = true) {
  const m = new THREE.Mesh(geo, mat);
  if (pos) m.position.set(...pos);
  m.castShadow = cast;
  m.receiveShadow = true;
  return m;
}

function ghostPart(geo: THREE.BufferGeometry, mats: Mats, threshold = 22) {
  const g = new THREE.Group();
  const m = new THREE.Mesh(geo, mats.ghost);
  m.renderOrder = 2;
  const e = new THREE.LineSegments(new THREE.EdgesGeometry(geo, threshold), mats.edge);
  e.renderOrder = 3;
  g.add(m, e);
  return g;
}

/* ------------------------------------------------------------------ */
/* Construction du moteur                                              */
/* ------------------------------------------------------------------ */
export function buildEngine(mats: Mats) {
  const root = new THREE.Group();
  const parts: Record<keyof typeof STEPS, THREE.Group> = Object.fromEntries(Object.keys(STEPS).map((k) => [k, new THREE.Group()])) as never;
  Object.values(parts).forEach((p) => root.add(p));

  // Vilebrequin
  const crank = new THREE.Group();
  const mains = [-1.8, -0.9, 0, 0.9, 1.8];
  for (const x of mains) crank.add(mesh(cylinderX(0.2, 0.3), mats.polished, [x, 0, 0]));
  const web = crankWebGeometry();
  DIM.cylX.forEach((xc, i) => {
    const pin = new THREE.Group();
    pin.rotation.x = DIM.pinPhase[i];
    pin.add(mesh(cylinderX(0.18, 0.24), mats.polished, [xc, DIM.crankR, 0]));
    pin.add(mesh(web, mats.forged, [xc - 0.205, 0, 0]));
    pin.add(mesh(web, mats.forged, [xc + 0.205, 0, 0]));
    crank.add(pin);
  });
  crank.add(mesh(cylinderX(0.14, 0.42), mats.polished, [-2.1, 0, 0]));
  crank.add(mesh(cylinderX(0.3, 0.12), mats.forged, [2.05, 0, 0]));
  parts.crank.add(crank);

  // Volant moteur + couronne dentée (instanciée)
  const fly = new THREE.Group();
  fly.add(mesh(flywheelGeometry(), mats.steel, [DIM.rearX + 0.02, 0, 0]));
  const tooth = new THREE.BoxGeometry(0.1, 0.04, 0.028);
  const teeth = new THREE.InstancedMesh(tooth, mats.forged, 120);
  const mtx = new THREE.Matrix4();
  for (let i = 0; i < 120; i++) {
    const a = (i / 120) * Math.PI * 2;
    mtx.makeRotationX(a);
    mtx.setPosition(DIM.rearX + 0.02, Math.cos(a) * 1.1, Math.sin(a) * 1.1);
    teeth.setMatrixAt(i, mtx);
  }
  teeth.castShadow = true;
  fly.add(teeth);
  parts.flywheel.add(fly);

  // Pistons et bielles
  const pistonGeo = pistonGeometry();
  const rodGeo = rodGeometry();
  const boltGeo = new THREE.CylinderGeometry(0.03, 0.03, 0.3, 12);
  const wristGeo = cylinderX(0.066, 0.74);
  const pistons: THREE.Group[] = [];
  const rods: THREE.Group[] = [];
  DIM.cylX.forEach((xc) => {
    const p = new THREE.Group();
    p.add(mesh(pistonGeo, mats.alu));
    p.add(mesh(wristGeo, mats.polished));
    p.position.x = xc;
    const r = new THREE.Group();
    r.add(mesh(rodGeo, mats.forged));
    r.add(mesh(boltGeo, mats.dark, [0, -0.08, 0.235]));
    r.add(mesh(boltGeo, mats.dark, [0, -0.08, -0.235]));
    r.position.x = xc;
    parts.pistons.add(p, r);
    pistons.push(p);
    rods.push(r);
  });

  // Carter-cylindres, chemises, carter d'huile, joint
  parts.crank.parent?.add(ghostPart(blockGeometry(), mats));
  for (const xc of DIM.cylX) {
    const liner = new THREE.CylinderGeometry(DIM.bore / 2 + 0.01, DIM.bore / 2 + 0.01, DIM.deckY - 0.95, 48, 1, true);
    liner.translate(xc, (DIM.deckY + 0.95) / 2, 0);
    root.add(ghostPart(liner, mats, 30));
  }
  parts.pan.add(ghostPart(oilPanGeometry(), mats));
  parts.gasket.add(mesh(gasketGeometry(), mats.dark, undefined, false));

  // Culasse
  parts.head.add(ghostPart(headGeometry(), mats));

  // Soupapes (16), ressorts, poussoirs
  const seatToCam = Math.hypot(DIM.camY - DIM.valveSeatY, DIM.camZ - DIM.valveSeatZ);
  const valveLen = seatToCam - DIM.camBase;
  const vGeo = valveGeometry(valveLen - 0.13);
  const springGeo = springGeometry(0.26, valveLen - 0.15, 0.085, 6.5);
  const bucketGeo = new THREE.CylinderGeometry(0.13, 0.13, 0.13, 36);
  bucketGeo.translate(0, valveLen - 0.065, 0);
  const valves: { obj: THREE.Group; side: 1 | -1; axis: THREE.Vector3; base: THREE.Vector3; lambda: number }[] = [];
  const gamma = Math.atan2(DIM.camZ - DIM.valveSeatZ, DIM.camY - DIM.valveSeatY); // inclinaison des soupapes
  DIM.cylX.forEach((xc, ci) => {
    for (const side of [1, -1] as const) {
      for (const dx of [-DIM.valveDX, DIM.valveDX]) {
        const v = new THREE.Group();
        v.add(mesh(vGeo, side === 1 ? mats.steel : mats.castIron));
        v.add(mesh(springGeo, mats.spring));
        v.add(mesh(bucketGeo, mats.polished));
        v.position.set(xc + dx, DIM.valveSeatY, side * DIM.valveSeatZ);
        v.rotation.x = side * gamma;
        const axis = new THREE.Vector3(0, 1, 0).applyAxisAngle(new THREE.Vector3(1, 0, 0), side * gamma);
        parts.valves.add(v);
        const off = (DIM.cycleOffsetDeg[ci] * Math.PI) / 180;
        const peak = side === 1 ? off + PEAK : off - PEAK;
        valves.push({ obj: v, side, axis, base: v.position.clone(), lambda: side * gamma - peak / 2 });
      }
    }
  });

  // Arbres à cames (admission côté +Z, échappement côté -Z)
  const lobeGeo = camLobeGeometry();
  const cams: { group: THREE.Group; side: 1 | -1 }[] = [];
  for (const side of [1, -1] as const) {
    const g = new THREE.Group();
    g.position.set(0, DIM.camY, side * DIM.camZ);
    g.add(mesh(cylinderX(0.1, 4.3), mats.polished, [-0.1, 0, 0]));
    DIM.cylX.forEach((xc, ci) => {
      const off = (DIM.cycleOffsetDeg[ci] * Math.PI) / 180;
      const peak = side === 1 ? off + PEAK : off - PEAK;
      for (const dx of [-DIM.valveDX, DIM.valveDX]) {
        const lobe = mesh(lobeGeo, mats.polished, [xc + dx, 0, 0]);
        // Sommet de came orienté vers la soupape lorsque le vilebrequin atteint l'angle de levée maximale.
        lobe.rotation.x = side * gamma - peak / 2;
        g.add(lobe);
      }
    });
    // Poulie d'arbre à cames (diamètre double de celle du vilebrequin : rapport 2:1)
    g.add(mesh(pulleyGeometry(DIM.camPulleyR, 0.2, 38), mats.dark, [DIM.frontX, 0, 0]));
    g.add(mesh(pulleyWebGeometry(DIM.camPulleyR, 0.08), mats.champagne, [DIM.frontX - 0.13, 0, 0]));
    parts.cams.add(g);
    cams.push({ group: g, side });
  }

  // Couvre-culasse
  parts.cover.add(ghostPart(coverGeometry(), mats));

  // Bougies
  const plugGeo = sparkPlugGeometry();
  for (const xc of DIM.cylX) parts.plugs.add(mesh(plugGeo, mats.ceramic, [xc, 2.55, 0]));

  // Distribution : poulie de vilebrequin, galet tendeur, courroie
  const timing = new THREE.Group();
  const crankPulley = new THREE.Group();
  crankPulley.add(mesh(pulleyGeometry(DIM.crankPulleyR, 0.2, 19), mats.dark, [DIM.frontX, 0, 0]));
  timing.add(crankPulley);
  const idler = { z: 0.47, y: 1.45, r: 0.12 };
  timing.add(mesh(cylinderX(idler.r, 0.2), mats.polished, [DIM.frontX, idler.y, idler.z]));
  const belt = beltGeometry([
    { z: 0, y: 0, r: DIM.crankPulleyR },
    { z: idler.z, y: idler.y, r: idler.r },
    { z: DIM.camZ, y: DIM.camY, r: DIM.camPulleyR },
    { z: -DIM.camZ, y: DIM.camY, r: DIM.camPulleyR },
  ], 0.18);
  timing.add(mesh(belt, mats.rubber, [DIM.frontX, 0, 0]));
  parts.timing.add(timing);

  // Admission (côté +Z, plénum au-dessus) et échappement (côté -Z)
  const runnerR = 0.085;
  for (const xc of DIM.cylX) {
    const c = new THREE.CatmullRomCurve3([
      new THREE.Vector3(xc, 2.62, 0.74), new THREE.Vector3(xc, 2.74, 0.98), new THREE.Vector3(xc, 3.1, 1.1), new THREE.Vector3(xc, 3.42, 1.02),
    ]);
    parts.intake.add(mesh(new THREE.TubeGeometry(c, 40, runnerR, 20), mats.intakeMat));
    const e = new THREE.CatmullRomCurve3([
      new THREE.Vector3(xc, 2.6, -0.74), new THREE.Vector3(xc, 2.55, -0.98), new THREE.Vector3(xc * 0.75, 2.1, -1.12),
      new THREE.Vector3(xc * 0.35 + 0.15, 1.45, -1.12), new THREE.Vector3(0.2, 1.05, -1.08),
    ]);
    parts.exhaust.add(mesh(new THREE.TubeGeometry(e, 64, 0.08, 20), mats.exhaustMat));
  }
  const plenum = mesh(cylinderX(0.27, 3.7), mats.intakeMat, [0, 3.48, 0.98]);
  parts.intake.add(plenum);
  parts.intake.add(mesh(cylinderX(0.17, 0.3), mats.intakeMat, [-2.0, 3.48, 0.98]));
  parts.intake.add(mesh(new THREE.BoxGeometry(4.0, 0.34, 0.05), mats.intakeMat, [0, 2.62, 0.76]));
  parts.exhaust.add(mesh(new THREE.BoxGeometry(4.0, 0.34, 0.05), mats.exhaustMat, [0, 2.6, -0.76]));
  const collector = new THREE.CylinderGeometry(0.13, 0.13, 0.7, 24);
  parts.exhaust.add(mesh(collector, mats.exhaustMat, [0.2, 0.75, -1.08]));

  // Lignes de construction (axes de cylindres et axe du vilebrequin, en tireté)
  const lines = new THREE.Group();
  const addLine = (a: THREE.Vector3, b: THREE.Vector3) => {
    const l = new THREE.Line(new THREE.BufferGeometry().setFromPoints([a, b]), mats.construction);
    l.computeLineDistances();
    lines.add(l);
  };
  for (const xc of DIM.cylX) addLine(new THREE.Vector3(xc, -0.6, 0), new THREE.Vector3(xc, 6.4, 0));
  addLine(new THREE.Vector3(-3.6, 0, 0), new THREE.Vector3(3.3, 0, 0));
  addLine(new THREE.Vector3(-3.4, DIM.camY, DIM.camZ), new THREE.Vector3(2.6, DIM.camY, DIM.camZ));
  root.add(lines);

  return { root, parts, crank, fly, pistons, rods, valves, cams, crankPulley, gamma };
}


/** Place toutes les pièces mobiles pour un angle de vilebrequin donné (cinématique exacte). */
export function poseEngine(engine: ReturnType<typeof buildEngine>, theta: number) {
  engine.crank.rotation.x = theta;
  engine.fly.rotation.x = theta;
  engine.crankPulley.rotation.x = theta;
  DIM.cylX.forEach((xc, i) => {
    const k = sliderCrank(theta + DIM.pinPhase[i]);
    engine.pistons[i].position.set(xc, k.pistonY, 0);
    engine.rods[i].position.set(xc, k.pinY, k.pinZ);
    engine.rods[i].rotation.x = k.rodAngle;
  });
  const thetaCam = theta / 2;
  for (const c of engine.cams) c.group.rotation.x = thetaCam;
  for (const v of engine.valves) {
    const lift = camRadius(v.lambda + thetaCam - v.side * engine.gamma) - DIM.camBase;
    v.obj.position.copy(v.base).addScaledVector(v.axis, -lift);
  }
}

/* ------------------------------------------------------------------ */
/* Scène                                                               */
/* ------------------------------------------------------------------ */
export interface EngineLabel { el: HTMLElement | null; part: keyof typeof STEPS; at: [number, number, number] }

export function EngineScene({ timeRef, labels, onFirstFrame }: { timeRef: React.MutableRefObject<number>; labels: EngineLabel[]; onFirstFrame?: () => void }) {
  const { gl, scene, camera, size, invalidate } = useThree();
  const mats = useMemo(makeMaterials, []);
  const engine = useMemo(() => buildEngine(mats), [mats]);
  const first = useRef(true);
  const tmp = useMemo(() => new THREE.Vector3(), []);

  useEffect(() => {
    const pmrem = new THREE.PMREMGenerator(gl);
    const envTex = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    scene.environment = envTex;
    scene.environmentIntensity = 0.85;
    gl.toneMapping = THREE.NeutralToneMapping;
    gl.toneMappingExposure = 1.05;
    invalidate();
    return () => { envTex.dispose(); pmrem.dispose(); };
  }, [gl, scene, invalidate]);

  useEffect(() => () => {
    engine.root.traverse((o) => {
      const m = o as THREE.Mesh;
      m.geometry?.dispose?.();
    });
    Object.values(mats).forEach((m) => m.dispose());
  }, [engine, mats]);

  useFrame(() => {
    const t = timeRef.current;
    // Assemblage
    for (const [k, step] of Object.entries(STEPS) as [keyof typeof STEPS, Step][]) {
      const k01 = 1 - progress(step, t);
      engine.parts[k].position.set(step.from[0] * k01, step.from[1] * k01, step.from[2] * k01);
    }
    for (const [m, step] of [[mats.intakeMat, STEPS.intake], [mats.exhaustMat, STEPS.exhaust]] as const) {
      const o = clamp01((t - step.t0 + 0.3) / 0.8);
      if (m.transparent !== o < 1) { m.transparent = o < 1; m.needsUpdate = true; }
      m.opacity = o;
      m.depthWrite = o >= 1;
      m.visible = o > 0;
    }
    // Lignes de construction : apparaissent puis s'estompent
    const lineOpacity = t < 0.2 ? 0 : t < 1.4 ? (t - 0.2) / 1.2 * 0.55 : t < T_ASSEMBLED ? 0.55 : Math.max(0.14, 0.55 - (t - T_ASSEMBLED) * 0.25);
    mats.construction.opacity = lineOpacity;

    // Cinématique
    poseEngine(engine, crankAngleAt(t));

    // Caméra : travelling lent vers le moteur assemblé, puis légère oscillation
    const zoom = easeInOut(clamp01((t - 0.3) / (T_ASSEMBLED - 0.3)));
    const dist = THREE.MathUtils.lerp(19.5, 12.4, zoom);
    const az = -0.72 + Math.sin(Math.max(0, t - T_ASSEMBLED) * 0.12) * 0.1 * clamp01((t - T_ASSEMBLED) / 3);
    const el = THREE.MathUtils.lerp(0.36, 0.3, zoom);
    const target = new THREE.Vector3(0.15, THREE.MathUtils.lerp(2.0, 1.25, zoom), 0);
    camera.position.set(target.x + Math.sin(az) * Math.cos(el) * dist, target.y + Math.sin(el) * dist, target.z + Math.cos(az) * Math.cos(el) * dist);
    camera.lookAt(target);

    // Étiquettes techniques (DOM) synchronisées avec les pièces
    for (const lb of labels) {
      if (!lb.el) continue;
      const step = STEPS[lb.part];
      const appear = clamp01((t - step.t0 + 0.2) / 0.5);
      const fade = t > T_ASSEMBLED + 1.5 ? clamp01(1 - (t - T_ASSEMBLED - 1.5) / 1.2) : 1;
      const o = appear * fade;
      engine.parts[lb.part].localToWorld(tmp.set(...lb.at));
      tmp.project(camera);
      const x = (tmp.x * 0.5 + 0.5) * size.width;
      const y = (-tmp.y * 0.5 + 0.5) * size.height;
      const flip = x > size.width * 0.62;
      lb.el.style.opacity = String(o);
      lb.el.style.flexDirection = flip ? 'row-reverse' : 'row';
      lb.el.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0) translate(${flip ? '-100%' : '0'}, -50%)`;
    }

    if (first.current) { first.current = false; onFirstFrame?.(); }
  });

  return (
    <>
      <directionalLight
        position={[-6, 9, 7]}
        intensity={2.4}
        castShadow
        shadow-mapSize={[1024, 1024]}
        shadow-bias={-0.0004}
        shadow-normalBias={0.02}
        shadow-radius={6}
        shadow-camera-left={-6}
        shadow-camera-right={6}
        shadow-camera-top={8}
        shadow-camera-bottom={-5}
      />
      <directionalLight position={[7, 3, -6]} intensity={1.1} color="#d9cbb5" />
      <directionalLight position={[2, -4, 6]} intensity={0.35} color="#aab4c2" />
      <primitive object={engine.root} position={[0, -0.1, 0]} />
    </>
  );
}
