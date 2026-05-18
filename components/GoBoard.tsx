"use client";

import { useState, useCallback, useEffect, useRef, forwardRef, useImperativeHandle, useMemo } from "react";
import { Goban } from "@sabaki/shudan";
import Board from "@sabaki/go-board";
import type { Sign } from "@sabaki/go-board";
import "@sabaki/shudan/css/goban.css";
import type React from "react";

// 표준 접바둑 배치 좌표 [col, row] (0-indexed)
const HANDICAP_POSITIONS: Record<number, Record<number, [number, number][]>> = {
  9: {
    2: [[6, 2], [2, 6]],
    3: [[6, 2], [2, 6], [6, 6]],
    4: [[2, 2], [6, 2], [2, 6], [6, 6]],
    5: [[2, 2], [6, 2], [4, 4], [2, 6], [6, 6]],
    6: [[2, 2], [6, 2], [2, 4], [6, 4], [2, 6], [6, 6]],
  },
  13: {
    2: [[9, 3], [3, 9]],
    3: [[9, 3], [3, 9], [9, 9]],
    4: [[3, 3], [9, 3], [3, 9], [9, 9]],
    5: [[3, 3], [9, 3], [6, 6], [3, 9], [9, 9]],
    6: [[3, 3], [9, 3], [3, 6], [9, 6], [3, 9], [9, 9]],
  },
  19: {
    2: [[15, 3], [3, 15]],
    3: [[15, 3], [3, 15], [15, 15]],
    4: [[3, 3], [15, 3], [3, 15], [15, 15]],
    5: [[3, 3], [15, 3], [9, 9], [3, 15], [15, 15]],
    6: [[3, 3], [15, 3], [3, 9], [15, 9], [3, 15], [15, 15]],
  },
};

const createInitialBoard = (size: number, handicap: number = 0): Board => {
  const signMap = Array.from({ length: size }, () => Array(size).fill(0)) as Sign[][];
  if (handicap >= 2) {
    const positions = HANDICAP_POSITIONS[size]?.[handicap] ?? [];
    for (const [col, row] of positions) {
      if (row < size && col < size) signMap[row][col] = 1;
    }
  }
  return new Board(signMap);
};

interface GoBoardProps {
  size: number;
  handicap?: number;
  onMove?: (board: Board, currentPlayer: Sign, vertex: [number, number]) => void;
  lastMove?: [number, number] | null;
  disabled?: boolean;
}

export interface GoBoardRef {
  playAt: (vertex: [number, number]) => void;
  pass: () => void;
  getBoard: () => Board;
}

const GoBoard = forwardRef<GoBoardRef, GoBoardProps>(({ size, handicap = 0, onMove, lastMove, disabled }, ref) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [board, setBoard] = useState(() => createInitialBoard(size, handicap));
  // 접바둑 2개 이상이면 흑이 먼저 배치(setup)한 후 백이 먼저 착수
  const [currentPlayer, setCurrentPlayer] = useState<Sign>(() => (handicap >= 2 ? -1 : 1));

  const markerMap = useMemo(() => {
    if (!lastMove) return undefined;
    const map = Array(size).fill(0).map(() => Array(size).fill(null));
    map[lastMove[1]][lastMove[0]] = { type: 'circle' };
    return map;
  }, [size, lastMove]);

  // size 또는 handicap이 바뀌면 보드 초기화
  useEffect(() => {
    setBoard(createInitialBoard(size, handicap));
    setCurrentPlayer(handicap >= 2 ? -1 : 1);
  }, [size, handicap]);

  const handleVertexClick = useCallback(
    (evt: any, vertex: [number, number]) => {
      if (disabled) return;
      try {
        const newBoard = board.makeMove(currentPlayer, vertex, {
          preventSuicide: true,
          preventOverwrite: true,
          preventKo: true,
        });

        // Move is valid
        setBoard(newBoard);
        const nextPlayer = -currentPlayer as Sign;
        setCurrentPlayer(nextPlayer);

        if (onMove) {
          onMove(newBoard, nextPlayer, vertex);
        }
      } catch (err) {
        // Handle invalid move
      }
    },
    [board, currentPlayer, disabled, onMove]
  );

  const [vertexSize, setVertexSize] = useState<number>(24);

  useImperativeHandle(ref, () => ({
    playAt: (vertex: [number, number]) => {
      // 프로그램적으로 착수할 때는 disabled 여부를 무시하고 상태 업데이트
      try {
        const newBoard = board.makeMove(currentPlayer, vertex, {
          preventSuicide: true,
          preventOverwrite: true,
          preventKo: true,
        });
        const nextPlayer = -currentPlayer as Sign;
        setBoard(newBoard);
        setCurrentPlayer(nextPlayer);
        if (onMove) onMove(newBoard, nextPlayer, vertex);
      } catch (e) {}
    },
    pass: () => {
      const nextPlayer = -currentPlayer as Sign;
      setCurrentPlayer(nextPlayer);
      if (onMove) onMove(board, nextPlayer, [-1, -1]); // -1, -1 represents pass
    },
    getBoard: () => board
  }));

  // 반응형 바둑판: 컨테이너 크기에 맞춰 vertexSize를 조절
  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        // 컨테이너의 순수 콘텐츠 영역(padding 제외)을 기준으로 칸을 나눕니다.
        const newVertexSize = Math.max(1, Math.floor(Math.min(width, height) / size));
        setVertexSize(newVertexSize);
      }
    });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, [size]);

  const GobanComponent = Goban as React.ComponentType<{
    signMap: number[][];
    markerMap?: (null | { type: string })[][] | undefined;
    showCoordinates?: boolean;
    vertexSize?: number;
    onVertexClick?: (evt: unknown, vertex: [number, number]) => void;
  }>;

  return (
    <div className="w-full flex justify-center items-center p-4 bg-neutral-800 rounded-3xl shadow-2xl border border-white/5 overflow-hidden">
      <div
        className="w-full max-w-[800px] aspect-square p-4 sm:p-8 md:p-10 flex justify-center items-center"
        ref={containerRef}
      >
        <GobanComponent
          signMap={board.signMap}
          markerMap={markerMap ?? undefined}
          showCoordinates={false}
          vertexSize={vertexSize}
          onVertexClick={handleVertexClick}
        />
      </div>
    </div>
  );
});

export default GoBoard;
