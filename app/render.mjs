// 카드 JSON → PNG (Chrome 헤드리스)
// 단독 실행:  node app/render.mjs <슬러그>

import { mkdirSync, writeFileSync, existsSync, statSync, readFileSync, rmSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';

import { cardHTML } from './cards.mjs';

const APP = dirname(fileURLToPath(import.meta.url));
export const ROOT = dirname(APP);
export const WORK = join(ROOT, 'work');
const BUILD = join(ROOT, 'build');
const FONTS = join(BUILD, 'fonts');

// Windows 로컬 + 리눅스 클라우드(예약 작업) 양쪽 다 지원한다
const CHROME = [
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
  '/usr/bin/google-chrome',
  '/usr/bin/google-chrome-stable',
  '/usr/bin/chromium',
  '/usr/bin/chromium-browser',
].find(existsSync);

/** 렌더용 폰트·자산 경로 — file:/// 절대경로여야 헤드리스에서 잡힌다 */
const FONT_BASE = pathToFileURL(join(FONTS, '/')).href;
const ASSET_BASE = pathToFileURL(join(BUILD, 'assets', '/')).href;

export function renderProject(slug, { onProgress } = {}) {
  if (!CHROME) throw new Error('Chrome 실행 파일을 찾지 못했습니다.');

  const doc = JSON.parse(readFileSync(join(WORK, slug, 'cards.json'), 'utf8'));
  // 배경 사진도 file:/// 절대경로여야 헤드리스에서 로딩된다
  const IMAGE_BASE = pathToFileURL(join(WORK, slug, 'images', '/')).href;
  const htmlDir = join(BUILD, 'html', slug);
  const outDir = join(ROOT, 'output', slug);
  mkdirSync(htmlDir, { recursive: true });
  mkdirSync(outDir, { recursive: true });

  // 카드 수가 줄었을 때 이전 렌더가 남지 않도록 비우고 시작
  for (const f of ['01', '02', '03', '04', '05', '06', '07', '08', '09', '10']) {
    const stale = join(outDir, `${f}.png`);
    if (existsSync(stale)) rmSync(stale);
  }

  const files = [];
  doc.cards.forEach((_, i) => {
    const no = String(i + 1).padStart(2, '0');
    const htmlPath = join(htmlDir, `${no}.html`);
    const pngPath = join(outDir, `${no}.png`);
    writeFileSync(htmlPath, cardHTML(doc, i, {
      fontBase: FONT_BASE, imageBase: IMAGE_BASE, assetBase: ASSET_BASE,
    }), 'utf8');

    execFileSync(CHROME, [
      '--headless=new',
      '--disable-gpu',
      '--hide-scrollbars',
      '--no-first-run',
      `--user-data-dir=${join(BUILD, '.chrome-profile')}`, // 실행 중인 Chrome 과 충돌 방지
      '--allow-file-access-from-files',
      '--force-device-scale-factor=2',                      // 1080×1350 → 2160×2700
      '--window-size=1080,1350',
      '--virtual-time-budget=8000',
      `--screenshot=${pngPath}`,
      `${pathToFileURL(htmlPath).href}?v=${Date.now()}`,     // 캐시 무효화: 없으면 옛 렌더가 그대로 나온다
    ], { stdio: 'pipe' });

    if (!existsSync(pngPath)) throw new Error(`${no}.png 생성 실패`);
    const kb = Math.round(statSync(pngPath).size / 1024);
    files.push({ no, name: `${no}.png`, kb });
    onProgress?.({ done: i + 1, total: doc.cards.length, name: `${no}.png` });
  });

  // 캡션은 카드 문구와 함께 채워두는 doc.caption 을 그대로 내보낸다 (없으면 만들지 않는다)
  if (doc.caption && doc.caption.trim()) {
    writeFileSync(join(outDir, 'caption.txt'), doc.caption.trim() + '\n', 'utf8');
  }

  return { slug, outDir, files };
}

// CLI
if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const slug = process.argv[2];
  if (!slug) {
    console.error('사용법: node app/render.mjs <슬러그>');
    process.exit(1);
  }
  const r = renderProject(slug, {
    onProgress: ({ done, total, name }) => console.log(`  [${done}/${total}] ${name}`),
  });
  console.log(`\n  ✓ ${r.files.length}장 → ${r.outDir}`);
}
