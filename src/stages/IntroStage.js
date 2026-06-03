/**
 * IntroStage — Cinematic video landing experience
 *
 * 1. Fullscreen intro video plays
 * 2. Freeze last frame + dark overlay
 * 3. Typewriter: "Welcome to the Fantasy World." → fade out
 * 4. Typewriter: "Ready for the Trip?" → stays
 * 5. Buttons: "YES!!!" | "TAKE OFF"
 * 6. Click → transition to loading
 *
 * QA mode: auto-clicks YES after 5 seconds.
 */

import { getEnvironmentMode, ENV } from '../config/environment.js';
import { Typewriter } from '../ui/Typewriter.js';

// ====================== TUNABLE ======================

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

const QA_AUTO_CLICK_DELAY = 5000; // ms before auto-clicking YES in QA mode

// ======================================================

export class IntroStage {
  constructor(engine, onConfirm) {
    this.engine = engine;
    this.onConfirm = onConfirm;
    this._env = getEnvironmentMode();

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

    this._qaTimer = null;
    this._transitioned = false;
  }

  start() {
    // Show video (hidden by default via CSS visibility: hidden to prevent flash)
    if (this._video) this._video.style.visibility = 'visible';

    // BGM — try immediately (usually blocked), then wait for user gesture
    this._bgm.play().catch(() => {});
    const onGesture = () => {
      if (this._bgm && this._bgm.paused) this._bgm.play().catch(() => {});
    };
    document.addEventListener('click', onGesture, { once: true });
    document.addEventListener('keydown', onGesture, { once: true });

    this._typewriter = new Typewriter(this._textLine, TYPEWRITER_CONFIG);

    if (!this._video) {
      this._skipToEnd();
      return;
    }

    this._video.addEventListener('ended', () => this._onVideoEnd(), { once: true });

    // Fallback — if video never loads
    setTimeout(() => {
      if (!this._video.ended && this._video.readyState === 0) {
        this._skipToEnd();
      }
    }, 8000);

    // visibility:hidden prevented autoplay & resource fetch — force load now
    this._video.load();

    // Play once the browser has buffered enough data
    if (this._video.readyState >= 3) {
      // Already buffered (rare with visibility:hidden, but handle it)
      this._video.play().catch(() => this._skipToEnd());
    } else {
      this._video.addEventListener('canplay', () => {
        this._video.play().catch(() => this._skipToEnd());
      }, { once: true });
    }
  }

  _onVideoEnd() {
    this._video.pause();
    if (this._overlay) this._overlay.classList.add('active');
    this._runTyping();
  }

  async _runTyping() {
    if (!this._typewriter) return;

    await this._typewriter.type(SENTENCE_1.text, {
      cls: SENTENCE_1.cls,
      typingSpeed: SENTENCE_1.typingSpeed,
      fadeOut: SENTENCE_1.fadeOut,
      waitAfter: SENTENCE_1.waitAfter,
    });

    await this._typewriter.type(SENTENCE_2.text, {
      cls: SENTENCE_2.cls,
      typingSpeed: SENTENCE_2.typingSpeed,
      fadeOut: SENTENCE_2.fadeOut,
    });

    this._showButtons();
  }

  _showButtons() {
    if (!this._buttons) return;
    this._buttons.classList.add('visible');

    const yesBtn = document.getElementById('btn-yes');
    const takeoffBtn = document.getElementById('btn-takeoff');

    const confirm = () => {
      // Button click = guaranteed user gesture → try BGM again
      if (this._bgm && this._bgm.paused) this._bgm.play().catch(() => {});
      this._transition();
    };

    if (yesBtn) yesBtn.addEventListener('click', confirm);
    if (takeoffBtn) takeoffBtn.addEventListener('click', confirm);

    // QA mode: auto-click YES after delay
    if (this._env === ENV.QA) {
      this._qaTimer = setTimeout(() => {
        console.log('%c[QA] %cAuto-clicking YES',
          'color:rgba(255,255,255,0.5);',
          'color:#D4A574;');
        confirm();
      }, QA_AUTO_CLICK_DELAY);
    }
  }

  _transition() {
    if (this._transitioned) return;
    this._transitioned = true;
    if (this._qaTimer) clearTimeout(this._qaTimer);

    if (this._bgm) { this._bgm.pause(); this._bgm = null; }

    if (this._video) this._video.style.display = 'none';
    if (this._overlay) this._overlay.style.display = 'none';
    if (this._textContainer) this._textContainer.style.display = 'none';
    if (this._buttons) this._buttons.style.display = 'none';

    if (this._canvasContainer) this._canvasContainer.classList.add('active');

    if (this.onConfirm) this.onConfirm();
  }

  _skipToEnd() {
    if (this._video) this._video.style.display = 'none';
    this._onVideoEnd();
  }
}
