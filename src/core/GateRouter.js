/**
 * GateRouter — Stage routing based on environment mode
 *
 * Uses centralized getEnvironmentMode() for all routing decisions.
 * No duplicated URL parsing.
 */

import { getEnvironmentMode, ENV } from '../config/environment.js';

// Keyed by ?stage= value. Routes define stage type & target handler.
const STAGE_ROUTES = {
  countdown:    { type: 'gate',   handler: 'countdown' },
  password:     { type: 'gate',   handler: 'password' },
  intro:        { type: 'gate',   handler: 'intro' },
  landing:      { type: 'gate',   handler: 'intro' },
  selection:    { type: 'engine', handler: 'loading' },
  loading:      { type: 'engine', handler: 'loading' },
  flight:       { type: 'engine', handler: 'flight' },
  exploration:  { type: 'engine', handler: 'exploration' },
};

const DEFAULT_DEBUG_STAGE = 'landing';

export class GateRouter {
  /**
   * @param {object} config — GATE_CONFIG
   */
  constructor(config = {}) {
    this._stageParam = config.stageParam || 'stage';
  }

  /**
   * Resolve the current route based on environment mode.
   * @returns {{
   *   mode: 'production'|'debug'|'qa',
   *   stage: string|null,
   *   handler: string|null,
   *   type: 'gate'|'engine'|null,
   *   skipGate: boolean,
   *   isQA: boolean,
   *   isDebug: boolean,
   * }}
   */
  resolve() {
    const mode = getEnvironmentMode();

    if (mode === ENV.QA) {
      return {
        mode: ENV.QA,
        stage: 'full-sequence',
        handler: 'qa-flow',
        type: 'gate',
        skipGate: false, // QA runs ALL stages
        isQA: true,
        isDebug: false,
      };
    }

    if (mode === ENV.DEBUG) {
      const urlParams = new URLSearchParams(window.location.search);
      const stageParam = urlParams.get(this._stageParam) || DEFAULT_DEBUG_STAGE;
      const route = STAGE_ROUTES[stageParam] || STAGE_ROUTES[DEFAULT_DEBUG_STAGE];

      console.log('%c[STAGE] %c' + stageParam + ' %c→ ' + route.handler + ' (%c' + route.type + '%c)',
        'color:rgba(255,255,255,0.5);',
        'color:#F3F5F7;font-weight:bold;',
        'color:rgba(255,255,255,0.35);',
        'color:rgba(255,255,255,0.45);',
        'color:rgba(255,255,255,0.35);');

      return {
        mode: ENV.DEBUG,
        stage: stageParam,
        handler: route.handler,
        type: route.type,
        skipGate: true,
        isQA: false,
        isDebug: true,
      };
    }

    // Production
    return {
      mode: ENV.PRODUCTION,
      stage: null,
      handler: null,
      type: null,
      skipGate: false,
      isQA: false,
      isDebug: false,
    };
  }
}
