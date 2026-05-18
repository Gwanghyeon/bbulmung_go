import { motion } from "framer-motion";

interface CaptureCounterProps {
  color: "black" | "white";
  count: number;
}

export default function CaptureCounter({ color, count }: CaptureCounterProps) {
  const isBlack = color === "black";
  
  return (
    <div className="flex flex-col items-center p-4 bg-white/5 border border-white/10 rounded-2xl shadow-lg min-w-[120px]">
      <div className="flex items-center space-x-3 mb-2">
        <div 
          className={`w-8 h-8 rounded-full shadow-inner ${
            isBlack 
              ? "bg-gradient-to-br from-neutral-700 to-black border-2 border-neutral-800" 
              : "bg-gradient-to-br from-white to-neutral-200 border-2 border-neutral-300"
          }`}
        />
        <span className="text-sm font-bold text-neutral-300">
          {isBlack ? "흑이 따낸 돌" : "백이 따낸 돌"}
        </span>
      </div>
      
      <motion.div 
        key={count}
        initial={{ scale: 1.5, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="text-4xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-indigo-400"
      >
        {count}
      </motion.div>
    </div>
  );
}
