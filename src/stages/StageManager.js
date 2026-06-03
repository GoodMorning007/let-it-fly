/**
 * StageManager — State machine for experience stages
 *
 * FLOW: loading → flight → exploration
 *
 * Debug: debugEnter(stageName) provides direct-stage access.
 * QA mode: all stages run in order, restrictions bypassed.
 */

import { getEnvironmentMode, ENV } from '../config/environment.js';
import { LoadingStage } from './LoadingStage.js';
import { FlightStage } from './FlightStage.js';
import { ExplorationStage } from './ExplorationStage.js';

export class StageManager {
  constructor(options) {
    this.engine = options.engine;
    this._env = getEnvironmentMode();
    this.stages = new Map();
    this.currentStage = null;
    this.previousStage = null;
    this._debugRouteTarget = null;

    this.sharedState = {
      selectedPlaneId: null,
      selectedWorldId: null,
      planeModel: null,
      planeConfig: null,
      cargoSlot: null,
      cakeModel: null,
      balloonModel: null,
      dogSitModel: null,
      dogStandModel: null,
      planeTargetSize: null,
      planeFinalQuat: null,
      worldEntry: null,
      worldConfig: null,
      boundingBox: null,
    };

    this.registerStage('loading', new LoadingStage(this));
    this.registerStage('flight', new FlightStage(this));
    this.registerStage('exploration', new ExplorationStage(this));
  }

  registerStage(name, stage) { this.stages.set(name, stage); }
  getStage(name) { return this.stages.get(name); }

  enter(name) {
    const stage = this.stages.get(name);
    if (!stage) { console.error(`[StageManager] Stage "${name}" not found`); return; }
    if (this.currentStage) {
      const cs = this.stages.get(this.currentStage);
      if (cs?.exit) cs.exit();
    }

    const prev = this.currentStage;
    this.previousStage = prev;
    this.currentStage = name;

    // Stage transition log
    console.log('%c[STAGE] %c' + (prev || 'start') + '%c → %c' + name,
      'color:rgba(255,255,255,0.5);',
      'color:rgba(255,255,255,0.45);',
      'color:rgba(255,255,255,0.35);',
      'color:#F3F5F7;font-weight:bold;');

    // Ensure canvas is visible for engine stages
    if (['loading', 'flight', 'exploration'].includes(name)) {
      const cc = document.getElementById('canvas-container');
      if (cc) cc.classList.add('active');
    }

    if (stage.enter) stage.enter(this.sharedState);
  }

  /**
   * Debug entry — direct engine-stage jump.
   */
  debugEnter(stageName) {
    const valid = ['loading', 'flight', 'exploration'];
    if (!valid.includes(stageName)) {
      console.warn(`[StageManager] debugEnter: "${stageName}" not a valid engine stage, falling back to loading`);
      stageName = 'loading';
    }

    // Hide intro DOM
    ['intro-video', 'intro-overlay', 'intro-text-container', 'intro-buttons'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.style.display = 'none';
    });

    this._debugRouteTarget = stageName;
    this.enter('loading');
  }

  next() {
    const order = ['loading', 'flight', 'exploration'];

    if (this._debugRouteTarget) {
      const target = this._debugRouteTarget;
      this._debugRouteTarget = null;
      const currentIdx = order.indexOf(this.currentStage);
      const targetIdx = order.indexOf(target);

      if (targetIdx === currentIdx) return;
      if (targetIdx > currentIdx + 1) {
        this.enter(target);
        return;
      }
      // targetIdx === currentIdx + 1 → fall through to normal next()
    }

    const idx = order.indexOf(this.currentStage);
    if (idx >= 0 && idx < order.length - 1) this.enter(order[idx + 1]);
  }
}
