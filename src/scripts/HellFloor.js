import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';

class HellFloor {
  constructor() {
    this.canvas = document.getElementById('hell-canvas');
    if (!this.canvas) return;

    this.isReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    this.isVisible = false;
    this.raf = null;
    this.clock = new THREE.Clock(false);
    this.useBloom = this.shouldUseBloom();

    // Ember cluster spawning
    this.embers = [];
    this.nextSpawnTime = this.randomSpawnDelay();
    this.timeSinceLastSpawn = 0;
    this.hasSpawnedOnce = false;

    // Log-shift event state — occasional hidden "the fire below shifted" moment.
    // Pulse runs through an attack-decay envelope so it rises into and falls out
    // of view rather than snapping on/off at the loop seam.
    this.pulseIntensity = 0;
    this.pulseTimer = -1;            // -1 = idle; >=0 = envelope progress in seconds
    this.pulseDuration = 4.5;        // total envelope length
    this.pulseAttack = 0.7;          // seconds to ramp up to peak
    this.timeSinceLastShift = 0;
    this.nextLogShiftTime = 18 + Math.random() * 12;

    // Glow pulse state — layered irregular oscillation. Periods range from ~7s
    // to ~30s so the glow breathes rather than pulses.
    this.glowPhases = [
      { freq: 0.13, amp: 0.10, offset: 0 },
      { freq: 0.27, amp: 0.06, offset: 1.7 },
      { freq: 0.52, amp: 0.04, offset: 3.2 },
    ];

    this.initRenderer();
    this.initScene();
    this.initGlowPlane();
    this.initEmberGeometry();
    if (this.useBloom) this.initBloom();
    this.initVisibilityObserver();
    this.initResize();
  }

  // ── Capability Probe ──────────────────────────────────────────────────────

  shouldUseBloom() {
    const isCoarsePointer = window.matchMedia('(pointer: coarse)').matches;
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) ||
                  (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    const isSmallViewport = window.innerWidth < 480;
    // Bloom on for desktop and recent iOS; off for small viewports and most Android touch
    return (!isCoarsePointer || isIOS) && !isSmallViewport;
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
    // Read the canvas's own bounding rect — the canvas may be larger than its
    // parent section due to bleed CSS (width: 110%, height: 100% + 15vh, etc).
    const rect = this.canvas.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio, 2);

    // Pass false as the third arg so renderer doesn't write inline width/height
    // onto the canvas element — that would override the bleed CSS.
    this.renderer.setSize(rect.width, rect.height, false);
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

    if (this.composer) {
      this.composer.setSize(rect.width, rect.height);
      this.composer.setPixelRatio(dpr);
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
        uPulseIntensity: { value: 0.0 },
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
        uniform float uPulseIntensity;
        uniform vec2 uResolution;
        varying vec2 vUv;

        // Hash + value noise + FBM — low-cost organic distortion
        float hash(vec2 p) {
          return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
        }

        float noise(vec2 p) {
          vec2 i = floor(p);
          vec2 f = fract(p);
          float a = hash(i);
          float b = hash(i + vec2(1.0, 0.0));
          float c = hash(i + vec2(0.0, 1.0));
          float d = hash(i + vec2(1.0, 1.0));
          vec2 u = f * f * (3.0 - 2.0 * f);
          return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
        }

        float fbm(vec2 p) {
          float v = 0.0;
          float a = 0.5;
          for (int i = 0; i < 4; i++) {
            v += a * noise(p);
            p = p * 2.0 + vec2(13.0, 7.0);
            a *= 0.5;
          }
          return v;
        }

        // Hidden hot point — reads as a molten pocket below the surface
        float hotSpot(vec2 uv, vec2 center, float radius, float pulse) {
          vec2 d = (uv - center) * vec2(1.0, 1.5);
          return smoothstep(radius * pulse, 0.0, length(d));
        }

        void main() {
          vec2 uv = vUv;

          // Organic distortion — perturbs the glow's edges so it doesn't read as a gradient
          float n1 = fbm(uv * 4.0 + vec2(uTime * 0.035, 0.0));
          float n2 = fbm(uv * 4.0 + vec2(0.0, uTime * 0.045));
          vec2 distorted = uv + vec2(n1 - 0.5, n2 - 0.5) * 0.05;

          // Base ambient floor — bottom-weighted, center-weighted, breathing
          float baseFalloff = smoothstep(0.46, 0.0, distorted.y);
          float xCenter = abs(distorted.x - 0.5) * 2.0;
          float xFalloff = 1.0 - smoothstep(0.0, 1.0, xCenter * xCenter);
          float baseGlow = baseFalloff * xFalloff * 0.55;

          // Hidden hot points — pulsing on slow irregular rhythms (periods ~20–60s)
          float p1 = 1.0 + 0.18 * sin(uTime * 0.17 + 0.0);
          float p2 = 1.0 + 0.16 * sin(uTime * 0.11 + 1.7);
          float p3 = 1.0 + 0.20 * sin(uTime * 0.23 + 3.4);
          float p4 = 1.0 + 0.14 * sin(uTime * 0.31 + 5.1);

          float h1 = hotSpot(distorted, vec2(0.28, -0.04), 0.22, p1);
          float h2 = hotSpot(distorted, vec2(0.52, -0.10), 0.26, p2);
          float h3 = hotSpot(distorted, vec2(0.74, -0.02), 0.20, p3);
          float h4 = hotSpot(distorted, vec2(0.42,  0.04), 0.14, p4);

          float hotGlow = max(max(h1, h2), max(h3, h4));

          // Log-shift event — brief bottom-wide flush of heat
          float pulseWash = uPulseIntensity * smoothstep(0.55, 0.0, distorted.y) * xFalloff;

          float glow = (baseGlow + hotGlow * 0.40 + pulseWash * 0.088) * uIntensity;

          // Color ladder — deep blood at coldest, brightening through core to ember
          vec3 deepColor   = vec3(0.45, 0.0, 0.0);    // $heat-deep
          vec3 coreColor   = vec3(0.5, 0.12, 0.0);    // $heat-core
          vec3 brightColor = vec3(.8, 0.2, 0.1);    // $heat-bright

          vec3 color = mix(deepColor, coreColor, smoothstep(0.0, 0.6, glow));
          color = mix(color, brightColor, smoothstep(0.55, 1.1, glow) * 0.45);

          float alpha = clamp(glow * 0.55, 0.0, 0.85);

          gl_FragColor = vec4(color, alpha);
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

  // ── Bloom Post-Pass ───────────────────────────────────────────────────────

  initBloom() {
    this.composer = new EffectComposer(this.renderer);
    const renderPass = new RenderPass(this.scene, this.camera);
    this.composer.addPass(renderPass);

    // Threshold tuned high so only ember cores and brightest hot points bloom —
    // dim ambient glow does not bleed and wash the scene out.
    this.bloomPass = new UnrealBloomPass(
      new THREE.Vector2(this.width, this.height),
      0.65, // strength
      0.55, // radius
      0.55  // threshold
    );
    this.composer.addPass(this.bloomPass);
    this.composer.setSize(this.width, this.height);
    this.composer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  }

  // ── Log-Shift Event ───────────────────────────────────────────────────────

  triggerLogShift() {
    // The fire below shifts — subtle glow flush plus a slightly denser, slightly
    // faster cluster. Toned down so the event reads as a quiet shift, not a flare.
    this.pulseTimer = 0;
    this.spawnCluster({
      count: 4 + Math.floor(Math.random() * 4),
      speedBoost: 1.15
    });
  }

  randomSpawnDelay() {
    // Seconds between clusters
    return 1 + Math.random() * 4;
  }

  spawnCluster(overrides = {}) {
    const count = overrides.count ?? (1 + Math.floor(Math.random() * 6));
    const clusterX = overrides.clusterX ?? (Math.random() - 0.5) * this.width * 0.7;
    const sparkChance = overrides.sparkChance ?? 0.65;
    const speedBoost = overrides.speedBoost ?? 1.0;
    const halfH = this.height / 2;

    for (let i = 0; i < count; i++) {
      if (this.embers.length >= this.maxEmbers) break;

      const spread = 30 + Math.random() * 40;
      const isSpark = Math.random() < sparkChance;

      if (isSpark) {
        // Sparks — fast, small, bright. Subtle lateral drift so they don't shoot dead straight.
        this.embers.push({
          x: clusterX + (Math.random() - 0.5) * spread * 0.5,
          y: -halfH,
          vx: (Math.random() - 0.5) * 12,
          vy: (70 + Math.random() * 60) * speedBoost,
          wobblePhase: Math.random() * Math.PI * 2,
          wobbleFreq: 2 + Math.random() * 2.5,
          wobbleAmp: 10 + Math.random() * 8,
          life: 0,
          maxLife: 3.0 + Math.random() * 3.0,
          size: 2 + Math.random() * 4,
          angle: Math.PI / 2,
          angleSmooth: 0.15 + Math.random() * 0.05,
          colorVariant: 1, // heat-flame → heat-mid (yellow-white head)
        });
      } else {
        // Embers — slow, drifting, the bulk of the scene
        this.embers.push({
          x: clusterX + (Math.random() - 0.5) * spread,
          y: -halfH,
          vx: (Math.random() - 0.5) * 8,
          vy: (15 + Math.random() * 50) * speedBoost,
          wobblePhase: Math.random() * Math.PI * 2,
          wobbleFreq: 1.5 + Math.random() * 2,
          wobbleAmp: 4 + Math.random() * 15,
          life: 0,
          maxLife: 7.5 + Math.random() * 18,
          size: 4 + Math.random() * 12,
          angle: Math.PI / 2,
          angleSmooth: 0.08 + Math.random() * 0.04,
          colorVariant: Math.random() < 0.5 ? 0 : 1,
        });
      }
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

    // Pulse envelope — attack (ease-out rise) followed by a longer decay (ease-in fall)
    if (this.pulseTimer >= 0) {
      this.pulseTimer += dt;
      if (this.pulseTimer < this.pulseAttack) {
        const t = this.pulseTimer / this.pulseAttack;
        this.pulseIntensity = 1.0 - Math.pow(1.0 - t, 2);
      } else if (this.pulseTimer < this.pulseDuration) {
        const t = (this.pulseTimer - this.pulseAttack) / (this.pulseDuration - this.pulseAttack);
        this.pulseIntensity = Math.pow(1.0 - t, 2);
      } else {
        this.pulseIntensity = 0;
        this.pulseTimer = -1;
      }
    }
    this.glowMaterial.uniforms.uPulseIntensity.value = this.pulseIntensity;

    // Embers + log-shift events
    if (!this.isReducedMotion) {
      this.timeSinceLastSpawn += dt;
      if (this.timeSinceLastSpawn >= this.nextSpawnTime) {
        this.spawnCluster();
        this.timeSinceLastSpawn = 0;
        this.nextSpawnTime = this.randomSpawnDelay();
      }

      this.timeSinceLastShift += dt;
      if (this.timeSinceLastShift >= this.nextLogShiftTime) {
        this.triggerLogShift();
        this.timeSinceLastShift = 0;
        this.nextLogShiftTime = 25 + Math.random() * 20;
      }

      this.updateEmbers(dt);
    }

    if (this.composer) {
      this.composer.render();
    } else {
      this.renderer.render(this.scene, this.camera);
    }
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
    // Observe the canvas itself so changes from bleed CSS (vh-based) are caught
    // alongside parent-driven changes.
    this.resizeObserver.observe(this.canvas);
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
    if (this.composer) this.composer.dispose();
    if (this.bloomPass) this.bloomPass.dispose();
    if (this.renderer) this.renderer.dispose();
  }
}

export default HellFloor;
