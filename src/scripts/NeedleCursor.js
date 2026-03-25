import { gsap } from 'gsap';

class NeedleCursor {
  constructor() {
    this.isTouch = window.matchMedia('(pointer: coarse)').matches;
    if (this.isTouch) {
      document.body.style.cursor = 'auto';
      return;
    }

    this.mouse = { x: -100, y: -100 };
    this.prev = { x: -100, y: -100 };
    this.isHovering = false;
    this.embers = [];
    this.maxLife = 48; // ~0.8s at 60fps
    this.raf = null;
    this.frameCount = 0;

    this.createElements();
    this.bindEvents();
    this.loop();
  }

  createElements() {
    // Cursor dot — radial gradient core, mix-blend-mode: difference
    this.dot = document.createElement('div');
    Object.assign(this.dot.style, {
      position: 'fixed',
      top: '0',
      left: '0',
      width: '10px',
      height: '10px',
      borderRadius: '50%',
      background: 'radial-gradient(circle, #FFF2CC 0%, #FF6B35 60%, #CC2200 100%)',
      mixBlendMode: 'difference',
      pointerEvents: 'none',
      zIndex: '10001',
      transform: 'translate(-50%, -50%)'
    });
    document.body.appendChild(this.dot);

    // Ember trail canvas
    this.canvas = document.createElement('canvas');
    Object.assign(this.canvas.style, {
      position: 'fixed',
      top: '0',
      left: '0',
      width: '100vw',
      height: '100vh',
      pointerEvents: 'none',
      zIndex: '10000'
    });
    document.body.appendChild(this.canvas);
    this.ctx = this.canvas.getContext('2d');
    this.resize();
  }

  resize() {
    const dpr = window.devicePixelRatio || 1;
    this.canvas.width = window.innerWidth * dpr;
    this.canvas.height = window.innerHeight * dpr;
    this.ctx.scale(dpr, dpr);
  }

  bindEvents() {
    this._onMouseMove = (e) => {
      this.prev.x = this.mouse.x;
      this.prev.y = this.mouse.y;
      this.mouse.x = e.clientX;
      this.mouse.y = e.clientY;

      gsap.to(this.dot, {
        x: e.clientX,
        y: e.clientY,
        duration: 0.12,
        ease: 'power2.out',
        overwrite: true
      });

      this.spawnEmber(e.clientX, e.clientY, false);
    };

    this._onMouseOver = (e) => {
      if (e.target.closest('a, button')) {
        this.isHovering = true;
        gsap.to(this.dot, { scale: 2.5, duration: 0.2, ease: 'power2.out' });
      }
    };

    this._onMouseOut = (e) => {
      const from = e.target.closest('a, button');
      const to = e.relatedTarget && e.relatedTarget.closest
        ? e.relatedTarget.closest('a, button')
        : null;
      if (from && from !== to) {
        this.isHovering = false;
        gsap.to(this.dot, { scale: 1, duration: 0.2, ease: 'power2.out' });
      }
    };

    this._onMouseDown = () => {
      gsap.to(this.dot, { scale: 0.6, duration: 0.1, ease: 'power2.out' });
      this.burstEmbers(this.mouse.x, this.mouse.y);
    };

    this._onMouseUp = () => {
      gsap.to(this.dot, {
        scale: this.isHovering ? 2.5 : 1,
        duration: 0.15,
        ease: 'power2.out'
      });
    };

    this._onResize = () => this.resize();

    window.addEventListener('mousemove', this._onMouseMove);
    document.addEventListener('mouseover', this._onMouseOver);
    document.addEventListener('mouseout', this._onMouseOut);
    window.addEventListener('mousedown', this._onMouseDown);
    window.addEventListener('mouseup', this._onMouseUp);
    window.addEventListener('resize', this._onResize);
  }

  // ── Ember Trail ───────────────────────────────────────────────────────────

  spawnEmber(x, y, isBurst) {
    const dx = this.mouse.x - this.prev.x;
    const dy = this.mouse.y - this.prev.y;
    const speed = Math.sqrt(dx * dx + dy * dy) || 1;
    const mag = Math.min(1.5, Math.max(0.5, speed * 0.05));

    // Direction of cursor movement
    const dirX = dx / speed;
    const dirY = dy / speed;

    this.embers.push({
      x,
      y,
      vx: dirX * mag * (0.5 + Math.random()),
      vy: dirY * mag * (0.5 + Math.random()),
      // Sliver dimensions: length along travel axis, width perpendicular
      length: isBurst ? (2 + Math.random() * 2) : (3 + Math.random() * 3),
      width: 0.8 + Math.random() * 0.6,
      life: this.maxLife,
      maxLife: this.maxLife,
      // Angle from velocity — will be updated each frame
      angle: Math.atan2(dy, dx),
      // Color variant: 0 = glow→deep, 1 = flame→mid
      colorVariant: Math.random() < 0.5 ? 0 : 1,
    });
  }

  burstEmbers(x, y) {
    const count = 8 + Math.floor(Math.random() * 5);
    for (let i = 0; i < count; i++) {
      // Bias angles upward: 70% in the upper arc (-150° to -30°), 30% elsewhere
      let angle;
      if (Math.random() < 0.7) {
        // Upper hemisphere: roughly -150° to -30° (upward with spread)
        angle = -Math.PI / 2 + (Math.random() - 0.5) * (Math.PI * 0.7);
      } else {
        // Remaining: sides and slightly downward
        angle = Math.PI / 2 + (Math.random() - 0.5) * Math.PI;
      }
      angle += (Math.random() - 0.5) * 0.3; // Jitter

      const speed = 1.5 + Math.random() * 2.5;
      this.embers.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        length: 2 + Math.random() * 2,
        width: 0.6 + Math.random() * 0.5,
        life: this.maxLife,
        maxLife: this.maxLife,
        angle: angle,
        colorVariant: Math.random() < 0.5 ? 0 : 1,
      });
    }
  }

  // ── Render Loop ───────────────────────────────────────────────────────────

  loop() {
    this.frameCount++;
    const ctx = this.ctx;
    const dpr = window.devicePixelRatio || 1;
    ctx.clearRect(0, 0, this.canvas.width / dpr, this.canvas.height / dpr);

    // ── Option A: Dot flicker ──
    // Layered sine waves for organic opacity + scale oscillation
    const f = this.frameCount;
    const flicker = 0.82
      + Math.sin(f * 0.47) * 0.08
      + Math.sin(f * 1.13) * 0.05
      + Math.sin(f * 2.71) * 0.04;
    this.dot.style.opacity = Math.max(0.65, Math.min(1, flicker));

    const breathe = 1.0
      + Math.sin(f * 0.31) * 0.03
      + Math.sin(f * 0.83) * 0.02;
    // Only apply breathe when not in a GSAP scale animation (hover/click)
    if (!this.isHovering && !this._isClicking) {
      gsap.set(this.dot, { scale: breathe });
    }

    // ── Ember rendering ──
    // Color palettes: [birth, death]
    // Variant 0: $heat-glow → $heat-deep
    // Variant 1: $heat-flame → $heat-mid
    const palettes = [
      { br: 0xFF, bg: 0x9A, bb: 0x5C, dr: 0x8B, dg: 0x00, db: 0x00 },
      { br: 0xFF, bg: 0xF2, bb: 0x00, dr: 0xE8, dg: 0x4A, db: 0x1A },
    ];

    for (let i = this.embers.length - 1; i >= 0; i--) {
      const e = this.embers[i];
      e.life--;

      if (e.life <= 0) {
        this.embers.splice(i, 1);
        continue;
      }

      // Physics: upward drift + lateral wobble (same for trail and burst)
      e.vy -= 0.04;
      e.vx += (Math.random() - 0.5) * 0.1;
      // Gentle lateral damping
      e.vx *= 0.995;
      e.x += e.vx;
      e.y += e.vy;

      // Update angle from velocity — smooth lerp to avoid snapping
      const targetAngle = Math.atan2(e.vy, e.vx);
      const diff = Math.atan2(Math.sin(targetAngle - e.angle), Math.cos(targetAngle - e.angle));
      e.angle += diff * 0.1;

      // Color interpolation
      const t = e.life / e.maxLife; // 1 at birth, 0 at death
      const p = palettes[e.colorVariant];
      const r = Math.round(p.dr + (p.br - p.dr) * t);
      const g = Math.round(p.dg + (p.bg - p.dg) * t);
      const b = Math.round(p.db + (p.bb - p.db) * t);

      // ── Option D: Draw tapered sliver instead of circle ──
      ctx.save();
      ctx.translate(e.x, e.y);
      ctx.rotate(e.angle);
      ctx.globalAlpha = t;

      const halfLen = e.length * (0.6 + t * 0.4); // Shrinks over lifetime
      const halfWid = e.width * (0.5 + t * 0.5);

      // Tapered ember: wider at the trailing end (left), pointed at the leading tip (right)
      ctx.beginPath();
      ctx.moveTo(halfLen, 0);                            // Leading tip — sharp point
      ctx.quadraticCurveTo(0, -halfWid, -halfLen, -halfWid * 0.6);  // Top curve
      ctx.lineTo(-halfLen, halfWid * 0.6);                           // Trailing end
      ctx.quadraticCurveTo(0, halfWid, halfLen, 0);      // Bottom curve back to tip
      ctx.closePath();

      // Fill with slight radial warmth — brighter at center
      const grad = ctx.createLinearGradient(-halfLen, 0, halfLen, 0);
      grad.addColorStop(0, `rgba(${r},${g},${b},0.4)`);
      grad.addColorStop(0.4, `rgb(${r},${g},${b})`);
      grad.addColorStop(0.8, `rgb(${Math.min(255, r + 40)},${Math.min(255, g + 30)},${Math.min(255, b + 20)})`);
      grad.addColorStop(1, `rgba(${r},${g},${b},0.6)`);
      ctx.fillStyle = grad;
      ctx.fill();

      ctx.restore();
    }

    ctx.globalAlpha = 1;
    this.raf = requestAnimationFrame(() => this.loop());
  }

  // ── Cleanup ───────────────────────────────────────────────────────────────

  destroy() {
    if (this.raf) cancelAnimationFrame(this.raf);

    window.removeEventListener('mousemove', this._onMouseMove);
    document.removeEventListener('mouseover', this._onMouseOver);
    document.removeEventListener('mouseout', this._onMouseOut);
    window.removeEventListener('mousedown', this._onMouseDown);
    window.removeEventListener('mouseup', this._onMouseUp);
    window.removeEventListener('resize', this._onResize);

    if (this.dot && this.dot.parentNode) this.dot.remove();
    if (this.canvas && this.canvas.parentNode) this.canvas.remove();
  }
}

export default NeedleCursor;
