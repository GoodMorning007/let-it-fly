/**
 * Let It Fly — Entry Point
 *
 * Flow: Intro video → Typewriter → Buttons → Happy Birthday
 */

import { Engine } from './core/Engine.js';
import { StageManager } from './stages/StageManager.js';
import { IntroStage } from './stages/IntroStage.js';
import { DebugGUI } from './debug/DebugGUI.js';
import { CoordinatePicker } from './debug/CoordinatePicker.js';
import { PathVisualizer } from './debug/PathVisualizer.js';

const isDebug = import.meta.env.DEV; // Auto: ON in dev, OFF in `vite build`

// Engine (hidden during intro)
const engine = new Engine({
  container: document.getElementById('canvas-container'),
  debug: isDebug,
});

// Stage manager (happy_birthday flow)
const stageManager = new StageManager({ engine, debug: isDebug });

// Debug tools — only in development
let debugGUI, coordinatePicker, pathVisualizer;

if (isDebug) {
  debugGUI = new DebugGUI({ engine, stageManager });
  debugGUI.init();

  coordinatePicker = new CoordinatePicker({
    camera: engine.camera,
    scene: engine.scene,
    domElement: engine.renderer.domElement,
  });
  coordinatePicker.activate();

  pathVisualizer = new PathVisualizer({ scene: engine.scene, stageManager });
  pathVisualizer.build();

  window.__coordinatePicker = coordinatePicker;
  window.__pathVisualizer = pathVisualizer;
  window.__debugGUI = debugGUI;
}

// Start render loop
engine.start();

// --- Cinematic Intro ---
const intro = new IntroStage(engine, () => {
  stageManager.enter('loading');
});
intro.start();

// Resize
window.addEventListener('resize', () => engine.handleResize(), { passive: true });
