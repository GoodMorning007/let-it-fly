/**
 * WorldLoader — GLB scene loader
 *
 * Uses GLTFLoader to load .glb scene files.
 * Returns a Promise<THREE.Group> with loading progress callback.
 */

import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js';

export class WorldLoader {
  constructor() {
    this.gltfLoader = new GLTFLoader();

    // Optional: Draco compression support
    const dracoLoader = new DRACOLoader();
    dracoLoader.setDecoderPath('https://www.gstatic.com/draco/versioned/decoders/1.5.6/');
    this.gltfLoader.setDRACOLoader(dracoLoader);
  }

  /**
   * Load a GLB scene
   * @param {string} url - Path to .glb file
   * @param {function(progress: number): void} onProgress - Progress callback (0-1)
   * @returns {Promise<THREE.Group>}
   */
  async load(url, onProgress) {
    return new Promise((resolve, reject) => {
      this.gltfLoader.load(
        url,
        (gltf) => {
          const scene = gltf.scene;
          resolve(scene);
        },
        (event) => {
          if (onProgress && event.total > 0) {
            onProgress(event.loaded / event.total);
          }
        },
        (error) => {
          console.error(`[WorldLoader] Failed to load: ${url}`, error);
          reject(error);
        }
      );
    });
  }

  /**
   * Dispose loader resources
   */
  dispose() {
    this.gltfLoader.dracoLoader?.dispose();
  }
}
