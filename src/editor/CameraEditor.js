/**
 * CameraEditor — Camera path editor (skeleton)
 *
 * Future: drag control points to modify cameraPath.
 * Real-time preview of camera view.
 * Export as JSON configuration.
 *
 * Current: interface definition only.
 */

import * as THREE from 'three';

export class CameraEditor {
  /**
   * @param {object} options
   * @param {THREE.Scene} options.scene
   * @param {THREE.Camera} options.camera
   * @param {import('../flight/CameraPath.js').CameraPath} options.cameraPath
   */
  constructor(options) {
    this.scene = options.scene;
    this.camera = options.camera;
    this.cameraPath = options.cameraPath;

    this._active = false;
  }

  /**
   * Open the editor
   * @reserved
   */
  open() {
    this._active = true;
    console.log('[CameraEditor] Editor opened (not yet implemented)');
  }

  /**
   * Close the editor
   * @reserved
   */
  close() {
    this._active = false;
  }

  /**
   * Preview camera view at a specific progress point
   * @reserved
   * @param {number} progress - 0 to 1
   */
  previewAt(progress) {
    // TODO: Set camera to the position at this progress point
    // TODO: Show what the camera sees
  }

  /**
   * Update camera path in real-time
   * @reserved
   */
  updatePath() {
    // TODO: Rebuild CatmullRomCurve3 from modified control points
  }

  /**
   * Export current camera path as JSON config
   * @reserved
   * @returns {object}
   */
  exportConfig() {
    return {
      cameraPath: this.cameraPath.getControlPoints().map((p) => [
        parseFloat(p.x.toFixed(2)),
        parseFloat(p.y.toFixed(2)),
        parseFloat(p.z.toFixed(2)),
      ]),
    };
  }

  /**
   * Import camera path from config
   * @reserved
   * @param {number[][]} cameraPath
   */
  importConfig(cameraPath) {
    // TODO: Rebuild CameraPath from config data
  }

  /**
   * Dispose
   */
  dispose() {
    this.close();
  }
}
