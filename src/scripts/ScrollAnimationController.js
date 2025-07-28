import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

// Register ScrollTrigger plugin
gsap.registerPlugin(ScrollTrigger);

class ScrollAnimationController {
  constructor() {
    this.customEasing = {
      // Fire-themed custom easing functions
      fireBlast: "power4.out",
      emberFloat: "power2.inOut", 
      flameFlicker: "elastic.out(1, 0.6)",
      smokeRise: "power3.out",
      sparkBurst: "back.out(1.7)",
      infernoWave: "expo.inOut",
      magicSpell: "elastic.out(0.8, 0.4)",
      phoenixRise: "power4.inOut"
    };
    
    this.animationTimelines = new Map();
    this.isInitialized = false;
    
    this.init();
  }

  init() {
    // Wait for DOM to be ready
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => this.setupAnimations());
    } else {
      this.setupAnimations();
    }
  }

  setupAnimations() {
    this.setupInitialStates();
    this.createHeroAnimations();
    this.createSectionTitleAnimations();
    this.createServiceCardAnimations();
    this.createArtistAnimations();
    this.createGalleryAnimations();
    this.createContactAnimations();
    this.createParallaxEffects();
    this.createNavigationAnimations();
    this.setupFallbackObserver(); // Add fallback
    
    this.isInitialized = true;
    
    // Refresh ScrollTrigger after all animations are set up
    ScrollTrigger.refresh();
  }

  setupInitialStates() {
    // Set initial states for all animated elements
    gsap.set('.section-title', { 
      y: 100, 
      opacity: 0, 
      scale: 0.8,
      rotationX: 45
    });
    
    gsap.set('.service-card', { 
      y: 150, 
      opacity: 0, 
      scale: 0.8,
      rotationY: 45,
      transformOrigin: "center bottom"
    });
    
    gsap.set('.artist-card', { 
      x: -200, 
      opacity: 0, 
      rotationZ: -15,
      scale: 0.7
    });
    
    // More reliable gallery initial state
    const galleryItems = document.querySelectorAll('.gallery-item');
    if (galleryItems.length > 0) {
      galleryItems.forEach((item, index) => {
        gsap.set(item, { 
          scale: 0, 
          opacity: 0, 
          rotation: (Math.random() - 0.5) * 90,
          transformOrigin: "center",
          visibility: "visible" // Ensure visibility
        });
      });
    }
    
    gsap.set('.contact-info, .contact-form', { 
      y: 200, 
      opacity: 0,
      scale: 0.9
    });
    
    gsap.set('.nav-links li', { 
      y: -50, 
      opacity: 0 
    });
  }

  createHeroAnimations() {
    const heroTl = gsap.timeline({ 
      delay: 0.5,
      onComplete: () => this.createHeroParticleExplosion()
    });
    
    // Hero title with dramatic entrance
    heroTl.to('.hero-title', {
      duration: 2,
      y: 0,
      opacity: 1,
      scale: 1,
      ease: this.customEasing.phoenixRise,
      transformOrigin: "center"
    })
    .to('.hero-tagline', {
      duration: 1.5,
      y: 0,
      opacity: 1,
      ease: this.customEasing.emberFloat,
      delay: -1
    })
    .to('.hero-description', {
      duration: 1.2,
      y: 0,
      opacity: 1,
      ease: this.customEasing.smokeRise,
      delay: -0.8
    })
    .to('.hero-cta', {
      duration: 1,
      y: 0,
      opacity: 1,
      scale: 1,
      ease: this.customEasing.sparkBurst,
      delay: -0.5,
      onComplete: () => {
        // Add continuous glow pulse to CTA
        gsap.to('.hero-cta', {
          boxShadow: '0 12px 50px rgba(204, 0, 0, 0.6)',
          duration: 2,
          ease: "sine.inOut",
          repeat: -1,
          yoyo: true
        });
      }
    });

    // Initial states for hero elements
    gsap.set('.hero-title', { y: 150, opacity: 0, scale: 0.5 });
    gsap.set('.hero-tagline', { y: 100, opacity: 0 });
    gsap.set('.hero-description', { y: 80, opacity: 0 });
    gsap.set('.hero-cta', { y: 60, opacity: 0, scale: 0.8 });
  }

  createHeroParticleExplosion() {
    // Create magical particle explosion when hero loads
    const heroTitle = document.querySelector('.hero-title');
    if (heroTitle) {
      const rect = heroTitle.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      
      // Trigger particle explosion in magical cursor
      if (window.magicalCursor) {
        window.magicalCursor.mouse.x = centerX;
        window.magicalCursor.mouse.y = centerY;
        window.magicalCursor.createClickExplosion();
      }
    }
  }

  createSectionTitleAnimations() {
    document.querySelectorAll('.section-title').forEach((title, index) => {
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: title,
          start: "top 85%",
          end: "bottom 15%",
          toggleActions: "play none none reverse",
          onEnter: () => this.createTitleParticleEffect(title)
        }
      });

      tl.to(title, {
        duration: 1.5,
        y: 0,
        opacity: 1,
        scale: 1,
        rotationX: 0,
        ease: this.customEasing.magicSpell,
        transformOrigin: "center bottom"
      })
      .to(title, {
        duration: 0.8,
        textShadow: "0 0 30px rgba(255, 87, 34, 0.8)",
        ease: this.customEasing.flameFlicker,
        delay: -0.5
      });

      this.animationTimelines.set(`section-title-${index}`, tl);
    });
  }

  createTitleParticleEffect(titleElement) {
    // Create sparkle effect around section titles
    if (window.magicalCursor) {
      const rect = titleElement.getBoundingClientRect();
      const originalX = window.magicalCursor.mouse.x;
      const originalY = window.magicalCursor.mouse.y;
      
      // Create sparkles around the title
      for (let i = 0; i < 10; i++) {
        setTimeout(() => {
          window.magicalCursor.mouse.x = rect.left + Math.random() * rect.width;
          window.magicalCursor.mouse.y = rect.top + Math.random() * rect.height;
          window.magicalCursor.createSparkle();
        }, i * 100);
      }
      
      // Restore original mouse position
      setTimeout(() => {
        window.magicalCursor.mouse.x = originalX;
        window.magicalCursor.mouse.y = originalY;
      }, 1000);
    }
  }

  createServiceCardAnimations() {
    const serviceCards = document.querySelectorAll('.service-card');
    
    if (serviceCards.length === 0) return;

    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: '.services',
        start: "top 75%",
        end: "bottom 25%",
        toggleActions: "play none none reverse"
      }
    });

    // Staggered entrance with different directions and rotations
    serviceCards.forEach((card, index) => {
      const delay = index * 0.15;
      const direction = index % 2 === 0 ? -1 : 1;
      
      tl.to(card, {
        duration: 1.2,
        y: 0,
        x: 0,
        opacity: 1,
        scale: 1,
        rotationY: 0,
        rotationZ: 0,
        ease: this.customEasing.sparkBurst,
        transformOrigin: "center bottom",
        delay: delay,
        onComplete: () => this.addCardHoverEnhancements(card)
      }, 0);

      // Add floating animation
      tl.to(card, {
        duration: 3,
        y: -10,
        ease: "sine.inOut",
        repeat: -1,
        yoyo: true,
        delay: delay + 1
      }, 0);

      // Initial position based on index
      gsap.set(card, { 
        x: direction * 300, 
        y: 150, 
        opacity: 0, 
        scale: 0.6,
        rotationY: direction * 45,
        rotationZ: direction * 10
      });
    });

    this.animationTimelines.set('service-cards', tl);
  }

  addCardHoverEnhancements(card) {
    // Enhanced hover effects for service cards
    card.addEventListener('mouseenter', () => {
      gsap.to(card, {
        duration: 0.3,
        scale: 1.05,
        y: -15,
        rotationY: 5,
        boxShadow: "0 25px 50px rgba(204, 0, 0, 0.3)",
        ease: this.customEasing.sparkBurst
      });
      
      // Add glow to service icon
      const icon = card.querySelector('.service-icon');
      if (icon) {
        gsap.to(icon, {
          duration: 0.3,
          scale: 1.2,
          filter: "brightness(1.5) saturate(1.5)",
          ease: this.customEasing.flameFlicker
        });
      }
    });

    card.addEventListener('mouseleave', () => {
      gsap.to(card, {
        duration: 0.4,
        scale: 1,
        y: 0,
        rotationY: 0,
        boxShadow: "0 10px 25px rgba(0, 0, 0, 0.2)",
        ease: this.customEasing.emberFloat
      });
      
      const icon = card.querySelector('.service-icon');
      if (icon) {
        gsap.to(icon, {
          duration: 0.4,
          scale: 1,
          filter: "brightness(1) saturate(1)",
          ease: this.customEasing.emberFloat
        });
      }
    });
  }

  createArtistAnimations() {
    const artistCards = document.querySelectorAll('.artist-card');
    
    if (artistCards.length === 0) return;

    artistCards.forEach((card, index) => {
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: card,
          start: "top 80%",
          end: "bottom 20%",
          toggleActions: "play none none reverse"
        }
      });

      const direction = index % 2 === 0 ? -1 : 1;
      
      // Dramatic entrance with rotation and scale
      tl.to(card, {
        duration: 1.5,
        x: 0,
        opacity: 1,
        rotationZ: 0,
        scale: 1,
        ease: this.customEasing.phoenixRise,
        transformOrigin: "center"
      })
      .to(card.querySelector('.artist-image'), {
        duration: 1.5, // Match card duration
        scale: 1,
        // Remove rotation entirely
        ease: "power2.out", // Smoother easing
        delay: -1.5, // Start with card
        force3D: true,
        transformOrigin: "center center"
      })
      .to(card.querySelector('h3'), {
        duration: 0.8,
        y: 0,
        opacity: 1,
        ease: this.customEasing.sparkBurst,
        delay: -0.6
      })
      .to(card.querySelector('.artist-specialty'), {
        duration: 0.6,
        y: 0,
        opacity: 1,
        color: "#FF5722",
        ease: this.customEasing.emberFloat,
        delay: -0.4
      })
      .to(card.querySelector('p:last-child'), {
        duration: 0.8,
        y: 0,
        opacity: 1,
        ease: this.customEasing.smokeRise,
        delay: -0.4
      })
      // Add transition buffer for smooth finish
      .to(card, {
        duration: 0.3,
        ease: "power2.out",
        onComplete: () => {
          // Start gentle floating animation
          gsap.to(card, {
            duration: 4,
            y: -5,
            ease: "sine.inOut",
            repeat: -1,
            yoyo: true
          });
        }
      });

      // Set initial states
      gsap.set(card.querySelector('.artist-image'), { 
        scale: 0.5, 
        // rotation: -180 
      });
      gsap.set(card.querySelector('h3'), { 
        y: 50, 
        opacity: 0 
      });
      gsap.set(card.querySelector('.artist-specialty'), { 
        y: 30, 
        opacity: 0 
      });
      gsap.set(card.querySelector('p:last-child'), { 
        y: 40, 
        opacity: 0 
      });

      this.animationTimelines.set(`artist-card-${index}`, tl);
    });
  }

  createGalleryAnimations() {
    const gallerySection = document.querySelector('.gallery');
    const galleryItems = document.querySelectorAll('.gallery-item');
    
    if (galleryItems.length === 0 || !gallerySection) {
      console.warn('Gallery elements not found');
      return;
    }

    // Create individual ScrollTriggers for each gallery item - EACH ITEM IS ITS OWN TRIGGER
    galleryItems.forEach((item, index) => {
      const initialRotation = (Math.random() - 0.5) * 60;
      
      // Set initial state for this specific item
      gsap.set(item, { 
        scale: 0, 
        opacity: 0, 
        rotation: initialRotation,
        transformOrigin: "center",
        visibility: "visible",
        force3D: true
      });
      
      // Create entrance animation timeline for this item
      // KEY FIX: Use the ITEM ITSELF as the trigger, not the gallery section
      const itemTl = gsap.timeline({
        scrollTrigger: {
          trigger: item, // ← FIXED: Each item triggers its own animation
          start: "top 85%", // When THIS item enters viewport
          end: "bottom 15%",
          toggleActions: "play none none reverse",
          once: false,
          refreshPriority: 1,
          onEnter: () => {
            console.log(`Gallery item ${index + 1} triggered individually`);
          },
          onLeave: () => {
            console.log(`Gallery item ${index + 1} left viewport`);
          },
          onEnterBack: () => {
            console.log(`Gallery item ${index + 1} re-entered viewport`);
          }
        }
      });

      // Main entrance animation with staggered timing
      itemTl.to(item, {
        duration: 1.2,
        scale: 1,
        opacity: 1,
        rotation: 0,
        ease: this.customEasing.sparkBurst,
        transformOrigin: "center",
        force3D: true,
        onStart: () => {
          item.classList.add('animating');
          console.log(`Gallery item ${index + 1} animation started`);
        },
        onComplete: () => {
          item.classList.remove('animating');
          this.addGalleryItemEffects(item);
          console.log(`Gallery item ${index + 1} animation completed`);
        }
      });

      // Add continuous floating animation after entrance
      itemTl.to(item, {
        duration: 3 + Math.random() * 2,
        rotation: (Math.random() - 0.5) * 8,
        ease: "sine.inOut",
        repeat: -1,
        yoyo: true,
        delay: 0.3
      }, 0.8); // Start floating after entrance completes

      this.animationTimelines.set(`gallery-item-${index}`, itemTl);
    });

    // Create a fallback animation for the entire gallery section
    const fallbackTl = gsap.timeline({
      scrollTrigger: {
        trigger: gallerySection,
        start: "top 85%",
        end: "bottom 15%",
        toggleActions: "play none none reverse",
        onEnter: () => {
          console.log('Gallery fallback triggered');
          // Ensure all items are visible as fallback
          galleryItems.forEach(item => {
            if (gsap.getProperty(item, "opacity") < 0.1) {
              gsap.to(item, {
                duration: 0.8,
                scale: 1,
                opacity: 1,
                rotation: 0,
                ease: "power2.out"
              });
            }
          });
        }
      }
    });

    this.animationTimelines.set('gallery-fallback', fallbackTl);
  }

  addGalleryItemEffects(item) {
    const img = item.querySelector('img');
    const overlay = item.querySelector('.gallery-overlay');
    
    item.addEventListener('mouseenter', () => {
      gsap.to(item, {
        duration: 0.4,
        scale: 1.08,
        rotation: (Math.random() - 0.5) * 15,
        boxShadow: "0 25px 60px rgba(255, 87, 34, 0.5)",
        ease: this.customEasing.flameFlicker,
        transformOrigin: "center"
      });
      
      if (img) {
        gsap.to(img, {
          duration: 0.4,
          scale: 1.15,
          filter: "brightness(0.7) contrast(1.3) saturate(1.2)",
          ease: this.customEasing.flameFlicker
        });
      }
      
      if (overlay) {
        gsap.to(overlay, {
          duration: 0.3,
          opacity: 1,
          ease: this.customEasing.sparkBurst
        });
        
        const icon = overlay.querySelector('.gallery-icon');
        if (icon) {
          gsap.to(icon, {
            duration: 0.3,
            scale: 1.2,
            rotation: 360,
            ease: this.customEasing.sparkBurst
          });
        }
      }
    });

    item.addEventListener('mouseleave', () => {
      gsap.to(item, {
        duration: 0.5,
        scale: 1,
        rotation: 0,
        boxShadow: "0 15px 35px rgba(204, 0, 0, 0.3)",
        ease: this.customEasing.emberFloat
      });
      
      if (img) {
        gsap.to(img, {
          duration: 0.5,
          scale: 1,
          filter: "brightness(1) contrast(1) saturate(1)",
          ease: this.customEasing.emberFloat
        });
      }
      
      if (overlay) {
        gsap.to(overlay, {
          duration: 0.4,
          opacity: 0,
          ease: this.customEasing.emberFloat
        });
        
        const icon = overlay.querySelector('.gallery-icon');
        if (icon) {
          gsap.to(icon, {
            duration: 0.4,
            scale: 0.8,
            rotation: 0,
            ease: this.customEasing.emberFloat
          });
        }
      }
    });
  }

  createContactAnimations() {
    const contactInfo = document.querySelector('.contact-info');
    const contactForm = document.querySelector('.contact-form');
    
    if (!contactInfo || !contactForm) return;

    // Contact info animation
    const infoTl = gsap.timeline({
      scrollTrigger: {
        trigger: contactInfo,
        start: "top 80%",
        end: "bottom 20%",
        toggleActions: "play none none reverse"
      }
    });

    infoTl.to(contactInfo, {
      duration: 1.5,
      y: 0,
      opacity: 1,
      scale: 1,
      ease: this.customEasing.phoenixRise
    })
    .to(contactInfo.querySelectorAll('p'), {
      duration: 0.8,
      y: 0,
      opacity: 1,
      stagger: 0.1,
      ease: this.customEasing.emberFloat,
      delay: -1
    })
    .to(contactInfo.querySelector('.hours'), {
      duration: 1,
      scale: 1,
      opacity: 1,
      rotationY: 0,
      ease: this.customEasing.sparkBurst,
      delay: -0.5
    });

    // Contact form animation
    const formTl = gsap.timeline({
      scrollTrigger: {
        trigger: contactForm,
        start: "top 80%",
        end: "bottom 20%",
        toggleActions: "play none none reverse"
      }
    });

    formTl.to(contactForm, {
      duration: 1.5,
      y: 0,
      opacity: 1,
      scale: 1,
      ease: this.customEasing.magicSpell
    })
    .to(contactForm.querySelectorAll('input, select, textarea'), {
      duration: 0.6,
      y: 0,
      opacity: 1,
      stagger: 0.08,
      ease: this.customEasing.emberFloat,
      delay: -1
    })
    .to(contactForm.querySelector('.submit-btn'), {
      duration: 0.8,
      y: 0,
      opacity: 1,
      scale: 1,
      ease: this.customEasing.sparkBurst,
      delay: -0.3,
      onComplete: () => this.addFormButtonEffects()
    });

    // Set initial states
    gsap.set(contactInfo.querySelectorAll('p'), { y: 30, opacity: 0 });
    gsap.set(contactInfo.querySelector('.hours'), { 
      scale: 0.8, 
      opacity: 0, 
      rotationY: 45 
    });
    gsap.set(contactForm.querySelectorAll('input, select, textarea'), { 
      y: 40, 
      opacity: 0 
    });
    gsap.set(contactForm.querySelector('.submit-btn'), { 
      y: 50, 
      opacity: 0, 
      scale: 0.8 
    });

    this.animationTimelines.set('contact-info', infoTl);
    this.animationTimelines.set('contact-form', formTl);
  }

  addFormButtonEffects() {
    const submitBtn = document.querySelector('.submit-btn');
    if (!submitBtn) return;

    // Add magical glow effect
    gsap.to(submitBtn, {
      duration: 2,
      boxShadow: "0 8px 40px rgba(204, 0, 0, 0.5)",
      ease: "sine.inOut",
      repeat: -1,
      yoyo: true
    });

    // Enhanced hover effect
    submitBtn.addEventListener('mouseenter', () => {
      gsap.to(submitBtn, {
        duration: 0.3,
        scale: 1.05,
        y: -5,
        boxShadow: "0 15px 50px rgba(255, 87, 34, 0.6)",
        ease: this.customEasing.sparkBurst
      });
    });

    submitBtn.addEventListener('mouseleave', () => {
      gsap.to(submitBtn, {
        duration: 0.4,
        scale: 1,
        y: 0,
        ease: this.customEasing.emberFloat
      });
    });
  }

  createParallaxEffects() {
    // Parallax background effects for sections
    const sections = document.querySelectorAll('section');
    
    sections.forEach((section, index) => {
      if (section.classList.contains('hero')) return; // Skip hero
      
      gsap.to(section, {
        yPercent: -15,
        ease: "none",
        scrollTrigger: {
          trigger: section,
          start: "top bottom",
          end: "bottom top",
          scrub: 0.5
        }
      });
    });

    // Floating elements parallax
    const floatingElements = document.querySelectorAll('.section-title');
    floatingElements.forEach(el => {
      gsap.to(el, {
        y: -30,
        ease: "none",
        scrollTrigger: {
          trigger: el,
          start: "top bottom",
          end: "bottom top",
          scrub: 1
        }
      });
    });
  }

  createNavigationAnimations() {
    const navLinks = document.querySelectorAll('.nav-links li');
    
    // Staggered navigation entrance
    gsap.to(navLinks, {
      duration: 0.8,
      y: 0,
      opacity: 1,
      stagger: 0.1,
      ease: this.customEasing.sparkBurst,
      delay: 2 // After hero animation
    });

    // Navigation scroll effects - REMOVED to prevent height pinching
  }

  setupFallbackObserver() {
    // Simple Intersection Observer fallback for gallery items
    const galleryItems = document.querySelectorAll('.gallery-item');
    
    if (!galleryItems.length) return;
    
    // Create intersection observer as backup
    const fallbackObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('in-view', 'gallery-visible');
          
          // Extra insurance - force visibility after 2 seconds
          setTimeout(() => {
            if (gsap.getProperty(entry.target, "opacity") < 0.5) {
              console.warn('Gallery item still hidden, forcing visibility');
              entry.target.classList.add('gallery-visible');
              gsap.set(entry.target, {
                opacity: 1,
                scale: 1,
                rotation: 0,
                visibility: "visible"
              });
            }
          }, 2000);
        }
      });
    }, {
      threshold: 0.1,
      rootMargin: '50px'
    });
    
    galleryItems.forEach(item => {
      fallbackObserver.observe(item);
    });
    
    this.fallbackObserver = fallbackObserver;
  }

  // Utility methods
  refreshScrollTrigger() {
    ScrollTrigger.refresh();
  }

  killAllAnimations() {
    this.animationTimelines.forEach(tl => tl.kill());
    this.animationTimelines.clear();
    ScrollTrigger.killAll();
  }

  pauseAnimations() {
    this.animationTimelines.forEach(tl => tl.pause());
  }

  resumeAnimations() {
    this.animationTimelines.forEach(tl => tl.resume());
  }

  destroy() {
    this.killAllAnimations();
    
    // Clean up fallback observer
    if (this.fallbackObserver) {
      this.fallbackObserver.disconnect();
    }
  }
}

export default ScrollAnimationController;