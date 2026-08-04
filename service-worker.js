/* Service worker MÍNIMO (fase de desenvolvimento):
   - Torna o app instalável (PWA), mas NÃO faz cache agressivo,
     pra não servir páginas velhas enquanto a gente edita.
   - O cache offline "de verdade" entra na hora de promover pra produção. */
self.addEventListener('install', e => self.skipWaiting());
self.addEventListener('activate', e => e.waitUntil(self.clients.claim()));
self.addEventListener('fetch', () => { /* passa direto pra rede — sem cache por enquanto */ });
