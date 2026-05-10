/**
 * exporter.js
 *
 * Slices frames from a source image and triggers browser downloads.
 * Stateless — receives everything it needs as arguments.
 */

/** Milliseconds between downloads (prevents browser from throttling). */
const DOWNLOAD_DELAY_MS = 60;

/**
 * Exports all frames as individual PNG files.
 *
 * @param {HTMLImageElement} image      Source spritesheet.
 * @param {import('../frames/frameStore').Frame[]} frames  Frames to export.
 * @param {(current: number, total: number) => void} [onProgress]
 * @returns {Promise<void>}
 */
export async function exportFrames(image, frames, onProgress) {
  for (let i = 0; i < frames.length; i++) {
    const fr = frames[i];

    const slice = cropFrame(image, fr);
    const dataURL = slice.toDataURL('image/png');
    triggerDownload(dataURL, buildFilename(i, fr.name));

    onProgress?.(i + 1, frames.length);

    // Stagger downloads so the browser doesn't block them
    await sleep(DOWNLOAD_DELAY_MS);
  }
}

/**
 * Renders a single frame into an offscreen canvas and returns it.
 *
 * @param {HTMLImageElement} image
 * @param {import('../frames/frameStore').Frame} frame
 * @returns {HTMLCanvasElement}
 */
export function cropFrame(image, frame) {
  const offscreen = document.createElement('canvas');
  offscreen.width  = frame.w;
  offscreen.height = frame.h;

  const ctx = offscreen.getContext('2d');
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(image, frame.x, frame.y, frame.w, frame.h, 0, 0, frame.w, frame.h);

  return offscreen;
}

// ── Private helpers ───────────────────────────────────────

/**
 * Builds a zero-padded filename for a frame.
 *
 * @param {number} index
 * @param {string} name
 * @returns {string}
 */
function buildFilename(index, name) {
  const padded = String(index).padStart(2, '0');
  // Sanitize name: replace spaces / invalid chars
  const safe = name.replace(/[^a-zA-Z0-9_\-]/g, '_');
  return `${padded}_${safe}.png`;
}

/**
 * Triggers a file download via a temporary <a> element.
 *
 * @param {string} dataURL
 * @param {string} filename
 */
function triggerDownload(dataURL, filename) {
  const a      = document.createElement('a');
  a.href       = dataURL;
  a.download   = filename;
  a.style.display = 'none';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

/**
 * @param {number} ms
 * @returns {Promise<void>}
 */
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}
