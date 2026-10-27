// 현장 사진함 Firebase 설정 (pssr-yeongcheon)
// 이 값은 공개되어도 괜찮은 연결 주소이며, 실제 접근은 로그인 + 보안 규칙으로 막습니다.
window.FIREBASE_CONFIG = {
  apiKey: "AIzaSyB_8eIJhFZCQR0rhqa1Wjg1y4ouBNeYeN4",
  authDomain: "pssr-yeongcheon.firebaseapp.com",
  projectId: "pssr-yeongcheon",
  storageBucket: "pssr-yeongcheon.firebasestorage.app",
  messagingSenderId: "551281297991",
  appId: "1:551281297991:web:04159ec6aa1231475bbf62"
};

// 아침 알림(웹 푸시) 키 — Firebase 콘솔 → 프로젝트 설정 → 클라우드 메시징 → 웹 푸시 인증서 → 「키 쌍」 값을 따옴표 안에 붙여넣기
window.FIREBASE_VAPID_KEY = "BMsMbS1NsWmTLpZqbxUAUfthl0jHtl7HIwt2b3xnTc-s9twduEACVibAULL9hBeCA5S7mGA7jvd3p28rWfwBjYM";
