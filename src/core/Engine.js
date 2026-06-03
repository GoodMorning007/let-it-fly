/**
 * Engine — Core rendering engine
 *
 * Manages Three.js Renderer, Scene, Camera, and the render loop.
 * Provides addUpdateCallback/removeUpdateCallback for per-frame logic.
 */

import * as THREE from 'three';

export class Engine {
  constructor(options = {}) {
    const container = options.container || document.body;
    const w = Math.max(window.innerWidth, 1);
    const h = Math.max(window.innerHeight, 1);

    // --- Renderer ---
    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: false,
      powerPreference: 'high-performance',
    });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setSize(w, h);
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.0;
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    container.appendChild(this.renderer.domElement);

    // --- Scene ---
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0xffc65b); // Warm golden
    this.scene.fog = new THREE.FogExp2(0x0D0B0A, 0.0);

    // --- Camera ---
    this.camera = new THREE.PerspectiveCamera(
      35,
      w / h,
      0.1,
      500
    );
    this.camera.position.set(0, 2, 5);

    // --- Loop ---
    this._running = false;
    this._clock = new THREE.Clock();
    this._updateCallbacks = new Map();
    this._animationId = null;

    // --- State ---
    this.debug = options.debug || false;
    this.elapsed = 0;
  }

  /**
   * Register a per-frame update callback
   * @param {string} id - Unique identifier
   * @param {function(dt: number, elapsed: number): void} callback
   */
  addUpdateCallback(id, callback) {
    this._updateCallbacks.set(id, callback);
  }

  /**
   * Remove a per-frame update callback
   * @param {string} id
   */
  removeUpdateCallback(id) {
    this._updateCallbacks.delete(id);
  }

  /**
   * Start the render loop
   */
  start() {
    if (this._running) return;
    this._running = true;
    this._clock.start();
    this._loop();
  }

  /**
   * Stop the render loop
   */
  stop() {
    this._running = false;
    if (this._animationId !== null) {
      cancelAnimationFrame(this._animationId);
      this._animationId = null;
    }
  }

  /**
   * Internal render loop
   */
  _loop() {
    if (!this._running) return;
    this._animationId = requestAnimationFrame(() => this._loop());

    const dt = this._clock.getDelta();
    this.elapsed += dt;

    // Run all update callbacks
    for (const [id, callback] of this._updateCallbacks) {
      try {
        callback(dt, this.elapsed);
      } catch (err) {
        console.error(`[Engine] Update callback "${id}" error:`, err);
      }
    }

    this.renderer.render(this.scene, this.camera);
  }

  /**
   * Handle window resize
   */
  handleResize() {
    const w = window.innerWidth;
    const h = window.innerHeight;
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h);
  }

  /**
   * Clean up GPU resources
   */
  dispose() {
    this.stop();
    this.renderer.dispose();
    // Traverse and dispose all geometries/materials/textures
    this.scene.traverse((obj) => {
      if (obj.geometry) obj.geometry.dispose();
      if (obj.material) {
        const materials = Array.isArray(obj.material) ? obj.material : [obj.material];
        materials.forEach((m) => {
          if (m.map) m.map.dispose();
          m.dispose();
        });
      }
    });
  }
}
