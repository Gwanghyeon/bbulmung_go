"use client";

import { useState, useCallback, useEffect, useRef, forwardRef, useImperativeHandle, useMemo } from "react";
import { Goban } from "@sabaki/shudan";
import Board from "@sabaki/go-board";
import type { Sign } from "@sabaki/go-board";
import { render, h } from "preact";
import "@sabaki/shudan/css/goban.css";

interface GoBoardProps {
  size: number;
  onMove?: (board: Board, currentPlayer: Sign, vertex: [number, number]) => void;
  lastMove?: [number, number] | null;
  disabled?: boolean;
}

export interface GoBoardRef {
  playAt: (vertex: [number, number]) => void;
  pass: () => void;
  getBoard: () => Board;
}

const createEmptyBoard = (size: number) => {
  return new Board(Array.from({ length: size }, () => Array(size).fill(0)));
};

const GoBoard = forwardRef<GoBoardRef, GoBoardProps>(({ size, onMove, lastMove, disabled }, ref) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [board, setBoard] = useState(() => createEmptyBoard(size));
  const [currentPlayer, setCurrentPlayer] = useState<Sign>(1); // 1: Black, -1: White

  const markerMap = useMemo(() => {
    if (!lastMove) return undefined;
    const map = Array(size).fill(0).map(() => Array(size).fill(null));
    map[lastMove[1]][lastMove[0]] = { type: 'circle' };
    return map;
  }, [size, lastMove]);

  // When size changes, reset the board
  useEffect(() => {
    setBoard(createEmptyBoard(size));
    setCurrentPlayer(1);
  }, [size]);

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

  // Render Preact component into React DOM
  useEffect(() => {
    if (containerRef.current) {
      const vnode = h(Goban as any, {
        signMap: board.signMap,
        markerMap: markerMap,
        showCoordinates: false, // 사용자 요청: 좌표(A B C, 1 2 3) 비활성화
        vertexSize: vertexSize, // 계산된 반응형 사이즈 적용
        onVertexClick: handleVertexClick,
      });
      render(vnode, containerRef.current);
    }
    
    // Cleanup on unmount
    return () => {
      if (containerRef.current) {
        render(null, containerRef.current);
      }
    };
  }, [board, vertexSize, handleVertexClick]);

  return (
    <div className="w-full flex justify-center items-center p-4 bg-neutral-800 rounded-3xl shadow-2xl border border-white/5 overflow-hidden">
      {/* 
        여기에 p-4 sm:p-8을 주어 바둑판이 박스 벽면에 꽉 끼지 않고 
        여백을 가지면서 예쁘게 반응형으로 줄어들게 합니다! 
      */}
      <div 
        className="w-full max-w-[800px] aspect-square p-4 sm:p-8 md:p-10 flex justify-center items-center" 
        ref={containerRef}
      >
        {/* Preact will mount here */}
      </div>
    </div>
  );
});

export default GoBoard;
