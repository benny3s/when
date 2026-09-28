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
      <button class="segb" id="segCal" type="button" role="tab">📅 달력</button>
      <button class="segb" id="segTab" type="button" role="tab">📋 표</button>
    </div>
    <p class="hint" id="sheetHint" style="margin:0 0 10px"></p>
    <div id="calView" hidden>
      <div class="calnav"><b id="cvLabel"></b></div>
      <div class="cal cv" id="cvGrid"></div>
    </div>
    <div class="grid-wrap" id="tabView"><table class="sheet" id="sheet"></table></div>
  </div>`,
  modals: `<!-- ══════════ 그 날 창 ══════════ -->
<div class="modal" id="dayModal" hidden>
  <div class="sheet" role="dialog" aria-modal="true">
    <div class="spread">
      <h2 style="margin:0" id="dmTitle"></h2>
      <span class="row tight" style="flex:0 0 auto">
        <button class="iconbtn" id="dmSetBtn" type="button" title="이 날 시간대 바꾸기" aria-label="이 날 설정">⚙</button>
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
      <button class="dm-clear" id="dmClear" type="button" hidden>미정으로 되돌리기</button>
    </div>
    <div class="dm-set" id="dmSet" hidden>
      <div class="dm-admin">
        <span class="hint" style="margin:0">이 날 시간</span>
        <span id="dmWin"></span>
        <span style="flex:1"></span>
        <button class="btn ghost danger" id="dmDrop" type="button">후보에서 빼기</button>
      </div>
      <div class="dm-hap" id="dmFixRow">
        <span id="dmFixNow"></span>
        <button class="btn" id="dmFix" type="button">📌 이 날로 정하기</button>
      </div>
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
               fixed: m.fixed || "", owner: m.owner || "", made: m.made || "" };
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
    out.members.push(n); out.pid[n] = p._id;
    const H = {}, N = {};
    for (const d in (p.hours || {})) if (Array.isArray(p.hours[d])) H[d] = cleanHours(p.hours[d]);
    for (const d in (p.notes || {})) if (p.notes[d]) N[d] = String(p.notes[d]);
    if (Object.keys(H).length) out.hours[n] = H;
    if (Object.keys(N).length) out.notes[n] = N;
    const e = stampOf(p.edited); if (e) out.edited[n] = e;
  });
  return out;
}
function pidOf(n){ return buildST().pid[n] || ""; }
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
    if (p.hourStart !== undefined || p.hourEnd !== undefined){
      const hs = clampHour(p.hourStart !== undefined ? p.hourStart : cur.hourStart, 10);
      const he = clampHour(p.hourEnd   !== undefined ? p.hourEnd   : cur.hourEnd, 22);
      if (he <= hs) throw fail("끝 시간이 시작보다 늦어야 해요");
      up.hourStart = hs; up.hourEnd = he;
    }
    if (p.dates   !== undefined) up.dates   = cleanDates(p.dates);
    if (p.windows !== undefined) up.windows = parseWindows(p.windows);
    if (p.picks   !== undefined) up.picks   = parsePicks(p.picks);
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
function snapKey(){ return "meet_snap:" + M; }
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
  sel = new Set(); noteDraft = {}; noneSel = new Set();
  if (!me) return;
  const H = hoursOf()[me] || {}, N = notesOf()[me] || {};
  dates().forEach(d => {
    const v = H[d];
    if (Array.isArray(v)){ v.length ? v.forEach(h => sel.add(key(d,h))) : noneSel.add(d); }
    if (N[d]) noteDraft[d] = N[d];
  });
  dirty = false;
}
function myHours(d){ return hoursFor(d).filter(h => sel.has(key(d,h))); }
function myAnswered(d){ return myHours(d).length > 0 || noneSel.has(d); }
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
  if (me && !members().includes(me)) members().push(me);   // 아직 서버에 안 닿은 내 이름은 유지
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
    if (!dirty && !saving && me && !members().includes(me)){ me = ""; saveMe(""); }
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

  const mem = members();
  const box = $("#whoChips"); box.innerHTML = "";
  mem.forEach(n => {
    const b = document.createElement("button");
    b.className = "chip";
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
function meKey(){ return "meet_me:" + M; }
function saveMe(n){ try { n ? localStorage.setItem(meKey(), n) : localStorage.removeItem(meKey()); } catch(e){} }
function restoreMe(){
  if (me || !M) return;
  let n = ""; try { n = localStorage.getItem(meKey()) || ""; } catch(e){}
  if (n && members().includes(n)){ me = n; whoOpen = false; }
}
function pickMe(n){
  n = String(n || "").trim();
  if (!n) return;
  me = n; whoOpen = false; whoAdd = false;
  try { localStorage.setItem("meet_lastname", n); } catch(e){}
  saveMe(n);
  $("#whoInput").value = "";
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
function loadView(){ try { sheetView = localStorage.getItem("meet_view") || "tab"; } catch(e){ sheetView = "tab"; } }
function setView(v){
  sheetView = (v === "cal") ? "cal" : "tab";
  try { localStorage.setItem("meet_view", sheetView); } catch(e){}
  renderSheetArea();
}
function renderSheetArea(){
  const cal = sheetView === "cal";
  $("#segCal").setAttribute("aria-selected", String(cal));
  $("#segTab").setAttribute("aria-selected", String(!cal));
  $("#calView").hidden = !cal;
  $("#tabView").hidden = cal;
  if (cal) renderCalView();
}
/* 달력은 **한 장** — 후보 날짜가 있는 주만 이어 붙인다. 달 넘기기(‹ ›)는 없다
   (2026-09-28 Benny: "1개 월만 보여서 2개 월로 선택지가 되면 보기 힘들 것 같기도, 심플하면서 좋은 방법")
   · 달이 바뀌는 첫 칸은 숫자를 '11/1' 처럼 쓴다
   · 후보가 없는 주는 건너뛰고 '⋯' 한 줄로 표시 */
function cvReset(){}
function renderCalView(){
  const ds = dates(), g = $("#cvGrid"); g.innerHTML = "";
  const months = Array.from(new Set(ds.map(d => +d.slice(5, 7))));
  $("#cvLabel").textContent = months.length ? months[0] + "월" + (months.length > 1 ? " – " + months[months.length - 1] + "월" : "") : "";
  DOW.forEach((w, i) => {
    const h = document.createElement("div");
    h.className = "dowh" + (i === 0 ? " sun" : "");
    h.textContent = w; g.appendChild(h);
  });
  if (!ds.length) return;
  const set = new Set(ds), today = todayIso();
  const weekOf = d => { const o = dObj(d); o.setDate(o.getDate() - o.getDay()); return iso(o); };
  const weeks = Array.from(new Set(ds.map(weekOf))).sort();
  let prev = null, lastMon = -1;
  weeks.forEach(ws => {
    if (prev){
      const p = dObj(prev); p.setDate(p.getDate() + 7);
      if (iso(p) !== ws){ const gap = document.createElement("div"); gap.className = "cvgap"; gap.textContent = "⋯"; g.appendChild(gap); }
    }
    prev = ws;
    for (let i = 0; i < 7; i++){
      const o = dObj(ws); o.setDate(o.getDate() + i);
      const d = iso(o), cand = set.has(d);
      const b = document.createElement("button"); b.type = "button"; b.dataset.d = d;
      b.innerHTML = '<span class="n"></span><span class="mk"></span><span class="tx"></span>';
      const newMon = o.getMonth() !== lastMon;
      lastMon = o.getMonth();
      const nEl = b.querySelector(".n");
      nEl.textContent = newMon ? (o.getMonth() + 1) + "/" + o.getDate() : String(o.getDate());
      if (newMon) nEl.classList.add("mon");
      if (!cand){ b.className = "d off"; b.disabled = true; g.appendChild(b); continue; }
      const m = me ? markOf(d, myHours(d), myAnswered(d), true) : { cls:"none", mk:"–", tx:"", lb:"" };
      b.className = "d cand s-" + m.cls + (d === today ? " today" : "") + (isFixedDay(d) ? " fixday" : "");
      b.querySelector(".mk").textContent = m.mk;
      b.querySelector(".tx").textContent = "";                      // 달력은 기호만 — 글자는 표에서
      b.title = fmtFull(d) + " · " + (m.lb || winLabel(d));
      b.onclick = () => { if (!me){ askName(); return; } openDay(d, "edit"); };
      g.appendChild(b);
    }
  });
}

/** 표와 달력을 **같이** 다시 그린다.
    ⚠️ `drawSheet()` 만 부르면 달력 보기에서는 화면이 그대로다
    (2026-09-22o Benny: "가능으로 입력했는데 화면이 안바뀌어") */
function paintSheet(){ drawSheet(); renderSheetArea(); }

/* ── 표: 줄 = 사람, 칸 = 날짜 ── */
function drawSheet(){
  const t = $("#sheet"); t.innerHTML = "";
  const ds = dates(), H = hoursOf(), N = notesOf(), ED = editedOf();
  if (!ds.length) return;
  /* 안내 = "내가 아직 안 넣은 날" 을 그대로 읽어준다
     (2026-09-22k Benny: "넣은 것과 넣어야할 것이 구분이 잘 안되어서") */
  const hint = $("#sheetHint");
  hint.className = "callout";
  hint.innerHTML = "";
  if (!me){
    hint.append(document.createTextNode("먼저 위에서 "));
    const b0 = document.createElement("b"); b0.textContent = "이름";
    hint.append(b0, document.createTextNode("을 고르면 내 줄이 생깁니다."));
  } else {
    const todo = ds.filter(d => !myAnswered(d));
    if (!todo.length){
      hint.classList.add("done");
      const b1 = document.createElement("b"); b1.textContent = ds.length + "일 전부 입력했어요";
      hint.append(b1, document.createTextNode(" 👍  칸을 다시 눌러 언제든 고칠 수 있습니다."));
    } else {
      const b1 = document.createElement("b");
      b1.textContent = todo.length + "일 더 남았어요";
      hint.append(b1, document.createTextNode(" — 연두색 점선 칸("));
      const b2 = document.createElement("b");
      b2.textContent = todo.slice(0, 4).map(fmtD).join(", ") + (todo.length > 4 ? " …" : "");
      hint.append(b2, document.createTextNode(")을 눌러 입력해주세요."));
    }
    /* 기호 설명 줄은 뺐다 — ○△✕ 는 보면 안다 (2026-09-28 Benny) */
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
  ds.forEach(d => {
    const th = document.createElement("th");
    const fixed = isFixedDay(d);
    th.className = "dhead" + (dObj(d).getDay() === 0 ? " sun" : "") + (fixed ? " hasFix" : "");
    /* 두 줄로 — '10/5 월' / '18–22' ('시' 는 뺀다). 정한 날은 날짜 앞에 📌 (2026-09-28 Benny: "세 줄이라 정신없어") */
    th.innerHTML = '<span class="dl"><span class="dd"></span> <span class="dw"></span></span><span class="dow win"></span>';
    th.querySelector(".dd").textContent = (fixed ? "📌" : "") + fmtD(d);
    th.querySelector(".dw").textContent = fmtDow(d);
    th.querySelector(".win").textContent = winOf(d).join("–");
    th.title = "눌러서 이 날 시간대 바꾸기 · 후보에서 빼기";
    th.onclick = () => openDay(d, "set");
    hr.appendChild(th);
  });
  const addD = document.createElement("th"); addD.className = "addcol";
  const addDb = document.createElement("button"); addDb.type = "button";
  addDb.textContent = "＋ 날짜"; addDb.onclick = () => openModal("calModal");
  addD.appendChild(addDb); hr.appendChild(addD);
  thead.appendChild(hr); t.appendChild(thead);

  const tb = document.createElement("tbody");
  const order = me ? [me].concat(members().filter(n => n !== me)) : members().slice();
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

    ds.forEach(d => {
      const td = document.createElement("td");
      const b  = document.createElement("button"); b.type = "button";
      const hrs  = mine ? myHours(d) : (H[n] || {})[d];
      const ans  = mine ? myAnswered(d) : Array.isArray(hrs);
      const memo = mine ? (noteDraft[d] || "") : ((N[n] || {})[d] || "");
      const mk = markOf(d, hrs, ans, mine);
      const sp = document.createElement("span");
      sp.className = "hr " + mk.cls;
      sp.innerHTML = '<span class="mk"></span><span class="tx"></span>';
      sp.querySelector(".mk").textContent = mk.mk;
      sp.querySelector(".tx").textContent = mk.tx;
      if (mine && !ans) td.className = "todo";      // 아직 안 넣은 내 칸
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
  ds.forEach(d => {
    const td = document.createElement("td"); td.className = "cnt";
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
function isFixedDay(d){ return fixes().some(f => f.indexOf(d) === 0); }
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
/** 내 이 날 답 — "o" 다 돼요 / "t" 일부만 / "x" 안 돼요 / "" 미정 */
function dmMark(d){
  if (noneSel.has(d)) return "x";
  const on = myHours(d);
  if (!on.length) return "";
  return on.length >= hoursFor(d).length ? "o" : "t";
}
function renderDm(){
  const d = dmDate; if (!d) return;
  const setMode = dmMode === "set";
  $("#dmNoName").hidden = setMode || !!me;
  $("#dmMine").hidden   = setMode || !me;
  $("#dmSet").hidden    = !(setMode || dmSetOpen);
  $("#dmSet").classList.toggle("solo", setMode);
  $("#dmSum").textContent = setMode ? "이 날의 시간대 · 확정 · 후보에서 빼기" : (me ? me + " 님, 이 날 되세요?" : "");
  if (setMode || !me) return;
  const mk = dmMark(d), show = dmPart ? "t" : mk;
  $("#dmO").setAttribute("aria-pressed", String(show === "o"));
  $("#dmT").setAttribute("aria-pressed", String(show === "t"));
  $("#dmX").setAttribute("aria-pressed", String(show === "x"));
  $("#dmMore").hidden     = !(show === "t" || show === "x");
  $("#dmHoursBox").hidden = show !== "t";
  $("#dmInput").placeholder = show === "x" ? "이유 (선택) — 예: 출장이에요" : "이유 (선택) — 예: 21시 넘어야 도착해요";
  $("#dmClear").hidden = !mk;
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
      renderDmHours(); paintSheet(); touch();
    };
    box.appendChild(b);
  });
  const on = myHours(d);
  const st = $("#dmState");
  if (!dmMulti && dmFrom !== null) st.textContent = dmFrom + "시부터 — 끝 시간을 눌러주세요";
  else if (on.length)              st.textContent = runsOf(on) + " 가능";
  else                             st.textContent = dmMulti ? "되는 시간을 하나씩 눌러주세요" : "시작 시간을 눌러주세요";
  st.classList.toggle("ok", on.length > 0 && !(dmFrom !== null && !dmMulti));
  $("#dmMulti").textContent = dmMulti ? "↩ 한 구간으로 넣기" : "＋ 여러 구간 넣기";
}
function openDay(d, mode){
  dmDate = d;
  dmMode = (mode === "set") ? "set" : "edit";
  dmSetOpen = false;
  dmPart = dmMark(d) === "t";                    // 이미 △ 면 시간 버튼을 펼쳐서 연다
  dmFrom = null;
  dmMulti = runsOf(myHours(d)).indexOf(",") >= 0; // 이미 여러 구간이면 그 방식으로 연다
  $("#dmTitle").textContent = fmtFull(d) + " · " + winLabel(d);
  $("#dmInput").value = noteDraft[d] || "";
  renderDmAdmin(d);
  const fx = isFixedDay(d);
  $("#dmFixNow").textContent = fx ? "📌 " + fmtFixed(fixes().filter(f => f.indexOf(d) === 0).join(", ")) : "";
  $("#dmFix").textContent = fx ? "정한 거 취소" : "📌 이 날로 정하기";
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
  s1.onclick = () => openHourPick(s1, "시작 시각", apply);
  s2.onclick = () => openHourPick(s2, "끝 시각",  apply);
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
    payload.hours[d] = hs.length ? hs : (noneSel.has(d) ? [] : null);
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
function setFixes(list, msg){
  const v = Array.from(new Set(list)).sort().join(", ");
  act({ action:"meet_set", fixed: v }, msg, () => { if (ST.meet) ST.meet.fixed = v; });
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
    const tt = document.createElement("b"); tt.textContent = (on ? "📌 " : "") + fmtPick(t);
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
  if (!M){ renderNewDates(); return; }       // 아직 안 만든 약속 — 폼에만 담아둔다 (2026-09-22f)
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
$("#dmSetBtn").onclick = () => {
  if (dmMode === "set") return;
  dmSetOpen = !dmSetOpen; renderDm();
  if (dmSetOpen) $("#dmSet").scrollIntoView({ behavior:"smooth", block:"nearest" });
};
/** 이름 없이 입력하려 할 때 — 창을 닫고 '누구세요' 를 펼친다 */
function askName(){
  closeDay(); whoOpen = true; whoAdd = false; renderWho();
  $("#whoCard").scrollIntoView({ behavior:"smooth", block:"center" });
  setTimeout(() => { if (!$("#whoAddRow").hidden) $("#whoInput").focus(); }, 300);
}
$("#dmName").onclick = askName;
/* ○ — 한 번 누르면 끝: 시간 전부 + 이유 지우고 저장·닫기 */
$("#dmO").onclick = () => {
  const d = dmDate; if (!d) return;
  hoursFor(d).forEach(h => sel.add(key(d,h))); noneSel.delete(d);
  delete noteDraft[d]; $("#dmInput").value = "";
  dmPart = false; renderDm(); paintSheet(); touch();
  closeDay();
};
/* △ — 시간 버튼 + 이유를 펼친다. 버튼을 누르기 전까지 원래 답은 그대로 둔다(닫아도 안 날아가게) */
$("#dmT").onclick = () => { if (!dmDate) return; dmPart = true; dmFrom = null; renderDm(); };
$("#dmMulti").onclick = () => { dmMulti = !dmMulti; dmFrom = null; renderDmHours(); };
/* ✕ — 바로 '안 돼요' 로 찍는다. 이유 없이 닫아도 저장된다 */
$("#dmX").onclick = () => {
  const d = dmDate; if (!d) return;
  hoursFor(d).forEach(h => sel.delete(key(d,h))); noneSel.add(d);
  dmPart = false; renderDm(); paintSheet(); touch();
  /* 키보드는 띄우지 않는다 — 이유는 적고 싶을 때만 칸을 누른다 (2026-09-28 Benny: "자동 키보드 불편해") */
};
$("#dmClear").onclick = () => {
  const d = dmDate; if (!d) return;
  hoursFor(d).forEach(h => sel.delete(key(d,h))); noneSel.delete(d);
  delete noteDraft[d]; $("#dmInput").value = "";
  dmPart = false; paintSheet(); touch();
  closeDay();
};
/* ⚠️ 한글 조합 중 Enter 는 건너뛴다 (마지막 글자가 잘리는 걸 막는다) */
$("#dmInput").addEventListener("keydown", e => { if (e.key === "Enter" && !e.isComposing){ e.preventDefault(); $("#dmSave").click(); } });
/* 저장 = 닫기. 닫을 때 이유를 옮기고 저장한다 (closeDay) */
$("#dmSave").onclick = () => closeDay();
$("#dmFix").onclick = () => {
  const d = dmDate; if (!d) return;
  /* 여러 개 정할 수 있으니 **이 날 것만** 넣고 뺀다 */
  const rest = fixes().filter(f => f.indexOf(d) !== 0);
  if (isFixedDay(d)){ setFixes(rest, fmtFull(d) + " 정한 거 취소됨"); closeDay(); return; }
  const [a, b] = winOf(d);
  const txt = pickTxt(d, a, b);
  setFixes(rest.concat([txt]), "📌 " + fmtPick(txt) + " 로 정했습니다"); closeDay();
};
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
$("#c_hs").onclick = () => openHourPick($("#c_hs"), "시작 시각", hourApply);
$("#c_he").onclick = () => openHourPick($("#c_he"), "끝 시각",  hourApply);

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
