"use server";

// @ts-ignore
import * as deadstones from "@sabaki/deadstones";

export async function calculateScoreAction(signMap: number[][], komi: number = 6.5) {
  // Next.js 빌드 시 __dirname이 변경되어 내부 fs.readFile이 실패할 경우 fetch(null)이 발생합니다.
  // 이를 방지하기 위해 fallback URL을 명시적으로 설정합니다.
  deadstones.useFetch("https://unpkg.com/@sabaki/deadstones@2.1.2/wasm/deadstones_bg.wasm");

  // 1. 죽은 돌(사활) 판별 (서버 환경이므로 fs 접근 문제가 없음)
  const deadVertices = await deadstones.guess(signMap, {
    finished: true,
    iterations: 100
  });

  // 2. 죽은 돌을 제거한 가상의 반상 만들기
  const height = signMap.length;
  const width = signMap[0].length;
  const cleanMap = signMap.map(row => [...row]);
  
  let deadBlack = 0;
  let deadWhite = 0;

  for (const [x, y] of deadVertices) {
    if (cleanMap[y][x] === 1) deadBlack++;
    else if (cleanMap[y][x] === -1) deadWhite++;
    cleanMap[y][x] = 0;
  }

  // 3. Flood-fill을 사용한 영토(집) 계산
  let blackStones = 0;
  let whiteStones = 0;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const sign = cleanMap[y][x];
      if (sign === 1) blackStones++;
      else if (sign === -1) whiteStones++;
    }
  }

  const visited = Array(height).fill(0).map(() => Array(width).fill(false));
  let blackTerritory = 0;
  let whiteTerritory = 0;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (cleanMap[y][x] === 0 && !visited[y][x]) {
        let touchesBlack = false;
        let touchesWhite = false;
        let areaSize = 0;
        
        const queue: [number, number][] = [[x, y]];
        visited[y][x] = true;

        while (queue.length > 0) {
          const [cx, cy] = queue.shift()!;
          areaSize++;

          const neighbors = [[cx-1, cy], [cx+1, cy], [cx, cy-1], [cx, cy+1]];
          for (const [nx, ny] of neighbors) {
            if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
              const sign = cleanMap[ny][nx];
              if (sign === 1) touchesBlack = true;
              else if (sign === -1) touchesWhite = true;
              else if (!visited[ny][nx]) {
                visited[ny][nx] = true;
                queue.push([nx, ny]);
              }
            }
          }
        }

        if (touchesBlack && !touchesWhite) blackTerritory += areaSize;
        if (touchesWhite && !touchesBlack) whiteTerritory += areaSize;
      }
    }
  }

  // 4. 최종 점수 계산 (중국식 룰: 살아있는 돌 + 영토)
  const blackScore = blackStones + blackTerritory;
  const whiteScore = whiteStones + whiteTerritory + komi;
  
  return {
    blackScore,
    whiteScore,
    winner: blackScore > whiteScore ? 'Black' : (whiteScore > blackScore ? 'White' : 'Draw'),
    diff: Math.abs(blackScore - whiteScore)
  };
}
