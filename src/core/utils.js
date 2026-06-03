/**
 * Utils — Common utility functions
 */

import * as THREE from 'three';

/**
 * Linear interpolation
 */
export function lerp(a, b, t) {
  return a + (b - a) * t;
}

/**
 * Clamp value to range
 */
export function clamp(v, min, max) {
  return Math.max(min, Math.min(max, v));
}

/**
 * Pseudo-noise function for organic motion
 * Three sine waves with irrational frequency ratios
 */
export function pseudoNoise(t, freq = 1) {
  return (
    Math.sin(t * freq * 6.28) * 0.5 +
    Math.sin(t * freq * 2.71 * 6.28) * 0.3 +
    Math.sin(t * freq * 4.17 * 6.28) * 0.2
  );
}

/**
 * Convert [x, y, z] array to THREE.Vector3
 */
export function vec3FromArray(arr) {
  if (!arr || arr.length < 3) return new THREE.Vector3();
  return new THREE.Vector3(arr[0], arr[1], arr[2]);
}

/**
 * Convert array of [x,y,z] to array of THREE.Vector3
 */
export function vec3ArrayFromArray(arr) {
  if (!arr) return [];
  return arr.map((p) => vec3FromArray(p));
}

/**
 * Smooth damp (spring-like interpolation)
 */
export function smoothDamp(current, target, velocity, smoothTime, dt) {
  const omega = 2 / smoothTime;
  const x = omega * dt;
  const exp = 1 / (1 + x + 0.48 * x * x + 0.235 * x * x * x);
  const change = current - target;
  const temp = (velocity + omega * change) * dt;
  let newVelocity = (velocity - omega * temp) * exp;
  let output = target + (change + temp) * exp;

  // Prevent overshooting
  if ((target - current > 0) === (output > target)) {
    output = target;
    newVelocity = 0;
  }

  return { value: output, velocity: newVelocity };
}

/**
 * Map a value from one range to another
 */
export function remap(value, inMin, inMax, outMin, outMax) {
  return outMin + ((value - inMin) / (inMax - inMin)) * (outMax - outMin);
}
