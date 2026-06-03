/**
 * Typewriter — Configurable typewriter text animation with sound
 *
 * Usage:
 *   const tw = new Typewriter(element, config);
 *   await tw.type('Hello World.', { typingSpeed: 80 });
 *   await tw.type('Second line.',  { typingSpeed: 120, fadeOut: true, waitAfter: 1000 });
 *
 * Exposes per-sentence options:
 *   typingSpeed  — ms per character (default from config)
 *   fadeOut      — if true, fades out after typing + waitAfter
 *   waitAfter    — ms to wait after typing before fadeOut (default 0)
 */

export class Typewriter {
  /**
   * @param {HTMLElement} element — DOM element to render text into
   * @param {object} config
   * @param {number} [config.typingSpeed=100] — default ms per character
   * @param {boolean} [config.soundEnabled=true]
   * @param {number} [config.soundVolume=0.3]
   * @param {string[]} [config.soundFiles] — paths to typing sound wav files
   */
  constructor(element, config = {}) {
    this._el = element;
    this._container = element?.parentElement;

    this._cfg = {
      typingSpeed: config.typingSpeed ?? 100,
      soundEnabled: config.soundEnabled ?? true,
      soundVolume: config.soundVolume ?? 0.3,
      soundFiles: config.soundFiles || [
        '/intro/typing01.wav',
        '/intro/typing02.wav',
        '/intro/typing03.wav',
      ],
    };

    // Preload sound buffers
    this._buffers = [];
    this._loaded = false;
    this._loadSounds();
  }

  /**
   * Type a line character by character
   * @param {string} text
   * @param {object} [options]
   * @param {number} [options.typingSpeed] — override speed per sentence
   * @param {string} [options.cls] — CSS class to add to the text element
   * @param {boolean} [options.fadeOut=false]
   * @param {number}  [options.waitAfter=0] — ms before fading out
   * @returns {Promise<void>}
   */
  type(text, options = {}) {
    return new Promise((resolve) => {
      const speed = options.typingSpeed ?? this._cfg.typingSpeed;
      const fadeOut = options.fadeOut ?? false;
      const waitAfter = options.waitAfter ?? 0;

      if (!this._el) return resolve();

      this._el.textContent = '';
      this._el.className = options.cls || '';

      // Show container
      if (this._container) this._container.style.display = 'flex';

      let i = 0;
      const max = text.length;

      const tick = () => {
        if (i < max) {
          this._el.textContent += text[i];
          this._playClick();
          i++;
          setTimeout(tick, speed);
        } else {
          // Done typing — hide cursor if not fading out
          if (!fadeOut) this._el.classList.add('done');

          if (fadeOut) {
            setTimeout(() => {
              if (this._container) {
                this._container.style.transition = 'opacity 0.5s ease';
                this._container.style.opacity = '0';
              }
              setTimeout(() => {
                if (this._container) {
                  this._container.style.opacity = '1';
                  this._el.textContent = '';
                  this._el.className = '';
                }
                resolve();
              }, 500);
            }, waitAfter);
          } else {
            resolve();
          }
        }
      };

      tick();
    });
  }

  /**
   * Play a random typing click sound
   * @private
   */
  _playClick() {
    if (!this._cfg.soundEnabled || !this._buffers.length) return;

    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const buf = this._buffers[Math.floor(Math.random() * this._buffers.length)];
      const src = ctx.createBufferSource();
      src.buffer = buf;

      const gain = ctx.createGain();
      gain.gain.value = this._cfg.soundVolume;
      src.connect(gain).connect(ctx.destination);
      src.start();
      src.onended = () => ctx.close();
    } catch {
      // Silently ignore audio errors
    }
  }

  /**
   * Preload typing sounds
   * @private
   */
  async _loadSounds() {
    if (!this._cfg.soundEnabled) return;

    const fetchOne = async (url) => {
      try {
        const resp = await fetch(url);
        if (!resp.ok) return null;
        const arr = await resp.arrayBuffer();
        const ctx = new (window.AudioContext || window.webkitAudioContext)();
        return ctx.decodeAudioData(arr);
      } catch {
        return null;
      }
    };

    const bufs = await Promise.all(this._cfg.soundFiles.map(fetchOne));
    this._buffers = bufs.filter(Boolean);
    this._loaded = true;
  }
}
