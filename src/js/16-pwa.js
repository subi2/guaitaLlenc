/* ── PWA: service worker (instal·lació i ús sense connexió) ── */
const PWA = GL.pwa = {
  register() {
    try {
      if (!('serviceWorker' in navigator)) return;
      if (!/^https?:$/.test(location.protocol)) return; // des de file:// no es pot registrar
      navigator.serviceWorker.register('sw.js').catch(e => console.warn('service worker', e));
    } catch (e) { console.warn('service worker', e); }
  },
};
