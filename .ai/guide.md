# Project Plan: Bulmung Go (아이를 위한 첫 바둑 웹앱)

## 1. 프로젝트 개요

- **목표:** 아이가 복잡한 로그인 과정 없이, 부여된 비밀번호만 입력하여 바로 브라우저에서 즐길 수 있는 가벼운 바둑 및 사활(Tsumego) 게임 웹 애플리케이션 개발.
- **타겟 사용자:** 바둑을 배우는 아이 (간단한 조작, 직관적인 UI 필수)

## 2. 기술 명세서 (Tech Spec)

### 2.1 Front-End Stack

- **Framework:** Next.js (App Router 적용)
- **Language:** TypeScript
- **Styling:** Tailwind CSS (직관적이고 깔끔한 UI 구성)
- **Go Engine / UI Library:** `tenuki` (Tenuki.js)
  - 바둑판 렌더링, 착수, 따내기, 패 등의 기본 바둑 규칙 및 게임 상태 관리용.
  - 반응형(Responsive) 바둑판 UI 렌더링 및 Tailwind CSS를 활용한 커스텀 스타일링 적용.
- **SGF Parser:** `@sabaki/sgf`
  - 사활 문제(SGF 파일) 파싱 전용. 파싱된 데이터를 Tenuki 엔진의 초기 상태(Board State)로 주입하여 렌더링.
- **State Management:** React Context API 또는 Zustand (간단한 상태 관리에 최적화)
- **Icons / Animations:** `lucide-react`, `framer-motion` (아이들이 좋아하는 부드러운 상호작용 및 피드백 구현)

### 2.2 Data & Auth

- **Authentication:** 클라이언트 사이드 비밀번호 검증 (DB 연동 없이 하드코딩된 환경변수 또는 단일 비밀번호 사용) 및 `localStorage`를 활용한 세션 유지.
- **Puzzle Data:** 사활 문제는 JSON 또는 SGF 파일 형태로 `public/data` 폴더에 정적 리소스로 저장.

### 2.3 Deployment

- **Hosting:** Vercel (Next.js 최적화, 무료 티어 활용)

## 3. 핵심 기능 요구사항

### 3.1 간편 로그인 (Login Screen)

- 아이디 없이 미리 설정된 '비밀번호'만 입력하여 접속.
- 한 번 접속하면 `localStorage`에 저장하여 다음 접속 시 로그인 생략.

### 3.2 메인 메뉴 (Menu Screen)

- 두 가지 주요 모드 선택: **"컴퓨터와 대결"** / **"사활 퀴즈 풀기"**
- 바둑판 크기 선택 (9x9, 13x13, 19x19) 지원.

### 3.3 컴퓨터 대전 모드 (Play vs AI)

### 3.3.1 AI Architecture (WebAssembly Local Engine)

- **엔진 저장소:** `tristancacqueray/wasm-gnugo` 기반의 WebAssembly 빌드 결과물(`gnugo.js`, `gnugo.wasm`) 사용.
- **아키텍처:** \* 백엔드 API 서버를 두지 않고, 100% 클라이언트(브라우저) 사이드에서 연산 처리.
  - 브라우저의 UI(메인 스레드)가 멈추지 않도록 **Web Worker**를 생성하여 백그라운드에서 Wasm 엔진을 구동.
- **통신 프로토콜:** 메인 스레드(Tenuki.js)와 Web Worker(GNU Go) 간에는 **GTP(Go Text Protocol)** 문자열을 메시지로 주고받으며 게임 상태를 동기화.

### 3.4 사활 퀴즈 모드 (Tsumego)

- 정해진 SGF 기보 데이터를 불러와 화면에 렌더링.
- 아이가 정답 경로대로 돌을 두면 "성공!", 틀린 곳에 두면 "다시 시도!" 피드백 제공.

## 4. UI/UX 가이드라인

- 전체적으로 밝고 둥근 모서리(rounded-xl)를 사용한 친근한 디자인.
- 바둑돌을 놓을 때 효과음(Web Audio API) 및 칭찬 애니메이션 추가.
- 모바일 및 태블릿 브라우저에서 화면이 깨지지 않는 반응형(Responsive) 설계 필수.
