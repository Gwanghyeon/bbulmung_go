"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowLeft, Flag, SkipForward, RotateCcw } from "lucide-react";
import { isAuthenticated } from "@/lib/auth";
import GoBoard from "@/components/GoBoard";
import CaptureCounter from "@/components/CaptureCounter";
import Image from "next/image";
import level1Image from "@/assets/images/level_1.png";
import { boardToSgf, parseLastMoveFromSgf } from "@/lib/sgf";
import { calculateScoreAction } from "@/app/actions/scoring";
import type { GoBoardRef } from "@/components/GoBoard";
import type Board from "@sabaki/go-board";
import type { Sign } from "@sabaki/go-board";
import { useRef } from "react";

function GameContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const sizeParam = searchParams.get("size");
  const size = sizeParam ? parseInt(sizeParam, 10) : 9;
  const levelParam = searchParams.get("level");
  const level = levelParam ? parseInt(levelParam, 10) : 1;
  const handicapParam = searchParams.get("handicap");
  const handicap = handicapParam ? parseInt(handicapParam, 10) : 0;
  const opponent = searchParams.get("opponent") || "computer";

  const [blackCaptures, setBlackCaptures] = useState(0);
  const [whiteCaptures, setWhiteCaptures] = useState(0);
  const [isAiThinking, setIsAiThinking] = useState(false);
  const [lastMove, setLastMove] = useState<[number, number] | null>(null);
  
  const [consecutivePasses, setConsecutivePasses] = useState(0);
  const [isGameOver, setIsGameOver] = useState(false);
  const [scoreResult, setScoreResult] = useState<any>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const boardRef = useRef<GoBoardRef>(null);
  const workerRef = useRef<Worker | null>(null);

  const handleGameOver = async (finalBoard: Board, resignedBy?: string) => {
    setIsGameOver(true);
    setIsAiThinking(false);
    
    if (resignedBy) {
      setScoreResult({
        winner: resignedBy === 'Black' ? 'White' : 'Black',
        reason: 'Resignation'
      });
      return;
    }

    if (!finalBoard) return;

    setIsAiThinking(true); // 계가 계산 중 표시
    
    try {
      // 덤(Komi)을 보드 크기에 비례하여 계산합니다 (19x19 기준 6.5)
      // 19x19: 6.5, 13x13: 3.5, 9x9: 1.5
      let komi = 6.5;
      if (size === 13) komi = 3.5;
      else if (size === 9) komi = 1.5;
      else {
        const areaRatio = (size * size) / (19 * 19);
        komi = Math.floor(6.5 * areaRatio) + 0.5;
      }

      // Next.js Server Action 호출: 서버의 Node.js 환경에서 사활 판별을 수행합니다.
      const result = await calculateScoreAction(finalBoard.signMap, komi);
      setScoreResult({
        winner: result.winner,
        diff: result.diff.toString(),
        blackScore: result.blackScore.toString(),
        whiteScore: result.whiteScore.toString(),
        komi: komi,
        reason: "Score"
      });
    } catch (e) {
      console.error("Score calculation failed:", e);
      setScoreResult({ winner: "Unknown", reason: "사활 및 점수 계산 중 오류가 발생했습니다." });
    } finally {
      setIsAiThinking(false);
    }
  };

  // Initialize Web Worker
  useEffect(() => {
    if (opponent === "computer") {
      // 난이도가 변경될 때마다 워커를 새로 생성하여 적용합니다. (이전 턴의 SGF는 계속 넘겨주므로 상태 유지됨)
      if (workerRef.current) {
        workerRef.current.terminate();
      }
      workerRef.current = new Worker(new URL(`/workers/gnugoWorker.js?level=${level}`, window.location.href));
      workerRef.current.onmessage = (e) => {
        if (e.data.type === "ready") {
          console.log("GNU Go Worker is ready.");
        } else if (e.data.type === "move") {
          const parsed = parseLastMoveFromSgf(e.data.sgf);
          if (parsed && parsed.vertex) {
            if (parsed.vertex[0] === -1) {
              boardRef.current?.pass();
              showToast("AI가 한 수 쉬었습니다.");
            } else {
              boardRef.current?.playAt(parsed.vertex);
            }
          }
          setIsAiThinking(false);
        } else if (e.data.type === "error") {
          console.error("GNU Go Worker Error:", e.data.error);
          showToast("AI가 수읽기 중 한계에 도달해 패스합니다.");
          boardRef.current?.pass();
          setIsAiThinking(false);
        }
      };
    }
    return () => {
      workerRef.current?.terminate();
    };
  }, [opponent, level]);

  useEffect(() => {
    if (!isAuthenticated()) {
      router.replace("/");
    }
  }, [router]);

  const handleMove = (board: Board, nextPlayer: Sign, vertex: [number, number]) => {
    if (board && !isGameOver) {
      setBlackCaptures(board.getCaptures(1));
      setWhiteCaptures(board.getCaptures(-1));
      
      const isPass = vertex[0] === -1;
      if (!isPass) {
        setLastMove(vertex);
        setConsecutivePasses(0);
      } else {
        const newPassCount = consecutivePasses + 1;
        setConsecutivePasses(newPassCount);
        if (newPassCount >= 2) {
          handleGameOver(board);
          return;
        }
      }

      // AI turn (White = -1)
      if (opponent === "computer" && nextPlayer === -1 && !isGameOver && !(isPass && consecutivePasses + 1 >= 2)) {
        setIsAiThinking(true);
        if (workerRef.current) {
          const sgf = boardToSgf(board, nextPlayer);
          workerRef.current.postMessage({ type: "play", sgf, color: 0 }); // 0 often represents white in some engines
        }
      }
    }
  };

  const handlePass = () => {
    if (!isGameOver && !isAiThinking) {
      boardRef.current?.pass();
    }
  };

  const handleResign = () => {
    if (!isGameOver) {
      // User is always Black (1) against computer for now
      const currentBoard = boardRef.current?.getBoard() || null;
      handleGameOver(currentBoard as any, 'Black'); 
    }
  };

  return (
    <div className="min-h-screen bg-neutral-900 text-white flex flex-col items-center">
      <header className="w-full max-w-4xl flex justify-between items-center py-4 mb-4">
        <button
          onClick={() => router.push("/menu")}
          className="flex items-center space-x-2 px-4 py-2 bg-white/5 hover:bg-white/10 rounded-xl transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>메뉴로</span>
        </button>
        <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-400">
          AI와 대결 · Lv.{level} ({size}×{size})
        </h1>
        <div className="w-20" /> {/* Spacer for centering */}
      </header>

      <main className="w-full flex-1 flex flex-col items-center justify-center px-4 py-4 gap-5 overflow-auto">
        {/* 바둑판 + 캐릭터 컨테이너 (3-1, 3-2) */}
        <div className="relative w-full max-w-[560px]">
          {toastMessage && (
            <motion.div 
              initial={{ opacity: 0, y: -20, x: "-50%" }}
              animate={{ opacity: 1, y: 0, x: "-50%" }}
              exit={{ opacity: 0, y: -20, x: "-50%" }}
              className="absolute top-8 left-1/2 z-20 bg-blue-600/90 text-white px-6 py-3 rounded-full shadow-lg font-bold backdrop-blur-sm whitespace-nowrap"
            >
              {toastMessage}
            </motion.div>
          )}

          {isAiThinking && (
            <div className="absolute inset-0 z-10 bg-black/20 backdrop-blur-[2px] flex items-center justify-center rounded-[3rem]">
              <div className="bg-black/80 px-8 py-5 rounded-full shadow-2xl flex items-center space-x-3">
                <div className="w-3 h-3 bg-white rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                <div className="w-3 h-3 bg-white rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                <div className="w-3 h-3 bg-white rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                <span className="text-lg font-medium ml-3 text-white">AI 생각중...</span>
              </div>
            </div>
          )}
          <GoBoard 
            ref={boardRef} 
            size={size}
            handicap={handicap}
            onMove={handleMove} 
            lastMove={lastMove}
            disabled={isAiThinking || isGameOver}
          />
          {/* 캐릭터 이미지 (3-2): 바둑판 우측 하단에 absolute로 겹쳐 배치 */}
          <div className="pointer-events-none absolute bottom-2 right-2 z-10">
            <Image
              src={level1Image}
              alt="뿔멍 캐릭터"
              width={120}
              height={180}
              className="object-contain drop-shadow-2xl"
              style={{ width: "auto", height: "clamp(90px, 18vw, 160px)" }}
              priority
            />
          </div>
        </div>

        {/* 따낸 돌 카운터 */}
        <div className="flex gap-6 items-center">
          <CaptureCounter color="black" count={whiteCaptures} />
          <CaptureCounter color="white" count={blackCaptures} />
        </div>

        {/* 하단 컨트롤러 (3-3) */}
        <div className="w-full max-w-[560px] grid grid-cols-3 gap-3">
          <button
            disabled={isAiThinking || isGameOver}
            className="flex flex-col items-center justify-center p-4 bg-white/5 hover:bg-white/10 border border-white/10 disabled:opacity-50 disabled:cursor-not-allowed rounded-2xl transition-colors group"
          >
            <RotateCcw className="w-6 h-6 mb-1 text-neutral-400 group-hover:text-blue-400" />
            <span className="text-sm font-medium">무르기</span>
          </button>
          <button 
            onClick={handlePass}
            disabled={isAiThinking || isGameOver}
            className="flex flex-col items-center justify-center p-4 bg-white/5 hover:bg-white/10 border border-white/10 disabled:opacity-50 disabled:cursor-not-allowed rounded-2xl transition-colors group"
          >
            <SkipForward className="w-6 h-6 mb-1 text-neutral-400 group-hover:text-yellow-400" />
            <span className="text-sm font-medium">한수쉼</span>
          </button>
          <button 
            onClick={handleResign}
            disabled={isAiThinking || isGameOver}
            className="flex flex-col items-center justify-center p-4 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 disabled:opacity-50 disabled:cursor-not-allowed rounded-2xl transition-colors group"
          >
            <Flag className="w-6 h-6 mb-1 text-red-400 group-hover:text-red-300" />
            <span className="text-sm font-medium text-red-200">기권</span>
          </button>
        </div>
      </main>

      {/* Game Over Modal */}
      {isGameOver && scoreResult && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-neutral-800 rounded-3xl p-8 max-w-sm w-full shadow-2xl border border-white/10"
          >
            <h2 className="text-3xl font-bold text-center mb-6">게임 종료</h2>
            
            {scoreResult.reason === 'Resignation' ? (
              <div className="text-center text-xl text-white/80 mb-8">
                {scoreResult.winner === 'Black' ? '흑(당신)' : '백(AI)'} 불계승
              </div>
            ) : (
              <div className="space-y-4 mb-8">
                <div className="flex justify-between items-center text-sm text-gray-400 mb-2">
                  <span>덤 (Komi)</span>
                  <span>{scoreResult.komi} 집</span>
                </div>
                <div className="flex justify-between items-center bg-black/30 p-4 rounded-xl">
                  <span className="text-gray-400">흑 (당신)</span>
                  <span className="text-2xl font-bold">{scoreResult.blackScore} 집</span>
                </div>
                <div className="flex justify-between items-center bg-white/10 p-4 rounded-xl">
                  <span className="text-gray-400">백 (AI)</span>
                  <span className="text-2xl font-bold">{scoreResult.whiteScore} 집</span>
                </div>
                <div className="text-center pt-4 text-xl font-medium text-blue-400">
                  {scoreResult.winner === 'Black' ? '흑' : scoreResult.winner === 'White' ? '백' : '무승부'} 승리
                  {scoreResult.diff && scoreResult.diff !== "0" && ` (${scoreResult.diff} 집 차이)`}
                </div>
              </div>
            )}

            <button
              onClick={() => router.push("/menu")}
              className="w-full py-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 rounded-xl font-bold text-lg transition-all active:scale-95"
            >
              메뉴로 돌아가기
            </button>
          </motion.div>
        </div>
      )}
    </div>
  );
}

export default function GamePage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-neutral-900 flex items-center justify-center text-white">로딩 중...</div>}>
      <GameContent />
    </Suspense>
  );
}
