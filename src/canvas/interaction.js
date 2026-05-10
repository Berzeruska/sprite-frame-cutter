/**
 * interaction.js
 *
 * Handles all mouse events on the canvas and zoom slider.
 * Emits frame-add events via a callback; never mutates state directly.
 */

/** Minimum width/height (in image pixels) for a frame to be registered. */
const MIN_FRAME_PX = 2;

export class Interaction {
  /**
   * @param {HTMLCanvasElement} canvas
   * @param {{
   *   onFrameAdded:    (rect: { x: number, y: number, w: number, h: number }) => void,
   *   onDraftChanged:  (draft: { startX: number, startY: number, curX: number, curY: number } | null) => void,
   *   onCoordsChanged: (x: number, y: number) => void,
   *   getZoom:         () => number,
   *   hasImage:        () => boolean,
   * }} callbacks
   */
  constructor(canvas, callbacks) {
    this.canvas    = canvas;
    this.callbacks = callbacks;

    this.#draft    = null;

    this.#bindEvents();
  }

  // ── Private state ─────────────────────────────────────────

  /** @type {{ startX: number, startY: number, curX: number, curY: number } | null} */
  #draft;

  // ── Private ───────────────────────────────────────────────

  #bindEvents() {
    const { canvas } = this;

    canvas.addEventListener('mousedown',  this.#onMouseDown.bind(this));
    canvas.addEventListener('mousemove',  this.#onMouseMove.bind(this));
    canvas.addEventListener('mouseup',    this.#onMouseUp.bind(this));
    canvas.addEventListener('mouseleave', this.#onMouseLeave.bind(this));
  }

  /**
   * Converts a client-space mouse position to image-space coordinates.
   * @param {number} clientX
   * @param {number} clientY
   * @returns {{ x: number, y: number }}
   */
  #toImageCoords(clientX, clientY) {
    const rect = this.canvas.getBoundingClientRect();
    const zoom  = this.callbacks.getZoom();
    return {
      x: Math.round((clientX - rect.left)  / zoom),
      y: Math.round((clientY - rect.top)   / zoom),
    };
  }

  /** @param {MouseEvent} e */
  #onMouseDown(e) {
    if (!this.callbacks.hasImage() || e.button !== 0) return;

    const { x, y } = this.#toImageCoords(e.clientX, e.clientY);
    this.#draft = { startX: x, startY: y, curX: x, curY: y };
  }

  /** @param {MouseEvent} e */
  #onMouseMove(e) {
    if (!this.callbacks.hasImage()) return;

    const { x, y } = this.#toImageCoords(e.clientX, e.clientY);
    this.callbacks.onCoordsChanged(x, y);

    if (this.#draft) {
      this.#draft.curX = x;
      this.#draft.curY = y;
      this.callbacks.onDraftChanged({ ...this.#draft });
    }
  }

  /** @param {MouseEvent} e */
  #onMouseUp(e) {
    if (!this.#draft) return;

    const { x, y } = this.#toImageCoords(e.clientX, e.clientY);
    this.#draft.curX = x;
    this.#draft.curY = y;

    const rect = this.#normaliseDraft(this.#draft);
    this.#draft = null;
    this.callbacks.onDraftChanged(null);

    if (rect.w >= MIN_FRAME_PX && rect.h >= MIN_FRAME_PX) {
      this.callbacks.onFrameAdded(rect);
    }
  }

  #onMouseLeave() {
    if (this.#draft) {
      this.#draft = null;
      this.callbacks.onDraftChanged(null);
    }
  }

  /**
   * Returns a normalised {x, y, w, h} from a draft (handles dragging right-to-left).
   * @param {{ startX: number, startY: number, curX: number, curY: number }} draft
   * @returns {{ x: number, y: number, w: number, h: number }}
   */
  #normaliseDraft({ startX, startY, curX, curY }) {
    return {
      x: Math.min(startX, curX),
      y: Math.min(startY, curY),
      w: Math.abs(curX - startX),
      h: Math.abs(curY - startY),
    };
  }
}
