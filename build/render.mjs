// 인스타 카드뉴스 렌더러 (스타일 비교용 샘플 3세트)
// 스타일 01은 card_style_01_sky_minimal.md 의 기준을 그대로 구현한다.
// 스타일 02(아이보리)·03(다크네온)은 기준 md가 삭제된 레거시 — 유지보수 대상 아님.
// 실행: node build/render.mjs

import { mkdirSync, writeFileSync, existsSync, statSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';

const BUILD = dirname(fileURLToPath(import.meta.url));
const ROOT = dirname(BUILD);
const FONTS = join(BUILD, 'fonts');
const HTML_DIR = join(BUILD, 'html');
const OUT = join(ROOT, 'output');

const CHROME = [
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
].find(existsSync);
if (!CHROME) throw new Error('Chrome 실행 파일을 찾지 못했습니다.');

// ─────────────────────────────────────────────────────────────
// 1. 카드 내용 (3가지 스타일 모두 동일한 데이터를 참조)
// ─────────────────────────────────────────────────────────────
const HANDLE = '@erai_log'; // 에라이 → e-r-a-i 순서 주의 (eari_log 아님)

const CONTENT = {
  handle: HANDLE,
  titleLead: '대외활동 계정',
  titlePoint: '시작 !!',
  subtitle: '에라이 모르겠다 ...',
  tags: ['대외활동', '대외활동맞팔', '서포터즈'],
  extraTags: ['대외활동스타그램', '서포터즈모집', '공모전'],
  topics: ['대외활동', '공모전', '서포터즈', '자격증', '일상공유'],
  card2Lead: '이 계정에서',
  card2Point: '다룰 내용',
  card3Lead: '맞팔',
  card3Point: '환영 ♡',
  card3Sub: '같이 지원하고 같이 붙어요',
};
const ALL_TAGS = [...CONTENT.tags, ...CONTENT.extraTags];

// ─────────────────────────────────────────────────────────────
// 2. 로컬 폰트 (@font-face) — md 지시대로 CDN 대신 로컬 파일 참조
// ─────────────────────────────────────────────────────────────
const fontUrl = (file) => pathToFileURL(join(FONTS, file)).href;

const face = (family, file, { weight = '400', style = 'normal' } = {}) => `
@font-face{font-family:'${family}';src:url('${fontUrl(file)}');font-weight:${weight};font-style:${style};font-display:block;}`;

const FONT_FACES = [
  face('Jua', 'Jua-Regular.ttf'),
  face('Gowun Dodum', 'GowunDodum-Regular.ttf'),
  face('Nanum Myeongjo', 'NanumMyeongjo-Regular.ttf'),
  face('Nanum Myeongjo', 'NanumMyeongjo-Bold.ttf', { weight: '700' }),
  face('Black Han Sans', 'BlackHanSans-Regular.ttf'),
  face('Playfair Display', 'PlayfairDisplay.ttf', { weight: '400 900' }),
  face('Playfair Display', 'PlayfairDisplay-Italic.ttf', { weight: '400 900', style: 'italic' }),
  face('Space Grotesk', 'SpaceGrotesk.ttf', { weight: '300 700' }),
  face('Pretendard', 'Pretendard-Light.otf', { weight: '300' }),
  face('Pretendard', 'Pretendard-Regular.otf'),
  face('Pretendard', 'Pretendard-Medium.otf', { weight: '500' }),
  face('Pretendard', 'Pretendard-SemiBold.otf', { weight: '600' }),
  face('Pretendard', 'Pretendard-Bold.otf', { weight: '700' }),
  face('Pretendard', 'Pretendard-ExtraBold.otf', { weight: '800' }),
].join('\n');

// 아주 옅은 종이/필름 노이즈 (외부 요청 없이 SVG 필터로 생성)
const noise = (freq = 0.85) =>
  `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='240' height='240'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='${freq}' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='240' height='240' filter='url(%23n)'/%3E%3C/svg%3E")`;

const page = (css, body) => `<!doctype html>
<html lang="ko"><head><meta charset="utf-8">
<style>
${FONT_FACES}
*{margin:0;padding:0;box-sizing:border-box;}
html,body{background:#fff;}
body{width:1080px;height:1350px;overflow:hidden;-webkit-font-smoothing:antialiased;}
.card{width:1080px;height:1350px;position:relative;overflow:hidden;}
.noise{position:absolute;inset:0;pointer-events:none;}
${css}
</style></head>
<body>${body}
<script>
  document.fonts.ready.then(() => document.documentElement.setAttribute('data-ready', '1'));
</script>
</body></html>`;

// ─────────────────────────────────────────────────────────────
// 3-1. 스타일 01 — 스카이 미니멀 (청량함 · 세련됨 · 미니멀)
//      중앙 정렬 / Pretendard + Space Grotesk / 여백 90·80
//      장식 패턴 없음. 헤어라인 1px 외 데코 금지.
// ─────────────────────────────────────────────────────────────
const CSS_01 = `
.card{
  background:linear-gradient(160deg,#F0F7FC 0%,#DCEAF6 52%,#C2DCEF 100%);
  padding:90px 80px;
  display:flex;flex-direction:column;align-items:center;justify-content:center;
  text-align:center;
  font-family:'Pretendard';color:#4E6B82;
}
.noise{background-image:${noise(0.9)};opacity:.035;mix-blend-mode:multiply;}

.eyebrow{font-family:'Space Grotesk';font-weight:500;font-size:25px;letter-spacing:.34em;
  color:#7C97AD;text-transform:uppercase;}
.tags{display:flex;gap:14px;justify-content:center;flex-wrap:wrap;}
.tag{
  background:rgba(255,255,255,.72);border:1px solid rgba(15,44,68,.14);border-radius:999px;
  padding:15px 30px;color:#0F4C7A;font-weight:600;font-size:29px;line-height:1;
  letter-spacing:-.01em;
}
.lead{font-weight:800;font-size:98px;color:#0F2C44;line-height:1.22;letter-spacing:-.035em;}
.point{font-weight:800;font-size:142px;color:#1F7AC0;line-height:1.1;letter-spacing:-.045em;}
.sub{font-weight:300;font-size:42px;color:#4E6B82;line-height:1.6;letter-spacing:-.01em;}
.hair{height:1px;width:100%;background:rgba(15,44,68,.14);}
/* 푸터는 본문 중앙 정렬에 휩쓸리지 않도록 카드 하단에 고정 */
.footwrap{position:absolute;left:80px;right:80px;bottom:90px;}
.foot{width:100%;display:flex;justify-content:space-between;align-items:center;}
.id{font-family:'Space Grotesk';font-weight:500;font-size:28px;letter-spacing:.08em;color:#0F4C7A;}
.meta{font-family:'Space Grotesk';font-weight:500;font-size:24px;letter-spacing:.2em;color:#8FA8BB;}
.grow{flex:1;}

/* 목록 (2장) — 패널 대신 헤어라인만으로 구획 */
.topic{
  width:100%;display:flex;align-items:baseline;justify-content:center;gap:22px;
  padding:30px 0;border-bottom:1px solid rgba(15,44,68,.14);
}
.topic i{font-style:normal;font-family:'Space Grotesk';font-weight:500;
  font-size:26px;color:#1F7AC0;letter-spacing:.1em;}
.topic span{font-weight:500;font-size:40px;color:#0F2C44;letter-spacing:-.02em;}

/* 목업 프로필 (3장) — radius 20px, 그림자 최소 */
.profile{
  width:100%;background:rgba(255,255,255,.72);border:1px solid rgba(15,44,68,.10);
  border-radius:20px;padding:36px 40px;display:flex;align-items:center;gap:26px;
}
.avatar{width:88px;height:88px;border-radius:50%;flex:none;
  background:linear-gradient(150deg,#9CC8E8,#1F7AC0);}
.pinfo{flex:1;text-align:left;display:block;}
.pid{display:block;font-family:'Space Grotesk';font-weight:700;font-size:34px;
  color:#0F2C44;letter-spacing:.02em;}
.pdesc{display:block;font-weight:300;font-size:25px;color:#4E6B82;margin-top:8px;}
.follow{background:#1F7AC0;color:#fff;font-weight:600;font-size:29px;
  padding:16px 32px;border-radius:12px;flex:none;letter-spacing:-.01em;}
`;

const style01 = {
  key: '01_sky',
  css: CSS_01,
  cards: [
    // 1장 — 표지
    `<div class="card"><div class="noise"></div>
      <div class="eyebrow" style="margin-bottom:34px">Start · 2026</div>
      <div class="tags" style="margin-bottom:72px">
        ${CONTENT.tags.map((t) => `<span class="tag"># ${t}</span>`).join('')}
      </div>
      <div class="lead">${CONTENT.titleLead}</div>
      <div class="point" style="margin-top:8px">${CONTENT.titlePoint}</div>
      <div class="sub" style="margin-top:44px">${CONTENT.subtitle}</div>
      <div class="footwrap">
        <div class="hair" style="margin-bottom:30px"></div>
        <div class="foot"><span class="id">${CONTENT.handle}</span><span class="meta">01 / 03</span></div>
      </div>
    </div>`,
    // 2장 — 다룰 내용
    `<div class="card"><div class="noise"></div>
      <div class="eyebrow" style="margin-bottom:34px">What I Post</div>
      <div class="lead" style="font-size:76px">${CONTENT.card2Lead}</div>
      <div class="point" style="font-size:104px;margin-top:4px">${CONTENT.card2Point}</div>
      <div style="width:100%;margin-top:60px;border-top:1px solid rgba(15,44,68,.14)">
        ${CONTENT.topics
          .map((t, i) => `<div class="topic"><i>${String(i + 1).padStart(2, '0')}</i><span>${t}</span></div>`)
          .join('')}
      </div>
      <div class="footwrap">
        <div class="foot"><span class="id">${CONTENT.handle}</span><span class="meta">02 / 03</span></div>
      </div>
    </div>`,
    // 3장 — 맞팔 CTA
    `<div class="card"><div class="noise"></div>
      <div class="eyebrow" style="margin-bottom:34px">Let's Connect</div>
      <div class="lead">${CONTENT.card3Lead}</div>
      <div class="point" style="margin-top:8px">${CONTENT.card3Point}</div>
      <div class="sub" style="margin-top:40px">${CONTENT.card3Sub}</div>
      <div class="profile" style="margin-top:64px">
        <span class="avatar"></span>
        <span class="pinfo">
          <span class="pid">${CONTENT.handle}</span>
          <span class="pdesc">대외활동 · 공모전 · 서포터즈 기록</span>
        </span>
        <span class="follow">맞팔하기</span>
      </div>
      <div class="tags" style="margin-top:40px">
        ${ALL_TAGS.map((t) => `<span class="tag" style="font-size:26px;padding:13px 24px"># ${t}</span>`).join('')}
      </div>
      <div class="footwrap">
        <div class="hair" style="margin-bottom:30px"></div>
        <div class="foot"><span></span><span class="meta">03 / 03</span></div>
      </div>
    </div>`,
  ],
};

// ─────────────────────────────────────────────────────────────
// 3-2. 스타일 02 — 아이보리 에디토리얼 (차분함 · 세련됨 · 정갈함)
//      좌측 정렬 / 명조 + Playfair + Pretendard / 여백 96·90
// ─────────────────────────────────────────────────────────────
const CSS_02 = `
.card{
  background:#F5F1E8;
  padding:96px 90px;
  display:flex;flex-direction:column;text-align:left;
  font-family:'Pretendard';color:#4A463F;
}
.noise{background-image:${noise(0.9)};opacity:.045;mix-blend-mode:multiply;}
.top{display:flex;justify-content:space-between;align-items:baseline;}
.label{font-family:'Pretendard';font-weight:500;font-size:23px;letter-spacing:.32em;
  color:#8A8375;text-transform:uppercase;}
.vol{font-family:'Playfair Display';font-size:24px;letter-spacing:.14em;color:#8A8375;}
.en{font-family:'Playfair Display';font-style:italic;font-weight:500;
  font-size:50px;color:#8A8375;letter-spacing:.01em;}
.h1{font-family:'Nanum Myeongjo';font-weight:700;font-size:104px;color:#2B2926;
  line-height:1.34;letter-spacing:-.02em;}
.rule{height:1px;background:#D8D0BE;width:100%;}
.body{font-size:38px;line-height:1.8;color:#4A463F;letter-spacing:-.01em;}
.tagline{font-size:27px;letter-spacing:.24em;color:#C06B3E;font-weight:500;line-height:1.9;}
.foot{display:flex;justify-content:space-between;align-items:baseline;}
.id{font-family:'Playfair Display';font-size:30px;letter-spacing:.06em;color:#4A463F;}
.grow{flex:1;}
.idx{font-family:'Playfair Display';font-weight:700;font-size:30px;color:#C06B3E;
  letter-spacing:.06em;width:78px;flex:none;}
.row{display:flex;align-items:baseline;padding:29px 0;}
.row + .row{border-top:1px solid #D8D0BE;}
.row span{font-size:41px;color:#2B2926;font-weight:500;letter-spacing:-.01em;}
`;

const dot = ' · ';
const style02 = {
  key: '02_ivory',
  css: CSS_02,
  cards: [
    // 1장 — 표지
    `<div class="card"><div class="noise"></div>
      <div class="top"><span class="label">Extracurricular Archive</span><span class="vol">Vol. 01</span></div>
      <div class="grow"></div>
      <div class="en" style="margin-bottom:30px">Open the Archive</div>
      <div class="h1">${CONTENT.titleLead}<br>${CONTENT.titlePoint}</div>
      <div class="rule" style="margin:54px 0"></div>
      <div class="body">${CONTENT.subtitle}</div>
      <div class="grow"></div>
      <div class="tagline">${CONTENT.tags.join(dot)}</div>
      <div class="rule" style="margin:34px 0 30px"></div>
      <div class="foot"><span class="id">${CONTENT.handle}</span><span class="vol">01 / 03</span></div>
    </div>`,
    // 2장 — 다룰 내용
    `<div class="card"><div class="noise"></div>
      <div class="top"><span class="label">What I Post</span><span class="vol">Vol. 02</span></div>
      <div class="grow"></div>
      <div class="en" style="margin-bottom:26px">Contents</div>
      <div class="h1" style="font-size:82px">${CONTENT.card2Lead}<br>${CONTENT.card2Point}</div>
      <div class="rule" style="margin:46px 0 8px"></div>
      ${CONTENT.topics
        .map((t, i) => `<div class="row"><span class="idx">${String(i + 1).padStart(2, '0')}</span><span>${t}</span></div>`)
        .join('')}
      <div class="grow"></div>
      <div class="rule" style="margin:0 0 30px"></div>
      <div class="foot"><span class="id">${CONTENT.handle}</span><span class="vol">02 / 03</span></div>
    </div>`,
    // 3장 — 맞팔 CTA
    `<div class="card"><div class="noise"></div>
      <div class="top"><span class="label">Let's Connect</span><span class="vol">Vol. 03</span></div>
      <div class="grow"></div>
      <div class="en" style="margin-bottom:30px">Follow for Follow</div>
      <div class="h1">${CONTENT.card3Lead}<br>${CONTENT.card3Point}</div>
      <div class="rule" style="margin:54px 0"></div>
      <div class="body">${CONTENT.card3Sub}<br>서로 정보 나눠요.</div>
      <div class="grow"></div>
      <div class="tagline">${CONTENT.tags.join(dot)}<br>${CONTENT.extraTags.join(dot)}</div>
      <div class="rule" style="margin:34px 0 30px"></div>
      <div class="foot"><span class="id">${CONTENT.handle}</span><span class="vol">03 / 03</span></div>
    </div>`,
  ],
};

// ─────────────────────────────────────────────────────────────
// 3-3. 스타일 03 — 다크 네온 (트렌디 · 시크 · 강렬)
//      제목 좌하단 앵커 / Black Han Sans + Space Grotesk + Pretendard / 여백 80·72
// ─────────────────────────────────────────────────────────────
const CSS_03 = `
.card{
  background:linear-gradient(158deg,#171A26 0%,#14161F 58%,#0F1115 100%);
  padding:80px 72px;
  display:flex;flex-direction:column;justify-content:space-between;
  font-family:'Pretendard';color:#B8BCC8;
}
.grid{position:absolute;inset:0;pointer-events:none;
  background-image:
    repeating-linear-gradient(0deg, rgba(255,255,255,.028) 0 1px, transparent 1px 90px),
    repeating-linear-gradient(90deg, rgba(255,255,255,.028) 0 1px, transparent 1px 90px);}
.noise{background-image:${noise(0.8)};opacity:.05;}
/* 빈 여백을 채우는 고스트 타이포 + 좌하단 네온 글로우 (무채색으로 눌러 대비 유지) */
.ghost{position:absolute;right:72px;top:48%;transform:translateY(-50%);
  font-family:'Space Grotesk';font-weight:700;font-size:176px;letter-spacing:.02em;
  color:rgba(237,238,242,.045);white-space:nowrap;pointer-events:none;}
.glow{position:absolute;left:-180px;bottom:-220px;width:860px;height:860px;border-radius:50%;
  background:radial-gradient(circle, rgba(203,255,77,.11), rgba(203,255,77,0) 66%);pointer-events:none;}
.eyebrow{font-family:'Space Grotesk';font-weight:700;font-size:24px;letter-spacing:.34em;
  color:#6E7382;text-transform:uppercase;}
.pills{display:flex;gap:14px;flex-wrap:wrap;margin-top:30px;}
.pill{background:#232634;border:1px solid rgba(203,255,77,.28);border-radius:999px;
  padding:13px 26px;font-size:26px;font-weight:500;color:#CBFF4D;line-height:1;}
.bracket{font-family:'Space Grotesk';font-weight:700;font-size:30px;color:#CBFF4D;
  letter-spacing:.1em;margin-top:26px;}
.h1{font-family:'Black Han Sans';font-size:138px;color:#EDEEF2;line-height:1.16;letter-spacing:-.02em;}
.h1 em{font-style:normal;color:#CBFF4D;
  text-shadow:0 0 10px rgba(203,255,77,.50), 0 0 24px rgba(203,255,77,.34), 0 0 48px rgba(203,255,77,.18);}
.sub{font-size:38px;line-height:1.6;color:#B8BCC8;letter-spacing:-.01em;}
.neonline{height:3px;width:180px;background:#CBFF4D;border-radius:2px;
  box-shadow:0 0 12px rgba(203,255,77,.55), 0 0 28px rgba(203,255,77,.30);}
.foot{display:flex;justify-content:space-between;align-items:center;}
.id{font-family:'Space Grotesk';font-weight:700;font-size:32px;letter-spacing:.06em;color:#9B5CFF;
  text-shadow:0 0 16px rgba(155,92,255,.45);}
.meta{font-family:'Space Grotesk';font-weight:500;font-size:24px;letter-spacing:.2em;color:#565B69;}
.chip{background:#232634;border-radius:20px;padding:26px 30px;display:flex;align-items:center;gap:20px;}
.chip b{font-family:'Space Grotesk';font-weight:700;font-size:26px;color:#CBFF4D;flex:none;}
.chip span{font-size:38px;font-weight:500;color:#EDEEF2;letter-spacing:-.01em;}
.chips{display:flex;flex-direction:column;gap:14px;margin-top:38px;}
`;

// ghostTop: 카드마다 비어 있는 세로 위치가 달라 고스트 타이포를 그 자리에 앉힌다
const deco03 = (ghost, ghostTop = '48%') =>
  `<div class="grid"></div><div class="glow"></div>
   <div class="ghost" style="top:${ghostTop}">${ghost}</div><div class="noise"></div>`;

const style03 = {
  key: '03_neon',
  css: CSS_03,
  cards: [
    // 1장 — 표지
    `<div class="card">${deco03('START')}
      <div>
        <div class="eyebrow">2026 · New Account</div>
        <div class="pills">
          ${CONTENT.tags.map((t) => `<span class="pill"># ${t}</span>`).join('')}
        </div>
      </div>
      <div>
        <div class="sub" style="margin-bottom:26px">${CONTENT.subtitle}</div>
        <div class="h1">${CONTENT.titleLead}<br><em>${CONTENT.titlePoint}</em></div>
        <div class="neonline" style="margin:46px 0 32px"></div>
        <div class="foot"><span class="id">${CONTENT.handle}</span><span class="meta">01 / 03</span></div>
      </div>
    </div>`,
    // 2장 — 다룰 내용
    `<div class="card">${deco03('POST', '63%')}
      <div>
        <div class="eyebrow">What I Post</div>
        <div class="chips">
          ${CONTENT.topics
            .map((t, i) => `<div class="chip"><b>${String(i + 1).padStart(2, '0')}</b><span>${t}</span></div>`)
            .join('')}
        </div>
      </div>
      <div>
        <div class="h1" style="font-size:96px">${CONTENT.card2Lead}<br>${CONTENT.card2Point}</div>
        <div class="neonline" style="margin:38px 0 30px"></div>
        <div class="foot"><span class="id">${CONTENT.handle}</span><span class="meta">02 / 03</span></div>
      </div>
    </div>`,
    // 3장 — 맞팔 CTA
    `<div class="card">${deco03('CONNECT')}
      <div>
        <div class="eyebrow">Let's Connect</div>
        <div class="bracket">[ 맞팔 환영 ]</div>
        <div class="pills" style="margin-top:34px">
          ${ALL_TAGS.map((t) => `<span class="pill"># ${t}</span>`).join('')}
        </div>
      </div>
      <div>
        <div class="sub" style="margin-bottom:26px">${CONTENT.card3Sub}</div>
        <div class="h1">${CONTENT.card3Lead}<br><em>${CONTENT.card3Point}</em></div>
        <div class="neonline" style="margin:46px 0 32px"></div>
        <div class="foot"><span class="id">${CONTENT.handle}</span><span class="meta">03 / 03</span></div>
      </div>
    </div>`,
  ],
};

// ─────────────────────────────────────────────────────────────
// 4. 렌더
// ─────────────────────────────────────────────────────────────
const NAMES = ['01_cover', '02_content', '03_cta'];
const STYLES = [style01, style02, style03];

mkdirSync(HTML_DIR, { recursive: true });

const profileDir = join(BUILD, '.chrome-profile');

for (const style of STYLES) {
  const outDir = join(OUT, style.key);
  mkdirSync(outDir, { recursive: true });

  style.cards.forEach((body, i) => {
    const name = `${style.key}_${NAMES[i]}`;
    const htmlPath = join(HTML_DIR, `${name}.html`);
    const pngPath = join(outDir, `${NAMES[i]}.png`);

    writeFileSync(htmlPath, page(style.css, body), 'utf8');

    execFileSync(
      CHROME,
      [
        '--headless=new',
        '--disable-gpu',
        '--hide-scrollbars',
        '--no-first-run',
        `--user-data-dir=${profileDir}`,
        '--force-device-scale-factor=2',
        '--window-size=1080,1350',
        '--virtual-time-budget=8000',
        `--screenshot=${pngPath}`,
        `${pathToFileURL(htmlPath).href}?v=${Date.now()}`, // 캐시 무효화: 없으면 옛 렌더가 그대로 나온다
      ],
      { stdio: 'pipe' }
    );

    const kb = (statSync(pngPath).size / 1024).toFixed(0);
    console.log(`  ✓ ${style.key}/${NAMES[i]}.png  (${kb} KB)`);
  });
}

console.log(`\n완료 → ${OUT}`);
