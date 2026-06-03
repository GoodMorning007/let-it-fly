/**
 * AudioManager — World music playback
 *
 * Each world defines a music track.
 * On flight start: fade in over 3 seconds, loop automatically.
 * Landing does NOT stop music.
 * Exploration mode continues music.
 */

export class AudioManager {
  constructor() {
    /** @type {HTMLAudioElement|null} */
    this.audio = null;

    this.volume = 1.0;
    this.targetVolume = 1.0;
    this.fadeInDuration = 3.0; // seconds
    this._fadeTimer = 0;
    this._isFadingIn = false;
    this._isFadingOut = false;
  }

  /**
   * Load an audio file
   * @param {string} url - Path to audio file
   * @returns {Promise<void>}
   */
  async load(url) {
    return new Promise((resolve, reject) => {
      this.audio = new Audio(url);
      this.audio.loop = true;
      this.audio.volume = 0; // Start at 0, fade in on play
      this.audio.preload = 'auto';

      this.audio.addEventListener('canplaythrough', () => resolve(), { once: true });
      this.audio.addEventListener('error', (e) => {
        console.warn('[AudioManager] Failed to load audio:', url, e);
        resolve(); // Don't block loading if audio fails
      }, { once: true });

      this.audio.load();
    });
  }

  /**
   * Play with fade-in
   * @param {number} duration - Fade-in duration in seconds (default 3)
   */
  play(duration = 3) {
    if (!this.audio) return;

    this.fadeInDuration = duration;
    this.audio.volume = 0;
    this._fadeTimer = 0;
    this._isFadingIn = true;
    this._isFadingOut = false;

    this.audio.play().catch((err) => {
      console.warn('[AudioManager] Play failed:', err);
    });
  }

  /**
   * Fade out and stop
   * @param {number} duration - Fade-out duration in seconds
   */
  stop(duration = 2) {
    this._isFadingIn = false;
    this._isFadingOut = true;
    this._fadeOutDuration = duration;
    this._fadeTimer = 0;
  }

  /**
   * Set volume (0-1)
   * @param {number} v
   */
  setVolume(v) {
    this.targetVolume = Math.max(0, Math.min(1, v));
  }

  /**
   * Per-frame update
   * @param {number} dt - Delta time in seconds
   */
  update(dt) {
    if (!this.audio) return;

    // Fade in
    if (this._isFadingIn) {
      this._fadeTimer += dt;
      const t = Math.min(this._fadeTimer / this.fadeInDuration, 1);
      this.audio.volume = t * this.targetVolume;
      if (t >= 1) {
        this._isFadingIn = false;
      }
    }

    // Fade out
    if (this._isFadingOut) {
      this._fadeTimer += dt;
      const t = Math.min(this._fadeTimer / this._fadeOutDuration, 1);
      this.audio.volume = (1 - t) * this.targetVolume;
      if (t >= 1) {
        this._isFadingOut = false;
        this.audio.pause();
      }
    }

    // Normal volume adjustment (not fading)
    if (!this._isFadingIn && !this._isFadingOut) {
      this.audio.volume = this.targetVolume;
    }
  }

  /**
   * Pause playback
   */
  pause() {
    if (this.audio) this.audio.pause();
  }

  /**
   * Resume playback
   */
  resume() {
    if (this.audio) this.audio.play().catch(() => {});
  }

  /**
   * Dispose audio resources
   */
  dispose() {
    if (this.audio) {
      this.audio.pause();
      this.audio.src = '';
      this.audio = null;
    }
  }
}
