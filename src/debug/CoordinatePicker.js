/**
 * CoordinatePicker — Click to pick 3D coordinates
 *
 * Always active. Click (not drag) on scene → red sphere marker ↓
 * Coordinates shown in output panel + console log.
 * Perfect for designing flight paths.
 */

import * as THREE from 'three';

export class CoordinatePicker {
  /**
   * @param {object} options
   * @param {THREE.Camera} options.camera
   * @param {THREE.Scene} options.scene
   * @param {HTMLElement} options.domElement
   */
  constructor(options) {
    this.camera = options.camera;
    this.scene = options.scene;
    this.domElement = options.domElement;

    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2();

    this._active = false;
    this._pickedPoints = [];
    this._markers = new THREE.Group();
    this._markers.name = 'debug-picked-points';

    // Drag detection — avoid conflict with OrbitControls
    this._mouseDown = new THREE.Vector2();
    this._mouseUp = new THREE.Vector2();

    this._boundMouseDown = this._onMouseDown.bind(this);
    this._boundMouseUp = this._onMouseUp.bind(this);

    this._output = null;
  }

  /**
   * Activate coordinate picking
   */
  activate() {
    this._active = true;
    this.domElement.addEventListener('pointerdown', this._boundMouseDown);
    this.domElement.addEventListener('pointerup', this._boundMouseUp);
    this.scene.add(this._markers);

    // Output panel — bottom-right, shows picked coordinates as JS arrays
    this._output = document.createElement('div');
    this._output.id = 'debug-coord-output';
    Object.assign(this._output.style, {
      position: 'fixed',
      bottom: '10px',
      right: '10px',
      zIndex: '200',
      background: 'rgba(42, 37, 32, 0.92)',
      color: '#FF5555',
      fontFamily: 'monospace',
      fontSize: '12px',
      padding: '10px 12px',
      borderRadius: '6px',
      maxWidth: '340px',
      maxHeight: '240px',
      overflowY: 'auto',
      pointerEvents: 'auto',
      border: '1px solid #FF5555',
      lineHeight: '1.8',
      whiteSpace: 'pre-wrap',
    });
    this._output.textContent = '🖱  Click scene to pick coordinates';
    document.body.appendChild(this._output);

    console.log('[CoordinatePicker] Active — click scene, see RED spheres');
  }

  /**
   * Deactivate
   */
  deactivate() {
    this._active = false;
    this.domElement.removeEventListener('pointerdown', this._boundMouseDown);
    this.domElement.removeEventListener('pointerup', this._boundMouseUp);
    if (this._output) {
      this._output.remove();
      this._output = null;
    }
  }

  /**
   * @private
   */
  _onMouseDown(event) {
    this._mouseDown.set(event.clientX, event.clientY);
  }

  /**
   * On pointer up: only raycast if click (not drag > 3px)
   * @private
   */
  _onMouseUp(event) {
    if (!this._active) return;

    this._mouseUp.set(event.clientX, event.clientY);
    const dx = this._mouseUp.x - this._mouseDown.x;
    const dy = this._mouseUp.y - this._mouseDown.y;
    if (Math.abs(dx) > 3 || Math.abs(dy) > 3) return; // Was a drag

    // Normalize
    this.mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    this.mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

    // Raycast scene (exclude debug objects)
    this.raycaster.setFromCamera(this.mouse, this.camera);

    const meshes = [];
    this.scene.traverse((child) => {
      if (child.isMesh) {
        let parent = child.parent;
        let isDebug = false;
        while (parent) {
          if (parent.name?.startsWith('debug-')) { isDebug = true; break; }
          parent = parent.parent;
        }
        if (!isDebug) meshes.push(child);
      }
    });

    const intersects = this.raycaster.intersectObjects(meshes, false);

    if (intersects.length > 0) {
      const point = intersects[0].point;
      const index = this._pickedPoints.length + 1;
      this._pickedPoints.push(point);

      // --- 🔴 RED sphere marker ---
      const sphereGeo = new THREE.SphereGeometry(0.5, 16, 12);
      const sphereMat = new THREE.MeshBasicMaterial({ color: 0xFF3333 });
      const marker = new THREE.Mesh(sphereGeo, sphereMat);
      marker.position.copy(point);
      marker.name = `picked-${index}`;
      this._markers.add(marker);

      // --- 🔴 Tiny ring for visibility at distance ---
      const ringGeo = new THREE.TorusGeometry(0.65, 0.08, 8, 16);
      const ringMat = new THREE.MeshBasicMaterial({ color: 0xFF3333 });
      const ring = new THREE.Mesh(ringGeo, ringMat);
      ring.position.copy(point);
      ring.name = `ring-${index}`;
      this._markers.add(ring);

      // Format coordinate
      const coordStr = `[${point.x.toFixed(2)}, ${point.y.toFixed(2)}, ${point.z.toFixed(2)}]`;

      // Console log (copy-paste ready)
      console.log(`%c📍 Point ${index}: %c${coordStr}`,
        'color: #FF5555; font-weight: bold;', 'color: #FFC856;');

      // Update output panel with numbered list
      if (this._output) {
        const lines = this._pickedPoints.map((p, i) =>
          `  ${String(i + 1).padStart(2)}: [${p.x.toFixed(2)}, ${p.y.toFixed(2)}, ${p.z.toFixed(2)}]`
        );
        this._output.textContent = `📍 Picked Points (${this._pickedPoints.length}):\n` + lines.join(',\n');
      }
    }
  }

  /**
   * Get picked points as JS array ready for config
   * @returns {number[][]}
   */
  getPickedPoints() {
    return this._pickedPoints.map((p) => [
      parseFloat(p.x.toFixed(2)),
      parseFloat(p.y.toFixed(2)),
      parseFloat(p.z.toFixed(2)),
    ]);
  }

  /**
   * Clear all markers + points
   */
  clear() {
    this._pickedPoints = [];
    this._markers.traverse((obj) => {
      if (obj.geometry) obj.geometry.dispose();
      if (obj.material) obj.material.dispose();
    });
    while (this._markers.children.length > 0) {
      this._markers.remove(this._markers.children[0]);
    }
    if (this._output) {
      this._output.textContent = '🖱  Click scene to pick coordinates';
    }
    console.log('[CoordinatePicker] Cleared all points');
  }

  dispose() {
    this.deactivate();
    this.clear();
    this.scene.remove(this._markers);
  }
}
