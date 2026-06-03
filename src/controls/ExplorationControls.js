/**
 * ExplorationControls — Free exploration mode controls
 *
 * Wraps OrbitControls for the post-landing exploration phase.
 * Target set to landingPoint area.
 * Disabled during flight, enabled after landing.
 */

import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

export class ExplorationControls {
  /**
   * @param {object} options
   * @param {THREE.Camera} options.camera
   * @param {THREE.HTMLCanvasElement} options.domElement
   */
  constructor(options) {
    this.controls = new OrbitControls(options.camera, options.domElement);

    // Configure for cinematic exploration
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.05;
    this.controls.enablePan = true;
    this.controls.enableZoom = true;
    this.controls.enableRotate = true;

    // Smooth rotation
    this.controls.rotateSpeed = 0.5;
    this.controls.zoomSpeed = 0.8;
    this.controls.panSpeed = 0.5;

    // Limits
    this.controls.minDistance = 2;
    this.controls.maxDistance = 100;
    this.controls.maxPolarAngle = Math.PI * 0.85;
    this.controls.minPolarAngle = 0.1;

    // Disabled by default (enabled after landing)
    this.controls.enabled = false;
  }

  /**
   * Set the look-at target (typically landingPoint)
   * @param {THREE.Vector3} target
   */
  setTarget(target) {
    this.controls.target.copy(target);
  }

  /**
   * Enable exploration controls
   */
  enable() {
    this.controls.enabled = true;
  }

  /**
   * Disable exploration controls
   */
  disable() {
    this.controls.enabled = false;
  }

  /**
   * Per-frame update (needed for damping)
   */
  update() {
    if (this.controls.enabled) {
      this.controls.update();
    }
  }

  /**
   * Dispose controls
   */
  dispose() {
    this.controls.dispose();
  }
}
