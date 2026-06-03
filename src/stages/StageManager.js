/**
 * StageManager — State machine for experience stages
 *
 * FLOW: selection → loading → flight → exploration
 */

import { LoadingStage } from './LoadingStage.js';
import { FlightStage } from './FlightStage.js';
import { ExplorationStage } from './ExplorationStage.js';

export class StageManager {
  constructor(options) {
    this.engine = options.engine;
    this.debug = options.debug || false;
    this.stages = new Map();
    this.currentStage = null;
    this.previousStage = null;

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
    this.previousStage = this.currentStage;
    this.currentStage = name;
    if (stage.enter) stage.enter(this.sharedState);
    if (this.debug) console.log(`[StageManager] ${this.previousStage || 'start'} → ${name}`);
  }

  next() {
    const order = ['loading', 'flight', 'exploration'];
    const idx = order.indexOf(this.currentStage);
    if (idx >= 0 && idx < order.length - 1) this.enter(order[idx + 1]);
  }
}
