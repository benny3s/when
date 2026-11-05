/* 발견 4 — 날짜 고르기 창이 열 때 받은 목록으로 dates 를 통째 덮던 것 */
const { boot, test, main, eq, meetDoc, person } = require("./harness");
const D1 = "2026-12-05", D2 = "2026-12-06", D3 = "2026-12-12", D4 = "2026-12-13";

async function open(){
  const A = boot({ m: "m1", seed: F => {
    F.put("meets/m1", meetDoc({ dates: [D1, D2] }));
    F.put("meets/m1/people/p1", person("가"));
  } });
  await A.tick();
  A.run("openModal('calModal')");               // A 가 날짜 고르기를 열어 둠
  return A;
}

test("열어 둔 사이 남이 넣은 날짜가 지워지지 않음", async () => {
  const A = await open();
  A.F.put("meets/m1", Object.assign(A.F.get("meets/m1"), { dates: [D1, D2, D3] }));   // B 가 D3 추가
  await A.tick();
  A.run("toggleDate('" + D4 + "')");           // A 가 D4 를 누름
  A.flushTimers(); await A.tick();
  eq(A.F.get("meets/m1").dates, [D1, D2, D3, D4]);
});
test("열어 둔 사이 남이 뺀 날짜가 되살아나지 않음", async () => {
  const A = await open();
  A.F.put("meets/m1", Object.assign(A.F.get("meets/m1"), { dates: [D1] }));            // B 가 D2 를 후보에서 뺌
  await A.tick();
  A.run("toggleDate('" + D4 + "')");
  A.flushTimers(); await A.tick();
  eq(A.F.get("meets/m1").dates, [D1, D4]);
});
test("내가 뺀 날짜는 빠짐", async () => {
  const A = await open();
  A.run("toggleDate('" + D2 + "')");
  A.flushTimers(); await A.tick();
  eq(A.F.get("meets/m1").dates, [D1]);
});

main();
