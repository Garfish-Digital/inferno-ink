import { gsap } from 'gsap';
import * as THREE from 'three';

class MagicalCursorController {
  constructor() {
    this.mouse = { x: 0, y: 0, prevX: 0, prevY: 0 };
    this.velocity = { x: 0, y: 0 };
    this.isMoving = false;
    this.isHovering = false;
    this.isClicking = false;
    
    // Elements
    this.wandElement = null;
    this.burningBallElement = null;
    this.auraElement = null;
    this.sparkleCanvas = null;
    this.emberCanvas = null;
    
    // Canvas contexts
    this.sparkleCtx = null;
    this.emberCtx = null;
    
    // Particle systems
    this.sparkles = [];
    this.embers = [];
    this.magicTrail = [];
    
    // Three.js setup for 3D sparkles
    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.sparkleGeometry = null;
    this.sparkleParticles = [];
    
    // Animation properties
    this.maxSparkles = 50;
    this.maxEmbers = 30;
    this.maxTrailPoints = 20;
    
    this.init();
  }

  init() {
    // Ensure proper viewport dimensions before setup
    this.waitForStableViewport().then(() => {
      this.setupElements();
      this.setupCanvases();
      this.setupThreeJS();
      this.bindEvents();
      this.startAnimation();
      
      // GSAP timeline for continuous magical effects
      this.createMagicalTimeline();
    });
  }

  waitForStableViewport() {
    return new Promise((resolve) => {
      let resizeTimer;
      const checkStability = () => {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(() => {
          // Wait for one more frame to ensure dimensions are final
          requestAnimationFrame(resolve);
        }, 100);
      };
      
      // Initial check
      checkStability();
      
      // Also listen for any last-minute resize events
      const onResize = () => checkStability();
      window.addEventListener('resize', onResize, { once: true });
      
      // Cleanup after resolve
      setTimeout(() => {
        window.removeEventListener('resize', onResize);
      }, 1000);
    });
  }

  setupElements() {
    this.wandElement = document.getElementById('cursor-wand');
    this.burningBallElement = document.getElementById('cursor-burning-ball');
    this.auraElement = document.getElementById('cursor-aura');
    this.sparkleCanvas = document.getElementById('sparkle-canvas');
    this.emberCanvas = document.getElementById('ember-canvas');
    
    if (!this.wandElement && !this.burningBallElement) {
      console.error('Magical cursor elements not found');
      return;
    }
    
    // Set canvas sizes
    this.resizeCanvases();
    window.addEventListener('resize', () => this.resizeCanvases());
  }

  setupCanvases() {
    if (this.sparkleCanvas) {
      this.sparkleCtx = this.sparkleCanvas.getContext('2d');
    }
    if (this.emberCanvas) {
      this.emberCtx = this.emberCanvas.getContext('2d');
    }
  }

  setupThreeJS() {
    // Create Three.js scene for 3D sparkle effects
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    
    this.renderer = new THREE.WebGLRenderer({ 
      alpha: true, 
      antialias: true,
      premultipliedAlpha: false
    });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setClearColor(0x000000, 0);
    this.renderer.domElement.style.position = 'fixed';
    this.renderer.domElement.style.top = '0';
    this.renderer.domElement.style.left = '0';
    this.renderer.domElement.style.pointerEvents = 'none';
    this.renderer.domElement.style.zIndex = '9998';
    this.renderer.domElement.style.mixBlendMode = 'screen';
    
    document.body.appendChild(this.renderer.domElement);
    
    this.camera.position.z = 5;
    
    // Create sparkle geometry
    this.sparkleGeometry = new THREE.BufferGeometry();
    const sparklePositions = new Float32Array(this.maxSparkles * 3);
    const sparkleColors = new Float32Array(this.maxSparkles * 3);
    const sparkleSizes = new Float32Array(this.maxSparkles);
    
    for (let i = 0; i < this.maxSparkles; i++) {
      sparklePositions[i * 3] = 0;
      sparklePositions[i * 3 + 1] = 0;
      sparklePositions[i * 3 + 2] = 0;
      
      sparkleColors[i * 3] = 1; // R
      sparkleColors[i * 3 + 1] = 0.4; // G
      sparkleColors[i * 3 + 2] = 0.1; // B
      
      sparkleSizes[i] = Math.random() * 20 + 10;
    }
    
    this.sparkleGeometry.setAttribute('position', new THREE.BufferAttribute(sparklePositions, 3));
    this.sparkleGeometry.setAttribute('color', new THREE.BufferAttribute(sparkleColors, 3));
    this.sparkleGeometry.setAttribute('size', new THREE.BufferAttribute(sparkleSizes, 1));
    
    // Sparkle material with custom shader
    const sparkleMaterial = new THREE.ShaderMaterial({
      uniforms: {
        time: { value: 0 },
        pixelRatio: { value: window.devicePixelRatio }
      },
      vertexShader: `
        attribute float size;
        attribute vec3 color;
        varying vec3 vColor;
        varying float vAlpha;
        uniform float time;
        
        void main() {
          vColor = color;
          
          vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
          
          float distance = length(mvPosition.xyz);
          vAlpha = 1.0 / (1.0 + distance * 0.1);
          vAlpha *= (sin(time * 3.0 + position.x * 10.0) * 0.5 + 0.5);
          
          gl_PointSize = size * (300.0 / -mvPosition.z);
          gl_Position = projectionMatrix * mvPosition;
        }
      `,
      fragmentShader: `
        varying vec3 vColor;
        varying float vAlpha;
        
        void main() {
          vec2 center = gl_PointCoord - vec2(0.5);
          float dist = length(center);
          
          if (dist > 0.5) discard;
          
          float alpha = (1.0 - dist * 2.0) * vAlpha;
          alpha *= pow(1.0 - dist * 2.0, 2.0);
          
          gl_FragColor = vec4(vColor, alpha);
        }
      `,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });
    
    this.sparklePoints = new THREE.Points(this.sparkleGeometry, sparkleMaterial);
    this.scene.add(this.sparklePoints);
    
    // Initialize sparkle particles
    for (let i = 0; i < this.maxSparkles; i++) {
      this.sparkleParticles.push({
        x: 0, y: 0, z: 0,
        vx: 0, vy: 0, vz: 0,
        life: 0,
        maxLife: Math.random() * 2 + 1,
        size: Math.random() * 20 + 10,
        color: {
          r: 1,
          g: Math.random() * 0.5 + 0.4,
          b: Math.random() * 0.3 + 0.1
        }
      });
    }
  }

  resizeCanvases() {
    // Ensure we have valid dimensions
    let width = window.innerWidth;
    let height = window.innerHeight;
    
    // Fallback to document dimensions if window dimensions are zero
    if (width === 0 || height === 0) {
      width = document.documentElement.clientWidth || 1280;
      height = document.documentElement.clientHeight || 720;
    }
    
    // Minimum dimensions to prevent canvas errors
    width = Math.max(width, 320);
    height = Math.max(height, 240);
    
    if (this.sparkleCanvas) {
      this.sparkleCanvas.width = width;
      this.sparkleCanvas.height = height;
      this.sparkleCanvas.style.width = width + 'px';
      this.sparkleCanvas.style.height = height + 'px';
    }
    
    if (this.emberCanvas) {
      this.emberCanvas.width = width;
      this.emberCanvas.height = height;
      this.emberCanvas.style.width = width + 'px';
      this.emberCanvas.style.height = height + 'px';
    }
    
    if (this.renderer && this.camera) {
      this.renderer.setSize(width, height);
      this.camera.aspect = width / height;
      this.camera.updateProjectionMatrix();
    }
  }

  bindEvents() {
    document.addEventListener('mousemove', (e) => this.onMouseMove(e));
    document.addEventListener('mousedown', () => this.onMouseDown());
    document.addEventListener('mouseup', () => this.onMouseUp());
    document.addEventListener('mouseenter', () => this.onMouseEnter());
    document.addEventListener('mouseleave', () => this.onMouseLeave());
    
    // Hover detection for interactive elements
    const interactiveElements = document.querySelectorAll('a, button, [role="button"], input, select, textarea');
    interactiveElements.forEach(element => {
      element.addEventListener('mouseenter', () => this.onHoverStart());
      element.addEventListener('mouseleave', () => this.onHoverEnd());
    });
  }

  onMouseMove(e) {
    this.mouse.prevX = this.mouse.x;
    this.mouse.prevY = this.mouse.y;
    this.mouse.x = e.clientX;
    this.mouse.y = e.clientY;
    
    // Calculate velocity
    this.velocity.x = this.mouse.x - this.mouse.prevX;
    this.velocity.y = this.mouse.y - this.mouse.prevY;
    
    this.isMoving = Math.abs(this.velocity.x) > 1 || Math.abs(this.velocity.y) > 1;
    
    this.updateWandPosition();
    this.createTrailPoint();
    
    if (this.isMoving) {
      this.createSparkle();
      this.createEmber();
    }
  }

  onMouseDown() {
    this.isClicking = true;
    this.createClickExplosion();
    
    // Intense wand glow animation
    if (this.wandElement) {
      gsap.to(this.wandElement.querySelector('.wand-tip'), {
        scale: 1.8,
        duration: 0.2,
        ease: "back.out(1.7)"
      });
    }
    
    // Intense burning ball glow animation
    if (this.burningBallElement) {
      gsap.to(this.burningBallElement.querySelector('.ball-core'), {
        scale: 1.6,
        duration: 0.2,
        ease: "back.out(1.7)"
      });
    }
  }

  onMouseUp() {
    this.isClicking = false;
    
    if (this.wandElement) {
      gsap.to(this.wandElement.querySelector('.wand-tip'), {
        scale: 1,
        duration: 0.3,
        ease: "back.out(1.7)"
      });
    }
    
    if (this.burningBallElement) {
      gsap.to(this.burningBallElement.querySelector('.ball-core'), {
        scale: 1,
        duration: 0.3,
        ease: "back.out(1.7)"
      });
    }
  }

  onMouseEnter() {
    gsap.to('#magical-cursor-container', {
      opacity: 1,
      duration: 0.3
    });
  }

  onMouseLeave() {
    gsap.to('#magical-cursor-container', {
      opacity: 0,
      duration: 0.3
    });
  }

  onHoverStart() {
    this.isHovering = true;
    
    // Enhanced hover effects
    if (this.wandElement) {
      gsap.to(this.wandElement, {
        scale: 1.2,
        duration: 0.3,
        ease: "back.out(1.7)"
      });
    }
    
    if (this.burningBallElement) {
      gsap.to(this.burningBallElement, {
        scale: 1.3,
        duration: 0.3,
        ease: "back.out(1.7)"
      });
    }
    
    gsap.to(this.auraElement, {
      scale: 1.5,
      duration: 0.3,
      ease: "power2.out"
    });
  }

  onHoverEnd() {
    this.isHovering = false;
    
    if (this.wandElement) {
      gsap.to(this.wandElement, {
        scale: 1,
        duration: 0.3,
        ease: "back.out(1.7)"
      });
    }
    
    if (this.burningBallElement) {
      gsap.to(this.burningBallElement, {
        scale: 1,
        duration: 0.3,
        ease: "back.out(1.7)"
      });
    }
    
    gsap.to(this.auraElement, {
      scale: 1,
      duration: 0.3,
      ease: "power2.out"
    });
  }

  updateWandPosition() {
    if (!this.auraElement) return;
    
    // Handle wand positioning if wand exists
    if (this.wandElement) {
      // Calculate wand rotation based on movement
      const angle = Math.atan2(this.velocity.y, this.velocity.x);
      
      // Smooth wand movement with GSAP
      gsap.to(this.wandElement, {
        x: this.mouse.x - 20,
        y: this.mouse.y - 4,
        rotation: angle * (180 / Math.PI),
        duration: 0.1,
        ease: "power2.out"
      });
    }
    
    // Handle burning ball positioning if burning ball exists
    if (this.burningBallElement) {
      // Smooth burning ball movement with GSAP
      gsap.to(this.burningBallElement, {
        x: this.mouse.x - 12,
        y: this.mouse.y - 12,
        duration: 0.15,
        ease: "power2.out"
      });
    }
    
    gsap.to(this.auraElement, {
      x: this.mouse.x - 40,
      y: this.mouse.y - 40,
      duration: 0.2,
      ease: "power2.out"
    });
  }

  createSparkle() {
    // Create 2D canvas sparkles
    const sparkle = {
      x: this.mouse.x + (Math.random() - 0.5) * 20,
      y: this.mouse.y + (Math.random() - 0.5) * 20,
      vx: (Math.random() - 0.5) * 4,
      vy: (Math.random() - 0.5) * 4,
      life: 1,
      decay: Math.random() * 0.02 + 0.01,
      size: Math.random() * 8 + 2,
      color: {
        r: 255,
        g: Math.random() * 100 + 100,
        b: Math.random() * 50 + 20
      },
      rotation: Math.random() * Math.PI * 2,
      rotationSpeed: (Math.random() - 0.5) * 0.2
    };
    
    this.sparkles.push(sparkle);
    
    // Create 3D sparkle particle
    const sparkleIndex = this.sparkleParticles.findIndex(p => p.life <= 0);
    if (sparkleIndex !== -1) {
      const particle = this.sparkleParticles[sparkleIndex];
      
      // Convert screen coordinates to world coordinates
      const x = (this.mouse.x / window.innerWidth) * 2 - 1;
      const y = -(this.mouse.y / window.innerHeight) * 2 + 1;
      
      particle.x = x * 3;
      particle.y = y * 3;
      particle.z = (Math.random() - 0.5) * 2;
      particle.vx = (Math.random() - 0.5) * 0.02;
      particle.vy = (Math.random() - 0.5) * 0.02;
      particle.vz = (Math.random() - 0.5) * 0.02;
      particle.life = particle.maxLife;
      particle.size = Math.random() * 20 + 10;
      particle.color.r = 1;
      particle.color.g = Math.random() * 0.5 + 0.4;
      particle.color.b = Math.random() * 0.3 + 0.1;
    }
  }

  createEmber() {
    const ember = {
      x: this.mouse.x + (Math.random() - 0.5) * 30,
      y: this.mouse.y + (Math.random() - 0.5) * 30,
      vx: (Math.random() - 0.5) * 2,
      vy: Math.random() * -2 - 1,
      life: 1,
      decay: Math.random() * 0.015 + 0.005,
      size: Math.random() * 6 + 3,
      color: {
        r: 255,
        g: Math.random() * 80 + 60,
        b: Math.random() * 30
      },
      flicker: Math.random() * Math.PI * 2
    };
    
    this.embers.push(ember);
  }

  createTrailPoint() {
    const trailPoint = {
      x: this.mouse.x,
      y: this.mouse.y,
      life: 1,
      decay: 0.05
    };
    
    this.magicTrail.push(trailPoint);
    
    if (this.magicTrail.length > this.maxTrailPoints) {
      this.magicTrail.shift();
    }
  }

  createClickExplosion() {
    // Create burst of sparkles on click
    for (let i = 0; i < 20; i++) {
      const angle = (i / 20) * Math.PI * 2;
      const speed = Math.random() * 6 + 3;
      
      const sparkle = {
        x: this.mouse.x,
        y: this.mouse.y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 1,
        decay: Math.random() * 0.02 + 0.015,
        size: Math.random() * 12 + 4,
        color: {
          r: 255,
          g: Math.random() * 150 + 100,
          b: Math.random() * 80 + 40
        },
        rotation: Math.random() * Math.PI * 2,
        rotationSpeed: (Math.random() - 0.5) * 0.3
      };
      
      this.sparkles.push(sparkle);
    }
    
    // Create ember explosion
    for (let i = 0; i < 15; i++) {
      const angle = (i / 15) * Math.PI * 2;
      const speed = Math.random() * 4 + 2;
      
      const ember = {
        x: this.mouse.x,
        y: this.mouse.y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 1,
        decay: Math.random() * 0.02 + 0.01,
        size: Math.random() * 8 + 4,
        color: {
          r: 255,
          g: Math.random() * 100 + 80,
          b: Math.random() * 50
        },
        flicker: Math.random() * Math.PI * 2
      };
      
      this.embers.push(ember);
    }
  }

  createMagicalTimeline() {
    // Continuous magical effects timeline
    const tl = gsap.timeline({ repeat: -1, yoyo: true });
    
    tl.to(this.wandElement?.querySelector('.wand-tip'), {
      filter: 'brightness(1.5) saturate(1.3)',
      duration: 2,
      ease: "sine.inOut"
    })
    .to(this.auraElement, {
      opacity: 0.8,
      scale: 1.1,
      duration: 2,
      ease: "sine.inOut"
    }, 0);
  }

  updateParticles() {
    // Update 2D sparkles
    for (let i = this.sparkles.length - 1; i >= 0; i--) {
      const sparkle = this.sparkles[i];
      
      sparkle.x += sparkle.vx;
      sparkle.y += sparkle.vy;
      sparkle.life -= sparkle.decay;
      sparkle.rotation += sparkle.rotationSpeed;
      sparkle.vy += 0.1; // gravity
      sparkle.vx *= 0.99; // air resistance
      
      if (sparkle.life <= 0) {
        this.sparkles.splice(i, 1);
      }
    }
    
    // Update embers
    for (let i = this.embers.length - 1; i >= 0; i--) {
      const ember = this.embers[i];
      
      ember.x += ember.vx;
      ember.y += ember.vy;
      ember.life -= ember.decay;
      ember.flicker += 0.3;
      ember.vy += 0.05; // gravity
      ember.vx *= 0.98; // air resistance
      
      if (ember.life <= 0) {
        this.embers.splice(i, 1);
      }
    }
    
    // Update trail points
    for (let i = this.magicTrail.length - 1; i >= 0; i--) {
      const point = this.magicTrail[i];
      point.life -= point.decay;
      
      if (point.life <= 0) {
        this.magicTrail.splice(i, 1);
      }
    }
    
    // Update 3D sparkles
    const positions = this.sparkleGeometry.attributes.position.array;
    const colors = this.sparkleGeometry.attributes.color.array;
    const sizes = this.sparkleGeometry.attributes.size.array;
    
    for (let i = 0; i < this.sparkleParticles.length; i++) {
      const particle = this.sparkleParticles[i];
      
      if (particle.life > 0) {
        particle.x += particle.vx;
        particle.y += particle.vy;
        particle.z += particle.vz;
        particle.life -= 0.02;
        
        const alpha = particle.life / particle.maxLife;
        
        positions[i * 3] = particle.x;
        positions[i * 3 + 1] = particle.y;
        positions[i * 3 + 2] = particle.z;
        
        colors[i * 3] = particle.color.r;
        colors[i * 3 + 1] = particle.color.g * alpha;
        colors[i * 3 + 2] = particle.color.b * alpha;
        
        sizes[i] = particle.size * alpha;
      } else {
        positions[i * 3] = 0;
        positions[i * 3 + 1] = 0;
        positions[i * 3 + 2] = 0;
        colors[i * 3] = 0;
        colors[i * 3 + 1] = 0;
        colors[i * 3 + 2] = 0;
        sizes[i] = 0;
      }
    }
    
    this.sparkleGeometry.attributes.position.needsUpdate = true;
    this.sparkleGeometry.attributes.color.needsUpdate = true;
    this.sparkleGeometry.attributes.size.needsUpdate = true;
  }

  render() {
    // Clear canvases
    if (this.sparkleCtx) {
      this.sparkleCtx.clearRect(0, 0, this.sparkleCanvas.width, this.sparkleCanvas.height);
    }
    if (this.emberCtx) {
      this.emberCtx.clearRect(0, 0, this.emberCanvas.width, this.emberCanvas.height);
    }
    
    // Render magic trail
    if (this.sparkleCtx && this.magicTrail.length > 1) {
      this.sparkleCtx.save();
      this.sparkleCtx.globalCompositeOperation = 'lighter';
      
      for (let i = 1; i < this.magicTrail.length; i++) {
        const point = this.magicTrail[i];
        const prevPoint = this.magicTrail[i - 1];
        const alpha = point.life * 0.3;
        
        const gradient = this.sparkleCtx.createLinearGradient(
          prevPoint.x, prevPoint.y, point.x, point.y
        );
        gradient.addColorStop(0, `rgba(255, 180, 50, ${alpha})`);
        gradient.addColorStop(1, `rgba(255, 100, 20, ${alpha * 0.5})`);
        
        this.sparkleCtx.strokeStyle = gradient;
        this.sparkleCtx.lineWidth = 3 * point.life;
        this.sparkleCtx.lineCap = 'round';
        
        this.sparkleCtx.beginPath();
        this.sparkleCtx.moveTo(prevPoint.x, prevPoint.y);
        this.sparkleCtx.lineTo(point.x, point.y);
        this.sparkleCtx.stroke();
      }
      
      this.sparkleCtx.restore();
    }
    
    // Render 2D sparkles
    if (this.sparkleCtx) {
      this.sparkleCtx.save();
      this.sparkleCtx.globalCompositeOperation = 'lighter';
      
      this.sparkles.forEach(sparkle => {
        const alpha = sparkle.life;
        this.sparkleCtx.save();
        this.sparkleCtx.translate(sparkle.x, sparkle.y);
        this.sparkleCtx.rotate(sparkle.rotation);
        
        // Create sparkle gradient
        const gradient = this.sparkleCtx.createRadialGradient(0, 0, 0, 0, 0, sparkle.size);
        gradient.addColorStop(0, `rgba(${sparkle.color.r}, ${sparkle.color.g}, ${sparkle.color.b}, ${alpha})`);
        gradient.addColorStop(0.5, `rgba(${sparkle.color.r}, ${sparkle.color.g}, ${sparkle.color.b}, ${alpha * 0.5})`);
        gradient.addColorStop(1, `rgba(${sparkle.color.r}, ${sparkle.color.g}, ${sparkle.color.b}, 0)`);
        
        this.sparkleCtx.fillStyle = gradient;
        
        // Draw star shape
        this.sparkleCtx.beginPath();
        for (let i = 0; i < 8; i++) {
          const angle = (i / 8) * Math.PI * 2;
          const radius = i % 2 === 0 ? sparkle.size : sparkle.size * 0.4;
          const x = Math.cos(angle) * radius;
          const y = Math.sin(angle) * radius;
          
          if (i === 0) {
            this.sparkleCtx.moveTo(x, y);
          } else {
            this.sparkleCtx.lineTo(x, y);
          }
        }
        this.sparkleCtx.closePath();
        this.sparkleCtx.fill();
        
        this.sparkleCtx.restore();
      });
      
      this.sparkleCtx.restore();
    }
    
    // Render embers
    if (this.emberCtx) {
      this.emberCtx.save();
      this.emberCtx.globalCompositeOperation = 'lighter';
      
      this.embers.forEach(ember => {
        const alpha = ember.life;
        const flicker = Math.sin(ember.flicker) * 0.3 + 0.7;
        
        const gradient = this.emberCtx.createRadialGradient(
          ember.x, ember.y, 0,
          ember.x, ember.y, ember.size
        );
        gradient.addColorStop(0, `rgba(${ember.color.r}, ${ember.color.g}, ${ember.color.b}, ${alpha * flicker})`);
        gradient.addColorStop(0.6, `rgba(${ember.color.r}, ${ember.color.g * 0.7}, ${ember.color.b * 0.5}, ${alpha * 0.5 * flicker})`);
        gradient.addColorStop(1, `rgba(${ember.color.r * 0.5}, ${ember.color.g * 0.3}, 0, 0)`);
        
        this.emberCtx.fillStyle = gradient;
        this.emberCtx.beginPath();
        this.emberCtx.arc(ember.x, ember.y, ember.size, 0, Math.PI * 2);
        this.emberCtx.fill();
      });
      
      this.emberCtx.restore();
    }
    
    // Render Three.js scene
    if (this.renderer && this.scene && this.camera) {
      // Update shader time uniform
      if (this.sparklePoints.material.uniforms) {
        this.sparklePoints.material.uniforms.time.value = Date.now() * 0.001;
      }
      
      this.renderer.render(this.scene, this.camera);
    }
  }

  startAnimation() {
    const animate = () => {
      this.updateParticles();
      this.render();
      requestAnimationFrame(animate);
    };
    
    animate();
  }

  destroy() {
    // Cleanup
    if (this.renderer) {
      document.body.removeChild(this.renderer.domElement);
      this.renderer.dispose();
    }
    
    // Remove event listeners
    document.removeEventListener('mousemove', this.onMouseMove);
    document.removeEventListener('mousedown', this.onMouseDown);
    document.removeEventListener('mouseup', this.onMouseUp);
  }
}

export default MagicalCursorController;