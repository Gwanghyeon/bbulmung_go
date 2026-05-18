"use client";

import { isAuthenticated, login } from "@/lib/auth";
import { motion } from "framer-motion";
import { ArrowRight, KeyRound } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import Image from "next/image";
import logo from "@/assets/images/bbulmung_logo.png";

export default function LoginPage() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (isAuthenticated()) {
      router.replace("/menu");
    }
  }, [router]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const correctPassword = process.env.NEXT_PUBLIC_APP_PASSWORD;

    if (password === correctPassword) {
      login();
      router.push("/menu");
    } else {
      setError(true);
      setTimeout(() => setError(false), 2000);
      setPassword("");
    }
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4 bg-gradient-to-b from-neutral-800 to-neutral-900">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-white/5 backdrop-blur-lg border border-white/10 rounded-3xl p-8 shadow-2xl"
      >
        <div className="flex flex-col items-center mb-8">
          <div className="mb-4">
            <Image 
              src={logo} 
              alt="뿔멍 로고" 
              width={120} 
              height={120} 
              className="object-contain drop-shadow-xl"
              style={{ width: "auto", height: "auto" }}
              priority
            />
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white mb-2">
            뿔멍 바둑
          </h1>
          <p className="text-neutral-400 text-center">
            비밀번호를 입력하고 게임을 시작하세요!
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative">
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="비밀번호"
              className={`w-full px-6 py-4 bg-black/20 border ${
                error ? "border-red-500" : "border-white/10"
              } rounded-2xl text-white placeholder:text-neutral-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all text-lg`}
            />
            {error && (
              <motion.p
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="text-red-400 text-sm mt-2 ml-2 absolute -bottom-6"
              >
                비밀번호가 틀렸어요. 다시 시도해보세요!
              </motion.p>
            )}
          </div>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            type="submit"
            className="w-full mt-6 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-bold py-4 px-6 rounded-2xl flex items-center justify-center space-x-2 transition-colors shadow-lg shadow-indigo-500/25"
          >
            <span>들어가기</span>
            <ArrowRight className="w-5 h-5" />
          </motion.button>
        </form>
      </motion.div>
    </main>
  );
}
