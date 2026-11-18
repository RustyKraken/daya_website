import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { CarpetField, MenuPomegranate } from './persian.jsx';
import { PomegranateBranch } from './anar-branch.jsx';
import { CONTACT_URL, MENUS, PLANT_URL, VISIT } from './site.js';

gsap.registerPlugin(ScrollTrigger);

const asset = (path) => `${import.meta.env.BASE_URL}${path.replace(/^\/+/, '')}`;
const media = (name) => asset(`media/${name}.avif`);
const reduceMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const external = { target: '_blank', rel: 'noopener noreferrer' };

// Hero slideshow, alternating evening and daytime.
const heroImages = ['nightterreza', 'dayagarden', 'nightwohnzimmerlight', 'dayagarden2'];

const houseImages = [
  { image: 'granat', className: 'about-card-one', alt: 'Fresh pomegranates in a wooden bowl at DAYA' },
  { image: 'livingggroom', className: 'about-card-two', alt: 'The warmly lit lounge at DAYA' },
  { image: 'granatapfel', className: 'about-card-three', alt: 'A pomegranate tree in the Ibiza sun beside a turquoise door at DAYA' },
];

const menuImages = [
  { image: 'naanteig', alt: 'Bread dough resting in the DAYA kitchen' },
  { image: 'naanheart', alt: 'Flatbread freshly baked in the DAYA kitchen' },
  { image: 'brot', alt: 'Golden bread topped with sesame at DAYA' },
];

const houseStrip = [
  { image: 'room', alt: 'Dining room at DAYA with patterned tiles and warm light' },
  { image: 'barrr', alt: 'Turquoise-tiled bar with brass stools at DAYA' },
  { image: 'night_inside', alt: 'Round table dressed in woven textiles inside DAYA at night' },
  { image: 'night_gardentable', alt: 'Candlelit table on the DAYA terrace at night' },
  { image: 'entrance', alt: 'Turquoise doors, lantern and plants at the DAYA entrance' },
  { image: 'nightlivvving', alt: 'Candlelit lounge corner at DAYA in the evening' },
];

const primaryNavigation = [
  { label: 'Home', href: '#home' },
  { label: 'Our House', href: '#our-house' },
  { label: 'Menus', href: '#menus' },
  { label: 'Visit Us', href: '#visit' },
];

// The original DAYA logo: pomegranate, wordmark and IBIZA. On light backgrounds it is tinted petrol.
function DayaLogo({ layout = 'row' }) {
  return (
    <span
      className={`daya-logo daya-logo-${layout}`}
      style={{ '--logo-icon': `url(${asset('media/daya-icon.avif')})`, '--logo-wordmark': `url(${asset('media/daya-wordmark.avif')})` }}
      aria-hidden="true"
    >
      <span className="daya-logo-icon" />
      <span className="daya-logo-text">
        <span className="daya-logo-wordmark" />
        <span className="daya-logo-place">Ibiza</span>
      </span>
    </span>
  );
}

function DayaOrnament({ side }) {
  return (
    <svg className={`daya-button-ornament daya-button-ornament-${side}`} viewBox="0 0 16 16" aria-hidden="true">
      <path d="M8 0.8c.7 4.3 2.9 6.5 7.2 7.2-4.3.7-6.5 2.9-7.2 7.2C7.3 10.9 5.1 8.7.8 8 5.1 7.3 7.3 5.1 8 .8Z" />
      <circle cx="8" cy="8" r="1.15" />
    </svg>
  );
}

// Decorative Persian word, set in Nastaliq. Purely ornamental, so hidden from screen readers.
function PersianWord({ children, className = '' }) {
  return <span className={`fa-script ${className}`.trim()} lang="fa" dir="rtl" aria-hidden="true">{children}</span>;
}

function DayaButton({ href, label, className = '', icon = null, ...linkProps }) {
  const renderCharacters = (layer) => {
    let visibleIndex = 0;
    return Array.from(label).map((character, index) => {
      if (character === ' ') {
        return <span className="daya-button-space" aria-hidden="true" key={`${layer}-space-${index}`}>&nbsp;</span>;
      }

      const characterIndex = visibleIndex;
      const exitsDown = characterIndex % 2 === 0;
      visibleIndex += 1;
      return (
        <span
          className="daya-button-char"
          aria-hidden="true"
          key={`${layer}-${character}-${index}`}
          style={{
            '--char-exit-y': exitsDown ? '18px' : '-18px',
            '--char-enter-y': exitsDown ? '-18px' : '18px',
            '--char-delay': `${characterIndex * 10}ms`,
          }}
        >
          {character}
        </span>
      );
    });
  };

  return (
    <a className={`daya-button ${className}`.trim()} href={href} aria-label={label} {...linkProps}>
      {icon ?? <DayaOrnament side="left" />}
      <span className="daya-button-label">
        <span className="daya-button-label-layer daya-button-label-current">{renderCharacters('current')}</span>
        <span className="daya-button-label-layer daya-button-label-hover">{renderCharacters('hover')}</span>
      </span>
      {!icon && <DayaOrnament side="right" />}
    </a>
  );
}

function MenuOverlay({ open, onClose, home = '' }) {
  const closeRef = useRef(null);

  useEffect(() => {
    if (!open) return undefined;

    const onKeyDown = (event) => {
      if (event.key === 'Escape') onClose();
      if (event.key !== 'Tab') return;

      const overlay = closeRef.current?.closest('.menu-overlay');
      const focusable = overlay?.querySelectorAll('button, a[href]');
      if (!focusable?.length) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKeyDown);
    const focusTimer = window.setTimeout(() => closeRef.current?.focus(), 650);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.clearTimeout(focusTimer);
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [open, onClose]);

  const tabIndex = open ? 0 : -1;

  return (
    <div
      id="site-menu"
      className="menu-overlay"
      data-open={open}
      aria-hidden={!open}
      role="dialog"
      aria-modal="true"
      aria-label="Main navigation"
    >
      <MenuPomegranate />
      <div className="menu-header">
        <a className="menu-signature" href={`${home}#home`} onClick={() => onClose(false)} tabIndex={tabIndex} aria-label="DAYA Ibiza home">
          <DayaLogo />
        </a>
        <button ref={closeRef} className="close-menu" onClick={onClose} aria-label="Close navigation">
          <span />
          <span />
        </button>
      </div>

      <nav className="menu-nav" aria-label="Primary navigation">
        {primaryNavigation.map((item, index) => (
          <React.Fragment key={item.label}>
            <a className="menu-nav-item" href={`${home}${item.href}`} onClick={() => onClose(false)} tabIndex={tabIndex} style={{ '--menu-index': index }}>
              <span className="menu-index" aria-hidden="true">0{index + 1}</span>
              <span className="menu-label">{item.label}</span>
              <span className="menu-line" />
            </a>
            {item.href === '#menus' && (
              <div className="menu-sublinks" style={{ '--menu-index': index }}>
                {MENUS.map((menu) => (
                  <a key={menu.id} href={menu.href} {...external} onClick={() => onClose(false)} tabIndex={tabIndex}>{menu.label}</a>
                ))}
              </div>
            )}
          </React.Fragment>
        ))}
      </nav>
    </div>
  );
}

function SiteNav({ onMenuOpen, menuOpen, menuTriggerRef, home = '' }) {
  const [theme, setTheme] = useState('light');

  useEffect(() => {
    let frame = null;

    const updateTheme = () => {
      if (frame) window.cancelAnimationFrame(frame);
      frame = window.requestAnimationFrame(() => {
        const sampleY = 52;
        const sections = [...document.querySelectorAll('[data-nav-theme]')];
        const activeSection = sections.find((section) => {
          const rect = section.getBoundingClientRect();
          return rect.top <= sampleY && rect.bottom > sampleY;
        });
        if (activeSection?.dataset.navTheme) setTheme(activeSection.dataset.navTheme);
      });
    };

    updateTheme();
    window.addEventListener('scroll', updateTheme, { passive: true });
    window.addEventListener('resize', updateTheme);

    return () => {
      if (frame) window.cancelAnimationFrame(frame);
      window.removeEventListener('scroll', updateTheme);
      window.removeEventListener('resize', updateTheme);
    };
  }, []);

  const link = (item) => <a key={item.label} href={`${home}${item.href}`}>{item.label}</a>;

  return (
    <header className="hero-nav" data-theme={theme}>
      <button
        ref={menuTriggerRef}
        className="menu-trigger"
        onClick={onMenuOpen}
        aria-label="Open navigation"
        aria-expanded={menuOpen}
        aria-controls="site-menu"
      >
        <span className="menu-toggle" aria-hidden="true">
          <span />
          <span />
          <span />
        </span>
      </button>
      <nav className="nav-links nav-links-left" aria-label="Primary navigation">
        {primaryNavigation.slice(0, 2).map(link)}
      </nav>
      <a className="nav-logo" href={`${home}#home`} aria-label="DAYA Ibiza home">
        <DayaLogo />
      </a>
      <nav className="nav-links nav-links-right" aria-label="Menus and visit">
        {primaryNavigation.slice(2).map(link)}
      </nav>
    </header>
  );
}

function Hero() {
  const heroRef = useRef(null);

  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      if (reduceMotion()) return undefined;

      gsap.timeline({ defaults: { ease: 'power3.out' } })
        .from('.hero-kicker', { y: 14, opacity: 0, duration: 0.8 }, 0.2)
        .from('.hero-title-line', { yPercent: 110, duration: 1 }, 0.3)
        .from('.hero-lead', { y: 22, opacity: 0, duration: 0.9 }, 0.7)
        .from('.hero-actions', { y: 18, opacity: 0, duration: 0.8 }, 0.9);

      // Slideshow: each photo holds for a while, then cross-fades into the next with a slow zoom.
      const slides = gsap.utils.toArray('.hero-slide');
      let current = 0;
      gsap.set(slides, { autoAlpha: 0 });
      gsap.set(slides[0], { autoAlpha: 1 });
      gsap.fromTo(slides[0], { scale: 1 }, { scale: 1.06, duration: 10, ease: 'none' });
      const advance = () => {
        const previous = slides[current];
        current = (current + 1) % slides.length;
        const next = slides[current];
        gsap.set(next, { zIndex: 2 });
        gsap.set(previous, { zIndex: 1 });
        gsap.fromTo(next, { autoAlpha: 0, scale: 1 }, { autoAlpha: 1, duration: 1.8, ease: 'power2.inOut' });
        gsap.to(next, { scale: 1.06, duration: 10, ease: 'none' });
        gsap.to(previous, { autoAlpha: 0, duration: 1.8, delay: 0.4, ease: 'power1.inOut' });
      };
      const interval = window.setInterval(advance, 9000);

      gsap.to('.hero-media', {
        scale: 1.08,
        ease: 'none',
        scrollTrigger: { trigger: heroRef.current, start: 'top top', end: 'bottom top', scrub: 1.2 },
      });

      return () => window.clearInterval(interval);
    }, heroRef);

    return () => ctx.revert();
  }, []);

  return (
    <section ref={heroRef} className="hero" id="home" aria-labelledby="hero-title" data-nav-theme="light">
      <div className="hero-media" aria-hidden="true">
        {heroImages.map((name, index) => (
          <img
            className="hero-video hero-slide"
            src={media(name)}
            alt=""
            key={name}
            fetchPriority={index === 0 ? 'high' : 'low'}
            decoding="async"
          />
        ))}
      </div>
      <div className="hero-scrim" />

      <div className="hero-content">
        <p className="hero-kicker">
          <span>DAYA · Ibiza</span>
          <span>Restaurant · Lounge · Bar</span>
        </p>
        <h1 id="hero-title">
          <span className="hero-title-mask"><span className="hero-title-line">A place to arrive.</span></span>
        </h1>
        <p className="hero-lead">
          It all begins with a seed. A table brings people together. A house becomes a place of belonging.
        </p>
        <div className="hero-actions">
          <DayaButton className="daya-button-hero" href="#menus" label="Explore Our Menus" />
          <DayaButton className="daya-button-hero daya-button-light" href={PLANT_URL} label="Plant Your Seed" />
        </div>
      </div>
    </section>
  );
}

// Fades the direct children of every [data-reveal] block in as it scrolls into view.
function useReveal(ref) {
  useLayoutEffect(() => {
    if (reduceMotion()) return undefined;
    const ctx = gsap.context(() => {
      gsap.utils.toArray('[data-reveal]').forEach((block) => {
        gsap.from(block.children, {
          y: 20,
          opacity: 0,
          duration: 0.8,
          stagger: 0.08,
          ease: 'power3.out',
          scrollTrigger: { trigger: block, start: 'top 86%', once: true },
        });
      });
    }, ref);
    return () => ctx.revert();
  }, [ref]);
}

function Welcome() {
  const sectionRef = useRef(null);
  useReveal(sectionRef);

  return (
    <section className="welcome-section" ref={sectionRef} aria-label="Welcome to DAYA" data-nav-theme="dark">
      <div className="welcome-inner" data-reveal>
        <p className="welcome-lead">
          Welcome to DAYA — our family’s hospitality house in Ibiza. Our mother’s recipes are at its heart, bringing people together over food, tea and drinks.
        </p>
        <p>Come for lunch. Share dinner. Settle in for a cocktail or a tea.</p>
        <p className="welcome-close">There’s a place for you here.</p>
      </div>
    </section>
  );
}

function OurHouse() {
  const sectionRef = useRef(null);
  const stackRef = useRef(null);
  useReveal(sectionRef);

  useLayoutEffect(() => {
    if (reduceMotion()) return undefined;
    const ctx = gsap.context(() => {
      const mobile = window.matchMedia('(max-width: 680px)').matches;
      const resting = mobile ? [-3.5, 1.5, -2] : [-6, 2, -3];
      const starting = mobile ? [-8, 6, -6] : [-13, 9, -9];
      gsap.fromTo('.about-image-card', {
        y: 58,
        opacity: 0,
        rotation: (index) => starting[index],
      }, {
        y: 0,
        opacity: 1,
        rotation: (index) => resting[index],
        duration: 1,
        stagger: 0.22,
        ease: 'power3.out',
        scrollTrigger: { trigger: stackRef.current, start: 'top 82%', once: true },
      });
    }, sectionRef);
    return () => ctx.revert();
  }, []);

  return (
    <section className="about-section" id="our-house" ref={sectionRef} aria-labelledby="our-house-title" data-nav-theme="dark">
      <div className="about-layout">
        <div className="about-visual">
          <div className="about-image-stack" ref={stackRef}>
            {houseImages.map((item) => (
              <figure className={`about-image-card ${item.className}`} key={item.image}>
                <img src={media(item.image)} alt={item.alt} loading="lazy" />
              </figure>
            ))}
          </div>
        </div>

        <div className="about-history" data-reveal>
          <p className="section-eyebrow">Our House</p>
          <h2 className="section-title" id="our-house-title">Many seeds. One home.</h2>
          <p>
            DAYA means “mother” in Kurdish. Life begins with a mother. Our house begins with ours — her recipes, her generosity and the way she makes people feel at home.
          </p>
          <p>
            We are a Kurdish family with roots in Iran. Our mother’s cooking carries our traditions, enriched by friendships and flavours from around the world.
          </p>
          <p className="about-highlight">Her recipes are the heart of DAYA.</p>
          <p>
            Hospitality is how we grew up: making space, sharing food and always welcoming one more.
          </p>
        </div>
      </div>

      <PomegranateBranch className="house-branch" />

      <div className="house-closing" data-reveal>
        <p>
          For us, the pomegranate is a reminder of togetherness — many seeds held within one fruit, like different stories gathered around a table. And just as a seed needs time to grow, we believe the best moments deserve room to unfold.
        </p>
        <p>Stay for another tea. Share a little more. Laugh, talk about life, or simply enjoy being here.</p>
        <p className="house-welcome">Welcome to our house.</p>
      </div>
    </section>
  );
}

// The story of DAYA: four chapters along a line that fills as you scroll.
const storyEntries = [
  {
    label: '01 · The roots',
    title: 'Hospitality comes first.',
    body: 'DAYA starts with a simple Persian principle: a guest should feel cared for. That generosity shapes the welcome, the pace of service, and every dish placed at the centre of the table.',
    image: 'night_entraze',
    alt: 'An open studded door leading into DAYA at night',
    side: 'left',
    rotation: -3,
  },
  {
    label: '02 · The craft',
    title: 'Memory becomes flavour.',
    body: 'Saffron, herbs, smoke, citrus, and pomegranate connect the menu to Persian memory. The kitchen refines those familiar flavours with seasonal produce and a clear, contemporary hand.',
    image: 'bar',
    alt: 'The DAYA kitchen counter dressed in woven rugs beneath a painted pomegranate tree',
    side: 'right',
    rotation: 2.5,
  },
  {
    label: '03 · The island',
    title: 'The island changes the rhythm.',
    body: 'Ibiza brings openness to the experience—long evenings, sea air, natural materials, and a slower sense of time. Persian warmth and island ease meet without either losing its character.',
    image: 'eingnag',
    alt: 'Turquoise shutters, a terracotta planter and a Persian rug in the daylight at DAYA',
    side: 'left',
    rotation: -2,
  },
  {
    label: '04 · Today',
    title: 'One table, many stories.',
    body: 'DAYA today is a place for shared plates, unhurried conversation, and nights that move naturally from terrace to table. Food, design, music, and hospitality become one continuous experience.',
    image: 'night_logo',
    alt: 'The DAYA pomegranate sign glowing on a warm wall at night',
    side: 'right',
    rotation: 3,
  },
];

function StorySeeds({ count }) {
  return (
    <span className="story-seeds" data-count={count}>
      {Array.from({ length: count }, (_, index) => (
        <svg className="story-seed" viewBox="0 0 24 32" key={index} focusable="false" aria-hidden="true">
          <path d="M12 3.7c-1.2 1.2-5.1 4.1-6.2 8.3C4.1 18.6 7 25.9 12 28.3c5-2.4 7.9-9.7 6.2-16.3C17.1 7.8 13.2 4.9 12 3.7Z" />
        </svg>
      ))}
    </span>
  );
}

function Story() {
  const sectionRef = useRef(null);
  const listRef = useRef(null);
  useReveal(sectionRef);

  useLayoutEffect(() => {
    if (reduceMotion()) return undefined;
    const ctx = gsap.context(() => {
      const mobile = window.matchMedia('(max-width: 680px)').matches;

      // Each chapter arrives once and then stays put, so reading is never interrupted.
      gsap.utils.toArray('.story-entry').forEach((entry, index) => {
        const item = storyEntries[index];
        const resting = mobile ? item.rotation * 0.5 : item.rotation;
        gsap.timeline({ scrollTrigger: { trigger: entry, start: 'top 80%', once: true }, defaults: { ease: 'power3.out' } })
          .from(entry.querySelector('.story-marker'), { scale: 0.7, opacity: 0, duration: 0.5 }, 0)
          .fromTo(entry.querySelector('.story-image-card'),
            { y: 36, opacity: 0, rotation: resting + (item.side === 'left' ? -3 : 3) },
            { y: 0, opacity: 1, rotation: resting, duration: 0.9 }, 0.05)
          .from(entry.querySelector('.story-copy').children, { y: 20, opacity: 0, duration: 0.7, stagger: 0.08 }, 0.15);
      });

      gsap.fromTo('.story-progress', { scaleY: 0 }, {
        scaleY: 1,
        ease: 'none',
        scrollTrigger: { trigger: listRef.current, start: 'top 62%', end: 'bottom 62%', scrub: 0.6 },
      });
    }, sectionRef);
    return () => ctx.revert();
  }, []);

  return (
    <section className="story-section" id="story" ref={sectionRef} aria-labelledby="story-title" data-nav-theme="dark">
      <header className="story-header" data-reveal>
        <p className="section-eyebrow">Our journey</p>
        <h2 className="section-title" id="story-title">The story of DAYA.</h2>
        <p className="story-intro">Four chapters in the making of a Persian dining experience with an Ibizan rhythm.</p>
      </header>

      <div className="story-list" ref={listRef}>
        <div className="story-track" aria-hidden="true"><span className="story-progress" /></div>
        {storyEntries.map((entry, index) => (
          <article className={`story-entry story-entry-${entry.side}`} key={entry.label}>
            <figure className="story-image-card" style={{ '--story-rotation': `${entry.rotation}deg` }}>
              <img src={media(entry.image)} alt={entry.alt} loading="lazy" />
            </figure>
            <div className="story-marker" aria-hidden="true"><StorySeeds count={index + 1} /></div>
            <div className="story-copy">
              <p className="story-label">{entry.label}</p>
              <h3>{entry.title}</h3>
              <p>{entry.body}</p>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

function Menus() {
  const sectionRef = useRef(null);
  useReveal(sectionRef);

  useLayoutEffect(() => {
    if (reduceMotion()) return undefined;
    const ctx = gsap.context(() => {
      gsap.from('.journey-image-shell', {
        y: 28,
        opacity: 0,
        duration: 0.9,
        stagger: 0.1,
        ease: 'power3.out',
        scrollTrigger: { trigger: '.journey-image-row', start: 'top 85%', once: true },
      });

      const mm = gsap.matchMedia();
      mm.add({ desktop: '(min-width: 681px)', mobile: '(max-width: 680px)' }, ({ conditions }) => {
        const amount = conditions.mobile ? 10 : 30;
        gsap.utils.toArray('.journey-image-card').forEach((image, index) => {
          const direction = index % 2 === 0 ? 1 : -1;
          gsap.fromTo(image, { y: direction * amount }, {
            y: direction * -amount,
            ease: 'none',
            scrollTrigger: { trigger: '.journey-image-row', start: 'top bottom', end: 'bottom top', scrub: 1.2 },
          });
        });
      });
      return () => mm.revert();
    }, sectionRef);
    return () => ctx.revert();
  }, []);

  return (
    <section className="journey-menu-section" id="menus" ref={sectionRef} aria-labelledby="menus-title" data-nav-theme="dark">
      <CarpetField className="journey-field" />
      <div className="journey-menu-inner">
        <div className="journey-menu-content" data-reveal>
          <PersianWord className="fa-menu">سفره</PersianWord>
          <p className="section-eyebrow">Menus</p>
          <h2 className="section-title" id="menus-title">Made by hand. Given time.</h2>
          <p className="journey-copy">
            Our food is freshly prepared by hand. Dough needs resting. Flavours need time. And we believe there should be room in the day to sit, eat and enjoy the company around you.
          </p>
          <p className="journey-copy">
            Our mother’s recipes guide our cooking, keeping the flavours traditional and authentic. Having grown up in Europe, we bring our own touch to the way we serve some dishes — a different presentation, with the same familiar flavours.
          </p>
          <p className="journey-copy">
            Discover our lunch and dinner menus. Find a favourite, or choose a few dishes to share.
          </p>
          <div className="journey-actions">
            {MENUS.map((menu) => <DayaButton key={menu.id} href={menu.href} label={menu.label} {...external} />)}
          </div>
          <div className="kitchen-hours">
            <h3>Kitchen hours</h3>
            <p>Lunch 13:00–17:00 <span aria-hidden="true">·</span> Dinner 19:00–00:00</p>
          </div>
        </div>

        <div className="journey-image-row">
          {menuImages.map((item, index) => (
            <div className="journey-image-shell" key={item.image}>
              <figure className={`journey-image-card journey-image-${index + 1}`}>
                <img src={media(item.image)} alt={item.alt} loading="lazy" />
              </figure>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// A quiet strip of photographs of the house.
function HouseStrip() {
  return (
    <section className="social-section house-strip" aria-labelledby="gallery-title" data-nav-theme="dark">
      <h2 className="section-title" id="gallery-title">Inside DAYA.</h2>
      <div className="social-marquee-window">
        <div className="social-marquee-track">
          {[0, 1].map((groupIndex) => (
            <div className="social-marquee-group" aria-hidden={groupIndex === 1} key={groupIndex}>
              {houseStrip.map((item) => (
                <figure className="social-image-card" key={`${groupIndex}-${item.image}`}>
                  <img src={media(item.image)} alt={groupIndex === 0 ? item.alt : ''} loading="lazy" />
                </figure>
              ))}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function VisitUs() {
  const sectionRef = useRef(null);
  useReveal(sectionRef);

  return (
    <section className="location-section" id="visit" ref={sectionRef} aria-labelledby="visit-title" data-nav-theme="dark">
      <div className="location-inner">
        <div className="location-content">
          <div data-reveal>
            <p className="section-eyebrow">Visit Us</p>
            <h2 className="section-title" id="visit-title">Come in. Settle in.</h2>
            <p className="location-intro">
              Join us for lunch, dinner, a cup of tea or an evening drink. We look forward to welcoming you.
            </p>
          </div>

          <div className="location-details" data-reveal>
            <section className="location-detail" aria-labelledby="visit-address-title">
              <h3 id="visit-address-title">Find us</h3>
              <address>
                {VISIT.addressLines.map((line) => <span key={line}>{line}</span>)}
              </address>
            </section>

            <section className="location-detail" aria-labelledby="visit-hours-title">
              <h3 id="visit-hours-title">Opening hours</h3>
              {VISIT.openingDays && <p className="location-days">{VISIT.openingDays}</p>}
              <dl>
                <div><dt>Lunch</dt><dd>13:00–17:00</dd></div>
                <div className="location-siesta"><dt>Closed for siesta</dt><dd>17:00–19:00</dd></div>
                <div><dt>Dinner</dt><dd>19:00–00:00</dd></div>
              </dl>
            </section>

            <section className="location-detail" aria-labelledby="visit-contact-title">
              <h3 id="visit-contact-title">Get in touch</h3>
              {VISIT.phone && <a href={`tel:${VISIT.phone.replace(/[^+\d]/g, '')}`}>{VISIT.phone}</a>}
              <a href={`mailto:${VISIT.email}`}>{VISIT.email}</a>
            </section>
          </div>

          <div className="location-actions" data-reveal>
            <DayaButton href={VISIT.mapsUrl} label="Get Directions" {...external} />
            <DayaButton className="daya-button-outline" href={CONTACT_URL} label="Contact Us" />
          </div>
        </div>

        <div className="location-map">
          <iframe
            src={VISIT.mapsEmbedUrl}
            title="DAYA location in Ibiza"
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            allowFullScreen
          />
        </div>
      </div>
    </section>
  );
}

function DayaFooter({ home = '' }) {
  return (
    <footer className="site-footer" id="footer" data-nav-theme="light">
      <div className="footer-script" aria-hidden="true" lang="fa" dir="rtl">
        <span>خوش آمدید</span>
        <span>نوش جان</span>
      </div>
      <div className="footer-simple">
        <a className="footer-logo" href={`${home}#home`} aria-label="DAYA Ibiza home">
          <DayaLogo layout="stack" />
        </a>
        <p className="footer-tagline">Restaurant · Lounge · Bar</p>
        <p className="footer-noosh">
          <span lang="fa" dir="rtl">نوش جان</span>
          <span aria-hidden="true"> · </span>
          <span>Nooshe Jan</span>
        </p>
        <nav className="footer-links" aria-label="Footer navigation">
          <a href={`${home}#visit`}>Contact</a>
          <a href={VISIT.instagram} {...external}>Instagram</a>
          {VISIT.privacyUrl && <a href={VISIT.privacyUrl}>Privacy Policy</a>}
          {VISIT.legalUrl && <a href={VISIT.legalUrl}>Legal Notice</a>}
        </nav>
      </div>
    </footer>
  );
}

// On phones, menus, address and contact stay one tap away.
function QuickBar() {
  return (
    <nav className="quick-bar" aria-label="Quick links">
      <a href="#menus">Menus</a>
      <a href={VISIT.mapsUrl} {...external}>Directions</a>
      <a href={CONTACT_URL}>Contact</a>
    </nav>
  );
}

export default function App() {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuTriggerRef = useRef(null);

  const closeMenu = (returnFocus = true) => {
    setMenuOpen(false);
    if (returnFocus) window.setTimeout(() => menuTriggerRef.current?.focus(), 650);
  };

  // Web fonts change text heights once they load, so scroll positions are measured again afterwards.
  useEffect(() => {
    let active = true;
    document.fonts?.ready.then(() => { if (active) ScrollTrigger.refresh(); });
    return () => { active = false; };
  }, []);

  return (
    <>
      <a className="skip-link" href="#main-content">Skip to content</a>
      <MenuOverlay open={menuOpen} onClose={closeMenu} />
      <SiteNav
        onMenuOpen={() => setMenuOpen(true)}
        menuOpen={menuOpen}
        menuTriggerRef={menuTriggerRef}
      />
      <main id="main-content" tabIndex="-1">
        <Hero />
        <Welcome />
        <OurHouse />
        <Story />
        <Menus />
        <HouseStrip />
        <VisitUs />
      </main>
      <DayaFooter />
      <QuickBar />
    </>
  );
}

export { DayaButton, DayaFooter, MenuOverlay, SiteNav };
