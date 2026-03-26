import * as THREE from 'three';

class HellFloor {
  constructor() {
    this.canvas = document.getElementById('hell-canvas');
    if (!this.canvas) return;

    this.isReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    this.isVisible = false;
    this.raf = null;
    this.clock = new THREE.Clock(false);

    // Ember cluster spawning
    this.embers = [];
    this.nextSpawnTime = this.randomSpawnDelay();
    this.timeSinceLastSpawn = 0;
    this.hasSpawnedOnce = false;

    // Glow pulse state — layered irregular oscillation
    this.glowPhases = [
      { freq: 0.3, amp: 0.12, offset: 0 },
      { freq: 0.7, amp: 0.08, offset: 1.7 },
      { freq: 1.3, amp: 0.05, offset: 3.2 },
    ];

    this.initRenderer();
    this.initScene();
    this.initGlowPlane();
    this.initEmberGeometry();
    this.initVisibilityObserver();
    this.initResize();
  }

  // ── Renderer ──────────────────────────────────────────────────────────────

  initRenderer() {
    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      antialias: false,
      powerPreference: 'high-performance',
      alpha: true
    });
    this.renderer.setClearColor(0x000000, 0);
    this.updateSize();
  }

  updateSize() {
    const section = this.canvas.parentElement;
    const rect = section.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio, 2);
    this.renderer.setSize(rect.width, rect.height);
    this.renderer.setPixelRatio(dpr);
    this.width = rect.width;
    this.height = rect.height;

    if (this.camera) {
      this.camera.left = -rect.width / 2;
      this.camera.right = rect.width / 2;
      this.camera.top = rect.height / 2;
      this.camera.bottom = -rect.height / 2;
      this.camera.updateProjectionMatrix();
    }
  }

  // ── Scene & Camera ────────────────────────────────────────────────────────

  initScene() {
    this.scene = new THREE.Scene();

    const w = this.width || 800;
    const h = this.height || 600;
    this.camera = new THREE.OrthographicCamera(
      -w / 2, w / 2, h / 2, -h / 2, 0.1, 100
    );
    this.camera.position.z = 10;
  }

  // ── Ambient Glow Plane ────────────────────────────────────────────────────

  initGlowPlane() {
    const geometry = new THREE.PlaneGeometry(2, 2);

    this.glowMaterial = new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      uniforms: {
        uTime: { value: 0 },
        uIntensity: { value: 0.0 },
        uResolution: { value: new THREE.Vector2(this.width, this.height) }
      },
      vertexShader: `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = vec4(position.xy, 0.0, 1.0);
        }
      `,
      fragmentShader: `
        uniform float uTime;
        uniform float uIntensity;
        uniform vec2 uResolution;
        varying vec2 vUv;

        void main() {
          float y = vUv.y;
          float glowMask = smoothstep(0.38, 0.0, y);

          float xCenter = abs(vUv.x - 0.5) * 2.0;
          float xFalloff = 1.0 - smoothstep(0.0, 1.0, xCenter * xCenter);

          float glow = glowMask * xFalloff * uIntensity;

          vec3 deepColor = vec3(0.545, 0.0, 0.0);
          vec3 coreColor = vec3(0.8, 0.133, 0.0);
          vec3 color = mix(deepColor, coreColor, glow * 0.6);

          gl_FragColor = vec4(color, glow * 0.45);
        }
      `
    });

    const glowMesh = new THREE.Mesh(geometry, this.glowMaterial);
    glowMesh.frustumCulled = false;
    glowMesh.renderOrder = 0;
    this.scene.add(glowMesh);
  }

  // ── Ember System ──────────────────────────────────────────────────────────

  initEmberGeometry() {
    this.maxEmbers = 86;
    const positions = new Float32Array(this.maxEmbers * 3);
    const colors = new Float32Array(this.maxEmbers * 3);
    const sizes = new Float32Array(this.maxEmbers);
    const alphas = new Float32Array(this.maxEmbers);
    const angles = new Float32Array(this.maxEmbers);

    this.emberGeometry = new THREE.BufferGeometry();
    this.emberGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    this.emberGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    this.emberGeometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
    this.emberGeometry.setAttribute('alpha', new THREE.BufferAttribute(alphas, 1));
    this.emberGeometry.setAttribute('angle', new THREE.BufferAttribute(angles, 1));

    const material = new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      vertexColors: true,
      uniforms: {
        uPixelRatio: { value: Math.min(window.devicePixelRatio, 2) }
      },
      vertexShader: `
        attribute float size;
        attribute float alpha;
        attribute float angle;

        varying vec3 vColor;
        varying float vAlpha;
        varying float vAngle;

        uniform float uPixelRatio;

        void main() {
          vColor = color;
          vAlpha = alpha;
          vAngle = angle;

          vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
          // Size is the long axis — the point needs to be large enough
          // for the elongated shape to fit inside the square point sprite
          gl_PointSize = size * uPixelRatio;
          gl_Position = projectionMatrix * mvPosition;
        }
      `,
      fragmentShader: `
        varying vec3 vColor;
        varying float vAlpha;
        varying float vAngle;

        void main() {
          // Center the point coord: (0,0) = center of the point sprite
          vec2 p = gl_PointCoord - vec2(0.5);

          // Rotate into the ember's local frame (aligned to travel direction)
          float c = cos(vAngle);
          float s = sin(vAngle);
          vec2 r = vec2(
            p.x * c - p.y * s,
            p.x * s + p.y * c
          );

          // Ember shape: tapered sliver
          // Long axis (r.y after rotation) has full extent
          // Short axis (r.x) is narrow — aspect ratio ~3.5:1
          float aspectRatio = 3.5;
          float rx = r.x * aspectRatio;
          float ry = r.y;

          // Taper: the ember is wider at the base (negative ry)
          // and narrows toward the tip (positive ry)
          // This maps ry from [-0.5, 0.5] to a width multiplier [1.0, 0.3]
          float taper = mix(0.5, 0.3, smoothstep(-0.35, 0.45, ry));
          rx *= taper;

          // Distance from the tapered centerline
          float d = length(vec2(rx, ry));

          // Discard outside the shape boundary
          if (d > 0.48) discard;

          // Soft glow falloff — bright core, soft edges
          float core = 1.0 - smoothstep(0.0, 0.27, d);
          float outer = 1.0 - smoothstep(0.1, 0.48, d);
          float shape = core * 0.6 + outer * 0.4;

          // Slight brightness boost at the hot tip (base of the ember)
          float tipHeat = smoothstep(0.1, -0.35, ry) * 0.3;

          float finalAlpha = (shape + tipHeat) * vAlpha;

          gl_FragColor = vec4(vColor, finalAlpha);
        }
      `
    });

    this.emberGeometry.setDrawRange(0, this.maxEmbers);
    this.emberPoints = new THREE.Points(this.emberGeometry, material);
    this.emberPoints.renderOrder = 1;
    this.scene.add(this.emberPoints);
  }

  randomSpawnDelay() {
    // Seconds between clusters
    return 1 + Math.random() * 4;
    // return 4 + Math.random() * 4;
  }

  spawnCluster() {
    //Cluster size
    const count = 1 + Math.floor(Math.random() * 6);
    const clusterX = (Math.random() - 0.5) * this.width * 0.7;
    const halfH = this.height / 2;

    for (let i = 0; i < count; i++) {
      if (this.embers.length >= this.maxEmbers) break;

      const spread = 30 + Math.random() * 40;
      // Initial lateral velocity — slight random drift
      const vx0 = (Math.random() - 0.5) * 8;

      this.embers.push({
        x: clusterX + (Math.random() - 0.5) * spread,
        y: -halfH,
        vx: vx0,
        vy: 15 + Math.random() * 35,
        wobblePhase: Math.random() * Math.PI * 2,
        wobbleFreq: 1.5 + Math.random() * 2,
        wobbleAmp: 4 + Math.random() * 15,
        life: 0,
        maxLife: 2.5 + Math.random() * 6,
        size: 4 + Math.random() * 24,
        // Smoothed angle for visual continuity
        angle: Math.PI / 2,
        angleSmooth: 0.08 + Math.random() * 0.04,
        // Color variant: 0 = glow→deep, 1 = flame→mid
        colorVariant: Math.random() < 0.5 ? 0 : 1,
      });
    }
  }

  updateEmbers(dt) {
    const halfH = this.height / 2;
    const elapsed = this.clock.getElapsedTime();
    const positions = this.emberGeometry.attributes.position.array;
    const colors = this.emberGeometry.attributes.color.array;
    const sizes = this.emberGeometry.attributes.size.array;
    const alphas = this.emberGeometry.attributes.alpha.array;
    const anglesAttr = this.emberGeometry.attributes.angle.array;

    // Variant 0: $heat-glow (#FF9A5C) → $heat-deep (#8B0000)
    // Variant 1: $heat-flame (#FFF200) → $heat-mid (#E84A1A)
    const birthColors = [
      { r: 1.0, g: 0.6, b: 0.36 },    // $heat-glow
      { r: 1.0, g: 0.949, b: 0.0 },    // $heat-flame
    ];
    const deathColors = [
      { r: 0.545, g: 0.0, b: 0.0 },    // $heat-deep
      { r: 0.91, g: 0.29, b: 0.1 },    // $heat-mid
    ];

    for (let i = this.embers.length - 1; i >= 0; i--) {
      const e = this.embers[i];
      e.life += dt;

      if (e.life >= e.maxLife) {
        this.embers.splice(i, 1);
        continue;
      }

      // Lateral wobble as a velocity component
      const wobbleForce = Math.sin(elapsed * e.wobbleFreq + e.wobblePhase) * e.wobbleAmp;
      e.vx += wobbleForce * dt;
      // Dampen lateral velocity to keep wobble organic, not runaway
      e.vx *= 0.97;

      // Apply velocity
      e.x += e.vx * dt;
      e.y += e.vy * dt;

      // Compute the instantaneous travel angle from velocity
      const targetAngle = Math.atan2(e.vy, e.vx);
      // Smooth the angle so it doesn't snap — lerp toward target
      const angleDiff = targetAngle - e.angle;
      // Normalize to [-PI, PI] to avoid wrapping artifacts
      const wrapped = Math.atan2(Math.sin(angleDiff), Math.cos(angleDiff));
      e.angle += wrapped * e.angleSmooth;

      //Kill boundary
      if (e.y > halfH * 0.6) {
        this.embers.splice(i, 1);
      }
    }

    // Write to GPU buffers
    for (let i = 0; i < this.maxEmbers; i++) {
      const i3 = i * 3;
      if (i < this.embers.length) {
        const e = this.embers[i];
        const t = e.life / e.maxLife;

        positions[i3] = e.x;
        positions[i3 + 1] = e.y;
        positions[i3 + 2] = 0;

        // Color: birth → death, per-ember variant
        const birth = birthColors[e.colorVariant];
        const death = deathColors[e.colorVariant];
        const colorT = 1 - t;
        colors[i3]     = death.r + (birth.r - death.r) * colorT;
        colors[i3 + 1] = death.g + (birth.g - death.g) * colorT;
        colors[i3 + 2] = death.b + (birth.b - death.b) * colorT;

        // Shrink as they age — embers burn down
        sizes[i] = e.size * (1.0 - t * 0.4);

        // Fade: quick ramp in, sustain, then dissolve in the final 40%
        let alpha;
        if (t < 0.08) {
          alpha = t / 0.08;
        } else if (t < 0.6) {
          alpha = 1.0;
        } else {
          alpha = 1.0 - ((t - 0.6) / 0.4);
        }
        alphas[i] = alpha * 0.95;

        // Angle: offset by -PI/2 so the shader's "up" aligns with
        // the travel direction (gl_PointCoord.y = 0 is top of sprite)
        anglesAttr[i] = e.angle - Math.PI / 2;
      } else {
        positions[i3] = 0;
        positions[i3 + 1] = -10000;
        positions[i3 + 2] = 0;
        alphas[i] = 0;
        sizes[i] = 0;
        anglesAttr[i] = 0;
      }
    }

    this.emberGeometry.attributes.position.needsUpdate = true;
    this.emberGeometry.attributes.color.needsUpdate = true;
    this.emberGeometry.attributes.size.needsUpdate = true;
    this.emberGeometry.attributes.alpha.needsUpdate = true;
    this.emberGeometry.attributes.angle.needsUpdate = true;
  }

  // ── Render Loop ───────────────────────────────────────────────────────────

  animate() {
    if (!this.isVisible) return;

    const dt = this.clock.getDelta();
    const elapsed = this.clock.getElapsedTime();

    // Glow — layered irregular pulsing
    let glowIntensity = 0.55;
    for (const p of this.glowPhases) {
      glowIntensity += Math.sin(elapsed * p.freq + p.offset) * p.amp;
    }
    this.glowMaterial.uniforms.uTime.value = elapsed;
    this.glowMaterial.uniforms.uIntensity.value = Math.max(0, glowIntensity);

    // Embers
    if (!this.isReducedMotion) {
      this.timeSinceLastSpawn += dt;
      if (this.timeSinceLastSpawn >= this.nextSpawnTime) {
        this.spawnCluster();
        this.timeSinceLastSpawn = 0;
        this.nextSpawnTime = this.randomSpawnDelay();
      }
      this.updateEmbers(dt);
    }

    this.renderer.render(this.scene, this.camera);
    this.raf = requestAnimationFrame(() => this.animate());
  }

  // ── Visibility ────────────────────────────────────────────────────────────

  initVisibilityObserver() {
    this.observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          this.isVisible = true;
          this.clock.start();
          if (!this.hasSpawnedOnce && !this.isReducedMotion) {
            this.spawnCluster();
            this.hasSpawnedOnce = true;
            this.timeSinceLastSpawn = 0;
          }
          this.animate();
        } else {
          this.isVisible = false;
          this.clock.stop();
          if (this.raf) {
            cancelAnimationFrame(this.raf);
            this.raf = null;
          }
        }
      },
      { threshold: 0 }
    );
    this.observer.observe(this.canvas.parentElement);
  }

  // ── Resize ────────────────────────────────────────────────────────────────

  initResize() {
    this.resizeObserver = new ResizeObserver(() => {
      this.updateSize();
      if (this.glowMaterial) {
        this.glowMaterial.uniforms.uResolution.value.set(this.width, this.height);
      }
    });
    this.resizeObserver.observe(this.canvas.parentElement);
  }

  // ── Cleanup ───────────────────────────────────────────────────────────────

  destroy() {
    if (this.raf) cancelAnimationFrame(this.raf);
    if (this.observer) this.observer.disconnect();
    if (this.resizeObserver) this.resizeObserver.disconnect();
    if (this.emberGeometry) this.emberGeometry.dispose();
    if (this.emberPoints) this.emberPoints.material.dispose();
    if (this.glowMaterial) this.glowMaterial.dispose();
    if (this.renderer) this.renderer.dispose();
  }
}

export default HellFloor;
