# 약속 잡기 (meet)

친구들이랑 약속 날짜 정하는 페이지. https://benny3s.github.io/when/
(옛 주소 `/meet/` 는 저장소 `benny3s/meet` 의 넘겨주기 페이지가 `?m=…` 그대로 여기로 보낸다)

- 링크 하나 = 약속 하나 (`?m=<약속id>`). `약속 선택` 에서 전체 목록을 볼 수 있고, `?admin` 은 관리 화면
- 로그인 없음. 들어와서 이름 적으면 바로 참여자가 된다
- 줄 = 사람, 칸 = 날짜, 내용 = 되는 시간 / ✗ / 메모 (밴드매니저와 같은 감각)
- 결과 보기 → 추천 시간 → `정하기` 로 확정
- 남이 입력하면 **새로고침 없이** 바로 보인다

## 구조
- `index.html` — 페이지 한 장 (HTML+CSS+JS). GitHub Pages
- 저장소 — Firebase 프로젝트 `benny-apps` 의 Firestore (2026-09-28 부터)
  - `meets/{id}` 약속 한 건 · `meets/{id}/people/{pid}` 사람마다 문서 하나 · `meets/{id}/log` 저장 기록(붙이기만)
  - 보안 규칙은 공용 폴더 `benny-apps/firestore.rules` 에서 관리 (밴드매니저 등 다른 앱과 같이 씀)
- 공용 파일 `ui.css` · `core.js` · `sched.js` — 밴드매니저(/band-manager/)도 **같은 파일을 불러 쓴다**.
  여기를 고치면 두 앱이 같이 바뀐다.
  ⚠️ 고친 뒤에는 **두 페이지의 `?v=날짜` 를 같이 올린다** — `index.html`(여기)과 `benny3s/band-manager` 의 `index.html`.
  안 올리면 폰이 옛 파일을 계속 쓴다
- `apps-script.gs` — **옛 서버 (2026-09-28 까지)**. Apps Script + 구글 시트. 지금은 안 쓰지만
  시트에 남은 옛 기록('기록' 탭)을 보거나 되살릴 때를 위해 남겨 둔다

밴드매니저(`band-manager`)의 캘린더 부분에서 갈라져 나왔다.
