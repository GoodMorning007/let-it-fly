/**
 * CameraSequence — Configuration-driven cinematic camera events
 *
 * NOT hardcoded five stages. Reads cameraEvents from world config.
 * Each event: { progress, type, params }
 * Smooth transitions between events — no hard cuts.
 */

import { lerp } from '../core/utils.js';

export class CameraSequence {
  /**
   * @param {object[]} cameraEvents - From world config
   * Example:
   * [
   *   { progress: 0.0,  type: 'reveal', params: { fov: 35, distance: 1.2 } },
   *   { progress: 0.15, type: 'approach', params: { fov: 50, distance: 1.0 } },
   *   { progress: 0.35, type: 'orbit', params: { fov: 50, side: 'left', radius: 10 } },
   *   ...
   * ]
   */
  constructor(cameraEvents = []) {
    this.events = cameraEvents.sort((a, b) => a.progress - b.progress);
    this.currentEventIndex = 0;
  }

  /**
   * Get the current active camera event based on flight progress
   * @param {number} progress - Flight progress (0-1)
   * @returns {{ event: object, blend: number }}
   *   event: the current event config
   *   blend: 0-1 blend factor toward the next event (for smooth transitions)
   */
  getCurrentEvent(progress) {
    if (this.events.length === 0) {
      return { event: null, blend: 0 };
    }

    // Find which event segment we're in
    let eventIndex = 0;
    for (let i = 0; i < this.events.length; i++) {
      if (progress >= this.events[i].progress) {
        eventIndex = i;
      }
    }

    this.currentEventIndex = eventIndex;
    const currentEvent = this.events[eventIndex];

    // Calculate blend to next event (smooth transition)
    let blend = 0;
    if (eventIndex < this.events.length - 1) {
      const nextEvent = this.events[eventIndex + 1];
      const segmentLength = nextEvent.progress - currentEvent.progress;
      if (segmentLength > 0) {
        blend = (progress - currentEvent.progress) / segmentLength;
        blend = Math.max(0, Math.min(1, blend));
      }
    }

    // If we're close to the next event (last 30% of segment), start blending params
    if (blend > 0.7 && eventIndex < this.events.length - 1) {
      const nextEvent = this.events[eventIndex + 1];
      const blendFactor = (blend - 0.7) / 0.3; // 0 to 1 in last 30%
      return {
        event: this._blendEvents(currentEvent, nextEvent, blendFactor),
        blend,
      };
    }

    return { event: currentEvent, blend };
  }

  /**
   * Blend between two camera events
   * @private
   */
  _blendEvents(eventA, eventB, factor) {
    const blended = {
      type: factor > 0.5 ? eventB.type : eventA.type,
      params: {},
    };

    // Blend params
    const allKeys = new Set([
      ...Object.keys(eventA.params || {}),
      ...Object.keys(eventB.params || {}),
    ]);

    for (const key of allKeys) {
      const a = eventA.params?.[key];
      const b = eventB.params?.[key];

      if (typeof a === 'number' && typeof b === 'number') {
        blended.params[key] = lerp(a, b, factor);
      } else if (factor > 0.5) {
        blended.params[key] = b;
      } else {
        blended.params[key] = a;
      }
    }

    return blended;
  }

  /**
   * Get event by type
   * @param {string} type
   * @returns {object|undefined}
   */
  getEventByType(type) {
    return this.events.find((e) => e.type === type);
  }

  /**
   * Get all events
   * @returns {object[]}
   */
  getEvents() {
    return this.events;
  }
}
