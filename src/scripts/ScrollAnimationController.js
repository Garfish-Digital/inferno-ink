import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

class ScrollAnimationController {
  constructor() {
    this.animationTimelines = new Map();
    this.isInitialized = false;
    this.isMobile = window.innerWidth <= 768;
    this.isReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    this.init();
  }

  init() {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => this.setupAnimations());
    } else {
      this.setupAnimations();
    }
  }

  setupAnimations() {
    if (this.isReducedMotion) {
      this.showAllElements();
      return;
    }

    requestAnimationFrame(() => {
      this.setupInitialStates();
      this.createHeroAnimations();
      this.createSectionTitleAnimations();

      requestIdleCallback(() => {
        this.createServiceCardAnimations();
        this.createArtistAnimations();
        this.createGalleryAnimations();
        this.createContactAnimations();

        this.isInitialized = true;
        ScrollTrigger.refresh();
      }, { timeout: 2000 });
    });
  }

  showAllElements() {
    // Under reduced motion, make everything visible immediately
    gsap.set(
      '.hero-title, .hero-tagline, .hero-description, .hero-cta, ' +
      '.section-title, .service-card, .artist-card, .gallery-item, ' +
      '.contact-info, .contact-form',
      { opacity: 1, y: 0, scale: 1, clipPath: 'none', visibility: 'visible' }
    );
  }

  // ── Initial States ──────────────────────────────────────────────────────────

  setupInitialStates() {
    // Hero
    gsap.set('.hero-title', { clipPath: 'inset(0 100% 0 0)' });
    gsap.set('.hero-tagline', { y: 30, opacity: 0 });
    gsap.set('.hero-description', { y: 30, opacity: 0 });
    gsap.set('.hero-cta', { opacity: 0 });

    // Section titles
    gsap.set('.section-title', { y: 30, opacity: 0 });

    // All cards — single unified initial state. Service, artist, and gallery
    // share the same smooth fade-rise on entrance.
    gsap.set('.service-card, .artist-card, .gallery-item', {
      y: 30,
      opacity: 0,
      visibility: 'visible'
    });

    // Contact
    gsap.set('.contact-info, .contact-form', { y: 30, opacity: 0 });
  }

  // ── Card Entrance ───────────────────────────────────────────────────────────
  // Single smooth fade-rise. Symmetric easing, no internal stagger, no flair.

  playCardEntrance(card, delay = 0) {
    return gsap.to(card, {
      y: 0,
      opacity: 1,
      duration: 1.1,
      ease: 'sine.inOut',
      delay
    });
  }

  // ── Hero ─────────────────────────────────────────────────────────────────────

  createHeroAnimations() {
    const heroTl = gsap.timeline({ delay: 0.3 });

    // 1. Title — clip-path reveal, left to right
    heroTl.to('.hero-title', {
      clipPath: 'inset(0 0% 0 0)',
      duration: 1.4,
      ease: 'expo.inOut'
    })
    // 2. Tagline — fade-rise, 0.6s after title begins
    .to('.hero-tagline', {
      y: 0,
      opacity: 1,
      duration: 0.8,
      ease: 'power2.out'
    }, 0.6)
    // 3. Description — fade-rise, 0.9s after title begins
    .to('.hero-description', {
      y: 0,
      opacity: 1,
      duration: 1,
      ease: 'power2.out'
    }, 0.9)
    // 4. CTA — pure linear fade-in, no easing curve
    .to('.hero-cta', {
      opacity: 1,
      duration: 2,
      ease: 'none'
    }, 1.3);

    this.animationTimelines.set('hero', heroTl);
  }

  // ── Section Titles ──────────────────────────────────────────────────────────

  createSectionTitleAnimations() {
    document.querySelectorAll('.section-title').forEach((title, index) => {
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: title,
          start: 'top 80%',
          end: 'top 40%',
          toggleActions: 'play none none none'
        }
      });

      tl.to(title, {
        y: 0,
        opacity: 1,
        duration: 0.8,
        ease: 'power2.out'
      });

      this.animationTimelines.set(`section-title-${index}`, tl);
    });
  }

  // ── Card Sections ───────────────────────────────────────────────────────────
  // All 15 cards (services, artists, gallery) share the same per-card
  // ScrollTrigger: fires when the card's top crosses 30% into the viewport.

  createServiceCardAnimations() {
    this.attachCardTriggers(document.querySelectorAll('.service-card'));
  }

  createArtistAnimations() {
    this.attachCardTriggers(document.querySelectorAll('.artist-card'));
  }

  createGalleryAnimations() {
    this.attachCardTriggers(document.querySelectorAll('.gallery-item'));
  }

  attachCardTriggers(cards) {
    cards.forEach((card) => {
      ScrollTrigger.create({
        trigger: card,
        start: 'top 70%', // fires when card top is 30% into the viewport
        once: true,
        onEnter: () => this.playCardEntrance(card, 0)
      });
    });
  }

  // ── Contact ─────────────────────────────────────────────────────────────────

  createContactAnimations() {
    const contactInfo = document.querySelector('.contact-info');
    const contactForm = document.querySelector('.contact-form');
    if (!contactInfo || !contactForm) return;

    gsap.to(contactInfo, {
      y: 0,
      opacity: 1,
      duration: 0.8,
      ease: 'power2.out',
      scrollTrigger: {
        trigger: contactInfo,
        start: 'top 80%',
        end: 'top 40%',
        toggleActions: 'play none none none'
      }
    });

    gsap.to(contactForm, {
      y: 0,
      opacity: 1,
      duration: 0.8,
      ease: 'power2.out',
      scrollTrigger: {
        trigger: contactForm,
        start: 'top 80%',
        end: 'top 40%',
        toggleActions: 'play none none none'
      }
    });
  }

  // ── Utility ─────────────────────────────────────────────────────────────────

  refreshScrollTrigger() {
    ScrollTrigger.refresh();
  }

  killAllAnimations() {
    this.animationTimelines.forEach((tl) => {
      if (tl && typeof tl.kill === 'function') tl.kill();
    });
    this.animationTimelines.clear();
    ScrollTrigger.killAll();
  }

  destroy() {
    this.killAllAnimations();
  }
}

export default ScrollAnimationController;
