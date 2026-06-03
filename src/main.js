/**
 * Let It Fly — Entry Point
 *
 * Modes (controlled by src/config/environment.js):
 *   PRODUCTION — CountdownStage → PasswordStage → IntroStage → StageManager
 *   DEBUG      — Skip gates, direct stage access (?debug=true&stage=XXX)
 *   QA         — Full journey, bypass restrictions only (?qa=true)
 */

import { getEnvironmentMode, ENV, isDevMode } from './config/environment.js';
import { Engine } from './core/Engine.js';
import { StageManager } from './stages/StageManager.js';
import { GateRouter } from './core/GateRouter.js';
import { IntroStage } from './stages/IntroStage.js';
import { CountdownStage } from './stages/CountdownStage.js';
import { PasswordStage } from './stages/PasswordStage.js';
import { GATE_CONFIG } from './config/gate.js';
import { DebugGUI } from './debug/DebugGUI.js';
import { CoordinatePicker } from './debug/CoordinatePicker.js';
import { PathVisualizer } from './debug/PathVisualizer.js';

const envMode = getEnvironmentMode();

// --- Resolve route ---
const router = new GateRouter(GATE_CONFIG);
const route = router.resolve();

// --- Engine ---
const engine = new Engine({
  container: document.getElementById('canvas-container'),
  debug: route.isDebug,
});

// --- Stage manager ---
const stageManager = new StageManager({ engine });

// --- Debug tools — only in DEBUG mode (not QA, not production) ---
if (route.isDebug) {
  const debugGUI = new DebugGUI({ engine, stageManager });
  debugGUI.init();

  const coordinatePicker = new CoordinatePicker({
    camera: engine.camera,
    scene: engine.scene,
    domElement: engine.renderer.domElement,
  });
  coordinatePicker.activate();

  const pathVisualizer = new PathVisualizer({ scene: engine.scene, stageManager });
  pathVisualizer.build();

  window.__coordinatePicker = coordinatePicker;
  window.__pathVisualizer = pathVisualizer;
  window.__debugGUI = debugGUI;
}

// Start render loop
engine.start();

// --- Environment badge ---
if (isDevMode()) {
  _createEnvBadge(envMode);
}

// --- Stage callbacks ---
const startIntro = () => {
  const intro = new IntroStage(engine, () => {
    stageManager.enter('loading');
  });
  intro.start();
};

const startPassword = () => {
  const password = new PasswordStage(startIntro);
  password.start();
};

const startCountdown = () => {
  const countdown = new CountdownStage(startPassword);
  countdown.start();
};

// --- Routing ---
if (route.isQA) {
  // ========== QA MODE — Full journey, restrictions bypassed ==========
  startCountdown();

} else if (route.isDebug) {
  // ========== DEBUG MODE — Direct stage access ==========
  switch (route.handler) {
    case 'countdown':
      startCountdown();
      break;
    case 'password':
      startPassword();
      break;
    case 'intro':
      startIntro();
      break;
    case 'loading':
    case 'flight':
    case 'exploration':
      stageManager.debugEnter(route.handler);
      break;
    default:
      startIntro();
  }

} else {
  // ========== PRODUCTION FLOW ==========
  if (GATE_CONFIG.enableCountdown && Date.now() < new Date(GATE_CONFIG.releaseDate).getTime()) {
    startCountdown();
  } else {
    startPassword();
  }
}

// Resize
window.addEventListener('resize', () => engine.handleResize(), { passive: true });

// ---------------------------------------------------
// Helpers
// ---------------------------------------------------

function _createEnvBadge(mode) {
  const el = document.createElement('div');
  el.id = 'env-badge';
  el.textContent = mode === ENV.QA ? 'QA MODE' : 'DEBUG MODE';
  el.style.color = mode === ENV.QA ? '#D4A574' : '#8FCB9B';
  document.body.appendChild(el);
}
