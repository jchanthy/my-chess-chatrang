'use client';

import React, { useState, useEffect } from 'react';
import {
  createInitialBoard,
  getLegalMoves,
  isKingInCheck,
  getHonorCountingLimit,
  countTotalPieces,
  hasUnpromotedPawns,
  copyBoard,
  toAlgebraic,
  minimax,
  Board,
  Position,
  Move,
  CountingState,
  PieceColor,
  Piece
} from '../rules/chessRules';
import { PieceIcon } from '../components/PieceIcon';

export default function Home() {
  const [board, setBoard] = useState<Board>([]);
  const [turn, setTurn] = useState<PieceColor>('w');
  const [selectedPos, setSelectedPos] = useState<Position | null>(null);
  const [legalMoves, setLegalMoves] = useState<Position[]>([]);
  const [history, setHistory] = useState<Move[]>([]);
  const [winner, setWinner] = useState<PieceColor | 'draw' | null>(null);
  
  // Game modes
  const [vsAI, setVsAI] = useState<boolean>(true);
  const [aiDifficulty, setAiDifficulty] = useState<'easy' | 'engine'>('easy');
  const [isCalculatedByEngine, setIsCalculatedByEngine] = useState<boolean>(false);

  // Endgame counting rule
  const [countingState, setCountingState] = useState<CountingState>({
    isActive: false,
    count: 0,
    limit: 64,
    reason: ''
  });

  // Sound effect / Haptic placeholders (Vibration API)
  const triggerHaptic = () => {
    if (typeof window !== 'undefined' && navigator.vibrate) {
      navigator.vibrate(20);
    }
  };

  // Initialize board
  useEffect(() => {
    resetGame();
  }, []);

  const resetGame = () => {
    setBoard(createInitialBoard());
    setTurn('w');
    setSelectedPos(null);
    setLegalMoves([]);
    setHistory([]);
    setWinner(null);
    setIsCalculatedByEngine(false);
    setCountingState({
      isActive: false,
      count: 0,
      limit: 64,
      reason: ''
    });
  };

  // AI Move triggers
  useEffect(() => {
    if (vsAI && turn === 'b' && !winner) {
      const timer = setTimeout(() => {
        makeAIMove();
      }, 600);
      return () => clearTimeout(timer);
    }
  }, [turn, vsAI, winner]);

  const makeAIMove = async () => {
    // 1. Fetch from Fairy-Stockfish engine if selected
    if (aiDifficulty === 'engine') {
      setIsCalculatedByEngine(true);
      try {
        // Send state to API backend
        const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || 'https://ouk-chatrang-backend-56450014005.us-central1.run.app';
        const response = await fetch(`${apiBaseUrl}/api/move`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            board,
            turn,
            history
          })
        });
        if (response.ok) {
          const data = await response.json();
          if (data.move) {
            executeMove(data.move.from, data.move.to);
            setIsCalculatedByEngine(false);
            return;
          }
        }
      } catch (err) {
        console.error('Engine error, falling back to local heuristic:', err);
      }
      setIsCalculatedByEngine(false);
    }

    // 2. Local AI Engine (3-ply Minimax Search with Alpha-Beta pruning)
    const result = minimax(board, 3, -Infinity, Infinity, false, history);
    if (result.move) {
      executeMove(result.move.from, result.move.to);
    } else {
      // Checkmate or Stalemate
      if (isKingInCheck(board, 'b')) {
        setWinner('w');
      } else {
        setWinner('draw');
      }
    }
  };

  const handleSquareClick = (row: number, col: number) => {
    if (winner || (vsAI && turn === 'b')) return;

    const clickedPiece = board[row][col];

    if (selectedPos) {
      // Try to execute a move
      const isLegal = legalMoves.some(m => m.row === row && m.col === col);
      if (isLegal) {
        executeMove(selectedPos, { row, col });
        setSelectedPos(null);
        setLegalMoves([]);
      } else if (clickedPiece && clickedPiece.color === turn) {
        // Change selection
        setSelectedPos({ row, col });
        setLegalMoves(getLegalMoves(board, { row, col }, history));
        triggerHaptic();
      } else {
        // Deselect
        setSelectedPos(null);
        setLegalMoves([]);
      }
    } else if (clickedPiece && clickedPiece.color === turn) {
      setSelectedPos({ row, col });
      setLegalMoves(getLegalMoves(board, { row, col }, history));
      triggerHaptic();
    }
  };

  const executeMove = (from: Position, to: Position) => {
    const activeBoard = copyBoard(board);
    const piece = activeBoard[from.row][from.col];
    if (!piece) return;

    const targetPiece = activeBoard[to.row][to.col];

    // Check special promotions (Trey becomes Queen-like Trey Kaet at 6th rank for white, 3rd rank for black)
    let isPromotion = false;
    let finalPiece = { ...piece, hasMoved: true };

    if (piece.type === 'trey') {
      const promotionRank = piece.color === 'w' ? 2 : 5; // White: row index 2 (rank 6), Black: row index 5 (rank 3)
      if (to.row === promotionRank) {
        finalPiece.type = 'trey_kaet';
        isPromotion = true;
      }
    }

    // Apply move
    activeBoard[to.row][to.col] = finalPiece;
    activeBoard[from.row][from.col] = null;

    const moveObj: Move = {
      from,
      to,
      piece,
      captured: targetPiece,
      isPromotion,
      isSpecialJump: Math.abs(to.row - from.row) > 1 && (piece.type === 'sdaach' || piece.type === 'neang')
    };

    const newHistory = [...history, moveObj];
    setHistory(newHistory);

    // Update board state
    setBoard(activeBoard);

    // Turn control & endgame state evaluations
    const nextTurn = turn === 'w' ? 'b' : 'w';

    // Piece's Honor Counting evaluation
    // Activates when BOTH sides have 0 unpromoted pawns (Trey)
    const nextBoardHasUnpromoted = hasUnpromotedPawns(activeBoard);
    let nextCounting = { ...countingState };

    if (!nextBoardHasUnpromoted) {
      if (!countingState.isActive) {
        // Initiate counting
        const totalPieces = countTotalPieces(activeBoard);
        const { limit, reason } = getHonorCountingLimit(activeBoard, nextTurn);
        
        // Base count starts at remaining pieces + 1
        const startCount = totalPieces + 1;
        nextCounting = {
          isActive: true,
          count: startCount,
          limit,
          reason
        };
      } else {
        // Increment counting
        const nextCount = countingState.count + 1;
        if (nextCount > countingState.limit) {
          setWinner('draw');
        }
        nextCounting.count = nextCount;
        
        // Re-evaluate limit just in case a piece got captured
        const { limit, reason } = getHonorCountingLimit(activeBoard, nextTurn);
        nextCounting.limit = limit;
        nextCounting.reason = reason;
      }
    }

    setCountingState(nextCounting);

    // Checkmate / Stalemate evaluation for next turn
    const hasNextLegalMoves = hasAnyLegalMoves(activeBoard, nextTurn, newHistory);
    const checkState = isKingInCheck(activeBoard, nextTurn);

    if (!hasNextLegalMoves) {
      if (checkState) {
        setWinner(turn); // Current turn wins (Checkmate)
      } else {
        setWinner('draw'); // Stalemate
      }
    }

    setTurn(nextTurn);
  };

  const hasAnyLegalMoves = (currentBoard: Board, color: PieceColor, lastMoves: Move[]): boolean => {
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        if (currentBoard[r][c]?.color === color) {
          if (getLegalMoves(currentBoard, { row: r, col: c }, lastMoves).length > 0) {
            return true;
          }
        }
      }
    }
    return false;
  };

  const isSquareSelected = (r: number, c: number) => {
    return selectedPos?.row === r && selectedPos?.col === c;
  };

  const isSquareHighlighted = (r: number, c: number) => {
    return legalMoves.some(m => m.row === r && m.col === c);
  };

  const isLastMoveSquare = (r: number, c: number) => {
    if (history.length === 0) return false;
    const last = history[history.length - 1];
    return (last.from.row === r && last.from.col === c) || (last.to.row === r && last.to.col === c);
  };

  return (
    <div className="min-h-screen bg-radial from-slate-900 via-zinc-950 to-black text-white p-4 md:p-8 flex flex-col items-center">
      {/* Header section with rich aesthetics */}
      <header className="mb-6 text-center select-none animate-fade-in">
        <h1 className="text-3xl md:text-5xl font-extrabold tracking-wider bg-gradient-to-r from-amber-400 via-yellow-200 to-amber-500 bg-clip-text text-transparent drop-shadow-md">
          OUK CHATRANG
        </h1>
        <p className="text-xs md:text-sm font-semibold tracking-widest text-amber-500/80 mt-1 uppercase">
          អុកចត្រង្គ • Cambodian Traditional Chess
        </p>
      </header>

      {/* Main Area */}
      <div className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Game Info / Counting Indicator (Left panel on Desktop) */}
        <div className="lg:col-span-3 flex flex-col gap-4">
          
          {/* Status Display Card */}
          <div className="bg-slate-950/80 border border-amber-500/30 rounded-2xl p-5 shadow-2xl backdrop-blur-md">
            <h2 className="text-lg font-bold text-amber-400 border-b border-amber-500/20 pb-2 mb-3">Game Status</h2>
            
            <div className="flex items-center justify-between mb-4">
              <span className="text-slate-400">Current Turn:</span>
              <span className={`px-4 py-1.5 rounded-full text-sm font-black tracking-wider uppercase transition-all duration-300 ${
                turn === 'w' 
                  ? 'bg-amber-400 text-slate-950 shadow-[0_0_15px_rgba(251,191,36,0.4)]' 
                  : 'bg-slate-800 text-white border border-slate-700'
              }`}>
                {turn === 'w' ? 'Gold (White)' : 'Silver (Black)'}
              </span>
            </div>

            {winner && (
              <div className="mt-4 p-4 rounded-xl text-center font-bold text-lg animate-pulse border border-emerald-500/30 bg-emerald-950/40 text-emerald-400">
                {winner === 'draw' ? 'Game Drawn!' : `${winner === 'w' ? 'Gold' : 'Silver'} Wins!`}
              </div>
            )}

            {isCalculatedByEngine && (
              <div className="mt-2 text-xs text-amber-300 animate-pulse text-center">
                🤖 Fairy-Stockfish is calculating best move...
              </div>
            )}
          </div>

          {/* Piece's Honor Counting rule ticker */}
          <div className={`bg-slate-950/80 border rounded-2xl p-5 shadow-2xl backdrop-blur-md transition-all duration-500 ${
            countingState.isActive ? 'border-amber-500' : 'border-slate-800 opacity-60'
          }`}>
            <div className="flex items-center gap-2 mb-2">
              <span className="relative flex h-3 w-3">
                <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                  countingState.isActive ? 'bg-amber-400' : 'bg-slate-500'
                }`}></span>
                <span className={`relative inline-flex rounded-full h-3 w-3 ${
                  countingState.isActive ? 'bg-amber-500' : 'bg-slate-600'
                }`}></span>
              </span>
              <h2 className="text-lg font-bold text-amber-400">Honor Counting</h2>
            </div>
            
            {countingState.isActive ? (
              <div className="space-y-3">
                <p className="text-xs text-amber-300/80 italic font-mono">{countingState.reason}</p>
                <div className="flex justify-between items-end">
                  <span className="text-slate-400 text-xs">Current Count:</span>
                  <span className="text-3xl font-extrabold text-amber-400 tracking-tighter">
                    {countingState.count} <span className="text-sm font-medium text-slate-500">/ {countingState.limit}</span>
                  </span>
                </div>
                {/* Visual gauge bar */}
                <div className="w-full bg-slate-800 rounded-full h-2.5 overflow-hidden">
                  <div 
                    className="bg-gradient-to-r from-yellow-500 to-amber-400 h-2.5 rounded-full transition-all duration-300"
                    style={{ width: `${(countingState.count / countingState.limit) * 100}%` }}
                  ></div>
                </div>
                <p className="text-[10px] text-slate-400 mt-2">
                  Reach count {countingState.limit} without being checkmated to trigger a Draw.
                </p>
              </div>
            ) : (
              <div className="text-slate-500 text-xs py-2">
                Endgame counting rules activate automatically when all unpromoted Trey (pawns) have been promoted or captured.
              </div>
            )}
          </div>
        </div>

        {/* 8x8 Board Container (Center) */}
        <div className="lg:col-span-6 flex flex-col items-center">
          
          {/* Main Board */}
          <div className="relative w-full max-w-[500px] aspect-square rounded-xl overflow-hidden border-[12px] border-[#1d120a] shadow-[0_20px_50px_rgba(0,0,0,0.7)] bg-[#e6cb9f] p-1 select-none">
            {/* Wooden Texture Background Grid overlay */}
            <div className="absolute inset-0 bg-cover bg-center opacity-[0.15] mix-blend-multiply pointer-events-none" 
                 style={{ backgroundImage: 'radial-gradient(circle, #ffe3bd 0%, #d8b888 100%)' }}>
            </div>
            
            <div className="w-full h-full grid grid-cols-8 grid-rows-8 gap-[1.5px] bg-[#1d120a] overflow-hidden">
              {board.map((row, r) => 
                row.map((piece, c) => {
                  const selected = isSquareSelected(r, c);
                  const highlighted = isSquareHighlighted(r, c);
                  const isLastMove = isLastMoveSquare(r, c);

                  return (
                    <div
                      key={`${r}-${c}`}
                      onClick={() => handleSquareClick(r, c)}
                      className={`relative flex items-center justify-center cursor-pointer transition-all duration-200 bg-[#e6cb9f] hover:bg-[#dfc295] ${
                        selected ? 'bg-[#cdaf82]/80 ring-4 ring-[#5c3a21] ring-inset' : ''
                      } ${
                        isLastMove ? 'after:absolute after:inset-0 after:border-2 after:border-[#5c3a21]/50' : ''
                      }`}
                    >
                      {/* Highlight indicator for legal moves */}
                      {highlighted && (
                        <div className="absolute z-10 w-4 h-4 rounded-full bg-emerald-500/70 shadow-[0_0_10px_rgba(16,185,129,0.8)] animate-pulse"></div>
                      )}

                      {/* Render chess piece */}
                      {piece && (
                        <div className={`w-[85%] h-[85%] z-20 transition-transform duration-300 ${
                          piece.color === turn ? 'hover:scale-105 active:scale-95' : ''
                        }`}>
                          <PieceIcon type={piece.type} color={piece.color} />
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
          
          {/* Coordinates Guide */}
          <div className="flex w-full max-w-[500px] justify-between px-6 text-xs text-amber-500/70 font-bold font-mono mt-2">
            <span>A</span><span>B</span><span>C</span><span>D</span><span>E</span><span>F</span><span>G</span><span>H</span>
          </div>
        </div>

        {/* Panel for Controls & Moves List (Right) */}
        <div className="lg:col-span-3 flex flex-col gap-4">
          
          {/* Controls Panel */}
          <div className="bg-slate-950/80 border border-amber-500/30 rounded-2xl p-5 shadow-2xl backdrop-blur-md">
            <h2 className="text-lg font-bold text-amber-400 border-b border-amber-500/20 pb-2 mb-4">Setup Controls</h2>
            
            <div className="space-y-4">
              {/* Opponent Selection Toggle */}
              <div>
                <label className="text-xs text-slate-400 block mb-1">Opponent Type</label>
                <div className="grid grid-cols-2 gap-2 bg-slate-900 p-1 rounded-xl border border-slate-800">
                  <button 
                    onClick={() => setVsAI(false)}
                    className={`py-1.5 text-xs font-bold rounded-lg transition-all ${
                      !vsAI ? 'bg-amber-400 text-slate-950' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    2 Players
                  </button>
                  <button 
                    onClick={() => setVsAI(true)}
                    className={`py-1.5 text-xs font-bold rounded-lg transition-all ${
                      vsAI ? 'bg-amber-400 text-slate-950' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    AI Opponent
                  </button>
                </div>
              </div>

              {/* AI Strength */}
              {vsAI && (
                <div>
                  <label className="text-xs text-slate-400 block mb-1">AI Difficulty</label>
                  <div className="grid grid-cols-2 gap-2 bg-slate-900 p-1 rounded-xl border border-slate-800">
                    <button 
                      onClick={() => setAiDifficulty('easy')}
                      className={`py-1.5 text-xs font-bold rounded-lg transition-all ${
                        aiDifficulty === 'easy' ? 'bg-amber-400 text-slate-950' : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      Local Engine
                    </button>
                    <button 
                      onClick={() => setAiDifficulty('engine')}
                      className={`py-1.5 text-xs font-bold rounded-lg transition-all ${
                        aiDifficulty === 'engine' ? 'bg-amber-400 text-slate-950' : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      Fairy-Stockfish
                    </button>
                  </div>
                </div>
              )}

              {/* Reset Game Action */}
              <button 
                onClick={resetGame}
                className="w-full bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-slate-950 font-bold py-2.5 px-4 rounded-xl text-sm transition-all duration-300 shadow-[0_0_15px_rgba(217,119,6,0.2)]"
              >
                Reset / New Game
              </button>
            </div>
          </div>

          {/* Move History Logger */}
          <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-5 shadow-2xl flex flex-col h-[230px] backdrop-blur-md">
            <h2 className="text-lg font-bold text-amber-400 border-b border-amber-500/20 pb-2 mb-2 flex justify-between items-center">
              <span>Moves History</span>
              <span className="text-xs font-mono text-slate-500">{history.length} moves</span>
            </h2>
            <div className="flex-1 overflow-y-auto pr-1 text-slate-300 text-xs font-mono space-y-1">
              {history.map((m, i) => {
                const turnNum = Math.floor(i / 2) + 1;
                const isWhite = i % 2 === 0;
                const pieceName = m.piece.type.replace('_', ' ').toUpperCase();
                
                return (
                  <div key={i} className={`p-1.5 rounded ${isWhite ? 'bg-slate-900/40' : 'bg-slate-800/20'}`}>
                    <span className="text-amber-500/70 mr-2">{turnNum}.</span>
                    <span className={isWhite ? 'text-amber-300' : 'text-slate-200'}>
                      {isWhite ? 'Gold' : 'Silver'} {pieceName}: {toAlgebraic(m.from)} → {toAlgebraic(m.to)}
                      {m.captured && <span className="text-red-400 ml-1">x {m.captured.type}</span>}
                    </span>
                  </div>
                );
              })}
              {history.length === 0 && (
                <div className="text-slate-500 text-center py-10 italic">No moves logged yet.</div>
              )}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
