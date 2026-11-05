/* 발견 11 — 관리자 목록(adminIdx) 의 meets 가 200개를 넘으면 새 약속이 조용히 빠지던 것 (core.js) */
const { boot, test, main, eq, ok } = require("./harness");
const KEY = "a".repeat(64);
const ids = n => Array.from({ length: n }, (_, i) => "m" + i);

test("가득 찬(200개) 목록에 넣기 실패 → 알림", async () => {
  const A = boot({ admin: true, seed: F => F.put("adminIdx/" + KEY, { meets: ids(200) }) });
  await A.run("adminTrack('meets', 'new1')");
  await A.tick();
  ok(!A.F.get("adminIdx/" + KEY).meets.includes("new1"));
  eq(A.lastStatus()[1], "err", "조용히 넘어감");
});
test("여유가 있으면 그대로 넣고 알림 없음", async () => {
  const A = boot({ admin: true, seed: F => F.put("adminIdx/" + KEY, { meets: ids(3) }) });
  const n0 = A.run("__st.length");
  await A.run("adminTrack('meets', 'new1')");
  await A.tick();
  ok(A.F.get("adminIdx/" + KEY).meets.includes("new1"));
  eq(A.run("__st.length"), n0);
});
test("관리자 기기가 아니면 아무것도 안 함", async () => {
  const A = boot({ seed: F => F.put("adminIdx/" + KEY, { meets: ids(200) }) });
  const n0 = A.run("__st.length");
  await A.run("adminTrack('meets', 'new1')");
  await A.tick();
  eq(A.run("__st.length"), n0);
});

main();
