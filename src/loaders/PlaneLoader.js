/**
 * PlaneLoader — Paper plane GLB loader with CargoSlot
 *
 * Loads plane GLB models and provides a Group attachment point
 * for future cargo models.
 */

import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

export class PlaneLoader {
  constructor() {
    this.gltfLoader = new GLTFLoader();
  }

  /**
   * Load a plane model
   * @param {string} url - Path to plane .glb file
   * @returns {Promise<{ model: THREE.Group, cargoSlot: THREE.Group }>}
   */
  async load(url) {
    return new Promise((resolve, reject) => {
      this.gltfLoader.load(
        url,
        (gltf) => {
          const model = gltf.scene;

          // Standardize the model
          model.traverse((child) => {
            if (child.isMesh) {
              child.castShadow = true;
              child.receiveShadow = true;
            }
          });

          // Create cargo attachment point
          const cargoSlot = new THREE.Group();
          cargoSlot.name = 'cargoSlot';
          cargoSlot.position.set(0, 0.1, 0.5); // Slightly above and behind nose
          model.add(cargoSlot);

          resolve({ model, cargoSlot });
        },
        undefined,
        (error) => {
          console.error(`[PlaneLoader] Failed to load: ${url}`, error);
          // Fallback: create a procedural paper plane
          const fallback = this._createFallbackPlane();
          resolve(fallback);
        }
      );
    });
  }

  /**
   * Attach a cargo model to the plane's cargo slot
   * @param {THREE.Group} cargoSlot - The cargo attachment point
   * @param {THREE.Object3D} cargoModel - The cargo model to attach
   */
  attachCargo(cargoSlot, cargoModel) {
    // Clear existing cargo
    while (cargoSlot.children.length > 0) {
      cargoSlot.remove(cargoSlot.children[0]);
    }
    cargoSlot.add(cargoModel);
  }

  /**
   * Remove cargo from slot
   * @param {THREE.Group} cargoSlot
   */
  detachCargo(cargoSlot) {
    while (cargoSlot.children.length > 0) {
      const child = cargoSlot.children[0];
      cargoSlot.remove(child);
      // Dispose
      child.traverse((obj) => {
        if (obj.geometry) obj.geometry.dispose();
        if (obj.material) {
          const materials = Array.isArray(obj.material) ? obj.material : [obj.material];
          materials.forEach((m) => m.dispose());
        }
      });
    }
  }

  /**
   * Create a procedural fallback paper plane geometry
   * Used when GLB loading fails
   * @private
   */
  _createFallbackPlane() {
    const scale = 1.2;

    // Vertex data
    const nose = [0, 0, -2];
    const tailCenter = [0, 0.05, 1.2];
    const tailLeft = [-0.15, 0.08, 1.2];
    const tailRight = [0.15, 0.08, 1.2];
    const wingLeftInner = [-0.3, 0.1, 0.6];
    const wingRightInner = [0.3, 0.1, 0.6];
    const wingLeftOuter = [-1.1, -0.05, 0.4];
    const wingRightOuter = [1.1, -0.05, 0.4];
    const wingLeftTip = [-0.9, -0.02, 1.0];
    const wingRightTip = [0.9, -0.02, 1.0];
    const belly = [0, -0.08, 0.3];

    const verts = {
      nose, tailCenter, tailLeft, tailRight,
      wingLeftInner, wingRightInner, wingLeftOuter, wingRightOuter,
      wingLeftTip, wingRightTip, belly,
    };

    // Face definitions (vertex name triples)
    const faces = [
      ['nose', 'wingLeftInner', 'tailCenter'],
      ['nose', 'tailCenter', 'wingRightInner'],
      ['nose', 'wingLeftOuter', 'wingLeftInner'],
      ['nose', 'wingRightInner', 'wingRightOuter'],
      ['wingLeftInner', 'wingLeftOuter', 'wingLeftTip'],
      ['wingRightInner', 'wingRightTip', 'wingRightOuter'],
      ['wingLeftInner', 'wingLeftTip', 'tailLeft'],
      ['wingRightInner', 'tailRight', 'wingRightTip'],
      ['tailCenter', 'tailLeft', 'wingLeftInner'],
      ['tailCenter', 'wingRightInner', 'tailRight'],
      ['nose', 'belly', 'wingLeftOuter'],
      ['nose', 'wingRightOuter', 'belly'],
      ['belly', 'tailLeft', 'wingLeftOuter'],
      ['belly', 'wingRightOuter', 'tailRight'],
      ['belly', 'tailCenter', 'tailLeft'],
      ['belly', 'tailRight', 'tailCenter'],
    ];

    // Build BufferGeometry
    const positions = [];
    const normals = [];

    for (const [aName, bName, cName] of faces) {
      const a = verts[aName].map((v) => v * scale);
      const b = verts[bName].map((v) => v * scale);
      const c = verts[cName].map((v) => v * scale);

      positions.push(...a, ...b, ...c);

      // Flat normal
      const ab = [b[0] - a[0], b[1] - a[1], b[2] - a[2]];
      const ac = [c[0] - a[0], c[1] - a[1], c[2] - a[2]];
      const nx = ab[1] * ac[2] - ab[2] * ac[1];
      const ny = ab[2] * ac[0] - ab[0] * ac[2];
      const nz = ab[0] * ac[1] - ab[1] * ac[0];
      const len = Math.sqrt(nx * nx + ny * ny + nz * nz) || 1;
      const normal = [nx / len, ny / len, nz / len];

      normals.push(...normal, ...normal, ...normal);
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geometry.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));

    const material = new THREE.MeshStandardMaterial({
      color: 0xF5F0EB, // Paper White
      roughness: 0.85,
      metalness: 0.0,
      flatShading: true,
      side: THREE.DoubleSide,
    });

    const model = new THREE.Mesh(geometry, material);
    model.castShadow = true;
    model.receiveShadow = true;

    const group = new THREE.Group();
    group.add(model);

    // Cargo slot
    const cargoSlot = new THREE.Group();
    cargoSlot.name = 'cargoSlot';
    cargoSlot.position.set(0, 0.1, 0.5);
    group.add(cargoSlot);

    return { model: group, cargoSlot };
  }

  /**
   * Dispose loader
   */
  dispose() {
    this.gltfLoader.dracoLoader?.dispose();
  }
}
