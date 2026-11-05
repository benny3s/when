/* 발견 8 — 그날 창을 닫지 않고 앱을 나가면 ✕ · 이유가 저장되지 않던 것 */
const { boot, test, main, eq, meetDoc, person } = require("./harness");
const D1 = "2026-12-05", D2 = "2026-12-06";

async function open(){
  const A = boot({ m: "m1", seed: F => {
    F.put("meets/m1", meetDoc({ dates: [D1, D2] }));
    F.put("meets/m1/people/p1", person("가"));
  } });
  await A.tick(); A.run("pickMe('가')");
  A.run("openDay('" + D1 + "', 'edit'); $('#dayModal').hidden = false; $('#dmX').onclick(); $('#dmInput').value = '출장';");
  return A;
}

test("창을 연 채 화면이 숨겨지면(카톡으로 돌아감) ✕ · 이유가 저장됨", async () => {
  const A = await open();
  A.ctx.document.visibilityState = "hidden";
  (A.docEv.visibilitychange || []).forEach(f => f());
  await A.tick();
  const p = A.F.get("meets/m1/people/p1");
  eq([p.hours[D1], p.notes[D1]], [[], "출장"]);
});
test("탭을 닫을 때(pagehide)도 저장됨", async () => {
  const A = await open();
  (A.winEv.pagehide || []).forEach(f => f());
  await A.tick();
  const p = A.F.get("meets/m1/people/p1");
  eq([p.hours[D1], p.notes[D1]], [[], "출장"]);
});
test("다시 보이게 될 때는 저장하지 않음", async () => {
  const A = await open();
  const n0 = A.F.writes.length;
  (A.docEv.visibilitychange || []).forEach(f => f());
  await A.tick();
  eq(A.F.writes.length, n0);
});

main();
