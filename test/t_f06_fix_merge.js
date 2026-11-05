/* 발견 6 — 📌(fixed) · 후보(picks) · 코멘트를 로컬 값으로 통째 계산해 덮던 것
   B 가 쓴 것이 A 화면에 아직 안 온 상태(스냅샷 전)를 저장소만 고쳐서 흉내 낸다 */
const { boot, test, main, eq, ok, meetDoc, person } = require("./harness");
const D1 = "2026-12-05", D2 = "2026-12-06";
const T1 = D1 + " 18:00~20:00", T2 = D2 + " 18:00~20:00", P1 = D1 + " 10:00~12:00";

async function open(extra){
  const A = boot({ m: "m1", seed: F => {
    F.put("meets/m1", meetDoc(Object.assign({ dates: [D1, D2] }, extra || {})));
    F.put("meets/m1/people/p1", person("가"));
  } });
  await A.tick();
  return A;
}
const quiet = (A, patch) => A.F.store.set("meets/m1", Object.assign(A.F.get("meets/m1"), patch));   // 알림 없이

test("동시에 다른 시간을 📌 → 둘 다 남음", async () => {
  const A = await open();
  quiet(A, { fixed: T1 });                       // B 의 📌 (A 는 아직 모름)
  A.run("setFixes(fixes().concat(['" + T2 + "']), '확정')");
  await A.tick();
  eq(A.F.get("meets/m1").fixed, T1 + ", " + T2);
});
test("동시에 후보 넣기 → 둘 다 남음", async () => {
  const A = await open();
  quiet(A, { picks: [P1] });
  A.run("setDayPicks('" + D2 + "', new Set([18, 19]), '후보')");
  await A.tick();
  eq(A.F.get("meets/m1").picks, [P1, T2]);
});
test("후보 → 📌 로 옮길 때 남의 후보 · 코멘트를 지우지 않음", async () => {
  const A = await open({ picks: [T2] });
  quiet(A, { picks: [P1, T2], fixNotes: { [T1]: "합주" }, fixed: T1 });
  A.run("fixRowToggle('" + D2 + "', { t: '" + T2 + "', on: false }, '청모')");
  await A.tick();
  const m = A.F.get("meets/m1");
  eq([m.fixed, m.picks, m.fixNotes], [T1 + ", " + T2, [P1], { [T1]: "합주", [T2]: "청모" }]);
});
test("📌 풀기 · 코멘트 지우기도 그대로 동작", async () => {
  const A = await open({ fixed: T1 + ", " + T2, fixNotes: { [T1]: "합주", [T2]: "청모" } });
  A.run("fixRowDelete('" + D1 + "', { t: '" + T1 + "', on: true })");
  await A.tick();
  const m = A.F.get("meets/m1");
  eq([m.fixed, m.fixNotes], [T2, { [T2]: "청모" }]);
  eq(A.run("meet().fixed"), T2, "화면 값");
});
test("옛 문서 — fixNotes 가 JSON 글자여도 동작 (map 으로 고쳐 씀)", async () => {
  const A = await open({ fixNotes: JSON.stringify({ [T1]: "합주" }), fixed: T1 });
  A.run("setFixes(fixes().concat(['" + T2 + "']), '확정')");
  await A.tick();
  const m = A.F.get("meets/m1");
  eq([m.fixed, m.fixNotes], [T1 + ", " + T2, { [T1]: "합주" }]);
});

main();
