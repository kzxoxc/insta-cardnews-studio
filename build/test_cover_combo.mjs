// 여자 짤(원본 그대로) 위 + 그 아래 좁은 틈에 멘트 + 자전거 짤은 동그랗게 잘라서 배치.
import { writeFileSync, mkdirSync, existsSync } from 'node:fs';
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

const SLUG = '20260804-이번주-마감임박-대외활동-6';
const IMG_GIRL = pathToFileURL(join(ROOT, 'work', SLUG, 'images', 'card01_1785826690404.png')).href;
const IMG_BIKE = pathToFileURL(join(ROOT, 'work', SLUG, 'images', 'card01_1785828345825.png')).href;

const face = (family, file, weight) =>
  `@font-face{font-family:'${family}';src:url('${pathToFileURL(join(FONTS, file)).href}');font-weight:${weight};font-display:block;}`;

// ── 배치 값 — 반복 조정 ──────────────────────────────
const GIRL_TOP = 0;
const GIRL_H = 780;       // 680x510 원본비율로 1080폭 → 810, 살짝 줄여서 780
const TEXT_TOP = GIRL_H + 40;
const CIRCLE_SIZE = 260;
const CIRCLE_TOP = GIRL_H + 30;
const CIRCLE_RIGHT = 80;

const CSS = `
*{margin:0;padding:0;box-sizing:border-box;}
body{width:1080px;height:1350px;overflow:hidden;-webkit-font-smoothing:antialiased;font-family:'Pretendard';}
.card{width:1080px;height:1350px;position:relative;background:#fff;}

.top{position:absolute;top:36px;left:80px;z-index:2;display:flex;flex-direction:column;align-items:flex-start;gap:14px;}
.eyebrow{font-family:'Space Grotesk';font-weight:600;font-size:22px;letter-spacing:.26em;text-transform:uppercase;
  color:#fff;text-shadow:0 1px 6px rgba(0,0,0,.45);}
.tags{display:flex;gap:12px;}
.tag{background:rgba(11,30,61,.85);color:#fff;border-radius:999px;padding:10px 22px;font-weight:600;font-size:23px;letter-spacing:-.01em;}

.girl{position:absolute;top:${GIRL_TOP}px;left:0;width:1080px;height:${GIRL_H}px;object-fit:cover;object-position:center 20%;z-index:0;}

.circle{position:absolute;top:${CIRCLE_TOP}px;right:${CIRCLE_RIGHT}px;width:${CIRCLE_SIZE}px;height:${CIRCLE_SIZE}px;
  border-radius:50%;object-fit:cover;object-position:center 30%;z-index:1;border:6px solid #fff;
  box-shadow:0 10px 26px rgba(11,30,61,.22);}

.title{position:absolute;top:${TEXT_TOP}px;left:80px;width:560px;z-index:1;
  font-weight:800;color:#111;line-height:1.24;letter-spacing:-.03em;font-size:52px;}
.title em{font-style:normal;color:#0B1E3D;}
.sub{position:absolute;top:${TEXT_TOP + 190}px;left:80px;width:560px;z-index:1;
  font-weight:500;color:#4E6B82;font-size:28px;line-height:1.6;}

.foot{position:absolute;left:80px;right:80px;bottom:60px;z-index:1;
  display:flex;justify-content:space-between;align-items:center;}
.foot .id{font-family:'Space Grotesk';font-weight:600;font-size:26px;letter-spacing:.08em;color:#0B1E3D;}
.foot .pg{font-family:'Space Grotesk';font-weight:500;font-size:23px;letter-spacing:.2em;color:#8FA8BB;}
`;

const html = `<!doctype html>
<html lang="ko"><head><meta charset="utf-8"><style>
${face('Pretendard', 'Pretendard-ExtraBold.otf', '800')}
${face('Pretendard', 'Pretendard-Medium.otf', '500')}
${face('Pretendard', 'Pretendard-SemiBold.otf', '600')}
${face('Space Grotesk', 'SpaceGrotesk.ttf', '300 700')}
${CSS}
</style></head>
<body>
<div class="card">
  <img class="girl" src="${IMG_GIRL}" alt="">
  <div class="top">
    <div class="eyebrow">PICK · 8월 1주차</div>
    <div class="tags"><span class="tag">#대외활동</span><span class="tag">#마감임박</span></div>
  </div>
  <img class="circle" src="${IMG_BIKE}" alt="">
  <div class="title">놓치면 아까운<br><em>대외활동 6</em></div>
  <div class="sub">마감 빠른 순으로만 골랐다</div>
  <div class="foot">
    <span class="id">@erai_log</span>
    <span class="pg">01 / 08</span>
  </div>
</div>
<script>document.fonts.ready.then(()=>document.documentElement.setAttribute('data-ready','1'));</script>
</body></html>`;

const htmlPath = join(BUILD, 'html', 'test_cover_combo.html');
mkdirSync(dirname(htmlPath), { recursive: true });
writeFileSync(htmlPath, html, 'utf8');

const outDir = join(ROOT, 'output', '_style03_test');
mkdirSync(outDir, { recursive: true });
const pngPath = join(outDir, 'cover_combo.png');

execFileSync(CHROME, [
  '--headless=new', '--disable-gpu', '--hide-scrollbars', '--no-first-run',
  `--user-data-dir=${join(BUILD, '.chrome-profile')}`,
  '--allow-file-access-from-files',
  '--force-device-scale-factor=2',
  '--window-size=1080,1350',
  '--virtual-time-budget=8000',
  `--screenshot=${pngPath}`,
  `${pathToFileURL(htmlPath).href}?v=${Date.now()}`,
], { stdio: 'pipe' });

console.log('✓', pngPath);
