// Lightweight shim for raf package
export default function raf(callback) {
  return setTimeout(callback, 16);
}

export function polyfill() {
  if (typeof window !== 'undefined') {
    if (!window.requestAnimationFrame) {
      window.requestAnimationFrame = function (cb) { return setTimeout(cb, 16); };
    }
    if (!window.cancelAnimationFrame) {
      window.cancelAnimationFrame = function (id) { clearTimeout(id); };
    }
  }
}
