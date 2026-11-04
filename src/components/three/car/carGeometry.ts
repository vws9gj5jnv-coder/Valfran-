/**
 * VALFRAN « Lumen » — berline compacte 5 portes, design original (prototype procédural).
 * Unité : 1 = 1 m. X = longueur (avant vers +X), Y = haut, Z = largeur.
 *
 * Proportions inspirées des standards du segment (sans reprendre de modèle existant) :
 * longueur 4,30 m · largeur 1,80 m · hauteur 1,45 m · empattement 2,64 m · voies 1,56 m · pneus 205/55 R17.
 * Langage stylistique propre : signature lumineuse horizontale continue avec retours verticaux,
 * épaule tendue unique, vitrage affleurant, montant B noir, poignées affleurantes.
 */
import * as THREE from 'three';

export const CAR = {
  L: 4.3,
  Wmax: 0.9,
  frontX: 2.15,
  rearX: -2.15,
  axleF: 1.29,
  axleR: -1.35,
  wheelR: 0.329,
  wheelY: 0.329,
  trackZ: 0.752,
  tireW: 0.215,
  archR: 0.395,
  xA: 1.0, // base du pare-brise
  xRoofF: 0.12,
  xRoofR: -0.98,
  xTail: -2.03,
  roofY: 1.445,
};

const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const smooth = (a: number, b: number, x: number) => { const t = clamp((x - a) / (b - a)); return t * t * (3 - 2 * t); };
const spow = (v: number, p: number) => Math.sign(v) * Math.pow(Math.abs(v), p);

/** Demi-largeur en plan. */
export function halfWidth(x: number) {
  const front = x > 0;
  const u = clamp(Math.abs(x) / (CAR.L / 2), 0, 1);
  const p = front ? 4.6 : 6.5;
  return CAR.Wmax * Math.pow(Math.max(0, 1 - Math.pow(u, p)), 1 / p);
}

/** Bas de caisse (bouclier avant et arrière relevés : angles d'attaque et de fuite). */
export function bottomY(x: number) {
  return 0.2 + 0.11 * smooth(1.7, 2.15, x) + 0.17 * smooth(-1.75, -2.15, x);
}

/** Ligne de ceinture / capot / hayon. */
export function topY(x: number) {
  if (x > CAR.xA) {
    const s = clamp((x - CAR.xA) / (CAR.frontX - 0.08 - CAR.xA));
    return 0.925 - 0.19 * Math.pow(s, 1.7);
  }
  const s = clamp((CAR.xA - x) / (CAR.xA - CAR.rearX));
  return 0.925 + 0.07 * s - 0.08 * smooth(0.9, 1.0, s);
}

/** Point de la caisse basse pour la section d'abscisse x et l'angle t (0 = côté droit +Z, π/2 = dessus). */
export function bodyPoint(x: number, t: number, out = new THREE.Vector3()) {
  const w = halfWidth(x);
  const y0 = bottomY(x), y1 = topY(x);
  const u = Math.abs(x) / (CAR.L / 2);
  const vf = Math.pow(Math.max(0, 1 - Math.pow(Math.min(1, u), 14)), 1 / 14);
  const yc = (y0 + y1) / 2 + 0.02;
  const h = ((y1 - y0) / 2) * (0.55 + 0.45 * vf);
  const n = 4.6;
  const c = Math.cos(t), s = Math.sin(t);
  let z = w * spow(c, 2 / n);
  const y = yc + h * spow(s, 2 / n);
  // Rétreint d'épaule (tumblehome) et rentrée du bas de caisse
  z *= 1 - 0.05 * Math.max(0, s) ** 3 - 0.035 * Math.max(0, -s) ** 4;
  // Ligne de caractère : arête tendue sous la ceinture
  const crease = y1 - 0.16;
  z += Math.sign(c) * 0.011 * Math.exp(-(((y - crease) / 0.025) ** 2)) * smooth(-2.0, -1.4, x) * (1 - smooth(1.6, 2.05, x));
  out.set(x, y, z);
  // Passages de roues : on remonte la caisse sur l'arc
  for (const xw of [CAR.axleF, CAR.axleR]) {
    const dx = out.x - xw, dy = out.y - CAR.wheelY;
    if (dx * dx + dy * dy < CAR.archR * CAR.archR) out.y = CAR.wheelY + Math.sqrt(Math.max(0, CAR.archR * CAR.archR - dx * dx));
  }
  return out;
}

/** Hauteur de pavillon (pare-brise, toit, lunette). */
export function roofY(x: number) {
  const belt = topY(x);
  if (x >= CAR.xA) return belt;
  if (x > CAR.xRoofF) { const s = (CAR.xA - x) / (CAR.xA - CAR.xRoofF); return belt + (CAR.roofY - 0.012 - belt) * (1 - Math.pow(1 - s, 1.75)); }
  if (x > CAR.xRoofR) { const s = (CAR.xRoofF - x) / (CAR.xRoofF - CAR.xRoofR); return CAR.roofY - 0.012 + 0.012 * Math.sin(Math.PI * s) - 0.03 * s * s; }
  if (x > CAR.xTail) { const s = (CAR.xRoofR - x) / (CAR.xRoofR - CAR.xTail); return CAR.roofY - 0.042 - (CAR.roofY - 0.042 - belt) * Math.pow(s, 1.5); }
  return belt;
}

/** Point du pavillon (vitrages + toit) : t ∈ [0, π/2] de la ceinture au milieu du toit, z signé par side. */
export function cabinPoint(x: number, t: number, side: 1 | -1, out = new THREE.Vector3()) {
  const yb = topY(x) - 0.004;
  const yr = roofY(x);
  const wb = halfWidth(x) * 0.93 - 0.02;
  const wr = halfWidth(x) * 0.69;
  const m = 3.2;
  const zq = Math.pow(Math.cos(t), 2 / m);
  const yq = Math.pow(Math.sin(t), 2 / m);
  out.set(x, yb + (yr - yb) * yq, side * zq * (wr + (wb - wr) * (1 - yq)));
  return out;
}

export type CabinMaterial = 0 | 1 | 2; // 0 vitrage, 1 peinture, 2 noir brillant

/** Répartition des matériaux du pavillon (pare-brise, vitres, montants, toit). */
export function cabinMaterialAt(x: number, t: number): CabinMaterial {
  const sideGlass = t < 0.92;
  const rail = t >= 0.92 && t <= 1.2;
  if (rail) return x > CAR.xA - 0.03 ? 1 : 1;
  if (sideGlass) {
    if (t < 0.05) return 2; // joint bas de vitre
    if (x > CAR.xA - 0.18) return 1; // pied de montant A
    if (x < -0.29 && x > -0.4) return 2; // montant B
    if (x < -1.3) return 1; // custode (montant C)
    return 0;
  }
  // dessus : pare-brise / toit / lunette
  if (x > CAR.xRoofF + 0.06) return 0;
  if (x < CAR.xRoofR - 0.04) return x < CAR.xTail + 0.12 ? 1 : 0;
  return 2; // toit vitré teinté noir
}

/** Construit une surface paramétrique (grille u × v) avec groupes de matériaux. */
export function gridGeometry(nu: number, nv: number, fn: (u: number, v: number, out: THREE.Vector3) => void, groupOf?: (u: number, v: number) => number, groups = 1) {
  const pos = new Float32Array((nu + 1) * (nv + 1) * 3);
  const uv = new Float32Array((nu + 1) * (nv + 1) * 2);
  const p = new THREE.Vector3();
  for (let i = 0; i <= nu; i++) for (let j = 0; j <= nv; j++) {
    fn(i / nu, j / nv, p);
    const k = i * (nv + 1) + j;
    pos.set([p.x, p.y, p.z], k * 3);
    uv.set([i / nu, j / nv], k * 2);
  }
  const buckets: number[][] = Array.from({ length: groups }, () => []);
  for (let i = 0; i < nu; i++) for (let j = 0; j < nv; j++) {
    const a = i * (nv + 1) + j, b = (i + 1) * (nv + 1) + j, c = (i + 1) * (nv + 1) + j + 1, d = i * (nv + 1) + j + 1;
    const g = groupOf ? groupOf((i + 0.5) / nu, (j + 0.5) / nv) : 0;
    buckets[g].push(a, b, d, b, c, d);
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  geo.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
  const total = buckets.reduce((a, b) => a + b.length, 0);
  const index = new Uint32Array(total);
  let start = 0;
  buckets.forEach((b, g) => { index.set(b, start); geo.addGroup(start, b.length, g); start += b.length; });
  geo.setIndex(new THREE.BufferAttribute(index, 1));
  geo.computeVertexNormals();
  return geo;
}

export function bodyGeometry() {
  const nx = 220, nt = 120;
  return gridGeometry(nx, nt, (u, v, out) => {
    const x = CAR.rearX + (CAR.frontX - CAR.rearX) * u;
    bodyPoint(x, v * Math.PI * 2, out);
  });
}

export function cabinGeometry(side: 1 | -1) {
  const nx = 180, nt = 48;
  const x0 = CAR.xTail, x1 = CAR.xA;
  const tOf = (v: number) => (v * Math.PI) / 2;
  return gridGeometry(
    nx, nt,
    (u, v, out) => {
      const x = x0 + (x1 - x0) * u;
      cabinPoint(x, side === 1 ? tOf(v) : tOf(1 - v), side, out);
    },
    (u, v) => cabinMaterialAt(x0 + (x1 - x0) * u, side === 1 ? tOf(v) : tOf(1 - v)),
    3,
  );
}

/** Ligne échantillonnée sur la caisse (joints d'ouvrants, signature lumineuse…). */
export function curveOnBody(samples: [number, number][], offset = 0.002) {
  const pts: THREE.Vector3[] = [];
  const p = new THREE.Vector3(), q = new THREE.Vector3(), r = new THREE.Vector3();
  for (const [x, t] of samples) {
    bodyPoint(x, t, p);
    bodyPoint(x + 0.002, t, q).sub(p);
    bodyPoint(x, t + 0.002, r).sub(p);
    const nrm = new THREE.Vector3().crossVectors(q, r).normalize();
    if (nrm.dot(new THREE.Vector3(0, p.y - 0.6, p.z).normalize()) < 0) nrm.negate();
    pts.push(p.clone().addScaledVector(nrm, offset));
  }
  return pts;
}

/** Trouve l'angle t de la section x pour lequel la caisse atteint la hauteur y (côté +Z). */
export function tForHeight(x: number, y: number) {
  let lo = -Math.PI / 2, hi = Math.PI / 2;
  const p = new THREE.Vector3();
  for (let i = 0; i < 40; i++) {
    const mid = (lo + hi) / 2;
    bodyPoint(x, mid, p);
    if (p.y < y) lo = mid; else hi = mid;
  }
  return (lo + hi) / 2;
}

/** Pneumatique 205/55 R17 : profil de flanc et sculptures circonférentielles (axe = Z). */
export function tireGeometry() {
  const R = CAR.wheelR, w = CAR.tireW / 2, rim = 0.216;
  const pts: [number, number][] = [
    [rim, -w * 0.82], [rim + 0.012, -w * 0.9], [rim + 0.05, -w * 0.98], [R - 0.05, -w], [R - 0.016, -w * 0.94], [R - 0.004, -w * 0.82],
    [R, -w * 0.72], [R, -w * 0.5], [R - 0.008, -w * 0.48], [R - 0.008, -w * 0.4], [R, -w * 0.38], [R, -w * 0.1], [R - 0.008, -w * 0.08], [R - 0.008, w * 0.02], [R, w * 0.04],
    [R, w * 0.36], [R - 0.008, w * 0.38], [R - 0.008, w * 0.46], [R, w * 0.48], [R, w * 0.72], [R - 0.004, w * 0.82], [R - 0.016, w * 0.94], [R - 0.05, w], [rim + 0.05, w * 0.98], [rim + 0.012, w * 0.9], [rim, w * 0.82],
  ];
  const g = new THREE.LatheGeometry(pts.map(([r, y]) => new THREE.Vector2(r, y)), 96);
  g.rotateX(Math.PI / 2);
  return g;
}

/** Jante originale : 5 branches doubles, voile légèrement concave. */
export function rimGeometry() {
  const R = 0.214;
  const barrel = new THREE.CylinderGeometry(R, R, 0.19, 64, 1, true);
  barrel.rotateX(Math.PI / 2);
  const lipPts = [new THREE.Vector2(R - 0.004, 0.0), new THREE.Vector2(R + 0.006, 0.006), new THREE.Vector2(R + 0.006, 0.016), new THREE.Vector2(R - 0.012, 0.02)];
  const lip = new THREE.LatheGeometry(lipPts, 64);
  lip.rotateX(-Math.PI / 2);
  const face = new THREE.Shape();
  face.absarc(0, 0, R - 0.006, 0, Math.PI * 2, false);
  const N = 5;
  for (let i = 0; i < N; i++) {
    const a0 = (i / N) * Math.PI * 2;
    // deux ouvertures par branche double
    for (const [a, b] of [[0.08, 0.5], [0.66, 1.1]] as const) {
      const hole = new THREE.Path();
      const r0 = 0.075, r1 = R - 0.026;
      const s0 = a0 + a, s1 = a0 + b;
      hole.moveTo(Math.cos(s0) * r0, Math.sin(s0) * r0);
      hole.lineTo(Math.cos(s0 - 0.07) * r1, Math.sin(s0 - 0.07) * r1);
      hole.absarc(0, 0, r1, s0 - 0.07, s1 + 0.07, false);
      hole.lineTo(Math.cos(s1) * r0 * 1.05, Math.sin(s1) * r0 * 1.05);
      hole.absarc(0, 0, r0 * 1.05, s1, s0, true);
      face.holes.push(hole);
    }
  }
  const faceGeo = new THREE.ExtrudeGeometry(face, { depth: 0.022, bevelEnabled: true, bevelThickness: 0.006, bevelSize: 0.005, bevelSegments: 2, curveSegments: 48 });
  const hub = new THREE.CylinderGeometry(0.065, 0.07, 0.03, 40);
  hub.rotateX(Math.PI / 2);
  return { barrel, lip, faceGeo, hub };
}

/** Abscisse de la face avant (front) ou arrière de la caisse à la hauteur y et à la demi-largeur z. */
export function faceX(y: number, z: number, front: boolean) {
  const p = new THREE.Vector3();
  const zs = (x: number) => { const t = tForHeight(x, y); bodyPoint(x, t, p); return Math.abs(p.y - y) < 0.03 ? Math.abs(p.z) : 0; };
  let lo = front ? 1.2 : CAR.rearX, hi = front ? CAR.frontX : -1.2;
  for (let k = 0; k < 40; k++) {
    const mid = (lo + hi) / 2;
    const inside = zs(mid) > Math.abs(z);
    if (front) { if (inside) lo = mid; else hi = mid; } else { if (inside) hi = mid; else lo = mid; }
  }
  return front ? lo : hi;
}
