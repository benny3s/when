/* benny-apps 공용 일정 — 누구세요 · 표/달력 · ○△✕ 입력창 · 날짜 고르기 · 결과 보기(후보·📌 정하기) · 친구 추가
   약속 잡자와 밴드매니저가 **같은 파일**을 쓴다 (2026-09-28 Benny: "코드 중복 없이 공용으로").
   페이지(호스트)가 해 줄 것:
     · <div data-sched="who"></div>, <div data-sched="sheet"></div> 자리를 둔다 — 여기에 카드가 들어간다
     · renderAll() — 화면 전체를 그린다. 안에서 renderSched() 를 부른다
     · showNew() — 약속이 없거나 지워졌을 때 보여줄 화면
     · (선택) SCHED_COL = () => 일정 문서들이 있는 컬렉션 (기본: meets) */
const SCHED_HTML = {
  who: `  <!-- 누구세요 — 접힌 상태는 한 줄, 줄을 누르면 펼쳐진다 (2026-09-22k Benny) -->
  <div class="card" id="whoCard">
    <div id="whoPicked" hidden>
      <div class="spread whobar" id="whoBar" role="button" tabindex="0" aria-expanded="false">
        <span class="wholine"><span class="dot"></span><b id="whoName"></b> 님으로 입력하는 중</span>
        <span class="row" style="gap:6px;flex:0 0 auto">
          <button class="btn soft sm" id="whoFriend" type="button">＋ 친구</button>
          <button class="btn ghost sm" id="whoRename" type="button" hidden>✎ 수정</button>
          <span class="caret" id="whoCaret" aria-hidden="true">▾</span>
        </span>
      </div>
    </div>
    <div id="whoPick">
      <h2 id="whoH2">누구세요?</h2>
      <p class="hint" id="whoHint"></p>
      <div class="chips" id="whoChips"></div>
      <div class="row" id="whoAddRow" style="margin-top:10px" hidden>
        <input type="text" id="whoInput" maxlength="30" placeholder="이름" style="flex:1 1 150px">
        <button class="btn primary" id="whoGo" type="button">시작</button>
        <button class="btn ghost" id="whoCancel" type="button" hidden>취소</button>
      </div>
      <div class="row" id="whoKeepRow" style="margin-top:10px" hidden>
        <button class="btn soft" id="whoFriend2" type="button">＋ 친구 추가</button>
      </div>
    </div>
  </div>`,
  sheet: `  <!-- 아직 날짜가 없을 때 -->
  <div class="card" id="emptyCard" hidden>
    <h2>날짜를 골라주세요</h2>
    <p class="hint">후보 날짜를 고르면 표가 나옵니다.</p>
    <button class="btn primary wide" id="calOpenBtn" type="button">📅 날짜 고르기</button>
  </div>

  <!-- 표 -->
  <div class="card" id="sheetCard">
    <div class="seg" id="viewSeg" role="tablist">
      <!-- 달력 = 칸을 누르면 내 입력, 표 = 모두의 응답 (2026-10-01 Benny: "'내 입력' 대신 '달력 보기'") -->
      <button class="segb" id="segCal" type="button" role="tab">📅 달력 보기</button>
      <button class="segb" id="segTab" type="button" role="tab">👥 모두 보기</button>
    </div>
    <p class="hint" id="sheetHint" style="margin:0 0 10px"></p>
    <div id="calView" hidden>
      <div class="calnav"><b id="cvLabel"></b></div>
      <div class="cal cv" id="cvGrid"></div>
    </div>
    <!-- PC 에서 옆으로 넘기기 — 사람이 많으면 아래 스크롤바까지 내려가기 힘들다 (2026-10-01 Benny) -->
    <div class="hs-outer" id="tabOuter">
      <div class="grid-wrap" id="tabView"><table class="sheet" id="sheet"></table></div>
      <div class="hs-rail l"><button class="hs-btn" id="hsL" type="button" aria-label="왼쪽으로 넘기기">‹</button></div>
      <div class="hs-rail r"><button class="hs-btn" id="hsR" type="button" aria-label="오른쪽으로 넘기기">›</button></div>
    </div>
  </div>`,
  modals: `<!-- ══════════ 가이드 — 넣는 방법 (2026-10-01: 표 위 안내를 팝업으로) ══════════ -->
<div class="modal" id="guideModal" hidden>
  <div class="sheet" role="dialog" aria-modal="true" aria-labelledby="guideTitle">
    <div class="spread">
      <h2 style="margin:0" id="guideTitle">📝 이렇게 넣어주세요</h2>
      <button class="iconbtn" data-close type="button" title="닫기" aria-label="닫기">✕</button>
    </div>
    <ol class="guide">
      <li>위 <b>누구세요?</b>에서 <b>내 이름</b>을 누르기</li>
      <li><b>점선 칸</b>(아직 안 넣은 날)을 누르기</li>
      <li><b>○ 돼요 · △ 일부만 · ✕ 안 돼요 · – 미정</b> 중 하나 고르기 <span class="g-s">(△ 는 되는 시간을 몰라도 돼요)</span></li>
      <li>창을 닫으면 <b>자동 저장</b></li>
    </ol>
    <p class="hint" style="margin:10px 0 0">표의 날짜 머리를 누르면 그 날 누가 되는지 보고 📌 정할 수 있어요.</p>
  </div>
</div>
<!-- ══════════ 그 날 창 ══════════ -->
<div class="modal" id="dayModal" hidden>
  <div class="sheet" role="dialog" aria-modal="true">
    <div class="spread">
      <h2 style="margin:0" id="dmTitle"></h2>
      <span class="row tight" style="flex:0 0 auto">
        <button class="iconbtn" id="dmClose" type="button" title="닫기" aria-label="닫기">✕</button>
      </span>
    </div>
    <p class="dm-sum" id="dmSum"></p>
    <div id="dmNoName" hidden>
      <p class="hint" style="margin:6px 0 10px">이 날 시간을 입력하려면 이름을 먼저 골라주세요.</p>
      <button class="btn primary" id="dmName" type="button" style="margin-bottom:12px">이름 고르기 →</button>
    </div>
    <!-- 내 입력만 — ○ 는 한 번에 끝, △ 는 시간+이유, ✕ 는 이유만 (2026-09-28 Benny) -->
    <div id="dmMine" hidden>
      <div class="oxpick" role="group" aria-label="이 날 되나요?">
        <button class="ox o" id="dmO" type="button" aria-pressed="false"><span class="mk">○</span><span>돼요</span></button>
        <button class="ox t" id="dmT" type="button" aria-pressed="false"><span class="mk">△</span><span>일부만</span></button>
        <button class="ox x" id="dmX" type="button" aria-pressed="false"><span class="mk">✕</span><span>안 돼요</span></button>
        <button class="ox n" id="dmN" type="button" aria-pressed="false"><span class="mk">–</span><span>미정</span></button>
      </div>
      <div id="dmMore" hidden>
        <div id="dmHoursBox">
          <p class="dm-hint" id="dmState">시작 시간을 눌러주세요</p>
          <div class="tbar-wrap"><div class="tbar" id="dmHours"></div></div>
          <button class="dm-multi" id="dmMulti" type="button">＋ 여러 구간 넣기</button>
        </div>
        <input type="text" id="dmInput" maxlength="200" placeholder="이유 (선택)" aria-label="이유 (선택)">
        <button class="btn primary wide" id="dmSave" type="button">저장</button>
      </div>
    </div>
    <div class="dm-set" id="dmSet" hidden>
      <!-- 그날 요약 — 몇 명 되는지 · 시간별 인원 · 사람별 (2026-10-01 Benny: "헤더 날짜를 누르면 결과보기처럼 의미 있는 데이터") -->
      <div id="dmDay"></div>
      <!-- 📌 정하기 — 막대에서 시작·끝을 누르고, 코멘트는 선택 (2026-10-01 Benny: "17-20 합주 / 20-22 청모") -->
      <div class="dm-fix" id="dmFixBox">
        <p class="dm-hint fxst" id="dmFixState"></p>
        <div id="dmFixList"></div>
      </div>
      <div id="dmPeople"></div>
      <details class="dm-more">
        <summary>⚙ 시간대 바꾸기 · 후보에서 빼기</summary>
        <div class="dm-admin" style="margin-top:8px">
          <span class="hint" style="margin:0">이 날 시간</span>
          <span id="dmWin"></span>
          <span style="flex:1"></span>
          <button class="btn ghost danger" id="dmDrop" type="button">후보에서 빼기</button>
        </div>
      </details>
    </div>
  </div>
</div>
<!-- ══════════ 날짜 고르기 ══════════ -->
<div class="modal" id="calModal" hidden>
  <div class="sheet fixh" role="dialog" aria-modal="true">
    <div class="shead">
      <div style="min-width:0">
        <h2 style="margin:0">날짜 고르기</h2>
        <p class="hint" style="margin:2px 0 0">눌러서 넣고 빼세요</p>
      </div>
      <button class="iconbtn" type="button" data-close aria-label="닫기">✕</button>
    </div>
    <div class="sbody">
    <div class="calhead">
      <button class="nav" id="calPrev" type="button">‹</button>
      <b class="ym" id="calLabel"></b>
      <button class="nav" id="calNext" type="button">›</button>
      <span style="flex:1"></span>
      <button class="btn ghost sm" id="calToday" type="button">오늘로 이동</button>
    </div>
    <div class="cal" id="cal"></div>
    <div class="dowrow" id="dowRow">
      <button type="button" data-dow="0" class="sun">일</button>
      <button type="button" data-dow="1">월</button>
      <button type="button" data-dow="2">화</button>
      <button type="button" data-dow="3">수</button>
      <button type="button" data-dow="4">목</button>
      <button type="button" data-dow="5">금</button>
      <button type="button" data-dow="6" class="sat">토</button>
    </div>
    <p class="hint" style="margin-top:6px">요일 버튼 = 이 달의 그 요일을 한꺼번에 넣고 빼기</p>
    <div class="chips" id="dateChips" style="margin-top:12px"></div>
    <div class="fld" id="calHourFld" style="margin-top:16px"><span>기본 시간대 — 모든 날짜에 적용</span>
      <div class="hourrow">
        <button class="hourbtn" id="c_hs" type="button" data-h="18">18시</button>
        <span class="hint" style="margin:0">~</span>
        <button class="hourbtn" id="c_he" type="button" data-h="23">23시</button>
      </div>
    </div>
    </div>
    <div class="sfoot">
      <button class="btn ghost danger" id="calClear" type="button">전부 지우기</button>
      <button class="btn primary" type="button" data-close>다 골랐어요</button>
    </div>
  </div>
</div>
<!-- ══════════ 결과 ══════════
     키가 고정된 창이다 (2026-09-22c Benny: "아래 고정되어서 별로였던거고, 아래로 너무 길어져서 별로").
     내용이 늘어도 창 크기가 그대로라 보던 자리가 안 움직이고, 안쪽만 스크롤된다. -->
<div class="modal" id="heatModal" hidden>
  <div class="sheet fixh" role="dialog" aria-modal="true">
    <div class="shead">
      <div style="min-width:0">
        <h2 style="margin:0">언제가 제일 좋을까</h2>
        <p class="hint" id="resSub" style="margin:2px 0 0"></p>
      </div>
      <button class="iconbtn" type="button" data-close aria-label="닫기">✕</button>
    </div>
    <div class="sbody">
    <div id="picksCard"></div>
    <h3 class="subh" style="margin-top:18px">직접 고르기</h3>
    <p class="hint" style="margin:4px 0 0">날짜를 누르면 하루 전체, 칸을 누르면 한 시간씩 — 다시 누르면 빠져요. 숫자 = 되는 사람 수</p>
    <div class="grid-wrap" style="margin-top:12px"><div class="grid" id="heat"></div></div>
    </div>
  </div>
</div>
<!-- ══════════ 친구 추가 (프로필은 그대로) ══════════ -->
<div class="modal" id="friendModal" hidden>
  <div class="sheet" role="dialog" aria-modal="true" style="max-width:420px">
    <div class="spread">
      <h2 style="margin:0">친구 추가</h2>
      <button class="iconbtn" type="button" data-close aria-label="닫기">✕</button>
    </div>
    <p class="hint" id="fmHint" style="margin:4px 0 12px"></p>
    <div class="row nowrap">
      <input type="text" id="fmInput" maxlength="30" placeholder="이름을 적고 엔터" style="flex:1 1 auto">
      <button class="btn soft" id="fmAdd" type="button" style="flex:0 0 auto">＋</button>
    </div>
    <div class="chips" id="fmChips" style="margin-top:12px"></div>
    <div class="row" style="justify-content:flex-end;margin-top:16px">
      <button class="btn primary" type="button" data-close>다 넣었어요</button>
    </div>
  </div>
</div>`
};
/* 페이지의 자리(data-sched)에 카드를 끼우고, 창들은 body 끝에 붙인다 — 아래 코드가 이 요소들을 바로 찾는다 */
(function schedMount(){
  const put = (k) => { const el = document.querySelector('[data-sched="' + k + '"]'); if (el) el.outerHTML = SCHED_HTML[k]; };
  put("who"); put("sheet");
  document.body.insertAdjacentHTML("beforeend", SCHED_HTML.modals);
})();

/* ═══ 통신 — Firestore ═══
   화면 코드는 예전 서버와 똑같이 api({action:…}) 를 부르고 ST 모양의 상태를 돌려받는다.
   여기서 그 action 들을 Firestore 읽기·쓰기로 바꿔 준다.
   · 약속을 열면 onSnapshot 으로 지켜본다 → 남이 저장하면 **새로고침 없이** 바로 바뀐다
   · 쓰기는 로컬에 먼저 반영되고(지연 보정) 서버 확인은 뒤에 온다                        */
/* 일정 문서들이 있는 곳 — 약속 잡자는 meets, 밴드매니저는 자기 밴드 아래. 페이지가 SCHED_COL 을 정하면 그걸 쓴다 */
const meetsCol = () => (typeof SCHED_COL === "function" ? SCHED_COL() : db.collection("meets"));
const meetRef  = id => meetsCol().doc(id);
const peopleOf = id => meetRef(id).collection("people");

async function api(params){
  if (!FB_OK) throw fail("저장소를 불러오지 못했어요 — 네트워크를 확인하고 새로고침해 주세요");
  const t0 = Date.now();
  try {
    const a = params.action || "load";
    /* 읽기만 시간 제한. 쓰기는 오프라인이면 줄 서 있다가 연결되면 들어가므로 끊지 않는다 */
    const r = (a === "load" || a === "meet_all") ? await withTimeout(doAct(params), 45000) : await doAct(params);
    lastMs = Date.now() - t0;
    return r;
  } catch(e){ throw fail(errText(e)); }
}


let live = { id: "" };
function unwatch(){ (live.unsub || []).forEach(f => { try { f(); } catch(e){} }); live = { id: "" }; }
function watch(id){
  if (live.id === id && live.ready && !live.error) return live.ready;
  unwatch();
  const L = live = { id, meet: null, meetState: "wait", people: null, peopleCache: true, unsub: [], done: false };
  let ok, bad;
  L.ready = new Promise((a, b) => { ok = a; bad = b; });
  const check = () => {
    if (live !== L) return;
    const meetOk = L.meetState !== "wait";
    /* 캐시에 사람이 0명이면 진짜 0명인지 서버를 기다린다 (처음 여는 기기) */
    const peopleOk = L.people && (!L.peopleCache || L.people.length || L.meetState === "ok");
    if (!meetOk || !peopleOk) return;
    if (!L.done){ L.done = true; ok(); } else onLive();
  };
  const onErr = e => { if (live !== L) return; L.error = e; if (!L.done){ L.done = true; bad(e); } else { setStatus("연결이 끊겼어요 — 다시 연결하는 중…", "err"); setTimeout(() => { if (live === L && M === L.id) load(true); }, 3000); } };
  L.unsub.push(meetRef(id).onSnapshot({ includeMetadataChanges: true }, s => {
    if (!s.exists && s.metadata.fromCache && L.meetState === "wait") return;   // 캐시에 없음 ≠ 없는 약속
    L.meet = s.exists ? s.data({ serverTimestamps: "estimate" }) : null;
    L.meetState = s.exists ? "ok" : "gone";
    check();
  }, onErr));
  L.unsub.push(peopleOf(id).onSnapshot({ includeMetadataChanges: true }, s => {
    L.people = s.docs.map(d => Object.assign({ _id: d.id }, d.data({ serverTimestamps: "estimate" })));
    L.peopleCache = s.metadata.fromCache;
    check();
  }, onErr));
  return L.ready;
}
/** 지켜보던 약속이 바뀌었을 때 — 입력 중인 내 칸은 loadMine 이 알아서 지킨다 */
function onLive(){
  if (!M || live.id !== M) return;
  const st = buildST();
  if (st.gone){ ST = st; setStatus("이 약속은 지워졌어요", "err"); showNew(); return; }
  ST = st; absorb();
}
function buildST(){
  const out = { meet: null, members: [], dates: [], hourStart: 10, hourEnd: 22,
                windows: {}, hours: {}, notes: {}, edited: {}, picks: [], pid: {} };
  const m = live.meet;
  if (!m){ if (live.meetState === "gone") out.gone = true; return out; }
  out.meet = { id: live.id, title: m.title || "", place: m.place || "", memo: m.memo || "",
               fixed: m.fixed || "", fixNotes: cleanFixNotes(m.fixNotes), owner: m.owner || "", made: m.made || "",
               off: cleanOff(m.off) };
  out.hourStart = clampHour(m.hourStart, 10);
  out.hourEnd   = clampHour(m.hourEnd, 22);
  if (out.hourEnd <= out.hourStart){ out.hourStart = 10; out.hourEnd = 22; }
  out.dates   = cleanDates(m.dates || []);
  out.windows = parseWindows(m.windows || {});
  out.picks   = parsePicks(m.picks || []);
  const ms = t => (t && t.toMillis) ? t.toMillis() : Infinity;
  (live.people || []).slice().sort((a, b) => ms(a.added) - ms(b.added)).forEach(p => {
    const n = String(p.name || "").trim();
    if (!n || out.pid[n]) return;                  // 같은 이름이 둘이면 먼저 들어온 쪽
    out.pid[n] = p._id;
    /* 이 시간표에서 뺀 사람(off)은 명단·표·결과·인원에서 빠진다. 입력은 지우지 않는다 → 다시 켜면 그대로 (2026-09-30) */
    if (out.meet.off.includes(n)) return;
    out.members.push(n);
    const H = {}, N = {};
    for (const d in (p.hours || {})) if (Array.isArray(p.hours[d])) H[d] = cleanHours(p.hours[d]);
    for (const d in (p.notes || {})) if (p.notes[d]) N[d] = String(p.notes[d]);
    if (Object.keys(H).length) out.hours[n] = H;
    if (Object.keys(N).length) out.notes[n] = N;
    const e = stampOf(p.edited); if (e) out.edited[n] = e;
  });
  /* 페이지가 순서를 정해 주면 따른다 (밴드매니저: 밴드 멤버 순서) — 없는 이름은 뒤에 원래 순서대로 */
  if (typeof memberOrder === "function"){
    const o = memberOrder() || [], idx = n => { const i = o.indexOf(n); return i < 0 ? 1e6 : i; };
    out.members = out.members.map((n, k) => [n, k]).sort((x, y) => idx(x[0]) - idx(y[0]) || x[1] - y[1]).map(x => x[0]);
  }
  return out;
}
function pidOf(n){ return buildST().pid[n] || ""; }
/** 이 시간표에서 뺀 사람들 — 배열/JSON/쉼표 무엇이 와도 이름 배열로 */
function cleanOff(v){
  let a = v;
  if (typeof a === "string"){ try { a = JSON.parse(a); } catch(e){ a = a.split(","); } }
  if (!Array.isArray(a)) return [];
  return Array.from(new Set(a.map(x => String(x || "").trim().slice(0, 30)).filter(Boolean))).slice(0, 50);
}
/** 📌 정한 것마다 붙이는 짧은 코멘트 {"2026-10-11 17:00~20:00": "합주"} — JSON 이 와도 된다 (2026-10-01) */
function cleanFixNotes(v){
  let o = v;
  if (typeof o === "string"){ try { o = JSON.parse(o); } catch(e){ o = {}; } }
  const out = {};
  if (!o || typeof o !== "object" || Array.isArray(o)) return out;
  Object.keys(o).sort().forEach(k => {
    const t = String(o[k] == null ? "" : o[k]).replace(/\s+/g, " ").trim().slice(0, FIXNOTE_MAX);
    if (t && /^\d{4}-\d{2}-\d{2}/.test(k) && k.length <= 40 && Object.keys(out).length < 20) out[k] = t;
  });
  return out;
}
const FIXNOTE_MAX = 30;
function offList(){ return (meet() && meet().off) || []; }
function isOff(n){ return !!n && offList().includes(n); }
/** 이름 비교용 열쇠 — 앞뒤·연속 공백과 대소문자를 무시 (같은 이름 막기) */
function titleKeyOf(t){ return String(t || "").replace(/\s+/g, " ").trim().toLowerCase(); }
function newPerson(name, extra){
  return Object.assign({ name: name, hours: {}, notes: {}, edited: null, added: TS.now() }, extra || {});
}
async function titleTakenRemote(title, skipId){
  const k = titleKeyOf(title);
  if (!k) return false;
  const q = await meetsCol().where("titleKey", "==", k).limit(3).get();
  return q.docs.some(d => d.id !== skipId);
}

/** 약속 여러 개를 사람 문서까지 같이 지운다. (저장 기록 log 는 남는다 — 되살릴 때 쓴다) */
async function removeMeets(ids){
  for (const id of ids){
    const ps = await peopleOf(id).get();
    const refs = ps.docs.map(d => d.ref).concat([meetRef(id)]);
    for (let i = 0; i < refs.length; i += 400){
      const b = db.batch(); refs.slice(i, i + 400).forEach(r => b.delete(r)); await b.commit();
    }
  }
}

/** 목록 — full 이면 관리 화면용으로 참여자·응답 수·마지막 수정까지 */
async function listMeets(full){
  const qs = await meetsCol().get();
  const rows = qs.docs.map(d => {
    const m = d.data(), ds = cleanDates(m.dates || []);
    return { id: d.id, title: m.title || "", place: m.place || "", memo: m.memo || "", fixed: m.fixed || "",
             owner: m.owner || "", made: m.made || "", edited: "", members: [], answered: 0,
             dates: ds.length, from: ds[0] || "", to: ds[ds.length - 1] || "" };
  });
  if (full) await Promise.all(rows.map(async r => {
    const ps = await peopleOf(r.id).get();
    ps.docs.map(x => x.data()).sort((a, b) => ((a.added && a.added.toMillis()) || 0) - ((b.added && b.added.toMillis()) || 0))
      .forEach(p => {
        if (!p.name || r.members.includes(p.name)) return;
        r.members.push(p.name);
        if (Object.keys(p.hours || {}).length) r.answered++;
        const e = stampOf(p.edited); if (e > r.edited) r.edited = e;
      });
  }));
  return rows;
}

async function doAct(p){
  const a = p.action || "load";
  const id = String(p.m || "").trim();

  if (a === "load"){
    if (!id) return buildST();
    await watch(id);
    return buildST();
  }
  if (a === "meet_all") return { ok: true, meets: await listMeets(!!p.full) };

  if (a === "meet_new"){
    const title = String(p.title || "").trim().slice(0, 60);
    if (!title) throw fail("약속 이름을 적어주세요");
    if (await titleTakenRemote(title, "")) throw fail("“" + title + "” 은 이미 있는 이름이에요. 다른 이름으로 해주세요");
    let hs = clampHour(p.hourStart, 10), he = clampHour(p.hourEnd, 22);
    if (he <= hs){ hs = 10; he = 22; }
    const who = String(p.who || "").trim().slice(0, 30);
    const ref = meetsCol().doc();
    const b = db.batch();
    b.set(ref, { title, titleKey: titleKeyOf(title), place: String(p.place || "").slice(0, 60), memo: "", fixed: "",
                 hourStart: hs, hourEnd: he, dates: cleanDates(p.dates), windows: {}, picks: [],
                 owner: who, made: todayIso(), createdAt: FV.serverTimestamp(), updatedAt: FV.serverTimestamp() });
    /* 만들 때 친구들까지 한 번에. 순서가 섞이지 않게 added 를 1ms 씩 띄운다 */
    const names = [];
    [who].concat(splitList(p.members)).forEach(n => { n = n.slice(0, 30); if (n && !names.includes(n) && names.length < 30) names.push(n); });
    const t0 = Date.now();
    names.forEach((n, i) => b.set(peopleOf(ref.id).doc(), newPerson(n, { added: TS.fromMillis(t0 + i) })));
    await b.commit();
    await watch(ref.id);
    return Object.assign(buildST(), { newId: ref.id });
  }

  if (a === "meet_remove_many"){
    const ids = Array.from(new Set(splitList(p.ids))).slice(0, 50);
    if (!ids.length) throw fail("지울 약속을 고르지 않았습니다");
    await removeMeets(ids);
    return { ok: true, done: true, removed: ids.length, ids };
  }

  if (!id) throw fail("없는 약속입니다 (링크를 확인해주세요)");
  await watch(id);
  if (live.meetState !== "ok") throw fail("없는 약속입니다 (링크를 확인해주세요)");
  const cur = buildST();

  if (a === "meet_set"){
    const up = { updatedAt: FV.serverTimestamp() };
    if (p.title !== undefined){
      const t = String(p.title).trim().slice(0, 60);
      if (!t) throw fail("약속 이름을 적어주세요");
      if (titleKeyOf(t) !== titleKeyOf(cur.meet.title) && await titleTakenRemote(t, id)) throw fail("“" + t + "” 은 이미 있는 이름이에요");
      up.title = t; up.titleKey = titleKeyOf(t);
    }
    if (p.place !== undefined) up.place = String(p.place).slice(0, 60);
    if (p.memo  !== undefined) up.memo  = String(p.memo).slice(0, 200);
    if (p.fixed !== undefined) up.fixed = String(p.fixed).slice(0, 400);    // 여러 개를 ", " 로 (2026-09-28)
    if (p.fixNotes !== undefined) up.fixNotes = cleanFixNotes(p.fixNotes); // 정한 것마다 코멘트 (2026-10-01)
    if (p.hourStart !== undefined || p.hourEnd !== undefined){
      const hs = clampHour(p.hourStart !== undefined ? p.hourStart : cur.hourStart, 10);
      const he = clampHour(p.hourEnd   !== undefined ? p.hourEnd   : cur.hourEnd, 22);
      if (he <= hs) throw fail("끝 시간이 시작보다 늦어야 해요");
      up.hourStart = hs; up.hourEnd = he;
    }
    if (p.dates   !== undefined) up.dates   = cleanDates(p.dates);
    if (p.windows !== undefined) up.windows = parseWindows(p.windows);
    if (p.picks   !== undefined) up.picks   = parsePicks(p.picks);
    if (p.off     !== undefined) up.off     = cleanOff(p.off);            // 이 시간표에서 뺀 사람들
    await meetRef(id).update(up);
    return buildST();
  }

  if (a === "member_add"){
    const n = String(p.name || "").trim().slice(0, 30);
    if (!n) throw fail("이름이 필요합니다");
    if (cur.pid[n]) throw fail("이미 있는 이름입니다");
    await peopleOf(id).add(newPerson(n));
    return buildST();
  }
  if (a === "member_rename"){
    const from = String(p.from || "").trim(), to = String(p.to || "").trim().slice(0, 30);
    if (!from || !to) throw fail("이름이 필요합니다");
    if (cur.pid[to]) throw fail("이미 있는 이름입니다");
    if (!cur.pid[from]) throw fail("없는 사람입니다");
    await peopleOf(id).doc(cur.pid[from]).update({ name: to });
    return buildST();
  }
  if (a === "member_remove"){
    const n = String(p.name || "").trim();
    if (cur.pid[n]) await peopleOf(id).doc(cur.pid[n]).delete();
    return buildST();
  }

  if (a === "save"){
    const name = String(p.name || "").trim().slice(0, 30);
    if (!name) throw fail("이름이 필요합니다");
    const body = JSON.parse(p.payload || "{}");
    const ph = body.hours || {}, pn = body.notes || {};
    const b = db.batch();
    const pid = cur.pid[name];
    if (!pid){
      /* 처음 응답하는 사람은 자동으로 참여자가 된다 — 문서를 통째로 만든다 */
      const H = {}, N = {};
      for (const d in ph) if (normDate(d) && ph[d] !== null) H[d] = cleanHours(ph[d]);
      for (const d in pn) if (normDate(d) && String(pn[d] || "").trim()) N[d] = String(pn[d]).trim().slice(0, 200);
      b.set(peopleOf(id).doc(), newPerson(name, { hours: H, notes: N, edited: FV.serverTimestamp() }));
    } else {
      /* 보낸 날짜만 고친다 — 안 보낸 날짜(후보에서 빠진 날 등)의 응답은 그대로 둔다 */
      const args = [];
      for (const d in ph) if (normDate(d)) args.push(new FP("hours", d), ph[d] === null ? FV.delete() : cleanHours(ph[d]));
      for (const d in pn) if (normDate(d)){ const t = String(pn[d] || "").trim().slice(0, 200); args.push(new FP("notes", d), t ? t : FV.delete()); }
      args.push("edited", FV.serverTimestamp());
      b.update.apply(b, [peopleOf(id).doc(pid)].concat(args));
    }
    /* 📼 저장 기록 — 무엇을 보냈는지 그대로 남긴다 (옛 시트의 '기록' 탭) */
    b.set(meetRef(id).collection("log").doc(), { at: FV.serverTimestamp(), name, payload: JSON.stringify(body).slice(0, 6000) });
    await b.commit();
    return buildST();
  }

  if (a === "meet_remove"){
    await removeMeets([id]);
    return { ok: true, gone: true };
  }

  if (a === "reset_answers"){
    const b = db.batch();
    Object.values(cur.pid).forEach(pid => b.update(peopleOf(id).doc(pid), { hours: {}, notes: {}, edited: null }));
    await b.commit();
    return buildST();
  }

  throw fail("unknown action: " + a);
}


/* ═══ 상태 ═══ */
let ST = { meet:null, members:[], dates:[], hourStart:10, hourEnd:22, windows:{}, hours:{}, notes:{}, edited:{} };
let M  = new URLSearchParams(location.search).get("m") || "";
let me = "";
let sel = new Set(), noteDraft = {}, noneSel = new Set();
/* △ 일부만인데 시간은 안 고른 날 — 저장할 땐 hours = [-1] (2026-10-01 Benny: "일부의 경우 시간 선택 안 해도 되게") */
let maybeSel = new Set();
let dirty = false, saving = false;
let whoOpen = false;

function meet(){ return ST.meet; }
function members(){ return ST.members || []; }
function dates(){ return ST.dates || []; }
function hoursOf(){ return ST.hours || {}; }
function notesOf(){ return ST.notes || {}; }
function editedOf(){ return ST.edited || {}; }
function winOf(d){
  const w = (ST.windows || {})[d];
  return (w && w.length === 2 && w[1] > w[0]) ? [w[0], w[1]] : [ST.hourStart, ST.hourEnd];
}
function hoursFor(d){ const [a,b] = winOf(d), r = []; for (let h = a; h < b; h++) r.push(h); return r; }
function allHours(){
  const ds = dates();
  if (!ds.length){ const a = []; for (let h = ST.hourStart; h < ST.hourEnd; h++) a.push(h); return a; }
  const s = new Set(); ds.forEach(d => hoursFor(d).forEach(h => s.add(h)));
  return Array.from(s).sort((x,y) => x - y);
}
function winLabel(d){ const [a,b] = winOf(d); return a + "–" + b + "시"; }
function answered(n){ const H = hoursOf()[n] || {}; return dates().some(d => Array.isArray(H[d])); }
function responders(){ return members().filter(answered); }
function availAt(d,h){ const H = hoursOf(); return members().filter(n => ((H[n] || {})[d] || []).includes(h)); }

/* ═══ 스냅샷 — 서버를 기다리는 동안 지난 화면을 먼저 ═══ */
const SNAP_TTL = 12 * 3600 * 1000;
/* ⚠️ 밴드매니저는 밴드마다 시간표 id 가 겹친다(둘 다 t1) → 페이지가 SCHED_NS 로 칸을 나눈다.
   안 나누면 다른 밴드의 지난 화면이 잠깐 그려지고, 그 명단이 섞여 들어간다 (2026-09-28 시험에서 확인) */
function snapKey(){ return (typeof SCHED_NS === "function" ? SCHED_NS() : "meet") + "_snap:" + M; }
function snapSave(){ if (M) try { localStorage.setItem(snapKey(), JSON.stringify({ t: Date.now(), st: ST })); } catch(e){} }
function snapLoad(){
  if (!M) return false;
  try {
    const c = JSON.parse(localStorage.getItem(snapKey()) || "null");
    if (!c || !c.st || !c.st.meet) return false;
    if (Date.now() - (c.t || 0) > SNAP_TTL) return false;
    ST = c.st; return true;
  } catch(e){ return false; }
}

/* ═══ 내 응답 불러오기 ═══
   ⚠️ 저장 안 된 입력 위에 서버 데이터를 덮으면 안 된다 (밴드매니저 2026-09-19 사고) */
function loadMine(force){
  if (!force && (dirty || saving)) return;
  sel = new Set(); noteDraft = {}; noneSel = new Set(); maybeSel = new Set();
  if (!me) return;
  const H = hoursOf()[me] || {}, N = notesOf()[me] || {};
  dates().forEach(d => {
    const v = H[d];
    if (Array.isArray(v)){
      if (v.length === 1 && v[0] === -1) maybeSel.add(d);
      else v.length ? v.forEach(h => sel.add(key(d,h))) : noneSel.add(d);
    }
    if (N[d]) noteDraft[d] = N[d];
  });
  dirty = false;
}
function myHours(d){ return hoursFor(d).filter(h => sel.has(key(d,h))); }
/** 기호용 내 시각 — 시간 미정 △ 이면 [-1] */
function myMarkHours(d){ const on = myHours(d); return (!on.length && maybeSel.has(d)) ? [-1] : on; }
function myAnswered(d){ return myHours(d).length > 0 || noneSel.has(d) || maybeSel.has(d); }
/* 입력 중 표시. 버튼은 숨긴다 — 닫으면 저장되고, 실패했을 때만 renderAll 이 버튼을 띄운다 */
function touch(){ dirty = true; $("#saveBtn").hidden = true; setStatus(""); }

/* ═══ 쓰기 (낙관적 반영) ═══ */
const pending = new Map(); let pendSeq = 0;
function pendAdd(fn){ const id = ++pendSeq; pending.set(id, fn); return id; }
function pendDone(id){ if (id) pending.delete(id); }
function pendReplay(){ pending.forEach(fn => { try { fn(); } catch(e){} }); }

async function act(params, okMsg, applyLocal){
  let backup = null, pend = 0;
  if (applyLocal){
    backup = JSON.stringify(ST);
    try { applyLocal(); } catch(err){ backup = null; }
    if (backup){ pend = pendAdd(applyLocal); absorb(); }
  }
  try {
    ST = await api(Object.assign({ m: M }, params));
    pendDone(pend); pendReplay(); absorb();
    setStatus(okMsg || "완료", "ok");
  } catch(e){
    pendDone(pend);
    if (backup){ ST = JSON.parse(backup); pendReplay(); absorb(); }
    setStatus("실패 — " + e.message, "err");
  }
}
function absorb(){
  if (me && !isOff(me) && !members().includes(me)) members().push(me);   // 아직 서버에 안 닿은 내 이름은 유지 (뺀 사람은 제외)
  loadMine(); renderAll();
  if (!$("#heatModal").hidden) renderResult();             // 열려 있는 결과 창도 같이 갱신
  snapSave();
}

/* ═══ 로드 ═══ */
async function load(fresh){
  if (!M){ showNew(); return; }
  if (!ST.meet) setStatus("불러오는 중…");
  try {
    /* Firestore 는 열어 둔 약속을 계속 지켜본다(onSnapshot) → fresh 는 연결이 끊겼을 때만 다시 붙는다 */
    if (fresh && live.error) unwatch();
    ST = await api({ action:"load", m:M });
    if (ST.gone){ setStatus("없는 약속이에요 — 링크를 확인해주세요", "err"); showNew(); return; }
    /* 이름은 기억하지 않는다 — 약속을 옮기면 '누구세요' 에서 다시 고른다.
       (이 페이지에서 이미 고른 이름은 그대로 두고, 명단에서 사라졌으면 비운다) */
    if (!dirty && !saving && me && !members().includes(me) && !keepMe()){ me = ""; saveMe(""); }
    restoreMe();
    /* ⚠️ force 를 주면 안 된다 — 저장 안 된 내 입력을 서버 값이 덮어쓴다 */
    loadMine(); renderAll(); snapSave();
    setStatus("");
  } catch(e){
    setStatus("불러오기 실패 — " + e.message + " (페이지를 새로고침해 주세요)", "err");
  }
}

/** 일정 카드들(누구세요·표·달력)만 그린다 — 페이지의 renderAll() 이 부른다 */
function renderSched(){
  const has = dates().length > 0;
  $("#emptyCard").hidden = has;
  $("#sheetCard").hidden = !has;
  $("#saveBtn").hidden = !(has && me && dirty);
  renderWho();
  drawSheet();
  renderSheetArea();
}

/* 누구세요 카드 (2026-09-22k Benny 가 그려준 대로)
   · 접힘  = 한 줄 + `＋ 친구` 버튼 하나. **버튼 말고 줄 아무 데나 누르면 펼친다.**
   · 펼침  = 같은 줄 오른쪽에 `✎ 수정`(내 이름 바꾸기) + 아래에 친구 칩 + `＋ 친구 추가`
   whoAdd = 내 이름을 새로 적는 칸 / whoRen = 내 이름 바꾸는 칸 */
let whoAdd = false, whoRen = false;
function renderWho(){
  /* 약속을 옮기면 이름은 늘 다시 고른다 (2026-09-21 Benny) → 이름이 없으면 늘 펼친 상태 */
  const open = !me || whoOpen;
  $("#whoCard").classList.toggle("need", !me);      // 이름이 없으면 더 진한 테두리 (2026-09-22b)
  $("#whoPicked").hidden = !me;                     // 한 줄 바는 이름이 있으면 접혀도 펼쳐도 보인다
  $("#whoPick").hidden   = !open;
  $("#whoName").textContent = me || "";
  $("#whoBar").setAttribute("aria-expanded", String(open));
  $("#whoCaret").textContent = open ? "▴" : "▾";
  $("#whoFriend").hidden = open;                    // ＋친구 = 접혔을 때만
  $("#whoRename").hidden = !open;                   // ✎수정 = 펼쳤을 때만
  $("#whoKeepRow").hidden = !me;                    // ＋친구 추가 = 펼친 상태 아래쪽
  $("#whoH2").hidden = !!me;                        // 이름이 있으면 위 줄이 이미 알려준다

  /* 이 시간표에서 뺀 사람도 '누구세요' 에는 흐리게 남긴다 — 이름(로그인)은 밴드 단위라서
     (2026-10-01 Benny: "캘린더에서 멤버 뺐는데, 멤버 로그인도 사라져버렸어") */
  const mem = members().concat(offList().filter(n => !members().includes(n)));
  const box = $("#whoChips"); box.innerHTML = "";
  mem.forEach(n => {
    const b = document.createElement("button");
    b.className = "chip" + (isOff(n) ? " off" : "");
    if (isOff(n)) b.title = "이 시간표에는 참여하지 않아요";
    b.type = "button"; b.textContent = n + (n === me ? " (나)" : "");
    b.setAttribute("aria-pressed", String(n === me));
    b.onclick = () => pickMe(n);
    box.appendChild(b);
  });
  if (!me){                                         // 내 이름이 목록에 없을 때만 필요한 칩
    const add = document.createElement("button");
    add.className = "chip add"; add.type = "button"; add.id = "whoAdd";
    add.textContent = "＋ 내 이름 넣기";
    add.onclick = () => { whoAdd = !whoAdd; whoRen = false; renderWho(); if (whoAdd) $("#whoInput").focus(); };
    box.appendChild(add);
  }

  const openIn = whoRen || whoAdd || !mem.length;   // 아직 아무도 없으면 바로 입력칸
  $("#whoAddRow").hidden = !openIn;
  $("#whoGo").textContent = whoRen ? "이름 바꾸기" : "시작";
  $("#whoCancel").hidden = !whoRen;
  if (openIn && !$("#whoInput").value) $("#whoInput").value = whoRen ? me : lastName();
  $("#whoHint").textContent = me
    ? "친구를 누르면 그 사람으로 입력합니다. 내 이름을 고치려면 ✎ 수정."
    : (mem.length ? "내 이름을 누르면 그 이름으로 입력합니다. 목록에 없으면 ＋ 내 이름 넣기."
                  : "이름을 적으면 바로 시작합니다.");
}
/* 내 이름 바꾸기 — 사람을 새로 만들지 않고 이름만 고친다(답·메모도 따라온다) */
function renameMe(v){
  const from = me;
  v = String(v || "").trim();
  if (!from || !v || v === from){ whoRen = false; renderWho(); return; }
  if (members().includes(v)){ setStatus("“" + v + "” 은 이미 있는 이름이에요", "err"); return; }
  whoRen = false; whoAdd = false; whoOpen = false;
  me = v;
  try { localStorage.setItem("meet_lastname", v); } catch(e){}
  saveMe(v);
  $("#whoInput").value = "";
  act({ action:"member_rename", from: from, to: v }, from + " → " + v + " 로 바꿨습니다", () => {
    ST.members = (ST.members || []).map(x => (x === from ? v : x));
    ["hours","notes","edited"].forEach(k => {
      const o = ST[k];
      if (o && Object.prototype.hasOwnProperty.call(o, from)){ o[v] = o[from]; delete o[from]; }
    });
  });
  renderAll();
}
function lastName(){ try { return localStorage.getItem("meet_lastname") || ""; } catch(e){ return ""; } }
/* 고른 이름은 **그 약속에 한해** 기억한다 — 새로고침으로 풀리면 매번 다시 고르게 된다
   (2026-09-22o Benny: "새로 고침 할 때마다 명재로 된게 풀리던데 의도한거야?")
   약속마다 키가 다르니 '다른 약속으로 가면 다시 고른다' 는 규칙은 그대로다. */
/* 밴드매니저는 '내 이름' 을 시간표마다가 아니라 **밴드 단위**로 기억한다 → SCHED_ME_KEY 로 바꿔 끼운다 */
function meKey(){ return typeof SCHED_ME_KEY === "function" ? SCHED_ME_KEY() : "meet_me:" + M; }
/* 밴드매니저는 밴드 멤버를 시간표에 나중에 채워 넣는다 → 잠깐 명단에 없어도 내 이름을 지우지 않는다 */
function keepMe(){ return typeof SCHED_KEEP_ME !== "undefined" && SCHED_KEEP_ME; }
function saveMe(n){ try { n ? localStorage.setItem(meKey(), n) : localStorage.removeItem(meKey()); } catch(e){} }
function restoreMe(){
  if (me || !M) return;
  let n = ""; try { n = localStorage.getItem(meKey()) || ""; } catch(e){}
  if (n && (members().includes(n) || keepMe())){ me = n; whoOpen = false; }
}
function pickMe(n){
  n = String(n || "").trim();
  if (!n) return;
  me = n; whoOpen = false; whoAdd = false;
  try { localStorage.setItem("meet_lastname", n); } catch(e){}
  saveMe(n);
  $("#whoInput").value = "";
  if (isOff(n)){                                    // 이 시간표에서 뺀 사람 — 다시 만들지 않고 이름만 고른다
    loadMine(true); renderAll();
    setStatus(n + " 님은 이 시간표에 참여하지 않아요 — ⚙ 설정의 멤버에서 켤 수 있어요");
    return;
  }
  if (!members().includes(n)){
    act({ action:"member_add", name:n }, n + " 님 추가됨", () => { if (!ST.members.includes(n)) ST.members.push(n); });
    return;
  }
  loadMine(true); renderAll();
  setStatus(n + " 님으로 칠합니다", "ok");
}

/** ○ 다 돼요 / △ 일부만 / ✕ 안 돼요 / – 미정 — 표와 달력이 **같은 기호**를 쓴다
    (2026-09-22l Benny: "되면 O, 부분적으로 되면 세모, 안되면 X, 미정은 –") */
function markOf(d, hrs, ans, mine){
  const full = hoursFor(d).length;
  /* tx = 칸에 쓰는 글자. ○ ✕ – 는 기호만 — 글자는 △ 의 되는 시간과 내 빈칸의 '입력' 뿐
     (2026-09-28 Benny: "글자가 많으면 뭘 봐야할지 보기 힘들어"). lb = 말로 풀어 쓴 것 (아래 줄 안내용) */
  if (ans && hrs && hrs.length === 1 && hrs[0] === -1)
    return { cls:"part", mk:"△", tx:"시간 미정", lb:"일부만 (시간 미정)" };
  if (ans && hrs && hrs.length){
    const whole = (hrs.length >= full && full > 0);
    return whole ? { cls:"all",  mk:"○", tx:"", lb:"다 돼요" }
                 : { cls:"part", mk:"△", tx:runsOf(hrs, true), lb:runsOf(hrs, true) + "시 가능" };
  }
  if (ans) return { cls:"no", mk:"✕", tx:"", lb:"안 돼요" };
  return { cls:"none", mk:"–", tx: mine ? "입력" : "", lb:"아직 입력 안 함" };
}

/* ── 달력 보기 — 내 입력 전용. 가로 스크롤 없이 날짜 감각이 살아난다
      (2026-09-22m Benny: "날짜가 가로로 길어서 보기가 불편한데, 달력 모양으로") ── */
let sheetView = "tab";
/* 기본은 **표**. 달력은 원할 때 고른다 (2026-09-22n Benny) */
/* 켤 때는 **늘 모두 보기** — 지난번 고른 걸 기억하지 않는다 (2026-10-01 Benny: "화면 딱 켰을 때 모두 보기를 기본") */
function loadView(){ sheetView = "tab"; }
function setView(v){
  sheetView = (v === "cal") ? "cal" : "tab";
  renderSheetArea();
}
function renderSheetArea(){
  const cal = sheetView === "cal";
  $("#segCal").setAttribute("aria-selected", String(cal));
  $("#segTab").setAttribute("aria-selected", String(!cal));
  $("#calView").hidden = !cal;
  $("#tabOuter").hidden = cal;
  if (cal) renderCalView();
  requestAnimationFrame(hsUpdate);                       // 표가 다시 그려지면 좌우 넘기기 버튼도 (크기는 그린 뒤에 잰다)
}
/* 달력은 **한 장** — 후보 날짜가 있는 주만 이어 붙인다. 달 넘기기(‹ ›)는 없다
   (2026-09-28 Benny: "1개 월만 보여서 2개 월로 선택지가 되면 보기 힘들 것 같기도, 심플하면서 좋은 방법")
   · 달이 바뀌는 첫 칸은 숫자를 '11/1' 처럼 쓴다
   · 후보가 없는 주는 건너뛰고 '⋯' 한 줄로 표시 */
function cvReset(){}
function renderCalView(){
  /* (2026-09-28 Benny: "달력이 굉장히 길어지고 월 구분이 안 가는데")
     · 달마다 제목 줄 — "10월". 올해가 아니면 "2027년 1월" (날짜마다는 안 붙인다)
     · 후보가 **듬성듬성**하면(한 주 7칸 중 절반 미만 — 매주 일요일, 주말만 등) 빈칸을 빼고 후보만 4개씩 타일로
       → 18주 × 7칸 대신 달마다 한두 줄. 매일처럼 빽빽하면 요일을 맞춘 달력
     · 지난 날짜는 표처럼 '지난 N일 ▸' 로 접는다 */
  const all = dates(), g = $("#cvGrid"); g.innerHTML = "";
  $("#cvLabel").textContent = "";
  if (!all.length) return;
  const today = todayIso(), thisYear = new Date().getFullYear();
  const past = all.filter(d => d < today), ahead = all.filter(d => d >= today);
  const openPast = pastOpen || !ahead.length;
  const ds = openPast ? all : ahead;
  const set = new Set(ds);
  const monthName = d => { const o = dObj(d); return (o.getFullYear() !== thisYear ? o.getFullYear() + "년 " : "") + (o.getMonth() + 1) + "월"; };
  const addHead = (txt, cls) => { const x = document.createElement("div"); x.className = "cvmon" + (cls ? " " + cls : ""); x.textContent = txt; g.appendChild(x); return x; };
  const tile = (d, label) => {
    const b = document.createElement("button"); b.type = "button"; b.dataset.d = d;
    b.innerHTML = '<span class="n"></span><span class="mk"></span><span class="tx"></span>';
    b.querySelector(".n").textContent = label;
    const m = (me && !isOff(me)) ? markOf(d, myMarkHours(d), myAnswered(d), true) : { cls: isOff(me) ? "na" : "none", mk:"–", tx:"", lb:"" };
    b.className = "d cand s-" + m.cls + (d === today ? " today" : "") + (isFixedDay(d) ? " fixday" : "") + (d < today ? " past" : "");
    b.querySelector(".mk").textContent = m.mk;
    /* 정한 날은 날짜 앞 📌 + 맨 아래 정한 시간 (표의 날짜 머리와 같은 내용) */
    const ft = isFixedDay(d) ? fixedTimes(d) : [];
    if (isFixedDay(d)) b.querySelector(".n").textContent = "📌" + label;
    if (ft.length){
      const fx = document.createElement("span"); fx.className = "fx";
      fx.textContent = ft[0] + (ft.length > 1 ? " +" + (ft.length - 1) : "");
      b.appendChild(fx);
    }
    /* 달력 보기는 칸이 크니 **되는 사람 수**도 (○+△) — 2026-10-01 Benny: "'달력 보기' 로, 화면이 크니까 좀 더" */
    const can = members().filter(n => { const h = (hoursOf()[n] || {})[d]; return Array.isArray(h) && h.length; }).length;
    if (members().length){
      const c = document.createElement("span"); c.className = "cnt"; c.textContent = can + "명";
      c.title = "되는 사람 " + can + " / " + members().length + "명";
      b.appendChild(c);
    }
    b.title = fmtFull(d) + " · " + (ft.length ? "📌 " + fixedLabels(d).map(fixLabelTxt).join(", ") : winLabel(d)) + " · 되는 사람 " + can + "/" + members().length + "명";
    b.onclick = () => { if (!me){ askName(); return; } openDay(d, "edit"); };
    return b;
  };
  if (past.length && ahead.length){
    const t = addHead(openPast ? "◂ 지난 날짜 접기" : "지난 " + past.length + "일 ▸", "pasttog");
    t.setAttribute("role", "button"); t.tabIndex = 0;
    t.onclick = () => { pastOpen = !pastOpen; paintSheet(); };
  }
  /* **진짜 달력** — 달마다 제목 + 요일 줄 + 7칸 주, 달을 세로로 이어 붙인다 (빈 주도 건너뛰지 않는다)
     (2026-10-01 Benny: "내 입력은 캘린더 모양으로 보기 편하게 하려던 건데 의도를 벗어났어 — 달력 모양으로 세로로 길게")
     · 첫 달은 첫 후보가 있는 주부터, 마지막 달은 마지막 후보가 있는 주까지만
     · 후보가 아닌 날은 흐린 숫자, 다른 달 날짜는 빈칸 */
  g.classList.remove("flow");
  const first = dObj(ds[0]), last = dObj(ds[ds.length - 1]);
  const lastKey = last.getFullYear() * 12 + last.getMonth();
  for (let y = first.getFullYear(), m = first.getMonth(); y * 12 + m <= lastKey; m === 11 ? (y++, m = 0) : m++){
    addHead(monthName(iso(new Date(y, m, 1))));
    DOW.forEach((w, i) => {
      const x = document.createElement("div"); x.className = "dowh" + (i === 0 ? " sun" : i === 6 ? " sat" : ""); x.textContent = w; g.appendChild(x);
    });
    /* 이 달에서 그릴 범위 — 그 주의 일요일 ~ 토요일까지 (다른 달 날짜는 빈칸) */
    const a = (y === first.getFullYear() && m === first.getMonth()) ? new Date(first) : new Date(y, m, 1);
    const z = (y * 12 + m === lastKey) ? new Date(last) : new Date(y, m + 1, 0);
    const o = new Date(a); o.setDate(o.getDate() - o.getDay());
    const end = new Date(z); end.setDate(end.getDate() + (6 - end.getDay()));
    for (; o <= end; o.setDate(o.getDate() + 1)){
      if (o.getMonth() !== m){ const e = document.createElement("div"); e.className = "d blank"; g.appendChild(e); continue; }
      const d = iso(o), n = o.getDate();
      if (set.has(d)){ g.appendChild(tile(d, String(n))); continue; }
      const x = document.createElement("div"); x.className = "d off" + (o.getDay() === 0 ? " sun" : "");
      x.innerHTML = '<span class="n"></span>'; x.querySelector(".n").textContent = n;
      g.appendChild(x);
    }
  }
}

/** 표와 달력을 **같이** 다시 그린다.
    ⚠️ `drawSheet()` 만 부르면 달력 보기에서는 화면이 그대로다
    (2026-09-22o Benny: "가능으로 입력했는데 화면이 안바뀌어") */
function paintSheet(){ drawSheet(); renderSheetArea(); }
/** 표 좌우 넘기기 버튼 — 넘길 게 있을 때만, 끝에 닿은 쪽은 숨긴다. 왼쪽 버튼은 이름 칸 바로 옆에 */
function hsUpdate(){
  const w = $("#tabView"), o = $("#tabOuter"); if (!w || !o) return;
  const nm = w.querySelector("th.nm");
  o.style.setProperty("--nmw", (nm ? nm.offsetWidth : 0) + "px");
  const max = w.scrollWidth - w.clientWidth;
  o.classList.toggle("atL", w.scrollLeft <= 2);
  o.classList.toggle("atR", w.scrollLeft >= max - 2);
}
function hsGo(dir){
  const w = $("#tabView"), nm = w.querySelector("th.nm");
  w.scrollBy({ left: dir * Math.max(120, (w.clientWidth - (nm ? nm.offsetWidth : 0)) * 0.8), behavior: "smooth" });
}

/* ── 표: 줄 = 사람, 칸 = 날짜 ── */
let pastOpen = false;                    // 지난 날짜 펼침 (표)
function drawSheet(){
  const t = $("#sheet"); t.innerHTML = "";
  const ds = dates(), H = hoursOf(), N = notesOf(), ED = editedOf();
  if (!ds.length) return;
  /* 지난 날짜는 **한 칸으로 접는다** — 누르면 회색으로 펼쳐진다
     (2026-09-28 Benny: "이미 지난 건 회색으로 처리하고 접을 수 있게") 다가오는 날이 하나도 없으면 펼쳐 둔다 */
  const today = todayIso();
  const past = ds.filter(d => d < today), ahead = ds.filter(d => d >= today);
  const openPast = pastOpen || !ahead.length;
  const shown = openPast ? ds : ahead;
  const pastCol = past.length && ahead.length;          // 접기/펼치기 칸
  /* 안내 = "내가 아직 안 넣은 날" 을 그대로 읽어준다
     (2026-09-22k Benny: "넣은 것과 넣어야할 것이 구분이 잘 안되어서") */
  const hint = $("#sheetHint");
  hint.className = "callout";
  hint.innerHTML = "";
  if (me && isOff(me)){
    hint.append(document.createTextNode(me + " 님은 이 시간표에 "));
    const bo = document.createElement("b"); bo.textContent = "참여하지 않아요";
    hint.append(bo, document.createTextNode(" — 입력할 칸이 없습니다. (⚙ 설정 → 멤버에서 켤 수 있어요)"));
  } else {
    /* 안내는 **가이드 버튼 하나**, 맨 왼쪽 — 넣는 방법은 누르면 팝업으로
       (2026-10-01 Benny: "가이드가 잘 안 보여, 남은 날 이런 거 빼고 가이드를 맨 왼쪽으로") */
    hint.className = "g-row";
    const gb = document.createElement("button"); gb.type = "button"; gb.className = "g-btn"; gb.textContent = "📝 입력 가이드";
    gb.onclick = () => openModal("guideModal");
    hint.append(gb);
  }

  /* ⚠️ 입력 표에는 '제일 많음' 추천을 **넣지 않는다**
     (2026-09-22k Benny: "결과 보기에 추천은 좋은데, 날짜 입력하는데서 추천은 별로인 것 같아")
     여기서 강조하는 건 "내가 아직 안 넣은 칸" 하나뿐이다.                        */

  const thead = document.createElement("thead"), hr = document.createElement("tr");
  const c0 = document.createElement("th"); c0.className = "nm corner";
  c0.innerHTML = '<span></span><span class="sub"></span>';
  c0.querySelector("span").textContent = "이름";
  c0.querySelector(".sub").textContent = "최근 수정";
  hr.appendChild(c0);
  if (pastCol){
    const pc = document.createElement("th"); pc.className = "pastcol";
    const pb = document.createElement("button"); pb.type = "button";
    pb.innerHTML = openPast ? "◂<br>접기" : "지난<br>" + past.length + "일 ▸";
    pb.title = openPast ? "지난 날짜 접기" : "지난 날짜 " + past.length + "일 보기";
    pb.onclick = () => { pastOpen = !pastOpen; paintSheet(); };
    pc.appendChild(pb); hr.appendChild(pc);
  }
  shown.forEach(d => {
    const th = document.createElement("th");
    const fixed = isFixedDay(d);
    th.className = "dhead" + (dObj(d).getDay() === 0 ? " sun" : "") + (fixed ? " hasFix" : "") + fixColCls(shown, d) + (d < today ? " past" : "");
    /* 두 줄로 — '10/5 월' / '18–22' ('시' 는 뺀다). 정한 날은 날짜 앞에 📌 (2026-09-28 Benny: "세 줄이라 정신없어") */
    th.innerHTML = '<span class="dl"><span class="dd"></span> <span class="dw"></span></span><span class="dow win"></span>';
    th.querySelector(".dd").textContent = (fixed ? "📌" : "") + fmtD(d);
    th.querySelector(".dw").textContent = fmtDow(d);
    /* 정한 날은 시간대 대신 정한 시간 (2026-09-29 Benny: "약속 시간보다 넓게 잡으면 확정돼도 시간이 안 보인다") */
    const ft = fixed ? fixedLabels(d) : [];
    const win = th.querySelector(".win");
    /* 정하지 않은 날의 시간대는 **기본과 다를 때만** 회색으로 — 초록 '9–22' 가 정한 시간처럼 보였다
       (2026-10-01 Benny: "동그라미 친 부분이 헷갈리게 만들어"). 기본 시간대는 칸을 누르면 창 제목에 나온다 */
    const [wa, wb] = winOf(d), isDefWin = wa === ST.hourStart && wb === ST.hourEnd;
    /* 정한 것마다 한 줄 — '17–20 합주' (코멘트는 선택 · 2026-10-01 Benny) */
    if (ft.length){
      win.classList.add("fixt");
      ft.forEach(x => {
        const ln = document.createElement("span"); ln.className = "fxl";
        const tm = document.createElement("b"); tm.textContent = x.time; ln.appendChild(tm);
        if (x.note) ln.append(" " + x.note);
        win.appendChild(ln);
      });
    } else { win.textContent = isDefWin ? "" : wa + "–" + wb; win.classList.add("plain"); }
    th.title = (ft.length ? "📌 " + ft.map(fixLabelTxt).join(", ") + " (이 날 시간대 " + winLabel(d) + ") · " : "") + "눌러서 이 날 보기 · 📌 정하기";
    th.onclick = () => openDay(d, "set");
    hr.appendChild(th);
  });
  const addD = document.createElement("th"); addD.className = "addcol";
  const addDb = document.createElement("button"); addDb.type = "button";
  addDb.textContent = "＋ 날짜"; addDb.onclick = () => openModal("calModal");
  addD.appendChild(addDb); hr.appendChild(addD);
  thead.appendChild(hr); t.appendChild(thead);

  const tb = document.createElement("tbody");
  const order = (me && !isOff(me)) ? [me].concat(members().filter(n => n !== me)) : members().slice();
  order.forEach(n => {
    const tr = document.createElement("tr");
    const mine = (n === me);
    if (mine) tr.className = "me";
    const th = document.createElement("th"); th.className = "nm";
    const nb = document.createElement("button"); nb.type = "button"; nb.className = "nmbtn";
    const nt = document.createElement("span"); nt.textContent = n + (mine ? " (나)" : "");
    nb.appendChild(nt);
    const ed = document.createElement("span"); ed.className = "sub";
    const et = fmtEdit(ED[n]);
    ed.textContent = et || "–";
    nb.appendChild(ed);
    nb.title = et ? (n + " · 마지막 수정 " + et) : (n + " · 아직 입력 안 함");
    nb.onclick = () => openMember(n);
    th.appendChild(nb); tr.appendChild(th);
    if (pastCol) tr.appendChild(document.createElement("td")).className = "pastcol";

    shown.forEach(d => {
      const td = document.createElement("td");
      if (d < today) td.classList.add("past");
      td.className += fixColCls(shown, d);                         // 정한 날 — 달력처럼 검정 테두리 (2026-09-30)
      const b  = document.createElement("button"); b.type = "button";
      const hrs  = mine ? myMarkHours(d) : (H[n] || {})[d];
      const ans  = mine ? myAnswered(d) : Array.isArray(hrs);
      const memo = mine ? (noteDraft[d] || "") : ((N[n] || {})[d] || "");
      const mk = markOf(d, hrs, ans, mine);
      const sp = document.createElement("span");
      sp.className = "hr " + mk.cls;
      sp.innerHTML = '<span class="mk"></span><span class="tx"></span>';
      sp.querySelector(".mk").textContent = mk.mk;
      sp.querySelector(".tx").textContent = mk.tx;
      if (mine && !ans && d >= today) td.classList.add("todo");      // 아직 안 넣은 내 칸 (지난 날은 재촉하지 않는다)
      b.appendChild(sp);
      if (memo){ const mm = document.createElement("span"); mm.className = "mm"; mm.textContent = memo; b.appendChild(mm); }
      b.title = n + " · " + fmtFull(d) + (memo ? " — " + memo : "");
      /* 내 칸만 창을 연다. 남의 칸은 표에 다 보이니 창 대신 아래 줄에 메모 전문만 (2026-09-28 Benny) */
      if (mine) b.onclick = () => openDay(d, "edit");
      else {
        b.classList.add("ro");
        b.onclick = () => {
          if (!me){ askName(); return; }
          setStatus(n + " · " + fmtFull(d) + " — " + mk.lb + (memo ? " · " + memo : ""));
        };
      }
      td.appendChild(b); tr.appendChild(td);
    });
    tr.appendChild(document.createElement("td")).className = "addcol";
    tb.appendChild(tr);
  });
  t.appendChild(tb);

  const tf = document.createElement("tfoot"), fr = document.createElement("tr");
  const f0 = document.createElement("th"); f0.className = "nm"; f0.textContent = "최대 인원";
  fr.appendChild(f0);
  if (pastCol) fr.appendChild(document.createElement("td")).className = "pastcol";
  shown.forEach(d => {
    const td = document.createElement("td"); td.className = "cnt" + (d < today ? " past" : "") + fixColCls(shown, d);
    let best = 0;
    hoursFor(d).forEach(h => { const c = availAt(d,h).length; if (c > best) best = c; });
    td.textContent = best ? best + "명" : "–";
    if (best && best === members().length) td.classList.add("all");
    fr.appendChild(td);
  });
  fr.appendChild(document.createElement("td")).className = "addcol";
  tf.appendChild(fr); t.appendChild(tf);
}
/** 확정 문자열에 이 날짜가 들어 있나 */
function isFixedDay(d){ return shownFixes().some(f => f.indexOf(d) === 0); }
/** 표에서 정한 날 칸의 테두리 — 나란히 붙은 정한 날은 **한 덩어리**로 바깥만 그린다
    (2026-09-30 Benny: "인접한 거끼리 두 줄로 보여서 지저분") → fixL = 왼쪽 선, fixR = 오른쪽 선 */
function fixColCls(list, d){
  if (!isFixedDay(d)) return "";
  const i = list.indexOf(d);
  const prev = i > 0 && isFixedDay(list[i - 1]), next = i >= 0 && i < list.length - 1 && isFixedDay(list[i + 1]);
  return " fixcol" + (prev ? "" : " fixL") + (next ? "" : " fixR");
}
/** 화면에 📌 로 보일 것 — 📌 정한 것 + 페이지가 따로 알려 주는 것(밴드매니저: 이력의 '예정' 합주).
    **표시 전용** — 📌 정하기/풀기(fixes·setFixes)는 건드리지 않는다
    (2026-09-30 Benny: "10/4 합주가 잡혀있는데 달력에는 표시가 안되어있어") */
function shownFixes(){
  let extra = [];
  if (typeof extraFixes === "function"){ try { extra = extraFixes() || []; } catch(e){} }
  return Array.from(new Set(fixes().concat(extra)));
}
/** 그 날 정한 시간들 — ["11–13", ...] (시간 없는 확정은 뺀다) */
function fixedTimes(d){
  const seen = new Set();
  return shownFixes().map(pickParse).filter(p => p && p.d === d)
    .sort((a, b) => a.from - b.from).map(p => p.from + "–" + p.to)
    .filter(t => !seen.has(t) && seen.add(t));
}
/** 그 날 정한 것들 — [{t, time:"17–20", note:"합주"}] 시간순. 같은 시간은 하나만 (📌 + 이력 '예정' 이 겹칠 때)
    (2026-10-01 Benny: "확정 시간 + 코멘트 — 17-20 합주 / 20-22 청모") */
function fixedLabels(d){
  const seen = new Set();
  return shownFixes().map(t => ({ t, p: pickParse(t) })).filter(x => x.p && x.p.d === d)
    .sort((a, b) => a.p.from - b.p.from || a.p.to - b.p.to)
    .map(x => ({ t: x.t, time: x.p.from + "–" + x.p.to, note: fixNoteOf(x.t) }))
    .filter(x => !seen.has(x.time) && seen.add(x.time));
}
/** 맨 위 '📌 … 로 정했습니다' 줄 — 코멘트까지 ("10/11(일) 17:00~20:00 합주, …") */
function fmtFixedNotes(v){
  return String(v || "").split(/\s*,\s*/).filter(Boolean).map(t => fmtFixed(t) + (fixNoteOf(t) ? " " + fixNoteOf(t) : "")).join(", ");
}
/** 맨 위 📌 한 줄 — 둘까지는 전부, 많으면 **다음 정한 날만** + 정한 날 수
    (2026-10-01: 키니피처럼 12개면 줄이 길어져서) */
function fixedLine(v){
  const list = String(v || "").split(/\s*,\s*/).filter(Boolean);
  if (list.length <= 2) return "📌 " + fmtFixedNotes(v) + " 로 정했습니다";
  const days = Array.from(new Set(list.map(t => t.slice(0, 10)))).sort(), today = todayIso();
  const d = days.find(x => x >= today) || days[days.length - 1];
  const lb = fixedLabels(d).map(fixLabelTxt).join(", ");
  return "📌 " + (d >= today ? "다음 " : "마지막 ") + fmtFull(d) + (lb ? " " + lb : "") + " · 정한 날 " + days.length + "일";
}
function fixLabelTxt(x){ return x.time + (x.note ? " " + x.note : ""); }
/** "2026-09-21 18:00~20:00" → "9/21(월) 18:00~20:00" (저장 값은 그대로 둔다) */
function fmtFixed(f){
  /* 여러 개면 ', ' 로 이어져 있다 (2026-09-28) */
  return String(f || "").split(/\s*,\s*/).filter(Boolean).map(one => {
    const m = /^(\d{4}-\d{2}-\d{2})(.*)$/.exec(one);
    return m ? fmtFull(m[1]) + m[2] : one;
  }).join(", ");
}

/* ═══ 사람 창 ═══ */
function openMember(n){
  if (n === me){ whoOpen = true; renderWho(); return; }
  const et = fmtEdit(editedOf()[n]);
  setStatus(n + (et ? " · 마지막 수정 " + et : " · 아직 입력 안 함"));
}

/* ═══ 그 날 창 — **내 입력만** ═══
   (2026-09-28 Benny: "클릭하면 O △ X 3개만. O 누르면 창 꺼지면서 완료, △ 는 시간 버튼 + 이유, X 는 이유만.
    버튼 누르는 횟수를 최소화" / "다른 사람 일정은 어차피 표에서 보이는데 입력창에서도 보여야 할까?")
   → 다른 사람 목록·요약 보기·취소 버튼을 다 뺐다. 창을 닫으면 알아서 저장된다.
   날짜 머리를 누르면 같은 창이 '이 날 설정'(시간대·확정·후보에서 빼기)으로 열린다. */
let dmDate = null;
let dmMode = "edit";        // "edit" = 내 입력 / "set" = 이 날 설정
let dmPart = false;         // △ 를 눌러 시간 버튼을 펼친 상태
let dmSetOpen = false;      // ⚙ 로 설정을 펼쳤나
/* △ 시간 입력 — 기본은 **시작 한 번, 끝 한 번** (2026-09-28 Benny: "일일이 시간 누르는 게 귀찮아.
   여러 시간은 다중시간 입력 버튼을 조그맣게"). dmMulti = 한 칸씩 켜고 끄는 예전 방식 */
let dmMulti = false;
let dmFrom = null;          // 시작을 눌러 두고 끝을 기다리는 중
let dmNOpen = false;        // 미정을 눌러 이유 칸을 펼친 상태
/** 내 이 날 답 — "o" 다 돼요 / "t" 일부만 / "x" 안 돼요 / "" 미정 */
function dmMark(d){
  if (noneSel.has(d)) return "x";
  const on = myHours(d);
  if (!on.length) return maybeSel.has(d) ? "t" : "";
  return on.length >= hoursFor(d).length ? "o" : "t";
}
/** 날짜 머리 창의 요약 — 누가 되는지, 시간별 몇 명
    (2026-10-01 Benny: "추천 시간을 녹색으로 표시하면 더 헷갈려" → 미리 골라 두지 않는다) */
let fxA = null, fxZ = null, fxFrom = null;          // 고른 시간(미확정) — fxA 칸 ~ fxZ 칸 (끝 시각은 fxZ+1)
function fxPreset(){ fxA = fxZ = fxFrom = null; }
function renderDayInfo(d){
  const box = $("#dmDay"); if (!box) return;
  box.innerHTML = "";
  const mem = members(), H = hoursOf(), N = notesOf(), hs = hoursFor(d), tot = mem.length;
  const groups = { all: [], part: [], no: [], none: [] };
  mem.forEach(n => {
    const hrs = (H[n] || {})[d];
    const m = markOf(d, hrs, Array.isArray(hrs), false);
    groups[m.cls].push({ n, tx: m.tx, note: (N[n] || {})[d] || "" });
  });
  /* 한 줄 요약 */
  const sum = document.createElement("div"); sum.className = "dy-sum";
  [["all","○","돼요"],["part","△","일부만"],["no","✕","안 돼요"],["none","–","미정"]].forEach(([k, mk, lb]) => {
    const s = document.createElement("span"); s.className = "dy-pill " + k;
    s.textContent = mk + " " + lb + " " + groups[k].length;
    sum.appendChild(s);
  });
  box.appendChild(sum);
  /* 시간별 인원 — **막대 높이 = 되는 사람 수**, 아래 눈금 = 시각(칸 경계). 진한 막대 = 전원
     (2026-10-01 Benny: "시간 바에서 뭐가 시간이고 뭐가 사람수인지 직관적이지가 않아")
     막대를 누르면 📌 정할 시간을 고른다 — 시작 칸, 끝 칸 (내 입력의 △ 와 같은 방식) */
  if (hs.length && tot){
    const cnt = hs.map(h => availAt(d, h).length);
    /* 막대 = 되는 사람 수(위에 작은 숫자), 시각 = **칸 사이** 눈금 (2026-10-01 Benny: "시간은 네모와 네모 사이, 사람 수는 막대 모양")
       검정 실선 네모 = 📌 확정 · 점선 네모 = 고른 시간·후보(미확정) */
    const cap = document.createElement("div"); cap.className = "dy-cap";
    cap.textContent = "막대 = 되는 사람 수 (전체 " + tot + "명)";
    box.appendChild(cap);
    const rows = fixRows(d);
    const inR = (h, list) => list.find(r => h >= r.p.from && h < r.p.to);
    const fixedR = rows.filter(r => r.on), dashR = rows.filter(r => !r.on);
    const strip = document.createElement("div"); strip.className = "dy-strip";
    hs.forEach((h, i) => {
      const n = cnt[i];
      const col = document.createElement("button"); col.type = "button"; col.className = "dy-h";
      const lab = document.createElement("span"); lab.className = "dy-l"; lab.textContent = h + (i === 0 ? "시" : "");
      col.appendChild(lab);
      if (i === hs.length - 1){ const e = document.createElement("span"); e.className = "dy-l end"; e.textContent = String(h + 1); col.appendChild(e); }
      const well = document.createElement("span"); well.className = "dy-w";
      const f = inR(h, fixedR), g = inR(h, dashR);
      if (f) well.classList.add("fx", ...(h === f.p.from ? ["fxL"] : []), ...(h === f.p.to - 1 ? ["fxR"] : []));
      if (g) well.classList.add("dz", ...(h === g.p.from ? ["dzL"] : []), ...(h === g.p.to - 1 ? ["dzR"] : []));
      if (fxFrom === h) well.classList.add("from");
      const num = document.createElement("span"); num.className = "dy-n"; num.textContent = n ? String(n) : "";
      const bar = document.createElement("span"); bar.className = "dy-b";
      bar.style.height = n ? Math.max(8, Math.round(78 * n / tot)) + "%" : "0";
      well.append(num, bar);
      col.appendChild(well);
      col.title = h + "–" + (h + 1) + "시 · " + n + "명" + (n ? " — " + availAt(d, h).join(", ") : "");
      col.setAttribute("aria-label", h + "시부터 한 시간 · " + n + "명");
      col.onclick = () => {
        /* 고른 범위 안을 다시 누르면 해제 (2026-10-01 Benny) */
        if (fxFrom === null && fxA !== null && h >= fxA && h <= fxZ){ fxA = fxZ = null; }
        else if (fxFrom === null){ fxFrom = h; fxA = fxZ = h; }
        else { fxA = Math.min(fxFrom, h); fxZ = Math.max(fxFrom, h); fxFrom = null; }
        renderDayInfo(d);
      };
      strip.appendChild(col);
    });
    box.appendChild(strip);
  }
  renderFixBox(d);
  /* 사람별 — 되는 순서대로. △ 는 시간, ✕ 는 이유 */
  const pbox = $("#dmPeople"); pbox.innerHTML = "";
  const list = document.createElement("div"); list.className = "dy-list";
  [["all","○ 돼요"],["part","△ 일부만"],["no","✕ 안 돼요"],["none","– 미정"]].forEach(([k, title]) => {
    if (!groups[k].length) return;
    const row = document.createElement("div"); row.className = "dy-row " + k;
    const t = document.createElement("span"); t.className = "dy-t"; t.textContent = title;
    const who = document.createElement("span"); who.className = "dy-who";
    groups[k].forEach((p, i) => {
      if (i) who.append(" · ");
      const nm = document.createElement("b"); nm.textContent = p.n; who.appendChild(nm);
      const extra = [p.tx, p.note].filter(Boolean).join(" ");
      if (extra){ const e = document.createElement("span"); e.className = "dy-x"; e.textContent = " " + extra; who.appendChild(e); }
    });
    row.append(t, who); list.appendChild(row);
  });
  pbox.appendChild(list);
}
/** 그 날 줄들 — 📌 확정(시간표 · 이력 '예정') + 후보(미확정) + 막대에서 지금 고른 시간(저장 전).
    on = 확정, ext = 이력에만 있는 '예정', tmp = 아직 저장 안 한 고른 시간 */
function fixRows(d){
  const out = [], seen = new Set(), ext = shownFixes().filter(t => fixes().indexOf(t) < 0);
  const add = (t, o) => { const p = pickParse(t); if (!p || p.d !== d || seen.has(t)) return; seen.add(t); out.push(Object.assign({ t, p, time: p.from + "–" + p.to }, o)); };
  fixes().forEach(t => add(t, { on: true }));
  ext.forEach(t => add(t, { on: true, ext: true }));
  picks().forEach(t => add(t, { on: false }));
  if (fxA !== null && fxFrom === null) add(pickTxt(d, fxA, fxZ + 1), { on: false, tmp: true });
  return out.sort((a, b) => a.p.from - b.p.from || a.p.to - b.p.to);
}
let fxTmpNote = "";                                 // 고른 시간(저장 전)에 적어 둔 '무슨 일정'
/** 📌 — 안내 한 줄 + 줄 목록 [정하기/확정] 17–20 [무슨 일정] [✕]
    (2026-10-01 Benny: "왼쪽 정하기 버튼을 눌러야 확정, 시간 범위만 고르면 미확정 · 이력도 누르면 해제, 옆에 삭제") */
function renderFixBox(d){
  const st = $("#dmFixState");
  st.classList.remove("ok");
  if (fxFrom !== null) st.textContent = fxFrom + "시부터 — 끝 시간 칸을 눌러주세요";
  else if (fxA !== null){
    st.textContent = fxA + "–" + (fxZ + 1) + "시 · " + pickWho(pickTxt(d, fxA, fxZ + 1)).length + "명 가능 — '정하기' 를 눌러야 확정";
    st.classList.add("ok");
  } else st.textContent = "위 시간 칸에서 시작·끝을 눌러 고르세요";
  const lb = $("#dmFixList"); lb.innerHTML = "";
  fixRows(d).forEach(x => {
    const r = document.createElement("div"); r.className = "fxrow" + (x.on ? " on" : "") + (x.tmp ? " tmp" : "");
    const go = document.createElement("button"); go.type = "button"; go.className = "btn fxgo" + (x.on ? " dark" : "");
    go.textContent = x.on ? "📌 확정" : "정하기";
    go.setAttribute("aria-pressed", String(!!x.on));
    go.title = x.on ? "누르면 확정 해제 (후보로 남아요)" : "누르면 📌 확정";
    const tm = document.createElement("b"); tm.textContent = x.time;
    if (x.ext){ const e = document.createElement("small"); e.textContent = "이력"; tm.appendChild(e); }
    const inp = document.createElement("input");
    inp.type = "text"; inp.maxLength = FIXNOTE_MAX; inp.placeholder = "무슨 일정? (선택)";
    inp.value = x.tmp ? fxTmpNote : fixNoteOf(x.t);
    inp.setAttribute("aria-label", x.time + " 무슨 일정인지");
    if (x.tmp) inp.addEventListener("input", () => { fxTmpNote = inp.value; });
    else inp.addEventListener("change", () => { setFixNote(x.t, inp.value); renderDm(); });
    inp.addEventListener("keydown", e => { if (e.key === "Enter" && !e.isComposing){ e.preventDefault(); x.tmp ? go.click() : inp.blur(); } });
    const del = document.createElement("button"); del.type = "button"; del.className = "btn x"; del.textContent = "✕";
    del.setAttribute("aria-label", x.time + " 지우기");
    go.onclick = () => fixRowToggle(d, x, inp.value);
    del.onclick = () => fixRowDelete(d, x);
    r.append(go, tm, inp, del);
    lb.appendChild(r);
  });
}
/** 정하기 ↔ 해제. 해제한 건 후보로 남는다 (지우려면 ✕) */
function fixRowToggle(d, x, note){
  const nt = String(note || "").replace(/\s+/g, " ").trim().slice(0, FIXNOTE_MAX);
  const pk = picks();
  if (!x.on){
    if (x.tmp){ fxA = fxZ = null; fxTmpNote = ""; }
    setFixes(fixes().concat([x.t]), "📌 " + fmtPick(x.t) + (nt ? " " + nt : "") + " 확정",
             nt ? { [x.t]: nt } : null, pk.filter(t => t !== x.t));
  } else if (x.ext){
    if (typeof releaseExtraFix !== "function" || !releaseExtraFix(x.t)) return;   // 이력 '예정' 을 지운다 (묻고)
    setFixes(fixes(), fmtPick(x.t) + " 확정 해제 — 후보로 남겼어요", null, pk.concat([x.t]));
  } else {
    setFixes(fixes().filter(t => t !== x.t), fmtPick(x.t) + " 확정 해제 — 후보로 남겼어요", null, pk.concat([x.t]));
  }
  renderDm();
}
function fixRowDelete(d, x){
  if (x.tmp){ fxA = fxZ = null; fxTmpNote = ""; renderDm(); return; }
  if (x.ext){ if (typeof releaseExtraFix !== "function" || !releaseExtraFix(x.t)) return; }
  setFixes(fixes().filter(t => t !== x.t), fmtPick(x.t) + " 지웠어요", { [x.t]: "" }, picks().filter(t => t !== x.t));
  renderDm();
}
function renderDm(){
  const d = dmDate; if (!d) return;
  const setMode = dmMode === "set";
  $("#dmNoName").hidden = setMode || !!me;
  $("#dmMine").hidden   = setMode || !me;
  $("#dmSet").hidden    = !(setMode || dmSetOpen);
  $("#dmSet").classList.toggle("solo", setMode);
  $("#dmSum").textContent = setMode ? "" : (me ? me + " 님, 이 날 되세요?" : "");
  $("#dmSum").hidden = setMode;
  if (setMode){ renderDayInfo(d); return; }
  if (!me) return;
  const mk = dmMark(d), show = dmPart ? "t" : mk;
  $("#dmO").setAttribute("aria-pressed", String(show === "o"));
  $("#dmT").setAttribute("aria-pressed", String(show === "t"));
  $("#dmX").setAttribute("aria-pressed", String(show === "x"));
  /* 이유 칸 — ○ 만 빼고 △ ✕ 미정 에 보인다 (2026-09-30 Benny: "미정에도 이유가 있을 수 있지").
     미정은 이미 이유가 있거나 미정을 눌렀을 때만 펼친다 (처음 여는 빈 날엔 버튼 네 개만) */
  $("#dmMore").hidden     = !(show === "t" || show === "x" || (show === "" && (dmNOpen || !!noteDraft[d])));
  $("#dmHoursBox").hidden = show !== "t";
  $("#dmInput").placeholder = show === "x" ? "이유 (선택) — 예: 출장이에요"
                            : show === "" ? "이유 (선택) — 예: 아직 일정 확인 중이에요"
                            : "이유 (선택) — 예: 21시 넘어야 도착해요";
  $("#dmN").setAttribute("aria-pressed", String(show === ""));
  if (show === "t") renderDmHours();
}
function renderDmHours(){
  const box = $("#dmHours"); box.innerHTML = "";
  const d = dmDate, hs = hoursFor(d);
  hs.forEach((h, i) => {
    const b = document.createElement("button");
    b.type = "button"; b.className = "tb" + (i === hs.length - 1 ? " last" : "");
    b.dataset.h = h; b.dataset.l = hh(h); b.dataset.e = hh(h + 1);
    b.textContent = String(h);                   // 24시간제 숫자를 칸 안에 (2026-09-22)
    b.setAttribute("aria-label", h + "시");
    b.setAttribute("aria-pressed", String(sel.has(key(d,h))));
    if (dmFrom === h) b.classList.add("from");
    b.onclick = () => {
      noneSel.delete(d);
      if (dmMulti){                                  // 한 칸씩 켜고 끄기
        const k = key(d,h);
        sel.has(k) ? sel.delete(k) : sel.add(k);
      } else if (dmFrom === null){                   // ① 시작 — 그 칸만 남기고 끝을 기다린다
        hs.forEach(x => sel.delete(key(d,x)));
        sel.add(key(d,h));
        dmFrom = h;
      } else {                                       // ② 끝 — 사이를 전부 채운다
        const a = Math.min(dmFrom, h), z = Math.max(dmFrom, h);
        hs.forEach(x => (x >= a && x <= z) ? sel.add(key(d,x)) : sel.delete(key(d,x)));
        dmFrom = null;
      }
      myHours(d).length ? maybeSel.delete(d) : maybeSel.add(d);   // 시간을 다 지우면 '시간 미정'
      renderDmHours(); paintSheet(); touch();
    };
    box.appendChild(b);
  });
  const on = myHours(d);
  const st = $("#dmState");
  if (!dmMulti && dmFrom !== null) st.textContent = dmFrom + "시부터 — 끝 시간을 눌러주세요";
  else if (on.length)              st.textContent = runsOf(on) + " 가능";
  else                             st.textContent = dmMulti ? "되는 시간을 하나씩 눌러주세요" : "되는 시간을 알면 시작·끝을 눌러주세요 (몰라도 그냥 닫으면 저장돼요)";
  st.classList.toggle("ok", on.length > 0 && !(dmFrom !== null && !dmMulti));
  $("#dmMulti").textContent = dmMulti ? "↩ 한 구간으로 넣기" : "＋ 여러 구간 넣기";
}
function openDay(d, mode){
  if (mode !== "set" && isOff(me)){ setStatus(me + " 님은 이 시간표에 참여하지 않아요 — ⚙ 설정 → 멤버에서 켤 수 있어요"); return; }
  dmDate = d;
  dmMode = (mode === "set") ? "set" : "edit";
  dmSetOpen = false;
  dmNOpen = false;
  dmPart = dmMark(d) === "t";                    // 이미 △ 면 시간 버튼을 펼쳐서 연다
  dmFrom = null;
  dmMulti = runsOf(myHours(d)).indexOf(",") >= 0; // 이미 여러 구간이면 그 방식으로 연다
  /* 내 입력 창: 정한 날이면 시간대 대신 정한 시간 (표 머리와 같게). 설정 창은 시간대를 고치는 곳이라 시간대 그대로 */
  const ftT = (dmMode === "edit" && isFixedDay(d)) ? fixedTimes(d) : [];
  $("#dmTitle").textContent = fmtFull(d) + " · " + (ftT.length ? "📌 " + ftT.join(", ") + "시" : winLabel(d));
  $("#dmInput").value = noteDraft[d] || "";
  renderDmAdmin(d);
  fxPreset(); fxTmpNote = "";
  renderDm();
  if ($("#dayModal").hidden) openModal("dayModal");   // 이미 열려 있는 창을 다시 그릴 땐 칸을 더 밀지 않는다
}
/** 이유 칸에 적은 걸 초안에 옮긴다 (저장 버튼 없이 닫아도 남게) */
function commitNote(){
  const d = dmDate;
  if (!d || !me || dmMode !== "edit" || $("#dmMore").hidden) return;
  const v = $("#dmInput").value.trim();
  if ((noteDraft[d] || "") !== v){ v ? (noteDraft[d] = v) : delete noteDraft[d]; dirty = true; paintSheet(); }
}
function closeDay(fromBack){
  commitNote();
  dmDate = null;
  if (!$("#dayModal").hidden) closeModal("dayModal", fromBack);
  /* 창을 닫으면 **알아서 저장**한다 (2026-09-22o Benny: "맨 밑에 저장 버튼은 뭐야?")
     `save()` 는 맨 앞에서 dirty 를 내리므로 두 번 저장하지 않는다. */
  if (dirty && me && !saving) save();
}

function mkHourBtn(from, to, val){
  const b = document.createElement("button");
  b.type = "button"; b.className = "hourbtn";
  setHourBtn(b, from, to, val);
  return b;
}
function renderDmAdmin(d){
  const box = $("#dmWin"); box.innerHTML = "";
  const [a, b] = winOf(d);
  const s1 = mkHourBtn(0, 23, a), s2 = mkHourBtn(1, 24, b);
  const apply = () => {
    const x = hourVal(s1), y = hourVal(s2);
    if (y <= x){ setStatus("끝 시간이 시작보다 늦어야 해요", "err"); return; }
    const w = Object.assign({}, ST.windows || {});
    if (x === ST.hourStart && y === ST.hourEnd) delete w[d]; else w[d] = [x, y];
    act({ action:"meet_set", windows: JSON.stringify(w) }, fmtFull(d) + " 시간대 " + x + "–" + y + "시",
        () => { ST.windows = w; });
    renderDmHours();
  };
  bindRange(s1, s2, apply);                                         // 시작·끝을 한 번에 (범위)
  const u = document.createElement("span"); u.className = "hint"; u.style.margin = "0"; u.textContent = "~";
  box.append(s1, u, s2);
}

/* ═══ 저장 ═══ */
async function save(){
  if (!me){ setStatus("이름을 먼저 적어주세요", "err"); return; }
  if (saving) return;
  saving = true;
  const payload = { hours:{}, notes:{} };
  dates().forEach(d => {
    /* ⚠️ 시간대 밖의 시간도 버리지 않는다 — 시간대를 좁혔다 넓혀도 응답이 살아 있게 */
    const hs = []; for (let h = 0; h < 24; h++) if (sel.has(key(d,h))) hs.push(h);
    payload.hours[d] = hs.length ? hs : (noneSel.has(d) ? [] : (maybeSel.has(d) ? [-1] : null));
    payload.notes[d] = noteDraft[d] || "";
  });
  /* 🚨 빈 저장 막기 (2026-09-22r)
     정민 님 사고: 수정시각만 남고 응답이 0줄 — 전부 null 인 payload 가 나갔다.
     ① 날짜를 아직 못 받았으면(dates 0) 아예 보내지 않는다 — 보내봐야 시각만 찍힌다.
     ② 전부 미정인데 전에 넣어둔 게 있으면 **정말 지울 건지 묻는다**. */
  const anyVal = dates().some(d => payload.hours[d] !== null) ||
                 dates().some(d => !!payload.notes[d]);
  const hadBefore = Object.keys((ST.hours || {})[me] || {}).length;
  if (!dates().length){
    saving = false;
    setStatus("날짜를 아직 못 받았어요 — 페이지를 새로고침해 주세요", "err");
    return;
  }
  if (!anyVal && hadBefore){
    saving = false;
    if (!confirm("입력한 " + hadBefore + "일을 전부 '미정' 으로 되돌립니다. 맞나요?")){
      loadMine(true); renderAll();
      setStatus("그대로 두었습니다", "ok");
      return;
    }
    saving = true;
  }
  const backup = JSON.stringify({ h: ST.hours, n: ST.notes, e: ST.edited });
  if (!ST.hours) ST.hours = {};
  if (!ST.notes) ST.notes = {};
  const keep = {}, prev = ST.hours[me] || {};
  for (const d in prev) if (!(d in payload.hours)) keep[d] = prev[d];
  for (const d in payload.hours) if (payload.hours[d] !== null) keep[d] = payload.hours[d];
  ST.hours[me] = keep;
  ST.notes[me] = {};
  for (const d in payload.notes) if (payload.notes[d]) ST.notes[me][d] = payload.notes[d];
  if (!ST.edited) ST.edited = {};
  ST.edited[me] = nowStamp();
  dirty = false;
  renderAll();
  try {
    ST = await api({ action:"save", m:M, name:me, payload: JSON.stringify(payload) });
    setStatus("");
    renderAll(); snapSave();
  } catch(e){
    const b = JSON.parse(backup);
    ST.hours = b.h; ST.notes = b.n; ST.edited = b.e;
    dirty = true; renderAll();
    setStatus("저장 실패 — " + e.message + " (저장을 다시 눌러주세요)", "err");
  } finally { saving = false; }
}

/* ═══ 결과 — 위: 담은 후보 / 아래: 직접 고르기 표 하나 ═══
   (2026-09-28 Benny: "결과 보기 창이 좀 복잡해. 아래에는 직접 고르기 하나만.
    날짜를 누르면 그 날 전체 시간이 선택되고 맨 위 후보 리스트로 올라가고, 다시 누르면 해제.
    지금은 시간을 눌러도 해제가 안 돼" / "하나만 선택하게 하지 말고 여러 개도")
   · 날짜 칸 = 그 날 시간대 전체를 담기/빼기 · 시간 칸 = 한 칸씩 담기/빼기
   · 붙어 있는 시간은 한 후보로 합친다 ("19:00~22:00")
   · 📌 정하기도 **여러 개** — 밴드매니저에서 합주를 여러 번 잡을 때도 같은 모양
   저장: picks = 후보 목록, fixed = 정한 것들을 ", " 로 이은 문자열 */
function picks(){ return (ST.picks || []).slice(); }
function pickTxt(d, from, to){ return d + " " + hh(from) + "~" + hh(to); }
/** "2026-10-04 19:00~22:00" → {d, from, to} (to 는 끝나는 시각) */
function pickParse(t){
  const m = /^(\d{4}-\d{2}-\d{2}) (\d{2}):\d{2}~(\d{2}):\d{2}$/.exec(String(t || ""));
  return m ? { d: m[1], from: +m[2], to: +m[3] } : null;
}
function fmtPick(t){
  const p = pickParse(t);
  return p ? fmtFull(p.d) + " " + hh(p.from) + "~" + hh(p.to) : t;
}
/** 그 후보 구간에 내내 되는 사람 */
function pickWho(t){
  const p = pickParse(t); if (!p) return [];
  const H = hoursOf(), hs = [];
  for (let h = p.from; h < p.to; h++) hs.push(h);
  return responders().filter(n => hs.every(h => ((H[n] || {})[p.d] || []).includes(h)));
}
/** 그 날 후보에 담긴 시간들 */
function pickHours(d){
  const s = new Set();
  picks().forEach(t => { const p = pickParse(t); if (p && p.d === d) for (let h = p.from; h < p.to; h++) s.add(h); });
  return s;
}
/** 그 날 후보를 이 시간들로 바꾼다 — 붙어 있는 건 한 구간으로 */
function setDayPicks(d, set, msg){
  const list = picks().filter(t => { const p = pickParse(t); return !p || p.d !== d; });
  const hs = Array.from(set).sort((a, b) => a - b);
  let st = null, prev = null;
  hs.forEach(h => {
    if (st === null){ st = prev = h; return; }
    if (h === prev + 1){ prev = h; return; }
    list.push(pickTxt(d, st, prev + 1)); st = prev = h;
  });
  if (st !== null) list.push(pickTxt(d, st, prev + 1));
  list.sort();
  if (list.length > 20){ setStatus("후보는 20개까지예요", "err"); return; }
  act({ action:"meet_set", picks: JSON.stringify(list) }, msg, () => { ST.picks = list.slice(); });
  renderResult();
}
function tapDay(d){
  const all = hoursFor(d), cur = pickHours(d);
  const full = all.every(h => cur.has(h));
  if (full) setDayPicks(d, new Set(), fmtFull(d) + " 후보에서 뺐습니다");
  else      setDayPicks(d, new Set(all), fmtFull(d) + " 하루 전체를 후보에 담았습니다");
}
function tapHour(d, h){
  const cur = pickHours(d);
  const had = cur.has(h);
  had ? cur.delete(h) : cur.add(h);
  setDayPicks(d, cur, fmtFull(d) + " " + h + "시 " + (had ? "뺐습니다" : "담았습니다"));
}
function dropPick(t){
  const p = pickParse(t); if (!p) return;
  const cur = pickHours(p.d);
  for (let h = p.from; h < p.to; h++) cur.delete(h);
  setDayPicks(p.d, cur, "후보에서 뺐습니다");
}

/* 📌 정한 것 — 여러 개 */
function fixes(){ return String((meet() && meet().fixed) || "").split(/\s*,\s*/).filter(Boolean); }
function isFixed(t){ return fixes().indexOf(t) >= 0; }
/* 📌 코멘트 — 정한 것마다 (선택). 이력에만 있는 '예정' 합주(extraFixes)에도 달 수 있다 */
function fixNotes(){ return (meet() && meet().fixNotes) || {}; }
function fixNoteOf(t){ return fixNotes()[t] || ""; }
/** notes 를 주면 코멘트도 같이 바꾼다. 없어진 📌 의 코멘트는 버린다 */
function setFixes(list, msg, notes, pickList){
  const v = Array.from(new Set(list)).sort().join(", ");
  const after = v ? v.split(", ") : [];
  const pl = pickList ? Array.from(new Set(pickList)).sort() : null;
  if (pl && pl.length > 20){ setStatus("후보는 20개까지예요", "err"); return; }
  const keep = new Set(after.concat(shownFixes().filter(t => fixes().indexOf(t) < 0), pl || picks()));
  const src = Object.assign({}, fixNotes(), notes || {}), nn = {};
  Object.keys(src).forEach(k => { if (keep.has(k) && src[k]) nn[k] = src[k]; });
  /* 밴드매니저: 📌 정한 게 바뀌면 합주 이력에 '예정' 회차를 만들고 지운다 (+ 코멘트를 이력에) */
  if (typeof onFixesChanged === "function"){ try { onFixesChanged(fixes(), after, nn); } catch(e){} }
  const p = { action:"meet_set", fixed: v, fixNotes: JSON.stringify(nn) };
  if (pl) p.picks = JSON.stringify(pl);
  act(p, msg, () => { if (ST.meet){ ST.meet.fixed = v; ST.meet.fixNotes = nn; } if (pl) ST.picks = pl.slice(); });
}
function setFixNote(t, note){
  note = String(note || "").replace(/\s+/g, " ").trim().slice(0, FIXNOTE_MAX);
  if (note === fixNoteOf(t)) return;
  setFixes(fixes(), note ? "코멘트 저장됨" : "코멘트 지웠어요", { [t]: note });
}
function toggleFix(t){
  const list = fixes(), i = list.indexOf(t);
  if (i >= 0){ list.splice(i, 1); setFixes(list, "정한 거 취소됨 — " + fmtPick(t)); }
  else { list.push(t); setFixes(list, "📌 " + fmtPick(t) + " 로 정했습니다"); }
}

function renderResult(){
  const rs = responders(), ds = dates(), hs = allHours();
  const sub = $("#resSub");
  if (sub){
    const n = rs.length, tot = members().length;
    sub.textContent = n ? n + " / " + tot + "명이 입력했어요" : "아직 아무도 입력 안 했어요";
  }
  renderPicks();

  /* 표 — 세로 = 날짜, 가로 = 시간. 숫자 = 그 시간에 되는 사람 수, 진할수록 많다 */
  const g = $("#heat"); g.innerHTML = "";
  if (!ds.length || !hs.length) return;
  g.style.gridTemplateColumns = "58px repeat(" + hs.length + ", minmax(42px, 1fr))";
  g.appendChild(cell("gc hh corner", ""));
  hs.forEach(h => g.appendChild(cell("gc hh", String(h))));
  ds.forEach(d => {
    const mine = pickHours(d), win = hoursFor(d);
    const dayFull = win.length && win.every(h => mine.has(h));
    const dc = cell("gc dh" + (dObj(d).getDay() === 0 ? " sun" : "") + (dayFull ? " on" : ""), "");
    dc.innerHTML = '<span>' + fmtD(d) + '</span><span class="dow">' + fmtDow(d) + "</span>";
    dc.title = fmtFull(d) + " 하루 전체 담기/빼기";
    dc.onclick = () => tapDay(d);
    g.appendChild(dc);
    hs.forEach(h => {
      if (!win.includes(h)){ g.appendChild(cell("gc hcell off", "")); return; }
      /* (2026-09-28 Benny: "녹색만 가득해서 보기가 힘들고, 선택된 것도 검정 테두리뿐이라 보기 힘들다")
         → 진한 초록 = **전원** 되는 칸뿐, 나머지는 아주 옅게, 0명은 빈칸. 고른 칸 = 검정 바탕 흰 숫자 */
      const n = availAt(d,h).length;
      const all = n && n === rs.length;
      const c = cell("gc hcell" + (n ? "" : " z") + (all ? " full" : ""), n ? String(n) : "");
      if (n && !all && rs.length) c.style.background = "rgba(var(--accent-rgb)," + (0.05 + 0.20 * (n / rs.length)).toFixed(3) + ")";
      if (mine.has(h)){ c.classList.add("inpick"); c.style.background = ""; }
      c.onclick = () => tapHour(d, h);
      g.appendChild(c);
    });
  });
}

function renderPicks(){
  const box = $("#picksCard"); box.innerHTML = "";
  const fx = fixes();
  /* 정한 것 중 후보에서 빠진 것도 보여줘야 취소할 수 있다 */
  const list = Array.from(new Set(picks().concat(fx))).sort();
  const wrap = document.createElement("div"); wrap.className = "picks";
  if (!list.length){
    const e = document.createElement("p"); e.className = "pempty";
    e.textContent = "아래 표에서 날짜나 시간을 누르면 여기에 담겨요.";
    wrap.appendChild(e); box.appendChild(wrap); return;
  }
  const head = document.createElement("div"); head.className = "ph";
  const b = document.createElement("b"); b.textContent = "후보 " + list.length + "개";
  const sp = document.createElement("span"); sp.textContent = fx.length ? "📌 " + fx.length + "개 정함" : "친구들에게도 보입니다";
  head.append(b, sp); wrap.appendChild(head);

  list.forEach(t => {
    const on = fx.indexOf(t) >= 0;
    const row = document.createElement("div"); row.className = "prow" + (on ? " fixed" : "");
    const pt = document.createElement("div"); pt.className = "pt";
    const tt = document.createElement("b"); tt.textContent = (on ? "📌 " : "") + fmtPick(t) + (fixNoteOf(t) ? " · " + fixNoteOf(t) : "");
    const who = pickWho(t);
    const s2 = document.createElement("span"); s2.className = "ps";
    s2.textContent = responders().length ? who.length + " / " + responders().length + "명 내내 가능" + (who.length ? " — " + who.join(", ") : "") : "아직 아무도 입력 안 했어요";
    pt.append(tt, s2);
    const go = document.createElement("button");
    go.type = "button"; go.className = "btn" + (on ? "" : " dark");
    go.textContent = on ? "취소" : "📌 정하기";
    go.onclick = () => toggleFix(t);
    const x = document.createElement("button");
    x.type = "button"; x.className = "btn x"; x.textContent = "✕";
    x.setAttribute("aria-label", fmtPick(t) + " 후보에서 빼기");
    x.onclick = () => { if (on) toggleFix(t); dropPick(t); };
    row.append(pt, go, x);
    wrap.appendChild(row);
  });
  box.appendChild(wrap);
}
/** 설정 창·그 날 창에서 통째로 바꿀 때 */
function setFixed(v){
  setFixes(String(v || "").split(/\s*,\s*/).filter(Boolean), v ? "📌 " + fmtFixed(v) + " 로 정했습니다" : "정한 거 취소됨");
}


/* ═══ 날짜 고르기 ═══ */
let calY = new Date().getFullYear(), calM = new Date().getMonth();
let dsel = new Set(), dateDirty = false, dateTimer = null;
function paintDowRow(){
  const days = new Date(calY, calM + 1, 0).getDate(), today = todayIso();
  $$("#dowRow button").forEach(b => {
    const dow = +b.dataset.dow, hits = [];
    for (let n = 1; n <= days; n++){
      const o = new Date(calY, calM, n), d = iso(o);
      if (o.getDay() === dow && d >= today) hits.push(d);
    }
    b.disabled = !hits.length;
    b.setAttribute("aria-pressed", String(hits.length > 0 && hits.every(d => dsel.has(d))));
  });
}
function renderCal(){
  $("#calLabel").textContent = calY + "년 " + (calM + 1) + "월";
  paintDowRow();
  const cal = $("#cal"); cal.innerHTML = "";
  DOW.forEach((w, i) => { const h = document.createElement("div"); h.className = "dowh" + (i === 0 ? " sun" : ""); h.textContent = w; cal.appendChild(h); });
  const first = new Date(calY, calM, 1);
  const days  = new Date(calY, calM + 1, 0).getDate();
  const today = todayIso();
  for (let i = 0; i < first.getDay(); i++){ const b = document.createElement("div"); b.className = "d blank"; cal.appendChild(b); }
  for (let n = 1; n <= days; n++){
    const d = iso(new Date(calY, calM, n));
    const past = d < today;
    const b = document.createElement("button");
    b.type = "button";
    b.className = "d" + (past ? " past" : "") + (d === today ? " today" : "") + (dsel.has(d) ? " on" : "");
    b.textContent = n; b.dataset.d = d;
    if (past) b.disabled = true;
    cal.appendChild(b);
  }
  renderDateChips();
}
function renderDateChips(){
  const box = $("#dateChips"); box.innerHTML = "";
  const list = Array.from(dsel).sort();
  if (!list.length){ box.innerHTML = '<span class="hint" style="margin:0">아직 고른 날짜가 없습니다.</span>'; return; }
  list.forEach(d => {
    const b = document.createElement("button");
    b.className = "chip datechip"; b.type = "button";
    b.innerHTML = "<span></span><span class='x'>×</span>";
    b.querySelector("span").textContent = fmtFull(d);
    b.onclick = () => { dsel.delete(d); renderCal(); dateChanged(); };
    box.appendChild(b);
  });
}
function toggleDate(d){ dsel.has(d) ? dsel.delete(d) : dsel.add(d); renderCal(); dateChanged(); }
function toggleDow(dow){
  const days = new Date(calY, calM + 1, 0).getDate(), today = todayIso(), hits = [];
  for (let n = 1; n <= days; n++){
    const o = new Date(calY, calM, n), d = iso(o);
    if (o.getDay() === dow && d >= today) hits.push(d);
  }
  if (!hits.length){ setStatus("이 달에 남은 날이 없습니다", "err"); return; }
  const allOn = hits.every(d => dsel.has(d));
  hits.forEach(d => allOn ? dsel.delete(d) : dsel.add(d));
  renderCal(); dateChanged();
}
/** 연타를 0.9초 모아 한 번만 저장 */
function dateChanged(){
  dateDirty = true;
  clearTimeout(dateTimer);
  dateTimer = setTimeout(saveDates, 900);
}
async function saveDates(){
  const list = Array.from(dsel).sort();
  dateDirty = false;
  if (!M){ if (typeof renderNewDates === "function") renderNewDates(); return; }   // 아직 안 만든 약속 — 폼에만 담아둔다 (2026-09-22f)
  await act({ action:"meet_set", dates: list.join(",") }, "날짜 저장됨", () => { ST.dates = list.slice(); });
}


/* ═══ 일정 이벤트 ═══ */
$("#saveBtn").onclick = save;
/* 창 열기·닫기 때 할 일 (core.js 의 openModal/closeAny 가 부른다) */
MODAL_OPEN.heatModal = () => renderResult();
MODAL_OPEN.calModal = () => {
  /* 아직 만들지 않은 약속이면 폼에 담아둔 날짜를 그대로 이어서 고른다 (2026-09-22f) */
  if (M) dsel = new Set(dates());
  const first = M ? dates()[0] : Array.from(dsel).sort()[0];
  if (first){ const o = dObj(first); calY = o.getFullYear(); calM = o.getMonth(); }
  else { const o = new Date(); calY = o.getFullYear(); calM = o.getMonth(); }
  /* ⚠️ 만들기 전에는 시간대를 폼(위)에서만 고른다. 달력 안에도 두면 둘이 안 맞는다
     (2026-09-22h Benny: "안에꺼 수정해도 밖에꺼가 그대로이고") */
  $("#calHourFld").hidden = !M;
  if (M){
    fillHourSel($("#c_hs"), 0, 23, ST.hourStart);
    fillHourSel($("#c_he"), 1, 24, ST.hourEnd);
  }
  renderCal();
};
MODAL_OPEN.friendModal = () => { fmNew = []; renderFm(); };
MODAL_CLOSE.dayModal = fromBack => closeDay(fromBack);     // 그 날 창은 닫으면서 저장한다
$("#calOpenBtn").onclick  = () => openModal("calModal");
$("#segCal").onclick = () => setView("cal");
$("#segTab").onclick = () => setView("tab");

$("#whoGo").onclick    = () => { if (whoRen) renameMe($("#whoInput").value); else pickMe($("#whoInput").value); };
/* ⚠️ 한글 조합 중 keydown 의 key 는 'Process'/keyCode 229 → keyup 도 같이 본다 */
["keydown","keyup"].forEach(ev =>
  $("#whoInput").addEventListener(ev, e => {
    if (e.key === "Enter" || e.keyCode === 13){ e.preventDefault(); $("#whoGo").click(); }
  }));
$("#whoCancel").onclick = () => { whoRen = false; $("#whoInput").value = ""; renderWho(); };
/* 줄 아무 데나 누르면 접힘 ↔ 펼침. ＋친구·✎수정 버튼은 자기 일만 한다 */
function toggleWho(){
  if (!me) return;                       // 이름이 없으면 늘 펼친 상태
  whoOpen = !whoOpen; whoAdd = false; whoRen = false;
  $("#whoInput").value = "";
  renderWho();
}
$("#whoBar").addEventListener("click", e => {
  if (e.target.closest("button")) return;   // ＋친구 / ✎수정 은 제외
  toggleWho();
});
$("#whoBar").addEventListener("keydown", e => {
  if (e.key === "Enter" || e.key === " "){ e.preventDefault(); toggleWho(); }
});
$("#whoRename").onclick = () => {
  whoRen = true; whoAdd = false; $("#whoInput").value = me;
  renderWho();
  setTimeout(() => { try { $("#whoInput").select(); } catch(e){} }, 60);
};

$("#dmClose").onclick   = () => closeDay();
/* 내 입력 창의 ⚙(이 날 설정)은 뺐다 — 날짜 머리를 누르면 같은 설정이 열린다 (2026-09-30 Benny: "중복 기능") */
/** 이름 없이 입력하려 할 때 — 창을 닫고 '누구세요' 를 펼친다 */
function askName(){
  closeDay();
  if (typeof onAskName === "function"){ onAskName(); return; }   // 밴드매니저: 누구세요가 페이지 쪽에 있다
  whoOpen = true; whoAdd = false; renderWho();
  $("#whoCard").scrollIntoView({ behavior:"smooth", block:"center" });
  setTimeout(() => { if (!$("#whoAddRow").hidden) $("#whoInput").focus(); }, 300);
}
$("#dmName").onclick = askName;
/* ○ — 한 번 누르면 끝: 시간 전부 + 이유 지우고 저장·닫기 */
$("#dmO").onclick = () => {
  const d = dmDate; if (!d) return;
  hoursFor(d).forEach(h => sel.add(key(d,h))); noneSel.delete(d); maybeSel.delete(d);
  delete noteDraft[d]; $("#dmInput").value = "";
  dmPart = false; renderDm(); paintSheet(); touch();
  closeDay();
};
/* △ — 시간 버튼 + 이유를 펼친다. 버튼을 누르기 전까지 원래 답은 그대로 둔다(닫아도 안 날아가게) */
/* △ — 누르는 순간 '일부만(시간 미정)' 으로 찍힌다. 시간은 골라도 되고 안 골라도 된다 (2026-10-01).
   이미 일부 시간이 있으면 그대로, ○(전부)였으면 비우고 시간 미정으로 */
$("#dmT").onclick = () => {
  const d = dmDate; if (!d) return;
  const on = myHours(d);
  if (!on.length || on.length >= hoursFor(d).length){ hoursFor(d).forEach(h => sel.delete(key(d,h))); maybeSel.add(d); }
  noneSel.delete(d);
  dmPart = true; dmNOpen = false; dmFrom = null; renderDm(); paintSheet(); touch();
};
$("#dmMulti").onclick = () => { dmMulti = !dmMulti; dmFrom = null; renderDmHours(); };
/* ✕ — 바로 '안 돼요' 로 찍는다. 이유 없이 닫아도 저장된다 */
$("#dmX").onclick = () => {
  const d = dmDate; if (!d) return;
  hoursFor(d).forEach(h => sel.delete(key(d,h))); noneSel.add(d); maybeSel.delete(d);
  dmPart = false; dmNOpen = false; renderDm(); paintSheet(); touch();
  /* 키보드는 띄우지 않는다 — 이유는 적고 싶을 때만 칸을 누른다 (2026-09-28 Benny: "자동 키보드 불편해") */
};
/* 미정 — 네 번째 선택지 (2026-09-30 Benny: "선택지는 4개니까 O, 세모, X, 미정") */
$("#dmN").onclick = () => {
  const d = dmDate; if (!d) return;
  /* 답은 지우고 이유 칸을 펼친다 — ✕ 처럼 이유 없이 닫아도 저장된다. 적어 둔 이유는 그대로 둔다 */
  hoursFor(d).forEach(h => sel.delete(key(d,h))); noneSel.delete(d); maybeSel.delete(d);
  dmPart = false; dmNOpen = true; renderDm(); paintSheet(); touch();
};
/* ⚠️ 한글 조합 중 Enter 는 건너뛴다 (마지막 글자가 잘리는 걸 막는다) */
$("#dmInput").addEventListener("keydown", e => { if (e.key === "Enter" && !e.isComposing){ e.preventDefault(); $("#dmSave").click(); } });
/* 저장 = 닫기. 닫을 때 이유를 옮기고 저장한다 (closeDay) */
$("#dmSave").onclick = () => closeDay();
$("#hsL").onclick = () => hsGo(-1);
$("#hsR").onclick = () => hsGo(1);
$("#tabView").addEventListener("scroll", hsUpdate, { passive: true });
window.addEventListener("resize", hsUpdate);
$("#dmDrop").onclick = () => {
  const d = dmDate; if (!d) return;
  if (!confirm(fmtFull(d) + " 을 후보에서 뺍니다. 계속할까요?")) return;
  const list = dates().filter(x => x !== d);
  act({ action:"meet_set", dates: list.join(",") }, fmtFull(d) + " 뺐습니다", () => { ST.dates = list.slice(); });
  closeDay();
};

$("#cal").addEventListener("click", e => {
  const b = e.target.closest(".cal .d");
  if (!b || !b.dataset.d || b.disabled) return;
  toggleDate(b.dataset.d);
});
$("#calPrev").onclick = () => { calM--; if (calM < 0){ calM = 11; calY--; } renderCal(); };
$("#calNext").onclick = () => { calM++; if (calM > 11){ calM = 0; calY++; } renderCal(); };
$("#calToday").onclick = () => { const o = new Date(); calY = o.getFullYear(); calM = o.getMonth(); renderCal(); };
$$("#dowRow button").forEach(b => b.onclick = () => toggleDow(+b.dataset.dow));
$("#calClear").onclick = () => {
  if (!dsel.size) return;
  if (!confirm("고른 날짜를 전부 지웁니다. 계속할까요?")) return;
  dsel.clear(); renderCal(); dateChanged();
};
const hourApply = () => {
  if (!M) return;                       // 아직 안 만든 약속 — 폼의 시간대를 쓴다
  const a = hourVal($("#c_hs")), b = hourVal($("#c_he"));
  if (b <= a){ setStatus("끝 시간이 시작보다 늦어야 해요", "err"); return; }
  act({ action:"meet_set", hourStart:a, hourEnd:b }, "기본 시간대 " + a + "–" + b + "시",
      () => { ST.hourStart = a; ST.hourEnd = b; });
};
bindRange($("#c_hs"), $("#c_he"), hourApply);                      // 시작·끝을 한 번에 (범위)

/* ═══ 친구 추가 — 내 이름(프로필)은 절대 안 바뀐다
   (2026-09-22j Benny: "친구 추가가 쉽지않네 여기선 (자꾸 프로필 바뀜) 프로필 변경 없이 쉽게 추가로")
   전에는 '누구세요 → ＋ 새 이름 → 시작' 이 유일한 길이었는데, 그건 pickMe() 라서
   넣는 순간 me 가 그 사람으로 바뀌어 버렸다. 여기서는 member_add 만 보낸다.        */
let fmNew = [];
function renderFm(){
  const mem = members();
  $("#fmHint").textContent = "이름만 넣으면 표에 줄이 생깁니다. 내 이름(" + (me || "—") + ")은 그대로예요.";
  const box = $("#fmChips"); box.innerHTML = "";
  if (!mem.length){
    box.innerHTML = '<span class="hint" style="margin:0">아직 아무도 없어요.</span>';
    return;
  }
  mem.forEach(n => {
    const b = document.createElement("span");
    b.className = "chip";
    b.textContent = n + (n === me ? " (나)" : "");
    if (fmNew.includes(n)) b.setAttribute("aria-pressed", "true");
    box.appendChild(b);
  });
}
function addFriend(){
  const v = $("#fmInput").value.trim();
  if (!v) return;
  $("#fmInput").value = "";
  if (members().includes(v)){ setStatus(v + " 님은 이미 있어요", "err"); $("#fmInput").focus(); return; }
  if (members().length >= 40){ setStatus("40명까지예요", "err"); return; }
  fmNew.push(v);
  act({ action:"member_add", name:v }, v + " 님 추가됨", () => {
    if (!ST.members.includes(v)) ST.members.push(v);
  });
  renderFm();
  $("#fmInput").focus();
}
$("#fmAdd").onclick = addFriend;
/* ⚠️ 한글 조합 중 keydown 의 key 는 'Process'/keyCode 229 다 → keyup 도 같이 본다 */
["keydown","keyup"].forEach(ev =>
  $("#fmInput").addEventListener(ev, e => {
    if (e.key === "Enter" || e.keyCode === 13){ e.preventDefault(); addFriend(); }
  }));
$("#fmInput").addEventListener("input", () => {
  const v = $("#fmInput").value;
  if (!/[,\n]/.test(v)) return;
  v.split(/[,\n]/).forEach(x => { $("#fmInput").value = x; addFriend(); });
  $("#fmInput").value = "";
});
function openFriend(){
  openModal("friendModal");
  setTimeout(() => { try { $("#fmInput").focus(); } catch(e){} }, 120);
}
$("#whoFriend").onclick  = openFriend;
$("#whoFriend2").onclick = openFriend;

window.addEventListener("beforeunload", e => { if (dirty){ e.preventDefault(); e.returnValue = ""; } });
/* 폰에서 한참 뒤에 두었다 돌아오면 실시간 연결이 끊겨 있을 수 있다 → 끊겼을 때만 다시 붙는다 */
document.addEventListener("visibilitychange", () => {
  if (document.visibilityState === "visible" && M && live.error) load(true);
});
