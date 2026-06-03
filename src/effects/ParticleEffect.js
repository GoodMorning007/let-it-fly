/**
 * ParticleEffect — Dissolve & Generate particle animations
 *
 * Dissolve: model's surface points fly outward with random velocity.
 * Generate: particles converge to model's surface, then model appears.
 */

import * as THREE from 'three';

export class ParticleEffect {
  constructor(scene) {
    this.scene = scene;
  }

  /**
   * Sample surface points from a model's meshes (world-space)
   * @param {THREE.Object3D} model
   * @param {number} targetCount - Approx number of particles
   * @returns {Float32Array}
   */
  _sampleSurface(model, targetCount) {
    const points = [];
    model.traverse((child) => {
      if (!child.isMesh || !child.geometry) return;
      const pos = child.geometry.getAttribute('position');
      if (!pos) return;
      const step = Math.max(1, Math.floor(pos.count / Math.max(targetCount / 4, 1)));
      const m = new THREE.Matrix4();
      child.updateWorldMatrix(true, false);
      m.copy(child.matrixWorld);
      const v = new THREE.Vector3();
      for (let i = 0; i < pos.count; i += step) {
        v.set(pos.getX(i), pos.getY(i), pos.getZ(i));
        v.applyMatrix4(m);
        points.push(v.x, v.y, v.z);
      }
    });
    if (points.length === 0) {
      // Fallback: bounding box corners
      const box = new THREE.Box3().setFromObject(model);
      for (let i = 0; i < targetCount; i++) {
        const x = THREE.MathUtils.lerp(box.min.x, box.max.x, Math.random());
        const y = THREE.MathUtils.lerp(box.min.y, box.max.y, Math.random());
        const z = THREE.MathUtils.lerp(box.min.z, box.max.z, Math.random());
        points.push(x, y, z);
      }
    }
    return new Float32Array(points);
  }

  /**
   * Dissolve model into particles flying away
   * @param {THREE.Object3D} model - The model to dissolve
   * @param {number} duration - Seconds
   * @returns {Promise<void>}
   */
  dissolve(model, duration = 1.0) {
    return new Promise((resolve) => {
      const count = 800;
      const startPos = this._sampleSurface(model, count);
      const particleCount = startPos.length / 3;

      // Target positions: random outward with gravity
      const targetPos = new Float32Array(startPos.length);
      const center = new THREE.Vector3();
      model.updateWorldMatrix(true, false);
      new THREE.Box3().setFromObject(model).getCenter(center);

      for (let i = 0; i < particleCount; i++) {
        const ix = i * 3;
        const dir = new THREE.Vector3(
          startPos[ix] - center.x,
          startPos[ix + 1] - center.y,
          startPos[ix + 2] - center.z
        ).normalize();
        // Add randomness
        dir.x += (Math.random() - 0.5) * 1.5;
        dir.y += (Math.random() - 0.5) * 1.5;
        dir.z += (Math.random() - 0.5) * 1.5;
        dir.normalize();
        const dist = 8 + Math.random() * 20;
        targetPos[ix] = startPos[ix] + dir.x * dist;
        targetPos[ix + 1] = startPos[ix + 1] + dir.y * dist * 0.6;
        targetPos[ix + 2] = startPos[ix + 2] + dir.z * dist;
      }

      const geo = new THREE.BufferGeometry();
      geo.setAttribute('position', new THREE.BufferAttribute(startPos.slice(), 3));
      const mat = new THREE.PointsMaterial({
        color: 0xD4A574,
        size: 0.3,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        transparent: true,
        opacity: 1,
      });
      const particles = new THREE.Points(geo, mat);
      particles.name = 'dissolve-particles';
      this.scene.add(particles);

      // Hide model
      model.visible = false;

      // Animate
      const startTime = performance.now();
      const origPos = new Float32Array(startPos);
      const currentPos = new Float32Array(startPos.length);

      const animate = () => {
        const elapsed = (performance.now() - startTime) / 1000;
        const t = Math.min(elapsed / duration, 1);

        for (let i = 0; i < particleCount * 3; i++) {
          currentPos[i] = THREE.MathUtils.lerp(origPos[i], targetPos[i], t);
        }
        geo.attributes.position.array.set(currentPos);
        geo.attributes.position.needsUpdate = true;
        mat.opacity = 1 - t;

        if (t < 1) {
          requestAnimationFrame(animate);
        } else {
          this.scene.remove(particles);
          geo.dispose();
          mat.dispose();
          resolve();
        }
      };
      animate();
    });
  }

  /**
   * Generate model from converging particles
   * @param {THREE.Object3D} model - Target model (already positioned, invisible)
   * @param {number} duration - Seconds
   * @returns {Promise<void>}
   */
  generate(model, duration = 1.0) {
    return new Promise((resolve) => {
      const count = 800;
      const targetPts = this._sampleSurface(model, count);
      const particleCount = targetPts.length / 3;
      const center = new THREE.Vector3();
      new THREE.Box3().setFromObject(model).getCenter(center);

      // Start positions: random sphere around center
      const startPos = new Float32Array(targetPts.length);
      for (let i = 0; i < particleCount; i++) {
        const ix = i * 3;
        const r = 6 + Math.random() * 12;
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.random() * Math.PI;
        startPos[ix] = center.x + r * Math.sin(phi) * Math.cos(theta);
        startPos[ix + 1] = center.y + r * Math.cos(phi);
        startPos[ix + 2] = center.z + r * Math.sin(phi) * Math.sin(theta);
      }

      const geo = new THREE.BufferGeometry();
      geo.setAttribute('position', new THREE.BufferAttribute(startPos.slice(), 3));
      const mat = new THREE.PointsMaterial({
        color: 0xD4A574,
        size: 0.3,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        transparent: true,
        opacity: 0,
      });
      const particles = new THREE.Points(geo, mat);
      particles.name = 'generate-particles';
      this.scene.add(particles);

      model.visible = false;

      const startTime = performance.now();
      const currentPos = new Float32Array(targetPts.length);

      const animate = () => {
        const elapsed = (performance.now() - startTime) / 1000;
        const t = Math.min(elapsed / duration, 1);
        // Ease-in
        const eased = t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;

        for (let i = 0; i < particleCount * 3; i++) {
          currentPos[i] = THREE.MathUtils.lerp(startPos[i], targetPts[i], eased);
        }
        geo.attributes.position.array.set(currentPos);
        geo.attributes.position.needsUpdate = true;
        mat.opacity = eased;

        if (t < 1) {
          requestAnimationFrame(animate);
        } else {
          this.scene.remove(particles);
          geo.dispose();
          mat.dispose();
          model.visible = true;
          resolve();
        }
      };
      animate();
    });
  }
}
