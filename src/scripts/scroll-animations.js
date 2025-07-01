class ScrollAnimations {
  constructor() {
    this.elements = [];
    this.observer = null;
    
    this.init();
  }

  init() {
    this.observer = new IntersectionObserver(
      (entries) => this.handleIntersection(entries),
      {
        threshold: 0.1,
        rootMargin: '-50px 0px -50px 0px'
      }
    );

    this.observeElements();
    this.setupParallax();
  }

  observeElements() {
    const animatedElements = document.querySelectorAll('.fade-in, .slide-left, .slide-right');
    
    animatedElements.forEach(el => {
      this.observer.observe(el);
      this.elements.push(el);
    });
  }

  handleIntersection(entries) {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        
        if (entry.target.dataset.delay) {
          const delay = parseInt(entry.target.dataset.delay);
          setTimeout(() => {
            entry.target.classList.add('visible');
          }, delay);
        }
      }
    });
  }

  setupParallax() {
    const parallaxElements = document.querySelectorAll('[data-parallax]');
    
    window.addEventListener('scroll', () => {
      const scrolled = window.pageYOffset;
      
      parallaxElements.forEach(el => {
        const rate = scrolled * (el.dataset.parallax || 0.5);
        el.style.transform = `translateY(${rate}px)`;
      });
    });
  }

  addStaggeredAnimation(selector, delay = 100) {
    const elements = document.querySelectorAll(selector);
    
    elements.forEach((el, index) => {
      el.dataset.delay = index * delay;
      this.observer.observe(el);
    });
  }

  setupTextReveal() {
    const textElements = document.querySelectorAll('.text-reveal');
    
    textElements.forEach(el => {
      const text = el.textContent;
      el.innerHTML = '';
      
      text.split('').forEach((char, index) => {
        const span = document.createElement('span');
        span.textContent = char === ' ' ? '\u00A0' : char;
        span.style.animationDelay = `${index * 50}ms`;
        span.classList.add('char-reveal');
        el.appendChild(span);
      });
      
      this.observer.observe(el);
    });
  }

  destroy() {
    if (this.observer) {
      this.observer.disconnect();
    }
  }
}

export default ScrollAnimations;