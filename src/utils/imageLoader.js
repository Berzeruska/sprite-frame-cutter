/**
 * imageLoader.js
 *
 * Handles file input and drag-and-drop, then resolves an HTMLImageElement.
 */

/**
 * Loads an HTMLImageElement from a File.
 *
 * @param {File} file
 * @returns {Promise<HTMLImageElement>}
 */
export function loadImageFromFile(file) {
  return new Promise((resolve, reject) => {
    if (!file || !file.type.startsWith('image/')) {
      reject(new Error('Arquivo inválido. Use uma imagem (PNG, GIF, WEBP...).'));
      return;
    }

    const url = URL.createObjectURL(file);
    const img  = new Image();

    img.onload = () => {
      URL.revokeObjectURL(url); // free memory
      resolve(img);
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Não foi possível carregar a imagem.'));
    };

    img.src = url;
  });
}

/**
 * Wires a file <input> element to call `onLoad` with the image.
 *
 * @param {HTMLInputElement} input
 * @param {(img: HTMLImageElement) => void} onLoad
 * @param {(err: Error) => void} onError
 */
export function bindFileInput(input, onLoad, onError) {
  input.addEventListener('change', async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const img = await loadImageFromFile(file);
      onLoad(img);
    } catch (err) {
      onError(err);
    } finally {
      // Allow re-selecting the same file
      input.value = '';
    }
  });
}

/**
 * Wires drag-and-drop onto a target element.
 *
 * @param {HTMLElement} target
 * @param {(img: HTMLImageElement) => void} onLoad
 * @param {(err: Error) => void} onError
 */
export function bindDragAndDrop(target, onLoad, onError) {
  target.addEventListener('dragover', (e) => {
    e.preventDefault();
  });

  target.addEventListener('drop', async (e) => {
    e.preventDefault();
    const file = e.dataTransfer?.files?.[0];

    try {
      const img = await loadImageFromFile(file);
      onLoad(img);
    } catch (err) {
      onError(err);
    }
  });
}
