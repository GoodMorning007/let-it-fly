/**
 * CameraRig — Cinematic camera system
 *
 * Camera follows its own spline (CameraPath), NOT locked behind the plane.
 * Supports: orbit, overtake, track, lead, flank.
 * Camera shake via pseudoNoise.
 * FOV transitions based on cameraEvents.
 */

import * as THREE from 'three';
import { lerp, clamp, pseudoNoise } from '../core/utils.js';
import { CameraPath } from '../flight/CameraPath.js';

export class CameraRig {
  /**
   * @param {object} options
   * @param {THREE.Camera} options.camera
   * @param {CameraPath} options.cameraPath
   * @param {THREE.Object3D} options.planeModel - Plane model for look-at
   */
  constructor(options) {
    this.camera = options.camera;
    this.cameraPath = options.cameraPath;
    this.planeModel = options.planeModel;

    // Camera shake
    this.shakeAmplitude = 0.002;
    this.shakeFreq = 0.5;

    // FOV
    this.currentFOV = 35;
    this.targetFOV = 35;

    // Look-at
    this._lookAtTarget = new THREE.Vector3();
    this._lookAtOffset = new THREE.Vector3(0, 0.3, 0); // Slight upward bias

    // Active state
    this.active = false;
  }

  /**
   * Update camera position, look-at, and FOV
   * @param {number} progress - Flight progress (0-1)
   * @param {number} elapsed - Total elapsed time in seconds
   * @param {object|null} currentEvent - Current camera event from CameraSequence
   */
  update(progress, elapsed, currentEvent) {
    if (!this.active) return;

    const t = clamp(progress, 0, 0.999);

    // --- Position: sample from camera spline ---
    const basePos = this.cameraPath.getPoint(t);
    this.camera.position.copy(basePos);

    // --- Camera shake ---
    this.camera.position.x += pseudoNoise(elapsed, this.shakeFreq) * this.shakeAmplitude * 10;
    this.camera.position.y += pseudoNoise(elapsed + 100, this.shakeFreq) * this.shakeAmplitude * 10;

    // --- Look-at: default to plane position ---
    this._lookAtTarget.copy(this.planeModel.position).add(this._lookAtOffset);

    // Apply camera event modifications
    if (currentEvent) {
      this._applyEvent(currentEvent, progress, elapsed);
    }

    this.camera.lookAt(this._lookAtTarget);

    // --- FOV ---
    this.camera.fov = lerp(this.camera.fov, this.targetFOV, 0.03);
    this.camera.updateProjectionMatrix();
  }

  /**
   * Apply camera event parameters
   * @private
   */
  _applyEvent(event, progress, elapsed) {
    const params = event.params || {};

    // FOV from event
    if (params.fov !== undefined) {
      this.targetFOV = params.fov;
    }

    // Shake amplitude from event
    if (params.shake !== undefined) {
      this.shakeAmplitude = params.shake;
    }

    // Distance offset (multiplier on camera path distance from plane)
    if (params.distance !== undefined) {
      const direction = this.camera.position.clone().sub(this.planeModel.position);
      const currentDist = direction.length();
      const targetDist = currentDist * params.distance;
      direction.normalize().multiplyScalar(targetDist);
      this.camera.position.copy(this.planeModel.position).add(direction);
    }
  }

  /**
   * Set target FOV
   * @param {number} fov
   */
  setFOV(fov) {
    this.targetFOV = fov;
  }

  /**
   * Set camera shake amplitude
   * @param {number} amplitude
   */
  setShake(amplitude) {
    this.shakeAmplitude = amplitude;
  }

  /**
   * Activate the camera rig
   */
  activate() {
    this.active = true;
  }

  /**
   * Deactivate the camera rig
   */
  deactivate() {
    this.active = false;
  }
}
