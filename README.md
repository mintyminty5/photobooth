# 인생네컷 포토부스 · QR로 받기

## 폴더 구조
```
index.html            앱 본체 (QR 받기 버튼 포함)
p.html                QR을 스캔하면 열리는 다운로드 페이지 (/p/아이디)
qrcode.js             QR 생성 라이브러리 (MIT)
start-a.jpg           시작 화면 일러스트
netlify.toml          주소 연결·보안 헤더
package.json          서버 함수가 쓰는 @netlify/blobs
netlify/functions/    upload / photo / cleanup (+ _shared)
```

## 배포 (드래그 업로드는 안 돼요)
서버 함수가 있어서 아래 둘 중 하나로 배포해야 해요.

**A. GitHub 연결 (추천)**
1. 이 폴더 전체를 GitHub 저장소에 올린다 (node_modules 제외)
2. Netlify → Add new site → Import from Git → 저장소 선택
3. Build command 비움, Publish directory `.` (netlify.toml에 이미 있음)

**B. Netlify CLI**
```
npm i -g netlify-cli
netlify login
netlify link        # 기존 warm-peony-8 사이트 선택
npm install
netlify deploy --prod
```
기존 사이트(warm-peony-8)에 연결하면 주소는 그대로예요.

## 설정값 (Netlify → Site configuration → Environment variables, 선택)
- `RETENTION_MIN` 보관 시간(분), 기본 60. 바꾸면 index.html의 `RETENTION_TEXT`도 같이 수정
- `RATE_LIMIT` 한 사람이 1시간에 올릴 수 있는 횟수, 기본 10

## 개인정보 동작 요약
- QR에는 사진이 아니라 주소(긴 임의 아이디)만 들어감, 목록·갤러리 없음
- 기본 1시간 뒤 삭제: 열어볼 때 확인해서 삭제 + 매시간 자동 정리(cleanup)
- 앱의 "지금 삭제하기"는 업로드한 기기만 가능 (삭제 토큰은 그 기기 화면에만 있음)
- 사진을 다시 만들거나 창을 닫으면 이전 QR 사진은 삭제 요청을 보냄
- 서버가 안 되면 QR 대신 기존 "저장하기"로 안내

## 테스트 체크리스트
- 아이폰 Safari / 안드로이드 Chrome / 카톡 인앱에서 QR 스캔 → 저장 확인
- 1시간(테스트할 땐 RETENTION_MIN=2) 뒤 QR 링크가 "사라졌어요"로 바뀌는지
- 같은 기기에서 11번째 업로드가 막히는지
