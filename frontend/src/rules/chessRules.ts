export type PieceType = 'sdaach' | 'neang' | 'koul' | 'sesh' | 'touk' | 'trey' | 'trey_kaet';
export type PieceColor = 'w' | 'b';

export interface Piece {
  type: PieceType;
  color: PieceColor;
  hasMoved: boolean;
}

export type Board = (Piece | null)[][];

export interface Position {
  row: number; // 0 to 7 (0 is row 8, 7 is row 1)
  col: number; // 0 to 7 (a to h)
}

export interface Move {
  from: Position;
  to: Position;
  piece: Piece;
  captured: Piece | null;
  isPromotion?: boolean;
  isSpecialJump?: boolean;
}

export interface CountingState {
  isActive: boolean;
  count: number;
  limit: number;
  reason: string;
}

export interface GameState {
  board: Board;
  turn: PieceColor;
  moveHistory: Move[];
  winner: PieceColor | 'draw' | null;
  isCheck: boolean;
  isCheckmate: boolean;
  isDraw: boolean;
  countingState: CountingState;
}

// Initial setup of Ouk Chatrang board
// White starts on ranks 1 & 3, Black on ranks 8 & 6
// Note: 0-indexed rows: 0=rank 8, 2=rank 6, 5=rank 3, 7=rank 1.
export function createInitialBoard(): Board {
  const board: Board = Array(8).fill(null).map(() => Array(8).fill(null));

  // Black pieces (Row 0 - Rank 8)
  board[0][0] = { type: 'touk', color: 'b', hasMoved: false };
  board[0][1] = { type: 'sesh', color: 'b', hasMoved: false };
  board[0][2] = { type: 'koul', color: 'b', hasMoved: false };
  board[0][3] = { type: 'neang', color: 'b', hasMoved: false };  // Black Queen starts on d8
  board[0][4] = { type: 'sdaach', color: 'b', hasMoved: false }; // Black King starts on e8
  board[0][5] = { type: 'koul', color: 'b', hasMoved: false };
  board[0][6] = { type: 'sesh', color: 'b', hasMoved: false };
  board[0][7] = { type: 'touk', color: 'b', hasMoved: false };

  // Black Pawns (Row 2 - Rank 6)
  for (let c = 0; c < 8; c++) {
    board[2][c] = { type: 'trey', color: 'b', hasMoved: false };
  }

  // White Pawns (Row 5 - Rank 3)
  for (let c = 0; c < 8; c++) {
    board[5][c] = { type: 'trey', color: 'w', hasMoved: false };
  }

  // White pieces (Row 7 - Rank 1)
  board[7][0] = { type: 'touk', color: 'w', hasMoved: false };
  board[7][1] = { type: 'sesh', color: 'w', hasMoved: false };
  board[7][2] = { type: 'koul', color: 'w', hasMoved: false };
  board[7][3] = { type: 'sdaach', color: 'w', hasMoved: false }; // White King starts on d1
  board[7][4] = { type: 'neang', color: 'w', hasMoved: false };  // White Queen starts on e1
  board[7][5] = { type: 'koul', color: 'w', hasMoved: false };
  board[7][6] = { type: 'sesh', color: 'w', hasMoved: false };
  board[7][7] = { type: 'touk', color: 'w', hasMoved: false };

  return board;
}

export function copyBoard(board: Board): Board {
  return board.map(row => row.map(piece => piece ? { ...piece } : null));
}

// Generate legal moves for a specific piece
export function getLegalMoves(board: Board, pos: Position, lastMoves: Move[] = []): Position[] {
  const piece = board[pos.row][pos.col];
  if (!piece) return [];

  const moves: Position[] = [];
  const color = piece.color;
  const oppColor = color === 'w' ? 'b' : 'w';

  const inBounds = (r: number, c: number) => r >= 0 && r < 8 && c >= 0 && c < 8;

  switch (piece.type) {
    case 'touk': {
      // Orthogonal sliding (Rook)
      const dirs = [[1,0], [-1,0], [0,1], [0,-1]];
      for (const [dr, dc] of dirs) {
        let r = pos.row + dr;
        let c = pos.col + dc;
        while (inBounds(r, c)) {
          const target = board[r][c];
          if (!target) {
            moves.push({ row: r, col: c });
          } else {
            if (target.color === oppColor) {
              moves.push({ row: r, col: c });
            }
            break;
          }
          r += dr;
          c += dc;
        }
      }
      break;
    }

    case 'sesh': {
      // L-shapes (Knight)
      const diffs = [
        [-2,-1], [-2,1], [-1,-2], [-1,2],
        [1,-2], [1,2], [2,-1], [2,1]
      ];
      for (const [dr, dc] of diffs) {
        const r = pos.row + dr;
        const c = pos.col + dc;
        if (inBounds(r, c)) {
          const target = board[r][c];
          if (!target || target.color === oppColor) {
            moves.push({ row: r, col: c });
          }
        }
      }
      break;
    }

    case 'koul': {
      // Bishop: 1 step diagonally in any direction, OR 1 step straight forward
      const fwd = color === 'w' ? -1 : 1;
      const KoulMoves = [
        [fwd, 0], // Forward
        [-1, -1], [-1, 1], [1, -1], [1, 1] // Diagonals
      ];
      for (const [dr, dc] of KoulMoves) {
        const r = pos.row + dr;
        const c = pos.col + dc;
        if (inBounds(r, c)) {
          const target = board[r][c];
          if (!target || target.color === oppColor) {
            moves.push({ row: r, col: c });
          }
        }
      }
      break;
    }

    case 'neang':
    case 'trey_kaet': {
      // Queen (Neang) or Promoted Pawn: 1 step diagonally in any direction
      const diagDirs = [[-1, -1], [-1, 1], [1, -1], [1, 1]];
      for (const [dr, dc] of diagDirs) {
        const r = pos.row + dr;
        const c = pos.col + dc;
        if (inBounds(r, c)) {
          const target = board[r][c];
          if (!target || target.color === oppColor) {
            moves.push({ row: r, col: c });
          }
        }
      }

      // First-turn Queen Jump: Can jump 2 squares straight forward if it hasn't moved yet
      if (!piece.hasMoved && piece.type === 'neang') {
        const fwd = color === 'w' ? -1 : 1;
        const r2 = pos.row + 2 * fwd;
        const c2 = pos.col;
        if (inBounds(r2, c2)) {
          // Can jump over a piece, but target must be empty (cannot capture on first jump)
          const dest = board[r2][c2];
          if (!dest) {
            moves.push({ row: r2, col: c2 });
          }
        }
      }
      break;
    }

    case 'sdaach': {
      // King: 1 step any direction
      const dirs = [
        [-1,-1], [-1,0], [-1,1],
        [0,-1],          [0,1],
        [1,-1],  [1,0],  [1,1]
      ];
      for (const [dr, dc] of dirs) {
        const r = pos.row + dr;
        const c = pos.col + dc;
        if (inBounds(r, c)) {
          const target = board[r][c];
          if (!target || target.color === oppColor) {
            moves.push({ row: r, col: c });
          }
        }
      }

      // First-turn King Jump: Can jump like a Knight on its first move (if not in check)
      if (!piece.hasMoved) {
        // Find if King is in check
        const isCurrentlyInCheck = isKingInCheck(board, color);
        if (!isCurrentlyInCheck) {
          const knightDiffs = [
            [-2,-1], [-2,1], [-1,-2], [-1,2],
            [1,-2], [1,2], [2,-1], [2,1]
          ];
          for (const [dr, dc] of knightDiffs) {
            const r = pos.row + dr;
            const c = pos.col + dc;
            if (inBounds(r, c)) {
              const target = board[r][c];
              // King first jump cannot capture and must land on an empty square
              if (!target) {
                moves.push({ row: r, col: c });
              }
            }
          }
        }
      }
      break;
    }

    case 'trey': {
      // Pawn (Trey): Moves 1 step forward, captures 1 step diagonally forward
      const fwd = color === 'w' ? -1 : 1;
      
      // Step forward
      const nextR = pos.row + fwd;
      if (inBounds(nextR, pos.col) && !board[nextR][pos.col]) {
        moves.push({ row: nextR, col: pos.col });
      }

      // Diagonals for capture
      const captureCols = [pos.col - 1, pos.col + 1];
      for (const col of captureCols) {
        if (inBounds(nextR, col)) {
          const target = board[nextR][col];
          if (target && target.color === oppColor) {
            moves.push({ row: nextR, col });
          }
        }
      }
      break;
    }
  }

  // Filter out moves that leave the King in check
  return moves.filter(m => {
    const tempBoard = copyBoard(board);
    // Execute move on temp board
    tempBoard[m.row][m.col] = { ...piece, hasMoved: true };
    tempBoard[pos.row][pos.col] = null;
    return !isKingInCheck(tempBoard, color);
  });
}

// Find position of the king
export function findKing(board: Board, color: PieceColor): Position | null {
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const piece = board[r][c];
      if (piece && piece.type === 'sdaach' && piece.color === color) {
        return { row: r, col: c };
      }
    }
  }
  return null;
}

// Verify if the King of a given color is in check
export function isKingInCheck(board: Board, color: PieceColor): boolean {
  const kingPos = findKing(board, color);
  if (!kingPos) return false;

  const oppColor = color === 'w' ? 'b' : 'w';

  // Check if any opponent piece can move to kingPos
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const piece = board[r][c];
      if (piece && piece.color === oppColor) {
        // Generate pseudo-legal moves for opponent piece (ignore check filter to avoid infinite recursion)
        const moves = getPseudoLegalMoves(board, { row: r, col: c });
        if (moves.some(m => m.row === kingPos.row && m.col === kingPos.col)) {
          return true;
        }
      }
    }
  }
  return false;
}

// Helper to get moves without recursive check verification
function getPseudoLegalMoves(board: Board, pos: Position): Position[] {
  const piece = board[pos.row][pos.col];
  if (!piece) return [];

  const moves: Position[] = [];
  const color = piece.color;
  const oppColor = color === 'w' ? 'b' : 'w';
  const inBounds = (r: number, c: number) => r >= 0 && r < 8 && c >= 0 && c < 8;

  switch (piece.type) {
    case 'touk': {
      const dirs = [[1,0], [-1,0], [0,1], [0,-1]];
      for (const [dr, dc] of dirs) {
        let r = pos.row + dr;
        let c = pos.col + dc;
        while (inBounds(r, c)) {
          const target = board[r][c];
          if (!target) {
            moves.push({ row: r, col: c });
          } else {
            if (target.color === oppColor) {
              moves.push({ row: r, col: c });
            }
            break;
          }
          r += dr;
          c += dc;
        }
      }
      break;
    }
    case 'sesh': {
      const diffs = [
        [-2,-1], [-2,1], [-1,-2], [-1,2],
        [1,-2], [1,2], [2,-1], [2,1]
      ];
      for (const [dr, dc] of diffs) {
        const r = pos.row + dr;
        const c = pos.col + dc;
        if (inBounds(r, c)) {
          const target = board[r][c];
          if (!target || target.color === oppColor) {
            moves.push({ row: r, col: c });
          }
        }
      }
      break;
    }
    case 'koul': {
      const fwd = color === 'w' ? -1 : 1;
      const KoulMoves = [
        [fwd, 0],
        [-1, -1], [-1, 1], [1, -1], [1, 1]
      ];
      for (const [dr, dc] of KoulMoves) {
        const r = pos.row + dr;
        const c = pos.col + dc;
        if (inBounds(r, c)) {
          const target = board[r][c];
          if (!target || target.color === oppColor) {
            moves.push({ row: r, col: c });
          }
        }
      }
      break;
    }
    case 'neang':
    case 'trey_kaet': {
      const diagDirs = [[-1, -1], [-1, 1], [1, -1], [1, 1]];
      for (const [dr, dc] of diagDirs) {
        const r = pos.row + dr;
        const c = pos.col + dc;
        if (inBounds(r, c)) {
          const target = board[r][c];
          if (!target || target.color === oppColor) {
            moves.push({ row: r, col: c });
          }
        }
      }
      // Check first-turn Queen jump
      if (!piece.hasMoved && piece.type === 'neang') {
        const fwd = color === 'w' ? -1 : 1;
        const r2 = pos.row + 2 * fwd;
        if (inBounds(r2, pos.col) && !board[r2][pos.col]) {
          moves.push({ row: r2, col: pos.col });
        }
      }
      break;
    }
    case 'sdaach': {
      const dirs = [
        [-1,-1], [-1,0], [-1,1],
        [0,-1],          [0,1],
        [1,-1],  [1,0],  [1,1]
      ];
      for (const [dr, dc] of dirs) {
        const r = pos.row + dr;
        const c = pos.col + dc;
        if (inBounds(r, c)) {
          const target = board[r][c];
          if (!target || target.color === oppColor) {
            moves.push({ row: r, col: c });
          }
        }
      }
      // First-turn King jump
      if (!piece.hasMoved) {
        const knightDiffs = [
          [-2,-1], [-2,1], [-1,-2], [-1,2],
          [1,-2], [1,2], [2,-1], [2,1]
        ];
        for (const [dr, dc] of knightDiffs) {
          const r = pos.row + dr;
          const c = pos.col + dc;
          if (inBounds(r, c) && !board[r][c]) {
            moves.push({ row: r, col: c });
          }
        }
      }
      break;
    }
    case 'trey': {
      const fwd = color === 'w' ? -1 : 1;
      const nextR = pos.row + fwd;
      const captureCols = [pos.col - 1, pos.col + 1];
      for (const col of captureCols) {
        if (inBounds(nextR, col)) {
          const target = board[nextR][col];
          if (target && target.color === oppColor) {
            moves.push({ row: nextR, col });
          }
        }
      }
      break;
    }
  }
  return moves;
}

// Convert board coordinate to algebraic notation (e.g. e3)
export function toAlgebraic(pos: Position): string {
  const colLetter = String.fromCharCode(97 + pos.col); // a to h
  const rowNumber = 8 - pos.row;
  return `${colLetter}${rowNumber}`;
}

// Determine if there are unpromoted pawns on the board
export function hasUnpromotedPawns(board: Board): boolean {
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      if (board[r][c]?.type === 'trey') {
        return true;
      }
    }
  }
  return false;
}

// Calculate the endgame counting limit for a defending player
export function getHonorCountingLimit(board: Board, defendingColor: PieceColor): { limit: number; reason: string } {
  const attackingColor = defendingColor === 'w' ? 'b' : 'w';

  // Count pieces of the attacking side
  let rooks = 0;
  let kouls = 0;
  let knights = 0;
  let queens = 0;
  let pawns = 0;

  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const p = board[r][c];
      if (p && p.color === attackingColor) {
        if (p.type === 'touk') rooks++;
        else if (p.type === 'koul') kouls++;
        else if (p.type === 'sesh') knights++;
        else if (p.type === 'neang' || p.type === 'trey_kaet') queens++;
        else if (p.type === 'trey') pawns++;
      }
    }
  }

  // Under Ouk Chatrang rules, the escape limit is determined by the opponent's strongest combination:
  if (rooks >= 2) return { limit: 8, reason: 'Opponent has 2 Rooks' };
  if (rooks === 1) return { limit: 16, reason: 'Opponent has 1 Rook' };
  if (kouls >= 2) return { limit: 22, reason: 'Opponent has 2 Bishops' };
  if (kouls === 1) return { limit: 44, reason: 'Opponent has 1 Bishop' };
  if (knights >= 2) return { limit: 32, reason: 'Opponent has 2 Knights' };
  if (knights === 1) return { limit: 64, reason: 'Opponent has 1 Knight' };
  return { limit: 64, reason: 'Opponent has only Queen/Promoted Pawns' };
}

// Counts total remaining pieces on the board
export function countTotalPieces(board: Board): number {
  let count = 0;
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      if (board[r][c]) count++;
    }
  }
  return count;
}

// Counts pieces belonging to a specific color
export function countColorPieces(board: Board, color: PieceColor): number {
  let count = 0;
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      if (board[r][c]?.color === color) count++;
    }
  }
  return count;
}


// Evaluate board for Minimax. Positive is good for White, Negative is good for Black.
export function evaluateBoard(board: Board): number {
  let score = 0;
  const values: Record<PieceType, number> = {
    sdaach: 10000,
    touk: 80,
    sesh: 50,
    koul: 40,
    neang: 20,
    trey_kaet: 20,
    trey: 10
  };

  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const piece = board[r][c];
      if (piece) {
        let val = values[piece.type] || 0;
        
        // Positional additions: encourage control of center
        if (r >= 3 && r <= 4 && c >= 3 && c <= 4) {
          val += 2;
        }
        
        // Trey advancement encouragement
        if (piece.type === 'trey') {
          val += (piece.color === 'w' ? (7 - r) : r) * 0.5;
        }

        if (piece.color === 'w') {
          score += val;
        } else {
          score -= val;
        }
      }
    }
  }
  return score;
}

// Minimax search with Alpha-Beta pruning
export function minimax(
  board: Board,
  depth: number,
  alpha: number,
  beta: number,
  isMaximizing: boolean,
  history: Move[]
): { score: number; move: { from: Position; to: Position } | null } {
  if (depth === 0) {
    return { score: evaluateBoard(board), move: null };
  }

  const activeColor: PieceColor = isMaximizing ? 'w' : 'b';
  const moves: { from: Position; to: Position }[] = [];

  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      if (board[r][c]?.color === activeColor) {
        const from = { row: r, col: c };
        const targets = getLegalMoves(board, from, history);
        targets.forEach(to => {
          moves.push({ from, to });
        });
      }
    }
  }

  if (moves.length === 0) {
    if (isKingInCheck(board, activeColor)) {
      // Checkmate: value depends on depth to find fastest mate
      return { score: isMaximizing ? -20000 + depth : 20000 - depth, move: null };
    }
    return { score: 0, move: null }; // Stalemate
  }

  // Move ordering: evaluate captures first for better alpha-beta efficiency
  moves.sort((a, b) => {
    const targetA = board[a.to.row][a.to.col];
    const targetB = board[b.to.row][b.to.col];
    const valA = targetA ? 1 : 0;
    const valB = targetB ? 1 : 0;
    return valB - valA;
  });

  let bestMove: { from: Position; to: Position } | null = null;

  if (isMaximizing) {
    let maxScore = -Infinity;
    for (const move of moves) {
      const nextBoard = copyBoard(board);
      const piece = nextBoard[move.from.row][move.from.col]!;
      nextBoard[move.to.row][move.to.col] = { ...piece, hasMoved: true };
      nextBoard[move.from.row][move.from.col] = null;

      const { score } = minimax(nextBoard, depth - 1, alpha, beta, false, history);
      if (score > maxScore) {
        maxScore = score;
        bestMove = move;
      }
      alpha = Math.max(alpha, score);
      if (beta <= alpha) break; // Prune
    }
    return { score: maxScore, move: bestMove };
  } else {
    let minScore = Infinity;
    for (const move of moves) {
      const nextBoard = copyBoard(board);
      const piece = nextBoard[move.from.row][move.from.col]!;
      nextBoard[move.to.row][move.to.col] = { ...piece, hasMoved: true };
      nextBoard[move.from.row][move.from.col] = null;

      const { score } = minimax(nextBoard, depth - 1, alpha, beta, true, history);
      if (score < minScore) {
        minScore = score;
        bestMove = move;
      }
      beta = Math.min(beta, score);
      if (beta <= alpha) break; // Prune
    }
    return { score: minScore, move: bestMove };
  }
}

