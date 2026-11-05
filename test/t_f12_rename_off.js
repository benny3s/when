/* 재검토 1 — 이름 바꾸기가 서버에서 거절되면 내 칸이 비고, 한 날만 저장하면 다른 날 응답이 지워지던 것 */
const { boot, test, main, eq, meetDoc, person, Timestamp } = require("./harness");
const D1 = "2026-12-05", D2 = "2026-12-06";

/* '나' 는 이 시간표에서 뺀 사람 — 명단엔 없지만 문서가 있어 서버가 '이미 있는 이름' 으로 거절한다 */
async function open(off){
  const A = boot({ m: "m1", seed: F => {
    F.put("meets/m1", meetDoc({ dates: [D1, D2], off: off ? ["나"] : [] }));
    F.put("meets/m1/people/p1", person("가", { [D1]: [10], [D2]: [11] }, { added: new Timestamp(1000) }));
    F.put("meets/m1/people/p2", person("나", {}, { added: new Timestamp(2000) }));
  } });
  await A.tick();
  A.run("pickMe('가')"); await A.tick();
  return A;
}
const myH = (A, d) => A.run("myHours('" + d + "')");

test("뺀 사람 이름으로 바꾸기 실패 → me 는 원래대로, 내 칸이 그대로 보임", async () => {
  const A = await open(true);
  A.run("renameMe('나')"); await A.tick();
  eq(A.lastStatus()[1], "err", "실패 알림");
  eq(A.run("me"), "가");
  eq(A.run("members()"), ["가"]);
  eq([myH(A, D1), myH(A, D2)], [[10], [11]]);
});
test("실패 뒤 한 날만 저장해도 다른 날 응답이 남음", async () => {
  const A = await open(true);
  A.run("renameMe('나')"); await A.tick();
  A.run("openDay('" + D1 + "', 'edit'); $('#dmX').onclick(); $('#dmClose').onclick();"); await A.tick();
  const h = A.F.get("meets/m1/people/p1").hours;
  eq([h[D1], h[D2]], [[], [11]]);
});
test("아직 못 받은 이름으로 실패 → 실패한 새 이름이 명단에 남지 않음", async () => {
  const A = await open(false);
  A.run("ST.members = ['가']; delete ST.hours['나'];");        // 서버에는 '나' 가 있는데 로컬 명단엔 아직 없음
  A.run("renameMe('나')"); await A.tick();
  eq(A.lastStatus()[1], "err", "실패 알림");
  eq(A.run("members()"), ["가"]);
  eq([myH(A, D1), myH(A, D2)], [[10], [11]]);
});
test("저장 못 한 입력이 있으면 실패해도 그 입력은 남음", async () => {
  const A = await open(true);
  const e = new Error("x"); e.code = "unavailable"; A.F.failNext = e;
  A.run("openDay('" + D1 + "', 'edit'); $('#dmX').onclick(); $('#dmClose').onclick();"); await A.tick();
  eq(A.run("dirty"), true, "저장 실패");
  A.run("renameMe('나')"); await A.tick();
  eq(A.run("me"), "가");
  eq([A.run("dirty"), A.run("noneSel.has('" + D1 + "')"), myH(A, D2)], [true, true, [11]]);
});

main();
