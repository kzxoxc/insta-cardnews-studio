// 텔레그램 봇 — 폰에서 링크·주제 보내면 카드뉴스 자동 생성해 회신한다.
// 토큰은 TELEGRAM_BOT_TOKEN 환경변수로만 읽는다 (코드·저장소에 넣지 않는다).
// 단독 실행:  node app/telegram.mjs check   → 새 메시지 확인 (offset 갱신)

import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const APP = dirname(fileURLToPath(import.meta.url));
const ROOT = dirname(APP);
const OFFSET_FILE = join(ROOT, 'work', '.telegram_offset.json');

const TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const api = (method) => `https://api.telegram.org/bot${TOKEN}/${method}`;

function requireToken() {
  if (!TOKEN) throw new Error('TELEGRAM_BOT_TOKEN 환경변수가 없습니다.');
}

function readOffset() {
  if (!existsSync(OFFSET_FILE)) return 0;
  return JSON.parse(readFileSync(OFFSET_FILE, 'utf8')).offset || 0;
}

function writeOffset(offset) {
  writeFileSync(OFFSET_FILE, JSON.stringify({ offset }), 'utf8');
}

/** 마지막으로 처리한 다음 메시지부터 가져오고, offset 파일을 갱신한다 */
export async function fetchNewMessages() {
  requireToken();
  const offset = readOffset();
  const res = await fetch(`${api('getUpdates')}?offset=${offset}&timeout=0`);
  const data = await res.json();
  if (!data.ok) throw new Error('getUpdates 실패: ' + JSON.stringify(data));

  const updates = data.result;
  if (updates.length) writeOffset(updates[updates.length - 1].update_id + 1);

  return updates
    .filter((u) => u.message?.text)
    .map((u) => ({
      chatId: u.message.chat.id,
      from: u.message.from?.username || u.message.from?.first_name || '',
      text: u.message.text,
      date: u.message.date,
    }));
}

export async function sendMessage(chatId, text) {
  requireToken();
  const res = await fetch(api('sendMessage'), {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ chat_id: chatId, text }),
  });
  return res.json();
}

/** 카드뉴스 PNG 세트를 앨범으로 보낸다 (텔레그램 제한상 최대 10장씩 나눠 보낸다) */
export async function sendPhotoGroup(chatId, filePaths) {
  requireToken();
  const results = [];
  for (let i = 0; i < filePaths.length; i += 10) {
    const batch = filePaths.slice(i, i + 10);
    const form = new FormData();
    form.append('chat_id', String(chatId));
    form.append('media', JSON.stringify(batch.map((_, j) => ({ type: 'photo', media: `attach://p${j}` }))));
    batch.forEach((p, j) => form.append(`p${j}`, new Blob([readFileSync(p)]), `${i + j}.png`));
    const res = await fetch(api('sendMediaGroup'), { method: 'POST', body: form });
    results.push(await res.json());
  }
  return results;
}

// CLI: 새 메시지 확인만 하고 콘솔에 찍는다 (크론 프롬프트가 직접 부른다)
if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1] && process.argv[2] === 'check') {
  const msgs = await fetchNewMessages();
  console.log(JSON.stringify(msgs, null, 2));
}
