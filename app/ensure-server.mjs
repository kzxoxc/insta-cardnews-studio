// 서버가 안 떠 있으면 백그라운드로 띄운다. 이미 떠 있으면 아무것도 안 한다.
// SessionStart 훅이 이걸 부른다 (.claude/settings.local.json).
// 직접 실행도 가능: node app/ensure-server.mjs

import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const APP = dirname(fileURLToPath(import.meta.url));
const ROOT = dirname(APP);
const PORT = Number(process.env.PORT) || 3000;
const URL_ = `http://127.0.0.1:${PORT}`;

/** 훅 출력 규약 — systemMessage 는 사용자에게 한 줄로 보인다 */
const say = (msg) => process.stdout.write(JSON.stringify({ systemMessage: msg }));

async function isUp() {
  try {
    const c = new AbortController();
    const t = setTimeout(() => c.abort(), 1500);
    const res = await fetch(`${URL_}/api/projects`, { signal: c.signal });
    clearTimeout(t);
    return res.ok;
  } catch {
    return false;
  }
}

if (await isUp()) {
  say(`카드뉴스 스튜디오 이미 실행 중 — ${URL_}`);
  process.exit(0);
}

// detached + unref: 이 프로세스가 끝나도 서버는 계속 산다
const child = spawn(process.execPath, [join(APP, 'server.mjs')], {
  cwd: ROOT,
  detached: true,
  stdio: 'ignore',
  windowsHide: true,
});
child.unref();

// 실제로 떴는지 잠깐 확인한다 (포트 충돌 같은 실패를 조용히 넘기지 않게)
for (let i = 0; i < 12; i++) {
  await new Promise((r) => setTimeout(r, 400));
  if (await isUp()) {
    say(`카드뉴스 스튜디오 시작됨 — ${URL_}`);
    process.exit(0);
  }
}

say(`카드뉴스 스튜디오를 띄우지 못했습니다. 터미널에서 "node app/server.mjs" 로 직접 확인하세요.`);
