// 포스터의 작은 글씨를 확대해 스크린샷 — 공고 정보를 눈으로 확인할 때 쓴다.
// 결과는 build/html/_zoom.png. Read 툴로 열어보면 된다.
//
// 사용: node app/zoom.mjs <이미지경로> <원본가로> <cropX> <cropY> <cropW> <cropH> [배율]
// 예  : node app/zoom.mjs work/20260722-CJ.../images/poster.jpg 1457 690 1590 767 260 3.2

import { execFileSync } from 'node:child_process';
import { writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join, resolve } from 'node:path';

const ROOT = dirname(dirname(fileURLToPath(import.meta.url)));

const CHROME = [
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
].find(existsSync);
if (!CHROME) throw new Error('Chrome 실행 파일을 찾지 못했습니다.');

const [img, ow, cx, cy, cw, ch, zArg] = process.argv.slice(2);
if (!img || !ow || !cw) {
  console.error('사용법: node app/zoom.mjs <이미지> <원본가로> <cropX> <cropY> <cropW> <cropH> [배율]');
  process.exit(1);
}

const z = Number(zArg || 3);
const W = Math.round(Number(cw) * z);
const H = Math.round(Number(ch) * z);

const html = `<html><body style="margin:0;overflow:hidden;width:${W}px;height:${H}px;background:#fff">
<img src="${pathToFileURL(resolve(ROOT, img)).href}"
     style="position:absolute;width:${Math.round(Number(ow) * z)}px;
            left:${-Math.round(Number(cx) * z)}px;top:${-Math.round(Number(cy) * z)}px">
</body></html>`;

const htmlPath = join(ROOT, 'build', 'html', '_zoom.html');
const pngPath = join(ROOT, 'build', 'html', '_zoom.png');
mkdirSync(dirname(htmlPath), { recursive: true });
writeFileSync(htmlPath, html);

execFileSync(CHROME, [
  '--headless=new', '--disable-gpu', '--hide-scrollbars', '--no-first-run',
  `--user-data-dir=${join(ROOT, 'build', '.chrome-profile')}`,
  '--allow-file-access-from-files',
  `--window-size=${W},${H}`, '--virtual-time-budget=6000',
  `--screenshot=${pngPath}`,
  `${pathToFileURL(htmlPath).href}?v=${Date.now()}`, // 캐시 무효화
], { stdio: 'pipe' });

console.log(`  ✓ ${pngPath}  (${W}x${H})`);
