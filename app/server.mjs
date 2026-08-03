// 로컬 웹앱 — 링크 붙여넣기 → 본문 추출 → 카드 미리보기/수정 → PNG
// 실행: node app/server.mjs   →  http://localhost:3000

import { createServer } from 'node:http';
import { readFileSync, writeFileSync, existsSync, mkdirSync, readdirSync, statSync, rmSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join, extname, normalize } from 'node:path';

import { extractFromUrl, downloadImage } from './extract.mjs';
import { cardsFromArticle, cardsFromTopic, hasApiKey } from './llm.mjs';
import { cardHTML, FIELDS } from './cards.mjs';
import { renderProject } from './render.mjs';

const APP = dirname(fileURLToPath(import.meta.url));
const ROOT = dirname(APP);
const WORK = join(ROOT, 'work');
const OUTPUT = join(ROOT, 'output');
const FONTS = join(ROOT, 'build', 'fonts');
const ASSETS = join(ROOT, 'build', 'assets');
const PORT = Number(process.env.PORT) || 3000;

mkdirSync(WORK, { recursive: true });

// ─────────────────────────────────────────────────────────────
// 유틸
// ─────────────────────────────────────────────────────────────
const MIME = {
  '.html': 'text/html; charset=utf-8', '.png': 'image/png', '.otf': 'font/otf',
  '.ttf': 'font/ttf', '.json': 'application/json; charset=utf-8',
  '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp', '.gif': 'image/gif',
};

const send = (res, code, body, type = 'text/plain; charset=utf-8') => {
  res.writeHead(code, { 'content-type': type, 'cache-control': 'no-store' });
  res.end(body);
};
const json = (res, code, obj) => send(res, code, JSON.stringify(obj), MIME['.json']);

function readBody(req) {
  return new Promise((resolve, reject) => {
    let n = 0;
    const chunks = [];
    req.on('data', (c) => {
      n += c.length;
      if (n > 2 * 1024 * 1024) { reject(new Error('요청이 너무 큽니다.')); req.destroy(); return; }
      chunks.push(c);
    });
    req.on('end', () => {
      try { resolve(JSON.parse(Buffer.concat(chunks).toString('utf8') || '{}')); }
      catch (e) { reject(new Error('JSON 파싱 실패: ' + e.message)); }
    });
    req.on('error', reject);
  });
}

/** 본문을 Buffer 그대로 받는다 (이미지 업로드용) */
function readRaw(req, limit) {
  return new Promise((resolve, reject) => {
    let n = 0;
    const chunks = [];
    req.on('data', (c) => {
      n += c.length;
      if (n > limit) { reject(new Error(`파일이 너무 큽니다 (최대 ${Math.round(limit / 1024 / 1024)}MB)`)); req.destroy(); return; }
      chunks.push(c);
    });
    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', reject);
  });
}

/** 경로 조작 방지 — base 밖으로 나가는 요청은 거절 */
function safeJoin(base, ...parts) {
  const p = normalize(join(base, ...parts));
  if (!p.startsWith(normalize(base))) throw new Error('잘못된 경로');
  return p;
}

const isSlug = (s) => /^[\w가-힣-]{1,80}$/.test(s || '');

function makeSlug(article) {
  const d = new Date();
  const date = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`;
  const name = (article.title || 'untitled')
    .replace(/[^\w가-힣\s-]/g, '')
    .trim().replace(/\s+/g, '-')
    .slice(0, 24).replace(/-+$/, '') || 'untitled';

  let slug = `${date}-${name}`;
  let n = 2;
  while (existsSync(join(WORK, slug))) slug = `${date}-${name}-${n++}`;
  return slug;
}

const docPath = (slug) => safeJoin(WORK, slug, 'cards.json');
const srcPath = (slug) => safeJoin(WORK, slug, 'source.json');
const imgDir = (slug) => safeJoin(WORK, slug, 'images');
const readDoc = (slug) => JSON.parse(readFileSync(docPath(slug), 'utf8'));

function listProjects() {
  if (!existsSync(WORK)) return [];
  return readdirSync(WORK)
    .filter((d) => existsSync(join(WORK, d, 'cards.json')))
    .map((slug) => {
      const doc = readDoc(slug);
      return {
        slug,
        title: doc.source?.title || slug,
        count: doc.cards?.length || 0,
        at: statSync(join(WORK, slug, 'cards.json')).mtimeMs,
      };
    })
    .sort((a, b) => b.at - a.at);
}

// ─────────────────────────────────────────────────────────────
// 라우팅
// ─────────────────────────────────────────────────────────────
const routes = {
  async 'POST /api/extract'(req, res) {
    const { url } = await readBody(req);
    let target;
    try { target = new URL(url); } catch { return json(res, 400, { error: '주소 형식이 올바르지 않습니다.' }); }
    if (!/^https?:$/.test(target.protocol)) return json(res, 400, { error: 'http/https 주소만 됩니다.' });

    const article = await extractFromUrl(target.href);
    if (article.chars < 200) {
      return json(res, 422, {
        error: `본문을 충분히 추출하지 못했습니다 (${article.chars}자). 다른 링크를 시도하거나 본문을 직접 붙여넣어 주세요.`,
        article,
      });
    }

    const { cards, mode } = await cardsFromArticle(article);
    const slug = makeSlug(article);
    mkdirSync(join(WORK, slug), { recursive: true });

    // 공고 포스터를 받아둔다 — 1장 배경이 되고, 구조화 정보의 원본이기도 하다
    let poster = null;
    for (const src of article.images.slice(0, 4)) {
      poster = await downloadImage(src, imgDir(slug), 'poster', { referer: article.url });
      if (poster) break;
    }
    if (poster) cards[0].image = poster;

    const doc = {
      handle: 'erai_log',
      style: poster ? '02_photo' : '01_sky',
      source: { url: article.url, title: article.title, publisher: article.siteName },
      cards,
    };
    writeFileSync(srcPath(slug), JSON.stringify(article, null, 2), 'utf8');
    writeFileSync(docPath(slug), JSON.stringify(doc, null, 2), 'utf8');

    json(res, 200, { slug, doc, mode, poster, article: { ...article, text: article.text.slice(0, 4000) } });
  },

  /**
   * 카드 배경 이미지 업로드. 멀티파트 대신 본문에 바이트를 그대로 받는다.
   * POST /api/upload?slug=...&card=0   content-type: image/*
   */
  async 'POST /api/upload'(req, res, url) {
    const slug = url.searchParams.get('slug');
    const card = Number(url.searchParams.get('card'));
    if (!isSlug(slug) || !existsSync(docPath(slug))) return json(res, 404, { error: '없는 프로젝트' });

    const type = (req.headers['content-type'] || '').split(';')[0].toLowerCase();
    const ext = { 'image/png': '.png', 'image/jpeg': '.jpg', 'image/webp': '.webp' }[type];
    if (!ext) return json(res, 415, { error: `지원하지 않는 형식입니다 (${type || '알 수 없음'}). PNG·JPG·WEBP 만 됩니다.` });

    const buf = await readRaw(req, 12 * 1024 * 1024);
    const doc = readDoc(slug);
    if (!doc.cards[card]) return json(res, 400, { error: '없는 카드' });

    mkdirSync(imgDir(slug), { recursive: true });
    const name = `card${String(card + 1).padStart(2, '0')}_${Date.now()}${ext}`;
    writeFileSync(safeJoin(imgDir(slug), name), buf);

    doc.cards[card].image = name;
    doc.style = '02_photo';
    writeFileSync(docPath(slug), JSON.stringify(doc, null, 2), 'utf8');
    json(res, 200, { image: name, kb: Math.round(buf.length / 1024) });
  },

  /** 링크 없이 주제만으로 만들기 (자격증·전형 정보 또는 전공·학문 설명형) */
  async 'POST /api/compose'(req, res) {
    const { topic, kind } = await readBody(req);
    if (!topic || String(topic).trim().length < 4) {
      return json(res, 400, { error: '무엇을 만들지 조금 더 자세히 적어주세요.' });
    }

    const { cards, factsToVerify, mode } = await cardsFromTopic(topic, kind === 'major' ? 'major' : 'general');
    const slug = makeSlug({ title: String(topic).trim().split('\n')[0] });
    mkdirSync(join(WORK, slug), { recursive: true });

    const doc = {
      handle: 'erai_log',
      style: '01_sky',
      source: { topic: String(topic).trim(), title: String(topic).trim().split('\n')[0] },
      factsToVerify: factsToVerify || [],
      cards,
    };
    writeFileSync(docPath(slug), JSON.stringify(doc, null, 2), 'utf8');
    json(res, 200, { slug, doc, mode });
  },

  'GET /api/projects'(req, res) {
    json(res, 200, { projects: listProjects(), hasApiKey: hasApiKey(), fields: FIELDS });
  },

  async 'POST /api/save'(req, res) {
    const { slug, doc } = await readBody(req);
    if (!isSlug(slug) || !existsSync(docPath(slug))) return json(res, 404, { error: '없는 프로젝트' });
    if (!doc?.cards?.length) return json(res, 400, { error: '카드가 비어 있습니다.' });
    writeFileSync(docPath(slug), JSON.stringify(doc, null, 2), 'utf8');
    json(res, 200, { ok: true });
  },

  async 'POST /api/render'(req, res) {
    const { slug } = await readBody(req);
    if (!isSlug(slug) || !existsSync(docPath(slug))) return json(res, 404, { error: '없는 프로젝트' });
    const r = renderProject(slug);
    json(res, 200, { files: r.files.map((f) => ({ ...f, url: `/output/${slug}/${f.name}` })) });
  },

  /** 작업 완전 삭제 — work/ (원문·이미지·카드 JSON), output/ (PNG), build/html/ (중간 HTML) 전부 지운다 */
  async 'POST /api/project/delete'(req, res) {
    const { slug } = await readBody(req);
    if (!isSlug(slug) || !existsSync(join(WORK, slug))) return json(res, 404, { error: '없는 프로젝트' });
    rmSync(join(WORK, slug), { recursive: true, force: true });
    if (existsSync(join(OUTPUT, slug))) rmSync(join(OUTPUT, slug), { recursive: true, force: true });
    const htmlDir = join(ROOT, 'build', 'html', slug);
    if (existsSync(htmlDir)) rmSync(htmlDir, { recursive: true, force: true });
    json(res, 200, { ok: true });
  },
};

const server = createServer(async (req, res) => {
  const url = new URL(req.url, `http://localhost:${PORT}`);
  const path = decodeURIComponent(url.pathname);

  try {
    const route = routes[`${req.method} ${path}`];
    if (route) return await route(req, res, url);

    if (req.method !== 'GET') return send(res, 405, 'Method Not Allowed');

    // UI
    if (path === '/' || path === '/index.html') {
      return send(res, 200, readFileSync(join(APP, 'ui.html')), MIME['.html']);
    }

    // 폰트
    let m = path.match(/^\/fonts\/([\w.-]+)$/);
    if (m) {
      const f = safeJoin(FONTS, m[1]);
      if (!existsSync(f)) return send(res, 404, 'font not found');
      res.writeHead(200, { 'content-type': MIME[extname(f)] || 'application/octet-stream' });
      return res.end(readFileSync(f));
    }

    // 카드 미리보기 HTML (iframe 이 이걸 띄운다)
    m = path.match(/^\/card\/([^/]+)\/(\d+)$/);
    if (m && isSlug(m[1]) && existsSync(docPath(m[1]))) {
      const html = cardHTML(readDoc(m[1]), Number(m[2]), {
        fontBase: '/fonts/',
        imageBase: `/img/${encodeURIComponent(m[1])}/`,
      });
      return send(res, 200, html, MIME['.html']);
    }

    // 공용 자산 (프로필 사진 등)
    m = path.match(/^\/asset\/([\w.-]+)$/);
    if (m) {
      const f = safeJoin(ASSETS, m[1]);
      if (!existsSync(f)) return send(res, 404, 'asset not found');
      res.writeHead(200, { 'content-type': MIME[extname(f)] || 'application/octet-stream' });
      return res.end(readFileSync(f));
    }

    // 카드 배경 이미지
    m = path.match(/^\/img\/([^/]+)\/([\w.-]+)$/);
    if (m && isSlug(m[1])) {
      const f = safeJoin(imgDir(m[1]), m[2]);
      if (!existsSync(f)) return send(res, 404, 'image not found');
      res.writeHead(200, { 'content-type': MIME[extname(f)] || 'image/jpeg', 'cache-control': 'no-store' });
      return res.end(readFileSync(f));
    }

    // 렌더 결과 PNG
    m = path.match(/^\/output\/([^/]+)\/([\w.-]+\.png)$/);
    if (m && isSlug(m[1])) {
      const f = safeJoin(OUTPUT, m[1], m[2]);
      if (!existsSync(f)) return send(res, 404, 'png not found');
      res.writeHead(200, { 'content-type': 'image/png', 'cache-control': 'no-store' });
      return res.end(readFileSync(f));
    }

    // 프로젝트 하나
    m = path.match(/^\/api\/project\/([^/]+)$/);
    if (m && isSlug(m[1]) && existsSync(docPath(m[1]))) {
      return json(res, 200, { slug: m[1], doc: readDoc(m[1]) });
    }

    send(res, 404, 'Not Found');
  } catch (err) {
    console.error(`  ! ${req.method} ${path} —`, err.message);
    if (!res.headersSent) json(res, 500, { error: err.message });
  }
});

server.listen(PORT, () => {
  console.log(`\n  카드뉴스 스튜디오  http://localhost:${PORT}`);
  console.log(`  LLM 모드: ${hasApiKey() ? 'Claude API 자동' : '수동 (ANTHROPIC_API_KEY 없음 → 초안만 생성)'}\n`);
});
