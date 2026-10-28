// 공급전 안전점검 앱 — 화면 저장(오프라인 실행) 서비스워커
// 개인정보·서버 데이터(Firebase 통신)는 저장하지 않고, 앱 화면과 공개 라이브러리만 저장합니다.
const VER = 'pssr-v18';
const SHELL = ['./', './index.html', './field.html', './firebase-config.js', './companies.lock.js',
  './manifest.webmanifest', './icon-192.png', './icon-512.png', './icon-maskable-512.png', './apple-touch-icon.png', './favicon.png'];
self.addEventListener('install', e => {
  e.waitUntil(caches.open(VER).then(c => Promise.all(SHELL.map(u => c.add(new Request(u, {cache: 'reload'})).catch(() => {})))).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== VER).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  // 앱 파일(같은 사이트): 항상 최신을 먼저 받고, 안 되면 저장본
  if (url.origin === location.origin){
    e.respondWith(fetch(req).then(res => {
      if (res.ok){ const copy = res.clone(); caches.open(VER).then(c => c.put(req.url.split('#')[0].replace(/\?.*$/, '') || req, copy)); }
      return res;
    }).catch(() => caches.match(req, {ignoreSearch: true}).then(r => r || caches.match('./field.html'))));
    return;
  }
  // 공개 라이브러리(cdnjs, Firebase SDK 파일)만 저장 — Firebase 데이터 통신(googleapis)은 저장하지 않음
  if (url.hostname === 'cdnjs.cloudflare.com' || (url.hostname === 'www.gstatic.com' && url.pathname.startsWith('/firebasejs/'))){
    e.respondWith(caches.match(req).then(hit => hit || fetch(req).then(res => {
      if (res.ok || res.type === 'opaque'){ const copy = res.clone(); caches.open(VER).then(c => c.put(req, copy)); }
      return res;
    })));
  }
});
