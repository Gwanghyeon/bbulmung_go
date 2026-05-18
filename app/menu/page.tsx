"use client";

import { isAuthenticated, logout } from "@/lib/auth";
import { motion } from "framer-motion";
import { BookOpen, Grid3X3, LogOut, Play } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

import Image from "next/image";
import logo from "@/assets/images/bbulmung_logo.png";

export default function MenuPage() {
  const router = useRouter();

  useEffect(() => {
    if (!isAuthenticated()) {
      router.replace("/");
    }
  }, [router]);

  const handleLogout = () => {
    logout();
    router.push("/");
  };

  const menuVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.5,
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, scale: 0.9 },
    visible: { opacity: 1, scale: 1 },
  };

  const startGame = (size: number) => {
    router.push(`/game?size=${size}`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-900 to-black text-white p-6 flex flex-col items-center">
      <header className="w-full max-w-4xl flex justify-between items-center py-6 mb-8">
        <div className="flex items-center space-x-3">
          <Image 
            src={logo} 
            alt="뿔멍 로고" 
            width={48} 
            height={48} 
            className="object-contain" 
            style={{ width: "auto", height: "auto" }}
            priority 
          />
          <h1 className="text-3xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-purple-400">
            뿔멍 바둑
          </h1>
        </div>
        <button
          onClick={handleLogout}
          className="flex items-center space-x-2 px-4 py-2 bg-white/5 hover:bg-white/10 rounded-xl transition-colors"
        >
          <LogOut className="w-5 h-5" />
          <span>나가기</span>
        </button>
      </header>

      <motion.main
        variants={menuVariants}
        initial="hidden"
        animate="visible"
        className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-2 gap-8"
      >
        <motion.div variants={itemVariants} className="space-y-6">
          <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-3xl p-8 shadow-xl">
            <div className="flex items-center space-x-4 mb-6">
              <div className="w-14 h-14 bg-blue-500/20 rounded-2xl flex items-center justify-center">
                <Play className="w-8 h-8 text-blue-400" />
              </div>
              <h2 className="text-2xl font-bold">컴퓨터와 대결</h2>
            </div>

            <div className="space-y-4">
              <button
                onClick={() => startGame(9)}
                className="w-full flex items-center justify-between p-4 bg-white/5 hover:bg-blue-500/20 border border-transparent hover:border-blue-500/30 rounded-2xl transition-all group"
              >
                <div className="flex items-center space-x-3">
                  <Grid3X3 className="w-6 h-6 text-neutral-400 group-hover:text-blue-300" />
                  <span className="text-lg font-medium">9 × 9</span>
                </div>
                <span className="text-sm text-neutral-400 group-hover:text-blue-300">
                  초급
                </span>
              </button>

              <button
                onClick={() => startGame(13)}
                className="w-full flex items-center justify-between p-4 bg-white/5 hover:bg-blue-500/20 border border-transparent hover:border-blue-500/30 rounded-2xl transition-all group"
              >
                <div className="flex items-center space-x-3">
                  <Grid3X3 className="w-6 h-6 text-neutral-400 group-hover:text-blue-300" />
                  <span className="text-lg font-medium">13 × 13</span>
                </div>
                <span className="text-sm text-neutral-400 group-hover:text-blue-300">
                  중급
                </span>
              </button>

              <button
                onClick={() => startGame(19)}
                className="w-full flex items-center justify-between p-4 bg-white/5 hover:bg-blue-500/20 border border-transparent hover:border-blue-500/30 rounded-2xl transition-all group"
              >
                <div className="flex items-center space-x-3">
                  <Grid3X3 className="w-6 h-6 text-neutral-400 group-hover:text-blue-300" />
                  <span className="text-lg font-medium">19 × 19</span>
                </div>
                <span className="text-sm text-neutral-400 group-hover:text-blue-300">
                  고급
                </span>
              </button>
            </div>
          </div>
        </motion.div>

        <motion.div variants={itemVariants} className="h-full">
          <button
            onClick={() => router.push("/tsumego")}
            className="w-full h-full min-h-[300px] bg-gradient-to-br from-purple-600/20 to-indigo-600/20 hover:from-purple-500/30 hover:to-indigo-500/30 backdrop-blur-md border border-purple-500/20 rounded-3xl p-8 shadow-xl flex flex-col items-center justify-center transition-all group"
          >
            <div className="w-20 h-20 bg-purple-500/20 group-hover:bg-purple-500/40 rounded-full flex items-center justify-center mb-6 transition-colors shadow-lg shadow-purple-500/20">
              <BookOpen className="w-10 h-10 text-purple-300" />
            </div>
            <h2 className="text-3xl font-bold mb-3">사활 퀴즈</h2>
            <p className="text-purple-200/70 text-center max-w-[200px]">
              재미있는 사활 문제를 풀고 실력을 키워보세요!
            </p>
          </button>
        </motion.div>
      </motion.main>
    </div>
  );
}
