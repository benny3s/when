/* 발견 5 — 설정 '저장' 이 열 때의 fixed · 이름 · 장소 · 메모를 다시 보내던 것 (index.html) */
const { boot, test, main, eq, meetDoc, person } = require("./harness");
const F1 = "2026-12-05 18:00~20:00", F2 = "2026-12-06 18:00~20:00";

async function open(){
  const A = boot({ m: "m1", index: true, seed: F => {
    F.put("meets/m1", meetDoc({ dates: ["2026-12-05", "2026-12-06"], fixed: F1, place: "역 앞" }));
    F.put("meets/m1/people/p1", person("가"));
  } });
  await A.tick();
  A.run("openModal('setModal')");               // A 가 ⚙ 설정을 열어 둠
  return A;
}

test("열어 둔 사이 남이 📌 정한 것이 메모 저장으로 지워지지 않음", async () => {
  const A = await open();
  A.F.put("meets/m1", Object.assign(A.F.get("meets/m1"), { fixed: F1 + ", " + F2, place: "새 장소" }));   // B 가 📌 · 장소
  await A.tick();
  A.run("$('#s_memo').value = '2차까지'; $('#s_save').onclick();");
  await A.tick();
  const m = A.F.get("meets/m1");
  eq([m.memo, m.fixed, m.place], ["2차까지", F1 + ", " + F2, "새 장소"]);
});
test("고친 칸은 보냄 (이름 · 📌)", async () => {
  const A = await open();
  A.run("$('#s_title').value = '송년회'; $('#s_fixed').value = ''; $('#s_save').onclick();");
  await A.tick();
  const m = A.F.get("meets/m1");
  eq([m.title, m.fixed, m.place], ["송년회", "", "역 앞"]);
});
test("이름을 비우면 막음", async () => {
  const A = await open();
  A.run("$('#s_title').value = '  '; $('#s_save').onclick();");
  await A.tick();
  eq(A.F.get("meets/m1").title, "모임");
  eq(A.lastStatus()[1], "err");
});

main();
