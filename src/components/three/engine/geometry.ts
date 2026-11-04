/**
 * Moteur 4 cylindres en ligne, double arbre à cames en tête, 16 soupapes — géométrie procédurale.
 * Unité : 1 = 100 mm. Axe X = axe du vilebrequin (avant du moteur vers -X), Y = haut, Z = profondeur.
 *
 * Cohérence mécanique :
 *  - alésage 80 mm, course 86 mm, bielle 145 mm, entraxe des cylindres 90 mm ;
 *  - manetons 1-4 à 0°, 2-3 à 180° (vilebrequin plat de 4 cylindres), ordre d'allumage 1-3-4-2 ;
 *  - piston : cinématique bielle-manivelle exacte ;
 *  - arbres à cames entraînés par courroie au rapport 2:1 (poulies d'arbres à cames de diamètre double) ;
 *  - levée de soupapes calculée à partir du profil réel des cames.
 */
import * as THREE from 'three';

export const DIM = {
  bore: 0.8,
  stroke: 0.86,
  crankR: 0.43,
  rodL: 1.45,
  pistonCompression: 0.34, // axe de piston → calotte
  cylX: [-1.35, -0.45, 0.45, 1.35],
  pinPhase: [0, Math.PI, Math.PI, 0],
  /** Décalage de cycle (degrés vilebrequin) : ordre d'allumage 1-3-4-2. */
  cycleOffsetDeg: [0, 540, 180, 360],
  deckY: 2.24,
  headTop: 2.98,
  camY: 3.15,
  camZ: 0.5,
  camBase: 0.15,
  camLift: 0.085,
  camHalfWidth: 1.15,
  valveSeatY: 2.3,
  valveSeatZ: 0.17,
  valveDX: 0.17,
  frontX: -2.32,
  rearX: 2.2,
  crankPulleyR: 0.21,
  camPulleyR: 0.42,
};

/** Profil de came (rayon en fonction de l'angle par rapport au sommet de la came). */
export function camRadius(phi: number) {
  const w = DIM.camHalfWidth;
  const a = Math.atan2(Math.sin(phi), Math.cos(phi));
  if (Math.abs(a) >= w) return DIM.camBase;
  const c = Math.cos((Math.PI * a) / (2 * w));
  return DIM.camBase + DIM.camLift * c * c;
}

/** Position de l'axe de piston (y) et angle de bielle pour un angle de manivelle alpha. */
export function sliderCrank(alpha: number) {
  const { crankR: r, rodL: L } = DIM;
  const pz = r * Math.sin(alpha);
  const py = r * Math.cos(alpha);
  const yq = py + Math.sqrt(L * L - pz * pz);
  const rodAngle = Math.atan2(-pz, yq - py);
  return { pinY: py, pinZ: pz, pistonY: yq, rodAngle };
}

/** Oriente une géométrie dessinée dans le plan (z, y) et extrudée le long de X, centrée en X. */
export function toYZ(geo: THREE.BufferGeometry, depth: number) {
  geo.rotateY(-Math.PI / 2);
  geo.translate(depth / 2, 0, 0);
  return geo;
}

export function cylinderX(r: number, len: number, seg = 48) {
  const g = new THREE.CylinderGeometry(r, r, len, seg, 1);
  g.rotateZ(Math.PI / 2);
  return g;
}

function circlePath(cx: number, cy: number, r: number, cw = false) {
  const p = new THREE.Path();
  p.absarc(cx, cy, r, 0, Math.PI * 2, cw);
  return p;
}

/** Bras de vilebrequin avec contrepoids. Le maneton pointe vers +Y. */
export function crankWebGeometry() {
  const s = new THREE.Shape();
  const R = 0.6;
  const a0 = -Math.PI / 2 - 0.95;
  const a1 = -Math.PI / 2 + 0.95;
  s.moveTo(Math.cos(a0) * R, Math.sin(a0) * R);
  s.absarc(0, 0, R, a0, a1, false);
  s.lineTo(0.27, DIM.crankR - 0.02);
  s.absarc(0, DIM.crankR, 0.27, 0, Math.PI, false);
  s.lineTo(Math.cos(a0) * R, Math.sin(a0) * R);
  const depth = 0.17;
  const g = new THREE.ExtrudeGeometry(s, { depth, bevelEnabled: true, bevelThickness: 0.012, bevelSize: 0.012, bevelSegments: 2, curveSegments: 32 });
  return toYZ(g, depth);
}

/** Bielle en I : tête (maneton) en (0,0), pied (axe de piston) en (0, L). */
export function rodGeometry() {
  const L = DIM.rodL;
  const s = new THREE.Shape();
  const bigR = 0.29, smallR = 0.13;
  s.absarc(0, 0, bigR, Math.PI - 0.55, 0.55, false);
  s.lineTo(0.12, 0.25);
  s.lineTo(0.075, L - 0.106);
  s.absarc(0, L, smallR, -0.95, Math.PI + 0.95, false);
  s.lineTo(-0.12, 0.25);
  s.closePath();
  s.holes.push(circlePath(0, 0, 0.185, true), circlePath(0, L, 0.068, true));
  const depth = 0.17;
  const g = new THREE.ExtrudeGeometry(s, { depth, bevelEnabled: true, bevelThickness: 0.01, bevelSize: 0.01, bevelSegments: 2, curveSegments: 36 });
  return toYZ(g, depth);
}

/** Piston (origine = axe de piston). Gorges de segments modélisées dans le profil. */
export function pistonGeometry() {
  const r = DIM.bore / 2 - 0.006;
  const top = DIM.pistonCompression;
  const bottom = -0.3;
  const pts: [number, number][] = [
    [0.001, top - 0.025], [r * 0.55, top - 0.03], [r * 0.82, top - 0.008], [r - 0.012, top], [r, top - 0.012],
    [r, top - 0.06], [r - 0.012, top - 0.064], [r - 0.012, top - 0.08], [r, top - 0.084],
    [r, top - 0.115], [r - 0.012, top - 0.119], [r - 0.012, top - 0.135], [r, top - 0.139],
    [r, top - 0.17], [r - 0.014, top - 0.174], [r - 0.014, top - 0.2], [r, top - 0.204],
    [r - 0.002, bottom + 0.02], [r - 0.012, bottom], [r - 0.05, bottom], [r - 0.05, top - 0.12], [0.001, top - 0.12],
  ];
  return new THREE.LatheGeometry(pts.map(([x, y]) => new THREE.Vector2(x, y)), 72);
}

/** Soupape (origine = siège, axe +Y) : tête, tige, coupelle. */
export function valveGeometry(length: number) {
  const pts: [number, number][] = [
    [0.001, -0.005], [0.125, -0.005], [0.13, 0.012], [0.06, 0.05], [0.026, 0.1], [0.022, 0.16], [0.022, length - 0.02], [0.018, length], [0.001, length],
  ];
  return new THREE.LatheGeometry(pts.map(([x, y]) => new THREE.Vector2(x, y)), 40);
}

export function springGeometry(y0: number, y1: number, radius: number, turns: number) {
  const pts: THREE.Vector3[] = [];
  const N = Math.round(turns * 28);
  for (let i = 0; i <= N; i++) {
    const t = i / N;
    const a = t * turns * Math.PI * 2;
    pts.push(new THREE.Vector3(Math.cos(a) * radius, y0 + (y1 - y0) * t, Math.sin(a) * radius));
  }
  return new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), N, 0.014, 8, false);
}

/** Lobe de came : sommet orienté vers -Y. */
export function camLobeGeometry(width = 0.11) {
  const s = new THREE.Shape();
  const N = 120;
  for (let i = 0; i <= N; i++) {
    const phi = (i / N) * Math.PI * 2;
    const rr = camRadius(phi);
    const x = -Math.sin(phi) * rr;
    const y = -Math.cos(phi) * rr;
    if (i === 0) s.moveTo(x, y); else s.lineTo(x, y);
  }
  const g = new THREE.ExtrudeGeometry(s, { depth: width, bevelEnabled: true, bevelThickness: 0.006, bevelSize: 0.006, bevelSegments: 1 });
  return toYZ(g, width);
}

/** Poulie crantée (dents fines) dans le plan YZ. */
export function pulleyGeometry(r: number, width: number, teeth: number) {
  const s = new THREE.Shape();
  const N = teeth * 4;
  for (let i = 0; i <= N; i++) {
    const a = (i / N) * Math.PI * 2;
    const k = i % 4;
    const rr = k === 1 || k === 2 ? r : r - 0.018;
    if (i === 0) s.moveTo(Math.cos(a) * rr, Math.sin(a) * rr); else s.lineTo(Math.cos(a) * rr, Math.sin(a) * rr);
  }
  s.holes.push(circlePath(0, 0, r * 0.18, true));
  const g = new THREE.ExtrudeGeometry(s, { depth: width, bevelEnabled: false });
  return toYZ(g, width);
}

/** Voile de poulie d'arbre à cames (avec allègements). */
export function pulleyWebGeometry(r: number, width: number) {
  const s = new THREE.Shape();
  s.absarc(0, 0, r * 0.86, 0, Math.PI * 2, false);
  for (let i = 0; i < 5; i++) {
    const a = (i / 5) * Math.PI * 2 + 0.3;
    s.holes.push(circlePath(Math.cos(a) * r * 0.52, Math.sin(a) * r * 0.52, r * 0.19, true));
  }
  s.holes.push(circlePath(0, 0, r * 0.14, true));
  const g = new THREE.ExtrudeGeometry(s, { depth: width, bevelEnabled: true, bevelThickness: 0.008, bevelSize: 0.008, bevelSegments: 1, curveSegments: 40 });
  return toYZ(g, width);
}

/** Enveloppe d'une courroie autour de poulies convexes (tangentes extérieures + arcs). */
export function beltOutline(circles: { z: number; y: number; r: number }[], extra: number, samples = 220) {
  const n = circles.length;
  const tangents: { a: THREE.Vector2; b: THREE.Vector2 }[] = [];
  for (let i = 0; i < n; i++) {
    const c1 = circles[i], c2 = circles[(i + 1) % n];
    const r1 = c1.r + extra, r2 = c2.r + extra;
    const d = new THREE.Vector2(c2.z - c1.z, c2.y - c1.y);
    const D = d.length();
    d.normalize();
    const alpha = Math.asin((r1 - r2) / D);
    const beta = Math.PI / 2 - alpha;
    const nrm = new THREE.Vector2(d.x * Math.cos(-beta) - d.y * Math.sin(-beta), d.x * Math.sin(-beta) + d.y * Math.cos(-beta));
    tangents.push({ a: new THREE.Vector2(c1.z + nrm.x * r1, c1.y + nrm.y * r1), b: new THREE.Vector2(c2.z + nrm.x * r2, c2.y + nrm.y * r2) });
  }
  const pts: THREE.Vector2[] = [];
  for (let i = 0; i < n; i++) {
    const c = circles[(i + 1) % n];
    const rr = c.r + extra;
    const inP = tangents[i].b, outP = tangents[(i + 1) % n].a;
    pts.push(tangents[i].a.clone(), inP.clone());
    const a0 = Math.atan2(inP.y - c.y, inP.x - c.z);
    let a1 = Math.atan2(outP.y - c.y, outP.x - c.z);
    // Poulies ordonnées dans le sens trigonométrique : l'enveloppe les contourne dans le même sens.
    while (a1 < a0) a1 += Math.PI * 2;
    const steps = Math.max(4, Math.round(((a1 - a0) / (Math.PI * 2)) * samples));
    for (let k = 1; k < steps; k++) {
      const a = a0 + ((a1 - a0) * k) / steps;
      pts.push(new THREE.Vector2(c.z + Math.cos(a) * rr, c.y + Math.sin(a) * rr));
    }
  }
  return pts;
}

export function beltGeometry(circles: { z: number; y: number; r: number }[], width: number) {
  const outer = beltOutline(circles, 0.045);
  const inner = beltOutline(circles, 0.008);
  const s = new THREE.Shape(outer);
  s.holes.push(new THREE.Path(inner.slice().reverse()));
  const g = new THREE.ExtrudeGeometry(s, { depth: width, bevelEnabled: false });
  return toYZ(g, width);
}

/** Section de carter-cylindres (plan YZ, extrudée le long de X). */
export function blockGeometry() {
  const s = new THREE.Shape();
  const pts: [number, number][] = [[-0.66, DIM.deckY], [0.66, DIM.deckY], [0.66, 1.0], [0.8, 0.5], [0.8, -0.18], [-0.8, -0.18], [-0.8, 0.5], [-0.66, 1.0]];
  pts.forEach(([z, y], i) => (i === 0 ? s.moveTo(z, y) : s.lineTo(z, y)));
  s.closePath();
  const len = 4.3;
  return toYZ(new THREE.ExtrudeGeometry(s, { depth: len, bevelEnabled: false }), len);
}

export function headGeometry() {
  const s = new THREE.Shape();
  const y0 = DIM.deckY + 0.025, y1 = DIM.headTop;
  const pts: [number, number][] = [[-0.74, y0], [0.74, y0], [0.78, y0 + 0.3], [0.7, y1], [-0.7, y1], [-0.78, y0 + 0.3]];
  pts.forEach(([z, y], i) => (i === 0 ? s.moveTo(z, y) : s.lineTo(z, y)));
  s.closePath();
  const len = 4.3;
  return toYZ(new THREE.ExtrudeGeometry(s, { depth: len, bevelEnabled: false }), len);
}

export function coverGeometry() {
  const s = new THREE.Shape();
  const y0 = DIM.headTop + 0.01;
  s.moveTo(-0.72, y0);
  s.lineTo(0.72, y0);
  s.lineTo(0.72, y0 + 0.28);
  s.quadraticCurveTo(0.7, y0 + 0.62, 0.4, y0 + 0.64);
  s.lineTo(-0.4, y0 + 0.64);
  s.quadraticCurveTo(-0.7, y0 + 0.62, -0.72, y0 + 0.28);
  s.closePath();
  const len = 4.1;
  return toYZ(new THREE.ExtrudeGeometry(s, { depth: len, bevelEnabled: false, curveSegments: 16 }), len);
}

export function oilPanGeometry() {
  const s = new THREE.Shape();
  const pts: [number, number][] = [[-0.8, -0.2], [0.8, -0.2], [0.72, -0.62], [0.6, -1.05], [-0.6, -1.05], [-0.72, -0.62]];
  pts.forEach(([z, y], i) => (i === 0 ? s.moveTo(z, y) : s.lineTo(z, y)));
  s.closePath();
  const len = 4.0;
  return toYZ(new THREE.ExtrudeGeometry(s, { depth: len, bevelEnabled: false }), len);
}

/** Joint de culasse : plaque percée des quatre alésages (plan XZ). */
export function gasketGeometry() {
  const s = new THREE.Shape();
  s.moveTo(-2.15, -0.66); s.lineTo(2.15, -0.66); s.lineTo(2.15, 0.66); s.lineTo(-2.15, 0.66); s.closePath();
  for (const x of DIM.cylX) s.holes.push(circlePath(x, 0, DIM.bore / 2 + 0.01, true));
  for (const x of [-1.8, -0.9, 0, 0.9, 1.8]) for (const z of [-0.55, 0.55]) s.holes.push(circlePath(x, z, 0.045, true));
  const g = new THREE.ExtrudeGeometry(s, { depth: 0.025, bevelEnabled: false, curveSegments: 40 });
  g.rotateX(Math.PI / 2);
  g.translate(0, DIM.deckY + 0.025, 0);
  return g;
}

export function flywheelGeometry() {
  const R = 1.08;
  const s = new THREE.Shape();
  s.absarc(0, 0, R, 0, Math.PI * 2, false);
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2;
    s.holes.push(circlePath(Math.cos(a) * 0.2, Math.sin(a) * 0.2, 0.03, true));
  }
  for (let i = 0; i < 3; i++) {
    const a = (i / 3) * Math.PI * 2 + 0.5;
    s.holes.push(circlePath(Math.cos(a) * 0.62, Math.sin(a) * 0.62, 0.11, true));
  }
  s.holes.push(circlePath(0, 0, 0.06, true));
  const depth = 0.1;
  return toYZ(new THREE.ExtrudeGeometry(s, { depth, bevelEnabled: true, bevelThickness: 0.012, bevelSize: 0.012, bevelSegments: 2, curveSegments: 96 }), depth);
}

export function sparkPlugGeometry() {
  const pts: [number, number][] = [
    [0.001, 0], [0.02, 0], [0.04, 0.02], [0.05, 0.24], [0.072, 0.25], [0.072, 0.34], [0.05, 0.35], [0.05, 0.62], [0.035, 0.66], [0.03, 0.7], [0.001, 0.7],
  ];
  return new THREE.LatheGeometry(pts.map(([x, y]) => new THREE.Vector2(x, y)), 6 * 4);
}
