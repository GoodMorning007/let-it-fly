/**
 * DebugGUI — Runtime debug panel
 *
 * Always active during verification phase.
 * Shows:
 * - FPS
 * - Camera Position [x, y, z]
 * - Camera Target [x, y, z]
 * - World Bounding Box (size & center)
 * - Current World ID
 * - Current Stage
 */

import * as THREE from 'three';

export class DebugGUI {
  /**
   * @param {object} options
   * @param {import('../core/Engine.js').Engine} options.engine
   * @param {import('../stages/StageManager.js').StageManager} options.stageManager
   */
  constructor(options) {
    this.engine = options.engine;
    this.stageManager = options.stageManager;
    this.panel = null;
    this._fps = 0;
    this._frameCount = 0;
    this._lastFpsTime = 0;
  }

  /**
   * Initialize the debug panel
   */
  init() {
    this.panel = document.createElement('div');
    this.panel.id = 'debug-gui';
    this.panel.innerHTML = `
      <div id="debug-header">🐞 DEBUG</div>
      <div id="debug-fps">FPS: --</div>
      <hr style="border-color: rgba(255,255,255,0.1); margin: 4px 0;">
      <div id="debug-stage">Stage: --</div>
      <div id="debug-world">World: --</div>
      <hr style="border-color: rgba(255,255,255,0.1); margin: 4px 0;">
      <div id="debug-cam-pos">Cam Pos: (0, 0, 0)</div>
      <div id="debug-cam-target">Cam Target: (0, 0, 0)</div>
      <hr style="border-color: rgba(255,255,255,0.1); margin: 4px 0;">
      <div id="debug-bbox-size">BBox Size: --</div>
      <div id="debug-bbox-center">BBox Center: (0, 0, 0)</div>
      <div id="debug-bbox-min">BBox Min: (0, 0, 0)</div>
      <div id="debug-bbox-max">BBox Max: (0, 0, 0)</div>
      <hr style="border-color: rgba(255,255,255,0.1); margin: 4px 0;">
      <div id="debug-controls">
        <button id="debug-toggle-axes">Toggle Axes</button>
      </div>
    `;

    Object.assign(this.panel.style, {
      position: 'fixed',
      top: '10px',
      right: '10px',
      zIndex: '200',
      background: 'rgba(42, 37, 32, 0.88)',
      color: '#F5F0EB',
      fontFamily: 'monospace',
      fontSize: '12px',
      padding: '12px',
      borderRadius: '8px',
      minWidth: '260px',
      pointerEvents: 'auto',
      lineHeight: '1.7',
      border: '1px solid rgba(255,255,255,0.1)',
    });

    document.body.appendChild(this.panel);

    // Button listeners
    const toggleAxesBtn = this.panel.querySelector('#debug-toggle-axes');
    if (toggleAxesBtn) {
      toggleAxesBtn.addEventListener('click', () => {
        this._toggleAxes();
      });
    }

    // Register FPS counter
    this.engine.addUpdateCallback('debug-gui', (dt) => this.update(dt));
  }

  /**
   * Per-frame update
   */
  update(dt) {
    // FPS
    this._frameCount++;
    this._lastFpsTime += dt;
    if (this._lastFpsTime >= 1.0) {
      this._fps = this._frameCount;
      this._frameCount = 0;
      this._lastFpsTime = 0;
    }

    // Camera Position
    const cam = this.engine.camera;
    this._setText('debug-cam-pos',
      `Cam Pos: (${cam.position.x.toFixed(2)}, ${cam.position.y.toFixed(2)}, ${cam.position.z.toFixed(2)})`);

    // Camera Target (OrbitControls.target for exploration stage)
    const explStage = this.stageManager.getStage('exploration');
    if (explStage?.controls?.controls) {
      const target = explStage.controls.controls.target;
      this._setText('debug-cam-target',
        `Cam Target: (${target.x.toFixed(2)}, ${target.y.toFixed(2)}, ${target.z.toFixed(2)})`);
    }

    // World Bounding Box
    const bbox = this.stageManager.sharedState?.boundingBox;
    if (bbox) {
      const size = new THREE.Vector3();
      const center = new THREE.Vector3();
      bbox.getSize(size);
      bbox.getCenter(center);

      this._setText('debug-bbox-size',
        `BBox Size: ${size.x.toFixed(2)} × ${size.y.toFixed(2)} × ${size.z.toFixed(2)}`);
      this._setText('debug-bbox-center',
        `BBox Center: (${center.x.toFixed(2)}, ${center.y.toFixed(2)}, ${center.z.toFixed(2)})`);
      this._setText('debug-bbox-min',
        `BBox Min: (${bbox.min.x.toFixed(2)}, ${bbox.min.y.toFixed(2)}, ${bbox.min.z.toFixed(2)})`);
      this._setText('debug-bbox-max',
        `BBox Max: (${bbox.max.x.toFixed(2)}, ${bbox.max.y.toFixed(2)}, ${bbox.max.z.toFixed(2)})`);
    }

    // Current World ID
    this._setText('debug-world',
      `World: ${this.stageManager.sharedState?.worldConfig?.id || '--'}`);

    // FPS & Stage
    this._setText('debug-fps', `FPS: ${this._fps}`);
    this._setText('debug-stage', `Stage: ${this.stageManager.currentStage || '--'}`);
  }

  /**
   * Set text content of a debug element
   * @private
   */
  _setText(id, text) {
    const el = this.panel?.querySelector(`#${id}`);
    if (el) el.textContent = text;
  }

  /**
   * Toggle world axes display
   * @private
   */
  _toggleAxes() {
    let axes = this.engine.scene.getObjectByName('debug-axes');
    if (axes) {
      axes.visible = !axes.visible;
      return;
    }
    // Check PathVisualizer's group as well
    const pvGroup = this.engine.scene.getObjectByName('debug-visualizer');
    if (pvGroup) {
      axes = pvGroup.getObjectByName('debug-axes');
      if (axes) {
        axes.visible = !axes.visible;
        return;
      }
    }
    // Create new axes
    axes = new THREE.AxesHelper(50);
    axes.name = 'debug-axes';
    this.engine.scene.add(axes);
  }

  /**
   * Destroy debug panel
   */
  destroy() {
    if (this.panel) {
      this.panel.remove();
      this.panel = null;
    }
    this.engine.removeUpdateCallback('debug-gui');
  }
}
