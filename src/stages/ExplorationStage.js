/**
 * ExplorationStage — Post-flight sequence
 *
 * 1. Dissolve plane + sitting dog — particles (1s)
 * 2. Wait 0.5s
 * 3. Generate standing dog facing plane's final heading
 * 4. Wait 1s, then pop cake + balloons
 *
 * ═══ USER-ADJUSTABLE SETTINGS ═══
 * All at the top of this file — position, scale, timing, etc.
 */

import * as THREE from 'three';
import { ExplorationControls } from '../controls/ExplorationControls.js';
import { ParticleEffect } from '../effects/ParticleEffect.js';
import gsap from 'gsap';

// ====================== TUNABLE ======================

/** Standing dog world position */
const DOG_STAND_X = -8.03;
const DOG_STAND_Y = 6.38;
const DOG_STAND_Z = 1.40;

/** Cake X/Z position (Y pops from -5 underground → pop target) */
const CAKE_X = -9.25;
const CAKE_Z = -1.85;
const CAKE_POP_Y = 4.74;            // Final cake Y after pop

/** Dog size multiplier relative to plane visible size */
const DOG_SIZE_MULTIPLIER = 0.5;  // 0.3 = 30% of plane size

/** Timing (seconds) */
const DISSOLVE_DURATION = 1.0;
const WAIT_AFTER_DISSOLVE = 1.0;
const GENERATE_DURATION = 1.0;
const WAIT_BEFORE_CAKE = 1.0;

/** Balloons: [x, finalY, z] */
const BALLOON_POSITIONS = [
  [-6.38, 7, 5.65],
  [-5.43, 7, -4.20],
];

/** Camera */
const CAM_POS = [-22.02, 12.31, -6.37];
const CAM_TARGET = [-3.17, 3.19, -1.04];

// ======================================================

export class ExplorationStage {
  constructor(stageManager) {
    this.stageManager = stageManager;
    this.engine = stageManager.engine;
    this.controls = null;
    this.particles = new ParticleEffect(this.engine.scene);
    this._updateId = 'exploration-stage';
    this._sequenceStep = 0;
    this._timer = 0;
    this._risen = false;
    this._cake = null;
    this._balloons = [];
    this._dogStand = null;
  }

  async enter() {
    const { boundingBox, cakeModel, balloonModel, dogStandModel, planeModel, planeFinalQuat } = this.stageManager.sharedState;

    // --- OrbitControls ---
    this.controls = new ExplorationControls({
      camera: this.engine.camera,
      domElement: this.engine.renderer.domElement,
    });
    this.engine.camera.position.set(CAM_POS[0], CAM_POS[1], CAM_POS[2]);
    this.controls.setTarget(new THREE.Vector3(CAM_TARGET[0], CAM_TARGET[1], CAM_TARGET[2]));
    this.controls.enable();

    // --- Debug ---
    const pathViz = window.__pathVisualizer;
    if (pathViz && boundingBox) pathViz.drawBoundingBox(boundingBox);

    this.engine.addUpdateCallback(this._updateId, (dt) => this.update(dt));

    // --- STEP 1: Dissolve plane + sitting dog ---
    if (planeModel) {
      await this.particles.dissolve(planeModel, DISSOLVE_DURATION);
      if (planeModel.parent) planeModel.parent.remove(planeModel);
    }

    // --- STEP 2: Wait ---
    await this._delay(WAIT_AFTER_DISSOLVE);

    // --- STEP 3: Generate standing dog ---
    if (dogStandModel) {
      dogStandModel.name = 'dog-stand';
      dogStandModel.visible = false;
      this.engine.scene.add(dogStandModel);

      // Scale
      const planeSize = this.stageManager.sharedState.planeTargetSize || 4;
      const db = new THREE.Box3().setFromObject(dogStandModel);
      const ds = new THREE.Vector3(); db.getSize(ds);
      const dm = Math.max(ds.x, ds.y, ds.z, 0.01);
      dogStandModel.scale.setScalar(planeSize * DOG_SIZE_MULTIPLIER / dm);

      // Position
      dogStandModel.position.set(DOG_STAND_X, DOG_STAND_Y, DOG_STAND_Z);

      // Face cake at all times
      dogStandModel.lookAt(CAKE_X, 6, CAKE_Z);

      await this.particles.generate(dogStandModel, GENERATE_DURATION);
      this._dogStand = dogStandModel;
    }

    // --- STEP 4: Prepare cake & balloons, pop after delay ---
    this._timer = 0;
    this._sequenceStep = 1;

    if (cakeModel) this._setupCake(cakeModel);
    if (balloonModel) this._setupBalloons(balloonModel);
  }

  update(dt) {
    if (this.controls) this.controls.update();

    const am = this.stageManager.sharedState.audioManager;
    if (am) am.update(dt);

    // Cake/balloon rise trigger
    if (this._sequenceStep === 1) {
      this._timer += dt;
      if (this._timer >= WAIT_BEFORE_CAKE && !this._risen) {
        this._risen = true;
        this._popAll();
        this._sequenceStep = 2;
      }
    }

    // Rotate cake + balloons after rise
    if (this._risen) {
      if (this._cake) this._cake.rotation.y += dt * 0.2;
      this._balloons.forEach((b) => { b.model.rotation.y += dt * 0.15; });
    }
  }

  // ==================== Cake ====================
  _setupCake(cakeModel) {
    this._cake = cakeModel;
    this.engine.scene.add(this._cake);
    const box = new THREE.Box3().setFromObject(this._cake);
    const sz = new THREE.Vector3(); box.getSize(sz);
    this._cake.scale.setScalar(4 / Math.max(sz.x, sz.y, sz.z, 0.01));
    this._cake.position.set(CAKE_X, -5, CAKE_Z);
  }

  // ==================== Balloons ====================
  _setupBalloons(balloonModel) {
    BALLOON_POSITIONS.forEach(([x, targetY, z], i) => {
      const b = balloonModel.clone();
      b.name = `balloon-${i + 1}`;
      const box = new THREE.Box3().setFromObject(b);
      const sz = new THREE.Vector3(); box.getSize(sz);
      b.scale.setScalar(5 / Math.max(sz.x, sz.y, sz.z, 0.01));
      b.position.set(x, -8, z);
      this.engine.scene.add(b);
      this._balloons.push({ model: b, targetY });
    });
  }

  // ==================== Pop ====================
  _popAll() {
    if (this._cake) {
      gsap.to(this._cake.position, { y: CAKE_POP_Y, duration: 2, ease: 'back.out(1.5)' });
    }
    this._balloons.forEach((b) => {
      gsap.to(b.model.position, { y: b.targetY, duration: 2.5, ease: 'back.out(1.2)' });
    });
  }

  _delay(seconds) { return new Promise((r) => setTimeout(r, seconds * 1000)); }

  exit() {
    if (this.controls) { this.controls.disable(); this.controls.dispose(); this.controls = null; }
    this.engine.removeUpdateCallback(this._updateId);
  }
}
