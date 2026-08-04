// "이번 주 마감임박" 표지 — 짤을 원본 비율 그대로(크롭 없이) 위에 놓고, 멘트는 그 아래.
// 위치는 매번 손으로 조정한다 (사용자가 반복 확인하며 값을 바꿔달라고 요청하는 방식).
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
const IMAGE = pathToFileURL(join(ROOT, 'work', SLUG, 'images', 'card01_1785826690404.png')).href;

const face = (family, file, weight) =>
  `@font-face{font-family:'${family}';src:url('${pathToFileURL(join(FONTS, file)).href}');font-weight:${weight};font-display:block;}`;

// ── 여기 값만 바꿔가며 반복 확인한다 ──────────────────────────
const IMG_TOP = 150;      // 사진 시작 y
const IMG_W = 1080;       // 사진 너비 (카드 폭 꽉 채움)
const IMG_H = 810;        // 사진 높이 (680x510 원본 비율 그대로 = 1080 x 810)
const TITLE_TOP = 1010;
const SUB_TOP = 1170;

const CSS = `
*{margin:0;padding:0;box-sizing:border-box;}
body{width:1080px;height:1350px;overflow:hidden;-webkit-font-smoothing:antialiased;font-family:'Pretendard';}
.card{width:1080px;height:1350px;position:relative;background:#fff;}

.top{position:absolute;top:60px;left:80px;z-index:1;display:flex;flex-direction:column;align-items:flex-start;gap:16px;}
.eyebrow{font-family:'Space Grotesk';font-weight:600;font-size:24px;letter-spacing:.28em;text-transform:uppercase;color:#0B1E3D;}
.tags{display:flex;gap:14px;}
.tag{background:#0B1E3D;color:#fff;border-radius:999px;padding:12px 26px;font-weight:600;font-size:26px;letter-spacing:-.01em;}

.photo{position:absolute;left:0;z-index:0;width:${IMG_W}px;height:${IMG_H}px;object-fit:contain;background:#EDF3F8;}

.line{position:absolute;background:#fff;padding:9px 18px;border-radius:6px;z-index:1;}
.title-line{font-weight:800;color:#111111;line-height:1.2;letter-spacing:-.03em;font-size:56px;white-space:nowrap;}
.title-line em{font-style:normal;color:#0B1E3D;}
.sub-line{font-weight:600;color:#333;font-size:30px;white-space:nowrap;}

.foot{position:absolute;left:80px;right:80px;bottom:70px;z-index:1;
  display:flex;justify-content:space-between;align-items:center;}
.foot .id{font-family:'Space Grotesk';font-weight:600;font-size:26px;letter-spacing:.08em;color:#0B1E3D;}
.foot .pg{font-family:'Space Grotesk';font-weight:500;font-size:23px;letter-spacing:.2em;color:#8FA8BB;}
`;

const html = `<!doctype html>
<html lang="ko"><head><meta charset="utf-8"><style>
${face('Pretendard', 'Pretendard-ExtraBold.otf', '800')}
${face('Pretendard', 'Pretendard-SemiBold.otf', '600')}
${face('Space Grotesk', 'SpaceGrotesk.ttf', '300 700')}
${CSS}
</style></head>
<body>
<div class="card">
  <img class="photo" src="${IMAGE}" alt="" style="top:${IMG_TOP}px;">
  <div class="top">
    <div class="eyebrow">PICK · 8월 1주차</div>
    <div class="tags"><span class="tag">#대외활동</span><span class="tag">#마감임박</span></div>
  </div>
  <span class="line title-line" style="top:${TITLE_TOP}px;left:80px;">놓치면 아까운</span>
  <span class="line title-line" style="top:${TITLE_TOP + 66}px;left:80px;">대외활동 <em>6가지</em></span>
  <span class="line sub-line" style="top:${SUB_TOP}px;left:80px;">마감 빠른 순으로만 골랐다</span>
  <div class="foot">
    <span class="id">@erai_log</span>
    <span class="pg">01 / 08</span>
  </div>
</div>
<script>document.fonts.ready.then(()=>document.documentElement.setAttribute('data-ready','1'));</script>
</body></html>`;

const htmlPath = join(BUILD, 'html', 'test_cover_stack.html');
mkdirSync(dirname(htmlPath), { recursive: true });
writeFileSync(htmlPath, html, 'utf8');

const outDir = join(ROOT, 'output', '_style03_test');
mkdirSync(outDir, { recursive: true });
const pngPath = join(outDir, 'cover_stack.png');

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
