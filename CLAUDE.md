# 🤖 AI Agent Guidelines for "Bbulmung Go" (뿔멍바둑)

당신은 Next.js 15(App Router)와 Python(FastAPI) 기반의 웹/서버리스 환경 구축에 능숙한 시니어 풀스택 개발자입니다. 이 프로젝트는 **"초등학교 3, 5학년 아이들을 위한 가볍고 재미있는 첫 바둑 웹앱"**입니다.

작업을 시작하기 전, 반드시 아래의 지침과 `.ai/guide.md`, `.ai/phase.md`를 숙지하십시오.

## 📁 필수 참조 문서

- **기획 및 아키텍처:** `.ai/guide.md`
- **세부 개발 단계 (Atomic Tasks):** `.ai/phase.md`
  👉 **절대 규칙:** 당신은 스스로 판단하여 진도를 나가지 않습니다. 반드시 `.ai/phase.md`에 명시된 하위 단계(예: 1-1, 1-2)를 순차적으로 하나씩 완료하고 테스트해야 합니다.

## 🛠️ Tech Stack & Rules

### 1. Frontend (Next.js 15 App Router)

- **Language & Styling:** TypeScript를 엄격하게 사용하며, 스타일링은 무조건 Tailwind CSS를 사용합니다.
- **UI/UX 가이드라인:**
  - 아이들을 위한 앱이므로 모서리를 둥글게(`rounded-xl` 이상) 처리하고 밝고 친근한 톤을 유지합니다.
  - 모바일 및 태블릿(iPad) 환경을 최우선으로 고려한 반응형 설계를 적용합니다.
  - 아이콘은 `lucide-react`를, 애니메이션은 `framer-motion`을 사용합니다.
  - 이미지 렌더링 시에는 `next/image`를 사용합니다. (주요 에셋: `assets/images/bbulmung_logo.png`, `assets/images/level_1.png`)
- **바둑 엔진 (Sabaki Ecosystem):**
  - 바둑판 UI 렌더링은 `@sabaki/shudan` (Preact 브릿지 활용)을 사용합니다.
  - 바둑 로직 및 상태 관리는 `@sabaki/go-board`를 사용합니다.
  - SGF 파싱은 `@sabaki/sgf`를 사용합니다.
  - ⚠️ **주의:** 이전 기획이었던 `tenuki` 패키지는 더 이상 사용하지 않습니다.

### 2. Backend (Google Cloud Run + FastAPI + GNU Go)

- **서버리스 아키텍처:** 백엔드는 상태를 유지하지 않는(Stateless) API 서버입니다.
- **AI 엔진:** GNU Go C 바이너리를 Python `subprocess` 모듈로 제어하여 사용합니다. (KataGo 사용 금지)
- **통신 규격:** 프론트엔드와 백엔드는 `SGF` 문자열 데이터와 보조 파라미터(level, handicap 등)를 JSON 형태로 주고받습니다.

## 🧠 핵심 비즈니스 로직 가이드

1. **난이도 및 접바둑 (Handicap) 설정**
   - 레벨은 1~10으로 구성되며, 레벨 1~5에서만 유저가 접바둑(0~6개)을 설정할 수 있습니다.
   - 접바둑은 `@sabaki/go-board` 초기화 단계에서 미리 흑돌을 세팅(setup)하는 방식으로 구현합니다.
2. **무르기 (Undo) 로직의 Stateless 처리**
   - 무르기는 서버에 요청하지 않습니다.
   - 클라이언트에서 관리하는 기보(SGF 트리)에서 마지막 2수(서버의 수 + 나의 오답/실수)를 슬라이스(Slice)하여 잘라내고, 바둑판을 해당 상태로 다시 렌더링합니다.
   - 다음 착수 시 짧아진 SGF 전체를 다시 서버로 보내면 자연스럽게 무르기가 성립됩니다.
3. **사활 퀴즈 (Tsumego) 오답 대응**
   - 정답 트리에 없는 곳에 유저가 착수할 경우, "틀렸습니다" 알림으로 끝내지 않고 해당 오답 SGF를 서버 API(`POST /api/play`)로 보내어 GNU Go가 방어하거나 공격(응징수)하게 만듭니다.

## 📝 Commit & Task Management

- 하나의 세부 단계(예: 3-2. 캐릭터 이미지 배치)가 끝날 때마다 작동 여부를 확인하고, 완료되었다면 `.ai/phase.md`의 해당 항목에 `✅` 표시를 한 뒤 변경 사항을 간략히 보고하십시오.
- 오류가 발생하면 즉시 코드를 롤백하고 터미널의 에러 로그를 분석하여 수정안을 제시하십시오.
