# CLAUDE.md

## 0. 세션을 시작하면 — 먼저 읽을 것

**이 폴더의 주력 도구는 웹앱이다.** `.claude/settings.local.json` 의 `SessionStart` 훅이
`node app/ensure-server.mjs` 를 돌려 **자동으로 서버를 띄운다.**

- 주소: **http://localhost:3000**
- 이미 떠 있으면 아무것도 안 한다. 안 떠 있으면 백그라운드로 새로 띄운다
- 훅이 안 돌았거나 서버가 죽었으면 이걸 실행한다:
  ```bash
  node app/ensure-server.mjs
  ```
- **`app/*.mjs` 를 고쳤으면 반드시 서버를 재시작한다.** 서버는 시작할 때 모듈을 읽는다.
  포트를 잡고 있는 프로세스를 죽이고 `node app/ensure-server.mjs` 를 다시 부른다.

### 이 프로젝트에서 일할 때 반드시 지키는 것
1. **문구를 쓰기 전에 `card_copy_ko.md` 를 읽는다** (한국어 AI 말투 제거 규칙)
2. **디자인은 `card_style_01_sky_minimal.md` / `card_style_02_photo.md` 가 기준이다**
3. **공고 링크는 본문 텍스트만 믿지 말고 포스터 이미지를 직접 열어본다** (§3-6)
4. **렌더 후 반드시 PNG 를 Read 툴로 열어 육안 검수한다.** "생성됐다"로 끝내지 않는다
5. 아이디는 **`erai_log`** (eari 아님)

---

## 1. 이 프로젝트는

**인스타그램 대외활동 계정(`@erai_log`)에 올릴 카드뉴스 이미지를, 마크다운 디자인 기준서 → HTML/CSS → Chrome 헤드리스 스크린샷 순서로 자동 생성하는 프로젝트.**

---

## 2. 폴더 구조와 각 파일의 역할

```
insta ai auto/
├── CLAUDE.md                       ← 이 문서
├── card_style_01_sky_minimal.md    ← ★ 기준서: 글자만 쓰는 게시물
├── card_style_02_photo.md          ← ★ 기준서: 배경에 사진을 까는 공고형
├── card_copy_ko.md                 ← ★ 문구 규칙: 한국어 AI 말투 걷어내기
├── stop-slop-main/                  ← card_copy_ko.md 의 원본(영문). 참고용, 설치 안 함
├── files.zip                        ← 초기 md 3종 백업 (02 아이보리 / 03 다크네온 원본)
│
├── app/                             ← ★ 링크 → 카드 자동화 웹앱 (의존성 0, npm install 불필요)
│   ├── ensure-server.mjs            ← 서버가 없으면 띄운다. SessionStart 훅이 부른다
│   ├── server.mjs                   ← node:http 서버. localhost:3000
│   ├── zoom.mjs                     ← 포스터 작은 글씨 확대 캡처 (검증용)
│   ├── extract.mjs                  ← 링크 fetch + 본문 추출 (readability류 자작)
│   ├── llm.mjs                      ← 본문 → 카드 JSON. 프롬프트 + Anthropic API 호출
│   ├── cards.mjs                    ← 카드 JSON → 카드 HTML (스타일 01 템플릿)
│   ├── render.mjs                   ← 카드 JSON → PNG. 단독 실행도 됨
│   └── ui.html                      ← 브라우저 UI (미리보기 · 문구 수정 · 다운로드)
│
├── work/                            ← 웹앱이 만든 프로젝트별 작업 파일
│   ├── _sample/cards.json           ← 스타일 확인용 샘플 5장
│   └── <YYYYMMDD-제목>/
│       ├── source.json              ← 추출한 원문 텍스트 + 메타 + 이미지 후보 URL
│       ├── images/                  ← poster.jpg (자동 수집) + 사용자가 올린 사진
│       └── cards.json               ← ★ 카드 데이터. 이걸 고치면 카드가 바뀐다
│
├── input/
│   └── 사진/                        ← 카드에 넣을 소재 + 레퍼런스 이미지
│       ├── 안녕하세요 사진.jpg
│       └── 첫 게시물 레퍼런스.png
│
├── build/
│   ├── fonts/                       ← 로컬 폰트 14개 (ttf/otf). @font-face로 직접 참조
│   ├── html/                        ← 생성된 중간 HTML. 디버그·미세조정용 (재실행 시 덮어씀)
│   ├── render.mjs                   ← 스타일 비교용 샘플 3세트 × 3장 = 9장 렌더러
│   ├── post_01_open.mjs             ← 실제 게시물 1장 렌더러 (첫 게시물)
│   ├── profile_icon.mjs             ← 인스타 프로필 사진(1:1) 렌더러
│   └── .chrome-profile/             ← Chrome 헤드리스 임시 프로필. 실행할 때마다 생기며 지워도 됨
│
└── output/
    ├── 01_sky/                      ← ★ 현행 스타일 샘플 3장
    ├── post_01_open/                ← ★ 실제 게시물
    │   ├── 01_open.png
    │   └── caption.txt              ← 인스타 캡션 + 해시태그
    ├── profile/                     ← ★ 프로필 사진
    │   ├── profile_square.png       ← 업로드용 (1080×1080)
    │   └── profile_circle_preview.png ← 원형 크롭 확인용. 업로드하지 말 것
    ├── 01_lavender/                 ← [레거시] 폐기된 라벤더 스타일. 재생성 불가
    ├── 02_ivory/                    ← [레거시] 기준 md 삭제됨
    └── 03_neon/                     ← [레거시] 기준 md 삭제됨
```

### 중요한 상태 정보
- `card_style_01_sky_minimal.md`가 **유일한 현행 기준서**다. 이전엔 라벤더/아이보리/다크네온 3종이 있었으나 사용자가 스타일 01만 남기고 하늘색·미니멀로 전면 개편했다. 02·03 원본 md는 `files.zip` 안에만 있다.
- `build/render.mjs`에는 아직 02(아이보리)·03(다크네온) 코드가 남아 있다. **기준 md가 없으므로 수정하지 말 것.** 새 작업은 스타일 01 기준으로만 한다.
- 인스타 아이디는 **`erai_log`** — `eari_log`가 아니다. i/a 순서를 한 번 틀려서 정정받았다.

---

## 3. 카드뉴스 만드는 전체 프로세스

### 3-0. 환경 (Windows)
- **Python 없음** (Windows Store 스텁이라 동작 안 함). **Node.js v24**를 쓴다.
- Playwright/Puppeteer 설치 안 되어 있고 **설치할 필요 없다.** 시스템에 깔린 Chrome을 헤드리스로 직접 호출한다.
- Chrome 경로: `C:\Program Files\Google\Chrome\Application\chrome.exe`
- 셸은 PowerShell이 기본, Bash 툴도 사용 가능. 파일 다운로드는 PowerShell `Invoke-WebRequest`가 편하다.

### 3-1. 기준서(md)를 먼저 읽는다
`card_style_01_sky_minimal.md`의 색상 HEX, 폰트 파일명, 정렬, 안전 여백, 비율을 **그대로** 옮긴다. 임의로 예쁘게 바꾸지 않는다. 기준서에 적힌 금지 사항(장식 패턴 금지, 강조색은 한 곳만 등)이 실제로 지켜야 하는 규칙이다.

### 3-2. 폰트는 로컬 파일로 물린다
CDN·웹폰트 링크 금지. `build/fonts/`의 파일을 `pathToFileURL()`로 절대경로 변환해 `@font-face`에 넣는다.

```js
const face = (family, file, { weight = '400', style = 'normal' } = {}) => `
@font-face{font-family:'${family}';src:url('${pathToFileURL(join(FONTS, file)).href}');
font-weight:${weight};font-style:${style};font-display:block;}`;
```

**`font-family`에 한글 시스템 폰트를 폴백으로 넣지 말 것.** 폴백이 걸리면 Malgun Gothic으로 조용히 대체돼 기준서 위반을 눈치채지 못한다. 폴백을 빼두면 렌더 결과에서 바로 티가 난다.

현재 보유 폰트:
| 폰트 | 파일 | 용도 |
|---|---|---|
| Pretendard | `Pretendard-{Light,Regular,Medium,SemiBold,Bold,ExtraBold}.otf` | 스타일 01 전체 (300/400/500/600/700/800) |
| Space Grotesk | `SpaceGrotesk.ttf` (가변 300–700) | 영문 라벨·워터마크 |
| Jua, Gowun Dodum | `.ttf` | [레거시] 라벤더 |
| Nanum Myeongjo, Playfair Display | `.ttf` | [레거시] 아이보리 |
| Black Han Sans | `.ttf` | [레거시] 다크네온 |

폰트 추가가 필요하면:
```powershell
# Google Fonts (OFL)
Invoke-WebRequest "https://raw.githubusercontent.com/google/fonts/main/ofl/<폴더>/<파일>.ttf" -OutFile "build\fonts\<파일>.ttf"
# Pretendard (Google Fonts에 없음)
Invoke-WebRequest "https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/packages/pretendard/dist/public/static/Pretendard-<Weight>.otf" -OutFile "build\fonts\Pretendard-<Weight>.otf"
```

### 3-3. HTML을 만든다
- `.card`는 **1080 × 1350px 고정** (인스타 4:5), `box-sizing:border-box`, `body{margin:0}`
- 안전 여백은 기준서대로 (스카이 미니멀 = 상하 90 / 좌우 80)
- 소재 이미지는 `pathToFileURL()`로 `file:///` 참조 (`<img src="...">`는 file→file 로딩 가능)
- 폰트 로딩 확인용으로 아래를 넣어둔다:
```html
<script>document.fonts.ready.then(()=>document.documentElement.setAttribute('data-ready','1'));</script>
```

### 3-4. Chrome 헤드리스로 스크린샷
```js
execFileSync(CHROME, [
  '--headless=new', '--disable-gpu', '--hide-scrollbars', '--no-first-run',
  `--user-data-dir=${join(BUILD, '.chrome-profile')}`,  // 실행 중인 Chrome과 충돌 방지. 필수
  '--allow-file-access-from-files',                      // 로컬 이미지 넣을 때만 필요
  '--force-device-scale-factor=2',                       // 1080×1350 → 2160×2700
  '--window-size=1080,1350',
  '--virtual-time-budget=8000',                          // 폰트 로딩 대기 겸용
  `--screenshot=${pngPath}`,
  `${pathToFileURL(htmlPath).href}?v=${Date.now()}`,      // 캐시 무효화. 아래 경고 참고
], { stdio: 'pipe' });
```

> ⚠️ **URL 뒤 `?v=<timestamp>`를 반드시 붙인다.** 없으면 CSS를 고치고 재실행해도 Chrome이 캐시된 페이지를 렌더해서 **이전과 바이트 단위로 똑같은 PNG**가 나온다. 실제로 이 함정에 한 번 걸렸다. 수정했는데 결과가 그대로면 캐시부터 의심하고, 급하면 `build/.chrome-profile/`을 지우면 된다.

카드가 1:1(프로필 사진 등)이면 `--force-device-scale-factor=1` + `--window-size=1080,1080`으로 1080×1080을 만든다. 인스타 프로필은 원형으로 잘리므로 **글자·요소를 내접원 안쪽에** 두고, 원형 마스크를 씌운 미리보기를 따로 뽑아 눈으로 확인한다 (`profile_icon.mjs` 참고).

### 3-5. 검증 — 이 두 가지는 반드시 한다
**(a) 해상도가 2160×2700인지 확인**
```powershell
Add-Type -AssemblyName System.Drawing
Get-ChildItem "output" -Recurse -Filter *.png | ForEach-Object {
  $i=[System.Drawing.Image]::FromFile($_.FullName)
  "{0,-32} {1} x {2}" -f $_.Name,$i.Width,$i.Height; $i.Dispose() }
```
1080×1350으로 나오면 `--force-device-scale-factor`가 무시된 것 → `--window-size=2160,2700` + `.card{transform:scale(2);transform-origin:top left}`로 폴백.

**(b) Read 툴로 PNG를 직접 열어 육안 검수**
자주 나온 문제들이라 이 목록으로 체크한다:
- 한글이 Malgun Gothic 폴백으로 떨어지지 않았는지 (지정 폰트 특유의 형태 확인)
- `span` 안에 넣은 텍스트가 inline이라 한 줄로 붙지 않았는지 (`display:block` 필요)
- flex `justify-content:center`에서 푸터까지 같이 중앙에 떠서 하단이 비지 않았는지 → 푸터는 `position:absolute; bottom:` 로 하단 고정
- 요소가 카드 밖으로 잘리거나 겹치지 않았는지
- 같은 정보(예: `@아이디`)가 한 카드에 중복 노출되지 않았는지
- 텍스트가 안전 여백을 침범하지 않았는지

문제가 있으면 `build/html/*.html`을 브라우저로 열어 확인 → `.mjs` 수정 → 재렌더.

---

## 3-6. 링크에서 카드 만들기 (웹앱) — 지금의 주력 방식

```bash
node app/server.mjs      # → http://localhost:3000
```

UI 상단에 모드 탭이 둘 있다.

| 모드 | 쓰는 때 | 흐름 |
|---|---|---|
| **링크로** | 기사·공고 URL 이 있을 때 | 링크 → 본문+포스터 추출 → 카드 JSON → 미리보기·수정 → PNG |
| **주제로** | 자격증·전공 정보처럼 원문이 없을 때 | 주제 문장 → 카드 JSON → 미리보기·수정 → PNG |

> ⚠️ **주제로 만들 때는 사실 확인이 필수다.** 참고할 원문이 없어 모델이 지어낼 수 있다.
> `TOPIC_SYSTEM_PROMPT` 가 "시험 일정·응시료·합격률처럼 바뀌는 값은 쓰지 말라"고 막아두고,
> 확인이 필요한 항목을 `doc.factsToVerify` 에 담아 UI 에 띄운다. **그래도 사람이 확인한다.**

흐름: **링크 붙여넣기 → 본문 추출 → 카드 JSON → 미리보기·수정 → PNG 다운로드**

1. UI 입력창에 기사·공고 링크를 넣고 `가져오기`
2. 서버가 `extract.mjs`로 본문만 뽑아 `work/<슬러그>/source.json`에 저장
3. `llm.mjs`가 카드 JSON을 만들어 `work/<슬러그>/cards.json`에 저장
4. 화면에서 카드를 눌러 문구 수정 (0.4초 뒤 자동 저장 → iframe 갱신)
5. `PNG 만들기` → `output/<슬러그>/01.png …` (2160×2700)

### LLM 단계는 두 가지 모드다
- **`ANTHROPIC_API_KEY` 있음** → `llm.mjs`가 Claude를 호출해 카드 JSON을 자동 생성
- **없음 (현재 기본)** → 자리만 잡은 초안이 생긴다. **사용자가 링크를 주면 Claude Code가
  `work/<슬러그>/cards.json`을 직접 써준다.** 이게 지금 합의된 작업 방식이다.

`SYSTEM_PROMPT`에 **"원문 표현을 베끼지 말 것 / 본문에 없는 사실을 지어내지 말 것"**이
명시돼 있다. 수동으로 쓸 때도 이 규칙을 그대로 지킨다.

### ★ 공고 링크는 본문 텍스트만 믿지 말고 포스터를 직접 읽는다
대외활동·공모전 공고는 **핵심 정보가 포스터 이미지 안에만 있다.** 본문 텍스트만 뽑으면
사전 과제·전형 일정·주의사항이 통째로 빠진다. 실제로 한 번 그렇게 놓쳐서 지적받았다.

1. 앱이 `og:image`와 본문 이미지를 `work/<슬러그>/images/poster.*` 로 자동 수집한다
2. **Read 툴로 그 포스터를 직접 열어본다.** 작은 글씨는 아래 스크립트로 확대해서 읽는다
   ```bash
   node app/zoom.mjs <이미지경로> <원본가로> <cropX> <cropY> <cropW> <cropH> <배율>
   ```
3. 아래 필드를 `cards.json`의 `brief` 에 채운다 — 이게 사실관계의 원본이 된다
   `정의 / 활동일정 / 모집대상 / 활동기간 / 활동내용 / 혜택 / 지원방법(과제 포함) / 주의사항`
4. **본문 텍스트와 포스터가 어긋나면 둘 다 확인하고 `brief.확인메모`에 남긴다.**
   (CJ 건: 포스터엔 `CJRECRUIT.COM`, 본문엔 `cjlrecruit.com` → 접속해보니 후자가 진짜)

### cards.json 스키마
```json
{ "handle": "erai_log",
  "style": "02_photo",
  "source": { "url": "", "title": "", "publisher": "" },
  "brief": { "모집대상": "…", "활동기간": "…" },
  "cards": [
    { "type":"cover",   "eyebrow":"RECRUIT · 2026", "tags":["#태그"], "title":"제목", "sub":"요약",
      "image":"poster.jpg", "scrim":0.80, "blur":7, "zoom":1.5, "focus":"45%",
      "imagePrompt":"영문 AI 이미지 프롬프트" },
    { "type":"content", "label":"모집대상", "headline":"소제목", "body":"본문", "imagePrompt":"…" },
    { "type":"cta",     "eyebrow":"FOLLOW", "headline":"마무리", "tags":["#태그"],
      "profile":{ "name":"에라이 | 대외활동 기록", "handle":"erai_log", "bio":"…" } }
  ] }
```
- 전체 3~8장. `content`는 논점 하나당 한 장
- `label`은 그 장이 공고의 어느 항목인지 (`brief`의 키와 맞춘다). 상단에 pill 로 나온다
- `cta`에 `profile`을 주면 중앙 정렬 + 인스타 프로필 목업이 붙는다. 마지막 장을 팔로우
  유도로 쓸 때 사용한다
- 제목/소제목의 **`*별표*`가 강조색(`#1F7AC0`)** 이 된다. 기준서대로 **카드당 한 곳만** —
  두 번째부터는 `accentize()`가 무시한다
- `\n`으로 줄을 끊는다. 글자 수가 넘치면 `data-fit` 스크립트가 폰트를 자동으로 줄인다
- `image`가 있으면 스타일 02(사진 배경), 없으면 스타일 01(그라데이션)로 그려진다.
  `scrim`/`blur`/`zoom`/`focus` 기본값과 조정 기준은 `card_style_02_photo.md` §3
- `imagePrompt`는 **영문으로, 글자 금지·하늘색 톤 지정**해서 쓴다 (규칙은 기준서 §6).
  UI에 복사 버튼이 있어 사용자가 생성 도구에 붙여넣고, 만든 사진을 그 카드에 올린다
  (파일 선택 / 드래그앤드롭 / Ctrl+V)

### 이 앱을 고칠 때 주의할 점
- **`extract.mjs`는 사이트마다 깨진다.** 새 사이트에서 본문이 안 잡히면 `KNOWN` 배열에
  선택자를 추가하거나, 꼬리 잡음은 `TAIL_CUT`에 패턴을 넣는다. `how` 필드에 어떤 경로로
  뽑았는지(`json-ld` / `known-selector` / `scored`) 찍히니 그걸 먼저 본다
- **서버는 시작할 때 모듈을 읽는다.** `.mjs`를 고쳤으면 반드시 재시작한다
- 미리보기(iframe, `/fonts/`)와 렌더(`file:///`)가 **같은 `cards.mjs`를 쓴다.**
  `fontBase`만 다르다. 템플릿을 고치면 양쪽에 동시에 반영된다

---

## 4. 새 카드뉴스를 만들 때

### 케이스 A — 같은 스타일로 새 게시물 (가장 흔함)
1. `build/post_01_open.mjs`를 새 이름으로 복사 (예: `post_02_xxx.mjs`)
2. 파일 상단 상수만 교체:
   - `HANDLE` — 항상 `'erai_log'`
   - 내용 상수 (`CATEGORIES`, `BIO_TAGS` 등)
   - 출력 경로 `outDir` / `pngPath`
3. `card_style_01_sky_minimal.md`의 팔레트·폰트·여백을 그대로 유지한 채 레이아웃만 바꾼다
4. `node build/post_02_xxx.mjs` → 3-5의 검증 수행
5. **캡션도 함께 만들어 `output/<게시물>/caption.txt`로 저장한다.** 사용자가 매번 요청하는 산출물이다

스카이 미니멀 팔레트 (외우지 말고 md에서 확인):
`배경 #F0F7FC→#DCEAF6→#C2DCEF` / `제목 #0F2C44` / `본문 #4E6B82` / `강조 #1F7AC0` / `태그글자 #0F4C7A` / `헤어라인 rgba(15,44,68,.14)`

### 케이스 B — 캐러셀(여러 장) 만들기
1장=표지 / 2장=내용 소개 / 3장=맞팔 CTA 구성이 기본이다. `build/render.mjs`의 `style01`이 이 3장 구조의 참고 구현이다. 카드별 데이터는 **하나의 `CONTENT` 객체**에 모아 여러 카드가 같은 문구를 참조하게 한다.

### 케이스 C — 새 디자인 스타일 추가
1. **먼저 `card_style_02_<이름>.md` 기준서를 쓴다.** 색상 HEX 표, 폰트+파일명+출처, 정렬 규칙, 카드 구성요소, 안전 여백, 분위기 키워드, 금지 사항까지. 기존 `card_style_01_sky_minimal.md`가 그 포맷이다
2. 필요한 폰트를 `build/fonts/`에 받는다
3. 기준서를 그대로 CSS로 옮긴다
4. 렌더 → 검증

### 케이스 D — 레퍼런스 이미지를 참고할 때
`input/사진/`에 넣어달라고 하고 Read 툴로 직접 본다. 사용자는 **"참고하되 너무 베끼지 말 것"**을 명시적으로 요구했다. 구조·정보 배치만 참고하고 색·장식·폰트는 우리 기준서를 따른다. 어디를 다르게 갔는지 결과 보고에 적어준다.

---

## 5. 작업 시 지켜야 할 것

- **카드 문구나 캡션을 쓰기 전에 `card_copy_ko.md`를 읽는다.** 디자인 기준서가 보이는 걸
  정한다면 이 문서는 읽히는 걸 정한다. 넘기기 전에 §4 체크리스트를 훑는다.
  자주 걸리는 것: `다양한/여러 가지` → 항목을 나열, `~이 부여됩니다` → `~을 준다`,
  `정말/매우/굉장히` → 삭제. 사실은 숫자와 고유명사로 적는다
- **기준서(md)가 우선.** 디자인 판단이 갈리면 md 문구를 근거로 결정하고, md에 없으면 물어본다
- 사용자에게 **결정이 필요한 선택**(폰트 방향, 장식 유지 여부, 3장의 의미 등)은 임의로 정하지 말고 물어본다. 지금까지 이 방식으로 진행해왔다
- 렌더 후 **반드시 이미지를 직접 열어 확인**한다. "생성됐다"로 끝내지 않는다
- 결과 보고에는 md의 어떤 규칙을 어떻게 지켰는지, 검수에서 뭘 고쳤는지를 적는다
- 아이디는 `erai_log`. 코드에서는 상단 상수 한 곳으로만 관리한다
