import Board from "@sabaki/go-board";

const letters = "abcdefghijklmnopqrstuvwxyz";

export const vertexToSgf = (vertex: [number, number]): string => {
  if (!vertex || vertex[0] < 0 || vertex[1] < 0) return "";
  return letters[vertex[0]] + letters[vertex[1]];
};

export const sgfToVertex = (sgfCoord: string): [number, number] | null => {
  if (!sgfCoord || sgfCoord.length !== 2) return null;
  if (sgfCoord === "tt") return [-1, -1]; // Pass move is sometimes 'tt' in SGF
  const x = letters.indexOf(sgfCoord[0].toLowerCase());
  const y = letters.indexOf(sgfCoord[1].toLowerCase());
  if (x === -1 || y === -1) return null;
  return [x, y];
};

/**
 * Converts a Sabaki GoBoard instance to a simple SGF string
 * containing the current board position using AB and AW properties.
 */
export const boardToSgf = (board: Board, currentPlayer: number): string => {
  const size = board.width;
  let sgf = `(;GM[1]FF[4]SZ[${size}]`;
  
  let ab = "";
  let aw = "";
  
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const sign = board.get([x, y]);
      if (sign === 1) {
        ab += `[${vertexToSgf([x, y])}]`;
      } else if (sign === -1) {
        aw += `[${vertexToSgf([x, y])}]`;
      }
    }
  }

  if (ab) sgf += `AB${ab}`;
  if (aw) sgf += `AW${aw}`;
  
  // Whose turn is it?
  sgf += `PL[${currentPlayer === 1 ? 'B' : 'W'}]`;
  
  sgf += ")";
  return sgf;
};

/**
 * Parses an SGF string to find the last move.
 * Returns the color ('B' or 'W') and the vertex [x, y].
 */
export const parseLastMoveFromSgf = (sgf: string): { sign: number; vertex: [number, number] | null } | null => {
  // Simple regex to find the last move node e.g. ;B[cc] or ;W[dd]
  const moveRegex = /;([BW])\[([a-zA-Z]{0,2})\]/g;
  let match;
  let lastMatch = null;
  
  while ((match = moveRegex.exec(sgf)) !== null) {
    lastMatch = match;
  }

  if (!lastMatch) return null;

  const colorStr = lastMatch[1].toUpperCase();
  const coordStr = lastMatch[2];
  
  const sign = colorStr === "B" ? 1 : -1;
  
  if (!coordStr || coordStr === "tt") {
    // Pass
    return { sign, vertex: [-1, -1] };
  }
  
  const vertex = sgfToVertex(coordStr);
  return { sign, vertex };
};
