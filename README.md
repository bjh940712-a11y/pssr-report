# 공급전 안전점검 결과보고서 웹앱 — 배포·설정 안내

| 파일 | 용도 |
|---|---|
| `index.html` | 사무실 PC용 본 앱 (ERP 불러오기 · 보고서 · 엑셀/PDF/인쇄 · 첨부 병합 · 현장 사진함) |
| `field.html` | 현장 휴대폰용 촬영 페이지 (기밀시험 결과지 촬영 → 업로드) |
| `firebase-config.js` | Firebase 연결 설정 (1회 입력) |
| `firestore.rules` | Firestore 보안 규칙 (Firebase 콘솔에 붙여넣기) |
| `companies.lock.js` | (선택) 시공업체 목록 갱신용 암호화 파일 — 관리자가 앱에서 만들어 올림 |

> 서버(Firestore)에는 **기밀시험 결과지 사진·미리보기·촬영번호(예: 10/23 #3)·시각**만 저장됩니다.
> 주소·이름·계약번호·시공내역서 등은 저장할 수 없도록 앱과 보안 규칙 양쪽에서 막혀 있습니다.
> 사진은 PC에서 병합 PDF를 저장하면 즉시, 그렇지 않아도 3일 뒤 삭제됩니다.

---

## 1단계. Firebase 프로젝트 만들기 (무료 Spark 요금제, 카드 등록 불필요)

1. https://console.firebase.google.com 접속 → 회사용 Google 계정으로 로그인
2. **프로젝트 추가** → 이름 예: `pssr-yeongcheon` → Google 애널리틱스 **사용 안 함** → 만들기
3. 프로젝트 개요 화면에서 **웹(</>) 아이콘** 클릭 → 앱 닉네임 예: `pssr-web` → *Firebase 호스팅은 체크하지 않음* → 앱 등록
4. 화면에 나오는 `const firebaseConfig = { ... }` 의 중괄호 안 값을 복사해 **`firebase-config.js`** 에 붙여넣기

```js
window.FIREBASE_CONFIG = {
  apiKey: "AIza....",
  authDomain: "pssr-yeongcheon.firebaseapp.com",
  projectId: "pssr-yeongcheon",
  storageBucket: "pssr-yeongcheon.firebasestorage.app",
  messagingSenderId: "1234567890",
  appId: "1:1234567890:web:abcd..."
};
```

## 2단계. Firestore 데이터베이스 만들기

1. 왼쪽 메뉴 **빌드 → Firestore Database → 데이터베이스 만들기**
2. 버전: **Standard**, 위치: **asia-northeast3 (서울)** — *위치는 나중에 바꿀 수 없습니다*
3. **프로덕션 모드에서 시작** → 만들기
4. 상단 **규칙** 탭 → 기존 내용을 모두 지우고 `firestore.rules` 파일 내용을 붙여넣기 → **게시**

## 3단계. 로그인(직원 계정) 설정

1. **빌드 → Authentication → 시작하기 → 로그인 방법** 탭 → **이메일/비밀번호** → 사용 설정 → 저장
2. **사용자** 탭 → **사용자 추가** → 직원 이메일·비밀번호 입력 (현장·사무실 같은 계정 사용 가능)
3. 추가된 사용자의 **사용자 UID** 복사
4. **Firestore Database → 데이터** 탭 → **컬렉션 시작**
   - 컬렉션 ID: `members`
   - 문서 ID: 방금 복사한 **UID**
   - 필드: `active` / 유형 boolean / 값 true → 저장
5. 직원을 추가할 때마다 2~4 반복 (members 문서가 없으면 로그인해도 사진함을 쓸 수 없습니다)
   - 퇴사·이동 시: members 문서 삭제 + Authentication에서 사용자 사용 중지

## 4단계. (선택) 서버 자동 삭제(TTL) 설정

앱이 PC 로그인 때마다 만료 사진을 지우지만, PC를 며칠 안 켜도 지워지도록 하려면:

- **Firestore Database → TTL**(또는 *Time-to-live*) → **정책 만들기**
  - 컬렉션 그룹 `fieldPhotos`, 타임스탬프 필드 `expireAt`
  - 컬렉션 그룹 `fieldPhotoData`, 타임스탬프 필드 `expireAt`

## 5단계. GitHub Pages 배포

1. https://github.com 로그인 → 오른쪽 위 **+ → New repository**
   - 이름 예: `pssr-report`
   - 공개 범위: **Public** (무료 GitHub Pages는 Public 저장소만 가능)
   - 시공업체 목록은 암호화되어 있어 파일을 열어봐도 업체명·연락처를 읽을 수 없습니다 (아래 7단계 참고)
2. 저장소 화면 **Add file → Upload files** → `index.html`, `field.html`, `firebase-config.js`, `companies.lock.js`, `firestore.rules`, `README.md` 끌어다 놓기 → **Commit changes**
3. **Settings → Pages** → Source: **Deploy from a branch** → Branch: `main` / `(root)` → **Save**
4. 1~2분 뒤 표시되는 주소 확인
   - PC: `https://<GitHub아이디>.github.io/pssr-report/`
   - 현장: `https://<GitHub아이디>.github.io/pssr-report/field.html`
5. **Firebase 콘솔 → Authentication → 설정 → 승인된 도메인 → 도메인 추가** → `<GitHub아이디>.github.io`

> 수정본을 올릴 때는 같은 방법으로 파일을 다시 업로드(덮어쓰기)하면 됩니다. 각 PC의 작업 내용(수정값·첨부·업체)은 유지됩니다.

## 6단계. 사용 방법

**현장(휴대폰)**
1. `.../field.html` 접속 → 직원 계정 로그인 (한 번 로그인하면 유지)
2. 브라우저 메뉴 → **홈 화면에 추가** 하면 앱처럼 실행 가능
3. **📷 결과지 촬영** → 자동 압축·전송 → 「✓ 전송 완료」 확인

**사무실(PC, Chrome/Edge)**
1. ERP 파일 불러오기 → 건 선택
2. 상단 **📷 현장 사진함** → 처음 한 번 로그인 → 촬영번호·시각으로 사진 확인(클릭하면 크게 보기)
3. 사진을 편집 화면 **「5. 추가 첨부파일」로 끌어다 놓기** 또는 **현재 건에 첨부**
4. **📎 첨부 병합 PDF 저장** → 저장 폴더에 PDF 생성 → 서버의 해당 사진 자동 삭제

**HTML 파일만 받아 쓰는 PC**: `index.html` → 「기본값 설정」 탭 → 「현장 사진함 연결」에 firebaseConfig 붙여넣기 → 설정 저장

## 7단계. 시공업체 목록 (암호화) 관리

- **보고서 자동 채우기는 비밀번호 없이** 동작합니다. 업체 정보 하나하나가 그 업체의 ERP 업체명으로 잠겨 있어, ERP 파일에 해당 업체명이 있을 때만 그 업체 정보가 열립니다.
- **「시공업체 관리」 탭은 관리자 비밀번호**를 입력해야 목록이 보입니다. 페이지를 닫거나 「잠그기」를 누르면 다시 잠깁니다.
- 초기 관리자 비밀번호는 별도로 전달받은 값을 사용하고, **처음 한 번 꼭 바꿔 주세요.**

**비밀번호 변경 / 업체 추가·수정을 모든 직원에게 반영하는 방법**
1. 「시공업체 관리」 → 비밀번호로 열기 → 업체 추가·수정
2. **🔒 배포용 목록 만들기 / 비밀번호 변경** → 새 비밀번호 2회 입력 → `companies.lock.js` 다운로드
3. GitHub 저장소에 `companies.lock.js` 업로드(덮어쓰기) → 모든 직원에게 새 목록·새 비밀번호 적용

> 주의: 업체명을 미리 알고 하나씩 대입해 보는 방식까지 막지는 못합니다 (ERP 자료 없이 목록 전체를 보는 것을 막는 수준).
> 관리자 비밀번호는 12자 이상, 다른 곳에 쓰지 않는 값으로 정해 주세요.
> HTML 파일만 따로 받아 쓰는 PC는 `companies.lock.js`가 없으므로, 업체 목록을 바꾸면 새 `index.html`을 다시 전달해 주세요 (요청 시 재빌드).

## 무료 사용량 (Spark 요금제)

| 항목 | 무료 한도 | 이 앱 기준 |
|---|---|---|
| 저장 용량 | 1 GiB | 사진 1장 약 0.2~0.7MB → 동시에 수천 장까지 (3일 후 삭제되므로 여유) |
| 쓰기 | 하루 20,000회 | 사진 1장 = 2회 |
| 읽기 | 하루 50,000회 | 사진함 열 때 사진 수만큼 |

## 보안 메모

- `firebase-config.js`의 apiKey는 공개되어도 되는 값입니다 (Firebase 공식 안내). 데이터 접근은 **로그인 + members 등록 + 보안 규칙**으로만 허용됩니다.
- 누군가 apiKey로 임의 계정을 만들어도 `members`에 없으면 아무것도 읽거나 쓸 수 없습니다.
- 결과지 종이에 고객명·주소가 인쇄되어 있다면, 사진이 서버에 머무는 동안(최대 3일)에는 해당 정보가 포함됩니다. 필요 시 촬영 범위를 사내 기준에 맞게 정해 주세요.
