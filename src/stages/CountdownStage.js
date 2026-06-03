/**
 * CountdownStage — Premium boarding-countdown screen
 *
 * Luxury boarding pass / movie poster aesthetic.
 * Shows before release date. Past release → auto-transition.
 * Debug: ?debug=true → skip entirely.
 */

import { GATE_CONFIG } from '../config/gate.js';
import { getEnvironmentMode, ENV } from '../config/environment.js';

// ====================== QA CONFIG ======================
const QA_READY_DISPLAY_MS = 3000; // "READY" shown for 3 seconds in QA mode

// ====================== STYLE CONFIG ======================
// All visual parameters in one place — edit here only.

const COUNTDOWN_STYLE = {
  title: {
    fontSize: '18px',
    letterSpacing: '0.5em',
    fontWeight: 400,
    color: '#F3F5F7',
    opacity: 0.7,
    marginBottom: '36px',
    textTransform: 'uppercase',
  },
  divider: {
    lineWidth: '40px',
    lineHeight: '1px',
    gap: '12px',
    opacity: 0.35,
    marginBottom: '36px',
    iconSize: '16px',
    lineColor: 'rgba(255,255,255,0.25)',
    iconColor: 'rgba(255,255,255,0.35)',
  },
  board: {
    fontSize: '14px',
    letterSpacing: '0.35em',
    fontWeight: 400,
    color: 'rgba(255,255,255,0.65)',
    marginBottom: '28px',
    textTransform: 'uppercase',
  },
  countdown: {
    // Used when days >= 1 (smaller, with sub-time below)
    fontSize: 'clamp(36px, 6vw, 72px)',
    fontWeight: 300,
    color: '#F3F5F7',
    marginBottom: '8px',
  },
  countdownFinal: {
    // Used when days < 1 (large HH:MM:SS, no sub-time)
    fontSize: 'clamp(48px, 8vw, 96px)',
    fontWeight: 300,
    color: '#F3F5F7',
    marginBottom: '24px',
  },
  subTime: {
    fontSize: 'clamp(20px, 3.5vw, 36px)',
    fontWeight: 300,
    letterSpacing: '0.15em',
    color: 'rgba(255,255,255,0.55)',
    marginBottom: '24px',
  },
  date: {
    fontSize: '14px',
    letterSpacing: '0.25em',
    fontWeight: 300,
    color: 'rgba(255,255,255,0.6)',
  },
};

// ====================== STAR CONFIG ======================

const STAR_COUNT = 30;
const STAR_SIZE_MIN = 0.8;
const STAR_SIZE_MAX = 2.5;
const STAR_GLOW = 12;
const TWINKLE_INTERVAL_MIN = 8000;
const TWINKLE_INTERVAL_MAX = 12000;
const TWINKLE_OPACITY_MIN = 0.2;
const TWINKLE_OPACITY_MAX = 0.6;
const TWINKLE_PEAK = 0.85;

const PARALLAX_FACTOR = 0.02;

// ====================== TIMING ======================

const FADE_IN_DURATION = 1500;
const TRANSITION_OUT = 1200;

// ==========================================================

export class CountdownStage {
  constructor(onUnlock) {
    this.onUnlock = onUnlock;
    this._env = getEnvironmentMode();
    this._release = new Date(GATE_CONFIG.releaseDate).getTime();

    this._el = null;
    this._titleEl = null;
    this._dividerEl = null;
    this._boardEl = null;
    this._countdownEl = null;
    this._subTimeEl = null;
    this._dateEl = null;
    this._stars = [];

    this._timer = null;
    this._twinkleTimer = null;
    this._mouseX = 0;
    this._mouseY = 0;
    this._parallaxX = 0;
    this._parallaxY = 0;
    this._unlocked = false;
  }

  start() {
    this._build();
    this._applyStyles();
    this._bindEvents();
    this._fadeIn();
    this._scheduleTwinkle();
    requestAnimationFrame(() => this._renderLoop());

    if (this._env === ENV.QA) {
      // QA mode: show "READY" for 3 seconds, then auto-continue
      this._qaReady();
    } else {
      // Normal: real countdown
      this._tick();
      this._timer = setInterval(() => this._tick(), 1000);
    }
  }

  _qaReady() {
    // Replace countdown text with "READY"
    if (this._countdownEl) this._countdownEl.textContent = 'READY';
    if (this._subTimeEl) this._subTimeEl.style.display = 'none';
    this._applyCountdownStyle('final');

    setTimeout(() => {
      console.log('%c[QA] %cCountdown READY → auto-continue',
        'color:rgba(255,255,255,0.5);',
        'color:#D4A574;');
      this._unlocked = true;
      this._transitionOut();
    }, QA_READY_DISPLAY_MS);
  }

  destroy() {
    clearInterval(this._timer);
    clearTimeout(this._twinkleTimer);
    if (this._el) this._el.remove();
    this._el = null;
  }

  // ---------------------------------------------------

  _build() {
    const el = document.createElement('div');
    el.id = 'countdown-stage';
    el.innerHTML = `
      <canvas id="countdown-stars"></canvas>
      <div class="cd-content">
        <p class="cd-title">LET IT FLY</p>
        <div class="cd-divider">
          <span class="cd-divider-line"></span>
          <svg class="cd-divider-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M21 16v-2l-8-5V3.5c0-.83-.67-1.5-1.5-1.5S10 2.67 10 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z" fill="currentColor"/>
          </svg>
          <span class="cd-divider-line"></span>
        </div>
        <p class="cd-board">BOARDING IN</p>
        <p class="cd-value has-sub">-- DAY</p>
        <p class="cd-sub-time">-- : -- : --</p>
        <p class="cd-date">06.05.2026</p>
      </div>
    `;
    document.body.prepend(el);

    this._el = el;
    this._titleEl = el.querySelector('.cd-title');
    this._dividerEl = el.querySelector('.cd-divider');
    this._boardEl = el.querySelector('.cd-board');
    this._countdownEl = el.querySelector('.cd-value');
    this._subTimeEl = el.querySelector('.cd-sub-time');
    this._dateEl = el.querySelector('.cd-date');

    this._initStarField(el.querySelector('#countdown-stars'));
  }

  /** Apply all style config to DOM elements */
  _applyStyles() {
    const s = COUNTDOWN_STYLE;

    // Title
    Object.assign(this._titleEl.style, {
      fontSize: s.title.fontSize,
      letterSpacing: s.title.letterSpacing,
      fontWeight: String(s.title.fontWeight),
      color: s.title.color,
      marginBottom: s.title.marginBottom,
      textTransform: s.title.textTransform,
    });

    // Divider
    Object.assign(this._dividerEl.style, {
      gap: s.divider.gap,
      marginBottom: s.divider.marginBottom,
    });
    const lines = this._dividerEl.querySelectorAll('.cd-divider-line');
    lines.forEach(line => {
      Object.assign(line.style, {
        width: s.divider.lineWidth,
        height: s.divider.lineHeight,
        background: s.divider.lineColor,
      });
    });
    const icon = this._dividerEl.querySelector('.cd-divider-icon');
    Object.assign(icon.style, {
      width: s.divider.iconSize,
      height: s.divider.iconSize,
      color: s.divider.iconColor,
    });

    // Board
    Object.assign(this._boardEl.style, {
      fontSize: s.board.fontSize,
      letterSpacing: s.board.letterSpacing,
      fontWeight: String(s.board.fontWeight),
      color: s.board.color,
      marginBottom: s.board.marginBottom,
      textTransform: s.board.textTransform,
    });

    // Countdown (default: has-sub mode)
    this._applyCountdownStyle('has-sub');

    // Sub-time
    Object.assign(this._subTimeEl.style, {
      fontSize: s.subTime.fontSize,
      fontWeight: String(s.subTime.fontWeight),
      letterSpacing: s.subTime.letterSpacing,
      color: s.subTime.color,
      marginBottom: s.subTime.marginBottom,
    });

    // Date
    Object.assign(this._dateEl.style, {
      fontSize: s.date.fontSize,
      letterSpacing: s.date.letterSpacing,
      fontWeight: String(s.date.fontWeight),
      color: s.date.color,
    });
  }

  /** Switch countdown between 'has-sub' (small + sub-time) and 'final' (large, no sub) */
  _applyCountdownStyle(mode) {
    const s = COUNTDOWN_STYLE;
    const src = mode === 'final' ? s.countdownFinal : s.countdown;
    this._countdownEl.classList.toggle('has-sub', mode === 'has-sub');
    this._countdownEl.classList.toggle('final', mode === 'final');
    Object.assign(this._countdownEl.style, {
      fontSize: src.fontSize,
      fontWeight: String(src.fontWeight),
      color: src.color,
      marginBottom: src.marginBottom,
    });
  }

  // ---------------------------------------------------
  // Star field
  // ---------------------------------------------------

  _initStarField(canvas) {
    const ctx = canvas.getContext('2d');
    this._starCtx = ctx;
    this._starCanvas = canvas;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize, { passive: true });

    this._stars = Array.from({ length: STAR_COUNT }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      r: STAR_SIZE_MIN + Math.random() * (STAR_SIZE_MAX - STAR_SIZE_MIN),
      opacity: TWINKLE_OPACITY_MIN + Math.random() * (TWINKLE_OPACITY_MAX - TWINKLE_OPACITY_MIN),
      baseOpacity: 0,
      twinkling: false,
    }));
    // Store base opacity
    for (const s of this._stars) s.baseOpacity = s.opacity;
  }

  _renderLoop() {
    if (!this._starCanvas) return;
    const ctx = this._starCtx;
    const w = this._starCanvas.width;
    const h = this._starCanvas.height;

    this._parallaxX += (this._mouseX - this._parallaxX) * 0.05;
    this._parallaxY += (this._mouseY - this._parallaxY) * 0.05;

    ctx.clearRect(0, 0, w, h);
    const ox = this._parallaxX * PARALLAX_FACTOR;
    const oy = this._parallaxY * PARALLAX_FACTOR;

    for (const s of this._stars) {
      const sx = ((s.x + ox) % w + w) % w;
      const sy = ((s.y + oy) % h + h) % h;

      ctx.save();
      ctx.shadowColor = `rgba(200,215,240,${s.opacity * 0.7})`;
      ctx.shadowBlur = STAR_GLOW;
      ctx.beginPath();
      ctx.arc(sx, sy, s.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(230,240,255,${s.opacity})`;
      ctx.fill();
      ctx.restore();
    }

    requestAnimationFrame(() => this._renderLoop());
  }

  _scheduleTwinkle() {
    const star = this._stars[Math.floor(Math.random() * this._stars.length)];
    if (!star || star.twinkling) {
      this._twinkleTimer = setTimeout(() => this._scheduleTwinkle(), 1000);
      return;
    }

    star.twinkling = true;
    const original = star.opacity;
    const peak = TWINKLE_PEAK;
    const startTime = performance.now();
    const riseDuration = 600;
    const holdDuration = 300;
    const fallDuration = 800;

    const rise = (ts) => {
      const t = Math.min((ts - startTime) / riseDuration, 1);
      const ease = t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
      star.opacity = original + (peak - original) * ease;
      if (t < 1) {
        requestAnimationFrame(rise);
      } else {
        // Hold
        setTimeout(() => {
          const fallStart = performance.now();
          const fall = (ts2) => {
            const t2 = Math.min((ts2 - fallStart) / fallDuration, 1);
            const ease2 = t2 < 0.5 ? 2 * t2 * t2 : -1 + (4 - 2 * t2) * t2;
            star.opacity = peak + (star.baseOpacity - peak) * ease2;
            if (t2 < 1) {
              requestAnimationFrame(fall);
            } else {
              star.opacity = star.baseOpacity;
              star.twinkling = false;
            }
          };
          requestAnimationFrame(fall);
        }, holdDuration);
      }
    };
    requestAnimationFrame(rise);

    const next = TWINKLE_INTERVAL_MIN + Math.random() * (TWINKLE_INTERVAL_MAX - TWINKLE_INTERVAL_MIN);
    this._twinkleTimer = setTimeout(() => this._scheduleTwinkle(), next);
  }

  // ---------------------------------------------------
  // Fade-in
  // ---------------------------------------------------

  _fadeIn() {
    const items = [
      { el: this._titleEl, delay: 0 },
      { el: this._dividerEl, delay: 300 },
      { el: this._boardEl, delay: 500 },
      { el: this._countdownEl, delay: 700 },
      { el: this._subTimeEl, delay: 800 },
      { el: this._dateEl, delay: 950 },
    ];

    for (const { el, delay } of items) {
      if (!el) continue;
      el.style.opacity = '0';
      el.style.transform = 'translateY(10px)';
      setTimeout(() => {
        el.style.transition = `opacity ${FADE_IN_DURATION * 0.6}ms ease, transform ${FADE_IN_DURATION * 0.6}ms ease`;
        el.style.opacity = String(COUNTDOWN_STYLE.title.opacity && el === this._titleEl ? COUNTDOWN_STYLE.title.opacity : 1);
        if (el === this._titleEl) el.style.opacity = String(COUNTDOWN_STYLE.title.opacity);
        else el.style.opacity = '1';
        el.style.transform = 'translateY(0)';
      }, delay);
    }
  }

  // ---------------------------------------------------
  // Countdown logic
  // ---------------------------------------------------

  _formatHMS(totalSeconds) {
    const h = Math.floor((totalSeconds % 86400) / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    const s = totalSeconds % 60;
    return `${String(h).padStart(2, '0')} : ${String(m).padStart(2, '0')} : ${String(s).padStart(2, '0')}`;
  }

  _tick() {
    const now = Date.now();
    const diff = this._release - now;

    if (diff <= 0 && !this._unlocked) {
      this._unlocked = true;
      this._transitionOut();
      return;
    }

    const totalSeconds = Math.ceil(diff / 1000);
    const days = Math.floor(totalSeconds / 86400);

    if (days >= 1) {
      // "X DAY" (small) + "HH : MM : SS" (sub)
      const mainText = `${days} DAY`;
      const subText = this._formatHMS(totalSeconds);

      if (this._countdownEl.classList.contains('final')) {
        this._applyCountdownStyle('has-sub');
        this._subTimeEl.style.display = '';
      }

      if (this._countdownEl.textContent !== mainText) {
        this._countdownEl.style.opacity = '0';
        setTimeout(() => {
          if (this._countdownEl) {
            this._countdownEl.textContent = mainText;
            this._countdownEl.style.opacity = '1';
          }
        }, 250);
      }
      if (this._subTimeEl.textContent !== subText) {
        this._subTimeEl.style.opacity = '0';
        setTimeout(() => {
          if (this._subTimeEl) {
            this._subTimeEl.textContent = subText;
            this._subTimeEl.style.opacity = '1';
          }
        }, 250);
      }
    } else {
      // < 1 day: large "HH : MM : SS", hide sub-time
      const mainText = this._formatHMS(totalSeconds);

      if (!this._countdownEl.classList.contains('final')) {
        this._applyCountdownStyle('final');
        this._subTimeEl.style.display = 'none';
      }

      if (this._countdownEl.textContent !== mainText) {
        this._countdownEl.style.opacity = '0';
        setTimeout(() => {
          if (this._countdownEl) {
            this._countdownEl.textContent = mainText;
            this._countdownEl.style.opacity = '1';
          }
        }, 250);
      }
    }
  }

  _transitionOut() {
    if (!this._el) return;
    this._el.style.transition = `opacity ${TRANSITION_OUT}ms ease`;
    this._el.style.opacity = '0';
    setTimeout(() => {
      this.destroy();
      if (this.onUnlock) this.onUnlock();
    }, TRANSITION_OUT);
  }

  // ---------------------------------------------------
  // Events
  // ---------------------------------------------------

  _bindEvents() {
    document.addEventListener('mousemove', (e) => {
      this._mouseX = e.clientX - window.innerWidth / 2;
      this._mouseY = e.clientY - window.innerHeight / 2;
    }, { passive: true });
  }
}
