/* 바탕 확인 — 가짜 저장소 위에서 약속이 열리고, 내 응답 저장이 사람 문서에 들어가는지 */
const { boot, test, main, eq, ok, meetDoc, person } = require("./harness");
const D1 = "2026-12-05", D2 = "2026-12-06";

test("약속 열기 · 저장", async () => {
  const A = boot({ m: "m1", seed: F => {
    F.put("meets/m1", meetDoc({ dates: [D1, D2] }));
    F.put("meets/m1/people/p1", person("가"));
    F.put("meets/m1/people/p2", person("나", { [D1]: [10, 11] }));
  } });
  await A.tick();
  eq(A.run("members()"), ["가", "나"], "명단");
  A.run("pickMe('가')");
  A.run("dmDate = '" + D1 + "'; $('#dmO').onclick();");     // ○ → 닫으며 저장
  await A.tick();
  const h = A.F.get("meets/m1/people/p1").hours;
  eq(h[D1].length, 12, "○ = 시간대 전부");
});

test("시작 화면(index.html) 띄우기", async () => {
  const A = boot({ m: "m1", index: true, seed: F => {
    F.put("meets/m1", meetDoc({ dates: [D1] }));
    F.put("meets/m1/people/p1", person("가"));
  } });
  await A.tick();
  eq(A.run("meet().title"), "모임");
});

main();
