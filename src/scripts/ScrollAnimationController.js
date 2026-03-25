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

      requestIdleCallback(() => {
        this.createSectionTitleAnimations();
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
    gsap.set('.hero-cta', { y: 30, opacity: 0, scale: 0.98 });

    // Section titles
    gsap.set('.section-title', { clipPath: 'inset(0 100% 0 0)' });

    // Cards
    gsap.set('.service-card', { y: 40, opacity: 0 });
    gsap.set('.artist-card', { y: 40, opacity: 0 });

    // Gallery
    const galleryItems = document.querySelectorAll('.gallery-item');
    if (galleryItems.length > 0) {
      gsap.set(galleryItems, { scale: 0.97, opacity: 0, visibility: 'visible' });
    }

    // Contact
    gsap.set('.contact-info, .contact-form', { y: 30, opacity: 0 });
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
    // 4. CTA — fade-rise + subtle scale, 1.1s after title begins
    .to('.hero-cta', {
      y: 0,
      opacity: 1,
      scale: 1,
      duration: 0.8,
      ease: 'power2.out',
    }, 1.1);

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
        clipPath: 'inset(0 0% 0 0)',
        duration: 1.1,
        ease: 'expo.inOut'
      });

      this.animationTimelines.set(`section-title-${index}`, tl);
    });
  }

  // ── Service Cards ───────────────────────────────────────────────────────────

  createServiceCardAnimations() {
    const cards = document.querySelectorAll('.service-card');
    if (cards.length === 0) return;

    gsap.to(cards, {
      y: 0,
      opacity: 1,
      duration: 0.7,
      ease: 'power2.out',
      stagger: { amount: 0.4, from: 'start' },
      scrollTrigger: {
        trigger: '.services',
        start: 'top 80%',
        end: 'top 40%',
        toggleActions: 'play none none none'
      }
    });
  }

  // ── Artist Cards ────────────────────────────────────────────────────────────

  createArtistAnimations() {
    const cards = document.querySelectorAll('.artist-card');
    if (cards.length === 0) return;

    gsap.to(cards, {
      y: 0,
      opacity: 1,
      duration: 0.7,
      ease: 'power2.out',
      stagger: { amount: 0.4, from: 'start' },
      scrollTrigger: {
        trigger: '.artists',
        start: 'top 80%',
        end: 'top 40%',
        toggleActions: 'play none none none'
      }
    });
  }

  // ── Gallery ─────────────────────────────────────────────────────────────────

  createGalleryAnimations() {
    const galleryItems = document.querySelectorAll('.gallery-item');
    if (galleryItems.length === 0) return;

    gsap.to(galleryItems, {
      scale: 1,
      opacity: 1,
      duration: 0.6,
      ease: 'power1.out',
      stagger: 0.12,
      scrollTrigger: {
        trigger: '.gallery-grid',
        start: 'top 85%',
        end: 'top 40%',
        toggleActions: 'play none none none'
      }
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
