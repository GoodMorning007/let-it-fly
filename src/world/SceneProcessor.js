/**
 * SceneProcessor — Post-load scene processing
 *
 * CURRENT MODE (verification): NO auto-scaling / NO position override.
 * Only computes bounding box and logs dimensions to console.
 *
 * Future: manual scale/position from world config, shadows, LOD, collision.
 */

import * as THREE from 'three';

export class SceneProcessor {
  /**
   * Process a loaded scene
   * @param {THREE.Group} scene - Loaded GLB scene
   * @param {object} _worldConfig - World configuration (scale/position SKIPPED for now)
   * @returns {{ scene: THREE.Group, boundingBox: THREE.Box3 }}
   */
  process(scene, _worldConfig) {
    // --- NO auto-scaling or position override ---
    // The scene stays exactly as authored in GLB.
    // Scale/position from world config is deliberately NOT applied.

    // Compute bounding box
    const boundingBox = new THREE.Box3().setFromObject(scene);
    const size = new THREE.Vector3();
    const center = new THREE.Vector3();
    boundingBox.getSize(size);
    boundingBox.getCenter(center);

    // Log to console
    console.log(
      `[SceneProcessor] Bounding Box:\n` +
      `  Size:  ${size.x.toFixed(2)} × ${size.y.toFixed(2)} × ${size.z.toFixed(2)}\n` +
      `  Center: (${center.x.toFixed(2)}, ${center.y.toFixed(2)}, ${center.z.toFixed(2)})\n` +
      `  Min: (${boundingBox.min.x.toFixed(2)}, ${boundingBox.min.y.toFixed(2)}, ${boundingBox.min.z.toFixed(2)})\n` +
      `  Max: (${boundingBox.max.x.toFixed(2)}, ${boundingBox.max.y.toFixed(2)}, ${boundingBox.max.z.toFixed(2)})`
    );

    this._boundingBox = boundingBox;

    return { scene, boundingBox };
  }

  /**
   * Get bounding box of last processed scene
   * @returns {THREE.Box3|undefined}
   */
  getLastBoundingBox() {
    return this._boundingBox;
  }

  /**
   * Get scene dimensions from bounding box
   * @param {THREE.Box3} box
   * @returns {{ width, height, depth, center: THREE.Vector3 }}
   */
  getDimensions(box) {
    const size = new THREE.Vector3();
    const center = new THREE.Vector3();
    box.getSize(size);
    box.getCenter(center);
    return { width: size.x, height: size.y, depth: size.z, center };
  }

  // --- Reserved interfaces for future expansion ---

  setupLOD(_scene, _config) {
    // Future: configure level-of-detail
  }

  setupCollision(_scene, _config) {
    // Future: generate collision meshes
  }

  setupNavigation(_scene, _config) {
    // Future: generate navigation mesh
  }
}
