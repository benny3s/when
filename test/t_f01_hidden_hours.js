/* 발견 1 — 시간대를 좁힌 뒤 ✕ · 미정 · △ 를 누르면 시간대 밖 옛 시간이 그대로 저장되던 것 */
const { boot, test, main, eq, meetDoc, person } = require("./harness");
const D1 = "2026-12-05", D2 = "2026-12-06";
const ALL = [10,11,12,13,14,15,16,17,18,19,20,21];

/* 가 = 10–22시 ○ 로 넣어 둠 → 그 뒤 그날 시간대가 18–22 로 바뀜 */
async function open(){
  const A = boot({ m: "m1", seed: F => {
    F.put("meets/m1", meetDoc({ dates: [D1, D2], windows: { [D1]: [18, 22] } }));
    F.put("meets/m1/people/p1", person("가", { [D1]: ALL, [D2]: [10] }));
  } });
  await A.tick();
  A.run("pickMe('가')");
  return A;
}
const press = (A, btn) => { A.run("openDay('" + D1 + "', 'edit'); $('#" + btn + "').onclick(); closeDay();"); return A.tick(); };

test("✕ → 그날 hours = [] (시간대 밖 10–17시가 남지 않음)", async () => {
  const A = await open(); await press(A, "dmX");
  eq(A.F.get("meets/m1/people/p1").hours[D1], []);
});
test("– 미정 → 그날 응답이 지워짐", async () => {
  const A = await open(); await press(A, "dmN");
  eq(A.F.get("meets/m1/people/p1").hours[D1], undefined);
});
test("△ (○ 였던 날) → 시간 미정 [-1]", async () => {
  const A = await open(); await press(A, "dmT");
  eq(A.F.get("meets/m1/people/p1").hours[D1], [-1]);
});
test("△ 에서 시간 칸을 다 끄면 시간 미정 [-1] (시간대 밖 옛 시간 때문에 묻히지 않음)", async () => {
  const A = boot({ m: "m1", seed: F => {
    F.put("meets/m1", meetDoc({ dates: [D1, D2], windows: { [D1]: [18, 22] } }));
    F.put("meets/m1/people/p1", person("가", { [D1]: [12, 13, 19], [D2]: [10] }));
  } });
  await A.tick(); A.run("pickMe('가')");
  /* 19시만 켜진 △ → 여러 구간 방식으로 19시 칸을 끈다 */
  A.run("openDay('" + D1 + "', 'edit'); dmMulti = true; renderDmHours();");
  const b19 = A.created.filter(e => e.dataset && e.dataset.h === 19).pop();
  b19.onclick();
  A.run("closeDay()"); await A.tick();
  eq(A.F.get("meets/m1/people/p1").hours[D1], [-1]);
});
test("○ 는 그대로 (옛 데이터 · 시간대 밖 시간은 지키는 동작 유지)", async () => {
  const A = await open(); await press(A, "dmO");
  eq(A.F.get("meets/m1/people/p1").hours[D1], ALL);
});

main();
