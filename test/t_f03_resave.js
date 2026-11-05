/* 발견 3 — 저장하는 동안 한 입력이 보내지지 않고 남던 것 */
const { boot, test, main, eq, ok, meetDoc, person } = require("./harness");
const D1 = "2026-12-05", D2 = "2026-12-06";

test("저장 중 다른 날 ○ → 첫 저장이 끝나면 이어서 저장됨", async () => {
  const A = boot({ m: "m1", seed: F => {
    F.put("meets/m1", meetDoc({ dates: [D1, D2] }));
    F.put("meets/m1/people/p1", person("가"));
  } });
  await A.tick(); A.run("pickMe('가')");
  let release; A.F.hold = new Promise(r => { release = r; });     // 느린 폰 — 서버 응답이 늦다
  A.run("openDay('" + D1 + "', 'edit'); $('#dmO').onclick();");  // D1 ○ → 바로 저장 시작
  await A.tick(5);
  eq(A.run("saving"), true, "저장 중");
  A.run("openDay('" + D2 + "', 'edit'); $('#dmO').onclick();");  // 응답 전에 D2 ○ → closeDay 가 건너뜀
  await A.tick(5);
  A.F.hold = null; release();
  await A.tick(60);
  const h = A.F.get("meets/m1/people/p1").hours;
  ok(Array.isArray(h[D1]) && h[D1].length, "D1 저장");
  ok(Array.isArray(h[D2]) && h[D2].length === 12, "D2 가 저장되지 않음");
  eq(A.run("dirty"), false, "남은 입력");
});

test("저장 실패 뒤에는 다시 보내지 않고 저장 버튼을 띄움 (무한 재시도 없음)", async () => {
  const A = boot({ m: "m1", seed: F => {
    F.put("meets/m1", meetDoc({ dates: [D1, D2] }));
    F.put("meets/m1/people/p1", person("가"));
  } });
  await A.tick(); A.run("pickMe('가')");
  const n0 = A.F.writes.length;
  const e = new Error("x"); e.code = "unavailable"; A.F.failNext = e;
  A.run("openDay('" + D1 + "', 'edit'); $('#dmO').onclick();");
  await A.tick(60);
  eq(A.F.writes.length, n0, "실패 뒤 다시 씀");
  eq(A.run("dirty"), true);
  eq(A.lastStatus()[1], "err");
});

main();
