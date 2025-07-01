class CustomCursor {
  constructor() {
    this.cursor = null;
    this.trail = [];
    this.maxTrail = 10;
    this.mouseX = 0;
    this.mouseY = 0;
    this.isMoving = false;
    
    this.init();
    this.bindEvents();
  }

  init() {
    this.cursor = document.createElement('div');
    this.cursor.className = 'custom-cursor';
    document.body.appendChild(this.cursor);

    for (let i = 0; i < this.maxTrail; i++) {
      const trailDot = document.createElement('div');
      trailDot.className = 'cursor-trail';
      trailDot.style.zIndex = 9999 - i;
      document.body.appendChild(trailDot);
      this.trail.push({
        element: trailDot,
        x: 0,
        y: 0
      });
    }

    this.addStyles();
  }

  addStyles() {
    const style = document.createElement('style');
    style.textContent = `
      .custom-cursor {
        position: fixed;
        width: 20px;
        height: 20px;
        background: radial-gradient(circle, #FF4444, #FF6B35);
        border-radius: 50%;
        pointer-events: none;
        z-index: 10000;
        mix-blend-mode: difference;
        transition: transform 0.1s ease;
        box-shadow: 0 0 20px #FF4444, 0 0 40px #FF4444, 0 0 60px #FF4444;
      }
      
      .cursor-trail {
        position: fixed;
        width: 8px;
        height: 8px;
        background: radial-gradient(circle, #FF8C42, #FFD23F);
        border-radius: 50%;
        pointer-events: none;
        opacity: 0.6;
        transition: all 0.3s ease;
      }
      
      .custom-cursor.hovering {
        transform: scale(1.5);
        background: radial-gradient(circle, #FFD23F, #FF8C42);
      }
      
      .cursor-trail.hovering {
        transform: scale(1.2);
        opacity: 0.8;
      }
    `;
    document.head.appendChild(style);
  }

  bindEvents() {
    document.addEventListener('mousemove', (e) => {
      this.mouseX = e.clientX;
      this.mouseY = e.clientY;
      this.isMoving = true;
      
      this.updateCursor();
      this.updateTrail();
    });

    document.addEventListener('mouseenter', () => {
      this.cursor.style.opacity = '1';
      this.trail.forEach(dot => dot.element.style.opacity = '0.6');
    });

    document.addEventListener('mouseleave', () => {
      this.cursor.style.opacity = '0';
      this.trail.forEach(dot => dot.element.style.opacity = '0');
    });

    document.querySelectorAll('a, button, [role="button"]').forEach(el => {
      el.addEventListener('mouseenter', () => {
        this.cursor.classList.add('hovering');
        this.trail.forEach(dot => dot.element.classList.add('hovering'));
      });
      
      el.addEventListener('mouseleave', () => {
        this.cursor.classList.remove('hovering');
        this.trail.forEach(dot => dot.element.classList.remove('hovering'));
      });
    });
  }

  updateCursor() {
    this.cursor.style.left = this.mouseX - 10 + 'px';
    this.cursor.style.top = this.mouseY - 10 + 'px';
  }

  updateTrail() {
    for (let i = this.trail.length - 1; i > 0; i--) {
      this.trail[i].x = this.trail[i - 1].x;
      this.trail[i].y = this.trail[i - 1].y;
    }
    
    this.trail[0].x = this.mouseX;
    this.trail[0].y = this.mouseY;
    
    this.trail.forEach((dot, index) => {
      const delay = index * 50;
      setTimeout(() => {
        dot.element.style.left = dot.x - 4 + 'px';
        dot.element.style.top = dot.y - 4 + 'px';
        dot.element.style.opacity = (this.maxTrail - index) / this.maxTrail * 0.6;
      }, delay);
    });
  }
}

export default CustomCursor;