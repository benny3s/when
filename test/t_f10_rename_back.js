/* 발견 10 — 이름 바꾸기 · 빼기가 서버에서 실패해도 me 를 되돌리지 않던 것 */
const { boot, test, main, eq, meetDoc, person, Timestamp } = require("./harness");
const D1 = "2026-12-05";

/* 서버에는 '나' 가 있는데 로컬 명단엔 아직 없음 */
async function open(index){
  const A = boot({ m: "m1", index: !!index, seed: F => {
    F.put("meets/m1", meetDoc({ dates: [D1] }));
    F.put("meets/m1/people/p1", person("가", {}, { added: new Timestamp(1000) }));
    F.put("meets/m1/people/p2", person("나", { [D1]: [10] }, { added: new Timestamp(2000) }));
  } });
  await A.tick();
  A.run("pickMe('가')"); await A.tick();
  A.run("ST.members = ['가']; delete ST.hours['나'];");
  return A;
}
const meKey = A => A.ls.get("meet_me:m1");

test("✎ 수정으로 '이미 있는 이름' 실패 → me 는 원래 이름", async () => {
  const A = await open();
  A.run("renameMe('나')");
  await A.tick();
  eq(A.lastStatus()[1], "err", "실패 알림");
  eq([A.run("me"), meKey(A)], ["가", "가"]);
});
test("설정 창 '이름변경' 실패 → me 는 원래 이름 (index.html)", async () => {
  const A = await open(true);
  A.run("askText = async () => '나'; openModal('setModal');");
  const rn = A.created.filter(e => e.textContent === "이름변경")[0];
  await rn.onclick(); await A.tick();
  eq(A.lastStatus()[1], "err", "실패 알림");
  eq(A.run("me"), "가");
});
test("설정 창 '빼기' 실패(네트워크) → me 는 원래 이름 (index.html)", async () => {
  const A = await open(true);
  A.run("ask = async () => true; openModal('setModal');");
  const rm = A.created.filter(e => e.textContent === "빼기")[0];
  const e = new Error("x"); e.code = "unavailable"; A.F.failNext = e;
  await rm.onclick(); await A.tick();
  eq(A.lastStatus()[1], "err", "실패 알림");
  eq(A.run("me"), "가");
});
test("성공하면 me 가 새 이름", async () => {
  const A = await open();
  A.run("renameMe('다')");
  await A.tick();
  eq([A.run("me"), meKey(A)], ["다", "다"]);
});

main();
