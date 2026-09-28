/* benny-apps 공용 바탕 — Firebase 연결 · 날짜 도구 · 창(모달) · 시각 고르기 · 알림 · 앱 안 브라우저 안내
   약속 잡자(/when/) 와 밴드매니저(/band-manager/) 가 같이 불러 쓴다 (2026-09-28).
   불러오는 순서: firebase-*-compat.js → core.js → sched.js → 페이지 자기 스크립트 */

/* 모든 페이지에 똑같이 붙는 것 — 시각 고르기 창 + 아래 알림 */
const CORE_HTML = `<!-- ══════════ 시간 고르기 (작은 창) ══════════
     네이티브 select 은 0~24 를 한 줄씩 보여줘서 화면을 다 덮는다 (2026-09-22i Benny) -->
<div class="modal" id="hourModal" hidden>
  <div class="sheet hpick" role="dialog" aria-modal="true">
    <div class="spread" style="margin-bottom:10px">
      <h2 style="margin:0" id="hpTitle">시각</h2>
      <button class="iconbtn" type="button" data-close aria-label="닫기">✕</button>
    </div>
    <div class="hgrid" id="hpGrid"></div>
    <p class="hint" style="margin:10px 0 0">바깥을 누르면 그대로 닫힙니다.</p>
  </div>
</div>
<div class="statusbar" id="statusbar">
  <span id="status"></span>
  <button class="btn primary" id="saveBtn" type="button" hidden>저장</button>
</div>`;
document.body.insertAdjacentHTML("beforeend", CORE_HTML);

/* 저장소 = Firebase `benny-apps` 의 Firestore (2026-09-28, Apps Script + 시트에서 이사)
   · meets/{id}              약속 한 건 (제목·날짜·시간대·후보·확정)
   · meets/{id}/people/{pid} 사람마다 문서 하나 — 각자 자기 문서만 고치니 남의 응답을 덮어쓸 일이 없다
   · meets/{id}/log/{auto}   📼 저장 기록 (붙이기만, 읽기 불가)
   규칙: secretary/benny-apps/firestore.rules
   ⚠️ apiKey 는 비밀이 아니다(웹앱 식별용). 막는 건 규칙이 한다. */
const FB_CONFIG = {
  apiKey: "AIzaSyAozzAoVfMmUHCvQQ169fzoYjM_rH1s8K8",
  authDomain: "benny-apps.firebaseapp.com",
  projectId: "benny-apps",
  storageBucket: "benny-apps.firebasestorage.app",
  messagingSenderId: "495476517157",
  appId: "1:495476517157:web:36524752d12d47b8b952cc"
};

/* ═══ 공통 ═══ */
const $  = s => document.querySelector(s);
const $$ = s => Array.from(document.querySelectorAll(s));
const DOW = ["일","월","화","수","목","금","토"];

function iso(o){ return o.getFullYear() + "-" + String(o.getMonth()+1).padStart(2,"0") + "-" + String(o.getDate()).padStart(2,"0"); }
function dObj(d){ const [y,m,dd] = String(d).split("-").map(Number); return new Date(y, m-1, dd); }
function fmtD(d){ const o = dObj(d); return (o.getMonth()+1) + "/" + o.getDate(); }
function fmtDow(d){ return DOW[dObj(d).getDay()]; }
function fmtFull(d){ return fmtD(d) + "(" + fmtDow(d) + ")"; }
function hh(h){ return String(h).padStart(2,"0") + ":00"; }
function key(d,h){ return d + "|" + h; }
function todayIso(){ return iso(new Date()); }
function nowStamp(){ const o = new Date(); return iso(o) + "T" + String(o.getHours()).padStart(2,"0") + ":" + String(o.getMinutes()).padStart(2,"0") + ":00"; }
/** "2026-09-21T14:32:05" → "9/21 14:32" */
function fmtEdit(v){
  const m = /^(\d{4})-(\d{2})-(\d{2})[T ](\d{2}):(\d{2})/.exec(String(v || ""));
  if (!m) return "";
  return (+m[1] === new Date().getFullYear() ? "" : m[1] + ".") + (+m[2]) + "/" + (+m[3]) + " " + m[4] + ":" + m[5];
}
function runsOf(list, compact){
  const f = compact ? (h => String(h)) : hh;
  const a = list.slice().sort((x,y) => x - y), out = [];
  let st = null, prev = null;
  a.forEach(h => {
    if (st === null){ st = prev = h; return; }
    if (h === prev + 1){ prev = h; return; }
    out.push(f(st) + "–" + f(prev + 1)); st = prev = h;
  });
  if (st !== null) out.push(f(st) + "–" + f(prev + 1));
  return out.join(", ");
}
function cell(cls, text){ const el = document.createElement("div"); el.className = cls; if (text) el.textContent = text; return el; }
/* 아래 알림 — 잠깐 떴다 사라진다. **실패(err)만** 남는다
   (2026-09-28 Benny: "맨 밑에 저장됨/저장 버튼 뜨는 거 필수야?") → 저장 성공은 표가 바로 바뀌니 알리지 않는다 */
let stTimer = null;
function setStatus(msg, cls){
  const bar = $("#statusbar"), el = $("#status");
  clearTimeout(stTimer);
  el.textContent = msg || ""; el.className = "st" + (cls ? " " + cls : "");
  const failBtn = !$("#saveBtn").hidden;
  bar.classList.toggle("show", !!msg || failBtn);
  bar.classList.toggle("err", cls === "err" || failBtn);
  if (msg && cls !== "err" && !failBtn)
    stTimer = setTimeout(() => bar.classList.remove("show"), Math.min(5000, 1600 + String(msg).length * 70));
}


/* ═══ Firebase ═══ */
let lastMs = 0;
const FB_OK = !!(window.firebase && firebase.firestore);
let db = null, FV = null, FP = null, TS = null;
if (FB_OK){
  firebase.initializeApp(FB_CONFIG);
  db = firebase.firestore();
  /* ⚠️ enablePersistence 는 쓰지 않는다 (2026-09-28 시험에서 확인)
     여러 탭 모드에선 모든 요청이 '주 탭' 을 거치는데, 그 탭이 뒤로 가서 멈추면 다른 탭의 get() 이 영영 안 끝났다.
     카톡 인앱 브라우저의 IndexedDB 도 믿을 게 못 된다. 첫 화면은 localStorage 스냅샷(snapLoad)이 먼저 그린다. */
  FV = firebase.firestore.FieldValue; FP = firebase.firestore.FieldPath; TS = firebase.firestore.Timestamp;
}

function fail(msg){ return new Error(msg); }
function errText(e){
  const c = (e && e.code) || "";
  if (/permission-denied/.test(c)) return "저장이 거부됐어요 (값이 너무 길거나 형식이 달라요)";
  if (/unavailable|deadline/.test(c)) return "네트워크 오류";
  return (e && e.message) || "오류";
}
function withTimeout(p, ms){
  let t; const to = new Promise((_, rej) => { t = setTimeout(() => rej(fail("응답이 없습니다")), ms); });
  return Promise.race([p, to]).finally(() => clearTimeout(t));
}

function clampHour(v, d){ const n = parseInt(v, 10); return (isNaN(n) || n < 0 || n > 24) ? d : n; }
function normDate(s){ s = String(s || "").trim(); return /^\d{4}-\d{2}-\d{2}$/.test(s) ? s : ""; }
function splitList(s){ return String(s || "").split(/[,\n]/).map(x => x.trim()).filter(Boolean); }
function cleanDates(raw){
  const src = Array.isArray(raw) ? raw : splitList(raw);
  return Array.from(new Set(src.map(normDate).filter(Boolean))).sort().slice(0, 200);
}
function parseWindows(raw){
  let o; try { o = typeof raw === "string" ? JSON.parse(raw || "{}") : (raw || {}); } catch(e){ return {}; }
  const out = {}; let n = 0;
  if (!o || typeof o !== "object") return out;
  for (const k in o){
    const d = normDate(k), w = o[k]; if (!d || !w || w.length !== 2) continue;
    const a = clampHour(w[0], -1), b = clampHour(w[1], -1);
    if (a < 0 || b < 0 || b <= a) continue;
    out[d] = [a, b]; if (++n >= 120) break;
  }
  return out;
}
function parsePicks(raw){
  let list = [];
  if (Array.isArray(raw)) list = raw;
  else { const t = String(raw || "").trim(); if (t.charAt(0) === "["){ try { list = JSON.parse(t); } catch(e){} } if (!list.length && t) list = t.split(/[\n,]/); }
  const out = [];
  list.forEach(v => {
    v = String(v == null ? "" : v).trim();
    const m = /^(\d{4}-\d{2}-\d{2}) (\d{2}):00~(\d{2}):00$/.exec(v);
    if (!m || !normDate(m[1]) || out.includes(v) || out.length >= 20) return;
    const a = +m[2], b = +m[3];
    if (a < 0 || b > 24 || b <= a) return;
    out.push(v);
  });
  return out.sort();
}
function cleanHours(arr){
  return Array.from(new Set((arr || []).map(x => parseInt(x, 10)).filter(h => h >= 0 && h <= 23))).sort((a, b) => a - b);
}
function pad2(n){ return String(n).padStart(2, "0"); }
/** Timestamp → "2026-09-28T14:03:05" (화면이 쓰던 옛 모양 그대로) */
function stampOf(ts){
  if (!ts || !ts.toDate) return "";
  const o = ts.toDate();
  return iso(o) + "T" + pad2(o.getHours()) + ":" + pad2(o.getMinutes()) + ":" + pad2(o.getSeconds());
}

/* ── 지켜보기 ── */

/* ═══ 모달 ═══ */
/* 창이 열릴 때 history 를 한 칸 밀어 넣는다 (2026-09-22d Benny: "뒤로가기 하면 자꾸 팝업이 꺼진다")
   → 안드로이드 뒤로가기가 **페이지를 떠나지 않고** 창만 닫는다. 보던 약속이 날아가지 않는다. */
let modalNav = 0;
function pushModalState(id){
  try { history.pushState({ meetModal: id }, ""); modalNav++; } catch(e){}
}
/** ✕ 나 ESC 로 닫았을 때 — 우리가 밀어 넣은 칸을 되감는다 */
function popModalState(){
  if (modalNav > 0){ modalNav--; ignorePop++; try { history.back(); } catch(e){ ignorePop--; } }
}
/* ⚠️ 위의 history.back() 도 popstate 를 부른다. 그걸 '사용자 뒤로가기' 로 읽으면
   창이 겹쳐 있을 때(달력 위 시각 고르기) **아래 창까지** 닫혔다 → 우리가 되감은 건 한 번 무시한다 (2026-09-28) */
let ignorePop = 0;
/* 창마다 열 때·닫을 때 할 일은 그 창을 가진 쪽(sched.js / 페이지)이 등록한다
   MODAL_OPEN[id]()  — 열기 직전에 내용 그리기
   MODAL_CLOSE[id](fromBack) — 닫기를 통째로 맡는다 (그 날 창처럼 닫으면서 저장해야 할 때)
   MODAL_AFTER[id]() — 닫힌 뒤 할 일 */
const MODAL_OPEN = {}, MODAL_CLOSE = {}, MODAL_AFTER = {};
let modalStack = [];          // 열린 순서 — 맨 끝이 제일 위 창
function anyModalOpen(){
  modalStack = modalStack.filter(id => { const el = $("#" + id); return el && !el.hidden; });
  return modalStack[modalStack.length - 1];
}
function openModal(id){
  if (MODAL_OPEN[id]) MODAL_OPEN[id]();
  $("#" + id).hidden = false;
  modalStack = modalStack.filter(x => x !== id).concat([id]);
  pushModalState(id);
}
function closeModal(id, fromBack){
  $("#" + id).hidden = true;
  modalStack = modalStack.filter(x => x !== id);
  if (!fromBack) popModalState();
  if (MODAL_AFTER[id]) MODAL_AFTER[id]();
}
/** ✕·ESC·배경·뒤로가기 — 창 주인이 따로 닫는 법을 등록했으면 그걸 쓴다 */
function closeAny(id, fromBack){
  if (MODAL_CLOSE[id]) MODAL_CLOSE[id](fromBack); else closeModal(id, fromBack);
}
/** 버튼에 시각을 넣는다 (select 대신) */
function setHourBtn(el, from, to, val){
  const v = Math.min(to, Math.max(from, val));
  el.dataset.h = String(v); el.dataset.from = String(from); el.dataset.to = String(to);
  el.textContent = v + "시";
}
function fillHourSel(el, from, to, val){ setHourBtn(el, from, to, +val); }
/** 작은 격자 창으로 시각을 고른다 */
let hpTarget = null, hpDone = null;
function openHourPick(el, title, onPick){
  hpTarget = el; hpDone = onPick || null;
  const from = +el.dataset.from, to = +el.dataset.to, cur = +el.dataset.h;
  $("#hpTitle").textContent = title || "시각";
  const g = $("#hpGrid"); g.innerHTML = "";
  for (let h = from; h <= to; h++){
    const b = document.createElement("button");
    b.type = "button"; b.textContent = String(h);
    b.setAttribute("aria-pressed", String(h === cur));
    b.setAttribute("aria-label", h + "시");
    b.onclick = () => {
      setHourBtn(hpTarget, from, to, h);
      const t = hpTarget, done = hpDone;
      closeModal("hourModal");
      if (done) done(h, t);
    };
    g.appendChild(b);
  }
  openModal("hourModal");
}
function hourVal(el){ return +el.dataset.h; }

/* ═══ 창 공통 동작 ═══ */
window.addEventListener("popstate", () => {
  if (ignorePop > 0){ ignorePop--; return; }
  /* 창이 떠 있으면 뒤로가기는 그 창만 닫는다 (페이지는 그대로) */
  const openId = anyModalOpen();
  if (openId){
    if (modalNav > 0) modalNav--;
    closeAny(openId, true);
    return;
  }
  if (typeof onNavPop === "function") onNavPop();   // 창이 없을 때의 뒤로가기는 페이지가 정한다
});
/* ✕ 버튼([data-close])과 배경(어두운 곳) — 나중에 붙는 창도 되게 한 곳에서 받는다
   (2026-09-22n Benny: "빈 화면 누르는데 팝업이 안나가져, 일부러 막은건가?")
   ⚠️ 창마다 핸들러를 하나 더 달면 두 번 닫혀 history.back 도 두 번 된다 — 여기 하나만 둔다 (2026-09-28) */
document.addEventListener("click", e => {
  const x = e.target.closest("[data-close]");
  if (x && x.closest(".modal")){ closeAny(x.closest(".modal").id); return; }
  if (e.target.classList && e.target.classList.contains("modal")) closeAny(e.target.id);
});
document.addEventListener("keydown", e => {
  if (e.key !== "Escape") return;
  const open = anyModalOpen();
  if (open) closeAny(open);
});
/* 창이 열려 있으면 뒤 페이지가 같이 스크롤되지 않게 */
(function(){
  const sync = () => document.documentElement.classList.toggle("scrlock", $$(".modal").some(p => !p.hidden));
  new MutationObserver(sync).observe(document.body, { subtree:true, childList:true, attributes:true, attributeFilter:["hidden"] });
  sync();
})();
/* 알림을 누르면 닫힌다 (실패 후 다시 저장 버튼이 떠 있을 땐 그대로) */
$("#statusbar").addEventListener("click", e => { if (!e.target.closest("button") && $("#saveBtn").hidden) $("#statusbar").classList.remove("show"); });

/* ═══ 앱 안 브라우저 (카톡·인스타·네이버 …) ═══
   카톡 브라우저는 캐시·localStorage 를 거의 안 남겨서 열 때마다 서버를 처음부터 기다린다.
   (2026-09-22p Benny: "카카오 브라우저로 들어가니까 로딩이 너무 길어서")
   → 기본 브라우저(크롬/사파리)로 넘기는 버튼을 맨 위에 띄운다. 자동으로 튕기지는 않는다. */
function inAppName(){
  const u = navigator.userAgent || "";
  if (/KAKAOTALK/i.test(u))               return "카카오톡";
  if (/NAVER\(inapp/i.test(u))            return "네이버 앱";
  if (/Instagram/i.test(u))               return "인스타그램";
  if (/\bLine\//i.test(u))                return "라인";
  if (/FBAN|FBAV/i.test(u))               return "페이스북";
  if (/DaumApps|KAKAOSTORY/i.test(u))     return "다음/카카오스토리";
  return "";
}
/** 밖으로 나가는 주소. 통로가 없으면 "" (그때는 주소를 복사해 준다) */
function outsideUrl(){
  const u = location.href, ua = navigator.userAgent || "";
  if (/KAKAOTALK/i.test(ua))            // 카톡이 주는 공식 통로
    return "kakaotalk://web/openExternal?url=" + encodeURIComponent(u);
  if (/Android/i.test(ua))              // 안드로이드는 intent: 로 기본 브라우저를 부른다
    return "intent://" + u.replace(/^https?:\/\//, "") +
           "#Intent;scheme=https;action=android.intent.action.VIEW;end";
  return "";                            // 아이폰의 다른 앱 브라우저는 통로가 없다
}
function openOutside(){
  const t = outsideUrl();
  if (t){ location.href = t; return; }
  const u = location.href;
  try { navigator.clipboard.writeText(u); setStatus("주소를 복사했어요 — 사파리에 붙여넣기 해주세요", "ok"); }
  catch(e){ prompt("이 주소를 사파리에 붙여넣어 주세요", u); }
}
(function initIab(){
  const who = inAppName();
  if (!who || !$("#iabBar")) return;           // 안내 막대를 둔 페이지에서만
  let skip = ""; try { skip = sessionStorage.getItem("meet_iab_skip") || ""; } catch(e){}
  if (skip) return;
  $("#iabWho").textContent = who + " 안에서 열렸어요";
  $("#iabBar").hidden = false;
  $("#iabOpen").onclick = openOutside;
  $("#iabSkip").onclick = () => {
    $("#iabBar").hidden = true;
    try { sessionStorage.setItem("meet_iab_skip", "1"); } catch(e){}
  };
})();
