/* 재검토 5 — 전부 '미정' 으로 바꾸고 떠나면 숨김 이벤트 둘이 확인창을 서로 닫아 화면이 되돌아가던 것 */
const { boot, test, main, eq, meetDoc, person } = require("./harness");
const D1 = "2026-12-05", D2 = "2026-12-06";

async function open(){
  const A = boot({ m: "m1", seed: F => {
    F.put("meets/m1", meetDoc({ dates: [D1, D2] }));
    F.put("meets/m1/people/p1", person("가", { [D1]: [10] }));
  } });
  await A.tick(); A.run("pickMe('가')"); await A.tick();
  A.run("var __asks = 0, __ask0 = ask; ask = function(o){ __asks++; return __ask0(o); };");
  return A;
}
/* 창을 연 채 미정으로 — 전부 미정이 된다 */
const unset = A => A.run("openDay('" + D1 + "', 'edit'); $('#dmN').onclick();");
function leave(A){
  A.ctx.document.visibilityState = "hidden";
  (A.docEv.visibilitychange || []).forEach(f => f());
  (A.winEv.pagehide || []).forEach(f => f());
}
function back(A){
  A.ctx.document.visibilityState = "visible";
  (A.docEv.visibilitychange || []).forEach(f => f());
}
const pw = A => A.F.writes.filter(w => w.path.indexOf("/people/") > 0).length;

test("전부 미정으로 떠나면 묻지 않고 보류 — 쓰지 않고 입력도 안 되돌림", async () => {
  const A = await open();
  const n0 = pw(A);
  unset(A); leave(A); await A.tick();
  eq(A.run("__asks"), 0, "확인창");
  eq(pw(A), n0, "쓰기");
  eq(A.F.get("meets/m1/people/p1").hours[D1], [10], "서버 값");
  eq([A.run("dirty"), A.run("myHours('" + D1 + "')")], [true, []], "입력");
});
test("돌아와서 창을 닫으면 그때 묻고 — '되돌리기' 면 지움", async () => {
  const A = await open();
  unset(A); leave(A); await A.tick(); back(A); await A.tick();
  eq(A.run("__asks"), 0, "돌아오자마자 묻지 않음");
  A.run("ask = function(o){ __asks++; return Promise.resolve(true); }; $('#dmClose').onclick();"); await A.tick();
  eq(A.run("__asks"), 1, "확인창");
  eq(A.F.get("meets/m1/people/p1").hours[D1], undefined);
  eq(A.run("dirty"), false);
});
test("돌아와서 창을 닫으며 '취소' 면 원래 응답으로", async () => {
  const A = await open();
  unset(A); leave(A); await A.tick(); back(A); await A.tick();
  A.run("ask = function(o){ __asks++; return Promise.resolve(false); }; $('#dmClose').onclick();"); await A.tick();
  eq(A.F.get("meets/m1/people/p1").hours[D1], [10]);
  eq([A.run("dirty"), A.run("myHours('" + D1 + "')")], [false, [10]]);
});
test("확인창이 떠 있는 채 떠나도 그 창이 닫히지 않음", async () => {
  const A = await open();
  unset(A); A.run("$('#dmClose').onclick();"); await A.tick();
  eq(A.run("__asks"), 1, "닫을 때 물음");
  leave(A); await A.tick();
  eq(A.run("__asks"), 1, "떠날 때 또 묻지 않음");
  eq([A.run("dirty"), A.run("myHours('" + D1 + "')")], [true, []], "입력");
});
test("보통 입력은 같은 떠남에 한 번만 저장", async () => {
  const A = await open();
  const n0 = pw(A);
  A.run("openDay('" + D2 + "', 'edit'); $('#dmX').onclick();");
  leave(A); await A.tick();
  eq(pw(A) - n0, 1, "쓰기 수");
  eq(A.F.get("meets/m1/people/p1").hours[D2], []);
  eq(A.run("__asks"), 0);
});

main();
