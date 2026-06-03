/**
 * FlightController — Scroll-driven speed control
 *
 * Scroll does NOT control position.
 * Scroll controls velocity (speed along the spline).
 * Scroll down → accelerate, scroll up → decelerate.
 */

import { lerp, clamp } from '../core/utils.js';

export class FlightController {
  /**
   * @param {object} options
   * @param {number} options.maxSpeed - Maximum flight speed (from world config)
   */
  constructor(options = {}) {
    this.maxSpeed = options.maxSpeed || 0.0008;
    this.currentSpeed = 0;
    this.targetSpeed = 0;

    // Flight progress along the spline (0 → 1)
    this.progress = 0;

    // Is the flight active?
    this.active = false;

    // Is landing sequence triggered?
    this.landing = false;

    // Scroll velocity tracking
    this._scrollVelocity = 0;
    this._scrollDecay = 0.95;
  }

  /**
   * Called by ScrollHandler when scroll delta is detected
   * @param {number} delta - Scroll delta (positive = scroll down)
   */
  onScroll(delta) {
    if (!this.active) return;

    // Accumulate scroll velocity
    this._scrollVelocity += Math.abs(delta) * 0.00002;
    this._scrollVelocity = Math.min(this._scrollVelocity, this.maxSpeed * 3);

    // Set target speed based on scroll direction
    if (delta > 0) {
      this.targetSpeed = Math.min(this.targetSpeed + this.maxSpeed * 0.3, this.maxSpeed);
    } else {
      this.targetSpeed = Math.max(this.targetSpeed - this.maxSpeed * 0.15, this.maxSpeed * 0.1);
    }
  }

  /**
   * Per-frame update
   * @param {number} dt - Delta time in seconds
   */
  update(dt) {
    if (!this.active) return;

    // Smooth speed interpolation
    this.currentSpeed = lerp(this.currentSpeed, this.targetSpeed, 0.05);

    // Scroll velocity decay
    this._scrollVelocity *= this._scrollDecay;

    // If no scroll input for a while, gently decelerate
    this.targetSpeed = lerp(this.targetSpeed, this.maxSpeed * 0.3, 0.002);

    // Landing: gradual deceleration
    if (this.landing) {
      this.targetSpeed = lerp(this.targetSpeed, 0, 0.03);
      this.currentSpeed = lerp(this.currentSpeed, 0, 0.03);
    }

    // Advance progress along the spline
    this.progress += this.currentSpeed;

    // Clamp progress
    if (this.progress >= 1.0) {
      this.progress = 1.0;
      this.currentSpeed = 0;
      this.targetSpeed = 0;
    }
  }

  /**
   * Get current flight progress
   * @returns {number} 0-1
   */
  getProgress() {
    return clamp(this.progress, 0, 1);
  }

  /**
   * Reset the controller for a new flight
   */
  reset() {
    this.progress = 0;
    this.currentSpeed = 0;
    this.targetSpeed = 0;
    this.landing = false;
    this._scrollVelocity = 0;
  }

  /**
   * Activate the flight controller
   */
  activate() {
    this.active = true;
    this.targetSpeed = this.maxSpeed * 0.2;
  }

  /**
   * Deactivate the flight controller
   */
  deactivate() {
    this.active = false;
    this.currentSpeed = 0;
    this.targetSpeed = 0;
  }

  /**
   * Trigger landing sequence
   */
  startLanding() {
    this.landing = true;
  }
}
