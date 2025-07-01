class ParticleSystem {
  constructor(canvas, options = {}) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.particles = [];
    this.maxParticles = options.maxParticles || 50;
    this.colors = ['#FF4444', '#FF6B35', '#FFD23F', '#FF8C42'];
    
    this.resize();
    this.init();
  }

  resize() {
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
  }

  init() {
    for (let i = 0; i < this.maxParticles; i++) {
      this.particles.push(this.createParticle());
    }
  }

  createParticle() {
    return {
      x: Math.random() * this.canvas.width,
      y: this.canvas.height + 10,
      vx: (Math.random() - 0.5) * 2,
      vy: -Math.random() * 3 - 1,
      size: Math.random() * 4 + 2,
      life: 1,
      decay: Math.random() * 0.02 + 0.005,
      color: this.colors[Math.floor(Math.random() * this.colors.length)],
      glow: Math.random() * 10 + 5
    };
  }

  update() {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const particle = this.particles[i];
      
      particle.x += particle.vx;
      particle.y += particle.vy;
      particle.life -= particle.decay;
      particle.vy *= 0.98;
      particle.vx *= 0.98;
      
      if (particle.life <= 0) {
        this.particles.splice(i, 1);
        this.particles.push(this.createParticle());
      }
    }
  }

  draw() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    
    for (const particle of this.particles) {
      const alpha = particle.life;
      
      this.ctx.save();
      this.ctx.globalAlpha = alpha;
      this.ctx.shadowBlur = particle.glow;
      this.ctx.shadowColor = particle.color;
      this.ctx.fillStyle = particle.color;
      
      this.ctx.beginPath();
      this.ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
      this.ctx.fill();
      this.ctx.restore();
    }
  }

  animate() {
    this.update();
    this.draw();
    requestAnimationFrame(() => this.animate());
  }
}

export default ParticleSystem;