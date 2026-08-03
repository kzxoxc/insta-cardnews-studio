// 인스타 프로필 사진 (1:1) — "erai..."
// 스타일 기준: card_style_01_sky_minimal.md (배경 그라데이션·팔레트 동일)
// 실행: node build/profile_icon.mjs

import { mkdirSync, writeFileSync, existsSync, statSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';

const BUILD = dirname(fileURLToPath(import.meta.url));
const ROOT = dirname(BUILD);
const FONTS = join(BUILD, 'fonts');

const CHROME = [
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
].find(existsSync);
if (!CHROME) throw new Error('Chrome 실행 파일을 찾지 못했습니다.');

const SIZE = 1080; // 업로드는 정사각, 인스타가 원형으로 잘라서 보여준다
const url = (p) => pathToFileURL(p).href;

const FONT_FACES = `
@font-face{font-family:'Space Grotesk';src:url('${url(join(FONTS, 'SpaceGrotesk.ttf'))}');
  font-weight:300 700;font-display:block;}`;

// 원형으로 잘릴 때 잘려나가지 않도록, 글자는 내접원 안쪽에만 둔다
const card = (circleMask) => `<!doctype html>
<html lang="ko"><head><meta charset="utf-8">
<style>
${FONT_FACES}
*{margin:0;padding:0;box-sizing:border-box;}
html,body{background:${circleMask ? '#fff' : 'transparent'};}
body{width:${SIZE}px;height:${SIZE}px;overflow:hidden;-webkit-font-smoothing:antialiased;}
.icon{
  width:${SIZE}px;height:${SIZE}px;
  background:linear-gradient(160deg,#F0F7FC 0%,#DCEAF6 52%,#C2DCEF 100%);
  display:flex;align-items:center;justify-content:center;
  ${circleMask ? 'border-radius:50%;' : ''}
}
.wordmark{
  font-family:'Space Grotesk';font-weight:700;font-size:242px;
  letter-spacing:-.03em;line-height:1;color:#0F2C44;
  transform:translateY(-.04em);
}
.wordmark em{font-style:normal;color:#1F7AC0;letter-spacing:.02em;}
</style></head>
<body>
  <div class="icon"><span class="wordmark">erai<em>...</em></span></div>
  <script>document.fonts.ready.then(()=>document.documentElement.setAttribute('data-ready','1'));</script>
</body></html>`;

const outDir = join(ROOT, 'output', 'profile');
mkdirSync(outDir, { recursive: true });
mkdirSync(join(BUILD, 'html'), { recursive: true });

// [업로드용] 정사각 / [확인용] 원형 크롭 미리보기
for (const [name, circleMask] of [
  ['profile_square', false],
  ['profile_circle_preview', true],
]) {
  const htmlPath = join(BUILD, 'html', `${name}.html`);
  const pngPath = join(outDir, `${name}.png`);
  writeFileSync(htmlPath, card(circleMask), 'utf8');

  execFileSync(
    CHROME,
    [
      '--headless=new',
      '--disable-gpu',
      '--hide-scrollbars',
      '--no-first-run',
      `--user-data-dir=${join(BUILD, '.chrome-profile')}`,
      '--force-device-scale-factor=1',
      `--window-size=${SIZE},${SIZE}`,
      '--virtual-time-budget=8000',
      `--screenshot=${pngPath}`,
      `${url(htmlPath)}?v=${Date.now()}`, // 캐시 무효화: 없으면 옛 렌더가 그대로 나온다
    ],
    { stdio: 'pipe' }
  );

  console.log(`  ✓ ${name}.png  (${(statSync(pngPath).size / 1024).toFixed(0)} KB)`);
}

console.log(`\n완료 → ${outDir}`);
