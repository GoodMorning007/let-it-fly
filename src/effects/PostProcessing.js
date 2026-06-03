/**
 * PostProcessing — Visual effects pipeline
 *
 * Three.js EffectComposer:
 * - RenderPass (base render)
 * - UnrealBloomPass (controlled by ThemeManager)
 * - FXAA antialiasing
 *
 * CSS layers:
 * - Film Grain
 * - Vignette
 * - Cursor Spotlight
 *
 * Reserved: ChromaticAberration / LensDistortion shader passes
 */

import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
import { FXAAShader } from 'three/addons/shaders/FXAAShader.js';

export class PostProcessing {
  /**
   * @param {object} options
   * @param {THREE.WebGLRenderer} options.renderer
   * @param {THREE.Scene} options.scene
   * @param {THREE.Camera} options.camera
   */
  constructor(options) {
    this.renderer = options.renderer;
    this.scene = options.scene;
    this.camera = options.camera;

    // Create composer
    this.composer = new EffectComposer(this.renderer);

    // Render pass
    const renderPass = new RenderPass(this.scene, this.camera);
    this.composer.addPass(renderPass);

    // Bloom pass
    this.bloomPass = new UnrealBloomPass(
      new THREE.Vector2(window.innerWidth, window.innerHeight),
      0.3,   // strength
      0.4,   // radius
      0.85   // threshold
    );
    this.composer.addPass(this.bloomPass);

    // FXAA pass
    this.fxaaPass = new ShaderPass(FXAAShader);
    this.fxaaPass.uniforms['resolution'].value.set(1 / window.innerWidth, 1 / window.innerHeight);
    this.composer.addPass(this.fxaaPass);

    // CSS overlay elements
    this._cursorSpotlight = document.getElementById('cursor-spotlight');
    this._vignette = document.getElementById('vignette');
    this._filmGrain = document.getElementById('film-grain');

    // Mouse position (set from ScrollHandler or main loop)
    this.mouseX = 0;
    this.mouseY = 0;
  }

  /**
   * Set bloom parameters
   * @param {number} strength
   * @param {number} radius
   * @param {number} threshold
   */
  setBloom(strength, radius, threshold) {
    this.bloomPass.strength = strength;
    this.bloomPass.radius = radius;
    this.bloomPass.threshold = threshold;
  }

  /**
   * Update bloom strength (typically called from ThemeManager values)
   * @param {number} strength
   */
  setBloomStrength(strength) {
    this.bloomPass.strength = strength;
  }

  /**
   * Update CSS post-processing overlays
   * @param {number} mouseNormX - Normalized mouse X (-1 to 1)
   * @param {number} mouseNormY - Normalized mouse Y (-1 to 1)
   */
  updateCSSOverlays(mouseNormX, mouseNormY) {
    // Cursor spotlight
    if (this._cursorSpotlight) {
      const mx = ((mouseNormX + 1) / 2) * 100;
      const my = ((mouseNormY + 1) / 2) * 100;
      this._cursorSpotlight.style.background =
        `radial-gradient(circle 300px at ${mx}% ${my}%, rgba(245, 240, 235, 0.08), transparent)`;
    }
  }

  /**
   * Render the post-processed frame
   * (Replaces renderer.render() in the engine loop when active)
   */
  render() {
    this.composer.render();
  }

  /**
   * Handle window resize
   */
  handleResize() {
    const w = window.innerWidth;
    const h = window.innerHeight;

    this.composer.setSize(w, h);
    this.bloomPass.resolution.set(w, h);
    this.fxaaPass.uniforms['resolution'].value.set(1 / w, 1 / h);
  }

  /**
   * Show/hide film grain effect
   * @param {boolean} visible
   */
  setFilmGrainVisible(visible) {
    if (this._filmGrain) {
      this._filmGrain.style.display = visible ? 'block' : 'none';
    }
  }

  /**
   * Show/hide vignette effect
   * @param {boolean} visible
   */
  setVignetteVisible(visible) {
    if (this._vignette) {
      this._vignette.style.display = visible ? 'block' : 'none';
    }
  }
}
