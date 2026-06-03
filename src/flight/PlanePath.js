/**
 * PlanePath — Plane flight path (CatmullRomCurve3)
 *
 * Manages the plane's CatmullRomCurve3 spline.
 * Provides position and tangent sampling along the path.
 */

import * as THREE from 'three';
import { vec3ArrayFromArray } from '../core/utils.js';

export class PlanePath {
  /**
   * @param {number[][]} controlPoints - Array of [x, y, z] from world config
   */
  constructor(controlPoints) {
    const points = vec3ArrayFromArray(controlPoints);
    this.spline = new THREE.CatmullRomCurve3(points, false, 'catmullrom', 0.5);
    this.length = this.spline.getLength();
  }

  /**
   * Get position on the path at progress t (0-1)
   * @param {number} t - Progress along spline
   * @returns {THREE.Vector3}
   */
  getPoint(t) {
    const clampedT = Math.max(0, Math.min(t, 0.999));
    return this.spline.getPoint(clampedT);
  }

  /**
   * Get tangent direction at progress t (0-1)
   * @param {number} t - Progress along spline
   * @returns {THREE.Vector3}
   */
  getTangent(t) {
    const clampedT = Math.max(0, Math.min(t, 0.999));
    return this.spline.getTangent(clampedT);
  }

  /**
   * Get a point offset from t along the spline
   * @param {number} t - Base progress
   * @param {number} offset - Offset in progress space
   * @returns {THREE.Vector3}
   */
  getPointOffset(t, offset) {
    return this.getPoint(Math.max(0, Math.min(t + offset, 0.999)));
  }

  /**
   * Get total path length
   * @returns {number}
   */
  getLength() {
    return this.length;
  }

  /**
   * Get the raw spline for debug visualization
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
