// 스타일 03(모노 네이비) 표지 시안 v2 — 블러 없는 선명한 사진 배경 + 흰 박스 글씨.
// 확정되면 app/cards.mjs 에 정식으로 통합한다.
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

const IMAGE = pathToFileURL(join(ROOT, 'work', '20260803-Apple-오프라인-세션-모집', 'images', 'bright3.jpg')).href;

const face = (family, file, weight) =>
  `@font-face{font-family:'${family}';src:url('${pathToFileURL(join(FONTS, file)).href}');font-weight:${weight};font-display:block;}`;

const CSS = `
*{margin:0;padding:0;box-sizing:border-box;}
body{width:1080px;height:1350px;overflow:hidden;-webkit-font-smoothing:antialiased;font-family:'Pretendard';}
.card{width:1080px;height:1350px;position:relative;padding:90px 80px;display:flex;flex-direction:column;align-items:flex-start;}
.bg{position:absolute;inset:0;z-index:0;width:1080px;height:1350px;object-fit:cover;object-position:center 45%;}

.top{position:relative;z-index:1;display:flex;flex-direction:column;align-items:flex-start;gap:18px;}
.eyebrow{font-family:'Space Grotesk';font-weight:600;font-size:24px;letter-spacing:.28em;text-transform:uppercase;
  color:#0B1E3D;background:#fff;padding:10px 22px;border-radius:999px;}
.tags{display:flex;gap:14px;}
.tag{background:#0B1E3D;color:#fff;border-radius:999px;padding:14px 30px;font-weight:600;font-size:28px;letter-spacing:-.01em;}

.grow{flex:1;min-height:0;}

/* 자막 스타일 — 줄마다 딱 맞는 흰 박스, 사진이 최대한 드러나야 한다. 각지고 투박하게.
   위치는 카드/사진마다 자유롭게 잡는다 — 고정 공식이 아니라 매번 손으로 배치한다. */
.line{position:absolute;background:#fff;padding:9px 18px;border-radius:6px;z-index:1;}
.title-line{font-weight:800;color:#111111;line-height:1.2;letter-spacing:-.03em;font-size:54px;white-space:nowrap;}
.title-line em{font-style:normal;color:#0B1E3D;}
.sub-line{font-weight:600;color:#111111;font-size:30px;}

.foot{position:absolute;left:80px;right:80px;bottom:90px;z-index:1;
  background:#fff;border-radius:18px;padding:20px 32px;box-shadow:0 12px 30px rgba(11,30,61,.16);}
.foot .row{display:flex;justify-content:space-between;align-items:center;}
.foot .id{font-family:'Space Grotesk';font-weight:600;font-size:26px;letter-spacing:.08em;color:#0B1E3D;}
.foot .pg{font-family:'Space Grotesk';font-weight:500;font-size:23px;letter-spacing:.2em;color:#5C5C5C;}
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
  <img class="bg" src="${IMAGE}" alt="">
  <div class="top">
    <div class="eyebrow">RECRUIT · D-3</div>
    <div class="tags"><span class="tag">#대외활동</span><span class="tag">#대기업</span></div>
  </div>
  <span class="line title-line" style="top:490px;left:340px;">시간 들여 활동해도</span>
  <span class="line title-line" style="top:566px;left:280px;"><em>포폴</em>에 담을 게 없다면?</span>
  <span class="line sub-line" style="top:980px;left:80px;">지금 바로 써먹는</span>
  <span class="line sub-line" style="top:1034px;left:80px;">대기업 대외활동만 골랐다</span>
</div>
<div class="foot">
  <div class="row"><span class="id">@erai_log</span><span class="pg">01 / 07</span></div>
</div>
<script>document.fonts.ready.then(()=>document.documentElement.setAttribute('data-ready','1'));</script>
</body></html>`;

const htmlPath = join(BUILD, 'html', 'test_mono_cover.html');
mkdirSync(dirname(htmlPath), { recursive: true });
writeFileSync(htmlPath, html, 'utf8');

const outDir = join(ROOT, 'output', '_style03_test');
mkdirSync(outDir, { recursive: true });
const pngPath = join(outDir, 'cover.png');

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
