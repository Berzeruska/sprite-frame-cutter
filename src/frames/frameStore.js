/**
 * frameStore.js
 *
 * Single source of truth for frame data.
 * Pure data layer — no DOM, no canvas.
 *
 * @typedef {{ x: number, y: number, w: number, h: number, name: string }} Frame
 */

export class FrameStore {
  /** @type {Frame[]} */
  #frames = [];

  /** @type {number} Index of the currently selected frame, or -1 */
  #selectedIndex = -1;

  /** @type {number} Auto-incrementing counter for default names */
  #counter = 0;

  /** @type {Array<() => void>} Change subscribers */
  #subscribers = [];

  // ── Public getters ────────────────────────────────────────

  /** Returns a shallow copy of all frames (immutable view). */
  get frames() {
    return [...this.#frames];
  }

  /** Returns the index of the currently selected frame. */
  get selectedIndex() {
    return this.#selectedIndex;
  }

  /** Returns the currently selected frame, or null. */
  get selectedFrame() {
    return this.#frames[this.#selectedIndex] ?? null;
  }

  get count() {
    return this.#frames.length;
  }

  // ── Mutations ─────────────────────────────────────────────

  /**
   * Adds a new frame and selects it.
   * @param {{ x: number, y: number, w: number, h: number }} rect
   * @returns {number} Index of the new frame.
   */
  add({ x, y, w, h }) {
    const name = `frame_${this.#counter++}`;
    this.#frames.push({ x, y, w, h, name });
    this.#selectedIndex = this.#frames.length - 1;
    this.#notify();
    return this.#selectedIndex;
  }

  /**
   * Renames a frame by index.
   * @param {number} index
   * @param {string} name
   */
  rename(index, name) {
    if (!this.#inRange(index)) return;
    this.#frames[index] = { ...this.#frames[index], name };
    this.#notify();
  }

  /**
   * Selects a frame by index.
   * @param {number} index
   */
  select(index) {
    if (!this.#inRange(index) && index !== -1) return;
    this.#selectedIndex = index;
    this.#notify();
  }

  /**
   * Deletes a frame by index, adjusting selection.
   * @param {number} index
   */
  delete(index) {
    if (!this.#inRange(index)) return;
    this.#frames.splice(index, 1);
    this.#selectedIndex = this.#frames.length > 0
      ? Math.min(this.#selectedIndex, this.#frames.length - 1)
      : -1;
    this.#notify();
  }

  /** Clears all frames and resets state. */
  clear() {
    this.#frames = [];
    this.#selectedIndex = -1;
    this.#counter = 0;
    this.#notify();
  }

  // ── Subscriptions ─────────────────────────────────────────

  /**
   * Registers a callback to be invoked on any state change.
   * @param {() => void} fn
   * @returns {() => void} Unsubscribe function.
   */
  subscribe(fn) {
    this.#subscribers.push(fn);
    return () => {
      this.#subscribers = this.#subscribers.filter(s => s !== fn);
    };
  }

  // ── Private ───────────────────────────────────────────────

  #inRange(index) {
    return index >= 0 && index < this.#frames.length;
  }

  #notify() {
    this.#subscribers.forEach(fn => fn());
  }
}
