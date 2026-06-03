/**
 * FlightStage — Scroll-driven cinematic flight
 *
 * ═══ USER-ADJUSTABLE SETTINGS ═══
 */

import * as THREE from 'three';
import { PlanePath } from '../flight/PlanePath.js';
import { CameraPath } from '../flight/CameraPath.js';
import { PlaneMotion } from '../flight/PlaneMotion.js';
import { AudioManager } from '../audio/AudioManager.js';
import { lerp } from '../core/utils.js';

// ====================== TUNABLE ======================

/** Sitting dog on plane */
const DOG_SIT_SIZE = 0.3;        // Dog = plane × multiplier
const DOG_SIT_X = 0;             // Forward/back on plane (±)
const DOG_SIT_Y_RATIO = 0.8;     // Height on plane (ratio of plane height)
const DOG_SIT_Z = 0;             // Left/right on plane (±)
const DOG_SIT_ROT_Y = Math.PI;         // Y rotation to align dog head with plane nose (rad)
                                  //   Math.PI = 180° flip, Math.PI/2 = 90°

/** Scroll control */
const WHEEL_SPEED = 0.00015;     // How much 1 wheel tick advances progress
const AUTO_ADVANCE = 0.008;      // Auto-advance speed when idle
const PROGRESS_SMOOTH = 0.03;    // Lerp smooth factor (lower = smoother)
const KEY_STEP = 0.005;          // Arrow key step

/** Plane size */
const PLANE_SIZE_RATIO = 0.01;   // Plane = scene max dim × ratio
const PLANE_MIN_SIZE = 2;        // Minimum plane size

/** Landing */
const LANDING_THRESHOLD = 0.99;  // Progress where landing triggers
const LANDING_TRANSITION_MS = 2000; // Delay before exploration

// ======================================================

export class FlightStage {
  /**
   * @param {import('./StageManager.js').StageManager} stageManager
   */
  constructor(stageManager) {
    this.stageManager = stageManager;
    this.engine = stageManager.engine;

    this.planePath = null;
    this.cameraPath = null;
    this.planeMotion = null;
    this.audioManager = null;

    this.progress = 0;
    this.targetProgress = 0;
    this._scrollAccum = 0;

    this._updateId = 'flight-stage';
    this._lights = [];

    // Scroll indicator
    this._scrollIndicator = document.getElementById('scroll-indicator');
    this._landingPrompt = document.getElementById('landing-prompt');

    // Bound handlers
    this._onWheel = this._onWheel.bind(this);
    this._onKeyDown = this._onKeyDown.bind(this);
  }

  /**
   * Enter flight stage
   */
  enter() {
    const { worldConfig, planeModel, boundingBox } = this.stageManager.sharedState;

    // --- Show scroll runway (creates scrollable space) ---
    const runway = document.getElementById('scroll-runway');
    if (runway) runway.style.display = 'block';

    // --- Add lights ---
    this._addLights();

    // --- Build paths ---
    this.planePath = new PlanePath(worldConfig.flightPath);
    this.cameraPath = new CameraPath(worldConfig.cameraPath);

    // --- Audio ---
    this.audioManager = new AudioManager();
    if (worldConfig.music) {
      this.audioManager.load(worldConfig.music).then(() => {
        this.audioManager.play(3);
        console.log('[FlightStage] Music playing:', worldConfig.music);
      });
    }
    this.stageManager.sharedState.audioManager = this.audioManager;

    // --- Setup Plane ---
    if (planeModel) {
      planeModel.name = 'plane';
      this.engine.scene.add(planeModel);

      // Normalize
      const planeBox = new THREE.Box3().setFromObject(planeModel);
      const planeSize = new THREE.Vector3();
      planeBox.getSize(planeSize);
      const planeMaxDim = Math.max(planeSize.x, planeSize.y, planeSize.z, 0.01);
      const sceneBbox = boundingBox;
      let targetSize = 5;
      if (sceneBbox && !sceneBbox.isEmpty()) {
        const sz = new THREE.Vector3();
        sceneBbox.getSize(sz);
        targetSize = Math.max(Math.max(sz.x, sz.y, sz.z) * PLANE_SIZE_RATIO, PLANE_MIN_SIZE);
      }
      planeModel.scale.setScalar(targetSize / planeMaxDim);
      this.stageManager.sharedState.planeTargetSize = targetSize;

      // PlaneMotion handles position/rotation
      this.planeMotion = new PlaneMotion(this.planePath, planeModel);

      // --- Attach sitting dog on the plane ---
      const dogSit = this.stageManager.sharedState.dogSitModel;
      if (dogSit) {
        const dogBox = new THREE.Box3().setFromObject(dogSit);
        const dogSize = new THREE.Vector3();
        dogBox.getSize(dogSize);
        const dogMaxDim = Math.max(dogSize.x, dogSize.y, dogSize.z, 0.01);
        dogSit.scale.setScalar(targetSize * DOG_SIT_SIZE / dogMaxDim);
        dogSit.position.set(DOG_SIT_X, planeSize.y * DOG_SIT_Y_RATIO, DOG_SIT_Z);
        dogSit.rotation.set(0, DOG_SIT_ROT_Y, 0); // Align head with plane nose
        dogSit.name = 'dog-sit';
        planeModel.add(dogSit); // Child of plane → moves with plane
        console.log('[FlightStage] 🐕 Dog riding plane');
      }
    }

    // --- Progress & scroll ---
    this.progress = 0;
    this.targetProgress = 0.01; // Start with a tiny push
    this._scrollAccum = 0;

    window.addEventListener('wheel', this._onWheel, { passive: false });
    window.addEventListener('keydown', this._onKeyDown);

    // Show scroll indicator
    if (this._scrollIndicator) {
      this._scrollIndicator.style.display = 'flex';
      this._scrollIndicator.style.opacity = '1';
    }

    // --- Draw debug overlays ---
    const bbox = this.stageManager.sharedState.boundingBox;
    const pathViz = window.__pathVisualizer;
    if (pathViz) {
      if (bbox) pathViz.drawBoundingBox(bbox);
      // Flight path hidden — uncomment to debug:
      // if (worldConfig.flightPath) pathViz.drawFlightPath(worldConfig.flightPath);
    }

    // --- Register update loop ---
    this.engine.addUpdateCallback(this._updateId, (dt) => this.update(dt));

    console.log('[FlightStage] Ready — scroll to fly');
  }

  /**
   * Per-frame update
   */
  update(dt) {
    const elapsed = this.engine.elapsed;

    // Audio update
    if (this.audioManager) this.audioManager.update(dt);

    // Smooth progress interpolation
    this.progress = lerp(this.progress, this.targetProgress, PROGRESS_SMOOTH);

    // Auto-advance slightly if no scroll (initial push)
    if (this._scrollAccum < 0.0001 && this.targetProgress < 0.02) {
      this.targetProgress += dt * AUTO_ADVANCE;
    }
    this._scrollAccum *= 0.96; // Decay

    // Clamp
    this.progress = Math.max(0, Math.min(this.progress, 1));
    this.targetProgress = Math.max(0, Math.min(this.targetProgress, 1));

    // --- Update plane ---
    if (this.planeMotion) {
      this.planeMotion.update(this.progress, elapsed);
    }

    // --- Update camera (follow cameraPath, look at plane) ---
    if (this.cameraPath && this.planeMotion) {
      const camT = Math.min(this.progress, 0.999);
      const camPos = this.cameraPath.getPoint(camT);
      this.engine.camera.position.copy(camPos);

      // Look at plane
      const planeModel = this.stageManager.sharedState.planeModel;
      if (planeModel) {
        this.engine.camera.lookAt(planeModel.position);
      }
    }

    // --- Landing detection ---
    if (this.progress >= LANDING_THRESHOLD) {
      // Store plane's final heading for standing dog
      const pm = this.stageManager.sharedState.planeModel;
      if (pm) this.stageManager.sharedState.planeFinalQuat = pm.quaternion.clone();

      // Hide scroll indicator
      if (this._scrollIndicator) {
        this._scrollIndicator.style.opacity = '0';
      }
      // Show landing prompt
      if (this._landingPrompt) {
        this._landingPrompt.style.opacity = '1';
      }
      // Transition to exploration after a moment
      setTimeout(() => {
        if (this.stageManager.currentStage === 'flight') {
          this.stageManager.next();
        }
      }, LANDING_TRANSITION_MS);
    }

    // --- Debug update ---
    const debugGUI = window.__debugGUI;
    if (debugGUI && debugGUI.panel) {
      // Update progress display in debug
      const fpsEl = debugGUI.panel.querySelector('#debug-fps');
      if (fpsEl) {
        fpsEl.textContent = `Prog: ${(this.progress * 100).toFixed(1)}% | Speed: ${this.targetProgress.toFixed(4)}`;
      }
    }
  }

  /**
   * Wheel event → progress
   * @private
   */
  _onWheel(event) {
    event.preventDefault();
    const delta = event.deltaY;
    this._scrollAccum += Math.abs(delta);

    // Map wheel delta to progress increment
    const inc = delta * WHEEL_SPEED;
    this.targetProgress += inc;
    this.targetProgress = Math.max(0, Math.min(this.targetProgress, 1));
  }

  /**
   * Arrow keys as fallback control
   * @private
   */
  _onKeyDown(event) {
    switch (event.key) {
      case 'ArrowDown':
      case 'ArrowRight':
        this.targetProgress += KEY_STEP;
        break;
      case 'ArrowUp':
      case 'ArrowLeft':
        this.targetProgress -= KEY_STEP;
        break;
    }
    this.targetProgress = Math.max(0, Math.min(this.targetProgress, 1));
  }

  /**
   * Add scene lighting
   * @private
   */
  _addLights() {
    const ambient = new THREE.AmbientLight(0xFFF5E8, 0.6);
    ambient.name = 'flight-ambient';
    this.engine.scene.add(ambient);
    this._lights.push(ambient);

    const dir = new THREE.DirectionalLight(0xFFFFFF, 1.2);
    dir.position.set(10, 20, 10);
    dir.castShadow = true;
    dir.shadow.mapSize.width = 1024;
    dir.shadow.mapSize.height = 1024;
    dir.shadow.camera.near = 0.5;
    dir.shadow.camera.far = 100;
    dir.name = 'flight-directional';
    this.engine.scene.add(dir);
    this._lights.push(dir);

    const fill = new THREE.DirectionalLight(0xC8D8E8, 0.4);
    fill.position.set(-5, 3, -5);
    fill.name = 'flight-fill';
    this.engine.scene.add(fill);
    this._lights.push(fill);
  }

  /**
   * Exit flight stage
   */
  exit() {
    window.removeEventListener('wheel', this._onWheel);
    window.removeEventListener('keydown', this._onKeyDown);

    // Hide scroll runway
    const runway = document.getElementById('scroll-runway');
    if (runway) runway.style.display = 'none';

    // Hide indicators
    if (this._scrollIndicator) this._scrollIndicator.style.opacity = '0';
    if (this._landingPrompt) this._landingPrompt.style.opacity = '0';

    this.engine.removeUpdateCallback(this._updateId);
  }
}
