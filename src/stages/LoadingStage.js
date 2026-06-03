/**
 * LoadingStage — World + plane loading
 *
 * Loads in parallel:
 * - World GLB scene (via WorldManager)
 * - Plane GLB model (via PlaneLoader)
 *
 * Shows loading progress, then transitions to ExplorationStage.
 * Audio loading is skipped for now.
 */

import { WorldManager } from '../world/WorldManager.js';
import { PlaneLoader } from '../loaders/PlaneLoader.js';
import { getSelectedPlane } from '../config/planes.js';
import { WORLDS } from '../config/worlds.js';
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

export class LoadingStage {
  /**
   * @param {import('./StageManager.js').StageManager} stageManager
   */
  constructor(stageManager) {
    this.stageManager = stageManager;
    this.worldManager = new WorldManager(stageManager.engine);
    this.planeLoader = new PlaneLoader();
    this.cakeLoader = new GLTFLoader();

    // DOM
    this.loadingScreen = document.getElementById('loading-screen');
    this.loadingText = document.getElementById('loading-text');
    this.progressFill = document.getElementById('progress-fill');
  }

  /**
   * Enter loading stage
   */
  async enter() {
    // Show loading screen
    if (this.loadingScreen) {
      this.loadingScreen.classList.remove('revealing', 'hidden');
    }

    const { selectedWorldId, selectedPlaneId } = this.stageManager.sharedState;
    const worldConfig = WORLDS.find((w) => w.id === selectedWorldId) || WORLDS[0];
    const planeConfig = getSelectedPlane();

    console.log(`[LoadingStage] Loading world: ${worldConfig.id}`);
    console.log(`[LoadingStage] Loading plane: ${planeConfig.id}`);

    try {
      // Parallel loading: world + plane + cake + balloons + dogs
      const [worldEntry, planeResult, cakeModel, balloonModel, dogSit, dogStand] = await Promise.all([
        this.worldManager.loadWorld(worldConfig.id, (progress) => {
          this._updateProgress(progress * 0.55, `Loading ${worldConfig.title}...`);
        }),
        this.planeLoader.load(planeConfig.model).then((result) => {
          this._updateProgress(0.70, 'Preparing...');
          return result;
        }),
        this._loadGLB('/cake.glb', 'cake').then((model) => {
          this._updateProgress(0.80, 'Almost ready...');
          return model;
        }),
        this._loadGLB('/colorful_balloons.glb', 'balloons').then((model) => {
          this._updateProgress(0.88, 'Loading characters...');
          return model;
        }),
        this._loadGLB('/characters/dog/shiba_dog_sit.glb', 'dog-sit').then((m) => {
          this._updateProgress(0.94, 'Ready!');
          return m;
        }),
        this._loadGLB('/characters/dog/shiba_dog_stand.glb', 'dog-stand'),
      ]);

      this._updateProgress(1.0, 'Done!');

      // Store in shared state
      this.stageManager.sharedState.worldEntry = worldEntry;
      this.stageManager.sharedState.worldConfig = worldConfig;
      this.stageManager.sharedState.planeModel = planeResult.model;
      this.stageManager.sharedState.planeConfig = planeConfig;
      this.stageManager.sharedState.cargoSlot = planeResult.cargoSlot;
      this.stageManager.sharedState.cakeModel = cakeModel;
      this.stageManager.sharedState.balloonModel = balloonModel;
      this.stageManager.sharedState.dogSitModel = dogSit;
      this.stageManager.sharedState.dogStandModel = dogStand;
      this.stageManager.sharedState.boundingBox = worldEntry.boundingBox;

      // Activate world in scene
      this.worldManager.activateWorld(worldConfig.id);

      // Log bounding box info
      console.log('[LoadingStage] World loaded successfully');
      console.log('[LoadingStage] Bounding box:', worldEntry.boundingBox);

      // Reveal animation then transition to exploration
      await this._revealScene();

      this.stageManager.sharedState.worldManager = this.worldManager;
      this.stageManager.next();

    } catch (error) {
      console.error('[LoadingStage] Loading failed:', error);
      if (this.loadingText) {
        this.loadingText.textContent = 'Loading failed. Please refresh.';
      }
    }
  }

  /**
   * Exit loading stage
   */
  exit() {
    // Loading screen already hidden by reveal
  }

  /**
   * Update progress bar
   * @private
   */
  _updateProgress(progress, text) {
    if (this.progressFill) {
      this.progressFill.style.width = `${Math.min(progress * 100, 100)}%`;
    }
    if (this.loadingText && text) {
      this.loadingText.textContent = text;
    }
  }

  /**
   * Generic GLB loader
   * @private
   */
  _loadGLB(url, name) {
    return new Promise((resolve) => {
      this.cakeLoader.load(
        url,
        (gltf) => {
          const model = gltf.scene;
          model.name = name;
          model.traverse((child) => {
            if (child.isMesh) {
              child.castShadow = true;
              child.receiveShadow = true;
            }
          });
          console.log(`[LoadingStage] ${name} loaded`);
          resolve(model);
        },
        undefined,
        () => {
          console.warn(`[LoadingStage] ${name} not found, skipping`);
          resolve(null);
        }
      );
    });
  }

  /**
   * Reveal the 3D scene
   * @private
   */
  _revealScene() {
    return new Promise((resolve) => {
      if (this.loadingScreen) {
        this.loadingScreen.classList.add('revealing');
        setTimeout(() => {
          this.loadingScreen.classList.add('hidden');
          resolve();
        }, 1600);
      } else {
        resolve();
      }
    });
  }
}
