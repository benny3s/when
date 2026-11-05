/* 발견 7 — 📌 가 17개를 넘으면 fixed 가 400자에서 잘려 조용히 깨지던 것 */
const { boot, test, main, eq, ok, meetDoc, person } = require("./harness");
const days = []; for (let i = 1; i <= 20; i++) days.push("2026-12-" + String(i).padStart(2, "0"));
const fx = d => d + " 18:00~20:00";
const SIXTEEN = days.slice(0, 16).map(fx).join(", ");      // 382자

async function open(){
  const A = boot({ m: "m1", seed: F => {
    F.put("meets/m1", meetDoc({ dates: days, fixed: SIXTEEN }));
    F.put("meets/m1/people/p1", person("가"));
  } });
  await A.tick();
  return A;
}

test("17번째 📌 → 막고 알림, 저장된 값은 그대로", async () => {
  const A = await open();
  A.run("setFixes(fixes().concat(['" + fx(days[16]) + "']), '확정')");
  await A.tick();
  eq(A.F.get("meets/m1").fixed, SIXTEEN, "잘린 값이 저장됨");
  eq(A.lastStatus()[1], "err", "알림 없음");
  eq(A.run("meet().fixed"), SIXTEEN, "화면 값");
});
test("설정 창 등에서 400자 넘는 fixed 를 보내도 잘라 넣지 않음", async () => {
  const A = await open();
  const long = days.slice(0, 17).map(fx).join(", ");
  A.run("act({ action: 'meet_set', fixed: " + JSON.stringify(long) + " }, '저장됨')");
  await A.tick();
  eq(A.F.get("meets/m1").fixed, SIXTEEN, "잘린 값이 저장됨");
  eq(A.lastStatus()[1], "err");
});
test("16번째까지는 정해짐", async () => {
  const A = boot({ m: "m1", seed: F => {
    F.put("meets/m1", meetDoc({ dates: days, fixed: days.slice(0, 15).map(fx).join(", ") }));
  } });
  await A.tick();
  A.run("setFixes(fixes().concat(['" + fx(days[15]) + "']), '확정')");
  await A.tick();
  eq(A.F.get("meets/m1").fixed, SIXTEEN);
});

main();
