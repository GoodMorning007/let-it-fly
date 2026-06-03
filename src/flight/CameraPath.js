/**
 * CameraPath — Camera flight path (independent CatmullRomCurve3)
 *
 * Manages the camera's own CatmullRomCurve3 spline.
 * Completely independent from PlanePath — allows
 * orbit / overtake / flank / lead effects.
 *
 * Future: lookAtPath for look-at target spline
 */

import * as THREE from 'three';
import { vec3ArrayFromArray } from '../core/utils.js';

export class CameraPath {
  /**
   * @param {number[][]} controlPoints - Array of [x, y, z] from world config
   */
  constructor(controlPoints) {
    const points = vec3ArrayFromArray(controlPoints);
    this.spline = new THREE.CatmullRomCurve3(points, false, 'catmullrom', 0.5);
    this.length = this.spline.getLength();

    // Future: lookAtPath for independent look-at target
    this._lookAtSpline = null;
  }

  /**
   * Set a separate look-at target spline
   * @param {number[][]} controlPoints
   */
  setLookAtPath(controlPoints) {
    const points = vec3ArrayFromArray(controlPoints);
    this._lookAtSpline = new THREE.CatmullRomCurve3(points, false, 'catmullrom', 0.5);
  }

  /**
   * Get camera position at progress t
   * @param {number} t - Progress along spline
   * @returns {THREE.Vector3}
   */
  getPoint(t) {
    const clampedT = Math.max(0, Math.min(t, 0.999));
    return this.spline.getPoint(clampedT);
  }

  /**
   * Get camera tangent at progress t
   * @param {number} t
   * @returns {THREE.Vector3}
   */
  getTangent(t) {
    const clampedT = Math.max(0, Math.min(t, 0.999));
    return this.spline.getTangent(clampedT);
  }

  /**
   * Get look-at target at progress t
   * Falls back to the plane position if no lookAtPath defined
   * @param {number} t
   * @returns {THREE.Vector3|null}
   */
  getLookAtPoint(t) {
    if (!this._lookAtSpline) return null;
    const clampedT = Math.max(0, Math.min(t, 0.999));
    return this._lookAtSpline.getPoint(clampedT);
  }

  /**
   * Get raw spline for debug visualization
   * @returns {THREE.CatmullRomCurve3}
   */
  getSpline() {
    return this.spline;
  }

  /**
   * Get control points for debug visualization
   * @returns {THREE.Vector3[]}
   */
  getControlPoints() {
    return this.spline.points;
  }
}
