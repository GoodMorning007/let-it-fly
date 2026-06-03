/**
 * FlightEditor — Flight path editor (skeleton)
 *
 * Future: drag control points to modify flightPath.
 * Real-time preview of path curve.
 * Export as JSON configuration.
 *
 * Current: interface definition only.
 */

import * as THREE from 'three';

export class FlightEditor {
  /**
   * @param {object} options
   * @param {THREE.Scene} options.scene
   * @param {THREE.Camera} options.camera
   * @param {import('../flight/PlanePath.js').PlanePath} options.planePath
   */
  constructor(options) {
    this.scene = options.scene;
    this.camera = options.camera;
    this.planePath = options.planePath;

    this._active = false;
    this._controlPointHandles = [];
  }

  /**
   * Open the editor
   * @reserved
   */
  open() {
    // TODO: Create draggable handles for each control point
    // TODO: Add gizmo for point manipulation
    this._active = true;
    console.log('[FlightEditor] Editor opened (not yet implemented)');
  }

  /**
   * Close the editor
   * @reserved
   */
  close() {
    this._active = false;
  }

  /**
   * Update path in real-time as points are dragged
   * @reserved
   */
  updatePath() {
    // TODO: Rebuild CatmullRomCurve3 from modified control points
    // TODO: Update PlanePath instance
    // TODO: Update PathVisualizer
  }

  /**
   * Export current path as JSON config
   * @reserved
   * @returns {object}
   */
  exportConfig() {
    // TODO: Return JSON-serializable path config
    return {
      flightPath: this.planePath.getControlPoints().map((p) => [
        parseFloat(p.x.toFixed(2)),
        parseFloat(p.y.toFixed(2)),
        parseFloat(p.z.toFixed(2)),
      ]),
    };
  }

  /**
   * Import path from config
   * @reserved
   * @param {number[][]} flightPath
   */
  importConfig(flightPath) {
    // TODO: Rebuild PlanePath from config data
  }

  /**
   * Dispose
   */
  dispose() {
    this.close();
  }
}
