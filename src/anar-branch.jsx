import React, { useLayoutEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const VIEW_W = 1400;
const VIEW_H = 400;
const DRAW = 2; // seconds the branch takes to grow from the edge to its tip
const reduceMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const fmt = (n) => n.toFixed(1);

// ---------- geometry ----------

// The branch reaches in from the right edge and tapers towards its tip on the left.
const MAIN = [{ x: 1430, y: 96 }, { x: 1100, y: 62 }, { x: 700, y: 262 }, { x: 140, y: 196 }];

function cubic([a, b, c, d], t) {
  const u = 1 - t;
  const x = u * u * u * a.x + 3 * u * u * t * b.x + 3 * u * t * t * c.x + t * t * t * d.x;
  const y = u * u * u * a.y + 3 * u * u * t * b.y + 3 * u * t * t * c.y + t * t * t * d.y;
  const dx = 3 * u * u * (b.x - a.x) + 6 * u * t * (c.x - b.x) + 3 * t * t * (d.x - c.x);
  const dy = 3 * u * u * (b.y - a.y) + 6 * u * t * (c.y - b.y) + 3 * t * t * (d.y - c.y);
  const len = Math.hypot(dx, dy) || 1;
  return { x, y, angle: (Math.atan2(dy, dx) * 180) / Math.PI, nx: -dy / len, ny: dx / len };
}

function seededRandom(seed) {
  let value = seed;
  return () => {
    value = (value * 9301 + 49297) % 233280;
    return value / 233280;
  };
}

const MAIN_D = `M${MAIN[0].x} ${MAIN[0].y}C${MAIN[1].x} ${MAIN[1].y} ${MAIN[2].x} ${MAIN[2].y} ${MAIN[3].x} ${MAIN[3].y}`;

// Tapered outline of the main branch.
const MAIN_SHAPE = (() => {
  const upper = [];
  const lower = [];
  for (let i = 0; i <= 60; i += 1) {
    const t = i / 60;
    const p = cubic(MAIN, t);
    const half = 1.4 + 7.5 * (1 - t) ** 1.3;
    upper.push(`${fmt(p.x + p.nx * half)},${fmt(p.y + p.ny * half)}`);
    lower.push(`${fmt(p.x - p.nx * half)},${fmt(p.y - p.ny * half)}`);
  }
  return [...upper, ...lower.reverse()].join(' ');
})();

const LEAF_COLOURS = ['#0b5c5a', '#084745', '#1f7d78', '#3c9a90'];

// Fruits hang from short twigs along the branch.
const FRUITS = [
  { t: 0.24, drop: 58, lean: -16, size: 1, tilt: 4 },
  { t: 0.44, drop: 84, lean: 14, size: 0.8, tilt: -5 },
  { t: 0.62, drop: 52, lean: -10, size: 1.06, tilt: 3 },
  { t: 0.81, drop: 66, lean: 8, size: 0.68, tilt: -4 },
].map((fruit) => {
  const p = cubic(MAIN, fruit.t);
  const end = { x: p.x + fruit.lean, y: p.y + fruit.drop };
  return {
    ...fruit,
    end,
    twig: `M${fmt(p.x)} ${fmt(p.y)}Q${fmt(p.x + fruit.lean * 1.3)} ${fmt(p.y + fruit.drop * 0.45)} ${fmt(end.x)} ${fmt(end.y)}`,
  };
});

// Leaves sit in opposite pairs, as they do on a pomegranate tree, and get smaller towards the tip.
const LEAVES = (() => {
  const random = seededRandom(23);
  const leaves = [];
  for (let t = 0.07; t < 0.99; t += 0.058) {
    const p = cubic(MAIN, t);
    [-1, 1].forEach((side) => {
      const length = (96 - 44 * t) * (0.8 + random() * 0.4);
      leaves.push({
        t,
        x: p.x,
        y: p.y,
        angle: p.angle + side * (32 + random() * 34),
        length,
        width: length * (0.14 + random() * 0.04),
        colour: LEAF_COLOURS[Math.floor(random() * LEAF_COLOURS.length)],
        delay: -random() * 5,
      });
    });
  }
  const tip = cubic(MAIN, 1);
  leaves.push({ t: 1, x: tip.x, y: tip.y, angle: tip.angle - 6, length: 58, width: 9, colour: LEAF_COLOURS[2], delay: -1.5 });
  // A pair of small leaves where each fruit twig leaves the branch.
  FRUITS.forEach((fruit, i) => {
    [-1, 1].forEach((side) => {
      leaves.push({
        t: fruit.t + 0.06,
        x: fruit.end.x,
        y: fruit.end.y,
        angle: 90 + side * (118 + random() * 20),
        length: 40 + random() * 14,
        width: 7,
        colour: LEAF_COLOURS[(i + (side > 0 ? 1 : 3)) % LEAF_COLOURS.length],
        delay: -random() * 5,
      });
    });
  });
  return leaves;
})();

const leafPath = (l, w) => `M0 0C${fmt(l * 0.3)} ${fmt(-w)} ${fmt(l * 0.72)} ${fmt(-w * 0.9)} ${fmt(l)} 0C${fmt(l * 0.72)} ${fmt(w * 0.9)} ${fmt(l * 0.3)} ${fmt(w)} 0 0Z`;

// ---------- drawing ----------

function Fruit({ fruit, index }) {
  return (
    <g transform={`translate(${fmt(fruit.end.x)} ${fmt(fruit.end.y)}) rotate(${fruit.tilt}) scale(${fruit.size})`}>
      <g className="branch-fruit-grow" data-t={fruit.t}>
        <g className="branch-fruit" style={{ animationDelay: `${-index * 1.3}s`, animationDuration: `${4.6 + index * 0.7}s` }}>
          <path d="M0 0V16" fill="none" stroke="#3b2a21" strokeWidth="3.2" strokeLinecap="round" />
          {/* calyx: a pomegranate hangs with its crown pointing down */}
          <path d="M-13 104L-18 128-9 121-4.500 132 0 122 4.500 132 9 121 18 128 13 104Z" fill="#ad4c3a" stroke="#6b271d" strokeWidth="1" strokeLinejoin="round" />
          <path d="M0 12C30 10 51 34 51 63 51 93 29 111 0 111-29 111-51 93-51 63-51 34-30 10 0 12Z" fill="url(#branch-skin)" />
          <path d="M-32 40C-39 55-39 72-32 85" fill="none" stroke="#f5efe5" strokeWidth="5" strokeLinecap="round" opacity="0.32" />
          <path d="M-9 14C-4 19 4 19 9 14" fill="none" stroke="#4f261b" strokeWidth="1.6" strokeLinecap="round" opacity="0.7" />
        </g>
      </g>
    </g>
  );
}

function Branch() {
  return (
    <svg className="anar-branch" viewBox={`0 0 ${VIEW_W} ${VIEW_H}`} aria-hidden="true" focusable="false">
      <defs>
        <radialGradient id="branch-skin" cx="34%" cy="30%" r="78%">
          <stop offset="0" stopColor="#c9604a" />
          <stop offset="0.5" stopColor="#9c3f30" />
          <stop offset="1" stopColor="#6b271d" />
        </radialGradient>
        {/* The wood is revealed along its own length, so it grows out from the edge. */}
        <mask id="branch-grow" maskUnits="userSpaceOnUse" x="0" y="0" width={VIEW_W} height={VIEW_H}>
          <path className="branch-reveal" d={MAIN_D} pathLength="1" fill="none" stroke="#fff" strokeWidth="46" strokeDasharray="1 1" />
        </mask>
      </defs>

      <g className="branch-sway">
        <g mask="url(#branch-grow)">
          <polygon points={MAIN_SHAPE} fill="#3b2a21" />
        </g>
        {FRUITS.map((fruit) => (
          <path key={fruit.t} className="branch-twig" data-t={fruit.t} d={fruit.twig} pathLength="1" fill="none" stroke="#3b2a21" strokeWidth="3.4" strokeLinecap="round" strokeDasharray="1 1" />
        ))}
        {LEAVES.map((leaf, i) => (
          <g key={i} transform={`translate(${fmt(leaf.x)} ${fmt(leaf.y)}) rotate(${fmt(leaf.angle)})`}>
            <g className="branch-leaf-grow" data-t={leaf.t}>
              <g className="branch-leaf" style={{ animationDelay: `${fmt(leaf.delay)}s` }}>
                <path d={leafPath(leaf.length, leaf.width)} fill={leaf.colour} />
                <path d={`M3 0H${fmt(leaf.length * 0.9)}`} fill="none" stroke="#f5efe5" strokeWidth="1" opacity="0.38" />
              </g>
            </g>
          </g>
        ))}
        {FRUITS.map((fruit, i) => <Fruit key={fruit.t} fruit={fruit} index={i} />)}
      </g>
    </svg>
  );
}

// ---------- animated wrapper ----------

// The branch grows in from the edge when it scrolls into view, then sways gently (CSS).
export function PomegranateBranch({ className = '' }) {
  const wrapRef = useRef(null);

  useLayoutEffect(() => {
    if (reduceMotion()) return undefined;
    const ctx = gsap.context(() => {
      const at = (el) => Number(el.dataset.t) * DRAW;
      const timeline = gsap.timeline({ scrollTrigger: { trigger: wrapRef.current, start: 'top 78%' } });
      timeline.fromTo('.branch-reveal', { strokeDashoffset: 1 }, { strokeDashoffset: 0, duration: DRAW, ease: 'power1.inOut' }, 0);
      gsap.utils.toArray('.branch-twig').forEach((twig) => {
        timeline.fromTo(twig, { strokeDashoffset: 1 }, { strokeDashoffset: 0, duration: 0.5, ease: 'power2.out' }, at(twig) + 0.1);
      });
      gsap.utils.toArray('.branch-leaf-grow').forEach((leaf) => {
        timeline.from(leaf, { scale: 0, opacity: 0, duration: 0.8, ease: 'back.out(1.6)', transformOrigin: '0% 50%' }, at(leaf) + 0.15);
      });
      gsap.utils.toArray('.branch-fruit-grow').forEach((fruit) => {
        timeline.from(fruit, { scale: 0, opacity: 0, duration: 1, ease: 'back.out(1.8)', transformOrigin: '50% 0%' }, at(fruit) + 0.5);
      });
    }, wrapRef);
    return () => ctx.revert();
  }, []);

  return (
    <div className={`anar-branch-wrap ${className}`.trim()} ref={wrapRef}>
      <Branch />
    </div>
  );
}
