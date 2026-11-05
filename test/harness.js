/* 시험용 바탕 — 가짜 DOM + 메모리 안 가짜 Firestore 위에 core.js · sched.js (· index.html 스크립트) 를 그대로 올린다.
   실서버·브라우저는 쓰지 않는다. python test/run.py 로 한꺼번에 돌린다. */
const fs = require("fs"), path = require("path"), vm = require("vm");
const ROOT = path.join(__dirname, "..");

/* ── 가짜 DOM 요소 — 쓰는 속성·메서드만 ── */
function makeEl(tag, created){
  const o = { tagName: tag || "DIV", hidden: true, value: "", textContent: "", innerHTML: "", className: "", outerHTML: "",
    disabled: false, checked: false, readOnly: false, title: "", type: "", id: "", tabIndex: 0, maxLength: 0, placeholder: "",
    offsetWidth: 0, scrollWidth: 0, clientWidth: 0, scrollLeft: 0, dataset: {}, style: { setProperty(){} }, children: [] };
  o.classList = { _s: new Set(), add(...a){ a.forEach(x => this._s.add(x)); }, remove(...a){ a.forEach(x => this._s.delete(x)); },
    toggle(x, f){ const on = f === undefined ? !this._s.has(x) : !!f; on ? this._s.add(x) : this._s.delete(x); return on; },
    contains(x){ return this._s.has(x); } };
  o.appendChild = c => { o.children.push(c); return c; };
  o.append = (...cs) => { cs.forEach(c => o.children.push(c)); };
  o.after = () => {}; o.prepend = () => {}; o.remove = () => {};
  o.setAttribute = (k, v) => { o["attr:" + k] = String(v); };
  o.getAttribute = k => (("attr:" + k) in o ? o["attr:" + k] : null);
  o.removeAttribute = () => {};
  o.addEventListener = (ev, fn) => { o._ev = o._ev || {}; (o._ev[ev] = o._ev[ev] || []).push(fn); };
  o.removeEventListener = () => {};
  o.querySelector = sel => { o._q = o._q || {}; return o._q[sel] || (o._q[sel] = makeEl("DIV", created)); };
  o.querySelectorAll = () => [];
  o.closest = () => null;
  o.focus = o.blur = o.select = o.click = o.scrollIntoView = o.scrollBy = () => {};
  o.insertAdjacentHTML = () => {};
  o.contains = () => false;
  if (created) created.push(o);
  return o;
}

/* ── 가짜 Firestore ── */
class Timestamp {
  constructor(ms){ this.ms = ms; }
  toMillis(){ return this.ms; }
  toDate(){ return new Date(this.ms); }
  static now(){ return new Timestamp(Date.now()); }
  static fromMillis(ms){ return new Timestamp(ms); }
}
class FieldPath { constructor(...segs){ this.segs = segs; } }
const SENT = k => (...vals) => ({ __fv: k, vals });
const FieldValue = { serverTimestamp: SENT("ts"), delete: SENT("del"), arrayUnion: SENT("union"), arrayRemove: SENT("remove") };

function deep(v){
  if (v instanceof Timestamp) return new Timestamp(v.ms);
  if (Array.isArray(v)) return v.map(deep);
  if (v && typeof v === "object" && !v.__fv){ const o = {}; for (const k in v) o[k] = deep(v[k]); return o; }
  return v;
}
function makeFirebase(){
  const store = new Map();          // 문서 경로 → 데이터
  const subs = new Set();           // { kind, path, cb }
  let clock = Date.parse("2026-11-05T09:00:00Z");
  const F = { store, rules: null, writes: [], failNext: null, txCount: 0 };
  const resolve = (cur, v) => {
    if (v && v.__fv === "ts") return new Timestamp(++clock);
    if (v && v.__fv === "union"){ const a = Array.isArray(cur) ? cur.slice() : []; v.vals.forEach(x => { if (!a.includes(x)) a.push(x); }); return a; }
    if (v && v.__fv === "remove") return (Array.isArray(cur) ? cur : []).filter(x => !v.vals.includes(x));
    return deep(v);
  };
  const setPath = (obj, segs, v) => {
    let o = obj;
    for (let i = 0; i < segs.length - 1; i++){ if (!o[segs[i]] || typeof o[segs[i]] !== "object") o[segs[i]] = {}; o = o[segs[i]]; }
    const last = segs[segs.length - 1];
    if (v && v.__fv === "del") delete o[last]; else o[last] = resolve(o[last], v);
  };
  /* 쓰기 하나 → 새 데이터 (null = 지움) */
  const applyOp = (cur, op) => {
    if (op.kind === "delete") return null;
    if (op.kind === "set"){
      const base = (op.merge && cur) ? deep(cur) : {};
      for (const k in op.data) setPath(base, [k], op.data[k]);
      return base;
    }
    if (!cur){ const e = new Error("No document to update: " + op.path); e.code = "not-found"; throw e; }
    const base = deep(cur);
    op.pairs.forEach(([fp, v]) => setPath(base, fp instanceof FieldPath ? fp.segs : String(fp).split("."), v));
    return base;
  };
  const commit = async ops => {
    await null;
    if (F.failNext){ const e = F.failNext; F.failNext = null; throw e; }
    if (F.hold){ await F.hold; }
    const stage = new Map();
    const get = p => stage.has(p) ? stage.get(p) : (store.has(p) ? store.get(p) : null);
    ops.forEach(op => stage.set(op.path, applyOp(get(op.path), op)));
    for (const [p, d] of stage){
      if (F.rules && !F.rules(p, d, store.has(p) ? store.get(p) : null)){ const e = new Error("Missing or insufficient permissions."); e.code = "permission-denied"; throw e; }
    }
    for (const [p, d] of stage){ if (d === null) store.delete(p); else store.set(p, d); F.writes.push({ path: p, data: d === null ? null : deep(d) }); }
    notify(Array.from(stage.keys()));
  };
  const docSnap = p => ({ exists: store.has(p), id: p.split("/").pop(), ref: docRef(p),
    data: () => store.has(p) ? deep(store.get(p)) : undefined, metadata: { fromCache: false } });
  const kids = col => Array.from(store.keys()).filter(k => k.startsWith(col + "/") && k.slice(col.length + 1).indexOf("/") < 0);
  const colSnap = (col, filt) => {
    const docs = kids(col).filter(k => !filt || filt(store.get(k))).map(docSnap);
    return { docs, size: docs.length, empty: !docs.length, metadata: { fromCache: false } };
  };
  const notify = paths => {
    subs.forEach(s => {
      if (s.kind === "doc" && paths.includes(s.path)) s.cb(docSnap(s.path));
      if (s.kind === "col" && paths.some(p => p.startsWith(s.path + "/") && p.slice(s.path.length + 1).indexOf("/") < 0)) s.cb(colSnap(s.path));
    });
  };
  const sub = (kind, p, args) => {
    const cb = args.find(x => typeof x === "function");
    const s = { kind, path: p, cb };
    subs.add(s);
    Promise.resolve().then(() => { if (subs.has(s)) cb(kind === "doc" ? docSnap(p) : colSnap(p)); });
    return () => subs.delete(s);
  };
  let auto = 0;
  function docRef(p){
    return { id: p.split("/").pop(), path: p,
      collection: c => colRef(p + "/" + c),
      get: async () => docSnap(p),
      set: (data, opt) => commit([{ kind: "set", path: p, data, merge: !!(opt && opt.merge) }]),
      update: (...a) => commit([{ kind: "update", path: p, pairs: pairsOf(a) }]),
      delete: () => commit([{ kind: "delete", path: p }]),
      onSnapshot: (...a) => sub("doc", p, a) };
  }
  function colRef(p){
    const q = filt => ({ limit: () => q(filt), get: async () => colSnap(p, filt), where: (f, op, v) => q(d => (!filt || filt(d)) && d[f] === v) });
    return Object.assign(q(null), { path: p,
      doc: id => docRef(p + "/" + (id || ("auto" + (++auto)))),
      add: async data => { const r = docRef(p + "/auto" + (++auto)); await r.set(data); return r; },
      onSnapshot: (...a) => sub("col", p, a) });
  }
  const pairsOf = a => {
    if (a.length === 1 && a[0] && typeof a[0] === "object" && !(a[0] instanceof FieldPath)) return Object.keys(a[0]).map(k => [k, a[0][k]]);
    const out = []; for (let i = 0; i < a.length; i += 2) out.push([a[i], a[i + 1]]); return out;
  };
  const db = {
    collection: c => colRef(c),
    batch: () => { const ops = []; return {
      set: (r, data, opt) => ops.push({ kind: "set", path: r.path, data, merge: !!(opt && opt.merge) }),
      update: (r, ...a) => ops.push({ kind: "update", path: r.path, pairs: pairsOf(a) }),
      delete: r => ops.push({ kind: "delete", path: r.path }),
      commit: () => commit(ops) }; },
    runTransaction: async fn => {
      const ops = [];
      const tx = { get: async r => docSnap(r.path),
        update: (r, ...a) => { ops.push({ kind: "update", path: r.path, pairs: pairsOf(a) }); return tx; },
        set: (r, data, opt) => { ops.push({ kind: "set", path: r.path, data, merge: !!(opt && opt.merge) }); return tx; },
        delete: r => { ops.push({ kind: "delete", path: r.path }); return tx; } };
      F.txCount++;
      const out = await fn(tx);
      await commit(ops);
      return out;
    }
  };
  const firestore = () => db;
  firestore.FieldValue = FieldValue; firestore.FieldPath = FieldPath; firestore.Timestamp = Timestamp;
  F.firebase = { initializeApp(){}, firestore };
  F.db = db;
  /* 다른 기기가 쓴 것처럼 — 저장소를 바로 고치고 지켜보는 쪽에 알린다 */
  F.put = (p, data) => { if (data === null) store.delete(p); else store.set(p, deep(data)); notify([p]); };
  F.get = p => store.has(p) ? deep(store.get(p)) : null;
  F.kids = kids;
  return F;
}

/* 실제 규칙(benny-apps/firestore.rules)에서 이번 시험에 걸리는 크기 검사만 옮긴 것 */
function sizeRules(p, d){
  if (d === null) return true;
  if (/^meets\/[^/]+$/.test(p)){
    if (typeof d.fixed !== "string" || d.fixed.length > 400) return false;
    if (!Array.isArray(d.picks) || d.picks.length > 20) return false;
    if (!Array.isArray(d.dates) || d.dates.length > 200) return false;
    if (d.fixNotes && (typeof d.fixNotes !== "object" || Object.keys(d.fixNotes).length > 20)) return false;
  }
  if (/^adminIdx\//.test(p)){
    for (const k of ["bands", "meets", "trips", "wishes"]) if (d[k] && d[k].length > 200) return false;
  }
  return true;
}

function meetDoc(o){
  return Object.assign({ title: "모임", titleKey: "모임", place: "", memo: "", fixed: "", hourStart: 10, hourEnd: 22,
    dates: [], windows: {}, picks: [], owner: "가", made: "2026-11-01", createdAt: null, updatedAt: null }, o || {});
}
function person(name, hours, extra){
  return Object.assign({ name, hours: hours || {}, notes: {}, edited: null, added: new Timestamp(1000) }, extra || {});
}

/* ── 앱 띄우기 ──
   opt.m = 열 약속 id (주소 ?m=) · opt.index = index.html 스크립트까지 · opt.seed(F) = 띄우기 전에 저장소 채우기 · opt.admin = 관리자 기기 */
function boot(opt){
  opt = opt || {};
  const F = makeFirebase();
  F.rules = sizeRules;
  if (opt.seed) opt.seed(F);
  const created = [], els = {}, docEv = {}, winEv = {}, timers = new Map();
  let tid = 0;
  const ls = new Map();
  const storage = m => ({ getItem: k => m.has(k) ? m.get(k) : null, setItem: (k, v) => m.set(k, String(v)), removeItem: k => m.delete(k) });
  const document = {
    visibilityState: "visible", title: "",
    body: makeEl("BODY"), documentElement: makeEl("HTML"),
    querySelector: s => els[s] || (els[s] = makeEl("DIV")),
    querySelectorAll: () => [],
    getElementById: () => null,
    createElement: t => makeEl(String(t).toUpperCase(), created),
    createTextNode: t => ({ textContent: String(t) }),
    addEventListener: (ev, fn) => { (docEv[ev] = docEv[ev] || []).push(fn); }
  };
  const ctx = {
    console, Promise, Date, Math, JSON, Map, Set, Array, Object, String, Number, Boolean, RegExp, Error, Symbol, parseInt, isNaN, Infinity,
    encodeURIComponent, decodeURIComponent, URLSearchParams,
    document, firebase: F.firebase,
    location: { search: opt.m ? "?m=" + opt.m : "", pathname: "/when/", origin: "https://example.test", href: "https://example.test/when/" + (opt.m ? "?m=" + opt.m : "") },
    history: { pushState(){}, replaceState(){}, back(){} },
    navigator: { userAgent: "node-test" },
    localStorage: storage(ls), sessionStorage: storage(new Map()),
    matchMedia: () => ({ matches: false }),
    requestAnimationFrame: () => 0,
    MutationObserver: class { observe(){} },
    setTimeout: (fn, ms) => { const id = ++tid; timers.set(id, { fn, ms }); return id; },
    clearTimeout: id => timers.delete(id),
    addEventListener: (ev, fn) => { (winEv[ev] = winEv[ev] || []).push(fn); }
  };
  ctx.window = ctx;
  if (opt.admin){ ls.set("bennyAdminSession", "1"); ls.set("bennyAdminKey", "a".repeat(64)); }
  vm.createContext(ctx);
  const run = (code, name) => vm.runInContext(code, ctx, { filename: name || "inline" });
  if (!opt.index) run("function renderAll(){ renderSched(); } function showNew(){}", "host.js");   // 페이지가 줄 것 — 최소한만
  run(fs.readFileSync(path.join(ROOT, "core.js"), "utf8"), "core.js");
  /* 알림 기록 — 마지막 알림을 남긴다 (sched.js · index 가 부르는 이름 그대로) */
  run("var __st = []; const __setStatus0 = setStatus; setStatus = function(m, c){ __st.push([m || '', c || '']); return __setStatus0(m, c); };", "spy.js");
  run(fs.readFileSync(path.join(ROOT, "sched.js"), "utf8"), "sched.js");
  if (opt.index){
    const html = fs.readFileSync(path.join(ROOT, "index.html"), "utf8");
    const a = html.lastIndexOf("<script>") + "<script>".length, z = html.lastIndexOf("</script>");
    run(html.slice(a, z), "index.html");
  }
  if (!opt.index && opt.m) run("load()", "host-start.js");        // 페이지가 하듯 약속을 연다
  const tick = async n => { for (let i = 0; i < (n || 30); i++) await new Promise(r => setImmediate(r)); };
  const flushTimers = () => { const t = Array.from(timers.values()); timers.clear(); t.forEach(x => x.fn()); };
  const lastStatus = () => { const a = run("__st"); return a.length ? a[a.length - 1] : ["", ""]; };
  return { F, ctx, run, tick, flushTimers, created, els, docEv, winEv, ls, timers, lastStatus };
}

/* ── 아주 작은 시험 도구 ── */
const results = [];
function test(name, fn){ results.push({ name, fn }); }
async function main(){
  let pass = 0, fail = 0;
  for (const t of results){
    try { await t.fn(); pass++; console.log("  ok   " + t.name); }
    catch(e){ fail++; console.log("  FAIL " + t.name + " — " + (e && e.message ? e.message.split("\n")[0] : e)); }
  }
  console.log("RESULT " + pass + " " + fail);
  process.exitCode = fail ? 1 : 0;
}
function eq(a, b, msg){
  const A = JSON.stringify(a), B = JSON.stringify(b);
  if (A !== B) throw new Error((msg || "다름") + ": " + A + " ≠ " + B);
}
function ok(v, msg){ if (!v) throw new Error(msg || "거짓"); }

module.exports = { boot, test, main, eq, ok, meetDoc, person, Timestamp };
