import React, { useId, useLayoutEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const reduceMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const svgId = (id) => id.replace(/[^a-zA-Z0-9_-]/g, '');
const angles = (count, offset = 0) => Array.from({ length: count }, (_, index) => offset + (index * 360) / count);

// Shamseh-style carpet medallion. Its rings turn against each other while the parent section scrolls.
export function Medallion({ className = '', spin = 90 }) {
  const ref = useRef(null);

  useLayoutEffect(() => {
    if (reduceMotion()) return undefined;
    const ctx = gsap.context(() => {
      const scrollTrigger = {
        trigger: ref.current.parentElement,
        start: 'top bottom',
        end: 'bottom top',
        scrub: 1.4,
      };
      gsap.fromTo('.medallion-outer', { rotation: 0 }, { rotation: spin, ease: 'none', svgOrigin: '0 0', scrollTrigger });
      gsap.fromTo('.medallion-petals', { rotation: 0 }, { rotation: -spin * 0.6, ease: 'none', svgOrigin: '0 0', scrollTrigger });
      gsap.fromTo('.medallion-core', { rotation: 0 }, { rotation: spin * 1.5, ease: 'none', svgOrigin: '0 0', scrollTrigger });
    }, ref);
    return () => ctx.revert();
  }, [spin]);

  return (
    <svg ref={ref} className={`medallion ${className}`.trim()} viewBox="-300 -300 600 600" aria-hidden="true" focusable="false">
      <g className="medallion-outer">
        {angles(16).map((angle) => (
          <path key={angle} className="rug-navy rug-gold-line" transform={`rotate(${angle})`} d="M0 -292C34 -252 54 -216 42 -176L0 -150-42 -176C-54 -216-34 -252 0 -292Z" />
        ))}
        {angles(16).map((angle) => (
          <path key={angle} className="rug-teal" transform={`rotate(${angle})`} d="M0 -262C14 -240 18 -214 10 -196L0 -186-10 -196C-18 -214-14 -240 0 -262Z" />
        ))}
        <circle className="rug-navy" r="178" />
        {angles(48).map((angle) => (
          <circle key={angle} className="rug-gold" cx="0" cy="-184" r="3.2" transform={`rotate(${angle})`} />
        ))}
      </g>
      <g className="medallion-petals">
        {angles(8, 22.5).map((angle) => (
          <path key={angle} className="rug-teal" transform={`rotate(${angle})`} d="M0 -158C18 -134 18 -106 0 -88-18 -106-18 -134 0 -158Z" />
        ))}
        {angles(8).map((angle) => (
          <g key={angle} transform={`rotate(${angle})`}>
            <path className="rug-red rug-gold-line" d="M0 -170C52 -132 60 -80 0 -38-60 -80-52 -132 0 -170Z" />
            <path className="rug-sand" d="M0 -144C30 -120 34 -90 0 -62-34 -90-30 -120 0 -144Z" />
            <circle className="rug-red" cx="0" cy="-104" r="9" />
          </g>
        ))}
      </g>
      <g className="medallion-core">
        <polygon
          className="rug-gold"
          points={angles(24).map((angle, index) => {
            const radius = index % 2 === 0 ? 52 : 30;
            const rad = (angle * Math.PI) / 180;
            return `${(Math.sin(rad) * radius).toFixed(1)},${(-Math.cos(rad) * radius).toFixed(1)}`;
          }).join(' ')}
        />
        <circle className="rug-red" r="24" />
        <circle className="rug-sand" r="9" />
      </g>
    </svg>
  );
}

// Boteh (paisley) – drifts on scroll, with a gentle CSS sway on the inner drawing.
export function Paisley({ className = '', speed = 1 }) {
  const ref = useRef(null);

  useLayoutEffect(() => {
    if (reduceMotion()) return undefined;
    const ctx = gsap.context(() => {
      gsap.fromTo(ref.current, { y: 90 * speed, rotation: -10 * speed }, {
        y: -90 * speed,
        rotation: 10 * speed,
        ease: 'none',
        scrollTrigger: { trigger: ref.current.parentElement, start: 'top bottom', end: 'bottom top', scrub: 1.2 },
      });
    }, ref);
    return () => ctx.revert();
  }, [speed]);

  return (
    <span ref={ref} className={`paisley ${className}`.trim()} aria-hidden="true">
      <svg viewBox="0 0 120 180" focusable="false">
        <path className="rug-teal rug-gold-line" d="M62 172C24 172 6 142 10 108 15 66 62 56 78 26 84 14 78 4 66 6 86-2 104 14 100 40 96 74 116 96 112 128 108 156 90 172 62 172Z" />
        <path className="rug-sand" transform="translate(19 40) scale(0.68)" d="M62 172C24 172 6 142 10 108 15 66 62 56 78 26 84 14 78 4 66 6 86-2 104 14 100 40 96 74 116 96 112 128 108 156 90 172 62 172Z" />
        <g transform="translate(62 122)">
          {angles(6).map((angle) => (
            <ellipse key={angle} className="rug-red" rx="7" ry="14" cy="-13" transform={`rotate(${angle})`} />
          ))}
          <circle className="rug-gold" r="6" />
        </g>
        <path className="rug-leaf" d="M58 96C50 82 52 70 62 62 66 76 66 86 58 96Z" />
        <path className="rug-leaf" d="M80 104C88 92 98 88 106 90 100 102 92 106 80 104Z" />
      </svg>
    </span>
  );
}

// Full-width carpet border. The weave slides slowly sideways with the scroll.
export function CarpetRunner({ fringe = false }) {
  const ref = useRef(null);
  const id = svgId(useId());

  useLayoutEffect(() => {
    if (reduceMotion()) return undefined;
    const ctx = gsap.context(() => {
      const weave = ref.current.querySelector('pattern');
      const shift = { x: 0 };
      gsap.to(shift, {
        x: 160,
        ease: 'none',
        scrollTrigger: { trigger: ref.current, start: 'top bottom', end: 'bottom top', scrub: 2 },
        onUpdate: () => weave.setAttribute('x', shift.x.toFixed(1)),
      });
    }, ref);
    return () => ctx.revert();
  }, []);

  const sawtooth = (y, down) => [0, 16, 32, 48, 64, 80, 96, 112, 128, 144].map((x) => (
    <path key={`${x}-${y}`} className="rug-sand" d={`M${x} ${y}L${x + 8} ${down ? y + 8 : y - 8} ${x + 16} ${y}Z`} />
  ));

  return (
    <div ref={ref} className="carpet-runner" aria-hidden="true">
      <svg className="carpet-runner-svg" width="100%" height="148" focusable="false">
        <defs>
          <pattern id={`${id}-weave`} width="160" height="148" patternUnits="userSpaceOnUse">
            <rect className="rug-sand" width="160" height="148" />
            {[8, 28, 48, 68, 88, 108, 128, 148].map((x) => (
              <g key={x}>
                <circle className="rug-red" cx={x} cy="4" r="1.6" />
                <circle className="rug-red" cx={x} cy="144" r="1.6" />
              </g>
            ))}
            <rect className="rug-red" y="8" width="160" height="16" />
            {sawtooth(8, true)}
            {sawtooth(24, false)}
            <rect className="rug-red" y="124" width="160" height="16" />
            {sawtooth(124, true)}
            {sawtooth(140, false)}
            <rect className="rug-gold" y="24" width="160" height="2" />
            <rect className="rug-gold" y="122" width="160" height="2" />
            <rect className="rug-navy" y="26" width="160" height="96" />
            <path className="rug-vine" d="M0 74C20 40 60 40 80 74S140 108 160 74" />
            {[[16, 54, -30], [64, 54, 30], [96, 94, -30], [144, 94, 30]].map(([x, y, r]) => (
              <ellipse key={`${x}-${y}`} className="rug-leaf" cx={x} cy={y} rx="4" ry="9" transform={`rotate(${r} ${x} ${y})`} />
            ))}
            {[[80, 40], [0, 108], [160, 108], [80, 108], [0, 40], [160, 40]].map(([x, y]) => (
              <circle key={`${x}-${y}`} className="rug-gold" cx={x} cy={y} r="2.4" />
            ))}
            <g transform="translate(40 74)">
              {angles(12).map((angle) => (
                <ellipse key={angle} className="rug-red" rx="6" ry="20" cy="-18" transform={`rotate(${angle})`} />
              ))}
              {angles(8, 22.5).map((angle) => (
                <ellipse key={angle} className="rug-sand" rx="4" ry="12" cy="-12" transform={`rotate(${angle})`} />
              ))}
              <circle className="rug-teal" r="10" />
              <circle className="rug-gold" r="5" />
            </g>
            <g transform="translate(120 74)">
              <path className="rug-teal rug-gold-line" d="M0-38 15-23H26V-12L38 0 26 12V23H15L0 38-15 23H-26V12L-38 0-26-12V-23H-15Z" />
              <path className="rug-sand" d="M0-25 25 0 0 25-25 0Z" />
              <path className="rug-red" d="M0-16 16 0 0 16-16 0Z" />
              <path className="rug-gold" d="M-2-9H2V-2H9V2H2V9H-2V2H-9V-2H-2Z" />
            </g>
          </pattern>
        </defs>
        <rect width="100%" height="148" fill={`url(#${id}-weave)`} />
      </svg>
      {fringe && <span className="carpet-fringe" />}
    </div>
  );
}

// Static turquoise carpet field (lattice, rosettes and palmettes) laid behind a section.
export function CarpetField({ className = '' }) {
  const id = svgId(useId());

  return (
    <svg className={`carpet-field ${className}`.trim()} width="100%" height="100%" aria-hidden="true" focusable="false">
      <defs>
        <pattern id={`${id}-lattice`} width="56" height="56" patternUnits="userSpaceOnUse" patternTransform="scale(0.6)">
          <path className="field-cell" d="M28 2 54 28 28 54 2 28Z" />
          <path className="field-line" d="M28 0 56 28 28 56 0 28Z" />
          <g transform="translate(28 28)">
            {angles(8).map((angle) => (
              <ellipse key={angle} className="field-petal" rx="2.6" ry="7.5" cy="-7" transform={`rotate(${angle})`} />
            ))}
            <circle className="field-dot" r="2.6" />
          </g>
          {[[0, 0], [56, 0], [0, 56], [56, 56]].map(([x, y]) => (
            <g key={`${x}-${y}`} transform={`translate(${x} ${y})`}>
              {angles(4).map((angle) => (
                <path key={angle} className="field-palmette" d="M0 0C3-3 4-7 0-11-4-7-3-3 0 0Z" transform={`rotate(${angle})`} />
              ))}
              <circle className="field-dot" r="1.8" />
            </g>
          ))}
          {[[14, 14], [42, 14], [14, 42], [42, 42]].map(([x, y]) => (
            <circle key={`${x}-${y}`} className="field-seed" cx={x} cy={y} r="1.2" />
          ))}
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill={`url(#${id}-lattice)`} />
    </svg>
  );
}

// Tone-on-tone pomegranate for the open navigation: a whole fruit with crown and leaves,
// and a halved one in front showing its chambers of seeds.
const halfArils = (() => {
  const arils = [];
  const chambers = 6;
  for (let ring = 0; ring < 7; ring += 1) {
    const radius = 12 + ring * 13;
    const count = Math.round((2 * Math.PI * radius) / 11.5);
    for (let i = 0; i < count; i += 1) {
      const angle = (i / count) * Math.PI * 2 + ring * 0.4;
      const toMembrane = Math.abs(((angle / (Math.PI * 2)) * chambers) % 1 - 0.5);
      if (toMembrane > 0.44 || radius > 96) continue;
      arils.push({ x: Math.cos(angle) * radius, y: Math.sin(angle) * radius * 0.82, rotate: (angle * 180) / Math.PI + 90 });
    }
  }
  return arils;
})();

export function MenuPomegranate() {
  const id = svgId(useId());
  return (
    <svg className="menu-pomegranate" viewBox="0 0 520 540" aria-hidden="true" focusable="false">
      <defs>
        <radialGradient id={`${id}-tint`} cx="38%" cy="32%" r="75%">
          <stop offset="0" stopColor="#ead7af" stopOpacity="0.2" />
          <stop offset="1" stopColor="#ead7af" stopOpacity="0.02" />
        </radialGradient>
      </defs>

      {/* whole fruit */}
      <g className="mp-whole">
        <path className="mp-fill" d="M310 112C398 108 462 172 462 260 462 350 394 414 310 414 226 414 158 350 158 260 158 172 222 108 310 112Z" fill={`url(#${id}-tint)`} />
        <path className="mp-line" pathLength="1" d="M310 112C398 108 462 172 462 260 462 350 394 414 310 414 226 414 158 350 158 260 158 172 222 108 310 112Z" />
        <path className="mp-line" pathLength="1" d="M282 118C286 100 286 88 280 76H340C334 88 334 100 338 118" />
        {[-26, -14, -3, 8, 19, 30].map((x, i) => (
          <path key={x} className="mp-line" pathLength="1" d={`M${310 + x * 0.7} 78L${310 + x * 1.25} ${46 + (i % 2) * 8}L${310 + x * 0.7 + 7} 76`} />
        ))}
        <path className="mp-line mp-thin" pathLength="1" d="M292 78C300 82 320 82 328 78" />
        <path className="mp-line mp-thin" pathLength="1" d="M196 222C206 180 236 146 278 130" />
        <path className="mp-line mp-thin" pathLength="1" d="M420 330C404 368 376 392 340 404" />
        <path className="mp-line" pathLength="1" d="M336 98C352 92 368 90 386 92" />
        <path className="mp-line mp-fill-leaf" pathLength="1" d="M372 90C392 64 430 56 462 64 440 90 404 100 372 90Z" />
        <path className="mp-line mp-thin" pathLength="1" d="M376 89C400 80 428 70 456 66" />
        <path className="mp-line mp-fill-leaf" pathLength="1" d="M384 96C412 90 446 100 468 118 438 126 404 116 384 96Z" />
        <path className="mp-line mp-thin" pathLength="1" d="M388 97C414 102 442 110 462 117" />
      </g>

      {/* halved fruit */}
      <g className="mp-half" transform="translate(150 402)">
        <path className="mp-occlude" d="M-118 0C-118-53-65-96 0-96 65-96 118-53 118 0 118 72 62 120 0 120-62 120-118 72-118 0Z" />
        <path className="mp-fill" d="M-118 0C-118 72-62 120 0 120 62 120 118 72 118 0Z" fill={`url(#${id}-tint)`} />
        <path className="mp-line" pathLength="1" d="M-118 0C-118 72-62 120 0 120 62 120 118 72 118 0" />
        <ellipse className="mp-face" rx="118" ry="96" />
        <ellipse className="mp-line" pathLength="1" rx="118" ry="96" />
        <ellipse className="mp-line mp-thin" pathLength="1" rx="104" ry="84" />
        {[0, 1, 2, 3, 4, 5].map((i) => {
          const a = (i / 6) * Math.PI * 2 + Math.PI / 6;
          return <path key={i} className="mp-line mp-thin" pathLength="1" d={`M0 0Q${(Math.cos(a + 0.3) * 50).toFixed(1)} ${(Math.sin(a + 0.3) * 40).toFixed(1)} ${(Math.cos(a) * 104).toFixed(1)} ${(Math.sin(a) * 84).toFixed(1)}`} />;
        })}
        {halfArils.map((a, i) => (
          <path
            key={i}
            className="mp-aril"
            style={{ '--i': i }}
            transform={`translate(${a.x.toFixed(1)} ${a.y.toFixed(1)}) rotate(${a.rotate.toFixed(1)})`}
            d="M0-6.6C4.2-5.4 5.6-.8 4.4 3.1 3.1 6.1-3.1 6.1-4.4 3.1-5.6-.8-4.2-5.4 0-6.6Z"
          />
        ))}
      </g>

      {[[40, 300], [70, 254], [24, 360], [312, 470]].map(([x, y], i) => (
        <path key={i} className="mp-aril mp-loose" style={{ '--i': 60 + i * 4 }} transform={`translate(${x} ${y}) rotate(${i * 40})`} d="M0-9C6-7.4 7.8-1 6 4.4 4.4 8.4-4.4 8.4-6 4.4-7.8-1-6-7.4 0-9Z" />
      ))}
    </svg>
  );
}
