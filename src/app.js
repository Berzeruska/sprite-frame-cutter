/**
 * app.js
 *
 * Application bootstrap.
 * Wires all modules together. No business logic lives here —
 * this file is purely glue/orchestration.
 */

import { FrameStore }       from './frames/frameStore.js';
import { Renderer }         from './canvas/renderer.js';
import { Interaction }      from './canvas/interaction.js';
import { Sidebar }          from './ui/sidebar.js';
import { exportFrames }     from './export/exporter.js';
import { loadImageFromFile, bindDragAndDrop } from './utils/imageLoader.js';

// ── DOM refs ──────────────────────────────────────────────

const canvas     = /** @type {HTMLCanvasElement}  */ (document.getElementById('mainCanvas'));
const fileInput  = /** @type {HTMLInputElement}   */ (document.getElementById('fileInput'));
const zoomSlider = /** @type {HTMLInputElement}   */ (document.getElementById('zoomSlider'));
const zoomValue  = /** @type {HTMLElement}        */ (document.getElementById('zoomVal'));
const coordsEl   = /** @type {HTMLElement}        */ (document.getElementById('coords'));
const listEl     = /** @type {HTMLElement}        */ (document.getElementById('framesList'));
const countEl    = /** @type {HTMLElement}        */ (document.getElementById('frameCount'));
const statusEl   = /** @type {HTMLElement}        */ (document.getElementById('status'));

// ── App state ─────────────────────────────────────────────

const store    = new FrameStore();
const renderer = new Renderer(canvas);
const sidebar  = new Sidebar({
  listEl,
  countEl,
  statusEl,
  onSelect: (i) => { store.select(i); },
  onDelete: (i) => { store.delete(i); },
  onRename: (i, name) => { store.rename(i, name); },
});

let image = /** @type {HTMLImageElement | null} */ (null);
let zoom  = parseFloat(zoomSlider.value);

/** @type {{ startX: number, startY: number, curX: number, curY: number } | null} */
let draft = null;

// ── Rendering ─────────────────────────────────────────────

function redraw() {
  renderer.render({
    image,
    zoom,
    frames: store.frames,
    selectedIndex: store.selectedIndex,
    draft,
  });
}

store.subscribe(() => {
  redraw();
  sidebar.renderList(store.frames, store.selectedIndex);
});

// ── Image loading ─────────────────────────────────────────

function onImageLoaded(img) {
  image = img;
  store.clear();
  redraw();
  sidebar.setStatus(`Imagem carregada: ${img.width}×${img.height}px`);
}

function onImageError(err) {
  sidebar.setStatus(err.message, 'error');
}

// Wire file input change — listener added here (same module scope as the
// button click) so the browser allows the programmatic .click() call.
fileInput.addEventListener('change', async (e) => {
  const file = /** @type {HTMLInputElement} */ (e.target).files?.[0];
  if (!file) return;
  try {
    onImageLoaded(await loadImageFromFile(file));
  } catch (err) {
    onImageError(err);
  } finally {
    fileInput.value = ''; // allow re-selecting the same file
  }
});

bindDragAndDrop(document.body, onImageLoaded, onImageError);

// ── Canvas interaction ────────────────────────────────────

new Interaction(canvas, {
  hasImage: () => image !== null,
  getZoom:  () => zoom,

  onCoordsChanged(x, y) {
    coordsEl.textContent = `x: ${x}  y: ${y}`;
  },

  onDraftChanged(newDraft) {
    draft = newDraft;
    redraw();
  },

  onFrameAdded(rect) {
    const index = store.add(rect);
    const fr    = store.frames[index];
    sidebar.setStatus(`Frame ${index} adicionado: ${fr.x},${fr.y}  ${fr.w}×${fr.h}`);
  },
});

// ── Zoom ──────────────────────────────────────────────────

zoomSlider.addEventListener('input', function () {
  zoom = parseFloat(this.value);
  zoomValue.textContent = `${zoom}×`;
  redraw();
});

// ── Action buttons ────────────────────────────────────────


document.getElementById('btnExport').addEventListener('click', async () => {
  if (!image || store.count === 0) {
    sidebar.setStatus('Nada para exportar. Marque os frames primeiro.', 'error');
    return;
  }
  sidebar.setStatus('Exportando...');
  await exportFrames(image, store.frames, (current, total) => {
    sidebar.setStatus(`Exportando ${current}/${total}...`);
  });
  sidebar.setStatus(`✓ ${store.count} frames exportados!`);
});

document.getElementById('btnClear').addEventListener('click', () => {
  if (store.count === 0) return;
  if (!confirm('Apagar todos os frames?')) return;
  store.clear();
  sidebar.setStatus('Frames apagados.');
});

// ── Init ──────────────────────────────────────────────────

sidebar.setStatus('Carregue o spritesheet para começar.');
sidebar.renderList([], -1);
