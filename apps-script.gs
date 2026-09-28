/**
 * 약속 잡자 (meet) — Google Apps Script 웹앱 (v10) — ⚠️ 2026-09-28 부터 안 씀. Firestore(benny-apps)로 이사했다
 *
 * benny3s.github.io/meet/ (지금은 /when/) 의 옛 저장소. 밴드매니저의 '캘린더'만 떼어내 만들었습니다.
 * 약속 하나 = 링크 하나(`?m=<약속id>`). **목록은 절대 내려주지 않습니다** — 링크를 아는 사람만 봅니다.
 *
 * 탭 6개 (스크립트가 알아서 만듭니다)
 *   약속   id | 제목 | 장소 | 메모 | 시작 | 종료 | 확정 | 만든이 | 만든날
 *            시작·종료 = 기본 시간대(시). 확정 = "2026-10-04 18:00~21:00" (비어 있으면 아직)
 *   설정   약속 | key | value        (dates = 후보 날짜 쉼표, windows = JSON {"날짜":[시작,끝]})
 *   참여   약속 | 이름
 *   응답   약속 | 이름 | 날짜 | 시간  ("10,11,12" 또는 "-" = 그 날 불가 / 줄 없음 = 미정)
 *   메모   약속 | 이름 | 날짜 | 메모
 *   수정   약속 | 이름 | 시각        (그 사람이 마지막으로 저장한 때)
 *
 * 스프레드시트는 **첫 실행 때 스크립트가 직접 만들고** 그 id 를 스크립트 속성에 넣어 둡니다.
 * (밴드매니저처럼 SHEET_ID 를 손으로 박지 않아도 됩니다. 바꾸려면 속성 SHEET_ID 를 고치세요)
 *
 * 통신은 JSONP(GET + callback). fetch 는 Apps Script 리다이렉트에서 CORS 로 멈춥니다.
 *
 * 배포: 코드 교체 → Ctrl+S → 배포 → 배포 관리 → 연필(수정) → 버전: 새 버전 → 배포
 */

var TABS = {
  meet:   { name: '약속', head: ['id','제목','장소','메모','시작','종료','확정','만든이','만든날'] },
  conf:   { name: '설정', head: ['약속', 'key', 'value'] },
  member: { name: '참여', head: ['약속', '이름'] },
  resp:   { name: '응답', head: ['약속', '이름', '날짜', '시간'] },
  note:   { name: '메모', head: ['약속', '이름', '날짜', '메모'] },
  edit:   { name: '수정', head: ['약속', '이름', '시각'] }
};

var CONF_DEFAULT = { hourStart: 10, hourEnd: 22 };

/** 시트는 처음 쓸 때 스크립트가 만든다 (속성 SHEET_ID 에 기억) */
function SHEET_ID_() {
  var props = PropertiesService.getScriptProperties();
  var id = props.getProperty('SHEET_ID');
  if (id) return id;
  var ss = SpreadsheetApp.create('약속 잡기 — 데이터');
  id = ss.getId();
  props.setProperty('SHEET_ID', id);
  return id;
}
/* ═══════════════ 시트 유틸 ═══════════════ */

/* 스프레드시트 왕복이 느립니다(한 번에 100~300ms). 그래서 한 번의 실행 안에서
 * ─ Spreadsheet 객체(_SS)
 * ─ 탭 이름 → Sheet 객체 맵(_SHEETS, getSheets() 한 번으로)
 * ─ 탭별 Sheet(_TAB) 와 읽어온 행들(_ROWS)
 * 을 전부 캐시합니다. 탭 하나당 읽기는 getDataRange() 한 번뿐이고,
 * put_ 로 쓴 내용은 캐시에 그대로 반영해 두어 뒤따르는 state_() 가 다시 읽지 않습니다. */
var _SS = null, _SHEETS = null, _TAB = {}, _ROWS = {};

/* 스프레드시트 왕복 하나가 수백 ms 라, 한 요청에 6개 탭을 읽으면 6~14초가 걸립니다.
 * 그래서 탭별 행들을 ScriptCache 에도 넣어 둡니다.
 * ─ 읽기(load)는 캐시가 있으면 스프레드시트를 아예 열지 않습니다
 * ─ 쓰기는 시트에 쓰고 캐시도 같은 내용으로 갱신합니다
 * ─ 시트를 손으로 고쳤다면 `fresh=1` 로 캐시를 무시하고 다시 읽습니다 (페이지의 '새로고침') */
var CACHE_TTL = 21600;       // 6시간 (ScriptCache 최대값)
/* 🚨🚨 2026-09-22 사고 (v9) — 남의 응답이 통째로 날아갔다 (정민 님: edit 시각은 남고 resp 가 0줄)
 * 예전에는 "캐시 적중분은 수명만 다시 늘린다(슬라이딩 만료)" 며 **읽을 때 본 값을 호출 끝에 캐시에 다시 썼다**.
 * 한 사람 안에서는 put_ 이 _TOUCH 에서 빼 줘서 괜찮았지만, **여러 사람이 동시에** 쓰면
 *   ① A 가 load(읽기) 시작 → 그 순간의 resp 를 들고 있는다
 *   ② B 가 저장 → 시트·캐시에 새 resp 를 쓴다
 *   ③ A 의 load 가 끝나며 **들고 있던 옛 resp 를 캐시에 덮어쓴다**
 *   ④ 다음 사람이 그 옛 resp 를 읽어 탭 전체를 되돌려 쓴다 → B 의 응답이 시트에서 사라진다
 * 읽기는 잠그지 않으니 ①③ 은 막을 수 없다. → **되쓰기를 없앴다.**
 * 수명은 15분마다 도는 warm() 이 **시트에서 다시 읽어** 채우므로 만료 걱정이 없다. */
function touchFlush_() { }
var _FRESH = false;
function cache_() { return CacheService.getScriptCache(); }
function ckey_(key) { return 'meet1_' + key; }
function keysAll_() { var a = []; for (var k in TABS) a.push(ckey_(k)); return a; }

/** 15분마다 깨워서 캐시를 미리 채워둔다.
 *  이게 없으면 한동안 아무도 안 쓴 뒤 첫 사용자가 15초를 기다린다
 *  (컨테이너 콜드 스타트 + 캐시 만료로 6개 탭을 전부 다시 읽기).
 *  트리거: Apps Script 편집기 왼쪽 ⏰ 트리거 → 트리거 추가 →
 *         함수 warm / 시간 기반 / 분 단위 타이머 / 15분마다 */
/** 15분 트리거. **시트(원본)에서 다시 읽어** 캐시를 통째로 새로 채운다.
 *  · 캐시 수명(6시간)을 계속 밀어준다 — 슬라이딩 만료를 없앤 자리를 이게 메운다 (v9)
 *  · 혹시 캐시가 시트와 어긋나 있어도 여기서 원상복구된다
 *  · 쓰기와 겹치지 않게 **같은 잠금**을 잡는다. 못 잡으면 그냥 다음 차례에 한다. */
function warm() {
  var lock = LockService.getScriptLock();
  try { lock.waitLock(30000); } catch (e) { return 'warm skipped (busy)'; }
  try {
    _SS = null; _SHEETS = null; _TAB = {}; _ROWS = {};
    _FRESH = true;                     // 캐시를 건너뛰고 시트에서 읽는다
    var m = {};
    for (var k in TABS) m[ckey_(k)] = JSON.stringify(open_(k));
    _FRESH = false;
    cache_().putAll(m, CACHE_TTL);
    return 'warm ok';
  } finally { try { lock.releaseLock(); } catch (ignore) {} }
}

function ss_() {
  if (!_SS) _SS = SpreadsheetApp.openById(SHEET_ID_());
  return _SS;
}

function sheetByName_(name) {
  if (!_SHEETS) {
    _SHEETS = {};
    var all = ss_().getSheets();
    for (var i = 0; i < all.length; i++) _SHEETS[all[i].getName()] = all[i];
  }
  return _SHEETS[name] || null;
}

/** 헤더가 맞는 탭을 보장하고, 그 탭 전체를 한 번에 읽어 캐시한다. 옛 탭은 이름만 바꿔 보존. */
function open_(key) {
  if (_ROWS[key]) return _ROWS[key];

  if (!_FRESH) {                                   // 캐시 적중이면 시트를 열지 않는다
    var hit = cache_().get(ckey_(key));
    if (hit) {
      try {
        _ROWS[key] = JSON.parse(hit);            // ⚠️ 여기서 캐시에 되쓰지 않는다 (v9 사고)
        return _ROWS[key];
      } catch (e) {}
    }
  }

  var spec = TABS[key], ss = ss_(), sh = sheetByName_(spec.name), vals = null;

  if (sh) {
    if (!sh.getLastRow()) {                        // 비어 있는 탭 → 헤더만 써 넣고 그대로 쓴다
      sh.getRange(1, 1, 1, spec.head.length).setValues([spec.head]).setFontWeight('bold');
      sh.setFrozenRows(1);
      vals = [spec.head];
    } else {
      vals = sh.getDataRange().getValues();
      var head = vals[0] || [];
      var same = true;
      for (var i = 0; i < spec.head.length; i++) {
        if (String(head[i] || '').trim() !== spec.head[i]) { same = false; break; }
      }
      if (!same) {                                 // 구버전 탭 → 이름만 바꿔 보존
        var bak = spec.name + '_구버전';
        if (sheetByName_(bak)) bak += '_' + Utilities.formatDate(new Date(), 'Asia/Seoul', 'MMddHHmm');
        sh.setName(bak);
        _SHEETS[bak] = sh;
        delete _SHEETS[spec.name];
        sh = null; vals = null;
      }
    }
  }

  if (!sh) {
    try { sh = ss.insertSheet(spec.name); }
    catch (err) { sh = ss.getSheetByName(spec.name); if (!sh) throw err; }
    sh.getRange(1, 1, 1, spec.head.length).setValues([spec.head]).setFontWeight('bold');
    sh.setFrozenRows(1);
    _SHEETS[spec.name] = sh;
    vals = [spec.head];
  }

  _TAB[key] = sh;

  var out = [];
  for (var r = 1; r < vals.length; r++) {
    var o = {}, empty = true;
    for (var c = 0; c < spec.head.length; c++) {
      var v = vals[r][c];
      if (Object.prototype.toString.call(v) === '[object Date]') {
        v = Utilities.formatDate(v, 'Asia/Seoul', 'yyyy-MM-dd');
      }
      v = (v === null || v === undefined) ? '' : String(v).trim();
      if (v) empty = false;
      o[spec.head[c]] = v;
    }
    if (!empty) out.push(o);
  }
  _ROWS[key] = out;
  cache_().put(ckey_(key), JSON.stringify(out), CACHE_TTL);
  return out;
}

/** Sheet 객체가 필요할 때만 시트를 연다 (쓰기 경로 전용). 값은 읽지 않는다. */
function sheetOf_(key) {
  if (_TAB[key]) return _TAB[key];
  var sh = sheetByName_(TABS[key].name);
  if (sh) { _TAB[key] = sh; return sh; }

  var keep = _ROWS[key];                           // 탭이 없으면 open_ 이 만들게 한다
  delete _ROWS[key];
  var save = _FRESH; _FRESH = true;
  try { open_(key); } finally { _FRESH = save; }
  if (keep) _ROWS[key] = keep;
  return _TAB[key];
}

function tab_(key) { return sheetOf_(key); }

/** 탭 전체를 객체 배열로 (실행 중엔 캐시) */
function rows_(key) { return open_(key); }

/** 탭 전체 덮어쓰기. 캐시도 같이 갱신해 뒤따르는 읽기가 시트를 안 건드리게 한다. */
function put_(key, list) {
  var spec = TABS[key];
  var sh = sheetOf_(key);

  var out = [];
  for (var r = 0; r < list.length; r++) {
    var row = [];
    for (var c = 0; c < spec.head.length; c++) {
      var v = list[r][spec.head[c]];
      row.push(v === null || v === undefined ? '' : String(v));
    }
    out.push(row);
  }

  var lastRow = sh.getLastRow();
  if (out.length) sh.getRange(2, 1, out.length, spec.head.length).setNumberFormat('@').setValues(out);
  if (lastRow > out.length + 1) {                  // 줄어든 만큼만 지운다
    sh.getRange(out.length + 2, 1, lastRow - out.length - 1, spec.head.length).clearContent();
  }

  _ROWS[key] = list;
  cache_().put(ckey_(key), JSON.stringify(list), CACHE_TTL);
}

/** 📼 저장 기록 — **절대 덮어쓰지 않는다**. put_ 처럼 탭 전체를 다시 쓰지 않고 한 줄씩 붙이기만 한다.
 *  TABS 에 없으므로 캐시·put_ 의 영향도 안 받는다. 뭐가 날아가도 여기서 그대로 되살릴 수 있다. (v10)
 *  (2026-09-22 Benny: "혹시모를 사태 대비해 기록된게 어딘가에 저장되긴해?") */
function logSave_(mid, name, payload) {
  try {
    var sh = sheetByName_('기록');
    if (!sh) {
      sh = ss_().insertSheet('기록');
      sh.getRange(1, 1, 1, 4).setValues([['시각', '약속', '이름', '내용']]).setFontWeight('bold');
      sh.setFrozenRows(1);
      _SHEETS = null;
      sh = sheetByName_('기록');
    }
    sh.appendRow([Utilities.formatDate(new Date(), 'Asia/Seoul', "yyyy-MM-dd'T'HH:mm:ss"),
                  String(mid), String(name), JSON.stringify(payload).slice(0, 5000)]);
  } catch (e) {}        // 기록이 실패해도 저장 자체를 막지는 않는다
}

function uid_(p) {
  return p + Utilities.formatDate(new Date(), 'Asia/Seoul', 'yyMMddHHmmss') +
         Math.floor(Math.random() * 1000);
}

function today_() { return Utilities.formatDate(new Date(), 'Asia/Seoul', 'yyyy-MM-dd'); }

function normDate_(s) {
  s = String(s || '').trim();
  return /^\d{4}-\d{2}-\d{2}$/.test(s) ? s : '';
}

/** 응답·메모·시간대 키 = 날짜 그대로 (약속 하나엔 시간표가 하나뿐이다) */
function normKey_(s) { return normDate_(s); }

function splitList_(s) {
  var parts = String(s || '').split(/[,\n]/), out = [];
  for (var i = 0; i < parts.length; i++) {
    var p = parts[i].trim();
    if (p) out.push(p);
  }
  return out;
}

function clampHour_(v, d) {
  var n = parseInt(v, 10);
  return (isNaN(n) || n < 0 || n > 24) ? d : n;
}

/** 날짜별 시간대 JSON 을 검증해서 {날짜: [시작, 끝]} 만 남긴다. 이상한 건 버린다. */
function parseWindows_(raw) {
  var out = {}, o;
  try { o = typeof raw === 'string' ? JSON.parse(raw || '{}') : (raw || {}); } catch (e) { return out; }
  if (!o || typeof o !== 'object') return out;
  var n = 0;
  for (var k in o) {
    var d = normKey_(k); if (!d) continue;
    var w = o[k]; if (!w || w.length !== 2) continue;
    var a = clampHour_(w[0], -1), b = clampHour_(w[1], -1);
    if (a < 0 || b < 0 || b <= a) continue;
    out[d] = [a, b];
    if (++n >= 120) break;
  }
  return out;
}

function parseHours_(raw) {
  var s = String(raw == null ? '' : raw).trim();
  if (!s) return null;
  if (s === '-') return [];
  var out = [], seen = {}, parts = s.split(/[,\s]+/);
  for (var i = 0; i < parts.length; i++) {
    var n = parseInt(parts[i], 10);
    if (!isNaN(n) && !seen[n]) { seen[n] = 1; out.push(n); }
  }
  out.sort(function (a, b) { return a - b; });
  return out;
}

/* ═══════════════ 상태 ═══════════════ */

/** 약속 한 건의 모든 것. m 이 없거나 없는 id 면 아무 데이터도 내려주지 않는다(목록 노출 금지). */
function state_(mid) {
  var out = {
    ok: true, meet: null, members: [], dates: [],
    hourStart: CONF_DEFAULT.hourStart, hourEnd: CONF_DEFAULT.hourEnd,
    windows: {}, hours: {}, notes: {}, edited: {}, picks: [],
    now: Utilities.formatDate(new Date(), 'Asia/Seoul', "yyyy-MM-dd'T'HH:mm:ss")
  };
  mid = String(mid || '').trim();
  if (!mid) return out;

  var ml = rows_('meet'), m = null, i;
  for (i = 0; i < ml.length; i++) if (ml[i].id === mid) { m = ml[i]; break; }
  if (!m) { out.gone = true; return out; }

  out.meet = {
    id: m.id, title: m['제목'], place: m['장소'], memo: m['메모'],
    fixed: m['확정'], owner: m['만든이'], made: m['만든날']
  };
  out.hourStart = clampHour_(m['시작'], CONF_DEFAULT.hourStart);
  out.hourEnd   = clampHour_(m['종료'], CONF_DEFAULT.hourEnd);
  if (out.hourEnd <= out.hourStart) { out.hourStart = CONF_DEFAULT.hourStart; out.hourEnd = CONF_DEFAULT.hourEnd; }

  var cs = rows_('conf');
  for (i = 0; i < cs.length; i++) {
    if (cs[i]['약속'] !== mid) continue;
    if (cs[i].key === 'dates') {
      var ds = splitList_(cs[i].value), keep = [], seen = {};
      for (var d = 0; d < ds.length; d++) {
        var nd = normDate_(ds[d]);
        if (nd && !seen[nd]) { seen[nd] = 1; keep.push(nd); }
      }
      keep.sort(); out.dates = keep;
    } else if (cs[i].key === 'windows') out.windows = parseWindows_(cs[i].value);
    else if (cs[i].key === 'picks') out.picks = parsePicks_(cs[i].value);
  }

  var ms = rows_('member');
  for (i = 0; i < ms.length; i++) if (ms[i]['약속'] === mid && ms[i]['이름']) out.members.push(ms[i]['이름']);

  var rs = rows_('resp');
  for (i = 0; i < rs.length; i++) {
    var r = rs[i]; if (r['약속'] !== mid || !r['이름']) continue;
    var rd = normKey_(r['날짜']); if (!rd) continue;
    var hh = parseHours_(r['시간']); if (hh === null) continue;
    if (!out.hours[r['이름']]) out.hours[r['이름']] = {};
    out.hours[r['이름']][rd] = hh;
  }

  var ns = rows_('note');
  for (i = 0; i < ns.length; i++) {
    var n = ns[i]; if (n['약속'] !== mid || !n['이름'] || !n['메모']) continue;
    var ndd = normKey_(n['날짜']); if (!ndd) continue;
    if (!out.notes[n['이름']]) out.notes[n['이름']] = {};
    out.notes[n['이름']][ndd] = n['메모'];
  }

  var es = rows_('edit');
  for (i = 0; i < es.length; i++) {
    if (es[i]['약속'] === mid && es[i]['이름'] && es[i]['시각']) out.edited[es[i]['이름']] = String(es[i]['시각']);
  }
  return out;
}

/** 제목 비교용 열쇠 — 앞뒤 공백·연속 공백·대소문자를 무시한다 (v5, 이름은 유일해야 한다) */
function titleKey_(s) {
  return String(s || '').replace(/\s+/g, ' ').trim().toLowerCase();
}
/** 같은 이름이 이미 있나? skipId 는 자기 자신(이름 바꿀 때) */
function titleTaken_(title, skipId) {
  var k = titleKey_(title);
  if (!k) return false;
  var l = rows_('meet');
  for (var i = 0; i < l.length; i++) {
    if (skipId && l[i].id === skipId) continue;
    if (titleKey_(l[i]['제목']) === k) return true;
  }
  return false;
}

/** "a,b,c" → {a:1,b:1,c:1} (최대 50개). 빈 값이면 빈 객체 = 아무것도 안 준다. */
function idSet_(raw) {
  var ids = splitList_(raw), want = {}, n = 0;
  for (var i = 0; i < ids.length; i++) {
    var q = String(ids[i]).trim();
    if (q && !want[q]) { want[q] = 1; if (++n >= 50) break; }
  }
  return want;
}

/** 관리 화면용 요약. want 가 객체면 그 id 만, null 이면 전부. */
function summ_(want) {
  var out = { ok: true, meets: [] }, i;
  var got = {}, ml = rows_('meet'), any = false;
  for (i = 0; i < ml.length; i++) {
    if (want && !want[ml[i].id]) continue;
    got[ml[i].id] = ml[i]; any = true;
  }
  if (!any) return out;

  var ds = {}, cs = rows_('conf');
  for (i = 0; i < cs.length; i++) {
    if (!got[cs[i]['약속']] || cs[i].key !== 'dates') continue;
    var list = splitList_(cs[i].value), keep = [], seen = {};
    for (var j = 0; j < list.length; j++) {
      var nd = normDate_(list[j]);
      if (nd && !seen[nd]) { seen[nd] = 1; keep.push(nd); }
    }
    keep.sort(); ds[cs[i]['약속']] = keep;
  }

  var mem = {}, ms = rows_('member');
  for (i = 0; i < ms.length; i++) {
    if (!got[ms[i]['약속']] || !ms[i]['이름']) continue;
    (mem[ms[i]['약속']] = mem[ms[i]['약속']] || []).push(ms[i]['이름']);
  }

  var ans = {}, rs = rows_('resp');
  for (i = 0; i < rs.length; i++) {
    var rb = rs[i]['약속'];
    if (!got[rb] || !rs[i]['이름']) continue;
    (ans[rb] = ans[rb] || {})[rs[i]['이름']] = 1;
  }

  var ed = {}, es = rows_('edit');
  for (i = 0; i < es.length; i++) {
    var eb = es[i]['약속'], ev = String(es[i]['시각'] || '');
    if (!got[eb] || !ev) continue;
    if (!ed[eb] || ev > ed[eb]) ed[eb] = ev;          // 그 약속에서 가장 최근 수정
  }

  for (var id in got) {
    var m = got[id], dl = ds[id] || [], names = mem[id] || [];
    var a = ans[id] || {}, cnt = 0;
    for (var nm in a) if (names.indexOf(nm) >= 0) cnt++;
    out.meets.push({
      id: id, title: m['제목'], place: m['장소'], memo: m['메모'], fixed: m['확정'],
      owner: m['만든이'], made: m['만든날'], edited: ed[id] || '',
      members: names, answered: cnt,
      dates: dl.length, from: dl[0] || '', to: dl[dl.length - 1] || ''
    });
  }
  return out;
}

/* ═══════════════ 동작 ═══════════════ */

function handle_(p) {
  var action = p.action || 'load';
  if (p.fresh) { _FRESH = true; cache_().removeAll(keysAll_()); }
  if (action === 'load') { var st = state_(p.m); touchFlush_(); return st; }
  /* 관리 화면용 요약 (v3~v4).
     meet_info = 준 id 만 / meet_all = 전부 (2026-09-21 Benny: "그냥 다 보여줘, 어차피 아무도 안 쓸 거야")
     ⚠️ meet_all 은 이 엔드포인트를 아는 사람이면 누구나 부를 수 있다. 제목·참여자 이름·날짜가 보인다. */
  if (action === 'meet_info') { var st2 = summ_(idSet_(p.ids)); touchFlush_(); return st2; }
  if (action === 'meet_all')  { var st3 = summ_(null);          touchFlush_(); return st3; }

  var lock = LockService.getScriptLock();
  try {
    lock.waitLock(25000);
    var r = act_(action, p);
    if (r && r.ok === false) return r;
    /* 여러 개 지우기처럼 '어느 약속' 이랄 게 없는 동작은 state_ 를 만들지 않는다 (v6) */
    if (r && r.done) { SpreadsheetApp.flush(); touchFlush_(); return r; }
    SpreadsheetApp.flush();
    var out = state_(r && r.m ? r.m : p.m);
    if (r && r.m) out.newId = r.m;
    touchFlush_();
    return out;
  } finally {
    try { lock.releaseLock(); } catch (ignore) {}
  }
}

/** 이 약속이 실제로 있는지 (없는 약속에 글을 쓰지 않게) */
function meetRow_(mid) {
  var ml = rows_('meet');
  for (var i = 0; i < ml.length; i++) if (ml[i].id === mid) return ml[i];
  return null;
}

function act_(action, p) {
  var mid = String(p.m || '').trim();
  var list, i;

  /* ── 새 약속 ── */
  if (action === 'meet_new') {
    var title = String(p.title || '').trim().slice(0, 60);
    if (!title) return { ok: false, error: '약속 이름을 적어주세요' };
    if (titleTaken_(title, '')) return { ok: false, error: '“' + title + '” 은 이미 있는 이름이에요. 다른 이름으로 해주세요' };
    var id = uid_('m');
    var hs = clampHour_(p.hourStart, CONF_DEFAULT.hourStart);
    var he = clampHour_(p.hourEnd, CONF_DEFAULT.hourEnd);
    if (he <= hs) { hs = CONF_DEFAULT.hourStart; he = CONF_DEFAULT.hourEnd; }
    list = rows_('meet');
    list.push({ id: id, '제목': title, '장소': String(p.place || '').slice(0, 60), '메모': '',
                '시작': String(hs), '종료': String(he), '확정': '',
                '만든이': String(p.who || '').slice(0, 30), '만든날': today_() });
    put_('meet', list);
    if (p.dates !== undefined) setConf_(id, 'dates', cleanDates_(p.dates));
    if (p.who) addMember_(id, String(p.who).trim());
    /* 만들 때 친구들 이름까지 한 번에 (v8) — 한 명씩 member_add 를 부르면 왕복이 늘어난다 */
    if (p.members !== undefined) {
      var ms = splitList_(p.members);
      for (var k = 0; k < ms.length && k < 30; k++) addMember_(id, ms[k]);
    }
    return { m: id };
  }


  /* ── 여러 개 한 번에 지우기 (v6, 2026-09-21 Benny: "하나씩 지우는거랑 선택해서 여러개 지우는거도")
     하나씩 meet_remove 를 여러 번 부르면 탭 6개 × 개수만큼 시트를 다시 쓴다.
     여기서는 **개수와 상관없이 탭당 한 번씩**만 쓴다. */
  if (action === 'meet_remove_many') {
    var want = idSet_(p.ids);
    var n = 0; for (var q in want) n++;
    if (!n) return { ok: false, error: '지울 약속을 고르지 않았습니다' };
    var had = 0, ml0 = rows_('meet');
    for (i = 0; i < ml0.length; i++) if (want[ml0[i].id]) had++;
    removeMeets_(want);
    return { done: true, ok: true, removed: had, ids: Object.keys(want) };
  }

  if (!mid || !meetRow_(mid)) return { ok: false, error: '없는 약속입니다 (링크를 확인해주세요)' };

  /* ── 약속 고치기 ── */
  if (action === 'meet_set') {
    if (p.title !== undefined) {
      var nt = String(p.title).trim();
      if (!nt) return { ok: false, error: '약속 이름을 적어주세요' };
      if (titleTaken_(nt, mid)) return { ok: false, error: '“' + nt + '” 은 이미 있는 이름이에요' };
    }
    list = rows_('meet');
    for (i = 0; i < list.length; i++) {
      if (list[i].id !== mid) continue;
      if (p.title !== undefined) list[i]['제목'] = String(p.title).slice(0, 60);
      if (p.place !== undefined) list[i]['장소'] = String(p.place).slice(0, 60);
      if (p.memo  !== undefined) list[i]['메모'] = String(p.memo).slice(0, 200);
      if (p.fixed !== undefined) list[i]['확정'] = String(p.fixed).slice(0, 60);
      if (p.hourStart !== undefined) list[i]['시작'] = String(clampHour_(p.hourStart, CONF_DEFAULT.hourStart));
      if (p.hourEnd   !== undefined) list[i]['종료'] = String(clampHour_(p.hourEnd, CONF_DEFAULT.hourEnd));
    }
    put_('meet', list);
    if (p.dates   !== undefined) setConf_(mid, 'dates', cleanDates_(p.dates));
    if (p.windows !== undefined) setConf_(mid, 'windows', JSON.stringify(parseWindows_(p.windows)));
    /* 후보 시간 (v7) — "2026-10-04 19:00~22:00" 문자열 여러 개. 확정은 여전히 한 개다. */
    if (p.picks   !== undefined) setConf_(mid, 'picks', JSON.stringify(parsePicks_(p.picks)));
    return;
  }

  /* ── 참여자 ── */
  if (action === 'member_add') {
    var mn = String(p.name || '').trim().slice(0, 30);
    if (!mn) return { ok: false, error: '이름이 필요합니다' };
    if (!addMember_(mid, mn)) return { ok: false, error: '이미 있는 이름입니다' };
    return;
  }
  if (action === 'member_rename') {
    var from = String(p.from || '').trim(), to = String(p.to || '').trim().slice(0, 30);
    if (!from || !to) return { ok: false, error: '이름이 필요합니다' };
    list = rows_('member');
    for (i = 0; i < list.length; i++)
      if (list[i]['약속'] === mid && list[i]['이름'] === to) return { ok: false, error: '이미 있는 이름입니다' };
    var found = false;
    for (i = 0; i < list.length; i++)
      if (list[i]['약속'] === mid && list[i]['이름'] === from) { list[i]['이름'] = to; found = true; }
    if (!found) return { ok: false, error: '없는 사람입니다' };
    put_('member', list);
    ['resp','note','edit'].forEach(function (k) {
      var l = rows_(k);
      for (var j = 0; j < l.length; j++)
        if (l[j]['약속'] === mid && l[j]['이름'] === from) l[j]['이름'] = to;
      put_(k, l);
    });
    return;
  }
  if (action === 'member_remove') {
    var rm = String(p.name || '').trim();
    put_('member', rows_('member').filter(function (x) { return !(x['약속'] === mid && x['이름'] === rm); }));
    ['resp','note','edit'].forEach(function (k) {
      put_(k, rows_(k).filter(function (x) { return !(x['약속'] === mid && x['이름'] === rm); }));
    });
    return;
  }

  /* ── 응답 + 메모 ── */
  if (action === 'save') {
    var name = String(p.name || '').trim();
    if (!name) return { ok: false, error: '이름이 필요합니다' };
    addMember_(mid, name);                              // 처음 응답하는 사람은 자동으로 참여자에 들어간다
    var body = JSON.parse(p.payload || '{}');
    var ph = body.hours || {}, pn = body.notes || {};
    logSave_(mid, name, body);                          // 📼 먼저 기록부터 (v10)

    var rl = rows_('resp').filter(function (x) {
      return !(x['약속'] === mid && x['이름'] === name && ph[x['날짜']] !== undefined);
    });
    for (var d1 in ph) {
      if (!normKey_(d1)) continue;
      var arr = ph[d1];
      if (arr === null) continue;                       // null = 미정 → 줄을 지우기만
      rl.push({ '약속': mid, '이름': name, '날짜': d1,
                '시간': (!arr || !arr.length) ? '-' : arr.join(',') });
    }
    put_('resp', rl);

    var nl = rows_('note').filter(function (x) {
      return !(x['약속'] === mid && x['이름'] === name && pn[x['날짜']] !== undefined);
    });
    for (var d2 in pn) {
      if (!normKey_(d2) || !pn[d2]) continue;
      nl.push({ '약속': mid, '이름': name, '날짜': d2, '메모': String(pn[d2]).slice(0, 200) });
    }
    put_('note', nl);

    var tnow = Utilities.formatDate(new Date(), 'Asia/Seoul', "yyyy-MM-dd'T'HH:mm:ss");
    var tl = rows_('edit'), got = false;
    for (var t = 0; t < tl.length; t++)
      if (tl[t]['약속'] === mid && tl[t]['이름'] === name) { tl[t]['시각'] = tnow; got = true; }
    if (!got) tl.push({ '약속': mid, '이름': name, '시각': tnow });
    put_('edit', tl);
    return;
  }

  /* ── 약속 통째로 지우기 (v2) ── */
  if (action === 'meet_remove') {
    removeMeets_(idSet_(mid));
    return { gone: true };
  }


  if (action === 'reset_answers') {
    ['resp','note','edit'].forEach(function (k) {
      put_(k, rows_(k).filter(function (x) { return x['약속'] !== mid; }));
    });
    return;
  }

  return { ok: false, error: 'unknown action: ' + action };
}

/** 주어진 id 들을 여섯 탭에서 한 번에 지운다 (탭당 쓰기 1회) */
function removeMeets_(want) {
  put_('meet', rows_('meet').filter(function (x) { return !want[x.id]; }));
  ['conf','member','resp','note','edit'].forEach(function (k) {
    put_(k, rows_(k).filter(function (x) { return !want[x['약속']]; }));
  });
}

function addMember_(mid, name) {
  name = String(name || '').trim().slice(0, 30);
  if (!name) return false;
  var list = rows_('member');
  for (var i = 0; i < list.length; i++)
    if (list[i]['약속'] === mid && list[i]['이름'] === name) return false;
  list.push({ '약속': mid, '이름': name });
  put_('member', list);
  return true;
}

/** 후보 시간 목록 — JSON 배열이든 쉼표 목록이든 받아서 "YYYY-MM-DD HH:MM~HH:MM" 만 남긴다 (v7) */
function parsePicks_(raw) {
  var list = [];
  if (raw === null || raw === undefined) return list;
  if (Object.prototype.toString.call(raw) === '[object Array]') list = raw;
  else {
    var t = String(raw).trim();
    if (!t) return list;
    if (t.charAt(0) === '[') { try { list = JSON.parse(t); } catch (e) { list = []; } }
    if (!list.length) list = t.split(/[\n,]/);
  }
  var out = [], seen = {};
  for (var i = 0; i < list.length; i++) {
    var v = String(list[i] === null || list[i] === undefined ? '' : list[i]).trim();
    var mm = /^(\d{4}-\d{2}-\d{2}) (\d{2}):(\d{2})~(\d{2}):(\d{2})$/.exec(v);
    if (!mm) continue;
    if (normDate_(mm[1]) !== mm[1]) continue;                 // 진짜 있는 날짜만
    var a1 = parseInt(mm[2], 10), b1 = parseInt(mm[4], 10);
    if (isNaN(a1) || isNaN(b1) || a1 < 0 || b1 > 24 || b1 <= a1) continue;
    if (mm[3] !== '00' || mm[5] !== '00') continue;            // 정시만
    if (seen[v]) continue;
    seen[v] = 1; out.push(v);
    if (out.length >= 20) break;
  }
  out.sort();
  return out;
}

function setConf_(mid, key, value) {
  var list = rows_('conf');
  for (var i = 0; i < list.length; i++)
    if (list[i]['약속'] === mid && list[i].key === key) { list[i].value = String(value); put_('conf', list); return; }
  list.push({ '약속': mid, key: key, value: String(value) });
  put_('conf', list);
}

function cleanDates_(raw) {
  var ds = splitList_(raw), keep = [], seen = {};
  for (var i = 0; i < ds.length; i++) {
    var nd = normDate_(ds[i]);
    if (nd && !seen[nd]) { seen[nd] = 1; keep.push(nd); }
  }
  keep.sort();
  return keep.join(',');
}
/* ═══════════════ 엔트리 ═══════════════ */

function doGet(e) {
  var p = (e && e.parameter) || {};
  var out;
  try { out = handle_(p); }
  catch (err) { out = { ok: false, error: String(err) }; }

  var body = JSON.stringify(out);
  if (p.callback) {
    return ContentService.createTextOutput(p.callback + '(' + body + ');')
      .setMimeType(ContentService.MimeType.JAVASCRIPT);
  }
  return ContentService.createTextOutput(body).setMimeType(ContentService.MimeType.JSON);
}

/** 서버 대 서버용 (curl / PowerShell). 브라우저는 doGet + JSONP 를 씁니다. */
function doPost(e) {
  var out;
  try { out = handle_(JSON.parse(e.postData.contents)); }
  catch (err) { out = { ok: false, error: String(err) }; }
  return ContentService.createTextOutput(JSON.stringify(out))
    .setMimeType(ContentService.MimeType.JSON);
}
