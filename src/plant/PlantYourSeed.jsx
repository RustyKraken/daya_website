import React, { useCallback, useEffect, useLayoutEffect, useReducer, useRef, useState } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { DayaFooter, MenuOverlay, SiteNav } from '../App.jsx';
import { PLANT_URL, SITE_HOME } from '../site.js';
import PlantScene from './PlantScene.jsx';

gsap.registerPlugin(ScrollTrigger);

const reduceMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// ---------- state machine ----------

const NEXT = { seed: 'water', water: 'sun', sun: 'grow', grow: 'done' };

function reducer(state, event) {
  switch (event.type) {
    case 'STAGE_DONE':
      return event.stage === state.stage && NEXT[state.stage] ? { ...state, stage: NEXT[state.stage] } : state;
    case 'REPLAY':
      return state.stage === 'done' ? { ...state, stage: 'resetting' } : state;
    case 'RESET_DONE':
      return { ...state, stage: 'seed', round: state.round + 1 };
    default:
      return state;
  }
}

const STEPS = [
  { id: 'seed', label: 'Plant' },
  { id: 'water', label: 'Water' },
  { id: 'sun', label: 'Light' },
  { id: 'grow', label: 'Grow' },
];

const COPY = {
  seed: {
    eyebrow: 'Plant your seed',
    title: 'It begins with a seed.',
    body: 'Plant a little piece of DAYA. Give it life, watch it grow, and discover the beauty of beginnings.',
    instruction: 'Drag the seed into the pot, or simply tap it.',
    action: 'Plant the seed',
  },
  water: {
    eyebrow: 'Step two',
    title: 'Give it water.',
    body: 'Every beginning needs a little care. Tilt the brass can and let the soil drink until the first green appears.',
    instruction: 'Press and hold the watering can.',
    action: 'Hold to water',
    hold: true,
  },
  sun: {
    eyebrow: 'Step three',
    title: 'Give it sunlight.',
    body: 'Under the Ibiza sun, every leaf finds its way. Hold the sun and guide it across the sky, and your seedling will follow.',
    instruction: 'Press and hold the sun. Drag it to move the light.',
    action: 'Hold for sunlight',
    hold: true,
  },
  grow: {
    eyebrow: 'Step four',
    title: 'Watch it grow.',
    body: 'Roots deepen, branches open, and the first red flowers slowly turn into fruit.',
    instruction: '',
    action: 'Skip ahead',
  },
  done: {
    eyebrow: 'Your tree',
    title: 'From a little seed, something beautiful grows.',
    body: 'Your little piece of DAYA is now part of something bigger.',
  },
};
COPY.resetting = COPY.done;

// ---------- small pieces ----------

function StepSeeds({ stage }) {
  const order = ['seed', 'water', 'sun', 'grow', 'done', 'resetting'];
  const current = order.indexOf(stage);
  return (
    <ol className="seed-steps" aria-label="Planting steps">
      {STEPS.map((step, i) => {
        const status = current > i ? 'done' : current === i ? 'current' : 'next';
        return (
          <li key={step.id} className={`seed-step is-${status}`} aria-current={status === 'current' ? 'step' : undefined}>
            <svg viewBox="0 0 24 32" aria-hidden="true" focusable="false">
              <path d="M12 3.7c-1.2 1.2-5.1 4.1-6.2 8.3C4.1 18.6 7 25.9 12 28.3c5-2.4 7.9-9.7 6.2-16.3C17.1 7.8 13.2 4.9 12 3.7Z" />
            </svg>
            <span>{step.label}</span>
          </li>
        );
      })}
    </ol>
  );
}

function HoldButton({ label, onStart, onStop, disabled }) {
  const holding = useRef(false);
  const start = () => {
    if (holding.current || disabled) return;
    holding.current = true;
    onStart();
  };
  const stop = () => {
    if (!holding.current) return;
    holding.current = false;
    onStop();
  };
  return (
    <button
      type="button"
      className="seed-action is-hold"
      disabled={disabled}
      onPointerDown={(event) => { event.currentTarget.setPointerCapture(event.pointerId); start(); }}
      onPointerUp={stop}
      onPointerCancel={stop}
      onLostPointerCapture={stop}
      onKeyDown={(event) => { if ((event.key === ' ' || event.key === 'Enter') && !event.repeat) { event.preventDefault(); start(); } }}
      onKeyUp={(event) => { if (event.key === ' ' || event.key === 'Enter') stop(); }}
      onBlur={stop}
      onContextMenu={(event) => event.preventDefault()}
    >
      <span className="seed-action-fill" aria-hidden="true" />
      <span className="seed-action-label">{label}</span>
    </button>
  );
}

const GUIDE = [
  {
    title: 'Prepare the seed',
    body: 'Rub away the red, juicy flesh around the seed, rinse it in water and let it dry for a day.',
    icon: <><path d="M24 8c-3 3-12 9-14 18-2 10 4 18 14 22 10-4 16-12 14-22C36 17 27 11 24 8Z" /><path d="M20 24c2-4 6-6 8-6" /></>,
  },
  {
    title: 'Plant it shallow',
    body: 'Press it about one centimetre deep into a small pot of light, well-draining seed compost.',
    icon: <><path d="M10 22h28l-4 22H14Z" /><path d="M8 22h32" /><path d="M24 16v-4" /><ellipse cx="24" cy="30" rx="3" ry="4" /></>,
  },
  {
    title: 'Keep it warm and moist',
    body: 'Water lightly so the soil stays damp but never wet, and keep the pot somewhere warm, ideally around 20 to 25 °C.',
    icon: <><path d="M24 8c6 9 10 15 10 21a10 10 0 0 1-20 0c0-6 4-12 10-21Z" /><path d="M19 30a5 5 0 0 0 5 5" /></>,
  },
  {
    title: 'Give it light',
    body: 'Once the first leaves appear, usually within a few weeks, move it to a bright, sunny spot.',
    icon: <><circle cx="24" cy="24" r="8" /><path d="M24 6v6M24 36v6M6 24h6M36 24h6M11 11l4 4M33 33l4 4M37 11l-4 4M15 33l-4 4" /></>,
  },
  {
    title: 'Be patient',
    body: 'Pot it on as it grows. A pomegranate grown from seed takes a few years to flower and fruit, and every season is part of the story.',
    icon: <><path d="M24 44V20" /><path d="M24 30c-8 0-12-5-12-11 7 0 12 4 12 11Z" /><path d="M24 24c0-8 5-12 12-12 0 7-4 12-12 12Z" /></>,
  },
];

// ---------- page ----------

export default function PlantYourSeed() {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuTriggerRef = useRef(null);
  const sceneRef = useRef(null);
  const copyRef = useRef(null);
  const progressRef = useRef(null);
  const pageRef = useRef(null);
  const [{ stage, round }, dispatch] = useReducer(reducer, { stage: 'seed', round: 0 });
  const [announcement, setAnnouncement] = useState('');
  const [shareNote, setShareNote] = useState('');

  const closeMenu = (returnFocus = true) => {
    setMenuOpen(false);
    if (returnFocus) window.setTimeout(() => menuTriggerRef.current?.focus(), 650);
  };

  const onStageDone = useCallback((done) => {
    if (done === 'reset') dispatch({ type: 'RESET_DONE' });
    else dispatch({ type: 'STAGE_DONE', stage: done });
  }, []);

  const onProgress = useCallback((_stage, value) => {
    const el = progressRef.current;
    if (!el) return;
    const pct = Math.round(Math.min(1, Math.max(0, value)) * 100);
    el.style.setProperty('--progress', `${pct}%`);
    el.setAttribute('aria-valuenow', String(pct));
  }, []);

  // drive the scene from the state machine
  useEffect(() => {
    const scene = sceneRef.current;
    if (!scene) return;
    onProgress(stage, 0);
    if (stage === 'grow') scene.grow();
    else if (stage === 'resetting') scene.replay();
    else if (stage !== 'done') scene.setStage(stage);

    const messages = {
      seed: 'Step one: plant the seed. Drag it into the pot, or use the Plant the seed button.',
      water: 'The seed is planted. Step two: press and hold to water it.',
      sun: 'A sprout has appeared. Step three: press and hold to give it sunlight.',
      grow: 'Your seedling is growing into a pomegranate tree.',
      done: 'Your pomegranate tree has grown.',
    };
    if (messages[stage]) setAnnouncement(messages[stage]);
  }, [stage, onProgress]);

  // copy transitions between stages
  useLayoutEffect(() => {
    if (!copyRef.current || reduceMotion()) return undefined;
    const tween = gsap.fromTo(copyRef.current.querySelectorAll('.seed-reveal'), { y: 18, opacity: 0 }, {
      y: 0, opacity: 1, duration: 0.8, stagger: 0.07, ease: 'power3.out',
    });
    return () => tween.kill();
  }, [stage]);

  // gentle entrance for the editorial sections
  useLayoutEffect(() => {
    if (reduceMotion()) return undefined;
    const ctx = gsap.context(() => {
      gsap.utils.toArray('.seed-fade').forEach((el) => {
        gsap.from(el, { y: 28, opacity: 0, duration: 0.9, ease: 'power3.out', scrollTrigger: { trigger: el, start: 'top 84%', once: true } });
      });
    }, pageRef);
    return () => ctx.revert();
  }, []);

  const share = async () => {
    const url = new URL(PLANT_URL, window.location.origin).toString();
    const data = { title: 'Plant your seed · DAYA Ibiza', text: 'I grew a pomegranate tree with DAYA. Plant your own seed:', url };
    try {
      if (navigator.share) {
        await navigator.share(data);
        return;
      }
      await navigator.clipboard.writeText(url);
      setShareNote('Link copied');
    } catch (error) {
      if (error?.name !== 'AbortError') setShareNote(url);
    }
    window.setTimeout(() => setShareNote(''), 3200);
  };

  const copy = COPY[stage];
  const isFinal = stage === 'done' || stage === 'resetting';

  return (
    <div ref={pageRef}>
      <a className="skip-link" href="#main-content">Skip to content</a>
      <MenuOverlay open={menuOpen} onClose={closeMenu} home={SITE_HOME} />
      <SiteNav onMenuOpen={() => setMenuOpen(true)} menuOpen={menuOpen} menuTriggerRef={menuTriggerRef} home={SITE_HOME} />

      <main id="main-content" tabIndex="-1">
        <section className={`seed-experience is-${stage}`} aria-labelledby="seed-title" data-nav-theme="light">
          {/* fixed position: the step indicator never moves between stages */}
          <div className="seed-steps-wrap"><StepSeeds stage={stage} /></div>

          <div className="seed-copy" ref={copyRef} key={`${stage}-${round}`}>
            <p className="seed-eyebrow seed-reveal">{copy.eyebrow}</p>
            {stage === 'seed'
              ? <h1 id="seed-title" className="seed-title seed-reveal">{copy.title}</h1>
              : <h2 id="seed-title" className="seed-title seed-reveal">{copy.title}</h2>}
            <p className="seed-body seed-reveal">{copy.body}</p>
            {isFinal && (
              <div className="seed-final seed-reveal">
                <div className="seed-final-actions">
                  <button type="button" className="seed-action" onClick={() => dispatch({ type: 'REPLAY' })} disabled={stage === 'resetting'}>
                    <span className="seed-action-label">Grow it again</span>
                  </button>
                  <button type="button" className="seed-link" onClick={share}>Share your tree</button>
                  <a className="seed-link" href="#take-home">Take a real seed home</a>
                </div>
                <p className="seed-share-note" aria-live="polite">{shareNote}</p>
              </div>
            )}
          </div>

          <div className="seed-art">
            <PlantScene ref={sceneRef} onStageDone={onStageDone} onProgress={onProgress} />
          </div>

          {!isFinal && (
            <div className="seed-controls" key={`controls-${stage}-${round}`}>
              {copy.instruction && <p className="seed-instruction">{copy.instruction}</p>}
              <div className="seed-control-row">
                {stage === 'seed' && (
                  <button type="button" className="seed-action" onClick={() => sceneRef.current?.plant()}>
                    <span className="seed-action-label">{copy.action}</span>
                  </button>
                )}
                {stage === 'water' && <HoldButton label={copy.action} onStart={() => sceneRef.current?.startPour()} onStop={() => sceneRef.current?.stopPour()} />}
                {stage === 'sun' && <HoldButton label={copy.action} onStart={() => sceneRef.current?.startShine()} onStop={() => sceneRef.current?.stopShine()} />}
                {stage === 'grow' && (
                  <button type="button" className="seed-link" onClick={() => sceneRef.current?.skipGrowth()}>{copy.action}</button>
                )}
                {stage !== 'seed' && (
                  <div
                    ref={progressRef}
                    className="seed-progress"
                    role="progressbar"
                    aria-label={`${STEPS.find((s) => s.id === stage)?.label ?? ''} progress`}
                    aria-valuemin="0"
                    aria-valuemax="100"
                    aria-valuenow="0"
                  >
                    <span />
                  </div>
                )}
              </div>
            </div>
          )}
          <p className="visually-hidden" aria-live="polite">{announcement}</p>
        </section>

        <section className="seed-home" id="take-home" aria-labelledby="take-home-title" data-nav-theme="dark">
          <div className="seed-home-intro seed-fade">
            <p className="seed-eyebrow">Beyond our walls</p>
            <h2 id="take-home-title">Take a little piece of DAYA home.</h2>
            <p>
              Some things are meant to grow beyond our walls. At DAYA, you can take a seed home, plant it, and watch something beautiful begin. A small reminder that meaningful things grow with care.
            </p>
            <p>
              Look for the seed pots outside the restaurant. Take a seed with you, plant it at home and grow your own pomegranate, a living souvenir of an evening at DAYA.
            </p>
          </div>

          <div className="seed-guide seed-fade">
            <h3>Grow your own pomegranate</h3>
            <ol>
              {GUIDE.map((step, i) => (
                <li key={step.title}>
                  <svg viewBox="0 0 48 48" aria-hidden="true" focusable="false">{step.icon}</svg>
                  <span className="seed-guide-index">0{i + 1}</span>
                  <h4>{step.title}</h4>
                  <p>{step.body}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>
      </main>

      <DayaFooter home={SITE_HOME} />
    </div>
  );
}
