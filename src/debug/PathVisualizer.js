/**
 * PathVisualizer — Debug visualization helpers
 *
 * Draws: axes, bounding box, and flight path (golden line + control point spheres).
 * Always visible during verification.
 */

import * as THREE from 'three';
import { PlanePath } from '../flight/PlanePath.js';

export class PathVisualizer {
  /**
   * @param {object} options
   * @param {THREE.Scene} options.scene
   * @param {import('../stages/StageManager.js').StageManager} options.stageManager
   */
  constructor(options) {
    this.scene = options.scene;
    this.stageManager = options.stageManager;

    /** @type {THREE.Group} */
    this.group = new THREE.Group();
    this.group.name = 'debug-visualizer';
    this.group.visible = true;

    /** @type {THREE.LineSegments|null} */
    this._bboxOutline = null;

    /** @type {THREE.Group|null} */
    this._flightPathGroup = null;

    this._visible = true;
    this._built = false;
  }

  build() {
    if (this._built) return;

    const axes = new THREE.AxesHelper(10);
    axes.name = 'debug-axes';
    this.group.add(axes);

    this.scene.add(this.group);
    this._built = true;
  }

  /**
   * Draw bounding box outline for current world
   */
  drawBoundingBox(boundingBox) {
    if (this._bboxOutline) {
      this.group.remove(this._bboxOutline);
      this._bboxOutline.geometry.dispose();
      this._bboxOutline.material.dispose();
      this._bboxOutline = null;
    }
    if (!boundingBox) return;

    const geometry = new THREE.BoxGeometry(
      boundingBox.max.x - boundingBox.min.x,
      boundingBox.max.y - boundingBox.min.y,
      boundingBox.max.z - boundingBox.min.z
    );
    const edges = new THREE.EdgesGeometry(geometry);
    const center = new THREE.Vector3();
    boundingBox.getCenter(center);

    const material = new THREE.LineBasicMaterial({
      color: 0xC4956A,
      transparent: true,
      opacity: 0.6,
    });
    this._bboxOutline = new THREE.LineSegments(edges, material);
    this._bboxOutline.position.copy(center);
    this._bboxOutline.name = 'debug-bbox-outline';
    this.group.add(this._bboxOutline);
  }

  /**
   * Draw flight path line + control point spheres
   * @param {number[][]} controlPoints - [[x,y,z], ...] from world config
   */
  drawFlightPath(controlPoints) {
    // Remove old flight path visualization
    if (this._flightPathGroup) {
      this.group.remove(this._flightPathGroup);
      this._flightPathGroup.traverse((obj) => {
        if (obj.geometry) obj.geometry.dispose();
        if (obj.material) obj.material.dispose();
      });
      this._flightPathGroup = null;
    }

    if (!controlPoints || controlPoints.length < 2) return;

    this._flightPathGroup = new THREE.Group();
    this._flightPathGroup.name = 'debug-flight-path';

    // Create CatmullRom spline
    const planePath = new PlanePath(controlPoints);
    const spline = planePath.getSpline();
    const curvePoints = spline.getPoints(200);

    // Golden flight path line
    const lineGeo = new THREE.BufferGeometry().setFromPoints(curvePoints);
    const lineMat = new THREE.LineBasicMaterial({
      color: 0xFFC856,
      transparent: true,
      opacity: 0.7,
    });
    const line = new THREE.Line(lineGeo, lineMat);
    line.name = 'flight-path-line';
    this._flightPathGroup.add(line);

    // Control point spheres (orange)
    const sphereGeo = new THREE.SphereGeometry(0.4, 8, 6);
    controlPoints.forEach(([x, y, z], index) => {
      const sphereMat = new THREE.MeshBasicMaterial({
        color: index === 0 ? 0x4ECDC4 : index === controlPoints.length - 1 ? 0xFF6B6B : 0xFFC856,
        transparent: true,
        opacity: 0.9,
      });
      const sphere = new THREE.Mesh(sphereGeo, sphereMat);
      sphere.position.set(x, y, z);
      sphere.name = `flight-point-${index}`;
      this._flightPathGroup.add(sphere);
    });

    // Direction arrow at each segment midpoint
    const arrowDir = new THREE.Vector3();
    for (let i = 0; i < controlPoints.length - 1; i++) {
      const mid = new THREE.Vector3(
        (controlPoints[i][0] + controlPoints[i + 1][0]) / 2,
        (controlPoints[i][1] + controlPoints[i + 1][1]) / 2,
        (controlPoints[i][2] + controlPoints[i + 1][2]) / 2
      );
      arrowDir
        .set(
          controlPoints[i + 1][0] - controlPoints[i][0],
          controlPoints[i + 1][1] - controlPoints[i][1],
          controlPoints[i + 1][2] - controlPoints[i][2]
        )
        .normalize();
      const arrow = new THREE.ArrowHelper(arrowDir, mid, 1.5, 0xFFC856, 0.4, 0.3);
      this._flightPathGroup.add(arrow);
    }

    this.group.add(this._flightPathGroup);
    console.log(`[PathVisualizer] Flight path drawn: ${controlPoints.length} control points`);
  }

  toggle() {
    this._visible = !this._visible;
    this.group.visible = this._visible;
  }

  show() { this._visible = true; this.group.visible = true; }
  hide() { this._visible = false; this.group.visible = false; }

  dispose() {
    this.group.traverse((obj) => {
      if (obj.geometry) obj.geometry.dispose();
      if (obj.material) obj.material.dispose();
    });
    this.scene.remove(this.group);
  }
}
