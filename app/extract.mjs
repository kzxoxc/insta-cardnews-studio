// 링크 → 본문 텍스트 추출 (readability류, 외부 의존성 없음)
// 사용: const article = await extractFromUrl('https://...')

// ─────────────────────────────────────────────────────────────
// 1. 아주 작은 HTML 토크나이저 → 트리
// ─────────────────────────────────────────────────────────────
const VOID = new Set(['area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input',
  'link', 'meta', 'param', 'source', 'track', 'wbr']);
const RAW = new Set(['script', 'style', 'textarea', 'title']);

// 본문일 리 없는 태그 — 점수 계산 전에 통째로 버린다
const DROP = new Set(['script', 'style', 'noscript', 'nav', 'header', 'footer',
  'aside', 'form', 'button', 'select', 'iframe', 'svg', 'canvas', 'template']);

const TOKEN = /<!--[\s\S]*?-->|<!\[CDATA\[[\s\S]*?\]\]>|<!([^>]*)>|<\/\s*([a-zA-Z][^\s>]*)\s*>|<([a-zA-Z][^\s/>]*)((?:"[^"]*"|'[^']*'|[^>"'])*?)\/?>/g;
const ATTR = /([a-zA-Z_:][-\w:.]*)\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'>]+))/g;

function parseAttrs(raw) {
  const out = {};
  if (!raw) return out;
  let m;
  ATTR.lastIndex = 0;
  while ((m = ATTR.exec(raw))) out[m[1].toLowerCase()] = m[2] ?? m[3] ?? m[4] ?? '';
  return out;
}

/** HTML 문자열을 {tag, attrs, children} 트리로 파싱한다. 닫는 태그가 어긋나면 무시. */
export function parse(html) {
  const root = { tag: '#root', attrs: {}, children: [], parent: null };
  const stack = [root];
  let last = 0, m;
  TOKEN.lastIndex = 0;

  const push = (txt) => {
    if (txt) stack[stack.length - 1].children.push(txt);
  };

  while ((m = TOKEN.exec(html))) {
    const [full, , closeTag, openTag, attrRaw] = m;
    push(html.slice(last, m.index));
    last = m.index + full.length;

    if (closeTag) {
      const tag = closeTag.toLowerCase();
      // 스택을 거슬러 짝을 찾는다. 없으면 잘못 닫힌 태그이므로 버린다.
      for (let i = stack.length - 1; i > 0; i--) {
        if (stack[i].tag === tag) { stack.length = i; break; }
      }
      continue;
    }
    if (!openTag) continue;

    const tag = openTag.toLowerCase();
    const node = { tag, attrs: parseAttrs(attrRaw), children: [], parent: stack[stack.length - 1] };
    node.parent.children.push(node);

    if (VOID.has(tag) || full.endsWith('/>')) continue;

    if (RAW.has(tag)) {
      // 원시 텍스트 요소는 닫는 태그까지 통째로 삼킨다 (안에 <가 있어도 안전)
      const close = new RegExp(`</\\s*${tag}\\s*>`, 'i');
      const rest = html.slice(last);
      const hit = rest.match(close);
      const end = hit ? last + hit.index : html.length;
      node.children.push(html.slice(last, end));
      last = hit ? end + hit[0].length : html.length;
      TOKEN.lastIndex = last;
      continue;
    }
    stack.push(node);
  }
  push(html.slice(last));
  return root;
}

// ─────────────────────────────────────────────────────────────
// 2. 트리 유틸
// ─────────────────────────────────────────────────────────────
const ENT = {
  amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ', ensp: ' ', emsp: ' ',
  thinsp: ' ', middot: '·', hellip: '…', mdash: '—', ndash: '–', lsquo: '‘',
  rsquo: '’', ldquo: '“', rdquo: '”', copy: '©', reg: '®', trade: '™',
  times: '×', deg: '°', larr: '←', rarr: '→', shy: '',
};

export function decodeEntities(s) {
  return s.replace(/&(#x?[0-9a-fA-F]+|[a-zA-Z][a-zA-Z0-9]*);/g, (full, body) => {
    if (body[0] === '#') {
      const cp = body[1] === 'x' || body[1] === 'X'
        ? parseInt(body.slice(2), 16)
        : parseInt(body.slice(1), 10);
      return Number.isFinite(cp) && cp > 0 ? String.fromCodePoint(cp) : full;
    }
    const hit = ENT[body.toLowerCase()];
    return hit === undefined ? full : hit;
  });
}

function* walk(node) {
  for (const c of node.children) {
    if (typeof c === 'string') continue;
    yield c;
    yield* walk(c);
  }
}

/** 줄바꿈을 살려서 텍스트를 뽑는다. */
const BLOCK = new Set(['p', 'div', 'br', 'li', 'tr', 'section', 'article', 'blockquote',
  'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'figcaption', 'dd', 'dt', 'pre', 'td', 'table']);

export function textOf(node, { keepBreaks = true } = {}) {
  let out = '';
  const rec = (n) => {
    for (const c of n.children) {
      if (typeof c === 'string') { out += c; continue; }
      if (DROP.has(c.tag)) continue;
      const block = keepBreaks && BLOCK.has(c.tag);
      if (block) out += '\n';
      rec(c);
      if (block) out += '\n';
    }
  };
  if (typeof node === 'string') out = node; else rec(node);
  return decodeEntities(out).replace(/[ \t ]+/g, ' ');
}

function cleanText(s) {
  return s
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean)
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function findAll(root, pred) {
  const out = [];
  for (const n of walk(root)) if (pred(n)) out.push(n);
  return out;
}

const idclass = (n) => `${n.attrs.id || ''} ${n.attrs.class || ''} ${n.attrs.itemprop || ''}`.toLowerCase();

// ─────────────────────────────────────────────────────────────
// 3. 본문 후보 점수 매기기
// ─────────────────────────────────────────────────────────────
const NEGATIVE = /comment|reply|share|sns|social|footer|foot_|nav|menu|gnb|lnb|sidebar|side_|aside|related|recommend|popular|rank|banner|promo|advert|\bad[-_]|_ad\b|copyright|subscri|newsletter|breadcrumb|tag_?list|widget|paging|pagination|byline|reporter|저작권|무단전재|관련기사|추천기사|댓글|광고|배너/;
const POSITIVE = /article|articlebody|post|entry|content|contents|body|main|story|news|read|view|text|se-main|tt_article/;

/** 링크로만 채워진 블록(목록·메뉴)을 걸러내기 위한 링크 밀도 */
function linkDensity(node) {
  const total = textOf(node, { keepBreaks: false }).replace(/\s/g, '').length;
  if (!total) return 1;
  let link = 0;
  for (const a of findAll(node, (n) => n.tag === 'a')) {
    link += textOf(a, { keepBreaks: false }).replace(/\s/g, '').length;
  }
  return Math.min(1, link / total);
}

function scoreNode(node) {
  const paras = findAll(node, (n) => n.tag === 'p' || n.tag === 'br');
  const text = cleanText(textOf(node));
  const len = text.replace(/\s/g, '').length;
  if (len < 200) return -1;

  let score = len + paras.length * 25;
  score += (text.match(/[.。!?…]|다\.|요\./g) || []).length * 3; // 문장 부호가 많으면 산문일 확률↑

  const hint = idclass(node);
  if (NEGATIVE.test(hint)) score *= 0.25;
  if (POSITIVE.test(hint)) score *= 1.6;

  score *= 1 - linkDensity(node) * 0.9;
  return score;
}

// 사이트별 빠른 경로 — 맞으면 점수 계산을 건너뛴다
const KNOWN = [
  (n) => n.attrs.itemprop === 'articleBody',
  (n) => /^(dic_area|newsct_article|articleBodyContents|articeBody|article-view-content-div|articleBody|memo_content)$/i.test(n.attrs.id || ''),
  (n) => /(^|\s)(se-main-container|article_body|news_body|entry-content|post-content|article-body|article_view|tt_article_useless_p_margin|wrap_body|news-article-body)(\s|$)/.test(n.attrs.class || ''),
  (n) => n.tag === 'article',
];

// ─────────────────────────────────────────────────────────────
// 4. 메타데이터
// ─────────────────────────────────────────────────────────────
function meta(root, names) {
  for (const m of findAll(root, (n) => n.tag === 'meta')) {
    const key = (m.attrs.property || m.attrs.name || m.attrs.itemprop || '').toLowerCase();
    if (names.includes(key) && m.attrs.content) return decodeEntities(m.attrs.content).trim();
  }
  return '';
}

/** JSON-LD의 articleBody — 국내 언론사가 자주 심어두며 가장 깨끗하다 */
function fromJsonLd(root) {
  const found = { body: '', title: '', published: '', publisher: '' };
  for (const s of findAll(root, (n) => n.tag === 'script' && /ld\+json/i.test(n.attrs.type || ''))) {
    const raw = s.children.find((c) => typeof c === 'string');
    if (!raw) continue;
    let data;
    try { data = JSON.parse(raw.trim()); } catch { continue; }
    const stack = [data];
    while (stack.length) {
      const cur = stack.pop();
      if (Array.isArray(cur)) { stack.push(...cur); continue; }
      if (!cur || typeof cur !== 'object') continue;
      if (typeof cur.articleBody === 'string' && cur.articleBody.length > found.body.length) {
        found.body = cur.articleBody;
        found.title = typeof cur.headline === 'string' ? cur.headline : found.title;
        found.published = cur.datePublished || found.published;
        const pub = cur.publisher;
        if (pub && typeof pub === 'object' && typeof pub.name === 'string') found.publisher = pub.name;
      }
      for (const v of Object.values(cur)) if (v && typeof v === 'object') stack.push(v);
    }
  }
  return found;
}

// ─────────────────────────────────────────────────────────────
// 4-2. 이미지 후보 (공고 포스터를 찾기 위한 것)
// ─────────────────────────────────────────────────────────────
const JUNK_IMG = /sprite|icon|logo|badge|button|btn_|blank|spacer|profile|avatar|banner|app-?store|play-?store|emoji|gstatic|favicon|1x1|pixel|tracking/i;

/** 본문 포스터가 될 만한 이미지 URL 목록. og:image 를 맨 앞에 둔다. */
function imageCandidates(root, node, baseUrl) {
  const out = [];
  const add = (src) => {
    if (!src || src.startsWith('data:') || JUNK_IMG.test(src)) return;
    let abs;
    try { abs = new URL(decodeEntities(src), baseUrl || undefined).href; } catch { return; }
    if (!/^https?:/.test(abs)) return;
    if (!out.includes(abs)) out.push(abs);
  };

  add(meta(root, ['og:image', 'twitter:image', 'og:image:url']));

  // 본문 안의 이미지가 보통 실제 포스터다
  for (const img of findAll(node || root, (n) => n.tag === 'img')) {
    const a = img.attrs;
    const w = parseInt(a.width || '0', 10);
    const h = parseInt(a.height || '0', 10);
    if ((w && w < 200) || (h && h < 200)) continue; // 아이콘 크기는 버린다
    add(a.src || a['data-src'] || a['data-original'] || (a.srcset || '').split(/\s|,/)[0]);
  }
  return out;
}

// ─────────────────────────────────────────────────────────────
// 5. 진입점
// ─────────────────────────────────────────────────────────────
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36';

const EXT_BY_TYPE = { 'image/png': '.png', 'image/jpeg': '.jpg', 'image/webp': '.webp', 'image/gif': '.gif' };

/**
 * 이미지를 받아 파일로 저장한다. 저장한 파일명을 돌려주고, 실패하면 null.
 * 링커리어처럼 referer 를 보는 CDN 이 있어 헤더를 채워 보낸다.
 */
export async function downloadImage(url, destDir, baseName, { referer = '' } = {}) {
  const { writeFileSync, mkdirSync } = await import('node:fs');
  const { join } = await import('node:path');
  try {
    const res = await fetch(url, { headers: { 'user-agent': UA, ...(referer ? { referer } : {}) } });
    if (!res.ok) return null;
    const type = (res.headers.get('content-type') || '').split(';')[0].toLowerCase();
    const ext = EXT_BY_TYPE[type];
    if (!ext) return null;
    const buf = Buffer.from(await res.arrayBuffer());
    if (buf.length < 8 * 1024) return null; // 너무 작으면 아이콘일 가능성이 높다
    mkdirSync(destDir, { recursive: true });
    const name = baseName + ext;
    writeFileSync(join(destDir, name), buf);
    return name;
  } catch { return null; }
}

async function fetchHtml(url) {
  const res = await fetch(url, {
    redirect: 'follow',
    headers: { 'user-agent': UA, 'accept-language': 'ko-KR,ko;q=0.9,en;q=0.8' },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status} ${res.statusText}`);
  const buf = Buffer.from(await res.arrayBuffer());

  // 국내 사이트는 아직 euc-kr이 남아 있어 charset을 직접 본다
  let charset = (res.headers.get('content-type') || '').match(/charset=["']?([\w-]+)/i)?.[1];
  if (!charset) {
    const head = buf.subarray(0, 4096).toString('latin1');
    charset = head.match(/<meta[^>]+charset=["']?([\w-]+)/i)?.[1]
      || head.match(/<meta[^>]+content=["'][^"']*charset=([\w-]+)/i)?.[1];
  }
  charset = (charset || 'utf-8').toLowerCase().replace('ks_c_5601-1987', 'euc-kr');
  let html;
  try { html = new TextDecoder(charset).decode(buf); }
  catch { html = new TextDecoder('utf-8').decode(buf); }
  return { html, finalUrl: res.url || url };
}

// 본문 컨테이너 안에 같이 들어오는 사이트 UI 문구 — 여기부터 아래는 통째로 버린다
const TAIL_CUT = /^(?:.{0,30}(?:신고해주세요|이 공고를 스크랩|지원서 다운로드|관련 (?:채용|공고|기사)|함께 보면 좋은|이 활동에 관심|무단전재|재배포 금지|저작권자|댓글|이전글|다음글|목록으로|공유하기|구독하기).{0,30})$/m;

// 줄 단위로 지우는 잡음
const LINE_DROP = /^(?:.{0,40}(?:기자|특파원)\s*(?:=|·|\|)?\s*.{0,20}@[\w.-]+.{0,10}|\s*(?:광고|AD|SNS 공유|글자 ?크기|인쇄|스크랩)\s*)$/gm;

function trimBoilerplate(text) {
  const cut = text.match(TAIL_CUT);
  let out = cut ? text.slice(0, cut.index) : text;
  return out.replace(LINE_DROP, '').replace(/\n{3,}/g, '\n\n').trim();
}

/** "제목 - 위키백과, 우리 모두의 백과사전" 처럼 꼬리에 붙는 사이트명을 떼어낸다 */
function stripSiteSuffix(title, siteName) {
  const parts = title.split(/\s+[-|:·–—]{1,2}\s+/);
  if (parts.length < 2) return title;
  const tail = parts[parts.length - 1].trim();
  const head = parts.slice(0, -1).join(' - ').trim();
  // 꼬리가 사이트명이거나, 짧으면서 앞부분이 충분히 길 때만 자른다
  const looksLikeSite = siteName && (tail.includes(siteName) || siteName.includes(tail));
  if ((looksLikeSite || tail.length <= 20) && head.length >= 4) return head;
  return title;
}

export function extractFromHtml(html, url = '') {
  const root = parse(html);

  const titleTag = findAll(root, (n) => n.tag === 'title')[0];
  const ld = fromJsonLd(root);

  const siteName = ld.publisher
    || meta(root, ['og:site_name'])
    || (url ? new URL(url).hostname.replace(/^www\./, '') : '');

  const rawTitle = ld.title
    || meta(root, ['og:title', 'twitter:title'])
    || (titleTag ? cleanText(textOf(titleTag)) : '')
    || '';
  const title = stripSiteSuffix(rawTitle, siteName);

  const byline = meta(root, ['author', 'article:author', 'dable:author']);
  const publishedAt = ld.published || meta(root, ['article:published_time', 'og:regdate', 'date']);
  const description = meta(root, ['og:description', 'description', 'twitter:description']);

  // (1) JSON-LD 본문이 충분하면 그대로 쓴다
  let text = cleanText(ld.body.replace(/<br\s*\/?>/gi, '\n'));
  let how = 'json-ld';
  let bodyNode = null; // 이미지 후보를 좁히는 데 쓴다

  // (2) 사이트별 알려진 컨테이너
  if (text.length < 400) {
    for (const pred of KNOWN) {
      const hit = findAll(root, pred)
        .map((n) => ({ n, t: cleanText(textOf(n)) }))
        .sort((a, b) => b.t.length - a.t.length)[0];
      if (hit && hit.t.length > 400 && linkDensity(hit.n) < 0.4) {
        text = hit.t; how = 'known-selector'; bodyNode = hit.n; break;
      }
    }
  }

  // (3) 점수 기반 폴백
  if (text.length < 400) {
    let best = null, bestScore = 0;
    for (const n of walk(root)) {
      if (!['div', 'article', 'section', 'main', 'td'].includes(n.tag)) continue;
      if (DROP.has(n.tag)) continue;
      const s = scoreNode(n);
      // 점수가 같으면 더 깊은(=더 좁은) 쪽을 택해 껍데기 div를 피한다
      if (s > bestScore * 1.05) { best = n; bestScore = s; }
    }
    if (best) { text = cleanText(textOf(best)); how = 'scored'; bodyNode = best; }
  }

  // 본문 컨테이너를 못 잡았으면 KNOWN 선택자로 한 번 더 시도 (이미지만이라도 건지게)
  if (!bodyNode) {
    for (const pred of KNOWN) {
      const hit = findAll(root, pred)[0];
      if (hit) { bodyNode = hit; break; }
    }
  }
  const images = imageCandidates(root, bodyNode, url);

  text = trimBoilerplate(text);

  return { url, title, siteName, byline, publishedAt, description, text, images, how, chars: text.length };
}

export async function extractFromUrl(url) {
  const { html, finalUrl } = await fetchHtml(url);
  return extractFromHtml(html, finalUrl);
}
