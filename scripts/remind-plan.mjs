// 공급전 안전점검 · 아침 알림 계획 (순수 계산 — 서버 연결 없음, 테스트 가능)
// 입력: 현장 자료 메타(fieldPhotos), 직원 명단(members), 지금 시각
// 출력: 누구에게 어떤 알림을 보낼지 [{uid, title, body, tag}]
// 알림 문구에는 건수·날짜만 넣고 이름·주소·라벨은 넣지 않습니다.

const KST = 9 * 3600e3;
const WD = '일월화수목금토';
const kstParts = t => { const d = new Date(t + KST); return {y: d.getUTCFullYear(), m: d.getUTCMonth(), d: d.getUTCDate(), w: d.getUTCDay(), hh: d.getUTCHours(), mi: d.getUTCMinutes()}; };
const kstDayStart = (t, add = 0) => { const p = kstParts(t); return Date.UTC(p.y, p.m, p.d + add) - KST; };
const pad = n => String(n).padStart(2, '0');
export const fmtWhen = (t, now) => {
  const p = kstParts(t), hm = `${pad(p.hh)}:${pad(p.mi)}`;
  if (t < kstDayStart(now, 1)) return `오늘 ${hm}`;
  if (t < kstDayStart(now, 2)) return `내일(${p.m + 1}/${p.d} ${WD[p.w]}) ${hm}`;
  return `${p.m + 1}/${p.d}(${WD[p.w]}) ${hm}`;
};
const KIND = {photo: '결과지', doc: '서류', sign: '서명'};
const kinds = list => {
  const c = {}; for (const p of list) { const k = KIND[p.kind] ? p.kind : 'photo'; c[k] = (c[k] || 0) + 1; }
  return Object.keys(KIND).filter(k => c[k]).map(k => `${KIND[k]} ${c[k]}`).join('·');
};

/**
 * @param photos  [{id, by, kind, done, expireAt(ms)}]
 * @param members {uid: {role}}
 * @param now     ms
 */
export function plan(photos, members, now){
  const until = kstDayStart(now, 2);                       // 내일 24:00(KST)까지 지워질 것
  const open = photos.filter(p => !p.done && p.expireAt > now);
  const due = open.filter(p => p.expireAt <= until);
  const admins = Object.keys(members).filter(u => members[u] && members[u].role === 'admin');
  const out = [];
  // 1) 자료를 올린 직원 본인 (마스터는 아래 요약으로 받음)
  const byUser = {};
  for (const p of due) (byUser[p.by] ||= []).push(p);
  for (const [uid, list] of Object.entries(byUser)){
    if (admins.includes(uid)) continue;
    const first = Math.min(...list.map(p => p.expireAt));
    out.push({uid, tag: 'pssr-remind', title: '보고하셨나요? 📋',
      body: `현장 자료 ${list.length}건(${kinds(list)})이 ${fmtWhen(first, now)}에 서버에서 삭제됩니다. 사무실 PC에서 보고서에 첨부해 주세요.`});
  }
  // 2) 마스터 계정: 전체 요약 (미보고 자료가 하나라도 있으면)
  if (open.length){
    const people = new Set(open.map(p => p.by)).size;
    const first = due.length ? Math.min(...due.map(p => p.expireAt)) : 0;
    for (const uid of admins){
      const mine = due.filter(p => p.by === uid).length;
      out.push({uid, tag: 'pssr-summary', title: '현장 자료 보고 현황',
        body: `미보고 ${open.length}건 (직원 ${people}명)` +
              (due.length ? ` · 그중 ${due.length}건이 ${fmtWhen(first, now)}부터 삭제${mine ? ` (내 자료 ${mine}건 포함)` : ''}` : ' · 내일까지 삭제될 자료는 없습니다')});
    }
  }
  return out;
}
