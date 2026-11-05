/* 재검토 3 — 응답 초기화가 같은 이름 중복 문서를 그대로 둬서 지운 응답이 다시 보이던 것 */
const { boot, test, main, eq, meetDoc, person, Timestamp } = require("./harness");
const D1 = "2026-12-05", D2 = "2026-12-06";

test("같은 이름 문서가 둘이면 초기화 뒤 응답이 다시 보이지 않음", async () => {
  const A = boot({ m: "m1", seed: F => {
    F.put("meets/m1", meetDoc({ dates: [D1, D2] }));
    F.put("meets/m1/people/p1", person("가", { [D1]: [10] }, { added: new Timestamp(1000) }));
    F.put("meets/m1/people/p3", person("가", { [D2]: [11] }, { added: new Timestamp(2000), notes: { [D2]: "늦게" } }));
    F.put("meets/m1/people/p2", person("나", { [D1]: [12] }, { added: new Timestamp(1500) }));
  } });
  await A.tick();
  A.run("act({ action: 'reset_answers' }, '지움')"); await A.tick();
  eq(A.lastStatus()[1], "ok");
  eq(A.run("hoursOf()"), {});
  eq(A.run("notesOf()"), {});
  eq(A.run("members()"), ["가", "나"]);
  eq(A.F.kids("meets/m1/people").sort(), ["meets/m1/people/p1", "meets/m1/people/p2"]);
});

main();
