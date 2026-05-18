"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowLeft, Flag, SkipForward, RotateCcw } from "lucide-react";
import { isAuthenticated } from "@/lib/auth";
import GoBoard from "@/components/GoBoard";
import CaptureCounter from "@/components/CaptureCounter";
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
  const opponent = searchParams.get("opponent") || "computer"; // "computer" or "human"

  const [blackCaptures, setBlackCaptures] = useState(0);
  const [whiteCaptures, setWhiteCaptures] = useState(0);
  const [isAiThinking, setIsAiThinking] = useState(false);
  const [lastMove, setLastMove] = useState<[number, number] | null>(null);
  
  const [consecutivePasses, setConsecutivePasses] = useState(0);
  const [isGameOver, setIsGameOver] = useState(false);
  const [scoreResult, setScoreResult] = useState<any>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [aiLevel, setAiLevel] = useState<number>(1); // 1: 초보, 5: 중수, 10: 고수

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
      workerRef.current = new Worker(new URL(`/workers/gnugoWorker.js?level=${aiLevel}`, window.location.href));
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
  }, [opponent, aiLevel]); // aiLevel이 바뀔 때 워커 재생성

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
    <div className="min-h-screen bg-neutral-900 text-white flex flex-col items-center p-4">
      <header className="w-full max-w-4xl flex justify-between items-center py-4 mb-4">
        <button
          onClick={() => router.push("/menu")}
          className="flex items-center space-x-2 px-4 py-2 bg-white/5 hover:bg-white/10 rounded-xl transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>메뉴로</span>
        </button>
        <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-400">
          AI와 대결 ({size}x{size})
        </h1>
        <div className="w-20" /> {/* Spacer for centering */}
      </header>

      <main className="w-full max-w-4xl flex flex-col lg:flex-row gap-8 items-center lg:items-start justify-center">
        {/* Board Section */}
        <div className="flex-1 w-full max-w-[800px] relative">
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
            onMove={handleMove} 
            lastMove={lastMove}
            disabled={isAiThinking || isGameOver}
          />
        </div>

        {/* Info & Controls Section */}
        <div className="flex flex-row lg:flex-col gap-6 w-full lg:w-64">
          <div className="flex flex-row lg:flex-col gap-4 flex-1">
            <CaptureCounter color="black" count={whiteCaptures} /> {/* 흑이 따낸 백돌 */}
            <CaptureCounter color="white" count={blackCaptures} /> {/* 백이 따낸 흑돌 */}
          </div>

          {/* AI Difficulty Selector */}
          {opponent === "computer" && !isGameOver && (
            <div className="w-full bg-white/5 rounded-2xl p-4 border border-white/10 shadow-xl backdrop-blur-sm lg:mb-4">
              <h3 className="text-white/80 font-medium mb-3 text-center text-sm">🤖 AI 난이도 조절</h3>
              <div className="flex flex-col gap-2">
                <button
                  onClick={() => setAiLevel(1)}
                  className={`w-full py-2 px-1 rounded-xl text-sm font-bold transition-all ${aiLevel === 1 ? 'bg-green-500 text-white shadow-[0_0_15px_rgba(34,197,94,0.5)] scale-105' : 'bg-white/10 text-white/60 hover:bg-white/20'}`}
                >
                  🐥 병아리 (초보)
                </button>
                <button
                  onClick={() => setAiLevel(5)}
                  className={`w-full py-2 px-1 rounded-xl text-sm font-bold transition-all ${aiLevel === 5 ? 'bg-orange-500 text-white shadow-[0_0_15px_rgba(249,115,22,0.5)] scale-105' : 'bg-white/10 text-white/60 hover:bg-white/20'}`}
                >
                  🐶 강아지 (중수)
                </button>
                <button
                  onClick={() => setAiLevel(10)}
                  className={`w-full py-2 px-1 rounded-xl text-sm font-bold transition-all ${aiLevel === 10 ? 'bg-red-500 text-white shadow-[0_0_15px_rgba(239,68,68,0.5)] scale-105' : 'bg-white/10 text-white/60 hover:bg-white/20'}`}
                >
                  🐯 호랑이 (고수)
                </button>
              </div>
            </div>
          )}

          <div className="grid grid-cols-3 lg:grid-cols-1 gap-4">
            <button className="flex flex-col items-center justify-center p-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl transition-colors group">
              <RotateCcw className="w-6 h-6 mb-2 text-neutral-400 group-hover:text-blue-400" />
              <span className="text-sm font-medium">무르기</span>
            </button>
            <button 
              onClick={handlePass}
              disabled={isAiThinking || isGameOver}
              className="flex flex-col items-center justify-center p-4 bg-white/5 hover:bg-white/10 border border-white/10 disabled:opacity-50 disabled:cursor-not-allowed rounded-2xl transition-colors group"
            >
              <SkipForward className="w-6 h-6 mb-2 text-neutral-400 group-hover:text-yellow-400" />
              <span className="text-sm font-medium">한수쉼</span>
            </button>
            <button 
              onClick={handleResign}
              disabled={isAiThinking || isGameOver}
              className="flex flex-col items-center justify-center p-4 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 disabled:opacity-50 disabled:cursor-not-allowed rounded-2xl transition-colors group"
            >
              <Flag className="w-6 h-6 mb-2 text-red-400 group-hover:text-red-300" />
              <span className="text-sm font-medium text-red-200">기권</span>
            </button>
          </div>
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
