/**
 * Gate config — controls site unlock timing
 * CountdownStage reads releaseDate from here exclusively.
 */

export const GATE_CONFIG = {
  releaseDate: '2026-06-05T00:00:00+08:00',

  /** Set to false to disable countdown (always skip) */
  enableCountdown: true,

  /** URL param name for debug bypass */
  debugParam: 'debug',

  /** URL param name for direct stage routing (requires debug=true) */
  stageParam: 'stage',
};
