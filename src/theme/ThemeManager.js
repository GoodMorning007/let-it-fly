/**
 * ThemeManager — Visual theme interpolation
 *
 * Reads world config theme and interpolates parameters
 * based on flight progress. Controls:
 * - Fog density / color
 * - Bloom strength
 * - Ambient light color / intensity
 * - Scene background / exposure
 */

import * as THREE from 'three';
import { lerp } from '../core/utils.js';

export class ThemeManager {
  /**
   * @param {object} options
   * @param {THREE.Scene} options.scene
   * @param {THREE.AmbientLight} options.ambientLight
   * @param {THREE.DirectionalLight} options.directionalLight
   * @param {object} options.renderer
   */
  constructor(options) {
    this.scene = options.scene;
    this.ambientLight = options.ambientLight;
    this.directionalLight = options.directionalLight;
    this.renderer = options.renderer;

    /** @type {object|null} Current world theme config */
    this.themeConfig = null;
  }

  /**
   * Set the current world theme
   * @param {object} themeConfig - From world config.theme
   */
  setTheme(themeConfig) {
    this.themeConfig = themeConfig;
  }

  /**
   * Update theme based on flight progress
   * @param {number} progress - Flight progress (0-1)
   */
  update(progress) {
    if (!this.themeConfig) return;

    // Fog
    if (this.themeConfig.fog) {
      const fogParams = this._interpolateNodes(this.themeConfig.fog, progress);
      if (this.scene.fog) {
        this.scene.fog.density = lerp(this.scene.fog.density, fogParams.density, 0.02);
        const targetColor = new THREE.Color(fogParams.color);
        this.scene.fog.color.lerp(targetColor, 0.02);
      }
    }

    // Bloom (controlled via params, PostProcessing reads this)
    // Stored as a public property for PostProcessing to access
    if (this.themeConfig.bloom) {
      const bloomParams = this._interpolateNodes(this.themeConfig.bloom, progress);
      this.currentBloomStrength = lerp(
        this.currentBloomStrength || 0,
        bloomParams.strength,
        0.02
      );
    }

    // Ambient light
    if (this.themeConfig.ambient) {
      const ambientParams = this._interpolateNodes(this.themeConfig.ambient, progress);
      if (this.ambientLight) {
        this.ambientLight.color.lerp(new THREE.Color(ambientParams.color), 0.02);
        this.ambientLight.intensity = lerp(this.ambientLight.intensity, ambientParams.intensity, 0.02);
      }
    }

    // Sky / background
    if (this.themeConfig.sky) {
      const skyParams = this._interpolateNodes(this.themeConfig.sky, progress);
      this.scene.background.lerp(new THREE.Color(skyParams.background), 0.01);
      if (this.renderer) {
        this.renderer.toneMappingExposure = lerp(
          this.renderer.toneMappingExposure,
          skyParams.exposure,
          0.02
        );
      }
    }
  }

  /**
   * Interpolate between theme progress nodes
   * @private
   * @param {object[]} nodes - Array of {progress, ...params}
   * @param {number} progress - Current flight progress
   * @returns {object} Interpolated params
   */
  _interpolateNodes(nodes, progress) {
    if (!nodes || nodes.length === 0) return {};
    if (nodes.length === 1) return { ...nodes[0] };

    // Find surrounding nodes
    let lower = nodes[0];
    let upper = nodes[nodes.length - 1];

    for (let i = 0; i < nodes.length - 1; i++) {
      if (progress >= nodes[i].progress && progress < nodes[i + 1].progress) {
        lower = nodes[i];
        upper = nodes[i + 1];
        break;
      }
    }

    // Calculate blend factor
    const range = upper.progress - lower.progress;
    const t = range > 0 ? (progress - lower.progress) / range : 0;

    // Interpolate all numeric properties
    const result = {};
    for (const key of Object.keys(lower)) {
      if (key === 'progress') continue;
      const a = lower[key];
      const b = upper[key];
      if (typeof a === 'number' && typeof b === 'number') {
        result[key] = lerp(a, b, t);
      } else {
        result[key] = t < 0.5 ? a : b;
      }
    }

    return result;
  }
}
