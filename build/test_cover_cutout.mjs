// 자전거 짤 배경(하늘·난간) 제거 후 오른쪽에 배치 + 왼쪽에 우리 멘트.
// 배경 제거는 Canvas로 직접 한다 (밝고 채도 낮은 픽셀 = 배경으로 보고 투명 처리).
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
const IMAGE = pathToFileURL(join(ROOT, 'work', SLUG, 'images', 'card01_1785828345825.png')).href;

const face = (family, file, weight) =>
  `@font-face{font-family:'${family}';src:url('${pathToFileURL(join(FONTS, file)).href}');font-weight:${weight};font-display:block;}`;

const CSS = `
*{margin:0;padding:0;box-sizing:border-box;}
body{width:1080px;height:1350px;overflow:hidden;-webkit-font-smoothing:antialiased;font-family:'Pretendard';}
.card{width:1080px;height:1350px;position:relative;background:#fff;}

.top{position:absolute;top:60px;left:80px;z-index:1;display:flex;flex-direction:column;align-items:flex-start;gap:16px;}
.eyebrow{font-family:'Space Grotesk';font-weight:600;font-size:24px;letter-spacing:.28em;text-transform:uppercase;color:#0B1E3D;}
.tags{display:flex;gap:14px;}
.tag{background:#0B1E3D;color:#fff;border-radius:999px;padding:12px 26px;font-weight:600;font-size:26px;letter-spacing:-.01em;}

#cutout{position:absolute;z-index:0;}

.line{position:absolute;background:transparent;padding:0;z-index:1;}
.title-line{font-weight:800;color:#111111;line-height:1.22;letter-spacing:-.03em;font-size:64px;}
.title-line em{font-style:normal;color:#0B1E3D;}
.sub-line{font-weight:500;color:#4E6B82;font-size:32px;line-height:1.6;}

.foot{position:absolute;left:80px;right:80px;bottom:70px;z-index:1;
  display:flex;justify-content:space-between;align-items:center;}
.foot .id{font-family:'Space Grotesk';font-weight:600;font-size:26px;letter-spacing:.08em;color:#0B1E3D;}
.foot .pg{font-family:'Space Grotesk';font-weight:500;font-size:23px;letter-spacing:.2em;color:#8FA8BB;}
`;

// ── 배치 값 — 반복 조정 ──────────────────────────────
const CUTOUT_RIGHT = -40;   // 카드 오른쪽 기준 (음수면 밖으로 살짝 나가게)
const CUTOUT_TOP = 520;
const CUTOUT_W = 640;

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
  <div class="top">
    <div class="eyebrow">PICK · 8월 1주차</div>
    <div class="tags"><span class="tag">#대외활동</span><span class="tag">#마감임박</span></div>
  </div>

  <canvas id="cutout" style="right:${CUTOUT_RIGHT}px;top:${CUTOUT_TOP}px;width:${CUTOUT_W}px;"></canvas>

  <span class="line title-line" style="top:600px;left:80px;width:480px;">놓치면<br>아까운<br><em>대외활동 6</em></span>
  <span class="line sub-line" style="top:900px;left:80px;width:420px;">마감 빠른 순으로만<br>골랐다</span>

  <div class="foot">
    <span class="id">@erai_log</span>
    <span class="pg">01 / 08</span>
  </div>
</div>
<script>
const img = new Image();
img.onload = () => {
  // 원본 해상도로 처리한 뒤 CSS로 축소 표시 (화질 유지)
  const off = document.createElement('canvas');
  off.width = img.naturalWidth; off.height = img.naturalHeight;
  const octx = off.getContext('2d');
  octx.drawImage(img, 0, 0);
  const data = octx.getImageData(0, 0, off.width, off.height);
  const p = data.data;
  for (let i = 0; i < p.length; i += 4) {
    const r = p[i], g = p[i+1], b = p[i+2];
    const max = Math.max(r,g,b), min = Math.min(r,g,b);
    const lightness = (max + min) / 2;
    const sat = max - min;
    // 밝고 채도 낮은 픽셀(하늘, 난간) = 배경으로 보고 투명화
    if (lightness > 150 && sat < 45) {
      p[i+3] = 0;
    }
  }
  octx.putImageData(data, 0, 0);

  const out = document.getElementById('cutout');
  out.width = off.width; out.height = off.height;
  out.style.height = (out.width ? (${CUTOUT_W} * off.height / off.width) : 0) + 'px';
  out.getContext('2d').drawImage(off, 0, 0);
  document.fonts.ready.then(() => document.documentElement.setAttribute('data-ready', '1'));
};
img.src = '${IMAGE}';
</script>
</body></html>`;

const htmlPath = join(BUILD, 'html', 'test_cover_cutout.html');
mkdirSync(dirname(htmlPath), { recursive: true });
writeFileSync(htmlPath, html, 'utf8');

const outDir = join(ROOT, 'output', '_style03_test');
mkdirSync(outDir, { recursive: true });
const pngPath = join(outDir, 'cover_cutout.png');

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
