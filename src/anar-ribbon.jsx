import React, { useId, useLayoutEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const FRUIT_W = 440;
const FRUIT_H = 520;
const BAND_W = 44; // ribbon width in fruit units
const reduceMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const fmt = (n) => n.toFixed(1);

// ---------- geometry helpers ----------

function catmullRom(points, steps = 40) {
  const out = [];
  for (let i = 0; i < points.length - 1; i += 1) {
    const p0 = points[i - 1] || points[i];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[i + 2] || p2;
    for (let s = 0; s < steps; s += 1) {
      const t = s / steps;
      const t2 = t * t;
      const t3 = t2 * t;
      out.push({
        x: 0.5 * (2 * p1.x + (-p0.x + p2.x) * t + (2 * p0.x - 5 * p1.x + 4 * p2.x - p3.x) * t2 + (-p0.x + 3 * p1.x - 3 * p2.x + p3.x) * t3),
        y: 0.5 * (2 * p1.y + (-p0.y + p2.y) * t + (2 * p0.y - 5 * p1.y + 4 * p2.y - p3.y) * t2 + (-p0.y + 3 * p1.y - 3 * p2.y + p3.y) * t3),
      });
    }
  }
  out.push(points[points.length - 1]);
  return out;
}

function quadratic(a, c, b, steps = 80) {
  return Array.from({ length: steps + 1 }, (_, i) => {
    const t = i / steps;
    const u = 1 - t;
    return { x: u * u * a.x + 2 * u * t * c.x + t * t * b.x, y: u * u * a.y + 2 * u * t * c.y + t * t * b.y };
  });
}

// Resample a polyline at an even spacing and attach arc length, tangent and normal to every sample.
function resample(raw, spacing) {
  const lengths = [0];
  for (let i = 1; i < raw.length; i += 1) lengths.push(lengths[i - 1] + Math.hypot(raw[i].x - raw[i - 1].x, raw[i].y - raw[i - 1].y));
  const total = lengths[lengths.length - 1];
  const count = Math.max(2, Math.round(total / spacing));
  const pts = [];
  let j = 1;
  for (let k = 0; k <= count; k += 1) {
    const s = (k / count) * total;
    while (j < lengths.length - 1 && lengths[j] < s) j += 1;
    const span = lengths[j] - lengths[j - 1] || 1;
    const t = (s - lengths[j - 1]) / span;
    pts.push({ x: raw[j - 1].x + (raw[j].x - raw[j - 1].x) * t, y: raw[j - 1].y + (raw[j].y - raw[j - 1].y) * t, s });
  }
  pts.forEach((p, i) => {
    const a = pts[Math.max(0, i - 1)];
    const b = pts[Math.min(pts.length - 1, i + 1)];
    const len = Math.hypot(b.x - a.x, b.y - a.y) || 1;
    p.tx = (b.x - a.x) / len;
    p.ty = (b.y - a.y) / len;
    p.nx = -p.ty;
    p.ny = p.tx;
    p.i = i;
  });
  return { pts, total };
}

// ---------- ribbon renderer ----------

// Ikat palette: each block along the peel picks one of these colourways, as hand-dyed ikat shifts colour along its length.
const COLOURWAYS = [
  { ground: '#1b3a80', outer: '#e9b441', middle: '#b8262f', core: '#1f8a78', dot: '#f6ecd6' },
  { ground: '#8c1b26', outer: '#f0c95e', middle: '#1b3a80', core: '#e9b441', dot: '#f6ecd6' },
  { ground: '#17705f', outer: '#f2d27a', middle: '#b8262f', core: '#1b3a80', dot: '#f6ecd6' },
  { ground: '#1b3a80', outer: '#2a9a84', middle: '#f0c95e', core: '#b8262f', dot: '#f6ecd6' },
];

function strip(points, factor, width, shift = 0) {
  const left = [];
  const right = [];
  points.forEach((p) => {
    const half = (width / 2) * p.wm * p.f * factor;
    const c = (width / 2) * p.wm * p.f * shift;
    left.push(`${fmt(p.x + p.nx * (c + half))},${fmt(p.y + p.ny * (c + half))}`);
    right.push(`${fmt(p.x + p.nx * (c - half))},${fmt(p.y + p.ny * (c - half))}`);
  });
  return [...left, ...right.reverse()].join(' ');
}

function line(points, width, offset) {
  return points.map((p) => {
    const o = (width / 2) * p.wm * p.f * offset;
    return `${fmt(p.x + p.nx * o)},${fmt(p.y + p.ny * o)}`;
  }).join(' ');
}

// Ikat motifs have stepped, "bleeding" outlines where the dyed threads never line up exactly.
function steppedDiamond(lx, ly, steps = 5) {
  const quarter = [];
  for (let i = 0; i <= steps; i += 1) {
    const x = lx * (1 - i / steps);
    const y = ly * (i / steps);
    if (i > 0) quarter.push([x, quarter[quarter.length - 1][1]]);
    quarter.push([x, y]);
  }
  const pts = [
    ...quarter.map(([x, y]) => [x, -y]),
    ...quarter.slice().reverse().map(([x, y]) => [-x, -y]),
    ...quarter.map(([x, y]) => [-x, y]),
    ...quarter.slice().reverse().map(([x, y]) => [x, y]),
  ];
  return `M${pts.map(([x, y]) => `${fmt(x)} ${fmt(y)}`).join('L')}Z`;
}

function boteh(l, h) {
  return `M${fmt(-l)} ${fmt(h * 0.15)}C${fmt(-l)} ${fmt(-h)} ${fmt(l * 0.7)} ${fmt(-h * 1.05)} ${fmt(l)} ${fmt(-h * 0.1)}C${fmt(l * 1.1)} ${fmt(h * 0.5)} ${fmt(l * 0.4)} ${fmt(h * 0.9)} ${fmt(-l * 0.2)} ${fmt(h * 0.8)}C${fmt(-l * 0.6)} ${fmt(h * 0.75)} ${fmt(-l * 0.9)} ${fmt(h * 0.6)} ${fmt(-l)} ${fmt(h * 0.15)}Z`;
}

function IkatMotif({ kind, colours, length, half }) {
  if (kind === 0) {
    return (
      <>
        <path d={steppedDiamond(length * 0.62, half * 1.06, 6)} fill={colours.outer} opacity="0.35" />
        <path d={steppedDiamond(length * 0.55, half * 0.94, 6)} fill={colours.outer} />
        <path d={steppedDiamond(length * 0.38, half * 0.64, 5)} fill={colours.middle} />
        <path d={steppedDiamond(length * 0.22, half * 0.36, 3)} fill={colours.core} />
        <path d={steppedDiamond(length * 0.08, half * 0.13, 2)} fill={colours.dot} />
        {[-1, 1].map((side) => (
          <path key={side} d={`M${fmt(side * length * 0.6)} 0L${fmt(side * length * 0.82)} ${fmt(-half * 0.42)}L${fmt(side * length * 0.74)} 0L${fmt(side * length * 0.82)} ${fmt(half * 0.42)}Z`} fill={colours.middle} opacity="0.9" />
        ))}
      </>
    );
  }
  return (
    <>
      <path d={boteh(length * 0.6, half * 0.98)} fill={colours.outer} opacity="0.35" />
      <path d={boteh(length * 0.54, half * 0.86)} fill={colours.outer} />
      <path d={boteh(length * 0.38, half * 0.6)} fill={colours.middle} />
      <path d={boteh(length * 0.2, half * 0.32)} fill={colours.core} />
      <circle cx={fmt(-length * 0.04)} r={fmt(half * 0.1)} fill={colours.dot} />
      {[-0.42, 0.42].map((y) => (
        <path key={y} d={steppedDiamond(length * 0.08, half * 0.1, 2)} transform={`translate(${fmt(length * 0.72)} ${fmt(y * half * 1.4)})`} fill={colours.outer} />
      ))}
    </>
  );
}

// `twists` are fractions along the ribbon where it flips once over, briefly showing the pale inner peel.
// `grow` widens the loose peel after `growFrom`; `taper` narrows the very start so it seems to wrap round the fruit.
function buildRibbon(pts, total, width, { twists = [], grow = 0, growFrom = 0, taper = 0 } = {}) {
  const zone = 0.07;
  pts.forEach((p) => {
    const t = p.s / total;
    let c = 1;
    twists.forEach((centre) => {
      const u = (t - centre + zone) / (zone * 2);
      if (u > 0 && u < 1) c = Math.cos(u * Math.PI * 2);
    });
    if (taper) {
      const k = Math.min(1, t / taper);
      c *= 0.2 + 0.8 * Math.sin((k * Math.PI) / 2);
    }
    p.front = c >= 0;
    p.f = Math.max(Math.abs(c), 0.07);
    p.wm = 1 + grow * Math.min(1, Math.max(0, (t - growFrom) / 0.1)) ** 1.5;
  });

  const runs = [];
  pts.forEach((p, i) => {
    const last = runs[runs.length - 1];
    if (!last || last.front !== p.front) {
      const run = { front: p.front, points: i > 0 ? [pts[i - 1]] : [] };
      run.points.push(p);
      runs.push(run);
    } else {
      last.points.push(p);
    }
  });

  // Colour blocks: the ground changes colourway every few motifs, like separately dyed lengths of ikat.
  const blocks = [];
  const motifs = [];
  let s = 0;
  let index = 0;
  const at = (distance) => pts[Math.min(pts.length - 1, Math.round((distance / total) * (pts.length - 1)))];
  while (s < total) {
    const p = at(s);
    const length = width * p.wm * 1.25;
    const colours = COLOURWAYS[Math.floor(index / 3) % COLOURWAYS.length];
    const startIndex = Math.round((s / total) * (pts.length - 1));
    const endIndex = Math.min(pts.length - 1, Math.round(((s + length) / total) * (pts.length - 1)));
    const previous = blocks[blocks.length - 1];
    if (previous && previous.colours === colours) previous.to = endIndex;
    else blocks.push({ from: startIndex, to: endIndex, colours });
    const centre = at(s + length / 2);
    if (centre.front && centre.f > 0.28) {
      motifs.push({
        x: centre.x,
        y: centre.y,
        angle: (Math.atan2(centre.ty, centre.tx) * 180) / Math.PI,
        f: centre.f,
        length,
        half: (width / 2) * centre.wm * 0.78,
        kind: index % 2,
        colours,
        i: centre.i,
      });
    }
    s += length;
    index += 1;
  }

  const shades = [];
  for (let i = 0; i < pts.length - 1; i += 1) {
    const alpha = (1 - Math.min(pts[i].f, pts[i + 1].f)) ** 1.6 * 0.6;
    if (alpha > 0.04) shades.push({ points: strip([pts[i], pts[i + 1]], 1, width), alpha, i });
  }

  return { runs, blocks, motifs, shades };
}

function FrontRun({ run, width, blocks, allPts }) {
  const first = run.points[0].i;
  const last = run.points[run.points.length - 1].i;
  return (
    <>
      <polygon points={strip(run.points, 1, width)} fill="#5e0c16" />
      <polygon points={strip(run.points, 0.93, width)} fill="#f3e6cc" />
      {blocks.filter((b) => b.to >= first && b.from <= last).map((b) => {
        const seg = allPts.slice(Math.max(b.from, first), Math.min(b.to + 1, last) + 1);
        return seg.length > 1 ? <polygon key={b.from} points={strip(seg, 0.86, width)} fill={b.colours.ground} stroke={b.colours.ground} strokeWidth="0.6" /> : null;
      })}
    </>
  );
}

function RunTexture({ run, width, front }) {
  return (
    <>
      {[-0.55, 0, 0.55].map((offset) => (
        <polyline key={offset} points={line(run.points, width, offset)} fill="none" stroke={front ? '#fff' : '#8a6a3c'} strokeOpacity={front ? 0.07 : 0.16} strokeWidth="0.7" />
      ))}
      <polygon points={strip(run.points, 0.24, width, 0.76)} fill="#000" opacity={front ? 0.2 : 0.12} />
      <polygon points={strip(run.points, 0.24, width, -0.76)} fill="#000" opacity={front ? 0.12 : 0.06} />
      <polygon points={strip(run.points, 0.3, width, -0.18)} fill="#fff" opacity={front ? 0.08 : 0.25} />
    </>
  );
}

// Renders the part of a built ribbon between sample indices `from` and `to`.
function RibbonParts({ data, pts, width, from = 0, to = pts.length - 1 }) {
  const runs = data.runs
    .map((run) => ({ ...run, points: run.points.filter((p) => p.i >= from && p.i <= to) }))
    .filter((run) => run.points.length > 1);
  return (
    <>
      {runs.map((run, i) => (
        <g key={i}>
          {run.front
            ? <FrontRun run={run} width={width} blocks={data.blocks} allPts={pts} />
            : (
              <>
                <polygon points={strip(run.points, 1, width)} fill="#5e0c16" />
                <polygon points={strip(run.points, 0.93, width)} fill="#e8d6b2" />
              </>
            )}
        </g>
      ))}
      {data.motifs.filter((m) => m.i >= from && m.i < to).map((m) => (
        <g key={m.i} transform={`translate(${fmt(m.x)} ${fmt(m.y)}) rotate(${fmt(m.angle)}) scale(1 ${fmt(m.f)})`}>
          <IkatMotif kind={m.kind} colours={m.colours} length={m.length} half={m.half} />
        </g>
      ))}
      {runs.map((run, i) => <RunTexture key={i} run={run} width={width} front={run.front} />)}
      {data.shades.filter((shade) => shade.i >= from && shade.i < to).map((shade) => (
        <polygon key={shade.i} points={shade.points} fill="#1a0306" opacity={fmt(shade.alpha)} />
      ))}
    </>
  );
}

function Ribbon({ pts, total, width, ...options }) {
  return <g className="ribbon"><RibbonParts data={buildRibbon(pts, total, width, options)} pts={pts} width={width} /></g>;
}

// ---------- the pomegranate ----------

const BODY = 'M220 118C312 112 382 176 384 268 386 362 316 430 220 432 124 430 54 362 56 268 58 176 128 112 220 118Z';
const SEED_STRIPS = [
  { a: { x: 64, y: 198 }, c: { x: 220, y: 262 }, b: { x: 376, y: 198 } },
  { a: { x: 58, y: 290 }, c: { x: 220, y: 358 }, b: { x: 382, y: 290 } },
];
const BANDS = [
  { a: { x: 50, y: 238 }, c: { x: 220, y: 306 }, b: { x: 390, y: 238 } },
  { a: { x: 46, y: 330 }, c: { x: 220, y: 398 }, b: { x: 394, y: 330 } },
];
export const BAND_END = { x: 394, y: 330, dx: 394 - 220, dy: 330 - 398 };

function seededRandom(seed) {
  let value = seed;
  return () => {
    value = (value * 9301 + 49297) % 233280;
    return value / 233280;
  };
}

function Arils({ strip: s, seed }) {
  const random = seededRandom(seed);
  const { pts } = resample(quadratic(s.a, s.c, s.b), 10.5);
  const arils = [];
  pts.forEach((p, i) => {
    [-10, 0, 10].forEach((offset, row) => {
      if (row === 1 && random() < 0.35) return;
      const jitter = (random() - 0.5) * 4.5;
      const angle = (Math.atan2(p.ny, p.nx) * 180) / Math.PI + 90 + (random() - 0.5) * 30;
      arils.push({ x: p.x + p.nx * (offset + jitter) + (row - 1) * 4 + (random() - 0.5) * 4, y: p.y + p.ny * (offset + jitter), angle, size: 0.8 + random() * 0.5, key: `${i}-${row}` });
    });
  });
  return arils;
}

function Pomegranate({ uid }) {
  const url = (name) => `url(#${uid}-${name})`;
  // Only the upper band lives here; the lower one is drawn as the start of the moving peel so the two are one piece.
  const upperBand = resample(quadratic(BANDS[0].a, BANDS[0].c, BANDS[0].b), 5);
  const leaves = [
    { d: 'M0 0C22-18 66-22 108-6 72 12 32 14 0 0Z', transform: 'translate(270 82) rotate(-48)' },
    { d: 'M0 0C22-16 62-18 102-2 68 14 30 14 0 0Z', transform: 'translate(292 96) rotate(-12)' },
    { d: 'M0 0C20-14 56-16 92 0 60 14 26 14 0 0Z', transform: 'translate(300 104) rotate(26)' },
  ];

  return (
    <svg className="anar-fruit" viewBox={`0 0 ${FRUIT_W} ${FRUIT_H}`} aria-hidden="true" focusable="false">
      <defs>
        <radialGradient id={`${uid}-skin`} cx="36%" cy="30%" r="78%">
          <stop offset="0" stopColor="#e8564f" />
          <stop offset="0.35" stopColor="#c02a34" />
          <stop offset="0.72" stopColor="#8a1522" />
          <stop offset="1" stopColor="#4d0912" />
        </radialGradient>
        <radialGradient id={`${uid}-rim`} cx="50%" cy="48%" r="52%">
          <stop offset="0.7" stopColor="#2a0409" stopOpacity="0" />
          <stop offset="1" stopColor="#2a0409" stopOpacity="0.55" />
        </radialGradient>
        <radialGradient id={`${uid}-aril`} cx="36%" cy="30%" r="80%">
          <stop offset="0" stopColor="#ffb9b0" />
          <stop offset="0.25" stopColor="#f0435a" />
          <stop offset="0.7" stopColor="#a8102c" />
          <stop offset="1" stopColor="#5c0516" />
        </radialGradient>
        <linearGradient id={`${uid}-neck`} x1="0" x2="1">
          <stop offset="0" stopColor="#6e0f1b" />
          <stop offset="0.45" stopColor="#b42a33" />
          <stop offset="1" stopColor="#5a0b16" />
        </linearGradient>
        <linearGradient id={`${uid}-sepal`} x1="0" y1="1" x2="0" y2="0">
          <stop offset="0" stopColor="#9a2a22" />
          <stop offset="1" stopColor="#d98848" />
        </linearGradient>
        <linearGradient id={`${uid}-leaf`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#6b7c3a" />
          <stop offset="0.6" stopColor="#8f9b4a" />
          <stop offset="1" stopColor="#a8693a" />
        </linearGradient>
        <clipPath id={`${uid}-body`}><path d={BODY} /></clipPath>
        <clipPath id={`${uid}-wrap`}><path d={BODY} transform="translate(220 275) scale(1.045) translate(-220 -275)" /></clipPath>
        <filter id={`${uid}-grain`} x="0" y="0" width="100%" height="100%">
          <feTurbulence type="fractalNoise" baseFrequency="0.9 0.35" numOctaves="3" seed="7" />
          <feColorMatrix values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 0.6 0" />
        </filter>
        <filter id={`${uid}-blur`} x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="9" /></filter>
        <filter id={`${uid}-shadow`} x="-20%" y="-20%" width="140%" height="160%"><feGaussianBlur stdDeviation="14" /></filter>
      </defs>

      <ellipse cx="226" cy="478" rx="150" ry="20" fill="#021c1f" opacity="0.45" filter={url('shadow')} />

      {/* body */}
      <path d={BODY} fill={url('skin')} />
      <g clipPath={url('body')}>
        <rect width={FRUIT_W} height={FRUIT_H} filter={url('grain')} opacity="0.28" style={{ mixBlendMode: 'multiply' }} />
        <path d={BODY} fill={url('rim')} />
        <ellipse cx="150" cy="168" rx="58" ry="30" fill="#ffd7cc" opacity="0.32" transform="rotate(-30 150 168)" filter={url('blur')} />
        <ellipse cx="300" cy="400" rx="70" ry="26" fill="#ff7a6a" opacity="0.12" transform="rotate(-28 300 400)" filter={url('blur')} />

        {/* opened strips with seeds */}
        {SEED_STRIPS.map((s, i) => {
          const d = `M${s.a.x} ${s.a.y}Q${s.c.x} ${s.c.y} ${s.b.x} ${s.b.y}`;
          return (
            <g key={i}>
              <path d={d} fill="none" stroke="#f1dcbb" strokeWidth="44" />
              <path d={d} fill="none" stroke="#4a0711" strokeWidth="36" />
              {Arils({ strip: s, seed: 11 + i * 7 }).map((a) => (
                <g key={a.key} transform={`translate(${fmt(a.x)} ${fmt(a.y)}) rotate(${fmt(a.angle)}) scale(${fmt(a.size)})`}>
                  <path d="M0-9.5C6-8 8.2-1 6.4 4.6 4.6 9-4.6 9-6.4 4.6-8.2-1-6-8 0-9.5Z" fill={url('aril')} stroke="#3d040d" strokeWidth="0.7" />
                  <ellipse cx="-2.2" cy="-3.4" rx="1.6" ry="2.6" fill="#fff" opacity="0.75" transform="rotate(-20)" />
                </g>
              ))}
              <path d={`M${s.a.x} ${s.a.y - 21}Q${s.c.x} ${s.c.y - 21} ${s.b.x} ${s.b.y - 21}`} fill="none" stroke="#f6e7cc" strokeWidth="3" />
              <path d={`M${s.a.x} ${s.a.y - 24}Q${s.c.x} ${s.c.y - 24} ${s.b.x} ${s.b.y - 24}`} fill="none" stroke="#5a0a14" strokeWidth="2" opacity="0.6" />
            </g>
          );
        })}
      </g>

      {/* ikat peel wrapped around the fruit */}
      <g clipPath={url('wrap')}>
        <Ribbon pts={upperBand.pts} total={upperBand.total} width={BAND_W} />
      </g>

      {/* crown */}
      <path d="M190 132C194 112 194 98 186 84H254C246 98 246 112 250 132 236 138 204 138 190 132Z" fill={url('neck')} />
      {[-62, -36, -12, 12, 36, 62].map((angle) => (
        <path key={angle} d="M-9 0C-8-14-4-28 0-40 4-28 8-14 9 0Z" fill={url('sepal')} stroke="#6e1a14" strokeWidth="0.8" transform={`translate(${220 + angle * 0.42} 88) rotate(${angle * 0.75})`} />
      ))}
      <ellipse cx="220" cy="86" rx="24" ry="7" fill="#3a0a0c" />
      {[-14, -8, -3, 3, 8, 14, -11, 0, 11].map((x, i) => (
        <g key={i}>
          <line x1={220 + x * 0.6} y1="86" x2={220 + x} y2={i > 5 ? 74 : 78} stroke="#c7a24a" strokeWidth="1" />
          <circle cx={220 + x} cy={i > 5 ? 73 : 77} r="1.8" fill="#e6c467" />
        </g>
      ))}

      {/* leaves */}
      <path d="M244 108C258 98 276 90 302 98" fill="none" stroke="#5b4526" strokeWidth="3" strokeLinecap="round" />
      {leaves.map((leaf) => (
        <g key={leaf.transform} transform={leaf.transform} className="anar-leaf">
          <path d={leaf.d} fill={url('leaf')} stroke="#4d5a26" strokeWidth="0.8" />
          <path d="M2 0C30-3 62-4 96-3" fill="none" stroke="#d4d79a" strokeWidth="1.1" opacity="0.8" />
        </g>
      ))}
    </svg>
  );
}

// ---------- section ----------

function TrailSeed({ x, y, angle, uid }) {
  return (
    <g className="trail-seed" transform={`translate(${fmt(x)} ${fmt(y)}) rotate(${fmt(angle)})`}>
      <g className="trail-seed-inner">
        <path d="M0-12C8-10 10.5-1 8.2 5.8 6 11.5-6 11.5-8.2 5.8-10.5-1-8-10 0-12Z" fill={`url(#${uid}-trail-aril)`} stroke="#3d040d" strokeWidth="0.8" />
        <ellipse cx="-2.8" cy="-4.2" rx="2" ry="3.2" fill="#fff" opacity="0.75" transform="rotate(-20)" />
      </g>
    </g>
  );
}

const chapters = [
  {
    eyebrow: 'Our emblem · انار',
    title: 'Why a pomegranate.',
    body: 'The pomegranate in our emblem is no decoration. In Persia the anar has stood for abundance, generosity and new beginnings for thousands of years. It is what we want every evening at DAYA to feel like.',
  },
  {
    title: 'Woven into the room.',
    body: 'Like a Persian carpet, DAYA is made of many threads: turquoise tile, aged brass, woven textiles, candlelight and music. Each one carries a little of Persia to the island.',
  },
  {
    title: 'Opened to share.',
    body: 'A pomegranate is never eaten alone. It is broken open and passed around the table, the way every plate at DAYA arrives in the middle of the table, ready to be shared.',
  },
];

export function AnarRibbonSection() {
  const sectionRef = useRef(null);
  const anchorRef = useRef(null);
  const rowRefs = useRef([]);
  const trailRef = useRef(null);
  const uid = useId().replace(/[^a-zA-Z0-9_-]/g, '');
  const [layout, setLayout] = useState(null);

  useLayoutEffect(() => {
    const section = sectionRef.current;
    const measure = () => {
      const box = section.getBoundingClientRect();
      const rel = (el) => {
        const r = el.getBoundingClientRect();
        return { left: r.left - box.left, top: r.top - box.top, width: r.width, height: r.height, bottom: r.bottom - box.top };
      };
      const anchor = rel(anchorRef.current);
      const rows = rowRefs.current.map(rel);
      setLayout({ w: box.width, h: box.height, anchor, rows, mobile: box.width < 760 });
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(section);
    return () => observer.disconnect();
  }, []);

  let trail = null;
  if (layout) {
    const { w, h, anchor, rows, mobile } = layout;
    const scale = anchor.width / FRUIT_W;
    const start = { x: anchor.left + BAND_END.x * scale, y: anchor.top + BAND_END.y * scale };
    const dirLen = Math.hypot(BAND_END.dx, BAND_END.dy);
    const lead = { x: start.x + (BAND_END.dx / dirLen) * 60 * scale, y: start.y + (BAND_END.dy / dirLen) * 60 * scale };
    const [r1, r2, r3, r4] = rows;
    const mid = (r) => r.top + r.height / 2;
    // On phones the peel runs off-screen beside the text and only crosses the screen in the gaps between chapters.
    const gap = (r) => r.bottom - 150;
    const textEnd = (r) => r.bottom - 270;
    const waypoints = mobile
      ? [
        start, lead,
        { x: w + 50, y: anchor.top + anchor.height * 0.95 },
        { x: w + 60, y: textEnd(r1) },
        { x: w * 0.55, y: gap(r1) - 30 },
        { x: w * 0.1, y: gap(r1) + 30 },
        { x: -60, y: r2.top + 40 },
        { x: -60, y: textEnd(r2) },
        { x: w * 0.45, y: gap(r2) - 30 },
        { x: w * 0.9, y: gap(r2) + 30 },
        { x: w + 60, y: r3.top + 40 },
        { x: w + 60, y: textEnd(r3) },
        { x: w * 0.55, y: gap(r3) - 20 },
        { x: w * 0.4, y: h + 100 },
        { x: w * 0.45, y: h + 300 },
      ]
      : [
        start, lead,
        { x: Math.min(w - 40, start.x + 130 * scale), y: start.y + 40 * scale },
        { x: anchor.left + anchor.width * 0.55, y: r1.bottom - 20 },
        { x: w * 0.3, y: r2.top + r2.height * 0.25 },
        { x: w * 0.2, y: mid(r2) + 40 },
        { x: w * 0.42, y: r2.bottom - 10 },
        { x: w * 0.76, y: r3.top + r3.height * 0.4 },
        { x: w * 0.7, y: r3.bottom - 30 },
        // The peel runs on underneath the menu section instead of stopping in mid-air.
        { x: w * 0.6, y: r4.top + 20 },
        { x: w * 0.52, y: h + 120 },
        { x: w * 0.5, y: h + 320 },
      ];
    const width = BAND_W * scale;
    const toPx = (p) => ({ x: anchor.left + p.x * scale, y: anchor.top + p.y * scale });
    const band = quadratic(toPx(BANDS[1].a), toPx(BANDS[1].c), toPx(BANDS[1].b), 60);
    const bandLength = band.reduce((sum, p, i) => (i ? sum + Math.hypot(p.x - band[i - 1].x, p.y - band[i - 1].y) : 0), 0);
    const { pts, total } = resample([...band.slice(0, -1), ...catmullRom(waypoints, 36)], 7);
    const seeds = [0.24, 0.31, 0.52, 0.6, 0.76, 0.84].map((fraction, i) => {
      const p = pts[Math.round(fraction * (pts.length - 1))];
      const side = i % 2 === 0 ? 1 : -1;
      return { fraction, x: p.x + p.nx * side * (width * 1.3 + 14), y: p.y + p.ny * side * (width * 1.3 + 14), angle: (i * 47) % 360 };
    });
    // Where the peel starts, it disappears behind the left edge of the fruit.
    const hide = { x: anchor.left - 80, y: toPx(BANDS[1].a).y - width * 1.5, w: (70 - BANDS[1].a.x) * scale + 80, h: width * 3 };
    const body = `translate(${fmt(anchor.left)} ${fmt(anchor.top)}) scale(${scale.toFixed(4)})`;
    const data = buildRibbon(pts, total, width, { twists: [0.22, 0.48, 0.74], grow: 0.5, growFrom: bandLength / total });
    // The peel is split into chunks: finished chunks are static, only the chunk at the tip is masked.
    const CHUNK = 40;
    const chunks = [];
    for (let from = 0; from < pts.length - 1; from += CHUNK) {
      const to = Math.min(pts.length - 1, from + CHUNK);
      const lead = pts.slice(Math.max(0, from - 10), to + 1);
      const xs = lead.map((p) => p.x);
      const ys = lead.map((p) => p.y);
      const pad = width * 2;
      chunks.push({
        from,
        to,
        startS: lead[0].s,
        fromS: pts[from].s,
        toS: pts[to].s,
        maskPath: `M${lead.map((p) => `${fmt(p.x)} ${fmt(p.y)}`).join('L')}`,
        box: { x: Math.min(...xs) - pad, y: Math.min(...ys) - pad, w: Math.max(...xs) - Math.min(...xs) + pad * 2, h: Math.max(...ys) - Math.min(...ys) + pad * 2 },
        shadow: strip(pts.slice(from, to + 1), 1, width),
      });
    }
    trail = { pts, total, width, seeds, bandLength, hide, body, data, chunks };
  }

  useLayoutEffect(() => {
    if (!trail) return undefined;
    const { pts, total, chunks } = trail;
    const svg = trailRef.current;
    const groups = [...svg.querySelectorAll('.trail-chunk')];
    const tipMask = svg.querySelector('.trail-tip-mask');
    const tipPath = svg.querySelector('.trail-tip-path');
    const modes = groups.map(() => null);

    const setMode = (index, mode) => {
      if (modes[index] === mode) return;
      modes[index] = mode;
      const group = groups[index];
      group.style.display = mode === 'hidden' ? 'none' : '';
      if (mode === 'active') group.setAttribute('mask', `url(#${uid}-tip)`);
      else if (index === 0 && mode === 'done') group.setAttribute('mask', `url(#${uid}-start)`);
      else group.removeAttribute('mask');
    };

    let activeIndex = -1;
    const render = (length) => {
      chunks.forEach((chunk, index) => {
        if (length >= chunk.toS) setMode(index, 'done');
        else if (length <= chunk.fromS) setMode(index, 'hidden');
        else {
          setMode(index, 'active');
          if (activeIndex !== index) {
            activeIndex = index;
            tipPath.setAttribute('d', chunk.maskPath);
            ['x', 'y'].forEach((key) => tipMask.setAttribute(key, fmt(chunk.box[key])));
            tipMask.setAttribute('width', fmt(chunk.box.w));
            tipMask.setAttribute('height', fmt(chunk.box.h));
          }
          tipPath.style.strokeDashoffset = String(1 - (length - chunk.startS) / (chunk.toS - chunk.startS));
        }
      });
    };

    if (reduceMotion()) {
      render(total);
      return undefined;
    }
    const ctx = gsap.context(() => {
      // The tip of the peel follows a line just below the middle of the viewport, so it travels with the reader.
      const reach = [];
      pts.forEach((p, i) => { reach.push(Math.max(p.y, i ? reach[i - 1] : -Infinity)); });
      const seeds = gsap.utils.toArray('.trail-seed-inner', sectionRef.current);
      gsap.set(seeds, { scale: 0, opacity: 0, transformOrigin: '50% 50%' });
      const shown = seeds.map(() => false);
      const state = { length: trail.bandLength };
      render(state.length);
      const drawTo = gsap.quickTo(state, 'length', {
        duration: 0.7,
        ease: 'power2.out',
        onUpdate: () => {
          render(state.length);
          const fraction = state.length / total;
          trail.seeds.forEach((seed, i) => {
            const visible = fraction >= seed.fraction;
            if (visible === shown[i]) return;
            shown[i] = visible;
            gsap.to(seeds[i], visible
              ? { scale: 1, opacity: 1, duration: 0.5, ease: 'back.out(2.2)', overwrite: true }
              : { scale: 0, opacity: 0, duration: 0.3, ease: 'power2.in', overwrite: true });
          });
        },
      });

      ScrollTrigger.create({
        trigger: sectionRef.current,
        start: 'top bottom',
        end: 'bottom top',
        onUpdate: () => {
          const target = window.innerHeight * 0.62 - sectionRef.current.getBoundingClientRect().top;
          let lo = 0;
          let hi = reach.length - 1;
          if (target <= reach[0]) { drawTo(trail.bandLength); return; }
          while (lo < hi) {
            const midIndex = Math.ceil((lo + hi) / 2);
            if (reach[midIndex] <= target) lo = midIndex; else hi = midIndex - 1;
          }
          drawTo(lo >= reach.length - 1 ? total : Math.max(trail.bandLength, pts[lo].s));
        },
      });

      gsap.utils.toArray('.anar-chapter', sectionRef.current).forEach((chapter) => {
        gsap.from(chapter.children, {
          y: 26,
          opacity: 0,
          duration: 0.9,
          stagger: 0.1,
          ease: 'power3.out',
          scrollTrigger: { trigger: chapter, start: 'top 78%', toggleActions: 'play none none reverse' },
        });
      });
      gsap.to('.anar-leaf', { rotation: 5, duration: 2.8, ease: 'sine.inOut', yoyo: true, repeat: -1, stagger: 0.4 });
    }, sectionRef);
    return () => ctx.revert();
  }, [layout]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <section className="anar-ribbon-section" id="anar" ref={sectionRef} aria-labelledby="anar-title" data-nav-theme="light">
      {chapters.map((chapter, i) => (
        <div className={`anar-row anar-row-${i + 1}`} ref={(el) => { rowRefs.current[i] = el; }} key={chapter.title}>
          <div className="anar-chapter">
            {chapter.eyebrow && <p className="anar-eyebrow">{chapter.eyebrow}</p>}
            {i === 0 ? <h2 id="anar-title">{chapter.title}</h2> : <h3>{chapter.title}</h3>}
            <p className="anar-body">{chapter.body}</p>
          </div>
          {i === 0 && (
            <div className="anar-fruit-anchor" ref={anchorRef}>
              <Pomegranate uid={uid} />
            </div>
          )}
        </div>
      ))}
      <div className="anar-row anar-row-end" ref={(el) => { rowRefs.current[3] = el; }} aria-hidden="true" />

      {trail && (
        <svg ref={trailRef} className="anar-trail" width={layout.w} height={layout.h} viewBox={`0 0 ${fmt(layout.w)} ${fmt(layout.h)}`} aria-hidden="true" focusable="false">
          <defs>
            <clipPath id={`${uid}-hide`}>
              <rect x={fmt(trail.hide.x)} y={fmt(trail.hide.y)} width={fmt(trail.hide.w)} height={fmt(trail.hide.h)} />
            </clipPath>
            <filter id={`${uid}-feather`} x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation={fmt(trail.width * 0.45)} />
            </filter>
            {/* Tip mask: a soft, feathered reveal so the peel slides out instead of being cut. */}
            <mask id={`${uid}-tip`} className="trail-tip-mask" maskUnits="userSpaceOnUse" x="0" y="0" width={layout.w} height={layout.h}>
              <path className="trail-tip-path" d="M0 0" pathLength="1" fill="none" stroke="#fff" strokeWidth={fmt(trail.width * 2.6)} strokeDasharray="1 1" strokeDashoffset="1" strokeLinejoin="round" filter={`url(#${uid}-feather)`} />
              <rect x={fmt(trail.hide.x)} y={fmt(trail.hide.y)} width={fmt(trail.hide.w)} height={fmt(trail.hide.h)} fill="#000" />
              <g clipPath={`url(#${uid}-hide)`}><path d={BODY} transform={trail.body} fill="#fff" /></g>
            </mask>
            {/* Start mask: hides the end of the peel that wraps behind the fruit. */}
            <mask id={`${uid}-start`} maskUnits="userSpaceOnUse" x="0" y="0" width={layout.w} height={layout.h}>
              <rect width={layout.w} height={layout.h} fill="#fff" />
              <rect x={fmt(trail.hide.x)} y={fmt(trail.hide.y)} width={fmt(trail.hide.w)} height={fmt(trail.hide.h)} fill="#000" />
              <g clipPath={`url(#${uid}-hide)`}><path d={BODY} transform={trail.body} fill="#fff" /></g>
            </mask>
            <radialGradient id={`${uid}-trail-aril`} cx="36%" cy="30%" r="80%">
              <stop offset="0" stopColor="#ffb9b0" />
              <stop offset="0.25" stopColor="#f0435a" />
              <stop offset="0.7" stopColor="#a8102c" />
              <stop offset="1" stopColor="#5c0516" />
            </radialGradient>
          </defs>
          {trail.chunks.map((chunk) => (
            <g className="trail-chunk" key={chunk.from} style={{ display: 'none' }}>
              <polygon points={chunk.shadow} fill="#021c1f" opacity="0.26" transform="translate(6 10)" />
              <RibbonParts data={trail.data} pts={trail.pts} width={trail.width} from={chunk.from} to={chunk.to} />
            </g>
          ))}
          {trail.seeds.map((seed, i) => <TrailSeed key={i} {...seed} uid={uid} />)}
        </svg>
      )}
    </section>
  );
}
