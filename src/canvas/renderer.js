/**
 * renderer.js
 *
 * Pure canvas drawing — reads state, never mutates it.
 * Call render() any time the view needs to be refreshed.
 */

const CHECKERBOARD_SIZE = 8;
const LABEL_MIN_SIZE    = 9;

const COLOR = {
  frame:        '#88ccee',
  frameFill:    'rgba(136,204,238,0.08)',
  selected:     '#ffdd88',
  selectedFill: 'rgba(255,221,136,0.15)',
  drawing:      '#ffaa44',
  drawingFill:  'rgba(255,170,68,0.12)',
  checker1:     '#333333',
  checker2:     '#2a2a2a',
};

export class Renderer {
  /**
   * @param {HTMLCanvasElement} canvas
   */
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx    = canvas.getContext('2d');
  }

  /**
   * Full redraw.
   *
   * @param {{
   *   image:         HTMLImageElement | null,
   *   zoom:          number,
   *   frames:        import('../frames/frameStore').Frame[],
   *   selectedIndex: number,
   *   draft:         { startX: number, startY: number, curX: number, curY: number } | null,
   * }} state
   */
  render({ image, zoom, frames, selectedIndex, draft }) {
    if (!image) return;

    this.#resize(image, zoom);
    this.#drawCheckerboard();

    this.ctx.imageSmoothingEnabled = false;
    this.ctx.drawImage(image, 0, 0, image.width * zoom, image.height * zoom);

    frames.forEach((fr, i) => this.#drawFrame(fr, i, i === selectedIndex, zoom));

    if (draft) {
      this.#drawDraft(draft, zoom);
    }
  }

  // ── Private ───────────────────────────────────────────────

  #resize(image, zoom) {
    this.canvas.width  = image.width  * zoom;
    this.canvas.height = image.height * zoom;
  }

  #drawCheckerboard() {
    const { width, height } = this.canvas;
    const s = CHECKERBOARD_SIZE;

    for (let row = 0; row * s < height; row++) {
      for (let col = 0; col * s < width; col++) {
        this.ctx.fillStyle = (row + col) % 2 === 0 ? COLOR.checker1 : COLOR.checker2;
        this.ctx.fillRect(col * s, row * s, s, s);
      }
    }
  }

  /**
   * @param {import('../frames/frameStore').Frame} fr
   * @param {number} index
   * @param {boolean} isSelected
   * @param {number} zoom
   */
  #drawFrame(fr, index, isSelected, zoom) {
    const { ctx } = this;
    const x = fr.x * zoom + 0.5;
    const y = fr.y * zoom + 0.5;
    const w = fr.w * zoom;
    const h = fr.h * zoom;

    // Stroke
    ctx.strokeStyle = isSelected ? COLOR.selected : COLOR.frame;
    ctx.lineWidth   = isSelected ? 2 : 1;
    ctx.setLineDash(isSelected ? [] : [4, 3]);
    ctx.strokeRect(x, y, w, h);

    // Fill
    ctx.fillStyle = isSelected ? COLOR.selectedFill : COLOR.frameFill;
    ctx.fillRect(fr.x * zoom, fr.y * zoom, w, h);

    // Label
    const fontSize = Math.max(LABEL_MIN_SIZE, zoom * 3);
    ctx.setLineDash([]);
    ctx.fillStyle = isSelected ? COLOR.selected : COLOR.frame;
    ctx.font      = `bold ${fontSize}px monospace`;
    ctx.fillText(fr.name, fr.x * zoom + 3, fr.y * zoom + fontSize + 2);
  }

  /**
   * @param {{ startX: number, startY: number, curX: number, curY: number }} draft
   * @param {number} zoom
   */
  #drawDraft({ startX, startY, curX, curY }, zoom) {
    const { ctx } = this;
    const x = Math.min(startX, curX) * zoom;
    const y = Math.min(startY, curY) * zoom;
    const w = Math.abs(curX - startX) * zoom;
    const h = Math.abs(curY - startY) * zoom;

    ctx.strokeStyle = COLOR.drawing;
    ctx.lineWidth   = 2;
    ctx.setLineDash([]);
    ctx.strokeRect(x + 0.5, y + 0.5, w, h);

    ctx.fillStyle = COLOR.drawingFill;
    ctx.fillRect(x, y, w, h);

    // Size label above the box
    ctx.fillStyle = COLOR.drawing;
    ctx.font      = '10px monospace';
    ctx.fillText(`${Math.abs(curX - startX)}×${Math.abs(curY - startY)}`, x + 3, y - 5);
  }
}
