// Installation support is cloud-only; sample previews do not register a worker.
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js', {scope:'/', updateViaCache:'none'})
      .catch(() => console.warn('App installation support is unavailable; the website still works.'));
  });
}
