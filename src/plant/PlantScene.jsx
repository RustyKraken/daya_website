import React, { forwardRef, useImperativeHandle, useLayoutEffect, useMemo, useRef } from 'react';
import gsap from 'gsap';
import {
  BASE_X, GROUND_Y, G_SAPLING, G_SPROUT, SEED_POS, branchPath, buildTree, clamp01, easeOutBack, smooth,
} from './tree.js';

const reduceMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const f1 = (n) => n.toFixed(1);

const SEED_HOME = { x: 168, y: 430 };
const CAN_POS = { x: 612, y: 452 };
const CAN_TILT = -30;
const SPOUT_TIP = { x: -104, y: -30 };
const SUN_HOME = { x: 160, y: 150 };
const DROP_ZONE = { x: BASE_X, y: GROUND_Y, r: 120 };
const ARCH = 'M318 842V716C318 680 350 662 374 652 388 646 396 640 400 632 404 640 412 646 426 652 450 662 482 680 482 716V842Z';
const POT_BODY = 'M206 590C210 700 236 802 288 860H512C564 802 590 700 594 590Z';

const SOIL_CRUMBS = Array.from({ length: 16 }, (_, i) => i);
const DROPS = Array.from({ length: 18 }, (_, i) => i);
const PETALS = Array.from({ length: 14 }, (_, i) => i);
const MOTES = Array.from({ length: 18 }, (_, i) => ({
  x: 60 + ((i * 137) % 680),
  y: 70 + ((i * 89) % 420),
  r: 1 + (i % 3) * 0.7,
  delay: -(i * 1.7),
  dur: 9 + (i % 5) * 2.5,
}));

function Leaf({ leaf, index }) {
  return (
    <g className="ps-leaf" data-i={index} transform={`translate(${f1(leaf.x)} ${f1(leaf.y)}) scale(0)`}>
      <g className={leaf.flutter ? 'ps-flutter' : undefined} style={{ animationDelay: `${-(index % 7) * 0.6}s` }}>
        <path d="M0 0C5-4.4 14-5.8 25-1 14 4.4 5 3.6 0 0Z" fill={`url(#ps-leaf-${leaf.tone})`} />
        <path d="M1 0C8-.6 15-.8 23-1" fill="none" stroke="#cfe0a4" strokeWidth="0.6" opacity="0.7" />
      </g>
    </g>
  );
}

function Blossom({ blossom, index }) {
  return (
    <g className="ps-blossom" data-i={index} transform={`translate(${f1(blossom.x)} ${f1(blossom.y)})`}>
      <g className="ps-flower" transform={`rotate(${f1(blossom.angle + 90)}) scale(0)`}>
        <path d="M-4.5 0C-5.5 5-6 10-3.6 15H3.6C6 10 5.5 5 4.5 0Z" fill="url(#ps-calyx)" />
        {[-2, -1, 0, 1, 2].map((k) => (
          <path key={k} d="M0 0C-5-3-6-10-2-14 0-12 2-12 4-14 7-9 5-3 0 0Z" fill={k % 2 ? '#f06a45' : '#e2402f'} transform={`translate(0 -1) rotate(${k * 28})`} />
        ))}
        {[-3, -1, 1, 3].map((x) => <circle key={x} cx={x} cy="-5" r="0.9" fill="#f2cd5c" />)}
      </g>
      <g className="ps-fruit" transform="scale(0)">
        <path d="M0 0V5" stroke="#5b4526" strokeWidth="1.6" strokeLinecap="round" />
        <circle cx="0" cy="18" r="14" fill="url(#ps-fruit)" />
        <ellipse cx="-5" cy="12" rx="4" ry="2.6" fill="#fff" opacity="0.28" transform="rotate(-30 -5 12)" />
        <path d="M-4 31-5 37-2 34 0 38 2 34 5 37 4 31Z" fill="#8c1f22" />
      </g>
    </g>
  );
}

function Sun() {
  return (
    <g className="ps-sun" transform={`translate(${SUN_HOME.x} ${SUN_HOME.y})`}>
      <g className="ps-sun-core">
      <circle className="ps-sun-glow" r="120" fill="url(#ps-sun-glow)" />
      <g className="ps-sun-rays">
        {Array.from({ length: 24 }, (_, i) => {
          const long = i % 2 === 0;
          return <path key={i} d={long ? 'M-5-46 0-84 5-46Z' : 'M-4-46 0-66 4-46Z'} fill={long ? '#e8b54a' : '#f2cd76'} transform={`rotate(${i * 15})`} />;
        })}
      </g>
      <circle r="44" fill="url(#ps-sun-disc)" />
      <circle r="36" fill="none" stroke="#fff3cf" strokeWidth="1" opacity="0.6" />
      {Array.from({ length: 8 }, (_, i) => (
        <path key={i} d="M0-30C6-22 6-14 0-8-6-14-6-22 0-30Z" fill="#f7dc8e" opacity="0.75" transform={`rotate(${i * 45})`} />
      ))}
      <circle r="7" fill="#fff3cf" />
      <circle className="ps-hit" r="96" fill="transparent" />
      </g>
    </g>
  );
}

function WateringCan() {
  return (
    <g className="ps-can" transform={`translate(${CAN_POS.x} ${CAN_POS.y})`}>
      <g className="ps-can-fade">
      <g className="ps-can-body">
        <circle className="ps-spout" cx={SPOUT_TIP.x} cy={SPOUT_TIP.y} r="0.1" fill="none" />
        <path d="M-34 16-98-24-94-32-30 2Z" fill="url(#ps-brass)" stroke="#6f5220" strokeWidth="1" />
        <ellipse cx="-100" cy="-29" rx="7" ry="11" transform="rotate(-32 -100 -29)" fill="#c99a3e" stroke="#6f5220" strokeWidth="1" />
        <path d="M30-30C70-34 78 12 40 26" fill="none" stroke="#a37a2c" strokeWidth="7" strokeLinecap="round" />
        <path d="M-42-26C-44 10-40 32-30 40H34C44 32 46 10 44-26Z" fill="url(#ps-brass)" stroke="#6f5220" strokeWidth="1.2" />
        <ellipse cx="1" cy="-26" rx="43" ry="9" fill="#d9b25a" stroke="#6f5220" strokeWidth="1.2" />
        <ellipse cx="1" cy="-26" rx="30" ry="5" fill="#5c4317" opacity="0.55" />
        <path d="M-43 6H45" stroke="#6f5220" strokeWidth="1" opacity="0.6" />
        <path d="M-42 16H44" stroke="#6f5220" strokeWidth="1" opacity="0.6" />
        {[-30, -15, 0, 15, 30].map((x) => <path key={x} d={`M${x} 7.5 ${x + 4} 11 ${x} 14.5 ${x - 4} 11Z`} fill="#7a5a22" />)}
        <path d="M-30-18C-32 6-30 22-24 34" fill="none" stroke="#fff4cf" strokeWidth="3" opacity="0.35" strokeLinecap="round" />
      </g>
      <circle className="ps-hit" cx="-20" cy="0" r="90" fill="transparent" />
      </g>
    </g>
  );
}

function Seed() {
  return (
    <g className="ps-seed" transform={`translate(${SEED_HOME.x} ${SEED_HOME.y})`}>
      <circle className="ps-seed-halo" r="46" fill="none" stroke="#e9c76b" strokeWidth="1.2" />
      <g className="ps-seed-art" transform="scale(2.6)">
        <ellipse cx="2" cy="12" rx="8" ry="2.4" fill="#021c1f" opacity="0.25" />
        <path d="M0-12C7.6-10 10.4-1.4 8.1 5.8 6 11.6-6 11.6-8.1 5.8-10.4-1.4-7.6-10 0-12Z" fill="url(#ps-aril)" stroke="#5c0516" strokeWidth="0.5" />
        <ellipse cx="0.6" cy="1.6" rx="2.6" ry="5" fill="#f4e7cf" opacity="0.9" />
        <ellipse cx="-3.2" cy="-4.6" rx="2" ry="3.4" fill="#fff" opacity="0.7" transform="rotate(-20)" />
      </g>
      <circle className="ps-hit" r="64" fill="transparent" />
    </g>
  );
}

const PlantScene = forwardRef(function PlantScene({ onStageDone, onProgress }, ref) {
  const svgRef = useRef(null);
  const api = useRef({});
  const tree = useMemo(() => buildTree(), []);
  const callbacks = useRef({ onStageDone, onProgress });
  callbacks.current = { onStageDone, onProgress };

  useImperativeHandle(ref, () => ({
    plant: () => api.current.plant?.(),
    startPour: () => api.current.startPour?.(),
    stopPour: () => api.current.stopPour?.(),
    startShine: () => api.current.startShine?.(),
    stopShine: () => api.current.stopShine?.(),
    skipGrowth: () => api.current.skipGrowth?.(),
    grow: () => api.current.grow?.(),
    replay: () => api.current.replay?.(),
    setStage: (stage) => api.current.setStage?.(stage),
    finish: () => api.current.finish?.(),
  }), []);

  useLayoutEffect(() => {
    const svg = svgRef.current;
    const q = (selector) => [...svg.querySelectorAll(selector)];
    const one = (selector) => svg.querySelector(selector);
    const reduce = reduceMotion();
    const d = (seconds) => (reduce ? 0.01 : seconds);

    const branchEls = q('.ps-branch');
    const barkEls = q('.ps-bark');
    const leafEls = q('.ps-leaf');
    const blossomEls = q('.ps-blossom');
    const flowerEls = blossomEls.map((el) => el.querySelector('.ps-flower'));
    const fruitEls = blossomEls.map((el) => el.querySelector('.ps-fruit'));
    const rootEls = q('.ps-root');
    const cotyledonEls = q('.ps-cotyledon');
    const stemUnder = one('.ps-stem-under');
    const seedUnder = one('.ps-seed-under');
    const wetEls = q('.ps-wet');
    const warm = one('.ps-warm');
    const beam = one('.ps-beam');
    const sun = one('.ps-sun');
    const can = one('.ps-can');
    const canFade = one('.ps-can-fade');
    const canBody = one('.ps-can-body');
    const spout = one('.ps-spout');
    const sunCore = one('.ps-sun-core');
    const seed = one('.ps-seed');
    const treeGroup = one('.ps-tree');
    const zone = one('.ps-zone');
    const hint = one('.ps-hint');
    const petalEls = q('.ps-petal');
    const dropEls = q('.ps-drop');
    const crumbEls = q('.ps-crumb');

    const cache = new Map();
    const set = (el, key, value) => {
      const id = `${key}`;
      if (!cache.has(el)) cache.set(el, {});
      const memo = cache.get(el);
      if (memo[id] === value) return;
      memo[id] = value;
      if (key === 'dash') el.style.strokeDashoffset = value;
      else if (key === 'opacity') el.style.opacity = value;
      else el.setAttribute(key, value);
    };

    let lastG = 0;
    let allowPetals = false;
    let petalCursor = 0;

    const dropPetals = (b) => {
      for (let k = 0; k < 3; k += 1) {
        const petal = petalEls[petalCursor % petalEls.length];
        petalCursor += 1;
        gsap.killTweensOf(petal);
        gsap.fromTo(petal, { attr: { transform: `translate(${f1(b.x)} ${f1(b.y)}) rotate(0)` }, opacity: 1 }, {
          attr: { transform: `translate(${f1(b.x + (Math.random() - 0.5) * 70)} ${f1(Math.min(GROUND_Y - 4, b.y + 140 + Math.random() * 120))}) rotate(${Math.round(200 + Math.random() * 300)})` },
          opacity: 0,
          duration: 2.4 + Math.random(),
          ease: 'power1.in',
        });
      }
    };

    // Single source of truth: everything that grows is a function of G.
    const applyGrowth = (G) => {
      tree.branches.forEach((b, i) => {
        const local = clamp01((G - b.t0) / b.dur);
        const thick = smooth((G - b.t0) / (0.96 - b.t0));
        const dash = (1 - local).toFixed(3);
        set(branchEls[i], 'dash', dash);
        set(barkEls[i], 'dash', dash);
        set(branchEls[i], 'stroke-width', (b.width * (0.28 + 0.72 * thick)).toFixed(2));
        set(barkEls[i], 'stroke-width', (b.width * 0.35 * (0.28 + 0.72 * thick)).toFixed(2));
      });
      tree.leaves.forEach((leaf, i) => {
        const s = easeOutBack((G - leaf.t) / 0.05) * (leaf.drop ? 1 - smooth((G - leaf.drop) / 0.1) : 1);
        set(leafEls[i], 'transform', `translate(${f1(leaf.x)} ${f1(leaf.y)}) rotate(${f1(leaf.angle)}) scale(${(s * leaf.size).toFixed(3)})`);
      });
      tree.blossoms.forEach((b, i) => {
        const open = easeOutBack((G - b.bloom) / 0.04) * (1 - smooth((G - b.fruit) / 0.025));
        const fruit = smooth((G - b.fruit) / 0.07);
        set(flowerEls[i], 'transform', `rotate(${f1(b.angle + 90)}) scale(${(open * b.size * 1.3).toFixed(3)})`);
        set(fruitEls[i], 'transform', `scale(${(fruit * b.size).toFixed(3)})`);
        if (allowPetals && lastG < b.fruit && G >= b.fruit) dropPetals(b);
      });
      tree.roots.forEach((r, i) => set(rootEls[i], 'dash', (1 - clamp01((G - r.t0) / r.dur)).toFixed(3)));
      const coty = easeOutBack((G - 0.045) / 0.035) * (1 - smooth((G - 0.3) / 0.08));
      cotyledonEls.forEach((el, i) => set(el, 'transform', `translate(${BASE_X} ${f1(GROUND_Y - 4 - 22 * clamp01((G - 0.035) / 0.06))}) scale(${i ? '' : '-'}${coty.toFixed(3)} ${coty.toFixed(3)})`));
      set(stemUnder, 'dash', (1 - clamp01((G - 0.012) / 0.03)).toFixed(3));
      lastG = G;
    };

    const state = { stage: 'seed', G: 0, wet: 0, light: 0, pouring: false, shining: false, sunX: SUN_HOME.x };
    const report = (value) => callbacks.current.onProgress?.(state.stage, value);

    const setWet = (w) => wetEls.forEach((el) => set(el, 'opacity', (w * 0.62).toFixed(3)));

    const seedPos = { x: SEED_HOME.x, y: SEED_HOME.y, s: 1 };
    const drawSeed = () => seed.setAttribute('transform', `translate(${f1(seedPos.x)} ${f1(seedPos.y)}) scale(${seedPos.s.toFixed(3)})`);
    const resetSeed = () => {
      gsap.killTweensOf(seedPos);
      Object.assign(seedPos, { x: SEED_HOME.x, y: SEED_HOME.y, s: 1 });
      drawSeed();
      gsap.set(seed, { opacity: 1 });
      gsap.set(seedUnder, { opacity: 0, attr: { transform: `translate(${SEED_POS.x} ${SEED_POS.y - 30})` } });
    };

    const showFor = (stage) => {
      gsap.to(seed, { opacity: stage === 'seed' ? 1 : 0, duration: d(0.4) });
      gsap.to([zone, hint], { opacity: stage === 'seed' ? 1 : 0, duration: d(0.4) });
      gsap.to(canFade, { opacity: stage === 'water' ? 1 : 0, y: stage === 'water' ? 0 : -24, duration: d(0.7), ease: 'power3.out' });
      can.style.pointerEvents = stage === 'water' ? '' : 'none';
      seed.style.pointerEvents = stage === 'seed' ? '' : 'none';
      sun.style.pointerEvents = stage === 'sun' ? '' : 'none';
      gsap.to(sun, { opacity: stage === 'sun' || stage === 'grow' || stage === 'done' ? 1 : 0.0, duration: d(0.9), ease: 'power2.out' });
      svg.dataset.stage = stage;
    };

    // ---------- stage 1: plant ----------
    let planting = false;
    const plantAt = (x, y) => {
      if (state.stage !== 'seed' || planting) return;
      planting = true;
      const tl = gsap.timeline({
        onComplete: () => {
          planting = false;
          callbacks.current.onStageDone?.('seed');
        },
      });
      gsap.killTweensOf(seedPos);
      tl.to(seedPos, { x: BASE_X, y: GROUND_Y - 16, duration: d(0.55), ease: 'power2.inOut', onUpdate: drawSeed }, 0)
        .to(seedPos, { y: GROUND_Y + 2, s: 0.35, duration: d(0.45), ease: 'power2.in', onUpdate: drawSeed })
        .to(seed, { opacity: 0, duration: d(0.25) }, '<0.2')
        .add(() => {
          if (reduce) return;
          crumbEls.forEach((el, i) => {
            const angle = (i / crumbEls.length) * Math.PI - Math.PI;
            const dist = 30 + Math.random() * 50;
            gsap.fromTo(el, { attr: { cx: BASE_X, cy: GROUND_Y - 2 }, opacity: 1 }, {
              keyframes: [
                { attr: { cx: BASE_X + Math.cos(angle) * dist * 0.6, cy: GROUND_Y - 18 - Math.random() * 30 }, duration: 0.28, ease: 'power2.out' },
                { attr: { cx: BASE_X + Math.cos(angle) * dist, cy: GROUND_Y - 2 + Math.random() * 6 }, opacity: 0, duration: 0.45, ease: 'power2.in' },
              ],
            });
          });
          gsap.fromTo('.ps-soil-top', { attr: { ry: 19 } }, { attr: { ry: 22 }, duration: 0.18, yoyo: true, repeat: 1, ease: 'sine.inOut' });
        })
        .fromTo(seedUnder, { opacity: 0, attr: { transform: `translate(${SEED_POS.x} ${SEED_POS.y - 30})` } }, { opacity: 1, attr: { transform: `translate(${SEED_POS.x} ${SEED_POS.y})` }, duration: d(0.9), ease: 'power2.out' });
      void x; void y;
    };

    const toSvg = (event) => {
      const point = svg.createSVGPoint();
      point.x = event.clientX;
      point.y = event.clientY;
      return point.matrixTransform(svg.getScreenCTM().inverse());
    };

    let drag = null;
    const onSeedDown = (event) => {
      if (state.stage !== 'seed' || planting) return;
      event.preventDefault();
      seed.setPointerCapture(event.pointerId);
      const p = toSvg(event);
      gsap.killTweensOf(seedPos);
      drag = { id: event.pointerId, start: p, moved: 0, ox: seedPos.x - p.x, oy: seedPos.y - p.y };
      seed.classList.add('is-dragging');
    };
    const onSeedMove = (event) => {
      if (!drag || drag.id !== event.pointerId) return;
      const p = toSvg(event);
      drag.moved = Math.max(drag.moved, Math.hypot(p.x - drag.start.x, p.y - drag.start.y));
      const x = p.x + drag.ox;
      const y = p.y + drag.oy;
      drag.last = { x, y };
      seedPos.x = x;
      seedPos.y = y;
      drawSeed();
      zone.classList.toggle('is-near', Math.hypot(x - DROP_ZONE.x, y - DROP_ZONE.y) < DROP_ZONE.r);
    };
    const onSeedUp = (event) => {
      if (!drag || drag.id !== event.pointerId) return;
      const { last, moved } = drag;
      drag = null;
      seed.classList.remove('is-dragging');
      zone.classList.remove('is-near');
      if (moved < 8) { plantAt(); return; } // a tap plants the seed too
      if (last && Math.hypot(last.x - DROP_ZONE.x, last.y - DROP_ZONE.y) < DROP_ZONE.r) plantAt(last.x, last.y);
      else gsap.to(seedPos, { x: SEED_HOME.x, y: SEED_HOME.y, duration: d(0.9), ease: 'elastic.out(1, 0.55)', onUpdate: drawSeed });
    };
    seed.addEventListener('pointerdown', onSeedDown);
    seed.addEventListener('pointermove', onSeedMove);
    seed.addEventListener('pointerup', onSeedUp);
    seed.addEventListener('pointercancel', onSeedUp);

    // ---------- stage 2: water ----------
    let dropCursor = 0;
    let dropClock = 0;
    const spoutWorld = () => {
      const point = svg.createSVGPoint();
      point.x = SPOUT_TIP.x;
      point.y = SPOUT_TIP.y;
      // spout → screen → scene coordinates (getCTM alone would include the viewBox scaling)
      return point.matrixTransform(spout.getScreenCTM()).matrixTransform(svg.getScreenCTM().inverse());
    };
    const spawnDrop = () => {
      const el = dropEls[dropCursor % dropEls.length];
      dropCursor += 1;
      const tip = spoutWorld();
      const tx = BASE_X + 20 + (Math.random() - 0.5) * 90;
      gsap.killTweensOf(el);
      const duration = 0.5 + Math.random() * 0.18;
      gsap.fromTo(el, { attr: { cx: tip.x + (Math.random() - 0.5) * 6, cy: tip.y }, opacity: 0.95 }, {
        attr: { cx: tx },
        duration,
        ease: 'sine.out',
      });
      gsap.fromTo(el, { attr: { cy: tip.y } }, {
        attr: { cy: GROUND_Y - 4 + Math.random() * 6 },
        duration,
        ease: 'power2.in',
        onComplete: () => gsap.to(el, { opacity: 0, duration: 0.15 }),
      });
    };
    const startPour = () => {
      if (state.stage !== 'water' || state.pouring) return;
      state.pouring = true;
      state.pourStart = performance.now();
      gsap.to(canBody, { rotation: CAN_TILT, transformOrigin: '50% 40%', duration: d(0.45), ease: 'power2.out' });
    };
    const stopPour = () => {
      if (!state.pouring) return;
      const held = performance.now() - state.pourStart;
      const finish = () => {
        state.pouring = false;
        if (state.stage === 'water') gsap.to(canBody, { rotation: 0, transformOrigin: '50% 40%', duration: d(0.6), ease: 'power2.inOut' });
      };
      if (held < 380) gsap.delayedCall(0.38 - held / 1000, finish); // a quick tap still pours a little
      else finish();
    };

    // ---------- stage 3: sun ----------
    const sunArcY = (x) => SUN_HOME.y + ((x - 400) / 300) ** 2 * 50 - 40 * (1 - ((x - 400) / 300) ** 2);
    const placeSun = (x) => {
      state.sunX = Math.min(660, Math.max(140, x));
      sun.setAttribute('transform', `translate(${f1(state.sunX)} ${f1(sunArcY(state.sunX))})`);
      const tilt = ((state.sunX - BASE_X) / 300) * 5;
      gsap.to(treeGroup, { rotation: state.stage === 'sun' ? tilt : 0, svgOrigin: `${BASE_X} ${GROUND_Y}`, duration: d(0.8), ease: 'power2.out', overwrite: 'auto' });
      const sx = state.sunX;
      const sy = sunArcY(state.sunX);
      beam.setAttribute('points', `${f1(sx - 30)},${f1(sy)} ${f1(sx + 30)},${f1(sy)} ${BASE_X + 90},${GROUND_Y - 30} ${BASE_X - 90},${GROUND_Y - 30}`);
    };
    let sunDrag = null;
    const startShine = () => {
      if (state.stage !== 'sun' || state.shining) return;
      state.shining = true;
      gsap.to(sunCore, { scale: 1.1, transformOrigin: '50% 50%', duration: d(0.5), ease: 'power2.out' });
      gsap.to(beam, { opacity: 1, duration: d(0.6) });
      gsap.to(warm, { opacity: 0.85, duration: d(0.9) });
    };
    const stopShine = () => {
      if (!state.shining) return;
      state.shining = false;
      gsap.to(sunCore, { scale: 1, transformOrigin: '50% 50%', duration: d(0.6), ease: 'power2.inOut' });
      gsap.to(beam, { opacity: 0, duration: d(0.8) });
      gsap.to(warm, { opacity: state.stage === 'sun' ? 0.35 : 0.6, duration: d(1.2) });
    };
    const onSunDown = (event) => {
      if (state.stage !== 'sun') return;
      event.preventDefault();
      sun.setPointerCapture(event.pointerId);
      sunDrag = { id: event.pointerId, offset: toSvg(event).x - state.sunX };
      startShine();
    };
    const onSunMove = (event) => {
      if (!sunDrag || sunDrag.id !== event.pointerId) return;
      placeSun(toSvg(event).x - sunDrag.offset);
    };
    const onSunUp = (event) => {
      if (!sunDrag || sunDrag.id !== event.pointerId) return;
      sunDrag = null;
      stopShine();
    };
    sun.addEventListener('pointerdown', onSunDown);
    sun.addEventListener('pointermove', onSunMove);
    sun.addEventListener('pointerup', onSunUp);
    sun.addEventListener('pointercancel', onSunUp);

    const onCanDown = (event) => {
      if (state.stage !== 'water') return;
      event.preventDefault();
      can.setPointerCapture(event.pointerId);
      startPour();
    };
    const onCanUp = () => stopPour();
    can.addEventListener('pointerdown', onCanDown);
    can.addEventListener('pointerup', onCanUp);
    can.addEventListener('pointercancel', onCanUp);

    // ---------- frame loop for the hold interactions ----------
    const tick = (_time, deltaMs) => {
      const dt = Math.min(deltaMs, 64) / 1000;
      if (state.stage === 'water' && state.pouring) {
        state.wet = Math.min(1, state.wet + dt / 1.8);
        dropClock += dt;
        while (!reduce && dropClock > 0.06) { dropClock -= 0.06; spawnDrop(); }
        setWet(state.wet);
        state.G = state.wet * G_SPROUT;
        applyGrowth(state.G);
        report(state.wet);
        if (state.wet >= 1) {
          state.stage = 'water-done';
          stopPour();
          state.pouring = false;
          gsap.to(canBody, { rotation: 0, transformOrigin: '50% 40%', duration: d(0.6) });
          gsap.delayedCall(d(0.6), () => callbacks.current.onStageDone?.('water'));
        }
      }
      if (state.stage === 'sun' && state.shining) {
        state.light = Math.min(1, state.light + dt / 2);
        state.G = G_SPROUT + state.light * (G_SAPLING - G_SPROUT);
        applyGrowth(state.G);
        report(state.light);
        if (state.light >= 1) {
          state.stage = 'sun-done';
          sunDrag = null;
          stopShine();
          gsap.delayedCall(d(0.5), () => callbacks.current.onStageDone?.('sun'));
        }
      }
    };
    gsap.ticker.add(tick);

    // ---------- stage 4: grow ----------
    let growTween = null;
    const grow = () => {
      state.stage = 'grow';
      allowPetals = !reduce;
      gsap.to(treeGroup, { rotation: 0, svgOrigin: `${BASE_X} ${GROUND_Y}`, duration: d(1.2), ease: 'power2.inOut' });
      const sunProxy = { x: state.sunX };
      gsap.to(sunProxy, { x: SUN_HOME.x, duration: d(2), ease: 'power2.inOut', onUpdate: () => placeSun(sunProxy.x) });
      gsap.to(warm, { opacity: 0.6, duration: d(2) });
      const proxy = { G: state.G };
      growTween = gsap.to(proxy, {
        G: 1,
        duration: reduce ? 0.6 : 10,
        ease: 'sine.inOut',
        onUpdate: () => {
          state.G = proxy.G;
          applyGrowth(proxy.G);
          report((proxy.G - G_SAPLING) / (1 - G_SAPLING));
        },
        onComplete: () => {
          growTween = null;
          allowPetals = false;
          finish();
          callbacks.current.onStageDone?.('grow');
        },
      });
    };
    const skipGrowth = () => {
      if (growTween) growTween.timeScale(8);
    };

    let sway = null;
    const finish = () => {
      state.stage = 'done';
      applyGrowth(1);
      if (!reduce && !sway) {
        sway = gsap.fromTo(treeGroup, { rotation: -0.8 }, { rotation: 0.8, svgOrigin: `${BASE_X} ${GROUND_Y}`, duration: 4.5, ease: 'sine.inOut', yoyo: true, repeat: -1 });
      }
      svg.dataset.stage = 'done';
    };

    // ---------- replay ----------
    const replay = () => {
      growTween?.kill();
      growTween = null;
      sway?.kill();
      sway = null;
      allowPetals = false;
      state.pouring = false;
      state.shining = false;
      const proxy = { G: state.G, wet: state.wet };
      gsap.to(treeGroup, { rotation: 0, svgOrigin: `${BASE_X} ${GROUND_Y}`, duration: d(0.6) });
      gsap.to(warm, { opacity: 0, duration: d(1) });
      gsap.to(proxy, {
        G: 0,
        wet: 0,
        duration: d(1.6),
        ease: 'power2.inOut',
        onUpdate: () => {
          applyGrowth(proxy.G);
          setWet(proxy.wet);
        },
        onComplete: () => {
          Object.assign(state, { stage: 'seed', G: 0, wet: 0, light: 0 });
          placeSun(SUN_HOME.x);
          resetSeed();
          showFor('seed');
          callbacks.current.onStageDone?.('reset');
        },
      });
    };

    const setStage = (stage) => {
      state.stage = stage;
      showFor(stage);
      if (stage === 'sun') {
        placeSun(state.sunX);
        gsap.to(warm, { opacity: 0.35, duration: d(1.2) });
      }
    };

    api.current = {
      plant: () => plantAt(),
      startPour,
      stopPour,
      startShine,
      stopShine,
      grow,
      skipGrowth,
      replay,
      setStage,
      finish: () => {
        state.G = 1;
        state.wet = 1;
        setWet(1);
        gsap.set(warm, { opacity: 0.6 });
        finish();
        showFor('done');
      },
    };

    applyGrowth(0);
    setWet(0);
    resetSeed();
    placeSun(SUN_HOME.x);
    gsap.set(beam, { opacity: 0 });
    gsap.set(warm, { opacity: 0 });
    gsap.set(canFade, { opacity: 0 });
    gsap.set(sun, { opacity: 0 });
    gsap.set([...petalEls, ...dropEls, ...crumbEls], { opacity: 0 });
    showFor('seed');

    return () => {
      gsap.ticker.remove(tick);
      growTween?.kill();
      sway?.kill();
      gsap.killTweensOf([seed, seedPos, sun, sunCore, canFade, canBody, treeGroup, warm, beam, zone, hint, seedUnder, ...petalEls, ...dropEls, ...crumbEls]);
      seed.removeEventListener('pointerdown', onSeedDown);
      seed.removeEventListener('pointermove', onSeedMove);
      seed.removeEventListener('pointerup', onSeedUp);
      seed.removeEventListener('pointercancel', onSeedUp);
      sun.removeEventListener('pointerdown', onSunDown);
      sun.removeEventListener('pointermove', onSunMove);
      sun.removeEventListener('pointerup', onSunUp);
      sun.removeEventListener('pointercancel', onSunUp);
      can.removeEventListener('pointerdown', onCanDown);
      can.removeEventListener('pointerup', onCanUp);
      can.removeEventListener('pointercancel', onCanUp);
    };
  }, [tree]);

  return (
    <svg ref={svgRef} className="ps-scene" viewBox="0 0 800 900" role="img" aria-label="A pomegranate seed, a glazed Persian pot and the tree that grows from it">
      <defs>
        <radialGradient id="ps-sky" cx="50%" cy="38%" r="70%">
          <stop offset="0" stopColor="#17707a" />
          <stop offset="0.6" stopColor="#0d5c63" />
          <stop offset="1" stopColor="#073f45" />
        </radialGradient>
        <radialGradient id="ps-warm">
          <stop offset="0" stopColor="#f2c66d" stopOpacity="0.5" />
          <stop offset="0.4" stopColor="#d99a4a" stopOpacity="0.14" />
          <stop offset="1" stopColor="#d99a4a" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="ps-sun-glow">
          <stop offset="0" stopColor="#ffe2a0" stopOpacity="0.75" />
          <stop offset="1" stopColor="#ffe2a0" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="ps-sun-disc" cx="40%" cy="36%" r="70%">
          <stop offset="0" stopColor="#fff0bf" />
          <stop offset="0.55" stopColor="#efc15a" />
          <stop offset="1" stopColor="#c98f2c" />
        </radialGradient>
        <linearGradient id="ps-beam" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#ffe2a0" stopOpacity="0.4" />
          <stop offset="1" stopColor="#ffe2a0" stopOpacity="0" />
        </linearGradient>
        <linearGradient id="ps-pot" x1="0" x2="1">
          <stop offset="0" stopColor="#7c3a22" />
          <stop offset="0.35" stopColor="#b8653c" />
          <stop offset="0.6" stopColor="#c87748" />
          <stop offset="1" stopColor="#6e321d" />
        </linearGradient>
        <linearGradient id="ps-glaze" x1="0" x2="1">
          <stop offset="0" stopColor="#0f5d60" />
          <stop offset="0.45" stopColor="#2a9c97" />
          <stop offset="1" stopColor="#0c4f53" />
        </linearGradient>
        <pattern id="ps-tiles" width="28" height="28" patternUnits="userSpaceOnUse" x="8" y="596">
          <path d="M14 3 17 10 24 7 21 14 24 21 17 18 14 25 11 18 4 21 7 14 4 7 11 10Z" fill="#f3e3bd" opacity="0.85" />
          <circle cx="14" cy="14" r="2.4" fill="#c0392b" />
          <circle cx="0" cy="0" r="2" fill="#e2b85a" />
          <circle cx="28" cy="0" r="2" fill="#e2b85a" />
          <circle cx="0" cy="28" r="2" fill="#e2b85a" />
          <circle cx="28" cy="28" r="2" fill="#e2b85a" />
        </pattern>
        <linearGradient id="ps-soil-cut" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#5a3a26" />
          <stop offset="0.5" stopColor="#3f281a" />
          <stop offset="1" stopColor="#2a1a10" />
        </linearGradient>
        <radialGradient id="ps-soil-top" cx="50%" cy="40%" r="60%">
          <stop offset="0" stopColor="#6b4630" />
          <stop offset="1" stopColor="#3a2416" />
        </radialGradient>
        <radialGradient id="ps-aril" cx="36%" cy="30%" r="80%">
          <stop offset="0" stopColor="#ffc2b8" />
          <stop offset="0.28" stopColor="#f0435a" />
          <stop offset="0.72" stopColor="#a8102c" />
          <stop offset="1" stopColor="#5c0516" />
        </radialGradient>
        <radialGradient id="ps-fruit" cx="36%" cy="30%" r="78%">
          <stop offset="0" stopColor="#ef6a5c" />
          <stop offset="0.45" stopColor="#c0242f" />
          <stop offset="1" stopColor="#5d0a15" />
        </radialGradient>
        <linearGradient id="ps-calyx" x1="0" x2="1">
          <stop offset="0" stopColor="#9c2c22" />
          <stop offset="0.5" stopColor="#d4543a" />
          <stop offset="1" stopColor="#8a2620" />
        </linearGradient>
        <linearGradient id="ps-brass" x1="0" x2="1">
          <stop offset="0" stopColor="#8a6626" />
          <stop offset="0.35" stopColor="#e4c171" />
          <stop offset="0.55" stopColor="#c89a42" />
          <stop offset="1" stopColor="#7a5a22" />
        </linearGradient>
        {[['#3f6e2e', '#6f9b45'], ['#4f8236', '#8fb35a'], ['#365f29', '#5f8a3c']].map(([a, b], i) => (
          <linearGradient key={i} id={`ps-leaf-${i}`} x1="0" y1="0" x2="1" y2="0">
            <stop offset="0" stopColor={a} />
            <stop offset="1" stopColor={b} />
          </linearGradient>
        ))}
        <clipPath id="ps-arch"><path d={ARCH} /></clipPath>
        <filter id="ps-soft" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="12" /></filter>
      </defs>

      {/* atmosphere */}
      <circle className="ps-warm" cx="220" cy="170" r="640" fill="url(#ps-warm)" />
      <path className="ps-frame" d="M140 600V300C140 190 260 140 330 110 370 92 392 74 400 46 408 74 430 92 470 110 540 140 660 190 660 300V600" fill="none" stroke="#d4af37" strokeWidth="1" opacity="0.28" />
      <path className="ps-frame" d="M164 600V306C164 206 274 160 340 132 378 116 396 100 400 80 404 100 422 116 460 132 526 160 636 206 636 306V600" fill="none" stroke="#d4af37" strokeWidth="0.6" opacity="0.16" />
      <g className="ps-motes">
        {MOTES.map((m, i) => (
          <circle key={i} className="ps-mote" cx={m.x} cy={m.y} r={m.r} style={{ animationDelay: `${m.delay}s`, animationDuration: `${m.dur}s` }} />
        ))}
      </g>
      <Sun />
      <polygon className="ps-beam" points="0,0 0,0 0,0" fill="url(#ps-beam)" />

      {/* pot: back rim and the soil surface */}
      <ellipse cx="400" cy="896" rx="250" ry="16" fill="#021c1f" opacity="0.35" filter="url(#ps-soft)" />
      <ellipse cx="400" cy="580" rx="190" ry="26" fill="#1a3f40" />
      <ellipse className="ps-soil-top" cx="400" cy="582" rx="178" ry="19" fill="url(#ps-soil-top)" />
      <ellipse className="ps-wet" cx="400" cy="582" rx="178" ry="19" fill="#1b0f08" />
      <ellipse className="ps-zone" cx={DROP_ZONE.x} cy={DROP_ZONE.y + 2} rx="74" ry="12" fill="none" stroke="#e9c76b" strokeWidth="1.4" strokeDasharray="5 6" />

      {/* the tree */}
      <g className="ps-tree">
        {tree.cotyledons.map((c) => (
          <g key={c.side} className="ps-cotyledon" transform={`translate(${BASE_X} ${GROUND_Y}) scale(0)`}>
            <path d="M0 0C3-9 12-13 20-10 17-2 8 2 0 0Z" fill="url(#ps-leaf-1)" />
          </g>
        ))}
        {tree.branches.map((b) => (
          <path key={b.id} className="ps-branch" d={branchPath(b)} pathLength="1" fill="none" stroke="#5a3d29" strokeLinecap="round" strokeDasharray="1 1" />
        ))}
        {tree.branches.map((b) => (
          <path key={b.id} className="ps-bark" d={branchPath(b)} pathLength="1" fill="none" stroke="#8a6346" strokeLinecap="round" strokeDasharray="1 1" transform="translate(-1.2 0)" opacity="0.8" />
        ))}
        {tree.leaves.map((leaf, i) => <Leaf key={i} leaf={leaf} index={i} />)}
        {tree.blossoms.map((b, i) => <Blossom key={i} blossom={b} index={i} />)}
      </g>
      {PETALS.map((i) => <ellipse key={i} className="ps-petal" rx="4" ry="2.4" fill="#e2402f" transform="translate(0 0)" />)}

      {/* pot body with an arched window into the soil */}
      <path d={POT_BODY} fill="url(#ps-pot)" />
      <path d="M206 590C207 612 208 626 210 640H590C592 626 593 612 594 590Z" fill="url(#ps-glaze)" />
      <path d="M206 590C207 612 208 626 210 640H590C592 626 593 612 594 590Z" fill="url(#ps-tiles)" opacity="0.8" />
      <path d="M210 640H590" stroke="#d4af37" strokeWidth="2" />
      <path d="M212 648H588" stroke="#d4af37" strokeWidth="0.8" opacity="0.7" />
      <path d="M288 860H512" stroke="#4a1f12" strokeWidth="6" strokeLinecap="round" />
      <g clipPath="url(#ps-arch)">
        <rect x="300" y="620" width="200" height="240" fill="url(#ps-soil-cut)" />
        {[[340, 700, 5], [452, 690, 4], [372, 770, 6], [436, 800, 5], [330, 820, 4], [470, 760, 3], [410, 830, 4]].map(([x, y, r], i) => (
          <ellipse key={i} cx={x} cy={y} rx={r} ry={r * 0.7} fill="#7a5a45" opacity="0.6" />
        ))}
        {Array.from({ length: 40 }, (_, i) => (
          <circle key={i} cx={322 + ((i * 53) % 156)} cy={650 + ((i * 37) % 190)} r={0.8 + (i % 3) * 0.5} fill="#8a6a50" opacity="0.5" />
        ))}
        <rect className="ps-wet" x="300" y="620" width="200" height="240" fill="#140a05" />
        {tree.roots.map((r, i) => (
          <path key={i} className="ps-root" d={r.d} pathLength="1" fill="none" stroke="#ead7af" strokeWidth={r.width} strokeLinecap="round" strokeDasharray="1 1" strokeDashoffset="1" />
        ))}
        <path className="ps-stem-under" d={`M${SEED_POS.x} ${SEED_POS.y - 8}C401 650 400 642 400 620`} pathLength="1" fill="none" stroke="#b9cf8a" strokeWidth="2.6" strokeLinecap="round" strokeDasharray="1 1" strokeDashoffset="1" />
        <g className="ps-seed-under" transform={`translate(${SEED_POS.x} ${SEED_POS.y})`}>
          <path d="M0-12C7.6-10 10.4-1.4 8.1 5.8 6 11.6-6 11.6-8.1 5.8-10.4-1.4-7.6-10 0-12Z" fill="url(#ps-aril)" transform="scale(0.85)" />
          <ellipse cx="0.5" cy="1.4" rx="2.2" ry="4.2" fill="#f4e7cf" opacity="0.85" />
        </g>
        <path d={ARCH} fill="none" stroke="#000" strokeWidth="14" opacity="0.28" />
      </g>
      <path d={ARCH} fill="none" stroke="#d4af37" strokeWidth="2.4" />
      <path d="M206 590C210 700 236 802 288 860" fill="none" stroke="#000" strokeWidth="18" opacity="0.08" />

      {/* front rim */}
      <path d="M210 584C214 604 300 612 400 612 500 612 586 604 590 584" fill="none" stroke="url(#ps-glaze)" strokeWidth="16" strokeLinecap="round" />
      <path d="M212 579C220 598 300 606 400 606 500 606 580 598 588 579" fill="none" stroke="#7fd0c4" strokeWidth="1.6" opacity="0.5" />
      {SOIL_CRUMBS.map((i) => <circle key={i} className="ps-crumb" cx="400" cy="578" r={1.6 + (i % 3)} fill="#4a2f1f" />)}

      <WateringCan />
      {DROPS.map((i) => <circle key={i} className="ps-drop" cx="400" cy="578" r="3.2" fill="#bfe8f0" />)}

      {/* drag hint */}
      <path className="ps-hint" id="ps-hint-path" d={`M${SEED_HOME.x} ${SEED_HOME.y}C${SEED_HOME.x + 40} ${SEED_HOME.y - 120} ${BASE_X - 60} ${GROUND_Y - 140} ${BASE_X} ${GROUND_Y - 24}`} fill="none" stroke="#e9c76b" strokeWidth="1.2" strokeDasharray="2 8" strokeLinecap="round" />
      <Seed />
    </svg>
  );
});

export default PlantScene;
