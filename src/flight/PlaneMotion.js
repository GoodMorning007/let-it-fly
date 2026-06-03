/**
 * PlaneMotion — Plane position, rotation, and organic motion
 *
 * Samples position from PlanePath.
 * Derives rotation from spline tangent (pitch/yaw/roll).
 * Adds procedural wobble via pseudoNoise (wind/lift/turbulence).
 */

import * as THREE from 'three';
import { pseudoNoise } from '../core/utils.js';
import { PlanePath } from './PlanePath.js';

export class PlaneMotion {
  /**
   * @param {PlanePath} planePath
   * @param {THREE.Object3D} planeModel - The plane's 3D model
   */
  constructor(planePath, planeModel) {
    this.planePath = planePath;
    this.model = planeModel;

    // Wobble parameters
    this.wobbleIntensity = 1.0;
    this.wobbleXFreq = 0.7;
    this.wobbleYFreq = 1.1;
    this.wobbleXScale = 0.15;
    this.wobbleYScale = 0.08;

    // Banking
    this.bankFactor = 0.3;
    this.bankSmoothing = 0.08;

    // Internal
    this._targetQuat = new THREE.Quaternion();
    this._tempVec = new THREE.Vector3();
  }

  /**
   * Update plane position and rotation
   * @param {number} progress - Flight progress (0-1)
   * @param {number} elapsed - Total elapsed time in seconds
   */
  update(progress, elapsed) {
    if (progress < 0) return;

    const t = Math.min(progress, 0.999);

    // --- Position ---
    const basePos = this.planePath.getPoint(t);
    this.model.position.copy(basePos);

    // Add organic wobble (only when airborne, progress > 0.05)
    if (progress > 0.05) {
      const wobbleFade = Math.min(1, (progress - 0.05) / 0.1); // Fade in wobble
      this.model.position.x += pseudoNoise(elapsed * 0.5, this.wobbleXFreq) * this.wobbleXScale * wobbleFade * this.wobbleIntensity;
      this.model.position.y += pseudoNoise(elapsed * 0.3, this.wobbleYFreq) * this.wobbleYScale * wobbleFade * this.wobbleIntensity;
    }

    // --- Rotation ---
    const tangent = this.planePath.getTangent(t);
    if (tangent.lengthSq() < 0.001) return;

    // Base look-at quaternion from tangent
    const lookTarget = this._tempVec.copy(this.model.position).add(tangent);
    this._targetQuat.setFromUnitVectors(
      new THREE.Vector3(0, 0, -1), // Plane default forward
      tangent.clone().normalize()
    );

    // Banking: check point slightly ahead on spline
    const aheadT = Math.min(t + 0.02, 0.999);
    const aheadPos = this.planePath.getPoint(aheadT);
    const lateralDelta = aheadPos.x - this.model.position.x;
    const bankAngle = lateralDelta * this.bankFactor;

    // Apply bank as rotation around the tangent axis
    const bankQuat = new THREE.Quaternion();
    bankQuat.setFromAxisAngle(tangent.clone().normalize(), bankAngle);
    this._targetQuat.premultiply(bankQuat);

    // Smooth follow
    this.model.quaternion.slerp(this._targetQuat, this.bankSmoothing);
  }

  /**
   * Set wobble intensity (0 = no wobble, 1 = full)
   * @param {number} intensity
   */
  setWobbleIntensity(intensity) {
    this.wobbleIntensity = intensity;
  }
}
