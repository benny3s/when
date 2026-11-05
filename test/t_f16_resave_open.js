/* 재검토 9 — 저장이 끝나 이어서 저장할 때 날짜 창이 열려 있어도 저장하던 것 */
const { boot, test, main, eq, meetDoc, person } = require("./harness");
const D1 = "2026-12-05", D2 = "2026-12-06";
const pw = A => A.F.writes.filter(w => w.path.indexOf("/people/") > 0).length;

test("창이 열려 있으면 이어서 저장하지 않고, 닫을 때 저장", async () => {
  const A = boot({ m: "m1", seed: F => {
    F.put("meets/m1", meetDoc({ dates: [D1, D2] }));
    F.put("meets/m1/people/p1", person("가"));
  } });
  await A.tick(); A.run("pickMe('가')"); await A.tick();
  const n0 = pw(A);
  let release; A.F.hold = new Promise(r => { release = r; });
  A.run("openDay('" + D1 + "', 'edit'); $('#dmO').onclick();"); await A.tick(5);
  A.run("openDay('" + D2 + "', 'edit'); $('#dmX').onclick();"); await A.tick(5);      // 응답 전에 다른 날을 열어 두고 입력 중
  A.F.hold = null; release();
  await A.tick(60);
  eq(pw(A) - n0, 1, "첫 저장만");
  eq([A.run("dirty"), A.run("saving"), A.run("$('#dayModal').hidden")], [true, false, false]);
  A.run("$('#dmInput').value = '출장'; $('#dmClose').onclick();"); await A.tick(60);
  eq(pw(A) - n0, 2, "닫을 때 저장");
  const p = A.F.get("meets/m1/people/p1");
  eq([p.hours[D1].length, p.hours[D2]], [12, []]);
  eq(A.run("dirty"), false);
});

main();
