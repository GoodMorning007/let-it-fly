/**
 * WorldManager — World lifecycle management
 *
 * Manages: load, activate, release, cache worlds.
 * Current active world reference tracking.
 * Future: pre-loading adjacent worlds, smooth transitions.
 */

import { WORLDS } from '../config/worlds.js';
import { WorldLoader } from './WorldLoader.js';
import { SceneProcessor } from './SceneProcessor.js';

export class WorldManager {
  constructor(engine) {
    this.engine = engine;
    this.worldLoader = new WorldLoader();
    this.sceneProcessor = new SceneProcessor();

    /** @type {Map<string, { scene: THREE.Group, config: object, boundingBox: THREE.Box3 }>} */
    this.cache = new Map();

    /** @type {string|null} Current active world id */
    this.activeWorldId = null;
  }

  /**
   * Get world config by id
   * @param {string} worldId
   * @returns {object|undefined}
   */
  getConfig(worldId) {
    return WORLDS.find((w) => w.id === worldId);
  }

  /**
   * Load a world (uses cache if available)
   * @param {string} worldId
   * @param {function(progress: number): void} onProgress
   * @returns {Promise<{ scene: THREE.Group, config: object, boundingBox: THREE.Box3 }>}
   */
  async loadWorld(worldId, onProgress) {
    // Return from cache if already loaded
    if (this.cache.has(worldId)) {
      return this.cache.get(worldId);
    }

    const config = this.getConfig(worldId);
    if (!config) {
      throw new Error(`[WorldManager] World "${worldId}" not found in config`);
    }

    // Load GLB
    const rawScene = await this.worldLoader.load(config.scene, onProgress);

    // Process (scale, position, shadows, bounding box)
    const { scene, boundingBox } = this.sceneProcessor.process(rawScene, config);

    // Cache
    const entry = { scene, config, boundingBox };
    this.cache.set(worldId, entry);

    return entry;
  }

  /**
   * Activate a loaded world (add to engine scene)
   * @param {string} worldId
   */
  activateWorld(worldId) {
    const entry = this.cache.get(worldId);
    if (!entry) {
      console.error(`[WorldManager] Cannot activate "${worldId}" — not loaded`);
      return;
    }

    // Remove previous active world from scene
    if (this.activeWorldId && this.activeWorldId !== worldId) {
      this.deactivateWorld(this.activeWorldId);
    }

    this.engine.scene.add(entry.scene);
    this.activeWorldId = worldId;
  }

  /**
   * Deactivate a world (remove from engine scene, keep in cache)
   * @param {string} worldId
   */
  deactivateWorld(worldId) {
    const entry = this.cache.get(worldId);
    if (!entry) return;

    this.engine.scene.remove(entry.scene);
    if (this.activeWorldId === worldId) {
      this.activeWorldId = null;
    }
  }

  /**
   * Release a world from cache (free GPU resources)
   * @param {string} worldId
   */
  releaseWorld(worldId) {
    const entry = this.cache.get(worldId);
    if (!entry) return;

    // Remove from scene if active
    if (this.activeWorldId === worldId) {
      this.engine.scene.remove(entry.scene);
      this.activeWorldId = null;
    }

    // Dispose all GPU resources
    entry.scene.traverse((obj) => {
      if (obj.geometry) obj.geometry.dispose();
      if (obj.material) {
        const materials = Array.isArray(obj.material) ? obj.material : [obj.material];
        materials.forEach((m) => {
          Object.values(m).forEach((v) => {
            if (v && v.isTexture) v.dispose();
          });
          m.dispose();
        });
      }
    });

    this.cache.delete(worldId);
  }

  /**
   * Get the active world entry
   * @returns {object|undefined}
   */
  getActiveWorld() {
    if (!this.activeWorldId) return undefined;
    return this.cache.get(this.activeWorldId);
  }

  /**
   * Preload a world without activating it
   * @param {string} worldId
   * @returns {Promise<void>}
   */
  async preloadWorld(worldId) {
    await this.loadWorld(worldId);
    // Don't activate — just cache it
  }

  /**
   * Dispose all worlds and the loader
   */
  dispose() {
    for (const worldId of this.cache.keys()) {
      this.releaseWorld(worldId);
    }
    this.worldLoader.dispose();
  }
}
