/* 재검토 4 — 날짜 저장이 실패하면 그 날짜가 다음 저장에서 빠지던 것 */
const { boot, test, main, eq, meetDoc, person } = require("./harness");
const D1 = "2026-12-05", D2 = "2026-12-06", D3 = "2026-12-12", D4 = "2026-12-13";

async function open(){
  const A = boot({ m: "m1", seed: F => {
    F.put("meets/m1", meetDoc({ dates: [D1, D2] }));
    F.put("meets/m1/people/p1", person("가"));
  } });
  await A.tick();
  A.run("openModal('calModal')");
  return A;
}
const failOnce = A => { const e = new Error("x"); e.code = "unavailable"; A.F.failNext = e; };

test("넣은 날짜 저장 실패 → 다음 저장에 같이 들어감", async () => {
  const A = await open();
  failOnce(A);
  A.run("toggleDate('" + D3 + "')"); A.flushTimers(); await A.tick();
  eq(A.lastStatus()[1], "err", "실패 알림");
  eq(A.F.get("meets/m1").dates, [D1, D2]);
  A.run("toggleDate('" + D4 + "')"); A.flushTimers(); await A.tick();
  eq(A.F.get("meets/m1").dates, [D1, D2, D3, D4]);
});
test("뺀 날짜 저장 실패 → 다음 저장에서 같이 빠짐", async () => {
  const A = await open();
  failOnce(A);
  A.run("toggleDate('" + D2 + "')"); A.flushTimers(); await A.tick();
  eq(A.F.get("meets/m1").dates, [D1, D2]);
  A.run("toggleDate('" + D4 + "')"); A.flushTimers(); await A.tick();
  eq(A.F.get("meets/m1").dates, [D1, D4]);
});
test("성공한 뒤에는 기준이 새 목록 — 남이 뺀 날짜를 되살리지 않음", async () => {
  const A = await open();
  A.run("toggleDate('" + D3 + "')"); A.flushTimers(); await A.tick();
  eq(A.F.get("meets/m1").dates, [D1, D2, D3]);
  A.F.put("meets/m1", Object.assign(A.F.get("meets/m1"), { dates: [D1, D2] }));   // B 가 D3 을 뺌
  await A.tick();
  A.run("toggleDate('" + D4 + "')"); A.flushTimers(); await A.tick();
  eq(A.F.get("meets/m1").dates, [D1, D2, D4]);
});

main();
