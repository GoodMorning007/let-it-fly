/**
 * ScrollHandler — Scroll event processing
 *
 * Calculates scroll progress, direction, and velocity.
 * Outputs targetSpeed to FlightController.
 * Uses passive event listeners.
 */

export class ScrollHandler {
  constructor() {
    this.scrollProgress = 0;
    this.scrollDirection = 1; // 1 = down, -1 = up
    this.scrollDelta = 0;

    // Mouse position (normalized -1 to 1)
    this.mouseX = 0;
    this.mouseY = 0;

    this._boundScrollHandler = this._onScroll.bind(this);
    this._boundMouseMoveHandler = this._onMouseMove.bind(this);
    this._active = false;
  }

  /**
   * Activate scroll and mouse listeners
   */
  activate() {
    if (this._active) return;
    this._active = true;

    window.addEventListener('scroll', this._boundScrollHandler, { passive: true });
    window.addEventListener('mousemove', this._boundMouseMoveHandler, { passive: true });
  }

  /**
   * Deactivate listeners
   */
  deactivate() {
    this._active = false;

    window.removeEventListener('scroll', this._boundScrollHandler);
    window.removeEventListener('mousemove', this._boundMouseMoveHandler);
  }

  /**
   * Scroll event handler
   * @private
   */
  _onScroll(event) {
    const scrollY = window.scrollY;
    const maxScroll = document.documentElement.scrollHeight - window.innerHeight;

    if (maxScroll > 0) {
      const newProgress = scrollY / maxScroll;
      this.scrollDelta = newProgress - this.scrollProgress;
      this.scrollProgress = Math.max(0, Math.min(1, newProgress));

      if (Math.abs(this.scrollDelta) > 0.0001) {
        this.scrollDirection = this.scrollDelta > 0 ? 1 : -1;
      }
    }
  }

  /**
   * Mouse move event handler
   * @private
   */
  _onMouseMove(event) {
    this.mouseX = (event.clientX / window.innerWidth) * 2 - 1;
    this.mouseY = -(event.clientY / window.innerHeight) * 2 + 1;
  }

  /**
   * Get current scroll progress
   * @returns {number} 0-1
   */
  getProgress() {
    return this.scrollProgress;
  }

  /**
   * Get scroll direction
   * @returns {number} 1 or -1
   */
  getDirection() {
    return this.scrollDirection;
  }

  /**
   * Get scroll delta
   * @returns {number}
   */
  getDelta() {
    return this.scrollDelta;
  }

  /**
   * Reset scroll to top
   */
  reset() {
    window.scrollTo({ top: 0, behavior: 'auto' });
    this.scrollProgress = 0;
    this.scrollDelta = 0;
  }
}
