// Procedural pomegranate tree for the planting scene.
// Every part carries a start time on a single growth scale G (0 → 1), so one number drives
// root, sprout, sapling and the full tree, and the growth can be scrubbed forwards and back.

export const GROUND_Y = 578;
export const BASE_X = 400;
export const SEED_POS = { x: 400, y: 662 };

// Growth milestones on the G scale.
export const G_SPROUT = 0.07; // end of watering
export const G_SAPLING = 0.24; // end of sunlight

function seeded(seed) {
  let value = seed;
  return () => {
    value = (value * 16807) % 2147483647;
    return (value - 1) / 2147483646;
  };
}

const rad = (deg) => (deg * Math.PI) / 180;

export function quadPoint(b, u) {
  const v = 1 - u;
  return {
    x: v * v * b.x0 + 2 * v * u * b.cx + u * u * b.x1,
    y: v * v * b.y0 + 2 * v * u * b.cy + u * u * b.y1,
  };
}

function quadAngle(b, u) {
  const dx = 2 * (1 - u) * (b.cx - b.x0) + 2 * u * (b.x1 - b.cx);
  const dy = 2 * (1 - u) * (b.cy - b.y0) + 2 * u * (b.y1 - b.cy);
  return (Math.atan2(dy, dx) * 180) / Math.PI;
}

export function buildTree() {
  const random = seeded(20261028);
  const branches = [];
  const leaves = [];
  const tips = [];

  const addLeaves = (b, count, from, to, sizeBase, drop) => {
    for (let k = 0; k < count; k += 1) {
      const u = from + ((to - from) * (k + 0.5)) / count + (random() - 0.5) * 0.06;
      const p = quadPoint(b, u);
      const side = k % 2 === 0 ? 1 : -1;
      leaves.push({
        x: p.x,
        y: p.y,
        angle: quadAngle(b, u) + side * (38 + random() * 28),
        size: sizeBase * (0.78 + random() * 0.45),
        t: b.t0 + b.dur * u + 0.008,
        tone: Math.floor(random() * 3),
        flutter: random() < 0.3,
        drop,
      });
    }
  };

  const addBranch = ({ x, y, angle, len, width, depth, t0, dur }) => {
    let length = len;
    let x1;
    let y1;
    for (let tries = 0; tries < 6; tries += 1) {
      x1 = x + Math.cos(rad(angle)) * length;
      y1 = y + Math.sin(rad(angle)) * length;
      if (y1 > 60 && x1 > 70 && x1 < 730) break;
      length *= 0.8;
    }
    const bend = (random() - 0.5) * 0.36 * length;
    const mx = (x + x1) / 2;
    const my = (y + y1) / 2;
    const nx = -Math.sin(rad(angle));
    const ny = Math.cos(rad(angle));
    const b = { id: branches.length, x0: x, y0: y, cx: mx + nx * bend, cy: my + ny * bend, x1, y1, width, depth, t0, dur };
    branches.push(b);

    // The sapling's leaves on the trunk drop once the crown takes over.
    if (depth === 0) addLeaves(b, 6, 0.3, 0.95, 1.05, 0.56);
    else addLeaves(b, depth === 1 ? 4 : 6, 0.25, 0.97, 1.25);

    if (depth < 4) {
      const n = depth === 0 ? 3 : depth < 3 && random() < 0.35 ? 3 : 2;
      const spread = depth === 0 ? 44 : depth === 1 ? 34 : 26;
      for (let i = 0; i < n; i += 1) {
        const offset = n === 1 ? 0 : (i / (n - 1) - 0.5) * 2 * spread;
        let childAngle = angle + offset + (random() - 0.5) * 16;
        childAngle += (-90 - childAngle) * 0.12; // keep the crown rising and rounded
        addBranch({
          x: x1,
          y: y1,
          angle: childAngle,
          len: length * (depth === 0 ? 0.74 : 0.8) * (0.85 + random() * 0.3),
          width: width * 0.62,
          depth: depth + 1,
          t0: t0 + dur * 0.86,
          dur: dur * 0.8,
        });
      }
    } else {
      tips.push({ x: x1, y: y1, angle, t: t0 + dur });
      for (let k = 0; k < 5; k += 1) {
        leaves.push({
          x: x1,
          y: y1,
          angle: angle + (k - 2) * 34 + (random() - 0.5) * 14,
          size: 1.1 + random() * 0.5,
          t: t0 + dur + 0.006 * k,
          tone: Math.floor(random() * 3),
          flutter: random() < 0.4,
        });
      }
    }
  };

  addBranch({ x: BASE_X, y: GROUND_Y, angle: -90, len: 168, width: 21, depth: 0, t0: 0.035, dur: 0.3 });

  // Blossoms open on some tips, then fall and give way to fruit.
  const blossoms = tips
    .filter((_, i) => i % 3 === 1)
    .map((tip, i) => ({
      ...tip,
      bloom: Math.min(0.86, tip.t + 0.015),
      fruit: 0.885 + (i % 4) * 0.02,
      size: 0.9 + (i % 3) * 0.15,
    }));

  const cotyledons = [-1, 1].map((side) => ({ side, t: 0.045 }));

  const roots = [
    { d: `M${SEED_POS.x} ${SEED_POS.y + 6}C398 700 404 738 396 790`, t0: 0.0, dur: 0.06, width: 2.6 },
    { d: 'M399 696C386 706 372 712 352 716', t0: 0.04, dur: 0.12, width: 1.6 },
    { d: 'M400 714C414 726 430 732 452 734', t0: 0.06, dur: 0.14, width: 1.6 },
    { d: 'M398 744C384 758 366 766 340 772', t0: 0.12, dur: 0.18, width: 1.3 },
    { d: 'M397 762C410 778 428 788 456 794', t0: 0.16, dur: 0.2, width: 1.2 },
    { d: 'M352 716C342 726 334 738 330 752', t0: 0.2, dur: 0.18, width: 0.9 },
    { d: 'M452 734C462 744 468 756 470 770', t0: 0.24, dur: 0.18, width: 0.9 },
  ];

  return { branches, leaves, blossoms, cotyledons, roots };
}

export const branchPath = (b) => `M${b.x0.toFixed(1)} ${b.y0.toFixed(1)}Q${b.cx.toFixed(1)} ${b.cy.toFixed(1)} ${b.x1.toFixed(1)} ${b.y1.toFixed(1)}`;

export const clamp01 = (v) => Math.min(1, Math.max(0, v));
export const smooth = (v) => {
  const t = clamp01(v);
  return t * t * (3 - 2 * t);
};
export const easeOutBack = (v) => {
  const t = clamp01(v);
  const c = 1.6;
  return 1 + (c + 1) * (t - 1) ** 3 + c * (t - 1) ** 2;
};
