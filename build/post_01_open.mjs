// 첫 게시물 (1장) — 대외활동 계정 START
// 스타일 기준: card_style_01_sky_minimal.md
// 실행: node build/post_01_open.mjs

import { mkdirSync, writeFileSync, existsSync, statSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';

const BUILD = dirname(fileURLToPath(import.meta.url));
const ROOT = dirname(BUILD);
const FONTS = join(BUILD, 'fonts');
const PHOTOS = join(ROOT, 'input', '사진');

const CHROME = [
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
].find(existsSync);
if (!CHROME) throw new Error('Chrome 실행 파일을 찾지 못했습니다.');

// ─────────────────────────────────────────────────────────────
// 내용
// ─────────────────────────────────────────────────────────────
const HANDLE = 'erai_log'; // 에라이 → e-r-a-i 순서 주의
const CATEGORIES = ['대외활동', '서포터즈', '공모전', '자격증', '일상'];
const BIO_TAGS = ['#대외활동', '#대외활동맞팔', '#서포터즈'];

const url = (p) => pathToFileURL(p).href;
const face = (family, file, { weight = '400', style = 'normal' } = {}) => `
@font-face{font-family:'${family}';src:url('${url(join(FONTS, file))}');font-weight:${weight};font-style:${style};font-display:block;}`;

const FONT_FACES = [
  face('Pretendard', 'Pretendard-Light.otf', { weight: '300' }),
  face('Pretendard', 'Pretendard-Regular.otf'),
  face('Pretendard', 'Pretendard-Medium.otf', { weight: '500' }),
  face('Pretendard', 'Pretendard-SemiBold.otf', { weight: '600' }),
  face('Pretendard', 'Pretendard-Bold.otf', { weight: '700' }),
  face('Pretendard', 'Pretendard-ExtraBold.otf', { weight: '800' }),
  face('Space Grotesk', 'SpaceGrotesk.ttf', { weight: '300 700' }),
].join('\n');

const NOISE = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='240' height='240'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='240' height='240' filter='url(%23n)'/%3E%3C/svg%3E")`;

const HELLO_PHOTO = url(join(PHOTOS, '안녕하세요 사진.jpg'));

// ─────────────────────────────────────────────────────────────
// 카드
// ─────────────────────────────────────────────────────────────
const HTML = `<!doctype html>
<html lang="ko"><head><meta charset="utf-8">
<style>
${FONT_FACES}
*{margin:0;padding:0;box-sizing:border-box;}
html,body{background:#fff;}
body{width:1080px;height:1350px;overflow:hidden;-webkit-font-smoothing:antialiased;}

.card{
  width:1080px;height:1350px;position:relative;overflow:hidden;
  background:linear-gradient(160deg,#F0F7FC 0%,#DCEAF6 52%,#C2DCEF 100%);
  padding:90px 80px;
  display:flex;flex-direction:column;align-items:center;
  font-family:'Pretendard';color:#4E6B82;text-align:center;
}
.noise{position:absolute;inset:0;background-image:${NOISE};opacity:.035;
  mix-blend-mode:multiply;pointer-events:none;}

/* 좌상단 워터마크 */
.wm{position:absolute;top:90px;left:80px;font-family:'Space Grotesk';font-weight:500;
  font-size:27px;letter-spacing:.08em;color:#8FA8BB;}

/* 제목 위 카테고리 소문구 */
.cats{font-weight:500;font-size:29px;color:#5C7B93;letter-spacing:.02em;}
.cats i{font-style:normal;color:#A6BFD2;margin:0 12px;}

/* 네모 박스 제목 */
.boxline{display:flex;justify-content:center;}
.box{
  background:rgba(255,255,255,.86);border:2px solid #0F2C44;border-radius:10px;
  padding:22px 44px;font-weight:800;font-size:92px;color:#0F2C44;
  line-height:1.14;letter-spacing:-.035em;
}
.box-start{
  background:#1F7AC0;border-color:#1F7AC0;color:#fff;
  font-family:'Space Grotesk';font-weight:700;font-size:92px;letter-spacing:.06em;
  line-height:1;padding:30px 58px;
}

/* 인스타 프로필 목업 (네모 카드) */
.mock{
  width:100%;background:#fff;border:1.5px solid rgba(15,44,68,.16);border-radius:14px;
  padding:38px 40px;text-align:left;box-shadow:0 14px 34px rgba(15,44,68,.08);
}
.mock-top{display:flex;align-items:center;gap:32px;}
.pfp{width:126px;height:126px;border-radius:50%;flex:none;
  background:linear-gradient(160deg,#F0F7FC 0%,#DCEAF6 52%,#C2DCEF 100%);
  border:1px solid rgba(15,44,68,.12);}
.stats{flex:1;display:flex;gap:44px;}
.stat{text-align:center;}
.stat b{display:block;font-weight:700;font-size:34px;color:#0F2C44;line-height:1.2;}
.stat span{display:block;font-weight:400;font-size:24px;color:#6B8399;margin-top:4px;}
.mock-name{font-weight:700;font-size:30px;color:#0F2C44;margin-top:26px;}
.mock-bio{font-weight:400;font-size:26px;color:#4E6B82;line-height:1.62;margin-top:10px;}
.mock-tags{font-weight:500;font-size:26px;color:#1F7AC0;margin-top:12px;}

/* 안녕하세요 짤 — 폴라로이드 프레임, 살짝 기울여 겹치기 */
.polaroid{
  position:absolute;right:40px;bottom:430px;width:330px;
  background:#fff;padding:14px 14px 52px;border-radius:6px;
  box-shadow:0 18px 40px rgba(15,44,68,.20);
  transform:rotate(5deg);
}
.polaroid img{display:block;width:100%;height:224px;object-fit:cover;
  object-position:50% 62%;border-radius:3px;}
.polaroid figcaption{position:absolute;left:0;right:0;bottom:14px;text-align:center;
  font-weight:600;font-size:25px;color:#4E6B82;letter-spacing:-.01em;}

.grow{flex:1;}
.foot{width:100%;margin-top:26px;
  display:flex;justify-content:space-between;align-items:center;}
.foot .id{font-family:'Space Grotesk';font-weight:500;font-size:27px;
  letter-spacing:.08em;color:#0F4C7A;}
.foot .meta{font-family:'Space Grotesk';font-weight:500;font-size:23px;
  letter-spacing:.2em;color:#8FA8BB;}
</style></head>
<body>
<div class="card">
  <div class="noise"></div>
  <span class="wm">@${HANDLE}</span>

  <div style="height:96px"></div>

  <div class="cats">${CATEGORIES.join('<i>|</i>')}</div>

  <div class="boxline" style="margin-top:26px"><span class="box">대외활동 계정</span></div>
  <div class="boxline" style="margin-top:20px"><span class="box box-start">START</span></div>

  <div class="grow"></div>

  <figure class="polaroid">
    <img src="${HELLO_PHOTO}" alt="">
    <figcaption>안녕하세요 !</figcaption>
  </figure>

  <div class="mock">
    <div class="mock-top">
      <span class="pfp"></span>
      <span class="stats">
        <span class="stat"><b>0</b><span>게시물</span></span>
        <span class="stat"><b>0</b><span>팔로워</span></span>
        <span class="stat"><b>0</b><span>팔로잉</span></span>
      </span>
    </div>
    <div class="mock-name">에라이 | 대외활동 기록</div>
    <div class="mock-bio">${CATEGORIES.join(' · ')}<br>같이 지원하고 같이 붙어요</div>
    <div class="mock-tags">${BIO_TAGS.join(' ')}</div>
  </div>

  <div class="foot">
    <span class="id">@${HANDLE}</span>
    <span class="meta">2026 · FIRST POST</span>
  </div>
</div>
<script>
  document.fonts.ready.then(() => document.documentElement.setAttribute('data-ready','1'));
</script>
</body></html>`;

// ─────────────────────────────────────────────────────────────
// 렌더
// ─────────────────────────────────────────────────────────────
const htmlPath = join(BUILD, 'html', 'post_01_open.html');
const outDir = join(ROOT, 'output', 'post_01_open');
mkdirSync(dirname(htmlPath), { recursive: true });
mkdirSync(outDir, { recursive: true });

const pngPath = join(outDir, '01_open.png');
writeFileSync(htmlPath, HTML, 'utf8');

execFileSync(
  CHROME,
  [
    '--headless=new',
    '--disable-gpu',
    '--hide-scrollbars',
    '--no-first-run',
    `--user-data-dir=${join(BUILD, '.chrome-profile')}`,
    '--allow-file-access-from-files',
    '--force-device-scale-factor=2',
    '--window-size=1080,1350',
    '--virtual-time-budget=10000',
    `--screenshot=${pngPath}`,
    `${url(htmlPath)}?v=${Date.now()}`, // 캐시 무효화: 없으면 옛 렌더가 그대로 나온다
  ],
  { stdio: 'pipe' }
);

console.log(`  ✓ ${pngPath}  (${(statSync(pngPath).size / 1024).toFixed(0)} KB)`);
