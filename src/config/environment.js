/**
 * Environment Mode System
 *
 * Centralized mode detection for the entire project.
 * All routing / debugging / QA decisions should use getEnvironmentMode().
 *
 * Modes:
 *   'production' — Normal user experience, all gates enforced.
 *   'debug'      — Developer testing, skip gates, direct stage access.
 *   'qa'         — Full-journey verification, bypass restrictions only.
 *
 * Detection priority: qa > debug > production
 */

export const ENV = Object.freeze({
  PRODUCTION: 'production',
  DEBUG: 'debug',
  QA: 'qa',
});

let _cachedMode = null;

/**
 * Returns the current environment mode.
 * Cached after first call — consistent throughout the session.
 *
 *   ?qa=true    → QA (full journey, restrictions bypassed)
 *   ?debug=true → DEBUG (skip gates, direct stage access)
 *   default     → PRODUCTION
 *
 * @returns {'production'|'debug'|'qa'}
 */
export function getEnvironmentMode() {
  if (_cachedMode !== null) return _cachedMode;

  const urlParams = new URLSearchParams(window.location.search);

  // 1. QA mode — highest priority
  if (urlParams.get('qa') === 'true') {
    _cachedMode = ENV.QA;
    console.log('%c[MODE] %cQA',
      'color:rgba(255,255,255,0.5);',
      'color:#D4A574;font-weight:bold;');
    return _cachedMode;
  }

  // 2. Debug mode — explicit param only
  if (urlParams.get('debug') === 'true') {
    _cachedMode = ENV.DEBUG;
    console.log('%c[MODE] %cDEBUG',
      'color:rgba(255,255,255,0.5);',
      'color:#8FCB9B;font-weight:bold;');
    return _cachedMode;
  }

  // 3. Production
  _cachedMode = ENV.PRODUCTION;
  console.log('%c[MODE] %cPRODUCTION',
    'color:rgba(255,255,255,0.5);',
    'color:#F3F5F7;font-weight:bold;');
  return _cachedMode;
}

/**
 * Shorthand: true if any non-production mode.
 */
export function isDevMode() {
  const mode = getEnvironmentMode();
  return mode === ENV.DEBUG || mode === ENV.QA;
}
