/* 발견 9 — 같은 이름 사람 문서가 둘 생기면 늦게 생긴 쪽 응답이 숨던 것 */
const { boot, test, main, eq, ok, meetDoc, person, Timestamp } = require("./harness");
const D1 = "2026-12-05", D2 = "2026-12-06";

async function open(){
  const A = boot({ m: "m1", seed: F => {
    F.put("meets/m1", meetDoc({ dates: [D1, D2] }));
    F.put("meets/m1/people/p1", person("가", { [D1]: [10] }, { added: new Timestamp(1000), edited: new Timestamp(5000), notes: { [D1]: "먼저" } }));
    F.put("meets/m1/people/p3", person("가", { [D2]: [11] }, { added: new Timestamp(2000), edited: new Timestamp(6000) }));
    F.put("meets/m1/people/p2", person("나", {}, { added: new Timestamp(1500) }));
  } });
  await A.tick();
  return A;
}
const named = (A, n) => A.F.kids("meets/m1/people").filter(k => A.F.get(k).name === n);

test("두 문서의 응답이 다 보임", async () => {
  const A = await open();
  eq(A.run("members()"), ["가", "나"]);
  eq(A.run("hoursOf()['가']"), { [D1]: [10], [D2]: [11] });
  eq(A.run("notesOf()['가']"), { [D1]: "먼저" });
});
test("같은 날을 둘 다 가졌으면 나중에 고친 쪽", async () => {
  const A = await open();
  A.F.put("meets/m1/people/p3", Object.assign(A.F.get("meets/m1/people/p3"), { hours: { [D1]: [12], [D2]: [11] } }));
  await A.tick();
  eq(A.run("hoursOf()['가']"), { [D1]: [12], [D2]: [11] });
});
test("빼기 → 같은 이름 문서가 모두 지워짐 (다시 나타나지 않음)", async () => {
  const A = await open();
  A.run("act({ action: 'member_remove', name: '가' }, '뺐습니다')");
  await A.tick();
  eq(named(A, "가").length, 0);
  eq(A.run("members()"), ["나"]);
});
test("이름 바꾸기 → 같은 이름 문서가 모두 바뀜", async () => {
  const A = await open();
  A.run("act({ action: 'member_rename', from: '가', to: '다' }, '바꿈')");
  await A.tick();
  eq([named(A, "가").length, named(A, "다").length], [0, 2]);
});
test("저장하면 한 문서로 합쳐짐 (응답은 그대로)", async () => {
  const A = await open();
  A.run("pickMe('가'); openDay('" + D1 + "', 'edit'); $('#dmO').onclick();");
  await A.tick();
  const ks = named(A, "가");
  eq(ks.length, 1, "문서 수");
  const p = A.F.get(ks[0]);
  eq([p.hours[D1].length, p.hours[D2], p.notes[D1]], [12, [11], undefined]);
});
test("이름이 하나뿐인 보통 경우는 그대로", async () => {
  const A = await open();
  eq(A.run("buildST().pid['나']"), "p2");
  eq(A.run("buildST().pid['가']"), "p1");
});

main();
