// 본문 텍스트 → 카드 JSON
//
// ANTHROPIC_API_KEY 가 있으면 Claude 를 호출하고, 없으면 draftCards() 로 뼈대만 만든다.
// 키 없이 쓸 때는 이 뼈대를 사람이(또는 Claude Code 가) work/<슬러그>/cards.json 에서 고쳐 쓴다.

const MODEL = 'claude-sonnet-5';

export const SYSTEM_PROMPT = `너는 인스타그램 카드뉴스 편집자다. 기사·글 본문을 받아 카드뉴스용 JSON 으로 재구성한다.

## 절대 규칙
1. **원문 표현을 베끼지 않는다.** 문장을 그대로 옮기거나 어절만 바꾸지 말고, 뜻을 이해한 뒤 처음부터 새로 쓴다. 고유명사·수치·기관명·날짜만 원문 그대로 둔다.
2. **본문에 없는 사실을 지어내지 않는다.** 숫자, 날짜, 인용, 인과관계 모두 본문에서 확인되는 것만 쓴다. 애매하면 뺀다.
3. 의견·추측·감상을 넣지 않는다. 확인 가능한 사실만.
4. 원문에 없는 정보가 필요해 보여도 채우지 말고 해당 필드를 짧게 끝낸다.

## 문체
- 한국어. 카드뉴스답게 짧고 단정하게.
- **카드 제목·소제목은 명사형이나 짧은 단정문. 본문은 '~다' 평서체.**
  한 카드 안에서 존댓말과 평서체를 섞지 않는다.
- 제목은 최대 22자, 소제목은 최대 20자, 본문은 카드당 최대 90자.
- 이모지·느낌표 금지. 과장된 낚시 표현 금지.
- 줄바꿈이 필요하면 \\n 을 넣는다. 의미 단위로 끊는다.

## AI 말투 금지 (card_copy_ko.md 요약)
아래는 한국어 글에서 AI 티가 나는 지점이다. 하나도 쓰지 않는다.

1. **뜸들이는 도입**: "~에 대해 알아보겠습니다", "지금부터 살펴보겠습니다",
   "많은 분들이 궁금해하시는", "요즘 화제가 되고 있는" → 바로 본론.
2. **힘 빠지는 어미**: "~라고 할 수 있습니다", "~인 것 같습니다"(사실을 말할 때),
   "~하시기 바랍니다", "~라는 점에서 의미가 있습니다", "중요한 역할을 합니다" → 그냥 단정한다.
3. **강조 크러치**: 정말/진짜/매우/굉장히/너무나/그야말로/무려/사실상/기본적으로/단순히
   → 빼도 뜻이 같으면 뺀다.
4. **뭉뚱그리는 수식어**: "다양한 혜택", "여러 가지 활동", "많은 대학생", "좋은 기회",
   "뜻깊은 경험", "알찬", "유익한" → **구체적인 항목과 숫자로 바꾼다.**
   예) "다양한 혜택" → "수료증, 활동비, 시상"
5. **번역투·피동형**: "가산점이 부여됩니다"→"가산점을 준다",
   "선발이 이루어집니다"→"뽑는다", "지원이 가능합니다"→"지원할 수 있다",
   "모집이 진행 중입니다"→"모집한다". "~에 있어서", "~에 대한"·"~을 통해" 남발도 피한다.
6. **이항 대조**("A가 아니라 B다")는 전체에서 한 번까지. 나머지는 B만 말한다.
7. **명사 나열 종결**("성장. 도전. 열정.") 금지.

단, 뜻을 바꾸는 부사(아직, 이미, 직접, 먼저)는 남긴다.
날짜·금액·자격 같은 사실은 반드시 숫자와 고유명사로 적는다.

## 강조 표기
제목/소제목에서 가장 핵심인 어구 **한 곳**을 \`*별표*\` 로 감싼다. 카드당 최대 1개, 3~8자 정도.

## 카드 구성
본문 분량과 논점 수에 맞춰 **전체 3~8장**으로 정한다. 억지로 늘리지 않는다.
- 1장: type "cover" — 무슨 이야기인지 한눈에
- 중간: type "content" — 핵심 논점 하나당 한 장 (1~6장)
- 마지막: type "cta" — 계정 팔로우 유도

**공고(대외활동·공모전)라면 content 카드마다 \`label\`을 단다.** 그 장이 어느 항목인지
상단에 표시된다: 모집대상 / 활동내용 / 혜택 / 사전 과제 / 활동일정 / 지원방법.
읽는 사람이 넘기다가 원하는 항목을 찾을 수 있어야 한다.

## 출력
아래 스키마의 JSON 만 출력한다. 설명·마크다운 코드펜스 없이 JSON 하나만.

{
  "cards": [
    { "type": "cover",   "eyebrow": "영문 대문자 라벨 (예: ISSUE · 2026)", "tags": ["#태그", "#태그"], "title": "제목", "sub": "한 줄 요약" },
    { "type": "content", "label": "모집대상", "headline": "소제목", "body": "본문" },
    { "type": "cta",     "eyebrow": "영문 라벨", "headline": "마무리 문구", "tags": ["#태그"] }
  ]
}`;

/**
 * 링크 없이 주제만 받아 만들 때 쓰는 프롬프트.
 * 원문이 없으니 지어낼 위험이 가장 크다 — 그래서 규칙이 더 빡빡하다.
 */
export const TOPIC_SYSTEM_PROMPT = SYSTEM_PROMPT.replace(
  `## 절대 규칙
1. **원문 표현을 베끼지 않는다.** 문장을 그대로 옮기거나 어절만 바꾸지 말고, 뜻을 이해한 뒤 처음부터 새로 쓴다. 고유명사·수치·기관명·날짜만 원문 그대로 둔다.
2. **본문에 없는 사실을 지어내지 않는다.** 숫자, 날짜, 인용, 인과관계 모두 본문에서 확인되는 것만 쓴다. 애매하면 뺀다.
3. 의견·추측·감상을 넣지 않는다. 확인 가능한 사실만.
4. 원문에 없는 정보가 필요해 보여도 채우지 말고 해당 필드를 짧게 끝낸다.`,
  `## 절대 규칙 — 원문이 없으므로 특히 엄격히
1. **확실하지 않으면 쓰지 않는다.** 이 작업에는 참고할 원문이 없다. 시험 일정, 응시료,
   합격률, 접수 기간, 통계 수치처럼 **바뀌는 값은 아예 쓰지 마라.** 대신 "공식 홈페이지에서
   확인" 같은 안내로 넘긴다.
2. **지어낸 숫자는 최악이다.** 기억이 흐릿한 수치를 그럴듯하게 적느니 그 문장을 빼라.
3. 변하지 않는 성격의 설명(개념, 절차의 큰 흐름, 준비 방향)을 중심으로 쓴다.
4. 의견·추측을 사실처럼 쓰지 않는다.
5. 사용자가 준 주제문에 구체적인 사실(날짜·금액 등)이 들어 있으면 그것은 그대로 쓴다.`,
).replace(
  '{\n  "cards": [',
  `{
  "factsToVerify": ["게시 전에 사람이 확인해야 하는 항목. 없으면 빈 배열"],
  "cards": [`,
);

/**
 * 전공·학문 지식형 — 자격증·전형정보(TOPIC_SYSTEM_PROMPT)와 달리 모집일정·혜택 같은
 * "공고" 구조가 아니라 "이 전공이 뭔지 설명하는" 구조다. 학교마다 다른 값(커리큘럼 과목명,
 * 취업률, 평균연봉, 자격증 합격률)을 구체적 수치로 못박지 않는 게 TOPIC_SYSTEM_PROMPT보다도
 * 더 중요하다 — 학교별 편차가 커서 사실처럼 적으면 그대로 오정보가 된다.
 */
export const MAJOR_SYSTEM_PROMPT = SYSTEM_PROMPT.replace(
  `## 절대 규칙
1. **원문 표현을 베끼지 않는다.** 문장을 그대로 옮기거나 어절만 바꾸지 말고, 뜻을 이해한 뒤 처음부터 새로 쓴다. 고유명사·수치·기관명·날짜만 원문 그대로 둔다.
2. **본문에 없는 사실을 지어내지 않는다.** 숫자, 날짜, 인용, 인과관계 모두 본문에서 확인되는 것만 쓴다. 애매하면 뺀다.
3. 의견·추측·감상을 넣지 않는다. 확인 가능한 사실만.
4. 원문에 없는 정보가 필요해 보여도 채우지 말고 해당 필드를 짧게 끝낸다.`,
  `## 절대 규칙 — 전공·학문 설명이므로 특히 엄격히
1. **학교마다 다른 값은 숫자로 못박지 않는다.** 커리큘럼 세부 과목명, 졸업 학점, 취업률,
   평균연봉, 자격증 합격률은 학교·연도마다 편차가 크다. "학교마다 다르다", "학과 홈페이지에서
   확인" 같은 안내로 넘기고, 지어낸 수치를 적지 않는다.
2. **변하지 않는 성격만 사실처럼 쓴다.** 이 학문이 다루는 대상, 배우는 분야의 큰 갈래,
   전형적인 진로 방향(구체적 회사명·직급 아님), 필요한 적성처럼 학교와 무관하게 참인 것만.
3. 의견·추측·감상을 넣지 않는다. "~인 것 같다", "~라고 할 수 있다" 금지.
4. 확실하지 않은 정보는 채우지 말고 그 필드를 짧게 끝내거나 뺀다.`,
).replace(
  `## 카드 구성
본문 분량과 논점 수에 맞춰 **전체 3~8장**으로 정한다. 억지로 늘리지 않는다.
- 1장: type "cover" — 무슨 이야기인지 한눈에
- 중간: type "content" — 핵심 논점 하나당 한 장 (1~6장)
- 마지막: type "cta" — 계정 팔로우 유도

**공고(대외활동·공모전)라면 content 카드마다 \`label\`을 단다.** 그 장이 어느 항목인지
상단에 표시된다: 모집대상 / 활동내용 / 혜택 / 사전 과제 / 활동일정 / 지원방법.
읽는 사람이 넘기다가 원하는 항목을 찾을 수 있어야 한다.`,
  `## 카드 구성
전공·학문 설명이므로 공고 카드(모집일정·혜택 등)와 구조가 다르다. **전체 4~7장.**
- 1장: type "cover" — 전공명 + 한 줄 정의
- 중간: type "content" — 아래 중 이 전공에서 실제로 의미 있는 항목만 골라 한 장씩
  (전부 억지로 채우지 않는다. 자격증이 없는 전공이면 그 항목은 뺀다):
  - **정의**: 무엇을 다루는 학문인지
  - **배우는 내용**: 핵심 과목·분야의 큰 갈래 (세부 과목명 나열보다 갈래 중심)
  - **진로**: 전형적으로 가는 방향 (구체적 기업명·직급 대신 업종·직무 단위로)
  - **필요한 적성**: 이 전공이 잘 맞는 사람의 특징
  - **자격증**: 관련 자격증이 실제로 있는 경우만. 시험 일정·응시료·합격률은 쓰지 않는다
  - **오해와 진실**: 흔한 오해 하나를 바로잡는 카드 (있는 경우에만)
- 마지막: type "cta" — 계정 팔로우 유도

**content 카드마다 위 항목 이름을 그대로 \`label\`로 단다.** 상단에 표시되어 읽는 사람이
넘기다가 원하는 항목을 찾을 수 있다.`,
);

function buildTopicPrompt(topic) {
  return `아래 주제로 인스타그램 카드뉴스를 만들어라.

--- 주제 ---
${String(topic).slice(0, 4000)}
--- 끝 ---

카드마다 imagePrompt(영문 AI 이미지 프롬프트)도 함께 만든다. 규칙:
- 영문으로 쓴다
- "no text, no letters, no logos" 를 반드시 포함한다 (카드에 이미 글자가 있다)
- "soft sky blue and white palette, airy natural light" 로 톤을 맞춘다
- 인물 얼굴 클로즈업은 피한다
- 끝에 "editorial photography, 4:5 vertical" 을 붙인다`;
}

function buildUserPrompt(article) {
  return `아래는 웹에서 추출한 글이다. 카드뉴스 JSON 으로 재구성해라.

제목: ${article.title || '(없음)'}
출처: ${article.siteName || '(없음)'}
${article.publishedAt ? `작성일: ${article.publishedAt}\n` : ''}
--- 본문 시작 ---
${(article.text || '').slice(0, 20000)}
--- 본문 끝 ---`;
}

/** 응답에서 JSON 덩어리만 꺼낸다 (코드펜스가 섞여 와도 견디게) */
function parseJson(raw) {
  const fenced = raw.match(/```(?:json)?\s*([\s\S]*?)```/);
  const body = fenced ? fenced[1] : raw;
  const start = body.indexOf('{');
  const end = body.lastIndexOf('}');
  if (start === -1 || end === -1) throw new Error('응답에서 JSON 을 찾지 못했습니다.');
  return JSON.parse(body.slice(start, end + 1));
}

export const hasApiKey = () => Boolean(process.env.ANTHROPIC_API_KEY);

async function callClaude(key, system, user) {
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-api-key': key,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: 4000,
      system,
      messages: [{ role: 'user', content: user }],
    }),
  });
  if (!res.ok) throw new Error(`Anthropic API ${res.status}: ${(await res.text()).slice(0, 300)}`);
  const data = await res.json();
  return (data.content || []).filter((b) => b.type === 'text').map((b) => b.text).join('');
}

export async function cardsFromArticle(article) {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) return { cards: draftCards(article), mode: 'draft' };

  const parsed = parseJson(await callClaude(key, SYSTEM_PROMPT, buildUserPrompt(article)));
  if (!Array.isArray(parsed.cards) || !parsed.cards.length) throw new Error('cards 배열이 비어 있습니다.');
  return { cards: parsed.cards, mode: 'llm' };
}

/**
 * 주제(프롬프트)만으로 카드 만들기.
 * kind: 'general'(자격증·전형 등 공고성 주제, 기본값) | 'major'(전공·학문 설명형)
 */
export async function cardsFromTopic(topic, kind = 'general') {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) return { cards: draftFromTopic(topic, kind), factsToVerify: [], mode: 'draft' };

  const system = kind === 'major' ? MAJOR_SYSTEM_PROMPT : TOPIC_SYSTEM_PROMPT;
  const data = await callClaude(key, system, buildTopicPrompt(topic));
  const parsed = parseJson(data);
  if (!Array.isArray(parsed.cards) || !parsed.cards.length) throw new Error('cards 배열이 비어 있습니다.');
  return { cards: parsed.cards, factsToVerify: parsed.factsToVerify || [], mode: 'llm' };
}

// ─────────────────────────────────────────────────────────────
// 키 없을 때의 뼈대
// 요약이 아니라 "자리만 잡아둔 초안"이다. 문구는 반드시 다시 쓴다.
// ─────────────────────────────────────────────────────────────
export function draftCards(article) {
  const paras = (article.text || '')
    .split(/\n+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 40)
    .slice(0, 3);

  const year = (article.publishedAt || '').slice(0, 4) || String(new Date().getFullYear());

  return [
    {
      type: 'cover',
      eyebrow: `ISSUE · ${year}`,
      tags: ['#대외활동', '#정보'],
      title: (article.title || '제목을 써주세요').slice(0, 40),
      sub: (article.description || '').slice(0, 60),
    },
    ...paras.map((p) => ({
      type: 'content',
      headline: '소제목을 써주세요',
      body: p.slice(0, 90),
    })),
    followCard(),
  ];
}

/** 마지막 팔로우 카드 — 프로필 목업이 붙는다 */
export function followCard() {
  return {
    type: 'cta',
    eyebrow: 'FOLLOW',
    headline: '대외활동 소식,\n*여기서* 받아보세요',
    profile: {
      name: '에라이 | 대외활동 기록',
      handle: 'erai_log',
      bio: '대외활동 · 서포터즈 · 공모전\n마감 전에 미리 정리해서 올려요',
    },
    tags: ['#대외활동', '#대외활동맞팔'],
  };
}

/**
 * 주제만 있고 API 키가 없을 때의 뼈대.
 * 내용은 비워둔다 — 여기에 그럴듯한 문장을 채우면 사실 확인 없이 나갈 위험이 있다.
 * kind: 'general' | 'major' — 라벨만 다르게 잡아둔다. 실제 문구는 항상 사람이(또는 Claude Code 가) 채운다.
 */
export function draftFromTopic(topic, kind = 'general') {
  const line = String(topic).trim().split('\n')[0].slice(0, 30);
  const labels = kind === 'major'
    ? ['정의', '배우는 내용', '진로', '필요한 적성']
    : ['항목', '항목', '항목', '항목'];
  return [
    {
      type: 'cover',
      eyebrow: 'GUIDE · 2026',
      tags: ['#정보'],
      title: line || '제목을 써주세요',
      sub: '',
      imagePrompt: 'Bright minimal desk scene, soft sky blue and white palette, airy natural light, shallow depth of field, no text, no letters, no logos, editorial photography, 4:5 vertical',
    },
    ...labels.slice(0, 3).map((label) => ({
      type: 'content',
      label,
      headline: '소제목을 써주세요',
      body: '내용을 써주세요.',
      imagePrompt: 'Bright minimal still life related to the topic, soft sky blue and white palette, airy natural light, shallow depth of field, no text, no letters, no logos, editorial photography, 4:5 vertical',
    })),
    followCard(),
  ];
}
