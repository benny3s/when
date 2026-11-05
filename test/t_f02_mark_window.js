/* 발견 2 — 남의 칸 기호(○△)와 달력 'N명' 이 시간대 밖 시간까지 세던 것 */
const { boot, test, main, eq, meetDoc, person } = require("./harness");
const D1 = "2026-12-05";

async function open(hours){
  const A = boot({ m: "m1", seed: F => {
    F.put("meets/m1", meetDoc({ dates: [D1], windows: { [D1]: [10, 14] } }));
    F.put("meets/m1/people/p1", person("가"));
    F.put("meets/m1/people/p2", person("나", { [D1]: hours }));
  } });
  await A.tick();
  return A;
}
const mark = (A) => A.run("markOf('" + D1 + "', hoursOf()['나']['" + D1 + "'], true, false)");

test("시간대(10–14)와 안 겹치는 18–23시 ○ → ○ 로 보이지 않음", async () => {
  const A = await open([18, 19, 20, 21, 22]);
  const m = mark(A);
  eq(m.cls === "all", false, "○ 로 보임");
  eq(m.cls, "none");
});
test("일부만 겹치면 △ + 겹치는 시간만", async () => {
  const A = await open([12, 13, 18, 19]);
  const m = mark(A);
  eq([m.cls, m.tx], ["part", "12–14"]);
});
test("시간대를 다 채우면 ○ (밖의 시간이 더 있어도)", async () => {
  const A = await open([9, 10, 11, 12, 13, 20]);
  eq(mark(A).cls, "all");
});
test("시간 미정 △ [-1] 는 그대로 △", async () => {
  const A = await open([-1]);
  eq(mark(A).mk, "△");
});
test("달력 보기 'N명' — 안 겹치는 사람은 세지 않음", async () => {
  const A = await open([18, 19, 20]);
  A.created.length = 0;
  A.run("renderCalView()");
  const c = A.created.filter(e => e.className === "cnt").pop();
  eq(c.textContent, "0명");
});
test("달력 보기 'N명' — 겹치거나 시간 미정이면 셈", async () => {
  const A = await open([12, 18]);
  A.created.length = 0;
  A.run("renderCalView()");
  eq(A.created.filter(e => e.className === "cnt").pop().textContent, "1명");
});

main();
