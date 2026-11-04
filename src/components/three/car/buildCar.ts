import * as THREE from 'three';
import { CAR, bodyGeometry, cabinGeometry, curveOnBody, tForHeight, tireGeometry, rimGeometry, halfWidth, topY, bodyPoint, faceX } from './carGeometry';
import { makeMaterials as engineMaterials, buildEngine, poseEngine } from '../engine/EngineScene';
import { springGeometry } from '../engine/geometry';

export type ZoneId = 'moteur' | 'batterie' | 'freinage' | 'pneumatiques' | 'suspension' | 'direction' | 'transmission' | 'refroidissement';

function plateTexture() {
  if (typeof document === 'undefined') return null;
  const c = document.createElement('canvas');
  c.width = 520; c.height = 110;
  const g = c.getContext('2d')!;
  g.fillStyle = '#f2f2ee'; g.fillRect(0, 0, 520, 110);
  g.strokeStyle = '#1b1c1f'; g.lineWidth = 4; g.strokeRect(4, 4, 512, 102);
  g.fillStyle = '#1b1c1f'; g.font = '600 64px Arial, sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle';
  g.fillText('VALFRAN', 260, 58);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  return t;
}

function concreteTexture(size = 512) {
  const data = new Uint8Array(size * size * 4);
  let seed = 11;
  const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
  // bruit de valeur multi-octave, discret
  const grid = (n: number) => Array.from({ length: n * n }, rnd);
  const octs = [8, 32, 128].map((n) => ({ n, g: grid(n) }));
  for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
    let v = 0, amp = 0.5;
    for (const { n, g } of octs) {
      const fx = (x / size) * n, fy = (y / size) * n;
      const x0 = Math.floor(fx) % n, y0 = Math.floor(fy) % n, x1 = (x0 + 1) % n, y1 = (y0 + 1) % n;
      const tx = fx - Math.floor(fx), ty = fy - Math.floor(fy);
      const a = g[y0 * n + x0] * (1 - tx) + g[y0 * n + x1] * tx;
      const b = g[y1 * n + x0] * (1 - tx) + g[y1 * n + x1] * tx;
      v += amp * (a * (1 - ty) + b * ty);
      amp *= 0.5;
    }
    const c = 150 + v * 60;
    const i = (y * size + x) * 4;
    data[i] = data[i + 1] = data[i + 2] = c; data[i + 3] = 255;
  }
  const t = new THREE.DataTexture(data, size, size);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(6, 6);
  t.needsUpdate = true;
  return t;
}

export function makeCarMaterials() {
  const paint = new THREE.MeshPhysicalMaterial({ color: '#2e3843', metalness: 0.6, roughness: 0.32, clearcoat: 1, clearcoatRoughness: 0.03, side: THREE.DoubleSide });
  const glass = new THREE.MeshPhysicalMaterial({ color: '#0b0e12', metalness: 0.2, roughness: 0.03, transparent: true, opacity: 0.86, clearcoat: 1, clearcoatRoughness: 0.02, side: THREE.DoubleSide });
  const gloss = new THREE.MeshPhysicalMaterial({ color: '#0a0b0d', metalness: 0.3, roughness: 0.18, clearcoat: 1, clearcoatRoughness: 0.05, side: THREE.DoubleSide });
  const plastic = new THREE.MeshStandardMaterial({ color: '#17181b', metalness: 0, roughness: 0.78 });
  const tire = new THREE.MeshStandardMaterial({ color: '#141518', metalness: 0, roughness: 0.88 });
  const rim = new THREE.MeshPhysicalMaterial({ color: '#b9bcc0', metalness: 1, roughness: 0.28, clearcoat: 0.6 });
  const rimDark = new THREE.MeshStandardMaterial({ color: '#2a2c30', metalness: 0.8, roughness: 0.45 });
  const disc = new THREE.MeshStandardMaterial({ color: '#80848a', metalness: 1, roughness: 0.42 });
  const caliper = new THREE.MeshPhysicalMaterial({ color: '#b19776', metalness: 0.35, roughness: 0.38, clearcoat: 0.8 });
  const ledWhite = new THREE.MeshStandardMaterial({ color: '#ffffff', emissive: '#f6f2ea', emissiveIntensity: 2.4, roughness: 0.2 });
  const ledRed = new THREE.MeshStandardMaterial({ color: '#4a0b0b', emissive: '#c1121a', emissiveIntensity: 1.8, roughness: 0.25 });
  const lens = new THREE.MeshPhysicalMaterial({ color: '#15181c', metalness: 0.2, roughness: 0.05, clearcoat: 1, transparent: true, opacity: 0.92 });
  const steel = new THREE.MeshStandardMaterial({ color: '#6f7378', metalness: 1, roughness: 0.45 });
  const spring = new THREE.MeshStandardMaterial({ color: '#2b2d31', metalness: 0.9, roughness: 0.38 });
  const battery = new THREE.MeshStandardMaterial({ color: '#1d1f23', metalness: 0.1, roughness: 0.6 });
  const radiator = new THREE.MeshStandardMaterial({ color: '#4b4f55', metalness: 0.9, roughness: 0.55 });
  const hose = new THREE.MeshStandardMaterial({ color: '#111214', metalness: 0, roughness: 0.7 });
  const interior = new THREE.MeshStandardMaterial({ color: '#1c1d20', metalness: 0, roughness: 0.85 });
  const gap = new THREE.MeshBasicMaterial({ color: '#050506' });
  const highlight = new THREE.MeshStandardMaterial({ color: '#d8c4a4', emissive: '#b19776', emissiveIntensity: 0.55, metalness: 0.6, roughness: 0.35 });
  const plateTex = plateTexture();
  const plate = new THREE.MeshStandardMaterial({ map: plateTex ?? undefined, color: plateTex ? '#ffffff' : '#eeeeea', roughness: 0.4, metalness: 0.1 });
  const concrete = concreteTexture();
  const floor = new THREE.MeshStandardMaterial({ color: '#3a3b3f', roughness: 0.78, metalness: 0, roughnessMap: concrete, map: concrete });
  return { paint, glass, gloss, plastic, tire, rim, rimDark, disc, caliper, ledWhite, ledRed, lens, steel, spring, battery, radiator, hose, interior, gap, highlight, plate, floor };
}
export type CarMats = ReturnType<typeof makeCarMaterials>;

const tube = (pts: THREE.Vector3[], r: number, mat: THREE.Material, seg = 64) => new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), seg, r, 10), mat);
const box = (w: number, h: number, d: number, mat: THREE.Material, pos: [number, number, number], r = 0) => {
  const m = new THREE.Mesh(r ? roundedBox(w, h, d, r) : new THREE.BoxGeometry(w, h, d), mat);
  m.position.set(...pos);
  m.castShadow = true;
  return m;
};
function roundedBox(w: number, h: number, d: number, r: number) {
  const s = new THREE.Shape();
  const x = -w / 2, y = -h / 2;
  s.moveTo(x + r, y); s.lineTo(x + w - r, y); s.quadraticCurveTo(x + w, y, x + w, y + r); s.lineTo(x + w, y + h - r); s.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  s.lineTo(x + r, y + h); s.quadraticCurveTo(x, y + h, x, y + h - r); s.lineTo(x, y + r); s.quadraticCurveTo(x, y, x + r, y);
  const g = new THREE.ExtrudeGeometry(s, { depth: d - 2 * r, bevelEnabled: true, bevelThickness: r, bevelSize: r * 0.9, bevelSegments: 3 });
  g.translate(0, 0, -(d - 2 * r) / 2);
  return g;
}

function buildWheel(m: CarMats, side: 1 | -1) {
  const wheel = new THREE.Group(); // tourne autour de Z
  const tire = new THREE.Mesh(tireGeometry(), m.tire);
  tire.castShadow = true;
  const r = rimGeometry();
  const barrel = new THREE.Mesh(r.barrel, m.rimDark);
  const face = new THREE.Mesh(r.faceGeo, m.rim);
  face.position.z = side * 0.055;
  if (side === -1) face.rotation.y = Math.PI;
  const lip = new THREE.Mesh(r.lip, m.rim);
  lip.position.z = side * 0.09;
  if (side === -1) lip.rotation.y = Math.PI;
  const hub = new THREE.Mesh(r.hub, m.rimDark);
  hub.position.z = side * 0.07;
  wheel.add(tire, barrel, face, lip, hub);
  for (let i = 0; i < 5; i++) {
    const a = (i / 5) * Math.PI * 2 + 0.3;
    const nut = new THREE.Mesh(new THREE.CylinderGeometry(0.009, 0.009, 0.02, 6), m.steel);
    nut.rotation.x = Math.PI / 2;
    nut.position.set(Math.cos(a) * 0.045, Math.sin(a) * 0.045, side * 0.085);
    wheel.add(nut);
  }
  return { wheel, tire, face, lip, barrel, hub };
}

function buildBrake(m: CarMats, side: 1 | -1, front: boolean) {
  const discR = front ? 0.16 : 0.145;
  const rotor = new THREE.Group(); // tourne avec la roue
  const d1 = new THREE.Mesh(new THREE.CylinderGeometry(discR, discR, 0.011, 64), m.disc);
  d1.rotation.x = Math.PI / 2; d1.position.z = -side * 0.008;
  const d2 = d1.clone(); d2.position.z = -side * 0.03;
  const hat = new THREE.Mesh(new THREE.CylinderGeometry(0.085, 0.085, 0.045, 40), m.steel);
  hat.rotation.x = Math.PI / 2; hat.position.z = -side * 0.01;
  rotor.add(d1, d2, hat);
  const caliper = new THREE.Group(); // fixe (porte-moyeu)
  caliper.add(box(0.12, 0.065, 0.07, m.caliper, [0, 0, -side * 0.019], 0.015));
  caliper.position.set(-0.035, discR - 0.03, 0);
  caliper.rotation.z = 0.45;
  return { rotor, caliper };
}

export interface Subsystem { id: ZoneId; meshes: THREE.Object3D[] }

/** Assemble le véhicule complet : carrosserie, vitrages, éclairage, roues, organes mécaniques. */
export function buildCar(m: CarMats) {
  const root = new THREE.Group();
  const bodyGroup = new THREE.Group();
  root.add(bodyGroup);

  const body = new THREE.Mesh(bodyGeometry(), m.paint);
  body.castShadow = true; body.receiveShadow = true;
  bodyGroup.add(body);
  for (const side of [1, -1] as const) {
    const cab = new THREE.Mesh(cabinGeometry(side), [m.glass, m.paint, m.gloss]);
    cab.castShadow = true;
    bodyGroup.add(cab);
  }

  // Volume intérieur sombre (masque l'absence d'habitacle détaillé) + planche de bord, sièges, volant
  const inner = box(2.3, 0.3, 1.36, m.interior, [-0.45, 0.82, 0]);
  inner.castShadow = false;
  bodyGroup.add(inner);
  bodyGroup.add(box(0.32, 0.14, 1.34, m.interior, [0.66, 0.97, 0], 0.04));
  for (const z of [0.36, -0.36]) {
    bodyGroup.add(box(0.48, 0.1, 0.46, m.interior, [-0.05, 0.98, z], 0.04));
    const back = box(0.1, 0.36, 0.44, m.interior, [-0.3, 1.14, z], 0.04);
    back.rotation.z = 0.2;
    bodyGroup.add(back);
  }
  // Joints d'ouvrants (portes, capot, hayon)
  const gap = (samples: [number, number][], r = 0.0022) => { const t = tube(curveOnBody(samples, 0.0015), r, m.gap, 80); bodyGroup.add(t); };
  for (const side of [1, -1]) {
    const tSide = (x: number, y: number) => { const t = tForHeight(x, y); return side === 1 ? t : Math.PI - t; };
    const vertical = (x: number, yTop: number, yBot: number) => gap(Array.from({ length: 24 }, (_, i) => { const y = yTop - ((yTop - yBot) * i) / 23; return [x, tSide(x, y)] as [number, number]; }));
    vertical(0.9, topY(0.9) - 0.01, 0.33);
    vertical(-0.33, topY(-0.33) - 0.01, 0.31);
    vertical(-0.97, topY(-0.97) - 0.01, 0.55);
    gap(Array.from({ length: 40 }, (_, i) => { const x = 0.9 - (1.87 * i) / 39; return [x, tSide(x, 0.315)] as [number, number]; }));
    // poignées affleurantes
    for (const x of [0.25, -0.86]) {
      const p = bodyPoint(x, tSide(x, 0.86));
      const handle = box(0.15, 0.022, 0.012, m.gloss, [p.x, p.y, p.z + side * 0.003], 0.005);
      bodyGroup.add(handle);
    }
    // rétroviseurs
    const mirror = new THREE.Group();
    const shell = new THREE.Mesh(new THREE.SphereGeometry(0.1, 32, 16), m.paint);
    shell.scale.set(0.9, 0.62, 1.3);
    shell.castShadow = true;
    const arm = box(0.08, 0.03, 0.1, m.gloss, [0.02, -0.03, -side * 0.08], 0.01);
    mirror.add(shell, arm);
    mirror.position.set(0.78, 1.02, side * (halfWidth(0.78) + 0.1));
    bodyGroup.add(mirror);
  }
  // capot : ligne transversale et lignes latérales
  gap(Array.from({ length: 40 }, (_, i) => [0.95, Math.PI / 2 - 1.2 + (2.4 * i) / 39] as [number, number]));
  for (const side of [1, -1]) gap(Array.from({ length: 30 }, (_, i) => { const x = 0.95 + (1.0 * i) / 29; return [x, side === 1 ? 1.05 : Math.PI - 1.05] as [number, number]; }));

  // Essuie-glaces
  for (const z of [0.3, -0.25]) {
    const w = box(0.03, 0.012, 0.62, m.gloss, [CAR.xA - 0.05, topY(CAR.xA) + 0.02, z]);
    w.rotation.y = 0.18;
    bodyGroup.add(w);
  }

  // Signature lumineuse avant : bandeau horizontal continu + retours verticaux (création VALFRAN)
  const ySig = 0.67;
  const sig: THREE.Vector3[] = [];
  for (let i = 0; i <= 64; i++) {
    const z = -0.7 + (1.4 * i) / 64;
    sig.push(new THREE.Vector3(faceX(ySig, z, true) + 0.004, ySig, z));
  }
  const strip = tube(sig, 0.0075, m.ledWhite, 128);
  bodyGroup.add(strip);
  for (const side of [1, -1]) {
    const end = sig[side === 1 ? sig.length - 1 : 0];
    bodyGroup.add(tube([end.clone(), end.clone().add(new THREE.Vector3(-0.02, -0.085, -side * 0.004))], 0.0075, m.ledWhite, 8));
    const lamp = new THREE.Mesh(new THREE.SphereGeometry(0.1, 24, 12), m.lens);
    lamp.scale.set(0.25, 0.3, 1.2);
    lamp.position.set(end.x - 0.03, ySig - 0.03, end.z - side * 0.1);
    bodyGroup.add(lamp);
  }
  // Calandre basse et prise d'air
  const grille: THREE.Vector3[] = [];
  for (let i = 0; i <= 40; i++) {
    const z = -0.52 + (1.04 * i) / 40;
    grille.push(new THREE.Vector3(faceX(0.42, z, true) - 0.01, 0.42, z));
  }
  const intake = tube(grille, 0.05, m.gloss, 80);
  intake.scale.set(1, 1, 1);
  bodyGroup.add(intake);
  // Feux arrière
  const rear: THREE.Vector3[] = [];
  for (let i = 0; i <= 64; i++) {
    const z = -0.76 + (1.52 * i) / 64;
    rear.push(new THREE.Vector3(faceX(0.84, z, false) - 0.004, 0.84, z));
  }
  bodyGroup.add(tube(rear, 0.011, m.ledRed, 128));
  // Plaques neutres
  const plateGeo = new THREE.PlaneGeometry(0.52, 0.11);
  const pf = new THREE.Mesh(plateGeo, m.plate); pf.position.set(faceX(0.53, 0, true) + 0.008, 0.53, 0); pf.rotation.y = Math.PI / 2; bodyGroup.add(pf);
  const pr = new THREE.Mesh(plateGeo, m.plate); pr.position.set(faceX(0.62, 0, false) - 0.008, 0.62, 0); pr.rotation.y = -Math.PI / 2; bodyGroup.add(pr);

  // Dessous de caisse et passages de roues
  const under = box(3.3, 0.02, 1.55, m.plastic, [-0.03, 0.2, 0]);
  under.castShadow = false;
  root.add(under);
  // Roues, freins, suspensions
  const wheels: { group: THREE.Group; spin: THREE.Group; tire: THREE.Mesh; face: THREE.Mesh; lip: THREE.Mesh; barrel: THREE.Mesh; hub: THREE.Mesh; front: boolean; side: 1 | -1 }[] = [];
  const brakes: THREE.Object3D[] = [];
  const suspension: THREE.Object3D[] = [];
  for (const [xw, front] of [[CAR.axleF, true], [CAR.axleR, false]] as const) for (const side of [1, -1] as const) {
    const corner = new THREE.Group(); // pivot de direction
    corner.position.set(xw, CAR.wheelY, side * CAR.trackZ);
    const spin = new THREE.Group();
    const w = buildWheel(m, side);
    spin.add(w.wheel);
    const { rotor, caliper } = buildBrake(m, side, front);
    spin.add(rotor);
    corner.add(spin, caliper);
    brakes.push(caliper, rotor);
    root.add(corner);
    wheels.push({ group: corner, spin, ...w, front, side });
    // jambe de force / amortisseur + ressort
    const s = new THREE.Group();
    const top = new THREE.Vector3(xw - (front ? 0.04 : -0.02), front ? 0.82 : 0.7, side * (CAR.trackZ - 0.2));
    const bottom = new THREE.Vector3(xw, CAR.wheelY + 0.08, side * (CAR.trackZ - 0.13));
    s.add(tube([bottom, top], 0.026, m.steel, 8));
    const coil = new THREE.Mesh(springGeometry(0, top.distanceTo(bottom) * 0.62, 0.065, 5.5), m.spring);
    coil.position.copy(bottom).lerp(top, 0.3);
    coil.lookAt(top);
    coil.rotateX(Math.PI / 2);
    s.add(coil);
    const arm = tube([new THREE.Vector3(xw, CAR.wheelY - 0.06, side * (CAR.trackZ - 0.12)), new THREE.Vector3(xw - 0.05, 0.27, side * 0.32)], 0.02, m.steel, 8);
    s.add(arm);
    root.add(s);
    suspension.push(s);
  }

  // Moteur transversal (même mécanique que l'animation de l'accueil, à l'échelle)
  const em = engineMaterials();
  em.ghost.opacity = 0.12;
  const engine = buildEngine(em);
  poseEngine(engine, 0.6);
  for (const k of Object.keys(engine.parts) as (keyof typeof engine.parts)[]) engine.parts[k].position.set(0, 0, 0);
  em.construction.opacity = 0;
  em.intakeMat.opacity = 1;
  em.exhaustMat.opacity = 1;
  const engineHolder = new THREE.Group();
  engineHolder.add(engine.root);
  engine.root.scale.setScalar(0.105);
  engine.root.rotation.y = Math.PI / 2;
  engineHolder.position.set(1.58, 0.36, 0.05);
  root.add(engineHolder);

  // Boîte de vitesses + transmissions
  const transmission = new THREE.Group();
  transmission.add(box(0.32, 0.3, 0.3, m.radiator, [1.5, 0.42, -0.42], 0.06));
  for (const side of [1, -1]) {
    const from = new THREE.Vector3(1.45, 0.34, side === 1 ? 0.2 : -0.45);
    const to = new THREE.Vector3(CAR.axleF, CAR.wheelY, side * (CAR.trackZ - 0.1));
    transmission.add(tube([from, to], 0.022, m.steel, 12));
    const boot = new THREE.Mesh(new THREE.SphereGeometry(0.045, 16, 12), m.hose);
    boot.position.copy(to).lerp(from, 0.08);
    boot.scale.set(1, 1, 1.4);
    transmission.add(boot);
  }
  root.add(transmission);

  // Direction : crémaillère + biellettes
  const steering = new THREE.Group();
  steering.add(tube([new THREE.Vector3(1.36, 0.36, -0.42), new THREE.Vector3(1.36, 0.36, 0.42)], 0.028, m.steel, 8));
  for (const side of [1, -1]) steering.add(tube([new THREE.Vector3(1.36, 0.36, side * 0.42), new THREE.Vector3(CAR.axleF - 0.12, CAR.wheelY + 0.03, side * (CAR.trackZ - 0.1))], 0.012, m.steel, 8));
  steering.add(tube([new THREE.Vector3(1.36, 0.38, 0.32), new THREE.Vector3(0.95, 0.75, 0.36), new THREE.Vector3(0.55, 1.05, 0.36)], 0.018, m.steel, 16));
  root.add(steering);

  // Batterie
  const batteryG = new THREE.Group();
  batteryG.add(box(0.27, 0.18, 0.17, m.battery, [1.72, 0.68, -0.52], 0.012));
  for (const [z, col] of [[-0.47, '#a33a2c'], [-0.57, '#202226']] as const) {
    const term = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.025, 12), new THREE.MeshStandardMaterial({ color: col, roughness: 0.4 }));
    term.position.set(1.66, 0.785, z);
    batteryG.add(term);
  }
  root.add(batteryG);

  // Refroidissement : radiateur, ventilateur, durites, vase d'expansion
  const cooling = new THREE.Group();
  cooling.add(box(0.04, 0.34, 0.78, m.radiator, [1.84, 0.48, 0]));
  const fan = new THREE.Mesh(new THREE.CylinderGeometry(0.17, 0.17, 0.03, 32), m.plastic);
  fan.rotation.z = Math.PI / 2; fan.position.set(1.8, 0.48, 0.15);
  cooling.add(fan);
  cooling.add(tube([new THREE.Vector3(1.84, 0.62, 0.34), new THREE.Vector3(1.76, 0.66, 0.28), new THREE.Vector3(1.66, 0.62, 0.22)], 0.022, m.hose, 16));
  cooling.add(tube([new THREE.Vector3(1.84, 0.34, -0.34), new THREE.Vector3(1.76, 0.3, -0.25), new THREE.Vector3(1.66, 0.36, -0.12)], 0.022, m.hose, 16));
  const tank = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.13, 20), new THREE.MeshStandardMaterial({ color: '#d9d4c7', roughness: 0.5, transparent: true, opacity: 0.85 }));
  tank.position.set(1.5, 0.72, 0.55);
  cooling.add(tank);
  root.add(cooling);

  // Échappement (visible depuis les angles bas)
  root.add(tube([new THREE.Vector3(1.45, 0.3, 0.0), new THREE.Vector3(1.0, 0.22, 0.1), new THREE.Vector3(-0.8, 0.22, 0.12), new THREE.Vector3(-1.7, 0.26, 0.3)], 0.025, m.steel, 40));
  const muffler = box(0.4, 0.12, 0.26, m.steel, [-1.65, 0.27, 0.3], 0.05);
  root.add(muffler);

  const subsystems: Record<ZoneId, THREE.Object3D[]> = {
    moteur: [engineHolder],
    batterie: [batteryG],
    freinage: brakes,
    pneumatiques: wheels.map((w) => w.tire),
    suspension,
    direction: [steering],
    transmission: [transmission],
    refroidissement: [cooling],
  };

  return { root, bodyGroup, wheels, subsystems, engine, engineMats: em };
}

/** Points d'ancrage des repères interactifs et cadrages de caméra pour chaque zone. */
export const ZONES: Record<ZoneId, { label: string; anchor: [number, number, number]; normal: [number, number, number]; camera: [number, number, number]; target: [number, number, number] }> = {
  moteur: { label: 'Moteur', anchor: [1.55, 0.9, 0.1], normal: [0.3, 1, 0.2], camera: [3.9, 2.4, 2.6], target: [1.5, 0.55, 0] },
  batterie: { label: 'Batterie', anchor: [1.72, 0.86, -0.52], normal: [0.3, 1, -0.4], camera: [3.4, 2.2, -2.6], target: [1.65, 0.65, -0.45] },
  freinage: { label: 'Freinage', anchor: [CAR.axleF, CAR.wheelY + 0.12, CAR.trackZ + 0.13], normal: [0, 0.2, 1], camera: [3.2, 1.1, 3.4], target: [CAR.axleF, 0.35, 0.7] },
  pneumatiques: { label: 'Pneumatiques', anchor: [CAR.axleR, CAR.wheelY - 0.22, CAR.trackZ + 0.12], normal: [0, -0.2, 1], camera: [-2.4, 0.6, 3.0], target: [CAR.axleR, 0.33, 0.75] },
  suspension: { label: 'Suspension', anchor: [CAR.axleF - 0.05, 0.72, CAR.trackZ - 0.05], normal: [0.2, 0.6, 1], camera: [2.9, 1.5, 3.1], target: [CAR.axleF, 0.5, 0.6] },
  direction: { label: 'Direction', anchor: [1.36, 0.36, -0.75], normal: [0.2, 0, -1], camera: [3.2, 0.9, -3.0], target: [1.35, 0.4, -0.3] },
  transmission: { label: 'Transmission', anchor: [1.45, 0.42, -0.82], normal: [0, 0.1, -1], camera: [2.6, 0.8, -3.3], target: [1.4, 0.4, -0.4] },
  refroidissement: { label: 'Refroidissement', anchor: [2.2, 0.5, 0.3], normal: [1, 0, 0.2], camera: [5.0, 1.3, 1.6], target: [1.9, 0.5, 0] },
};
