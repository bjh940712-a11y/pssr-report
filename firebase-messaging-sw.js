// 공급전 안전점검 · 아침 알림 수신 (Firebase Cloud Messaging)
// 서버(GitHub Actions)가 매일 09:00에 보내는 「보고하셨나요?」 알림을 휴대폰 알림으로 띄웁니다.
// 알림 내용에는 이름·주소 같은 개인정보가 들어가지 않습니다 (건수와 삭제 예정일만).
self.window = self;   // firebase-config.js 가 window.FIREBASE_CONFIG 형태라서
importScripts(
  'https://www.gstatic.com/firebasejs/10.14.1/firebase-app-compat.js',
  'https://www.gstatic.com/firebasejs/10.14.1/firebase-messaging-compat.js',
  'firebase-config.js'
);

const APP_URL = new URL('../field.html?app=1', self.registration.scope).href;   // 이 파일의 범위(./fcm/) 기준 → 현장 화면

if (self.FIREBASE_CONFIG && self.FIREBASE_CONFIG.apiKey){
  firebase.initializeApp(self.FIREBASE_CONFIG);
  firebase.messaging().onBackgroundMessage(m => {
    const d = (m && m.data) || {};
    return self.registration.showNotification(d.title || '공급전 안전점검', {
      body: d.body || '', icon: '../icon-192.png', badge: '../icon-192.png',
      tag: d.tag || 'pssr-remind', renotify: true, data: {link: d.link || APP_URL},
    });
  });
}

self.addEventListener('notificationclick', e => {
  e.notification.close();
  const link = (e.notification.data && e.notification.data.link) || APP_URL;
  e.waitUntil((async () => {
    const all = await clients.matchAll({type: 'window', includeUncontrolled: true});
    for (const c of all){ if (c.url.includes('/field.html') && 'focus' in c){ try{ await c.navigate(link); }catch(_){} return c.focus(); } }
    return clients.openWindow(link);
  })());
});
