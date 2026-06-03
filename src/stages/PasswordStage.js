/**
 * PasswordStage — Secret invitation / prank unlock sequence
 *
 * Emotional flow: Success → Confusion → Prank → Secret Unlock → Journey Begins
 *
 * Visual: luxury boarding pass, personal letter, secret invitation.
 * No gaming UI. No cyberpunk. No hacker terminal.
 */

// ====================== STYLE CONFIG ======================
// All visual parameters — edit here only.

const PW_STYLE = {
  background: 'radial-gradient(ellipse at center, #0a0c10 0%, #050608 70%, #020304 100%)',
  fontFamily: "'Space Grotesk', sans-serif",

  message: {
    fontSize: 'clamp(18px, 3vw, 28px)',
    fontWeight: 300,
    letterSpacing: '0.35em',
    textTransform: 'uppercase',
  },

  accessGranted: {
    color: '#8FCB9B',
  },

  ellipsis: {
    color: 'rgba(255,255,255,0.4)',
  },

  line: {
    fontSize: 'clamp(14px, 2.2vw, 18px)',
    fontWeight: 300,
    letterSpacing: '0.08em',
    color: 'rgba(255,255,255,0.75)',
    lineHeight: 1.8,
  },

  form: {
    labelFontSize: 'clamp(12px, 1.8vw, 14px)',
    labelLetterSpacing: '0.25em',
    labelColor: 'rgba(255,255,255,0.55)',
    labelTextTransform: 'uppercase',
    inputFontSize: 'clamp(14px, 2vw, 16px)',
    inputColor: '#F3F5F7',
    inputBg: 'rgba(255,255,255,0.04)',
    inputBorder: 'rgba(255,255,255,0.15)',
    inputBorderFocus: 'rgba(255,255,255,0.35)',
    inputWidth: '260px',
    inputPadding: '10px 14px',
    btnFontSize: 'clamp(11px, 1.6vw, 13px)',
    btnLetterSpacing: '0.2em',
    btnColor: '#F3F5F7',
    btnBg: 'rgba(255,255,255,0.08)',
    btnBorder: 'rgba(255,255,255,0.2)',
    btnHoverBg: 'rgba(255,255,255,0.15)',
    gap: '16px',
  },

  error: {
    color: '#E67C73',
    fontSize: 'clamp(12px, 1.8vw, 14px)',
    letterSpacing: '0.08em',
  },

  success: {
    color: '#8FCB9B',
    line2Color: 'rgba(255,255,255,0.55)',
  },

  hint: {
    fontSize: '11px',
    letterSpacing: '0.06em',
    color: 'rgba(255,255,255,0.25)',
    opacity: 0.15,
    bottom: '40px',
  },
};

// ====================== TIMING ======================
const ACCESS_GRANTED_DURATION = 1500;
const ELLIPSIS_DURATION = 1000;
const FADE_SPEED = 400; // fast crossfade
const FORM_DELAY_AFTER_TYPE = 2000;
const SUCCESS_DELAY_BEFORE_OUT = 2000;
const STAGE_FADE_OUT = 1200;

// ====================== TYPEWRITER ======================
const TYPING_SPEED = 120;    // ms per char — slower, more emotional
const PAGE_PAUSE = 800;      // ms pause after a page finishes typing, before next page
const CROSSFADE = 350;       // ms fade between pages
const TYPING_SOUND_ENABLED = false; // set true + provide soundFiles to enable

// Each line appears one at a time in the SAME centered position (page-by-page).
// Previous page fades out, next page types in.
const TYPEWRITER_LINES = [
  '...',
  'JUST KIDDING.',
  '哈哈哈哈哈哈哈哈',
  '没想到吧',
  '你还是不能进去',
  '今天09:30准时到小红楼207',
  '找你女朋友要密码',
  '或者你也可以自己猜哦',
];

// ====================== PASSWORD ======================
const CORRECT_PASSWORD = '2000loveu0605';

const ERROR_MESSAGES = [
  'Not quite.',
  'Try again :)',
  'Maybe ask your girlfriend.',
  'Still wrong.',
];

import { getEnvironmentMode, ENV } from '../config/environment.js';

// ====================== HINT ======================
const HINT_TEXT = 'The answer may be closer than you think.';

// ==========================================================

export class PasswordStage {
  constructor(onUnlock) {
    this.onUnlock = onUnlock;
    this._env = getEnvironmentMode();
    this._el = null;
    this._messageEl = null;
    this._typewriterEl = null;
    this._formEl = null;
    this._inputEl = null;
    this._errorEl = null;
    this._hintEl = null;
    this._unlocked = false;
  }

  start() {
    this._build();
    this._applyStyles();

    // Always show the full sequence — even in QA mode
    this._runSequence();
  }

  destroy() {
    if (this._el) this._el.remove();
    this._el = null;
  }

  // ---------------------------------------------------
  // Build
  // ---------------------------------------------------

  _build() {
    const el = document.createElement('div');
    el.id = 'password-stage';
    el.innerHTML = `
      <div class="pw-content">
        <p class="pw-message"></p>
        <p class="pw-typewriter"></p>
        <div class="pw-error"></div>
        <div class="pw-form">
          <span class="pw-label">Enter the secret code</span>
          <div class="pw-input-row">
            <input class="pw-input" type="password" placeholder="" autocomplete="off" />
            <button class="pw-btn" type="button">UNLOCK</button>
          </div>
        </div>
      </div>
      <p class="pw-hint"></p>
    `;
    document.body.prepend(el);

    this._el = el;
    this._messageEl = el.querySelector('.pw-message');
    this._typewriterEl = el.querySelector('.pw-typewriter');
    this._formEl = el.querySelector('.pw-form');
    this._inputEl = el.querySelector('.pw-input');
    this._errorEl = el.querySelector('.pw-error');
    this._hintEl = el.querySelector('.pw-hint');

    // Hint
    this._hintEl.textContent = HINT_TEXT;

    // Events
    el.querySelector('.pw-btn').addEventListener('click', () => this._tryUnlock());
    this._inputEl.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') this._tryUnlock();
    });
  }

  _applyStyles() {
    const s = PW_STYLE;
    this._el.style.background = s.background;
    this._el.style.fontFamily = s.fontFamily;

    // Hint
    Object.assign(this._hintEl.style, {
      fontSize: s.hint.fontSize,
      letterSpacing: s.hint.letterSpacing,
      color: s.hint.color,
      opacity: String(s.hint.opacity),
    });

    // Form label
    const label = this._formEl.querySelector('.pw-label');
    Object.assign(label.style, {
      fontSize: s.form.labelFontSize,
      letterSpacing: s.form.labelLetterSpacing,
      color: s.form.labelColor,
      textTransform: s.form.labelTextTransform,
    });

    // Input
    Object.assign(this._inputEl.style, {
      fontSize: s.form.inputFontSize,
      color: s.form.inputColor,
      background: s.form.inputBg,
      borderColor: s.form.inputBorder,
    });

    // Button
    const btn = this._formEl.querySelector('.pw-btn');
    Object.assign(btn.style, {
      fontSize: s.form.btnFontSize,
      letterSpacing: s.form.btnLetterSpacing,
      color: s.form.btnColor,
      background: s.form.btnBg,
      borderColor: s.form.btnBorder,
    });
  }

  // ---------------------------------------------------
  // Sequence
  // ---------------------------------------------------

  async _runSequence() {
    // 1. ACCESS GRANTED
    await this._showMessage('ACCESS GRANTED', PW_STYLE.accessGranted, ACCESS_GRANTED_DURATION);

    // 2. TYPEWRITER — page-by-page, each line replaces the previous one
    //    First page: "..." then "JUST KIDDING." etc.
    await this._runTypewriter();

    // 3. Wait, then show form
    await this._wait(FORM_DELAY_AFTER_TYPE);
    await this._fadeInForm();

    // QA mode: auto-fill correct password and submit after brief delay
    if (this._env === ENV.QA) {
      await this._wait(1500);
      console.log('%c[QA] %cAuto-filling password',
        'color:rgba(255,255,255,0.5);',
        'color:#D4A574;');
      this._inputEl.value = CORRECT_PASSWORD;
      await this._wait(400);
      this._tryUnlock();
    }
  }

  // ---------------------------------------------------
  // Message helpers
  // ---------------------------------------------------

  _showMessage(text, style, duration, noFadeOut = false) {
    return new Promise((resolve) => {
      const el = this._messageEl;
      el.textContent = text;
      el.style.opacity = '0';
      el.style.transition = `opacity ${FADE_SPEED}ms ease`;
      el.style.fontSize = PW_STYLE.message.fontSize;
      el.style.fontWeight = String(PW_STYLE.message.fontWeight);
      el.style.letterSpacing = PW_STYLE.message.letterSpacing;
      el.style.textTransform = PW_STYLE.message.textTransform;
      el.style.color = style.color;

      requestAnimationFrame(() => {
        el.style.opacity = '1';
      });

      if (!noFadeOut) {
        setTimeout(() => {
          el.style.opacity = '0';
          setTimeout(resolve, FADE_SPEED);
        }, duration);
      } else {
        setTimeout(() => resolve(), duration);
      }
    });
  }

  // ---------------------------------------------------
  // Page-by-page typewriter — each line replaces the previous at center
  // ---------------------------------------------------

  async _runTypewriter() {
    const el = this._typewriterEl;
    const s = PW_STYLE.line;

    // Style the typewriter element
    Object.assign(el.style, {
      fontSize: s.fontSize,
      fontWeight: String(s.fontWeight),
      letterSpacing: s.letterSpacing,
      color: s.color,
      opacity: '0',
      textAlign: 'center',
      margin: '0',
      transition: `opacity ${CROSSFADE}ms ease`,
    });

    for (let li = 0; li < TYPEWRITER_LINES.length; li++) {
      const text = TYPEWRITER_LINES[li];

      // Fade in the element (empty)
      el.textContent = '';
      el.style.opacity = '1';

      // Type character by character
      for (let ci = 0; ci < text.length; ci++) {
        el.textContent += text[ci];
        await this._wait(TYPING_SPEED);
      }

      // Pause after page finishes
      await this._wait(PAGE_PAUSE);

      // Fade out before next page (unless it's the last one)
      if (li < TYPEWRITER_LINES.length - 1) {
        el.style.opacity = '0';
        await this._wait(CROSSFADE);
      }
    }

    // After last line, fade out
    el.style.opacity = '0';
    await this._wait(CROSSFADE);
  }

  // ---------------------------------------------------
  // Form
  // ---------------------------------------------------

  async _fadeInForm() {
    this._formEl.style.display = 'flex';
    // Ensure hint is visible
    this._hintEl.style.transition = 'opacity 600ms ease';
    this._hintEl.style.opacity = '0';
    requestAnimationFrame(() => {
      this._hintEl.style.opacity = String(PW_STYLE.hint.opacity);
    });

    this._formEl.style.opacity = '0';
    this._formEl.style.transition = 'opacity 600ms ease';
    requestAnimationFrame(() => {
      this._formEl.style.opacity = '1';
    });
    setTimeout(() => this._inputEl.focus(), 700);
  }

  _tryUnlock() {
    if (this._unlocked) return;
    const value = this._inputEl.value.trim();

    if (value === CORRECT_PASSWORD) {
      this._unlocked = true;
      this._onSuccess();
    } else {
      this._onError();
    }
  }

  // ---------------------------------------------------
  // Success / Error
  // ---------------------------------------------------

  async _onSuccess() {
    // Hide form + error
    this._formEl.style.opacity = '0';
    this._errorEl.style.opacity = '0';
    await this._wait(FADE_SPEED);
    this._formEl.style.display = 'none';

    // Show success message
    const el = this._messageEl;
    el.innerHTML = `
      <span style="display:block;color:${PW_STYLE.success.color};font-size:${PW_STYLE.message.fontSize};font-weight:300;letter-spacing:0.25em;text-transform:uppercase;margin-bottom:12px;">Access Granted.</span>
      <span style="display:block;color:${PW_STYLE.success.line2Color};font-size:clamp(11px,1.4vw,13px);font-weight:300;letter-spacing:0.1em;">Preparing your journey...</span>
    `;
    el.style.opacity = '0';
    el.style.transition = `opacity ${FADE_SPEED}ms ease`;
    requestAnimationFrame(() => { el.style.opacity = '1'; });

    // Wait then fade out stage
    await this._wait(SUCCESS_DELAY_BEFORE_OUT);
    this._el.style.transition = `opacity ${STAGE_FADE_OUT}ms ease`;
    this._el.style.opacity = '0';
    setTimeout(() => {
      this.destroy();
      if (this.onUnlock) this.onUnlock();
    }, STAGE_FADE_OUT);
  }

  _onError() {
    const msg = ERROR_MESSAGES[Math.floor(Math.random() * ERROR_MESSAGES.length)];
    const el = this._errorEl;
    el.textContent = msg;
    const s = PW_STYLE.error;
    Object.assign(el.style, {
      fontSize: s.fontSize,
      letterSpacing: s.letterSpacing,
      color: s.color,
      opacity: '1',
      transition: 'opacity 200ms ease',
    });
    // Auto-fade after 2.5s
    setTimeout(() => {
      el.style.opacity = '0';
    }, 2500);

    // Clear input
    this._inputEl.value = '';
    this._inputEl.focus();
  }

  // ---------------------------------------------------
  // Utils
  // ---------------------------------------------------

  _wait(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
