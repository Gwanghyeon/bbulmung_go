"use client";

import { isAuthenticated, logout } from "@/lib/auth";
import { motion, AnimatePresence } from "framer-motion";
import { BookOpen, Grid3X3, LogOut, Play, ChevronRight, Star } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import Image from "next/image";
import logo from "@/assets/images/bbulmung_logo.png";
import level1Image from "@/assets/images/level_1.png";

const BOARD_SIZES = [
  { size: 9, label: "9 × 9", desc: "입문" },
  { size: 13, label: "13 × 13", desc: "초급" },
  { size: 19, label: "19 × 19", desc: "고급" },
];

interface UserProgress {
  currentLevel: number;
  currentExp: number;
  requiredExp: number;
}

function loadUserProgress(): UserProgress {
  if (typeof window === "undefined") return { currentLevel: 1, currentExp: 0, requiredExp: 100 };
  try {
    const stored = localStorage.getItem("bbulmung_progress");
    if (stored) return JSON.parse(stored);
  } catch {}
  return { currentLevel: 1, currentExp: 0, requiredExp: 100 };
}

export default function MenuPage() {
  const router = useRouter();

  // 탭 상태 (3-extra-3)
  const [mode, setMode] = useState<"battle" | "tsumego">("battle");

  // 대결 설정 상태 (3-extra-4)
  const [level, setLevel] = useState(1);
  const [handicap, setHandicap] = useState(0);
  const [boardSize, setBoardSize] = useState(9);

  // 유저 프로필 (3-extra-2)
  const [progress, setProgress] = useState<UserProgress>({ currentLevel: 1, currentExp: 0, requiredExp: 100 });

  useEffect(() => {
    if (!isAuthenticated()) {
      router.replace("/");
    }
    setProgress(loadUserProgress());
  }, [router]);

  const handleLogout = () => {
    logout();
    router.push("/");
  };

  // 라우팅 연동 (3-extra-5)
  const startBattle = () => {
    router.push(`/game?size=${boardSize}&level=${level}&handicap=${handicap}`);
  };

  const expPercent = Math.min(100, Math.round((progress.currentExp / progress.requiredExp) * 100));

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-900 to-black text-white flex flex-col">
      {/* 헤더 */}
      <header className="flex justify-between items-center px-6 py-4 border-b border-white/5 shrink-0">
        <div className="flex items-center space-x-3">
          <Image
            src={logo}
            alt="뿔멍 로고"
            width={36}
            height={36}
            style={{ width: "36px", height: "36px" }}
            priority
          />
          <h1 className="text-xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-purple-400 font-[family-name:var(--font-jua)]">
            뿔멍바둑
          </h1>
        </div>
        <button
          onClick={handleLogout}
          className="flex items-center space-x-2 px-3 py-2 bg-white/5 hover:bg-white/10 rounded-xl transition-colors text-sm"
        >
          <LogOut className="w-4 h-4" />
          <span>나가기</span>
        </button>
      </header>

      {/* 2단 메인 레이아웃 (3-extra-1) */}
      <main className="flex-1 grid grid-cols-1 md:grid-cols-2 overflow-auto">

        {/* ── 좌측: 모드 탭 + 설정 폼 (3-extra-3, 3-extra-4) ── */}
        <div className="p-6 flex flex-col gap-5 border-r border-white/5 overflow-y-auto">

          {/* 모드 탭 */}
          <div className="grid grid-cols-2 gap-2 p-1 bg-white/5 rounded-2xl">
            <button
              onClick={() => setMode("battle")}
              className={`flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-sm transition-all ${
                mode === "battle"
                  ? "bg-blue-500 text-white shadow-lg shadow-blue-500/30"
                  : "text-neutral-400 hover:text-white"
              }`}
            >
              <Play className="w-4 h-4" />
              AI와의 대결
            </button>
            <button
              onClick={() => setMode("tsumego")}
              className={`flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-sm transition-all ${
                mode === "tsumego"
                  ? "bg-purple-500 text-white shadow-lg shadow-purple-500/30"
                  : "text-neutral-400 hover:text-white"
              }`}
            >
              <BookOpen className="w-4 h-4" />
              사활풀이
            </button>
          </div>

          {/* 동적 폼 */}
          <AnimatePresence mode="wait">
            {mode === "battle" ? (
              <motion.div
                key="battle"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="space-y-5"
              >
                {/* 난이도 1~5 (3-extra-4) */}
                <div>
                  <p className="text-sm text-neutral-400 mb-3 font-medium">
                    난이도 <span className="text-blue-400 font-bold">Lv.{level}</span>
                  </p>
                  <div className="grid grid-cols-5 gap-2">
                    {[1, 2, 3, 4, 5].map((lv) => (
                      <button
                        key={lv}
                        onClick={() => setLevel(lv)}
                        className={`py-2.5 rounded-xl text-sm font-bold transition-all ${
                          level === lv
                            ? "bg-blue-500 text-white shadow-lg shadow-blue-500/30 scale-105"
                            : "bg-white/5 hover:bg-white/10 text-neutral-300"
                        }`}
                      >
                        {lv}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 접바둑 0~6 (모든 레벨에서 표시) */}
                <div>
                  <p className="text-sm text-neutral-400 mb-3 font-medium">
                    접바둑{" "}
                    <span className="text-amber-400 font-bold">
                      {handicap === 0 ? "없음" : `${handicap}개`}
                    </span>
                  </p>
                  <div className="grid grid-cols-7 gap-1.5">
                    {[0, 1, 2, 3, 4, 5, 6].map((h) => (
                      <button
                        key={h}
                        onClick={() => setHandicap(h)}
                        className={`py-2.5 rounded-xl text-sm font-bold transition-all ${
                          handicap === h
                            ? "bg-amber-500 text-white shadow-lg shadow-amber-500/30 scale-105"
                            : "bg-white/5 hover:bg-white/10 text-neutral-300"
                        }`}
                      >
                        {h}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 바둑판 크기 */}
                <div>
                  <p className="text-sm text-neutral-400 mb-3 font-medium">바둑판 크기</p>
                  <div className="space-y-2">
                    {BOARD_SIZES.map(({ size, label, desc }) => (
                      <button
                        key={size}
                        onClick={() => setBoardSize(size)}
                        className={`w-full flex items-center justify-between p-3.5 rounded-2xl border transition-all ${
                          boardSize === size
                            ? "bg-blue-500/20 border-blue-500/40 text-blue-200"
                            : "bg-white/5 border-transparent hover:bg-white/10 text-neutral-300"
                        }`}
                      >
                        <div className="flex items-center space-x-3">
                          <Grid3X3 className="w-4 h-4" />
                          <span className="font-medium">{label}</span>
                        </div>
                        <span className="text-sm">{desc}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* 시작하기 버튼 */}
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={startBattle}
                  className="w-full py-4 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-400 hover:to-indigo-500 text-white font-bold text-lg rounded-2xl shadow-lg shadow-blue-500/25 flex items-center justify-center gap-2"
                >
                  <Play className="w-5 h-5" />
                  시작하기
                </motion.button>
              </motion.div>
            ) : (
              <motion.div
                key="tsumego"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="space-y-4"
              >
                <div className="bg-purple-500/10 border border-purple-500/20 rounded-3xl p-8 text-center">
                  <BookOpen className="w-14 h-14 text-purple-400 mx-auto mb-4" />
                  <h2 className="text-xl font-bold mb-2">사활 퀴즈 풀기</h2>
                  <p className="text-neutral-400 text-sm leading-relaxed">
                    재미있는 사활 문제를 풀고<br />실력을 키워보세요!
                  </p>
                </div>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => router.push("/tsumego")}
                  className="w-full py-4 bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-400 hover:to-indigo-500 text-white font-bold text-lg rounded-2xl shadow-lg shadow-purple-500/25 flex items-center justify-center gap-2"
                >
                  <ChevronRight className="w-5 h-5" />
                  사활풀이 시작
                </motion.button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* ── 우측: 유저 프로필 대시보드 (3-extra-2) ── */}
        <div className="p-6 flex flex-col gap-5 bg-black/20">
          {/* 레벨 + EXP 프로그레스 바 */}
          <div className="bg-white/5 rounded-2xl p-5 border border-white/10">
            <div className="flex justify-between items-center mb-3">
              <span className="flex items-center gap-2 font-bold text-lg">
                <Star className="w-5 h-5 text-yellow-400 fill-yellow-400" />
                레벨 {progress.currentLevel}
              </span>
              <span className="text-sm text-neutral-400">
                {progress.currentExp} / {progress.requiredExp} EXP
              </span>
            </div>
            <div className="h-3 bg-white/10 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${expPercent}%` }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                className="h-full bg-gradient-to-r from-yellow-400 to-orange-400 rounded-full"
              />
            </div>
            <p className="text-xs text-neutral-500 mt-2 text-right">{expPercent}%</p>
          </div>

          {/* 캐릭터 이미지 */}
          <div className="flex-1 flex items-center justify-center py-4">
            <motion.div
              animate={{ y: [0, -10, 0] }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
            >
              <Image
                src={level1Image}
                alt="뿔멍 캐릭터"
                width={220}
                height={320}
                className="object-contain drop-shadow-2xl"
                style={{ width: "auto", height: "clamp(180px, 28vh, 300px)" }}
                priority
              />
            </motion.div>
          </div>
        </div>
      </main>
    </div>
  );
}
