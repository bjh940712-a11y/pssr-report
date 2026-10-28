// 공급전 안전점검 · 매일 아침 09:00(KST) 「보고하셨나요?」 알림 + 만료 자료 정리
// GitHub Actions(.github/workflows/pssr-reminder.yml)에서 실행됩니다.
// 필요: 저장소 Secrets 「FIREBASE_SERVICE_ACCOUNT」 = Firebase 서비스 계정 키(JSON) 전체
import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getMessaging } from 'firebase-admin/messaging';
import { plan } from './remind-plan.mjs';

const raw = process.env.FIREBASE_SERVICE_ACCOUNT;
if (!raw) { console.error('FIREBASE_SERVICE_ACCOUNT 비밀값이 없습니다 (저장소 Settings → Secrets and variables → Actions).'); process.exit(1); }
initializeApp({ credential: cert(JSON.parse(raw)) });
const db = getFirestore(), fcm = getMessaging();
const DRY = process.env.DRY_RUN === '1';
const SITE = (process.env.SITE_URL || '').replace(/\/?$/, '/');
const now = Date.now();
const ms = t => (t && t.toMillis ? t.toMillis() : (t ? +new Date(t) : 0));

// 1) 만료된 자료 정리 (앱을 아무도 열지 않아도 7일이 지나면 서버에서 지워지도록)
let purged = 0;
for (const col of ['fieldPhotos', 'fieldPhotoData', 'fieldCases']) {
  const s = await db.collection(col).where('expireAt', '<', new Date(now)).limit(400).get();
  if (!s.empty && !DRY) { const b = db.batch(); s.docs.forEach(d => b.delete(d.ref)); await b.commit(); }
  purged += s.size;
}

// 2) 알림 계획
const photos = (await db.collection('fieldPhotos').get()).docs.map(d => {
  const x = d.data(); return { id: d.id, by: x.by, kind: x.kind, done: !!x.done, expireAt: ms(x.expireAt) };
});
const members = {}; (await db.collection('members').get()).docs.forEach(d => { members[d.id] = d.data(); });
const msgs = plan(photos, members, now);

// 3) 기기(토큰)별 발송
const tokens = {}; const tokenRef = {};
(await db.collection('pushTokens').get()).docs.forEach(d => { const x = d.data(); (tokens[x.uid] ||= []).push(x.token); tokenRef[x.token] = d.ref; });
let sent = 0, failed = 0, removed = 0;
for (const m of msgs) {
  const list = tokens[m.uid] || [];
  console.log(`${m.tag} → 기기 ${list.length}대 | ${m.title} | ${m.body}`);   // 문구에는 개인정보 없음
  if (DRY || !list.length) continue;
  const res = await fcm.sendEach(list.map(token => ({
    token,
    data: { title: m.title, body: m.body, tag: m.tag, link: SITE ? SITE + 'field.html?app=1' : '' },
    webpush: { headers: { Urgency: 'high', TTL: String(12 * 3600) } },
  })));
  res.responses.forEach((r, i) => {
    if (r.success) { sent++; return; }
    failed++;
    const code = r.error && r.error.code;
    if (/registration-token-not-registered|invalid-registration-token|invalid-argument/.test(code || '')) { tokenRef[list[i]].delete().catch(() => {}); removed++; }
  });
}
console.log(`정리 ${purged}건 · 알림 ${msgs.length}개 계획 · 발송 성공 ${sent} · 실패 ${failed} · 만료 기기 삭제 ${removed}${DRY ? ' (확인만, 실제 발송·삭제 안 함)' : ''}`);
