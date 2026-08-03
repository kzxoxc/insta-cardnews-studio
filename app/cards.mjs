// 카드 JSON → 카드 HTML (1080×1350)
// 디자인 기준: card_style_01_sky_minimal.md — 색·폰트·여백을 임의로 바꾸지 말 것
//
// fontBase 는 @font-face 가 폰트를 찾을 위치.
//   웹 미리보기 → '/fonts/'      (http)
//   렌더        → 'file:///.../build/fonts/'

export const PALETTE = {
  bg: 'linear-gradient(160deg,#F0F7FC 0%,#DCEAF6 52%,#C2DCEF 100%)',
  title: '#0F2C44',
  body: '#4E6B82',
  accent: '#1F7AC0',
  accentDeep: '#0F4C7A',
  hairline: 'rgba(15,44,68,.14)',
  pill: 'rgba(255,255,255,.72)',
  labelEn: '#7C97AD',
};

const esc = (s = '') => String(s)
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/** 줄바꿈만 살리고 나머지는 이스케이프 */
const multiline = (s = '') => esc(s).replace(/\n/g, '<br>');

const NOISE = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='240' height='240'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='240' height='240' filter='url(%23n)'/%3E%3C/svg%3E")`;

const FONT_FILES = [
  ['Pretendard', 'Pretendard-Light.otf', '300'],
  ['Pretendard', 'Pretendard-Regular.otf', '400'],
  ['Pretendard', 'Pretendard-Medium.otf', '500'],
  ['Pretendard', 'Pretendard-SemiBold.otf', '600'],
  ['Pretendard', 'Pretendard-Bold.otf', '700'],
  ['Pretendard', 'Pretendard-ExtraBold.otf', '800'],
  ['Space Grotesk', 'SpaceGrotesk.ttf', '300 700'],
];

// 폴백 폰트를 일부러 비워둔다 — Malgun Gothic 으로 조용히 대체되면 위반을 못 잡는다
const fontFaces = (base) => FONT_FILES.map(([family, file, weight]) =>
  `@font-face{font-family:'${family}';src:url('${base}${file}');font-weight:${weight};font-display:block;}`
).join('\n');

const CSS = `
*{margin:0;padding:0;box-sizing:border-box;}
html,body{background:#fff;}
body{width:1080px;height:1350px;overflow:hidden;-webkit-font-smoothing:antialiased;}

/* 기본은 좌측 정렬 + 글덩어리를 아래로 앵커한다 (기준서 §4).
   전부 중앙에 몰아넣으면 넘길 때 화면이 똑같아 보인다. */
.card{
  width:1080px;height:1350px;position:relative;overflow:hidden;
  background:${PALETTE.bg};
  padding:90px 80px;                       /* 안전 여백: 상하 90 / 좌우 80 */
  display:flex;flex-direction:column;align-items:flex-start;
  font-family:'Pretendard';color:${PALETTE.body};text-align:left;
}
/* 마지막 팔로우 카드만 중앙 정렬로 되돌린다 */
.card.center{align-items:center;text-align:center;}
/* 배경 레이어보다 글자가 위에 오게 한다.
   absolute 요소는 정적 콘텐츠보다 나중에 그려지므로 z-index 를 명시해야 한다.
   ↓ 이 규칙이 .bg/.scrim/.noise 보다 먼저 와야 뒤 규칙이 이긴다 (동일 명시도) */
.card > *{position:relative;z-index:2;}

.noise{position:absolute;inset:0;z-index:1;background-image:${NOISE};opacity:.035;
  mix-blend-mode:multiply;pointer-events:none;}

/* ── 스타일 02 포토 스카이 (card_style_02_photo.md §3) ────────
   사진은 분위기만. 정보는 전부 텍스트가 전달한다. */
/* --zoom 으로 확대해 포스터 상하단의 글자 영역을 화면 밖으로 밀어낸다.
   블러만으로는 글자 형태가 남아 eyebrow 와 겹쳐 보인다 (기준서 §7). */
.bg{position:absolute;inset:0;z-index:0;background-size:cover;
  background-position:var(--fx) var(--fy);
  filter:blur(var(--blur));transform:scale(var(--zoom));}
/* 스크림 = 01의 그라데이션을 알파로. --a 는 0.78 아래로 내리지 않는다 */
.scrim{position:absolute;inset:0;z-index:1;
  background:linear-gradient(160deg,
    rgba(240,247,252,var(--a)) 0%,
    rgba(220,234,246,calc(var(--a) - .04)) 52%,
    rgba(194,220,239,var(--a)) 100%);}
/* 사진 위에서는 묻히므로 pill 과 옅은 글자들의 대비를 올린다 */
.photo .tag{background:rgba(255,255,255,.86);}
.photo .sub{color:#2F4E67;font-weight:500;}
.photo .eyebrow{color:#456780;}
.photo .foot .pg{color:#6B8AA2;}
.photo .foot .line,.photo .rule{background:rgba(15,44,68,.24);}
.photo .src{color:#6B8AA2;}
/* 스크림을 0까지 낮출 수 있어 사진이 그대로 드러날 수 있다 — 어떤 사진이든
   최소한의 글자 대비를 보장하는 안전장치. 스크림이 충분하면 육안에는 거의 안 보인다 */
.photo .title,.photo .sub,.photo .lead,.photo .eyebrow,.photo .idx,
.photo .foot .id,.photo .foot .pg,.photo .src{
  text-shadow:0 2px 16px rgba(15,44,68,.4),0 1px 3px rgba(15,44,68,.55);}

/* 영문 라벨 — 자간 넓게 */
.eyebrow{font-family:'Space Grotesk';font-weight:500;font-size:26px;
  letter-spacing:.32em;text-transform:uppercase;color:${PALETTE.labelEn};}

/* 태그 pill */
.tags{display:flex;flex-wrap:wrap;justify-content:flex-start;gap:14px;width:100%;}
.center .tags{justify-content:center;}

/* 상단 메타(번호 + 항목 라벨)는 좌측 정렬 카드에서도 가운데로 모은다 */
.meta{width:100%;text-align:center;}
.tag{background:${PALETTE.pill};border:1px solid ${PALETTE.hairline};border-radius:999px;
  padding:14px 30px;font-weight:600;font-size:28px;color:${PALETTE.accentDeep};
  letter-spacing:-.01em;}

/* 제목 — 자간 좁게. 강조색은 한 곳에만 */
.title{font-weight:800;color:${PALETTE.title};line-height:1.18;letter-spacing:-.035em;}
.title em{font-style:normal;color:${PALETTE.accent};}
/* 본문은 Light(300)로 뽑으면 사진 위에서 흐려 보인다. Regular + 진한 색으로 간다 */
.sub{font-weight:400;line-height:1.6;color:#3F5D75;}
.sub em{font-style:normal;font-weight:600;color:${PALETTE.accent};}
.lead{font-weight:500;line-height:1.55;color:${PALETTE.title};letter-spacing:-.02em;}
.lead em{font-style:normal;color:${PALETTE.accent};}

/* 자동 축소 대상: 내용 길이가 들쭉날쭉해도 카드 밖으로 넘치지 않게 */
.fit{display:flex;align-items:flex-end;justify-content:flex-start;width:100%;overflow:hidden;}
.center .fit{align-items:center;justify-content:center;}
.fit > *{width:100%;}
/* 본문은 안전 여백까지 꽉 채우지 않는다 — 줄이 짧아야 읽히고 미니멀해 보인다 */
.fit > .sub{max-width:820px;}

.rule{width:100%;height:1px;background:${PALETTE.hairline};}
.grow{flex:1;min-height:0;}

/* 하단 — 중앙정렬 flex 에 딸려 올라가지 않도록 절대 고정 */
.foot{position:absolute;left:80px;right:80px;bottom:90px;}
.foot .line{height:1px;background:${PALETTE.hairline};}
.foot .row{margin-top:24px;display:flex;justify-content:space-between;align-items:center;}
.foot .id{font-family:'Space Grotesk';font-weight:500;font-size:26px;
  letter-spacing:.08em;color:${PALETTE.accentDeep};}
.foot .pg{font-family:'Space Grotesk';font-weight:500;font-size:23px;
  letter-spacing:.2em;color:#8FA8BB;}

/* 내용 카드의 번호 */
.idx{font-family:'Space Grotesk';font-weight:700;font-size:28px;
  letter-spacing:.14em;color:${PALETTE.accent};}
.idx s{text-decoration:none;color:#A6BFD2;font-weight:500;}

/* 이 장이 무슨 항목인지 (모집대상 / 활동내용 …) */
.label{display:inline-block;margin-top:18px;
  background:${PALETTE.pill};border:1px solid ${PALETTE.hairline};border-radius:999px;
  padding:13px 34px;font-weight:600;font-size:31px;color:${PALETTE.accentDeep};
  letter-spacing:-.01em;}
.photo .label{background:rgba(255,255,255,.86);}

/* 출처 한 줄 */
.src{font-weight:400;font-size:22px;color:#8FA8BB;letter-spacing:-.01em;
  overflow:hidden;text-overflow:ellipsis;white-space:nowrap;max-width:100%;}

/* 마지막 카드의 인스타 프로필 목업 */
.pcard{
  background:rgba(255,255,255,.88);border:1px solid ${PALETTE.hairline};border-radius:30px;
  padding:42px 52px;display:flex;flex-direction:column;align-items:center;
  box-shadow:0 18px 44px rgba(15,44,68,.10);max-width:640px;
}
.pcard .pfp{width:164px;height:164px;border-radius:50%;object-fit:cover;
  border:1px solid ${PALETTE.hairline};}
.pcard .pname{font-weight:700;font-size:35px;color:${PALETTE.title};
  letter-spacing:-.025em;margin-top:22px;}
.pcard .phandle{font-family:'Space Grotesk';font-weight:500;font-size:27px;
  letter-spacing:.08em;color:${PALETTE.accentDeep};margin-top:8px;}
.pcard .pbio{font-weight:300;font-size:26px;line-height:1.55;color:${PALETTE.body};margin-top:16px;}
.pcard .pfollow{margin-top:28px;background:${PALETTE.accent};color:#fff;
  border-radius:13px;padding:15px 62px;font-weight:700;font-size:29px;letter-spacing:-.01em;}
`;

// ─────────────────────────────────────────────────────────────
// 카드 종류별 본문
// ─────────────────────────────────────────────────────────────

const tagsHTML = (tags) => (tags?.length
  ? `<div class="tags">${tags.map((t) => `<span class="tag">${esc(t)}</span>`).join('')}</div>`
  : '');

/**
 * `*강조*` 표기를 accent 색 <em> 으로 바꾼다. 제목·본문 각각에 쓸 수 있지만
 * 한 필드 안에서는 첫 번째만 살고 두 번째부터는 무시한다 (필드당 한 곳, 카드당 최대 두 곳).
 */
function accentize(s = '') {
  let used = false;
  return esc(s).replace(/\*([^*]+)\*/g, (_, inner) => {
    if (used) return inner;
    used = true;
    return `<em>${inner}</em>`;
  }).replace(/\n/g, '<br>');
}

/** 푸터(절대배치)와 겹치지 않게 비워두는 아래 여백 */
const FOOT_CLEAR = '<div style="height:128px"></div>';

/** 표지는 중앙 정렬 + 세로 가운데 (기준서 01 §3 예외) */
function coverBody(c) {
  return `
  ${c.eyebrow ? `<div class="eyebrow">${esc(c.eyebrow)}</div>` : ''}
  <div style="height:44px"></div>
  ${tagsHTML(c.tags)}
  <div class="grow"></div>
  <div class="fit" data-fit style="max-height:520px">
    <h1 class="title" style="font-size:104px">${accentize(c.title)}</h1>
  </div>
  ${c.sub ? `<div class="fit" data-fit style="max-height:190px;margin-top:40px">
    <p class="sub" style="font-size:38px">${accentize(c.sub)}</p>
  </div>` : ''}
  <div class="grow"></div>
  ${FOOT_CLEAR}`;
}

function contentBody(c, i, total) {
  return `
  <div class="meta">
    <div class="idx">${String(i).padStart(2, '0')} <s>/ ${String(total).padStart(2, '0')}</s></div>
    ${c.label ? `<span class="label">${esc(c.label)}</span>` : ''}
  </div>
  <div class="grow"></div>
  <div class="fit" data-fit style="max-height:340px">
    <h2 class="title" style="font-size:76px">${accentize(c.headline)}</h2>
  </div>
  <div class="rule" style="width:88px;margin:44px 0"></div>
  <div class="fit" data-fit style="max-height:400px">
    <p class="sub" style="font-size:40px">${accentize(c.body)}</p>
  </div>
  ${FOOT_CLEAR}`;
}

/** 마지막 카드 — 중앙 정렬, 프로필 목업으로 팔로우를 청한다 */
function ctaBody(c, _i, _t, { assetBase = '' } = {}) {
  const p = c.profile;
  const mock = p ? `
  <div class="pcard">
    <img class="pfp" src="${assetBase}profile.png" alt="">
    <div class="pname">${esc(p.name || '')}</div>
    <div class="phandle">@${esc(p.handle || 'erai_log')}</div>
    ${p.bio ? `<div class="pbio">${multiline(p.bio)}</div>` : ''}
    <div class="pfollow">팔로우</div>
  </div>
  <div style="height:48px"></div>` : '';

  return `
  ${c.eyebrow ? `<div class="eyebrow">${esc(c.eyebrow)}</div>` : ''}
  <div class="grow"></div>
  ${mock}
  <div class="fit" data-fit style="max-height:${p ? 220 : 400}px">
    <h2 class="title" style="font-size:${p ? 64 : 82}px">${accentize(c.headline)}</h2>
  </div>
  ${c.body ? `<div class="fit" data-fit style="max-height:170px;margin-top:28px">
    <p class="sub" style="font-size:36px">${accentize(c.body)}</p>
  </div>` : ''}
  ${c.tags?.length ? `<div style="height:44px"></div>${tagsHTML(c.tags)}` : ''}
  <div class="grow"></div>
  ${FOOT_CLEAR}`;
}

const BODIES = { cover: coverBody, content: contentBody, cta: ctaBody };

// ─────────────────────────────────────────────────────────────
// 조립
// ─────────────────────────────────────────────────────────────

/**
 * @param {object} doc   cards.json 전체 ({handle, source, cards})
 * @param {number} index 0-based 카드 번호
 */
/** 스크림 농도 / 블러 기본값 — 기준서 §3 표
 *  1장(포스터)은 어떤 공고인지 알아볼 수 있어야 해서 거의 원본에 가깝게 둔다. */
const SCRIM_DEFAULT = { cover: 0.62, content: 0.84, cta: 0.82 };
const BLUR_DEFAULT = { cover: 2, content: 8, cta: 7 };

export function cardHTML(doc, index, { fontBase = '/fonts/', imageBase = '', assetBase = '/asset/' } = {}) {
  const cards = doc.cards || [];
  const c = cards[index];
  if (!c) throw new Error(`카드 ${index} 없음`);

  const total = cards.length;
  const contentNo = cards.slice(0, index + 1).filter((x) => x.type === 'content').length;
  const contentTotal = cards.filter((x) => x.type === 'content').length;

  const build = BODIES[c.type] || contentBody;
  const inner = build(c, contentNo, contentTotal, { assetBase });

  const handle = doc.handle || 'erai_log';
  const src = index === total - 1 && doc.source?.publisher
    ? `<div class="src">출처 · ${esc(doc.source.publisher)}</div>`
    : '';

  // 사진이 없으면 스크림도 없다 = 스타일 01과 같은 화면 (기준서 §3 폴백)
  // 0까지 내릴 수 있다 — 그 대신 위 .photo 텍스트에 그림자를 깔아 가독성을 보장한다
  const scrim = Math.max(0, Math.min(1, Number(c.scrim ?? SCRIM_DEFAULT[c.type] ?? 0.84)));
  const blur = Math.max(0, Number(c.blur ?? BLUR_DEFAULT[c.type] ?? 14));
  // 포스터(1장)는 글자가 상하에 몰려 있으므로 크게 확대해 가운데 그림만 남긴다.
  // 선명하게 갈수록 확대를 더 키워야 한다 — 블러가 약하면 글자가 그대로 읽힌다.
  const zoom = Number(c.zoom ?? (c.type === 'cover' ? 2.0 : 1.08));
  // focusY 의 구버전은 `focus`(예: "45%") 하나뿐이었다 — 남아있는 프로젝트를 위해 그대로 읽는다
  const legacyFocusY = c.focus != null ? parseFloat(c.focus) : null;
  const focusX = Number(c.focusX ?? 50);
  const focusY = Number(c.focusY ?? legacyFocusY ?? 50);
  const photo = c.image
    ? `<div class="bg" style="--blur:${blur}px;--zoom:${zoom};--fx:${focusX}%;--fy:${focusY}%;
       background-image:url('${imageBase}${encodeURIComponent(c.image)}')"></div>
  <div class="scrim" style="--a:${scrim}"></div>`
    : '';

  return `<!doctype html>
<html lang="ko"><head><meta charset="utf-8">
<style>
${fontFaces(fontBase)}
${CSS}
</style></head>
<body>
<div class="card${c.image ? ' photo' : ''}${c.type === 'cta' || c.type === 'cover' ? ' center' : ''}">
  ${photo}
  <div class="noise"></div>
${inner}
  <div class="foot">
    ${src}
    <div class="line" style="margin-top:${src ? 18 : 0}px"></div>
    <div class="row">
      <span class="id">@${esc(handle)}</span>
      <span class="pg">${String(index + 1).padStart(2, '0')} / ${String(total).padStart(2, '0')}</span>
    </div>
  </div>
</div>
<script>
// 폰트가 실제로 적용된 뒤에 크기를 재야 한다 (폴백 상태로 재면 값이 틀어진다)
document.fonts.ready.then(() => {
  document.querySelectorAll('[data-fit]').forEach((box) => {
    const el = box.firstElementChild;
    if (!el) return;
    let size = parseFloat(getComputedStyle(el).fontSize);
    while (size > 22 && el.getBoundingClientRect().height > box.clientHeight) {
      size -= 2;
      el.style.fontSize = size + 'px';
    }
  });
  document.documentElement.setAttribute('data-ready', '1');
});
</script>
</body></html>`;
}

/**
 * 카드 한 장의 편집 가능한 필드 — UI 가 이 정의를 보고 폼을 그린다.
 * kind: line(한 줄) | text(여러 줄) | tags(공백 구분) | prompt(복사 버튼) | image(업로드) | scrim(슬라이더)
 */
const PHOTO_FIELDS = [
  ['image', '배경 사진', 'image'],
  ['imagePrompt', 'AI 이미지 프롬프트', 'prompt'],
  ['crop', '사진 위치·확대', 'crop'],
  ['scrim', '사진 위 막 농도', 'scrim'],
];

export const FIELDS = {
  cover: [
    ['eyebrow', '영문 라벨', 'line'],
    ['tags', '태그', 'tags'],
    ['title', '제목 (*강조* 로 포인트 한 곳)', 'text'],
    ['sub', '한 줄 요약 (*강조* 로 포인트 한 곳)', 'text'],
    ...PHOTO_FIELDS,
  ],
  content: [
    ['headline', '소제목 (*강조* 가능)', 'text'],
    ['body', '본문 (*강조* 로 포인트 한 곳)', 'text'],
    ...PHOTO_FIELDS,
  ],
  cta: [
    ['eyebrow', '영문 라벨', 'line'],
    ['headline', '마무리 문구 (*강조* 가능)', 'text'],
    ['body', '본문 (*강조* 로 포인트 한 곳)', 'text'],
    ['tags', '태그', 'tags'],
    ...PHOTO_FIELDS,
  ],
};
