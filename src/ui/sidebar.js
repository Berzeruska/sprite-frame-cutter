/**
 * sidebar.js
 *
 * Renders and manages the frame list DOM.
 * Calls back into the store; never manages state itself.
 */

export class Sidebar {
  /**
   * @param {{
   *   listEl:      HTMLElement,
   *   countEl:     HTMLElement,
   *   statusEl:    HTMLElement,
   *   onSelect:    (index: number) => void,
   *   onDelete:    (index: number) => void,
   *   onRename:    (index: number, name: string) => void,
   * }} options
   */
  constructor({ listEl, countEl, statusEl, onSelect, onDelete, onRename }) {
    this.listEl   = listEl;
    this.countEl  = countEl;
    this.statusEl = statusEl;

    this.onSelect = onSelect;
    this.onDelete = onDelete;
    this.onRename = onRename;
  }

  // ── Public API ────────────────────────────────────────────

  /**
   * Re-renders the entire frame list.
   *
   * @param {import('../frames/frameStore').Frame[]} frames
   * @param {number} selectedIndex
   */
  renderList(frames, selectedIndex) {
    this.countEl.textContent = frames.length;

    if (frames.length === 0) {
      this.listEl.innerHTML =
        '<div class="frames-list__empty">Nenhum frame marcado ainda.</div>';
      return;
    }

    // Build DOM imperatively to avoid innerHTML on data with user input
    this.listEl.innerHTML = '';
    frames.forEach((fr, i) => {
      this.listEl.appendChild(this.#createItem(fr, i, i === selectedIndex));
    });
  }

  /**
   * Updates the status bar text.
   *
   * @param {string} message
   * @param {'normal' | 'error'} [type='normal']
   */
  setStatus(message, type = 'normal') {
    this.statusEl.textContent = message;
    this.statusEl.className   = type === 'error' ? 'status status--error' : 'status';
  }

  // ── Private ───────────────────────────────────────────────

  /**
   * @param {import('../frames/frameStore').Frame} fr
   * @param {number} index
   * @param {boolean} selected
   * @returns {HTMLElement}
   */
  #createItem(fr, index, selected) {
    const item = document.createElement('div');
    item.className = 'frame-item' + (selected ? ' frame-item--selected' : '');
    item.addEventListener('click', () => this.onSelect(index));

    // Index badge
    const idx = document.createElement('span');
    idx.className   = 'frame-item__index';
    idx.textContent = index;

    // Name input
    const input = document.createElement('input');
    input.type      = 'text';
    input.className = 'frame-item__name-input';
    input.value     = fr.name;
    input.addEventListener('click', (e) => e.stopPropagation());
    input.addEventListener('change', () => this.onRename(index, input.value.trim() || fr.name));

    // Coordinates
    const coords = document.createElement('span');
    coords.className   = 'frame-item__coords';
    coords.textContent = `${fr.x},${fr.y}\n${fr.w}×${fr.h}`;

    // Delete button
    const del = document.createElement('button');
    del.className   = 'frame-item__delete btn';
    del.textContent = '×';
    del.title       = 'Apagar frame';
    del.addEventListener('click', (e) => {
      e.stopPropagation();
      this.onDelete(index);
    });

    item.append(idx, input, coords, del);
    return item;
  }
}
