/**
 * IntroStage — Cinematic video landing experience
 *
 * 1. Fullscreen intro video plays (~4s)
 * 2. Freeze last frame + dark overlay
 * 3. Typewriter: "Welcome to the Fantasy World." → fade out
 * 4. Typewriter: "Ready for the Trip?" → stays
 * 5. Buttons: "YES!!!" | "TAKE OFF"
 * 6. Click → transition to Happy Birthday
 */

import { Typewriter } from '../ui/Typewriter.js';

// ====================== TUNABLE ======================

/** Typewriter config */
const TYPEWRITER_CONFIG = {
  typingSpeed: 100,
  soundEnabled: true,
  soundVolume: 0.1,
  soundFiles: [
    '/intro/typing01.wav',
    '/intro/typing02.wav',
    '/intro/typing03.wav',
  ],
};

/** Typewriter sentences */
const SENTENCE_1 = {
  text: 'Welcome to the Fantasy World.',
  cls: 'small',
  typingSpeed: 120,
  fadeOut: true,
  waitAfter: 1000,
};

const SENTENCE_2 = {
  text: 'Ready for the Trip?',
  cls: '',
  typingSpeed: 150,
  fadeOut: false,
};

// ======================================================

export class IntroStage {
  constructor(engine, onConfirm) {
    this.engine = engine;
    this.onConfirm = onConfirm;

    // DOM
    this._video = document.getElementById('intro-video');
    this._overlay = document.getElementById('intro-overlay');
    this._textContainer = document.getElementById('intro-text-container');
    this._textLine = document.getElementById('intro-text-line');
    this._buttons = document.getElementById('intro-buttons');
    this._canvasContainer = document.getElementById('canvas-container');

    // Typewriter
    this._typewriter = null;

    // BGM
    this._bgm = new Audio('/intro/intro_bgm.mp3');
    this._bgm.loop = true;
    this._bgm.volume = 0.4;
  }

  /**
   * Start the cinematic intro sequence
   */
  start() {
    // Browsers block autoplay audio — play on first user gesture
    const playBGM = () => {
      if (this._bgm) this._bgm.play().catch(() => {});
      document.removeEventListener('click', playBGM);
      document.removeEventListener('keydown', playBGM);
    };
    document.addEventListener('click', playBGM);
    document.addEventListener('keydown', playBGM);

    // Init typewriter
    this._typewriter = new Typewriter(this._textLine, TYPEWRITER_CONFIG);

    if (!this._video) {
      this._skipToEnd();
      return;
    }

    this._video.addEventListener('ended', () => this._onVideoEnd(), { once: true });

    // Fallback
    setTimeout(() => {
      if (!this._video.ended && this._video.readyState === 0) {
        this._skipToEnd();
      }
    }, 8000);

    this._video.play().catch(() => this._skipToEnd());
  }

  /**
   * Video ended → freeze frame, dark overlay, start typewriter
   * @private
   */
  _onVideoEnd() {
    this._video.pause();

    if (this._overlay) this._overlay.classList.add('active');

    this._runTyping();
  }

  /**
   * Typewriter sequence
   * @private
   */
  async _runTyping() {
    if (!this._typewriter) return;

    // Sentence 1
    await this._typewriter.type(SENTENCE_1.text, {
      cls: SENTENCE_1.cls,
      typingSpeed: SENTENCE_1.typingSpeed,
      fadeOut: SENTENCE_1.fadeOut,
      waitAfter: SENTENCE_1.waitAfter,
    });

    // Sentence 2
    await this._typewriter.type(SENTENCE_2.text, {
      cls: SENTENCE_2.cls,
      typingSpeed: SENTENCE_2.typingSpeed,
      fadeOut: SENTENCE_2.fadeOut,
    });

    // Show buttons
    this._showButtons();
  }

  /**
   * Fade in buttons
   * @private
   */
  _showButtons() {
    if (!this._buttons) return;
    this._buttons.classList.add('visible');

    const yesBtn = document.getElementById('btn-yes');
    const takeoffBtn = document.getElementById('btn-takeoff');

    const confirm = () => this._transition();

    if (yesBtn) yesBtn.addEventListener('click', confirm);
    if (takeoffBtn) takeoffBtn.addEventListener('click', confirm);
  }

  /**
   * Transition: hide intro, reveal 3D canvas, load Happy Birthday
   * @private
   */
  _transition() {
    // Stop intro BGM
    if (this._bgm) { this._bgm.pause(); this._bgm = null; }

    if (this._video) this._video.style.display = 'none';
    if (this._overlay) this._overlay.style.display = 'none';
    if (this._textContainer) this._textContainer.style.display = 'none';
    if (this._buttons) this._buttons.style.display = 'none';

    if (this._canvasContainer) this._canvasContainer.classList.add('active');

    if (this.onConfirm) this.onConfirm();
  }

  /**
   * Skip video → go directly to typewriter
   * @private
   */
  _skipToEnd() {
    if (this._video) this._video.style.display = 'none';
    this._onVideoEnd();
  }
}
