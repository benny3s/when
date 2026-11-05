"""약속 잡자 시험 실행기 — test/t_*.js 를 node 로 하나씩 돌리고 통과·실패 수를 더한다.
쓰는 법: python test/run.py [t_이름.js ...]"""
import os, re, subprocess, sys

try:
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")
except Exception:
    pass
HERE = os.path.dirname(os.path.abspath(__file__))
NODE = r"C:\Program Files\nodejs\node.exe"
if not os.path.exists(NODE):
    NODE = "node"

files = sys.argv[1:] or sorted(f for f in os.listdir(HERE) if f.startswith("t_") and f.endswith(".js"))
tp = tf = 0
bad = []
for f in files:
    print("==", f)
    r = subprocess.run([NODE, os.path.join(HERE, os.path.basename(f))], capture_output=True, text=True, encoding="utf-8", timeout=120)
    sys.stdout.write(r.stdout)
    if r.stderr.strip():
        sys.stdout.write(r.stderr)
    m = re.search(r"RESULT (\d+) (\d+)", r.stdout)
    if not m:
        bad.append(f)
        tf += 1
        continue
    tp += int(m.group(1))
    tf += int(m.group(2))
print("TOTAL pass=%d fail=%d%s" % (tp, tf, (" (안 끝난 파일: " + ", ".join(bad) + ")") if bad else ""))
sys.exit(1 if tf else 0)
