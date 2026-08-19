import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const media = (index) => `/media/daya-${String(index).padStart(2, '0')}.jpg`;
const DIGITAL_MENU_URL = '#menu'; // Replace with DAYA's external digital menu URL when available.

const floatingImages = [
  { id: 1, image: 2, className: 'float-one float-behind', alt: 'Warmly lit dining room at DAYA' },
  { id: 2, image: 4, className: 'float-two float-front', alt: 'Persian textile alcove illuminated by candlelight' },
  { id: 3, image: 3, className: 'float-three float-front', alt: 'Saffron grilled prawns with herbs' },
  { id: 4, image: 7, className: 'float-four float-behind', alt: 'Turquoise Persian tile and aged brass detail' },
  { id: 5, image: 5, className: 'float-five float-behind', alt: 'Pomegranate cocktail in cut crystal' },
];

const journeyImages = [
  { image: 5, alt: 'Pomegranate cocktail served in cut crystal at DAYA' },
  { image: 8, alt: 'Guests sharing an intimate evening at DAYA' },
  { image: 6, alt: 'Persian sharing dishes arranged across a DAYA table' },
  { image: 1, alt: 'DAYA terrace and courtyard at blue hour' },
];

const socialImages = [
  { image: 2, alt: 'Warmly lit DAYA dining room' },
  { image: 3, alt: 'Chargrilled prawns with pistachio and herbs' },
  { image: 5, alt: 'Pomegranate cocktail at the DAYA bar' },
  { image: 7, alt: 'Persian turquoise tile and brass detail' },
  { image: 8, alt: 'Guests sharing dinner at DAYA' },
  { image: 9, alt: 'DAYA courtyard with an illuminated olive tree' },
];

const experienceSlides = [
  { title: 'The Restaurant', image: 2, alt: 'Warm candlelit dining room at DAYA' },
  { title: 'The Bar', image: 5, alt: 'Pomegranate cocktail served in cut crystal at the DAYA bar' },
  { title: 'The Terrace', image: 1, alt: 'DAYA terrace and turquoise courtyard pool at blue hour' },
  { title: 'The Kitchen', image: 6, alt: 'Modern Persian sharing plates prepared by the DAYA kitchen' },
  { title: 'The Evening', image: 8, alt: 'Guests sharing an intimate evening dinner at DAYA' },
];

const primaryNavigation = [
  { label: 'Home', href: '#home' },
  { label: 'Gallery', href: '#gallery' },
  { label: 'About', href: '#about' },
  { label: 'Story', href: '#story' },
  { label: 'Menu', href: '#menu' },
  { label: 'Location', href: '#location' },
];

function DayaOrnament({ side }) {
  return (
    <svg className={`daya-button-ornament daya-button-ornament-${side}`} viewBox="0 0 16 16" aria-hidden="true">
      <path d="M8 0.8c.7 4.3 2.9 6.5 7.2 7.2-4.3.7-6.5 2.9-7.2 7.2C7.3 10.9 5.1 8.7.8 8 5.1 7.3 7.3 5.1 8 .8Z" />
      <circle cx="8" cy="8" r="1.15" />
    </svg>
  );
}

function DayaButton({ href, label, className = '', ...linkProps }) {
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
            '--char-delay': `${characterIndex * 18}ms`,
          }}
        >
          {character}
        </span>
      );
    });
  };

  return (
    <a className={`daya-button ${className}`.trim()} href={href} aria-label={label} {...linkProps}>
      <DayaOrnament side="left" />
      <span className="daya-button-label">
        <span className="daya-button-label-layer daya-button-label-current">{renderCharacters('current')}</span>
        <span className="daya-button-label-layer daya-button-label-hover">{renderCharacters('hover')}</span>
      </span>
      <DayaOrnament side="right" />
    </a>
  );
}

function MenuOverlay({ open, onClose }) {
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
      <div className="menu-header">
        <a className="menu-signature" href="#home" onClick={() => onClose(false)} tabIndex={open ? 0 : -1} aria-label="DAYA home">
          <img className="menu-brand-icon" src="/media/daya-icon.png" alt="" />
          <img className="menu-brand-wordmark" src="/media/daya-wordmark.png" alt="" />
        </a>
        <button ref={closeRef} className="close-menu" onClick={onClose} aria-label="Close navigation">
          <span />
          <span />
        </button>
      </div>

      <nav className="menu-nav" aria-label="Primary navigation">
        {primaryNavigation.map((item, index) => (
          <a
            key={item.label}
            href={item.href}
            onClick={() => onClose(false)}
            tabIndex={open ? 0 : -1}
            style={{ '--menu-index': index }}
          >
            <span className="menu-index" aria-hidden="true">0{index + 1}</span>
            <span className="menu-label">{item.label}</span>
            <span className="menu-line" />
          </a>
        ))}
      </nav>

    </div>
  );
}

function SiteNav({ onMenuOpen, menuOpen, menuTriggerRef }) {
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
      <a className="hero-wordmark" href="#home" aria-label="DAYA home">
        <img src="/media/daya-wordmark.png" alt="" />
      </a>
      <span className="nav-location">Ibiza · 38°59′N</span>
    </header>
  );
}

function Hero() {
  const heroRef = useRef(null);

  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

      gsap.timeline({ defaults: { ease: 'power3.out' } })
        .from('.hero-title-line', { yPercent: 110, duration: 1.15, stagger: 0.09 }, 0.3)
        .from('.hero-subtext', { y: 22, opacity: 0, duration: 0.9 }, 0.78)
        .from('.hero-actions', { y: 18, opacity: 0, duration: 0.8 }, 0.95);

      gsap.to('.hero-video', {
        scale: 1.08,
        ease: 'none',
        scrollTrigger: {
          trigger: heroRef.current,
          start: 'top top',
          end: 'bottom top',
          scrub: 1.2,
        },
      });
    }, heroRef);

    return () => ctx.revert();
  }, []);

  return (
    <section ref={heroRef} className="hero" id="home" aria-labelledby="hero-title" data-nav-theme="light">
      <video
        className="hero-video"
        autoPlay
        muted
        loop
        playsInline
        preload="metadata"
        poster={media(1)}
        aria-hidden="true"
      >
        <source src="/media/daya-hero.mp4" type="video/mp4" />
      </video>
      <div className="hero-scrim" />

      <div className="hero-content">
        <p className="hero-kicker">Persian dining · Ibiza</p>
        <h1 id="hero-title">
          <span className="hero-title-mask"><span className="hero-title-line">Persian soul.</span></span>
          <span className="hero-title-mask"><span className="hero-title-line">Modern expression.</span></span>
        </h1>
        <p className="hero-subtext">
          <span>A modern Persian table shaped by fire,</span>
          <span>seasonal produce and generous hospitality.</span>
        </p>
        <div className="hero-actions">
          <DayaButton className="daya-button-hero" href="#menu" label="Explore the menu" />
        </div>
      </div>
    </section>
  );
}

function GalleryIntro() {
  const introRef = useRef(null);

  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      if (reduceMotion) return;

      const mm = gsap.matchMedia();
      mm.add(
        {
          desktop: '(min-width: 768px)',
          mobile: '(max-width: 767px)',
        },
        ({ conditions }) => {
          const splitDistance = conditions.desktop ? 55 : 43;
          const titleFadeStart = conditions.desktop ? 8.45 : 8.08;
          const floats = gsap.utils.toArray('.floating-image');
          const timeline = gsap.timeline({
            scrollTrigger: {
              trigger: introRef.current,
              start: 'top top',
              end: 'bottom bottom',
              scrub: 0.8,
              invalidateOnRefresh: true,
            },
          });

          timeline
            .fromTo('.gallery-title', { opacity: 0.2 }, { opacity: 1, duration: 1.15, ease: 'power2.out' }, 0);

          floats.forEach((image, index) => {
            const start = 0.85 + index * 1.18;
            const distance = conditions.desktop ? window.innerHeight * (1.25 + (index % 3) * 0.12) : window.innerHeight * 1.08;
            const duration = 2.45 + (index % 2) * 0.28;
            timeline.set(image, { autoAlpha: 0 }, 0);
            timeline.set(image, { autoAlpha: 1 }, start);
            timeline.fromTo(
              image,
              { y: () => window.innerHeight * 0.68, scale: 1 },
              { y: () => -distance, scale: 1, duration, ease: 'none', immediateRender: false },
              start,
            );
            timeline.set(image, { autoAlpha: 0 }, start + duration);
          });

          timeline
            .set(floats, { autoAlpha: 0 }, 7.85)
            .fromTo('.experience-section-embedded', {
              autoAlpha: 0,
              scale: 0.985,
            }, {
              autoAlpha: 1,
              scale: 1,
              duration: 1.25,
              ease: 'power2.inOut',
            }, 7.85)
            .to('.title-gal', { x: `-${splitDistance}vw`, scale: 1.045, duration: 1.25, ease: 'power2.inOut' }, 7.85)
            .to('.title-lery', { x: `${splitDistance}vw`, scale: 1.045, duration: 1.25, ease: 'power2.inOut' }, 7.85)
            .to('.gallery-title', { autoAlpha: 0, duration: conditions.desktop ? 0.65 : 0.5, ease: 'power2.out' }, titleFadeStart)
            .to('.experience-section-embedded', { duration: 1.35 }, 9.1);

          return () => timeline.kill();
        },
      );

      return () => mm.revert();
    }, introRef);

    return () => ctx.revert();
  }, []);

  return (
    <div ref={introRef} className="gallery-intro" id="gallery" data-nav-theme="light">
      <div className="gallery-sticky">
        <ExperienceSlider embedded />

        <h2 className="gallery-title" aria-label="Gallery">
          <span className="title-gal">Gal</span><span className="title-lery">lery</span>
        </h2>

        {floatingImages.map((item) => (
          <figure className={`floating-image ${item.className}`} key={item.id}>
            <img src={media(item.image)} alt={item.alt} loading="lazy" />
            <figcaption>0{item.id}</figcaption>
          </figure>
        ))}
      </div>
    </div>
  );
}

function SliderArrow({ direction, onClick, disabled }) {
  const isPrevious = direction === 'previous';

  return (
    <button
      className={`experience-arrow experience-arrow-${isPrevious ? 'previous' : 'next'}`}
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={isPrevious ? 'Previous image' : 'Next image'}
    >
      <svg viewBox="0 0 64 48" aria-hidden="true">
        <path className="arrow-seed" d="M10 19.5c4 2.4 4 6.6 0 9-4-2.4-4-6.6 0-9Z" />
        <path className="arrow-stem" d="M13 24c12-.35 24.5-.35 38 0" />
        <path className="arrow-head" d="M41 14.5c3.3 3.9 6.7 7.1 10 9.5-3.3 2.4-6.7 5.6-10 9.5" />
        <path className="arrow-flourish" d="M44 18.6c1.7.8 3.1 1.2 4.6 1.5" />
      </svg>
    </button>
  );
}

function ExperienceSlide({ slide, className, slideRef }) {
  return (
    <figure className={`experience-slide ${className}`} ref={slideRef} aria-hidden={className.includes('incoming')}>
      <img src={media(slide.image)} alt={slide.alt} draggable="false" />
    </figure>
  );
}

function SliderMeta({ index, total, title, metaRef }) {
  return (
    <div className="experience-meta" ref={metaRef} aria-live="polite" aria-atomic="true">
      <span className="experience-meta-mask">
        <span className="experience-count">
          {String(index + 1).padStart(2, '0')} / {String(total).padStart(2, '0')}
        </span>
      </span>
      <span className="experience-rule" aria-hidden="true" />
      <span className="experience-meta-mask experience-title-mask">
        <span className="experience-title">{title}</span>
      </span>
    </div>
  );
}

function ExperienceSlider({ embedded = false }) {
  const sectionRef = useRef(null);
  const viewportRef = useRef(null);
  const currentSlideRef = useRef(null);
  const incomingSlideRef = useRef(null);
  const metaRef = useRef(null);
  const pointerStartRef = useRef(null);
  const hasChangedSlideRef = useRef(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const [incomingIndex, setIncomingIndex] = useState(null);
  const [direction, setDirection] = useState(1);
  const [isAnimating, setIsAnimating] = useState(false);

  const changeSlide = (step) => {
    if (isAnimating) return;
    const nextIndex = (activeIndex + step + experienceSlides.length) % experienceSlides.length;
    setDirection(step > 0 ? 1 : -1);
    setIncomingIndex(nextIndex);
    setIsAnimating(true);
  };

  useLayoutEffect(() => {
    if (incomingIndex === null || !incomingSlideRef.current || !currentSlideRef.current) return undefined;

    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduceMotion) {
      setActiveIndex(incomingIndex);
      setIncomingIndex(null);
      setIsAnimating(false);
      return undefined;
    }

    const current = currentSlideRef.current;
    const incoming = incomingSlideRef.current;
    const metaText = metaRef.current?.querySelectorAll('.experience-count, .experience-title');
    const metaRule = metaRef.current?.querySelector('.experience-rule');
    const hiddenSide = direction > 0 ? 'inset(0 0 0 100%)' : 'inset(0 100% 0 0)';

    gsap.set(incoming, {
      clipPath: hiddenSide,
      xPercent: direction * 5,
      opacity: 1,
    });

    const timeline = gsap.timeline({
      defaults: { duration: 0.9, ease: 'power3.inOut' },
      onComplete: () => {
        setActiveIndex(incomingIndex);
        setIncomingIndex(null);
        setIsAnimating(false);
      },
    });

    timeline
      .to(current, { xPercent: direction * -4, opacity: 0.52 }, 0)
      .to(incoming, { clipPath: 'inset(0 0% 0 0%)', xPercent: 0 }, 0)
      .to(metaText, { yPercent: direction > 0 ? -120 : 120, opacity: 0, duration: 0.38, stagger: 0.055, ease: 'power2.in' }, 0)
      .to(metaRule, { scaleX: 0, transformOrigin: direction > 0 ? 'right center' : 'left center', duration: 0.42, ease: 'power2.inOut' }, 0);

    return () => timeline.kill();
  }, [incomingIndex, direction]);

  useLayoutEffect(() => {
    if (incomingIndex !== null || !currentSlideRef.current) return undefined;

    gsap.set(currentSlideRef.current, { clearProps: 'clipPath,xPercent,opacity' });
    const metaText = metaRef.current?.querySelectorAll('.experience-count, .experience-title');
    const metaRule = metaRef.current?.querySelector('.experience-rule');
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      gsap.set([metaText, metaRule], { clearProps: 'all' });
      return undefined;
    }

    if (!hasChangedSlideRef.current) {
      hasChangedSlideRef.current = true;
      gsap.set([metaText, metaRule], { clearProps: 'all' });
      return undefined;
    }

    const timeline = gsap.timeline();
    timeline
      .fromTo(metaText, { yPercent: direction > 0 ? 120 : -120, opacity: 0 }, { yPercent: 0, opacity: 1, duration: 0.62, stagger: 0.075, ease: 'power3.out' }, 0)
      .fromTo(metaRule, { scaleX: 0, transformOrigin: direction > 0 ? 'left center' : 'right center' }, { scaleX: 1, duration: 0.68, ease: 'power3.inOut' }, 0.08);
    return () => timeline.kill();
  }, [activeIndex, incomingIndex]);

  useLayoutEffect(() => {
    if (embedded) return undefined;

    const ctx = gsap.context(() => {
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

      const entrance = gsap.timeline({
        scrollTrigger: {
          trigger: sectionRef.current,
          start: 'top 72%',
          once: true,
        },
      });

      entrance
        .from('.experience-heading-line', { yPercent: 105, duration: 0.95, ease: 'power3.out' }, 0.08)
        .from('.experience-intro', { y: 16, opacity: 0, duration: 0.7, ease: 'power3.out' }, 0.22)
        .fromTo(viewportRef.current, { clipPath: 'inset(0 100% 0 0)' }, { clipPath: 'inset(0 0% 0 0)', duration: 1.05, ease: 'power3.inOut' }, 0)
        .from('.experience-arrow', { opacity: 0, scale: 0.9, duration: 0.55, stagger: 0.1, ease: 'power2.out' }, 0.62);
    }, sectionRef);

    return () => ctx.revert();
  }, [embedded]);

  const onKeyDown = (event) => {
    if (event.key === 'ArrowLeft') {
      event.preventDefault();
      changeSlide(-1);
    }
    if (event.key === 'ArrowRight') {
      event.preventDefault();
      changeSlide(1);
    }
  };

  const onPointerDown = (event) => {
    if (event.pointerType === 'mouse' && event.button !== 0) return;
    pointerStartRef.current = { x: event.clientX, y: event.clientY };
    event.currentTarget.setPointerCapture?.(event.pointerId);
  };

  const onPointerUp = (event) => {
    const start = pointerStartRef.current;
    pointerStartRef.current = null;
    if (!start) return;

    const deltaX = event.clientX - start.x;
    const deltaY = event.clientY - start.y;
    if (Math.abs(deltaX) > 44 && Math.abs(deltaX) > Math.abs(deltaY) * 1.15) {
      changeSlide(deltaX < 0 ? 1 : -1);
    }
  };

  return (
    <section
      className={`experience-section${embedded ? ' experience-section-embedded' : ''}`}
      id="experience"
      ref={sectionRef}
      aria-labelledby="experience-title"
      data-nav-theme="light"
      tabIndex="0"
      onKeyDown={onKeyDown}
    >
      <div className="experience-stage">
        <div className="experience-composition">
          <header className="experience-header">
            <h2 id="experience-title">
              <span className="experience-heading-mask"><span className="experience-heading-line">Inside DAYA.</span></span>
            </h2>
            <p className="experience-intro">Move through the spaces, details, and rituals that shape a night at DAYA.</p>
          </header>

          <div className="experience-media-row">
            <SliderArrow direction="previous" onClick={() => changeSlide(-1)} disabled={isAnimating} />
            <div
              className="experience-viewport"
              ref={viewportRef}
              onPointerDown={onPointerDown}
              onPointerUp={onPointerUp}
              onPointerCancel={() => { pointerStartRef.current = null; }}
            >
              <ExperienceSlide
                key={`current-${activeIndex}`}
                slide={experienceSlides[activeIndex]}
                className="experience-slide-current"
                slideRef={currentSlideRef}
              />
              {incomingIndex !== null && (
                <ExperienceSlide
                  key={`incoming-${incomingIndex}`}
                  slide={experienceSlides[incomingIndex]}
                  className="experience-slide-incoming"
                  slideRef={incomingSlideRef}
                />
              )}
            </div>
            <SliderArrow direction="next" onClick={() => changeSlide(1)} disabled={isAnimating} />
          </div>

          <SliderMeta
            index={activeIndex}
            total={experienceSlides.length}
            title={experienceSlides[activeIndex].title}
            metaRef={metaRef}
          />
        </div>
      </div>
    </section>
  );
}

const aboutImages = [
  { image: 3, className: 'about-card-one', alt: 'Chargrilled prawns finished with pistachio and herbs at DAYA' },
  { image: 4, className: 'about-card-two', alt: 'Candlelit Persian textile alcove inside DAYA' },
  { image: 7, className: 'about-card-three', alt: 'Turquoise Persian tilework and aged brass detail at DAYA' },
];

function AboutHistory() {
  const sectionRef = useRef(null);
  const stackRef = useRef(null);

  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      if (reduceMotion) return;

      const cards = gsap.utils.toArray('.about-image-card');
      const mobile = window.matchMedia('(max-width: 680px)').matches;
      const restingRotations = mobile ? [-3.5, 1.5, -2] : [-6, 2, -3];
      const startingRotations = mobile ? [-8, 6, -6] : [-13, 9, -9];

      gsap.timeline({
        scrollTrigger: {
          trigger: sectionRef.current,
          start: 'top 72%',
          toggleActions: 'play none restart reverse',
        },
      })
        .from('.about-eyebrow', { y: 12, duration: 0.6, ease: 'power2.out' }, 0)
        .from('.about-heading-line', {
          y: 22,
          opacity: 0,
          duration: 0.8,
          stagger: 0.1,
          ease: 'power3.out',
        }, 0.1)
        .from('.about-history > p', {
          y: 18,
          opacity: 0,
          duration: 0.8,
          stagger: 0.11,
          ease: 'power3.out',
        }, 0.22);

      gsap.fromTo(cards, {
        y: 58,
        opacity: 0,
        rotation: (index) => startingRotations[index],
      }, {
        y: 0,
        opacity: 1,
        rotation: (index) => restingRotations[index],
        duration: 1,
        stagger: 0.22,
        ease: 'power3.out',
        scrollTrigger: {
          trigger: stackRef.current,
          start: 'top 82%',
          toggleActions: 'play none restart reverse',
        },
      });
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section className="about-section" id="about" ref={sectionRef} aria-labelledby="about-title" data-nav-theme="light">
      <div className="about-pattern" aria-hidden="true" />
      <div className="about-layout">
        <div className="about-visual">
          <div className="about-image-stack" ref={stackRef} aria-label="The craft and atmosphere of DAYA">
            {aboutImages.map((item) => (
              <figure className={`about-image-card ${item.className}`} key={item.image}>
                <img src={media(item.image)} alt={item.alt} loading="lazy" />
              </figure>
            ))}
          </div>
        </div>

        <div className="about-history">
          <header className="about-header">
            <p className="about-eyebrow">Our philosophy</p>
            <h2 id="about-title">
              <span className="about-heading-line">About</span>
              <span className="about-heading-line about-heading-accent">DAYA.</span>
            </h2>
          </header>
          <p>
            DAYA brings Persian hospitality into conversation with the relaxed rhythm of Ibiza. It is a place to arrive without hurry, gather around a generous table, and feel looked after from the first welcome to the last glass.
          </p>
          <p>
            Our cooking begins with the flavours that define Persian kitchens—saffron, herbs, citrus, smoke, pomegranate, and slow-built spice. Seasonal ingredients and a contemporary approach keep every dish vibrant, precise, and made to share.
          </p>
          <p>
            The same dialogue runs through the room: turquoise tile, aged brass, dark timber, woven textiles, candlelight, and music. Together they create a setting rooted in culture and unmistakably part of the island.
          </p>
        </div>
      </div>
    </section>
  );
}

const storyEntries = [
  {
    label: '01 · The roots',
    title: 'Hospitality comes first.',
    body: 'DAYA starts with a simple Persian principle: a guest should feel cared for. That generosity shapes the welcome, the pace of service, and every dish placed at the centre of the table.',
    image: 7,
    alt: 'Persian turquoise tile and aged brass detail at DAYA',
    side: 'left',
    rotation: -4,
  },
  {
    label: '02 · The craft',
    title: 'Memory becomes flavour.',
    body: 'Saffron, herbs, smoke, citrus, and pomegranate connect the menu to Persian memory. The kitchen refines those familiar flavours with seasonal produce and a clear, contemporary hand.',
    image: 3,
    alt: 'Chargrilled prawns with pistachio and herbs from the DAYA kitchen',
    side: 'right',
    rotation: 3,
  },
  {
    label: '03 · The island',
    title: 'The island changes the rhythm.',
    body: 'Ibiza brings openness to the experience—long evenings, sea air, natural materials, and a slower sense of time. Persian warmth and island ease meet without either losing its character.',
    image: 9,
    alt: 'Sculptural DAYA courtyard with an illuminated olive tree',
    side: 'left',
    rotation: -2.5,
  },
  {
    label: '04 · Today',
    title: 'One table, many stories.',
    body: 'DAYA today is a place for shared plates, unhurried conversation, and nights that move naturally from terrace to table. Food, design, music, and hospitality become one continuous experience.',
    image: 8,
    alt: 'Guests sharing dinner together at DAYA in Ibiza',
    side: 'right',
    rotation: 3.5,
  },
];

function StoryTimeline() {
  const sectionRef = useRef(null);
  const listRef = useRef(null);

  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

      gsap.timeline({
        scrollTrigger: {
          trigger: sectionRef.current,
          start: 'top 72%',
          toggleActions: 'play none none reverse',
        },
      })
        .from('.story-eyebrow', { y: 12, opacity: 0, duration: 0.55, ease: 'power2.out' }, 0)
        .from('.story-heading-line', { yPercent: 105, duration: 0.95, ease: 'power3.out' }, 0.08)
        .from('.story-intro', { y: 18, opacity: 0, duration: 0.7, ease: 'power3.out' }, 0.24);

      gsap.utils.toArray('.story-entry').forEach((entry, index) => {
        const image = entry.querySelector('.story-image-card');
        const text = entry.querySelector('.story-copy');
        const marker = entry.querySelector('.story-marker');
        const item = storyEntries[index];
        const mobile = window.matchMedia('(max-width: 680px)').matches;
        const restingRotation = mobile ? item.rotation * 0.55 : item.rotation;
        const startingRotation = restingRotation + (item.side === 'left' ? -5 : 5);

        gsap.timeline({
          scrollTrigger: {
            trigger: entry,
            start: 'top 76%',
            toggleActions: 'play none restart reverse',
          },
        })
          .from(marker, { scale: 0.78, opacity: 0, duration: 0.62, ease: 'power3.out' }, 0)
          .fromTo(image, {
            y: 44,
            opacity: 0,
            scale: 0.97,
            rotation: startingRotation,
          }, {
            y: 0,
            opacity: 1,
            scale: 1,
            rotation: restingRotation,
            duration: 1,
            ease: 'power3.out',
          }, 0.06)
          .from(text, { y: 30, opacity: 0, duration: 0.88, ease: 'power3.out' }, 0.18)
          .to(marker, { scale: 1.035, duration: 0.28, yoyo: true, repeat: 1, ease: 'power2.inOut' }, 0.46);
      });

      gsap.fromTo('.story-progress', { scaleY: 0 }, {
        scaleY: 1,
        ease: 'none',
        scrollTrigger: {
          trigger: listRef.current,
          start: 'top center',
          end: 'bottom center',
          scrub: 0.8,
        },
      });
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section className="story-section" id="story" ref={sectionRef} aria-labelledby="story-title" data-nav-theme="dark">
      <div className="story-pattern" aria-hidden="true" />
      <header className="story-header">
        <p className="story-eyebrow">Our journey</p>
        <h2 id="story-title">
          <span className="story-heading-mask"><span className="story-heading-line">The story of DAYA.</span></span>
        </h2>
        <p className="story-intro">Four chapters in the making of a Persian dining experience with an Ibizan rhythm.</p>
      </header>

      <div className="story-list" ref={listRef}>
        <div className="story-track" aria-hidden="true"><span className="story-progress" /></div>
        {storyEntries.map((entry, index) => (
          <article className={`story-entry story-entry-${entry.side}`} key={entry.label}>
            <figure className="story-image-card" style={{ '--story-rotation': `${entry.rotation}deg` }}>
              <img src={media(entry.image)} alt={entry.alt} loading="lazy" />
            </figure>
            <div className="story-marker" aria-hidden="true"><span>{String(index + 1).padStart(2, '0')}</span></div>
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

function JourneyMenuDiscovery() {
  const sectionRef = useRef(null);

  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

      gsap.timeline({
        scrollTrigger: {
          trigger: sectionRef.current,
          start: 'top 72%',
          once: true,
        },
      })
        .from('.journey-eyebrow', { y: 12, opacity: 0, duration: 0.6, ease: 'power2.out' })
        .from('.journey-heading-line', { yPercent: 110, duration: 1, ease: 'power3.out' }, 0.08)
        .from('.journey-copy', { y: 22, opacity: 0, duration: 0.8, ease: 'power3.out' }, 0.2)
        .from('.journey-actions .daya-button', { y: 16, duration: 0.7, ease: 'power3.out' }, 0.38)
        .from('.journey-image-shell', { y: 28, opacity: 0, duration: 0.9, stagger: 0.1, ease: 'power3.out' }, 0.5);

      const mm = gsap.matchMedia();
      mm.add(
        { desktop: '(min-width: 681px)', mobile: '(max-width: 680px)' },
        ({ conditions }) => {
          const amount = conditions.mobile ? 26 : 58;
          gsap.utils.toArray('.journey-image-card').forEach((image, index) => {
            const direction = index % 2 === 0 ? 1 : -1;
            gsap.fromTo(image, {
              y: direction * amount,
            }, {
              y: direction * -amount,
              ease: 'none',
              scrollTrigger: {
                trigger: sectionRef.current,
                start: 'top bottom',
                end: 'bottom top',
                scrub: 1.2,
              },
            });
          });
        },
      );

      return () => mm.revert();
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section className="journey-menu-section" id="menu" ref={sectionRef} aria-labelledby="journey-menu-title" data-nav-theme="light">
      <div className="journey-menu-inner">
        <div className="journey-menu-content">
          <p className="journey-eyebrow">The DAYA menu</p>
          <h2 id="journey-menu-title">
            <span className="journey-heading-mask"><span className="journey-heading-line">Made to share.</span></span>
          </h2>
          <p className="journey-copy">
            Our menu moves between fire and freshness: saffron-led plates, bright herbs, citrus, charcoal, and generous dishes designed to travel around the table.
          </p>
          <div className="journey-actions">
            <DayaButton href={DIGITAL_MENU_URL} label="View menu options" />
          </div>
        </div>

        <div className="journey-image-row">
          {journeyImages.map((item, index) => (
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

function SocialGallery() {
  const sectionRef = useRef(null);

  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

      gsap.timeline({
        scrollTrigger: {
          trigger: sectionRef.current,
          start: 'top 78%',
          once: true,
        },
      })
        .from('.social-heading-line', { yPercent: 110, duration: 0.9, ease: 'power3.out' })
        .from('.social-handle', { y: 18, duration: 0.7, ease: 'power3.out' }, 0.18)
        .from('.social-marquee-window', { y: 28, opacity: 0, duration: 0.9, ease: 'power3.out' }, 0.35);
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section className="social-section" id="social" ref={sectionRef} aria-labelledby="social-title" data-nav-theme="dark">
      <header className="social-header">
        <h2 id="social-title">
          <span className="social-heading-mask"><span className="social-heading-line">More from DAYA.</span></span>
        </h2>
        <a
          className="social-handle"
          href="https://www.instagram.com/dayaibiza/"
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Follow DAYA on Instagram"
        >
          @dayaibiza
        </a>
      </header>

      <div className="social-marquee-window" aria-label="DAYA moments from Instagram">
        <div className="social-marquee-track">
          {[0, 1].map((groupIndex) => (
            <div className="social-marquee-group" aria-hidden={groupIndex === 1} key={groupIndex}>
              {socialImages.map((item, index) => (
                <a
                  className="social-image-card"
                  href="https://www.instagram.com/dayaibiza/"
                  target="_blank"
                  rel="noopener noreferrer"
                  tabIndex={groupIndex === 1 ? -1 : 0}
                  aria-label={`View DAYA on Instagram, image ${index + 1}`}
                  key={`${groupIndex}-${item.image}`}
                >
                  <img src={media(item.image)} alt={groupIndex === 0 ? item.alt : ''} loading="lazy" />
                </a>
              ))}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function OurLocation() {
  const sectionRef = useRef(null);

  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

      gsap.timeline({
        scrollTrigger: {
          trigger: sectionRef.current,
          start: 'top 72%',
          once: true,
        },
      })
        .from('.location-eyebrow', { y: 14, opacity: 0, duration: 0.65, ease: 'power3.out' })
        .from('.location-heading-line', { yPercent: 110, duration: 0.95, ease: 'power3.out' }, 0.12)
        .from('.location-detail', { y: 24, opacity: 0, duration: 0.8, stagger: 0.12, ease: 'power3.out' }, 0.34)
        .from('.location-map', { x: 34, opacity: 0, duration: 1.05, ease: 'power3.out' }, 0.28);
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section
      className="location-section"
      id="location"
      ref={sectionRef}
      aria-labelledby="location-title"
      data-nav-theme="light"
    >
      <div className="location-inner">
        <div className="location-content">
          <p className="location-eyebrow">Visit DAYA</p>
          <h2 id="location-title">
            <span className="location-heading-mask">
              <span className="location-heading-line">Find us in Ibiza.</span>
            </span>
          </h2>

          <div className="location-details">
            <section className="location-detail" aria-labelledby="location-address-title">
              <h3 id="location-address-title">Address</h3>
              <address>
                DAYA Restaurant<br />
                Ibiza, Balearic Islands<br />
                Spain
              </address>
            </section>

            <section className="location-detail" aria-labelledby="location-hours-title">
              <h3 id="location-hours-title">Operational hours</h3>
              <dl>
                <div><dt>Monday</dt><dd>Closed</dd></div>
                <div><dt>Tue – Thu</dt><dd>17:00 – 23:00</dd></div>
                <div><dt>Fri – Sat</dt><dd>17:00 – 00:00</dd></div>
                <div><dt>Sunday</dt><dd>13:00 – 22:00</dd></div>
              </dl>
            </section>

            <section className="location-detail" aria-labelledby="location-contact-title">
              <h3 id="location-contact-title">Contact</h3>
              <a href="mailto:hello@dayaibiza.com">hello@dayaibiza.com</a>
              <span className="location-phone">+34 XXX XXX XXX</span>
            </section>
          </div>
        </div>

        <div className="location-map">
          <iframe
            src="https://www.google.com/maps?q=Ibiza%2C%20Spain&output=embed"
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

function DayaFooter() {
  return (
    <footer className="site-footer" id="footer" data-nav-theme="light">
      <div className="footer-inner">
        <div className="footer-top">
          <nav className="footer-nav footer-nav-primary" aria-label="Footer navigation">
            <a href="#home">Home</a>
            <a href="#gallery">Gallery</a>
            <a href="#about">About</a>
            <a href="#menu">Menu</a>
          </nav>

          <a className="footer-brand" href="#home" aria-label="DAYA home">
            <img src="/media/daya-wordmark.png" alt="DAYA" />
          </a>

          <nav className="footer-nav footer-nav-secondary" aria-label="DAYA links">
            <a href="#location">Location</a>
            <a href="https://www.instagram.com/dayaibiza/" target="_blank" rel="noopener noreferrer">Instagram</a>
            <a href="mailto:hello@dayaibiza.com">Contact</a>
          </nav>
        </div>

        <div className="footer-info">
          <section className="footer-column" aria-labelledby="footer-hours-title">
            <h2 id="footer-hours-title">Opening hours</h2>
            <p>Mon: Closed</p>
            <p>Tue – Thu: 17:00 – 23:00</p>
            <p>Fri – Sat: 17:00 – 00:00</p>
            <p>Sun: 13:00 – 22:00</p>
          </section>

          <section className="footer-column" aria-labelledby="footer-contact-title">
            <h2 id="footer-contact-title">Contact</h2>
            <p>DAYA Restaurant</p>
            <p>Ibiza, Spain</p>
            <a href="mailto:hello@dayaibiza.com">hello@dayaibiza.com</a>
          </section>

          <section className="footer-column" aria-labelledby="footer-social-title">
            <h2 id="footer-social-title">Social</h2>
            <a href="https://www.instagram.com/dayaibiza/" target="_blank" rel="noopener noreferrer">Instagram</a>
            <a href="https://www.facebook.com/dayaibiza/" target="_blank" rel="noopener noreferrer">Facebook</a>
            <a href="mailto:hello@dayaibiza.com">Email</a>
          </section>
        </div>

        <div className="footer-bottom">
          <p>© {new Date().getFullYear()} DAYA · Persian dining in Ibiza · All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}

export default function App() {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuTriggerRef = useRef(null);

  const closeMenu = (returnFocus = true) => {
    setMenuOpen(false);
    if (returnFocus) window.setTimeout(() => menuTriggerRef.current?.focus(), 650);
  };

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
        <section className="gallery-section">
          <GalleryIntro />
        </section>
        <AboutHistory />
        <StoryTimeline />
        <JourneyMenuDiscovery />
        <OurLocation />
        <SocialGallery />
      </main>
      <DayaFooter />
    </>
  );
}
