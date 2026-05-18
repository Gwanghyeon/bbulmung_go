# Project Plan: Bbulmung Go (뿔멍바둑)

## 1. 프로젝트 개요

- **목표:** 아이가 복잡한 로그인 과정 없이, 부여된 비밀번호만 입력하여 바로 브라우저에서 즐길 수 있는 가볍고 친근한 바둑 및 사활(Tsumego) 게임 웹 애플리케이션 개발.
- **타겟 사용자:** 바둑을 처음 배우는 초등학교 3~5학년 아이 (간단한 조작, 직관적인 UI, 실패에 대한 배려, 확실한 보상 요소 필수)

## 2. 기술 명세서 (Tech Spec)

### 2.1 Front-End Stack

- **Framework:** Next.js 15 (App Router 적용)
- **Language:** TypeScript
- **Styling:** Tailwind CSS (직관적이고 깔끔한 UI 구성)
- **Go Engine / UI Library:** `@sabaki/shudan`, `@sabaki/go-board`
  - 바둑판 렌더링, 착수, 따내기, 패 등의 기본 바둑 규칙 및 게임 상태 관리. (⚠️ `tenuki` 사용 금지)
  - 반응형(Responsive) 바둑판 UI 렌더링 및 Tailwind CSS를 활용한 커스텀 스타일링.
- **SGF Parser:** `@sabaki/sgf`
  - 사활 문제 로드 및 서버 AI 통신 시 기보(SGF) 데이터 직렬화/역직렬화.
- **State Management:** React Context API 또는 Zustand (유저의 경험치, 레벨, 게임 설정 상태 관리)
- **Icons / Animations:** `lucide-react`, `framer-motion` (상호작용 피드백 및 칭찬 팝업)

### 2.2 Back-End & AI Stack

- **AI Engine Server:** Google Cloud Run (서버리스 컨테이너)
- **Framework & AI:** Python (FastAPI) + **GNU Go** C 바이너리
  - 클라우드 환경에 최적화된 가벼운 GNU Go를 활용하여 즉각적인 반응성 확보.
  - Python `subprocess`로 GNU Go 프로세스를 열고 클라이언트와 GTP(Go Text Protocol) 명령 및 SGF 데이터를 교환.
  - **Stateless 구조:** 서버는 상태(진행 중인 게임)를 저장하지 않으며, 클라이언트가 매 요청마다 전체 SGF 또는 필요한 상태를 전송.

### 2.3 Data & Deployment

- **Data & Auth:** DB 연동 없이 하드코딩된 환경변수를 통한 단일 비밀번호 검증. 유저 레벨 및 EXP는 `localStorage`에 유지.
- **Hosting:** Vercel (Front-End) / Google Cloud Run (Back-End API)

## 3. 핵심 기능 요구사항

### 3.1 뿔멍바둑 전용 로그인 (Login Screen)

- 중앙에 `bbulmung_logo.png`를 크게 배치하고 "뿔멍바둑" 타이틀 노출.
- 부여된 단일 '비밀번호(코드)'만 입력하여 접속. 접속 시 `localStorage`에서 이전 레벨/EXP 정보 로드.

### 3.2 게임 메뉴 및 설정 (Menu Screen)

- **모드 선택:** "컴퓨터와 대결" / "사활 퀴즈 풀기"
- **보드 설정:** 바둑판 크기 선택 (9x9, 13x13, 19x19)
- **난이도 및 접바둑:** - 레벨 1~10 선택 가능.
  - 타겟 사용자를 배려하여, **레벨 1~5를 선택했을 때만 접바둑(0개~최대 6개)을 설정할 수 있는 UI** 노출.

### 3.3 대전 모드 (Play vs AI)

- **통신 흐름:** 클라이언트 착수 $\rightarrow$ 현재 기보(SGF) 및 레벨/접바둑 설정 API 전송 $\rightarrow$ 서버(GNU Go)의 다음 수 계산 및 응답 $\rightarrow$ 화면 렌더링.
- **몰입형 UI:** 바둑판 우측 하단에 `level_1.png` 캐릭터 이미지를 배치하여 아이가 직접 바둑판 앞에 앉아있는 듯한 느낌 연출.
- **무르기(Undo) 기능:** 서버에 무르기 API를 만들지 않고 프론트엔드에서 처리. [무르기] 클릭 시 기보(SGF 트리)에서 마지막 2수(서버의 수 + 나의 수)를 잘라내고(slice) 해당 시점으로 화면을 롤백.
- **초기 접바둑:** 시작 전 설정된 개수만큼 `@sabaki/go-board`의 초기 상태(setup)에 흑돌 배치.

### 3.4 사활 퀴즈 모드 (Tsumego)

- 정적인 정답 검증을 넘어 **AI 동적 대응** 지원.
- 아이가 정답 SGF 트리를 벗어난 곳에 돌을 두면, 즉시 백엔드 API(`POST /api/play`)를 호출하여 컴퓨터(GNU Go)가 방어하거나 상대 돌을 따내는 응징수를 두어 왜 틀렸는지 직관적으로 보여줌.

### 3.5 보상 및 레벨업 시스템 (Motivation)

- 게임 승리/기권 및 사활 성공 시 획득한 EXP를 `localStorage`에 누적.
- 화면 상단 내비게이션 바에 프로그레스 바(EXP 게이지) 노출.
- 특정 EXP 도달 시 화려한 파티클(`framer-motion`)과 함께 레벨업 팝업 노출.

## 4. UI/UX 가이드라인

- **Child-Friendly:** 밝은 배경, 둥근 모서리(`rounded-2xl`), 친근한 폰트 사용.
- **Focus:** 복잡한 바둑판 좌표(A, B, C / 1, 2, 3)는 렌더링하지 않음.
- **Audio/Visual Feedback:** 돌을 놓을 때마다 명쾌한 타격음(Web Audio API) 재생 및 올바른 수를 두었을 때 부드러운 애니메이션 피드백 제공.
- **Responsive:** 모바일 폰 및 태블릿(특히 iPad 가로/세로 모드)에서 바둑판, 버튼, 캐릭터 이미지의 레이아웃이 깨지지 않도록 철저한 CSS 검증.
