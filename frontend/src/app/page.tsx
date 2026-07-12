'use client';

import React, { useState, useEffect } from 'react';
import {
  createInitialBoard,
  getLegalMoves,
  isKingInCheck,
  getHonorCountingLimit,
  countTotalPieces,
  countColorPieces,
  hasUnpromotedPawns,
  copyBoard,
  toAlgebraic,
  minimax,
  Board,
  Position,
  Move,
  CountingState,
  PieceColor,
  Piece,
  PieceType
} from '../rules/chessRules';
import { PieceIcon } from '../components/PieceIcon';

interface TutorialChapter {
  id: number;
  title: string;
  description: string;
  instructions: string | ((history: Move[]) => string);
  setup: () => Board;
  checkComplete: (board: Board, move: Move, history: Move[]) => boolean;
  checkMove?: (move: Move, history: Move[]) => boolean;
  guideMove?: (history: Move[]) => { from: Position; to: Position } | null;
}

export default function Home() {
  const [board, setBoard] = useState<Board>([]);
  const [turn, setTurn] = useState<PieceColor>('w');
  const [selectedPos, setSelectedPos] = useState<Position | null>(null);
  const [legalMoves, setLegalMoves] = useState<Position[]>([]);
  const [history, setHistory] = useState<Move[]>([]);
  const [winner, setWinner] = useState<PieceColor | 'draw' | null>(null);
  
  // Game modes & Coach
  const [vsAI, setVsAI] = useState<boolean>(true);
  const [aiDifficulty, setAiDifficulty] = useState<'easy' | 'engine'>('easy');
  const [isCalculatedByEngine, setIsCalculatedByEngine] = useState<boolean>(false);
  const [coachEnabled, setCoachEnabled] = useState<boolean>(false);
  const [coachSuggestion, setCoachSuggestion] = useState<{ from: Position; to: Position } | null>(null);
  const [coachTip, setCoachTip] = useState<string>('');

  // Tab systems
  const [activeTab, setActiveTab] = useState<'play' | 'academy'>('play');
  const [gameStarted, setGameStarted] = useState<boolean>(false);

  // Clock / Timer States
  const [timeLimit, setTimeLimit] = useState<number | null>(600); // 10 minutes default
  const [whiteTime, setWhiteTime] = useState<number>(600);
  const [blackTime, setBlackTime] = useState<number>(600);
  const [isTimerActive, setIsTimerActive] = useState<boolean>(false);
  const [isCustomTime, setIsCustomTime] = useState<boolean>(false);
  const [customMinutes, setCustomMinutes] = useState<string>('60');
  const [playerColor, setPlayerColor] = useState<PieceColor>('w');
  const [whoStarts, setWhoStarts] = useState<'player' | 'opponent'>('player');
  const [backendStatus, setBackendStatus] = useState<'checking' | 'connected' | 'offline'>('checking');
  const [engineActiveText, setEngineActiveText] = useState<string>('');
  const [showPlaySetup, setShowPlaySetup] = useState<boolean>(false);
  const [pieceTheme, setPieceTheme] = useState<'wood' | 'metallic'>('wood');

  // Tutorial Academy State
  const [currentChapterIndex, setCurrentChapterIndex] = useState<number>(0);
  const [academyActive, setAcademyActive] = useState<boolean>(false);
  const [chapterSuccess, setChapterSuccess] = useState<boolean>(false);
  const [positionHistory, setPositionHistory] = useState<string[]>([]);
  const [academySubTab, setAcademySubTab] = useState<'challenges' | 'strategies'>('challenges');
  const [activeGuidePiece, setActiveGuidePiece] = useState<PieceType | null>(null);
  const [lesson0Slide, setLesson0Slide] = useState<number>(0);
  const [lesson1Slide, setLesson1Slide] = useState<number>(0);

  // Endgame counting rule
  const [countingState, setCountingState] = useState<CountingState>({
    isActive: false,
    count: 0,
    limit: 64,
    reason: ''
  });

  // Vibration API
  const triggerHaptic = () => {
    if (typeof window !== 'undefined' && navigator.vibrate) {
      navigator.vibrate(20);
    }
  };

  // Setup challenge boards
  const tutorialChapters: TutorialChapter[] = [
    {
      id: 0,
      title: "១. ប្រវត្តិសាស្ត្រអុកចត្រង្គខ្មែរ (Game History)",
      description: "អុកចត្រង្គ ឬអុកខ្មែរ គឺជាល្បែងក្តារបុរាណរបស់ខ្មែរដែលមានប្រភពតាំងពីសតវត្សទី១១ មុនសម័យអង្គរ ដែលមានភស្តុតាងចម្លាក់នៅលើជញ្ជាំងប្រាសាទអង្គរវត្ត។ វាមានទំនាក់ទំនងជិតស្និទ្ធនឹងល្បែងអុកម៉ាក្រុក (Makruk) របស់ថៃ។ ល្បែងនេះតំណាងឱ្យយុទ្ធសាស្ត្រទ័ពបុរាណ រួមមាន ស្តេច សេះ ទូក គោល នាង និងត្រី។",
      instructions: "សូមអានប្រវត្តិសាស្ត្រអុកចត្រង្គខ្មែរនៅក្នុងផ្ទាំងណែនាំខាងស្តាំ រួចធ្វើការផ្លាស់ទីកូនអុកណាមួយនៅលើក្តារ ១ដង ដើម្បីបញ្ចប់មេរៀននេះ។",
      setup: () => {
        return createInitialBoard();
      },
      checkComplete: (currentBoard, move, history) => {
        return history.length >= 1;
      },
      guideMove: () => null
    },
    {
      id: 1,
      title: "២. របៀបដើរ និងការលោតពិសេសរបស់កូនអុក (How to Move Pieces)",
      description: "ស្វែងយល់អំពីក្តារអុក និងទីតាំងដំបូង៖\n• កូអរដោនេក្តារ៖ ជួរឈរមានអក្សរ A ដល់ H (ឆ្វេងទៅស្តាំ) និងជួរដេកមានលេខ ១ ដល់ ៨ (ក្រោមទៅលើ)។ រាល់ក្រឡាអុកនីមួយៗហៅតាមអក្សរជួរឈររួមជាមួយលេខជួរដេក (ឧទាហរណ៍៖ e3, d1)។\n• ទីតាំងកូនត្រី (Pawn)៖ ចាប់ផ្តើមនៅជួរដេកទី៣ (a3 ដល់ h3) មិនមែនជួរទី២ ដូចអុកអន្តរជាតិឡើយ។\n• ទីតាំងជួរក្រោយបង្អស់ (ជួរដេកទី១)៖ ទូក (a1, h1), សេះ (b1, g1), គោល (c1, f1), ស្តេច (d1) និងនាង (e1)។\n*ចំណាំ៖ នាង (Queen) ស្ថិតនៅខាងស្តាំស្តេច (King) ជានិច្ច តាមទិសដៅរបស់អ្នកលេង។",
      instructions: (history: Move[]) => {
        if (history.length === 0) return "សូមចុចលើកូនអុកណាមួយនៅលើក្តារ ដើម្បីសាកល្បងដើរ។ សាកល្បងដើរយ៉ាងហោចណាស់ ៣ដង ដើម្បីបញ្ចប់មេរៀន។";
        if (history.length < 3) return `អ្នកបានសាកល្បងដើរ ${history.length}/3 ជំហានហើយ។ បន្តសាកល្បងដើម្បីយល់ពីរបៀបដើររបស់កូនអុកនីមួយៗ!`;
        return "អបអរសាទរ! បងបានសាកល្បងគ្រប់គ្រាន់ហើយ! ចុច 'មេរៀនបន្ទាប់' ដើម្បីបញ្ចប់ការសិក្សា! 🏆";
      },
      setup: () => {
        return createInitialBoard();
      },
      checkComplete: (currentBoard, move, history) => {
        return history.length >= 3;
      },
      guideMove: () => null
    }
  ];

  // Initialize board
  useEffect(() => {
    resetGame();
  }, []);

  // Check backend health status on mount
  useEffect(() => {
    const checkBackend = async () => {
      const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || 'https://ouk-chatrang-backend-56450014005.us-central1.run.app';
      try {
        const response = await fetch(`${apiBaseUrl}/api/health`);
        if (response.ok) {
          const data = await response.json();
          if (data.status === 'healthy') {
            setBackendStatus('connected');
            return;
          }
        }
      } catch (err) {
        console.error('Error checking backend status:', err);
      }
      setBackendStatus('offline');
    };
    checkBackend();
  }, []);

  // Timer Tick Loop
  useEffect(() => {
    if (!isTimerActive || winner || academyActive || timeLimit === null) return;

    const interval = setInterval(() => {
      if (turn === 'w') {
        setWhiteTime((prev) => {
          if (prev <= 1) {
            clearInterval(interval);
            setWinner('b'); // Black wins on time
            setIsTimerActive(false);
            return 0;
          }
          return prev - 1;
        });
      } else {
        setBlackTime((prev) => {
          if (prev <= 1) {
            clearInterval(interval);
            setWinner('w'); // White wins on time
            setIsTimerActive(false);
            return 0;
          }
          return prev - 1;
        });
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [isTimerActive, winner, turn, academyActive, timeLimit]);

  // Handle timeLimit configuration updates
  useEffect(() => {
    if (timeLimit !== null) {
      setWhiteTime(timeLimit);
      setBlackTime(timeLimit);
    }
  }, [timeLimit]);

  const resetGame = () => {
    setBoard(createInitialBoard());
    setTurn(vsAI ? (whoStarts === 'player' ? playerColor : (playerColor === 'w' ? 'b' : 'w')) : 'w');
    setSelectedPos(null);
    setLegalMoves([]);
    setHistory([]);
    setWinner(null);
    setIsCalculatedByEngine(false);
    setAcademyActive(false);
    setChapterSuccess(false);
    setPositionHistory([]);
    setCountingState({
      isActive: false,
      count: 0,
      limit: 64,
      reason: ''
    });
    
    // Reset clocks
    if (timeLimit !== null) {
      setWhiteTime(timeLimit);
      setBlackTime(timeLimit);
      setIsTimerActive(true);
    } else {
      setIsTimerActive(false);
    }
  };

  const startAcademyChapter = (index: number) => {
    setCurrentChapterIndex(index);
    setBoard(tutorialChapters[index].setup());
    setTurn('w');
    setSelectedPos(null);
    setLegalMoves([]);
    setHistory([]);
    setWinner(null);
    setAcademyActive(true);
    setChapterSuccess(false);
    setPositionHistory([]);
  };

  // Run AI Coaching Tip generator
  useEffect(() => {
    if (coachEnabled && !winner && board.length > 0 && !academyActive) {
      if (vsAI && turn !== playerColor) {
        setCoachTip("🤖 គូប្រកួត AI កំពុងគិត... រង់ចាំវេនរបស់អ្នក ដើម្បីទទួលបានការណែនាំ។");
        setCoachSuggestion(null);
      } else {
        const { tip, suggestion } = getCoachTip(board, history);
        setCoachTip(tip);
        setCoachSuggestion(suggestion);
      }
    } else {
      setCoachTip('');
      setCoachSuggestion(null);
    }
  }, [board, turn, coachEnabled, winner, academyActive, playerColor, vsAI]);

  // AI Move triggers
  useEffect(() => {
    if (vsAI && turn !== playerColor && !winner && !academyActive) {
      const timer = setTimeout(() => {
        makeAIMove();
      }, 600);
      return () => clearTimeout(timer);
    }
  }, [turn, vsAI, winner, academyActive, playerColor]);

  const getCoachTip = (currentBoard: Board, currentHistory: Move[]): { tip: string; suggestion: { from: Position; to: Position } | null } => {
    const search = minimax(currentBoard, 3, -Infinity, Infinity, turn === 'w', currentHistory);
    const bestMove = search.move;
    if (!bestMove) {
      return { tip: "មិនមានកូនអុកអាចដើរបានទេ (អុកងាប់ ឬស្មើ)!", suggestion: null };
    }

    const piece = currentBoard[bestMove.from.row][bestMove.from.col];
    const target = currentBoard[bestMove.to.row][bestMove.to.col];
    const fromName = toAlgebraic(bestMove.from);
    const toName = toAlgebraic(bestMove.to);

    if (!piece) return { tip: "វិភាគក្តារអុកដើម្បីស្វែងរកទិសដៅដើរបន្ទាប់។", suggestion: null };

    const pieceNamesKhmer: Record<string, string> = {
      sdaach: 'ស្តេច',
      neang: 'នាង',
      koul: 'គោល',
      sesh: 'សេះ',
      touk: 'ទូក',
      trey: 'ត្រី',
      trey_kaet: 'ត្រីកើត'
    };

    const pName = pieceNamesKhmer[piece.type] || piece.type;
    let explanation = `ដើរ ${pName} របស់អ្នកពី ${fromName} ទៅ ${toName}។ `;

    if (target) {
      const targetName = pieceNamesKhmer[target.type] || target.type;
      const targetColorKh = target.color === 'w' ? 'ស' : 'ខ្មៅ';
      explanation = `⚔️ **ឱកាសស៊ីកូនអុក:** ស៊ី ${targetName} ពណ៌${targetColorKh} នៅត្រង់ការ៉ូ **${toName}** ដោយប្រើ ${pName} របស់អ្នកពី ${fromName} ដើម្បីយកចំណេញកម្លាំងវាយប្រហារ!`;
    } else if (piece.type === 'trey' && bestMove.to.row === 2) {
      explanation = `⭐ **ការឡើងបុណ្យត្រី:** រុញកូនត្រីទៅកាន់ការ៉ូ **${toName}**! ការឡើងបុណ្យវាទៅជានាង (ត្រីកើត) នឹងបង្កើនឥទ្ធិពលវាយប្រហារតាមអង្កត់ទ្រូងយ៉ាងខ្លាំង។`;
    } else if (piece.type === 'sdaach' && !piece.hasMoved && Math.abs(bestMove.to.row - bestMove.from.row) > 1) {
      explanation = `👑 **ការលោតពិសេសរបស់ស្តេច:** លោតស្តេចរបស់អ្នកដូចសេះទៅកាន់ **${toName}** ដើម្បីគេចចេញពីការគំរាមកំហែង និងអភិវឌ្ឍប្រព័ន្ធការពារឱ្យបានលឿន។`;
    } else if (piece.type === 'neang' && !piece.hasMoved && Math.abs(bestMove.to.row - bestMove.from.row) === 2) {
      explanation = `👸 **ការលោតពិសេសរបស់នាង:** លោតនាងទៅមុខ ២ការ៉ូទៅកាន់ **${toName}** ដើម្បីគ្រប់គ្រងកណ្តាលក្តារតាំងពីដំបូងទី។`;
    } else if (piece.type === 'sdaach' && isKingInCheck(currentBoard, turn)) {
      explanation = `⚠️ **ការពារស្តេច:** ស្តេចរបស់អ្នកកំពុងរងការអុក! គេចទៅកាន់ **${toName}** ជាបន្ទាន់ដើម្បីការពារសុវត្ថិភាព។`;
    } else {
      const centerSquares = ['d4', 'd5', 'e4', 'e5', 'd3', 'e3', 'd6', 'e6'];
      if (centerSquares.includes(toName)) {
        explanation = `🛡️ **គ្រប់គ្រងកណ្តាលក្តារ:** ដាក់ ${pName} របស់អ្នកនៅលើ **${toName}** ដើម្បីគ្រប់គ្រងផ្ទៃកណ្តាលក្តារ ដែលធ្វើឱ្យគូប្រកួតពិបាករៀបចំការវាយប្រហារ។`;
      } else {
        explanation = `♟️ **ការអភិវឌ្ឍកូនអុក:** បង្កើនសកម្មភាព ${pName} របស់អ្នកទៅកាន់ **${toName}** ដើម្បីសហការកម្លាំង និងត្រៀមលក្ខណៈវាយសម្រុក។`;
      }
    }

    return { tip: explanation, suggestion: bestMove };
  };

  const makeAIMove = async () => {
    if (aiDifficulty === 'engine') {
      setIsCalculatedByEngine(true);
      setEngineActiveText('Fairy-Stockfish ម៉ាស៊ីនកំពុងគិត... (Thinking...)');
      
      // Set a timer to detect cold starts after 3.5 seconds
      const coldStartTimer = setTimeout(() => {
        setEngineActiveText('ម៉ាស៊ីនកំពុងដំណើរការឡើងវិញ (Server Cold Start...) សូមរង់ចាំ ១០-២០វិនាទី');
      }, 3500);

      try {
        const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || 'https://ouk-chatrang-backend-56450014005.us-central1.run.app';
        const response = await fetch(`${apiBaseUrl}/api/move`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ board, turn, history })
        });
        clearTimeout(coldStartTimer);
        if (response.ok) {
          const data = await response.json();
          if (data.move) {
            executeMove(data.move.from, data.move.to);
            setIsCalculatedByEngine(false);
            setEngineActiveText('');
            return;
          }
        }
      } catch (err) {
        console.error('Engine error, falling back to local heuristic:', err);
        clearTimeout(coldStartTimer);
      }
      
      // If backend failed or timed out, display message and fall back to local minimax
      setEngineActiveText('ម៉ាស៊ីនគណនាជួបបញ្ហា! កំពុងប្តូរទៅប្រើម៉ាស៊ីនមូលដ្ឋាន (Fallback to Local)...');
      await new Promise(resolve => setTimeout(resolve, 1500));
      setIsCalculatedByEngine(false);
      setEngineActiveText('');
    }

    // Minimax search with Alpha-Beta pruning for AI opponent
    const result = minimax(board, 3, -Infinity, Infinity, turn === 'w', history);
    if (result.move) {
      executeMove(result.move.from, result.move.to);
    } else {
      if (isKingInCheck(board, turn)) {
        setWinner(turn === 'w' ? 'b' : 'w');
      } else {
        setWinner('draw');
      }
    }
  };

  const handleSquareClick = (row: number, col: number) => {
    if (winner || (vsAI && turn !== playerColor && !academyActive) || chapterSuccess) return;

    const clickedPiece = board[row][col];

    // Automatically show details of clicked piece in Lesson Mode
    if (clickedPiece && academyActive) {
      setActiveGuidePiece(clickedPiece.type);
    }

    if (selectedPos) {
      const isLegal = legalMoves.some(m => m.row === row && m.col === col);
      if (isLegal) {
        executeMove(selectedPos, { row, col });
        setSelectedPos(null);
        setLegalMoves([]);
      } else if (clickedPiece && clickedPiece.color === turn) {
        setSelectedPos({ row, col });
        setLegalMoves(getLegalMoves(board, { row, col }, history));
        triggerHaptic();
      } else {
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

    // Check promotions (Trey Kaet at row 2 for white, row 5 for black)
    let isPromotion = false;
    let finalPiece = { ...piece, hasMoved: true };

    if (piece.type === 'trey') {
      const promotionRank = piece.color === 'w' ? 2 : 5;
      if (to.row === promotionRank) {
        finalPiece.type = 'trey_kaet';
        isPromotion = true;
      }
    }

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
    setBoard(activeBoard);

    // If academy mode is active, verify success of the challenge move
    if (academyActive) {
      const chapter = tutorialChapters[currentChapterIndex];
      const isCorrect = chapter.checkMove 
        ? chapter.checkMove(moveObj, newHistory) 
        : chapter.checkComplete(activeBoard, moveObj, newHistory);
      
      if (isCorrect) {
        const isFinished = chapter.checkComplete(activeBoard, moveObj, newHistory);
        if (isFinished) {
          setChapterSuccess(true);
          triggerHaptic();
        }
      } else {
        // Failed move in academy: reset the board to retry
        setTimeout(() => {
          setBoard(chapter.setup());
          setHistory([]);
          setSelectedPos(null);
          setLegalMoves([]);
        }, 1000);
      }
      return;
    }

    const nextTurn = turn === 'w' ? 'b' : 'w';

    // Threefold repetition signature check
    const getBoardSignature = (b: Board, t: PieceColor): string => {
      let sig = '';
      for (let r = 0; r < 8; r++) {
        for (let c = 0; c < 8; c++) {
          const p = b[r][c];
          if (p) sig += `${r}${c}${p.color}${p.type}`;
        }
      }
      return `${sig}-${t}`;
    };

    const signature = getBoardSignature(activeBoard, nextTurn);
    const nextPositionHistory = [...positionHistory, signature];
    setPositionHistory(nextPositionHistory);

    const occurrences = nextPositionHistory.filter(sig => sig === signature).length;
    if (occurrences >= 3) {
      setWinner('draw');
    }

    // Piece's Honor Counting
    const nextBoardHasUnpromoted = hasUnpromotedPawns(activeBoard);
    let nextCounting = { ...countingState };

    if (!nextBoardHasUnpromoted) {
      const isDefendingCritically = countColorPieces(activeBoard, nextTurn) <= 3;
      
      if (!countingState.isActive) {
        // Initialize counting
        const startCount = isDefendingCritically ? (countTotalPieces(activeBoard) + 1) : 1;
        const { limit, reason } = isDefendingCritically 
          ? getHonorCountingLimit(activeBoard, nextTurn)
          : { limit: 64, reason: 'No unpromoted pawns on board' };
          
        nextCounting = {
          isActive: true,
          count: startCount,
          limit,
          reason
        };
      } else {
        // Increment counting
        const nextCount = countingState.count + 1;
        
        // If defending side falls to 3 or fewer pieces, transition to the Board Count
        let currentLimit = countingState.limit;
        let currentReason = countingState.reason;
        let currentCount = nextCount;
        
        if (isDefendingCritically && countingState.limit === 64) {
          // Defending side just fell to 3 or fewer pieces. Transition to board count.
          const { limit, reason } = getHonorCountingLimit(activeBoard, nextTurn);
          currentLimit = limit;
          currentReason = reason;
          currentCount = countTotalPieces(activeBoard) + 1;
        }
        
        if (currentCount > currentLimit) {
          setWinner('draw');
        }
        
        nextCounting.count = currentCount;
        nextCounting.limit = currentLimit;
        nextCounting.reason = currentReason;
      }
    } else {
      nextCounting = {
        isActive: false,
        count: 0,
        limit: 64,
        reason: ''
      };
    }
    setCountingState(nextCounting);

    // Checkmate check
    const hasNextLegalMoves = hasAnyLegalMoves(activeBoard, nextTurn, newHistory);
    const checkState = isKingInCheck(activeBoard, nextTurn);

    if (!hasNextLegalMoves) {
      if (checkState) {
        setWinner(turn);
      } else {
        setWinner('draw');
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

  const isSquareSelected = (r: number, c: number) => selectedPos?.row === r && selectedPos?.col === c;
  const isSquareHighlighted = (r: number, c: number) => legalMoves.some(m => m.row === r && m.col === c);
  const isSquareCoachSuggested = (r: number, c: number) => {
    if (!coachEnabled || !coachSuggestion) return false;
    return (coachSuggestion.from.row === r && coachSuggestion.from.col === c) ||
           (coachSuggestion.to.row === r && coachSuggestion.to.col === c);
  };

  const isLastMoveSquare = (r: number, c: number) => {
    if (history.length === 0) return false;
    const last = history[history.length - 1];
    return (last.from.row === r && last.from.col === c) || (last.to.row === r && last.to.col === c);
  };

  const getAcademyGuideMove = (): { from: Position; to: Position } | null => {
    if (!academyActive) return null;
    const chapter = tutorialChapters[currentChapterIndex];
    if (chapter.guideMove) {
      return chapter.guideMove(history);
    }
    return null;
  };

  const academyGuide = getAcademyGuideMove();

  const isSquareAcademyGuidedFrom = (r: number, c: number) => {
    return academyGuide && academyGuide.from.row === r && academyGuide.from.col === c;
  };

  const isSquareAcademyGuidedTo = (r: number, c: number) => {
    return academyGuide && academyGuide.to.row === r && academyGuide.to.col === c;
  };

  const formatTime = (seconds: number): string => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className={`min-h-screen text-white ${gameStarted ? 'p-2 md:p-4' : 'p-4 md:p-8'} flex flex-col items-center justify-center transition-all duration-500 bg-radial ${
      activeTab === 'academy' 
        ? 'from-emerald-950 via-zinc-950 to-black' 
        : 'from-slate-900 via-zinc-950 to-black'
    }`}>
      {!gameStarted ? (
        /* STUNNING MAIN LANDING MENU */
        <div className="w-full max-w-lg bg-slate-950/85 border border-amber-500/30 rounded-3xl p-8 shadow-2xl backdrop-blur-md flex flex-col items-center space-y-6 select-none text-center my-auto">
          <div className="space-y-2">
            <h1 className="text-4xl md:text-5xl font-black tracking-wider bg-gradient-to-r from-amber-400 via-yellow-200 to-amber-500 bg-clip-text text-transparent drop-shadow-md">
              អុកចត្រង្គ
            </h1>
            <p className="text-xs font-semibold tracking-widest text-amber-500/80 uppercase">
              OUK CHATRANG • CAMBODIAN CHESS
            </p>
          </div>

          {!showPlaySetup ? (
            /* STEP 1: CHOOSE PLAY OR LEARN */
            <>
              <div className="w-full space-y-4 py-4">
                <button
                  onClick={() => {
                    setShowPlaySetup(true);
                  }}
                  className="w-full bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-slate-950 font-black py-4 px-6 rounded-2xl text-base transition-all duration-300 shadow-[0_0_20px_rgba(217,119,6,0.3)] hover:scale-[1.02] cursor-pointer"
                >
                  🎮 PLAY MATCH
                </button>

                <button
                  onClick={() => {
                    setActiveTab('academy');
                    setGameStarted(true);
                  }}
                  className="w-full bg-slate-900 hover:bg-slate-800 text-amber-400 hover:text-amber-300 font-bold py-4 px-6 rounded-2xl text-base transition-all duration-300 border border-amber-500/30 hover:border-amber-400/50 hover:scale-[1.02] cursor-pointer"
                >
                  🎓 CHESS ACADEMY (LEARN)
                </button>
              </div>

              <div className="text-[10px] text-slate-500 font-sans max-w-xs leading-relaxed">
                Learn the rules, practice specific chess patterns, or play against a smart local AI engine.
              </div>
            </>
          ) : (
            /* STEP 2: SHOW MATCH CONFIGURATION OPTIONS */
            <>
              {/* Quick Settings Section */}
              <div className="w-full bg-slate-900/60 border border-slate-800 rounded-2xl p-4 space-y-4 text-left">
                <div className="flex justify-between items-center border-b border-slate-800 pb-1.5">
                  <h2 className="text-xs font-bold text-amber-400 uppercase tracking-wider">
                    Match Settings
                  </h2>
                  {/* Connection Status Badge */}
                  <div className="flex items-center gap-1.5 text-[9px] font-bold select-none">
                    {backendStatus === 'checking' && (
                      <>
                        <span className="h-1.5 w-1.5 rounded-full bg-yellow-500 animate-ping"></span>
                        <span className="text-yellow-500">Checking AI...</span>
                      </>
                    )}
                    {backendStatus === 'connected' && (
                      <>
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500"></span>
                        <span className="text-emerald-400">AI Online</span>
                      </>
                    )}
                    {backendStatus === 'offline' && (
                      <>
                        <span className="h-1.5 w-1.5 rounded-full bg-red-500"></span>
                        <span className="text-red-400">AI Offline (Local Mode)</span>
                      </>
                    )}
                  </div>
                </div>

                 {/* Opponent Selection & AI Difficulty Toggles */}
                 <div className="grid grid-cols-2 gap-3">
                   <div className="space-y-1">
                     <label className="text-[10px] text-slate-400 font-bold block uppercase tracking-wider">Opponent Type</label>
                     <div className="grid grid-cols-2 gap-1.5 bg-slate-950 p-0.5 rounded-lg border border-slate-800">
                        <button 
                         onClick={() => setVsAI(false)}
                         className={`py-1 text-[10px] font-bold rounded-md transition-all cursor-pointer ${
                           !vsAI ? 'bg-amber-400 text-slate-950 shadow-md shadow-amber-500/10' : 'bg-slate-900/60 text-slate-300 hover:bg-slate-800 hover:text-white'
                         }`}
                       >
                         Local
                       </button>
                       <button 
                         onClick={() => setVsAI(true)}
                         className={`py-1 text-[10px] font-bold rounded-md transition-all cursor-pointer ${
                           vsAI ? 'bg-amber-400 text-slate-950 shadow-md shadow-amber-500/10' : 'bg-slate-900/60 text-slate-300 hover:bg-slate-800 hover:text-white'
                         }`}
                       >
                         AI
                       </button>
                     </div>
                   </div>

                   {vsAI ? (
                     <div className="space-y-1">
                       <label className="text-[10px] text-slate-400 font-bold block uppercase tracking-wider">AI Difficulty</label>
                       <div className="grid grid-cols-2 gap-1.5 bg-slate-950 p-0.5 rounded-lg border border-slate-800">
                         <button 
                           onClick={() => setAiDifficulty('easy')}
                           className={`py-1 text-[10px] font-bold rounded-md transition-all cursor-pointer ${
                             aiDifficulty === 'easy' ? 'bg-amber-400 text-slate-950 shadow-md shadow-amber-500/10' : 'bg-slate-900/60 text-slate-300 hover:bg-slate-800 hover:text-white'
                           }`}
                         >
                           Easy
                         </button>
                         <button 
                           onClick={() => setAiDifficulty('engine')}
                           className={`py-1 text-[10px] font-bold rounded-md transition-all cursor-pointer ${
                             aiDifficulty === 'engine' ? 'bg-amber-400 text-slate-950 shadow-md shadow-amber-500/10' : 'bg-slate-900/60 text-slate-300 hover:bg-slate-800 hover:text-white'
                           }`}
                         >
                           Stockfish
                         </button>
                       </div>
                     </div>
                   ) : (
                     <div className="space-y-1 opacity-45">
                       <label className="text-[10px] text-slate-500 font-bold block uppercase tracking-wider">AI Difficulty</label>
                       <div className="grid grid-cols-1 bg-slate-950/40 p-0.5 rounded-lg border border-slate-900 text-center py-1.5 text-[10px] text-slate-600 font-bold select-none">
                         Disabled
                       </div>
                     </div>
                   )}
                 </div>

                {/* Choose Side Color & Starting Move Toggles */}
                {vsAI && (
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[10px] text-slate-400 font-bold block uppercase tracking-wider">Your Side</label>
                      <div className="grid grid-cols-2 gap-1.5 bg-slate-950 p-0.5 rounded-lg border border-slate-800">
                        <button 
                          onClick={() => setPlayerColor('w')}
                          className={`py-1.5 text-xs font-bold rounded-md transition-all cursor-pointer ${
                            playerColor === 'w' ? 'bg-amber-400 text-slate-950 shadow-md shadow-amber-500/10' : 'bg-slate-900/60 text-slate-300 hover:bg-slate-800 hover:text-white'
                          }`}
                        >
                          White
                        </button>
                        <button 
                          onClick={() => setPlayerColor('b')}
                          className={`py-1.5 text-xs font-bold rounded-md transition-all cursor-pointer ${
                            playerColor === 'b' ? 'bg-amber-400 text-slate-950 shadow-md shadow-amber-500/10' : 'bg-slate-900/60 text-slate-300 hover:bg-slate-800 hover:text-white'
                          }`}
                        >
                          Black
                        </button>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] text-slate-400 font-bold block uppercase tracking-wider">Play First</label>
                      <div className="grid grid-cols-2 gap-1.5 bg-slate-950 p-0.5 rounded-lg border border-slate-800">
                        <button 
                          onClick={() => setWhoStarts('player')}
                          className={`py-1.5 text-xs font-bold rounded-md transition-all cursor-pointer ${
                            whoStarts === 'player' ? 'bg-amber-400 text-slate-950 shadow-md shadow-amber-500/10' : 'bg-slate-900/60 text-slate-300 hover:bg-slate-800 hover:text-white'
                          }`}
                        >
                          Yes
                        </button>
                        <button 
                          onClick={() => setWhoStarts('opponent')}
                          className={`py-1.5 text-xs font-bold rounded-md transition-all cursor-pointer ${
                            whoStarts === 'opponent' ? 'bg-amber-400 text-slate-950 shadow-md shadow-amber-500/10' : 'bg-slate-900/60 text-slate-300 hover:bg-slate-800 hover:text-white'
                          }`}
                        >
                          No
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Time Control Options */}
                <div className="space-y-1.5">
                  <label className="text-[10px] text-slate-400 font-bold block uppercase tracking-wider">Time Control</label>
                  <div className="grid grid-cols-6 gap-1 bg-slate-950 p-0.5 rounded-lg border border-slate-800">
                    {[
                      { label: '5m', value: 300, isCustom: false },
                      { label: '10m', value: 600, isCustom: false },
                      { label: '30m', value: 1800, isCustom: false },
                      { label: '60m', value: 3600, isCustom: false },
                      { label: '∞', value: null, isCustom: false },
                      { label: 'Custom', value: -1, isCustom: true }
                    ].map((t) => (
                      <button
                        key={t.label}
                        onClick={() => {
                          if (t.isCustom) {
                            setIsCustomTime(true);
                            const mins = parseInt(customMinutes, 10);
                            setTimeLimit(isNaN(mins) ? 60 : mins * 60);
                          } else {
                            setIsCustomTime(false);
                            setTimeLimit(t.value);
                          }
                        }}
                        className={`py-1 text-[10px] font-bold rounded-md transition-all cursor-pointer ${
                          (t.isCustom && isCustomTime) || (!t.isCustom && !isCustomTime && timeLimit === t.value)
                            ? 'bg-amber-400 text-slate-950 shadow-md shadow-amber-500/10'
                            : 'bg-slate-900/60 text-slate-300 hover:bg-slate-800 hover:text-white'
                        }`}
                      >
                        {t.label}
                      </button>
                    ))}
                  </div>

                  {/* Custom Time Input Field */}
                  {isCustomTime && (
                    <div className="flex items-center gap-2 mt-2 bg-slate-950/60 p-2 rounded-xl border border-slate-800">
                      <span className="text-[10px] text-slate-400 uppercase font-black tracking-widest pl-1">Minutes:</span>
                      <input
                        type="number"
                        min="1"
                        max="1440"
                        value={customMinutes}
                        onChange={(e) => {
                          const val = e.target.value;
                          setCustomMinutes(val);
                          const mins = parseInt(val, 10);
                          if (!isNaN(mins) && mins > 0) {
                            setTimeLimit(mins * 60);
                          }
                        }}
                        className="flex-1 bg-slate-900 border border-slate-800 text-amber-300 font-mono font-bold text-xs py-1 px-2.5 rounded-lg focus:outline-none focus:border-amber-400 transition-colors"
                      />
                    </div>
                  )}
                </div>

                {/* Chess Style / Piece Theme Selector */}
                <div className="space-y-1">
                  <label className="text-[10px] text-slate-400 font-bold block uppercase tracking-wider">Chess Pieces Style</label>
                  <div className="grid grid-cols-2 gap-1.5 bg-slate-950 p-0.5 rounded-lg border border-slate-800">
                    <button 
                      onClick={() => setPieceTheme('wood')}
                      className={`py-1 text-[10px] font-bold rounded-md transition-all cursor-pointer ${
                        pieceTheme === 'wood' ? 'bg-amber-400 text-slate-950 shadow-md shadow-amber-500/10' : 'bg-slate-900/60 text-slate-300 hover:bg-slate-800 hover:text-white'
                      }`}
                    >
                      Wood (ឈើ)
                    </button>
                    <button 
                      onClick={() => setPieceTheme('metallic')}
                      className={`py-1 text-[10px] font-bold rounded-md transition-all cursor-pointer ${
                        pieceTheme === 'metallic' ? 'bg-amber-400 text-slate-950 shadow-md shadow-amber-500/10' : 'bg-slate-900/60 text-slate-300 hover:bg-slate-800 hover:text-white'
                      }`}
                    >
                      Metallic (លោហៈ)
                    </button>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3 w-full pt-1.5">
                <button
                  onClick={() => {
                    setShowPlaySetup(false);
                  }}
                  className="col-span-1 bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white font-bold py-2.5 px-3 rounded-xl text-xs transition-all duration-300 border border-slate-800/80 hover:scale-[1.01] cursor-pointer"
                >
                  ⬅️ Back
                </button>
                <button
                  onClick={() => {
                    setActiveTab('play');
                    setGameStarted(true);
                    setAcademyActive(false);
                    resetGame();
                  }}
                  className="col-span-2 bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-slate-950 font-black py-2.5 px-4 rounded-xl text-xs transition-all duration-300 shadow-[0_0_15px_rgba(217,119,6,0.25)] hover:scale-[1.01] cursor-pointer"
                >
                  🎮 START PLAY
                </button>
              </div>
            </>
          )}
        </div>
      ) : (
        /* Main Content Area */
        activeTab === 'academy' && !academyActive ? (
        /* WIDE-SCREEN ACADEMY MENU (DASHBOARD) */
        <div className="w-full max-w-5xl bg-slate-950/80 border border-emerald-500/30 rounded-3xl p-6 md:p-8 shadow-2xl backdrop-blur-md flex flex-col space-y-6 mt-4">
          {/* Academy Header */}
          <div className="border-b border-emerald-500/20 pb-5 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h2 className="text-2xl md:text-3xl font-black text-amber-400">សាលាបណ្តុះបណ្តាលអុកចត្រង្គ 🎓</h2>
              <p className="text-xs md:text-sm text-slate-400 mt-1">រៀនពីច្បាប់ របៀបលេង និងយុទ្ធសាស្ត្រឈ្នះអុកខ្មែរពីកម្រិតដំបូងដល់អាជីព</p>
            </div>
            <button 
              onClick={() => { setActiveTab('play'); resetGame(); }}
              className="bg-amber-400 hover:bg-amber-300 text-slate-950 px-6 py-2.5 rounded-xl font-bold text-sm tracking-wider transition-all shadow-[0_0_15px_rgba(251,191,36,0.3)] self-start md:self-auto"
            >
              🎮 ចូលទៅលេងក្តារអុក (Play Match Mode)
            </button>
          </div>

          {/* Sub-tab selection */}
          <div className="flex gap-2 p-1 bg-slate-900 rounded-xl border border-slate-800 w-full sm:w-[400px]">
            <button 
              onClick={() => setAcademySubTab('challenges')}
              className={`flex-1 py-2 text-xs font-black rounded-lg transition-all ${
                academySubTab === 'challenges' ? 'bg-amber-400 text-slate-950 shadow-md' : 'text-slate-400 hover:text-white'
              }`}
            >
              ⚔️ របៀបដើរអនុវត្ត (Tutorials)
            </button>
            <button 
              onClick={() => setAcademySubTab('strategies')}
              className={`flex-1 py-2 text-xs font-black rounded-lg transition-all ${
                academySubTab === 'strategies' ? 'bg-amber-400 text-slate-950 shadow-md' : 'text-slate-400 hover:text-white'
              }`}
            >
              📚 ក្បួនយុទ្ធសាស្ត្រល្បីៗ (Setups)
            </button>
          </div>

          {/* Sub-tab Content Panels */}
          {academySubTab === 'challenges' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {tutorialChapters.map((chapter, index) => (
                <div 
                  key={chapter.id} 
                  onClick={() => startAcademyChapter(index)}
                  className="p-5 rounded-2xl border border-slate-800 bg-slate-900/30 hover:bg-slate-900/80 hover:border-emerald-500/40 cursor-pointer transition-all duration-305 group flex flex-col justify-between space-y-4"
                >
                  <div>
                    <div className="flex justify-between items-start">
                      <h3 className="text-base font-black text-amber-400 group-hover:text-yellow-300 transition-colors">{chapter.title}</h3>
                      <span className="text-[10px] bg-slate-800 text-slate-400 px-2 py-0.5 rounded font-mono">មេរៀនទី {index + 1}</span>
                    </div>
                    <p className="text-xs text-slate-300 mt-2 leading-relaxed font-sans">{chapter.description}</p>
                  </div>
                  <button className="bg-emerald-500/10 text-emerald-400 group-hover:bg-emerald-500 group-hover:text-slate-950 transition-all font-bold text-xs py-2 px-4 rounded-xl self-start flex items-center gap-1">
                    ចាប់ផ្តើមអនុវត្ត (Start Lesson) ➔
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Strategy Cards */}
              <div className="p-5 rounded-2xl border border-slate-800 bg-slate-900/30 space-y-3">
                <h3 className="text-base font-black text-amber-400">១. ក្បួនស្នែង ឬរបាំងស្នែង (Horn Defense)</h3>
                <p className="text-xs text-slate-300 leading-relaxed font-sans">
                  រុញត្រីនៅ c3 និង f3 ឡើង រួចអភិវឌ្ឍសេះទាំងពីរទៅកាន់ c3 និង f3 ដើម្បីគ្រប់គ្រងកណ្តាលក្តារ និងបង្កើតខែលការពារស្តេច។
                </p>
                <div className="text-xs text-emerald-300/90 font-mono bg-slate-950/80 p-3.5 rounded-xl border border-emerald-500/20 leading-relaxed space-y-1">
                  <strong className="text-amber-400 block border-b border-emerald-500/20 pb-1 mb-1">🐾 របៀបដើរ (៨ ជំហាន):</strong>
                  ១. រុញត្រី d3 ➔ d4 (បើកផ្លូវនាង)<br />
                  ២. រុញត្រី c3 ➔ c4 (បើកផ្លូវសេះឆ្វេង)<br />
                  ៣. ឡើងសេះ b1 ➔ c3<br />
                  ៤. ឡើងនាង d1 ➔ d3 (លោត ២ការ៉ូ)<br />
                  ៥. រុញត្រី f3 ➔ f4 (បើកផ្លូវសេះស្តាំ)<br />
                  ៦. ឡើងសេះ g1 ➔ f3<br />
                  ៧. ឡើងគោល c1 ➔ d2<br />
                  ៨. ឡើងគោល f1 ➔ e2
                </div>
              </div>

              <div className="p-5 rounded-2xl border border-slate-800 bg-slate-900/30 space-y-3">
                <h3 className="text-base font-black text-amber-400">២. ក្បួនខ្លាដេក ឬខ្លាពួន (Sleeping Tiger)</h3>
                <p className="text-xs text-slate-300 leading-relaxed font-sans">
                  រុញត្រីម្ខាងបើកផ្លូវ រួចអភិវឌ្ឍសេះមួយទៅមុខ និងសេះមួយទៀតទៅខាង។ បង្កើតប្រព័ន្ធការពារមិនស៊ីមេទ្រី ងាយស្រួលឆ្មក់វាយប្រហារ។
                </p>
                <div className="text-xs text-emerald-300/90 font-mono bg-slate-950/80 p-3.5 rounded-xl border border-emerald-500/20 leading-relaxed space-y-1">
                  <strong className="text-amber-400 block border-b border-emerald-500/20 pb-1 mb-1">🐾 របៀបដើរ:</strong>
                  ១. រុញត្រី d3 ➔ d4 (បើកផ្លូវគោល និងនាង)<br />
                  ២. រុញត្រី c3 ➔ c4 (បើកផ្លូវសេះ)<br />
                  ៣. ឡើងសេះ b1 ➔ c3<br />
                  ៤. លោតនាង d1 ➔ d2 (ការលោតពិសេស ២ការ៉ូ)<br />
                  ៥. ឡើងសេះ g1 ➔ e2 (សេះម្ខាងពួន)
                </div>
              </div>

              <div className="p-5 rounded-2xl border border-slate-800 bg-slate-900/30 space-y-3">
                <h3 className="text-base font-black text-amber-400">៣. ក្បួនផ្ការីក (Flower Formation)</h3>
                <p className="text-xs text-slate-300 leading-relaxed font-sans">
                  រៀបចំកូនត្រីជាលក្ខណៈអង្កត់ទ្រូងការពារគ្នាទៅវិញទៅមក។ វាជួយបិទទ្វារមិនឱ្យសេះគូប្រកួតលោតចូលមកជិតស្តេចបានឡើយ។
                </p>
                <div className="text-xs text-emerald-300/90 font-mono bg-slate-950/80 p-3.5 rounded-xl border border-emerald-500/20 leading-relaxed space-y-1">
                  <strong className="text-amber-400 block border-b border-emerald-500/20 pb-1 mb-1">🐾 របៀបដើរ:</strong>
                  ១. រុញត្រី d3 ➔ d4 និង e3 ➔ e4 (កណ្តាល)<br />
                  ២. រុញត្រី c3 ➔ c4 និង f3 ➔ f4 (បន្តពង្រីក)<br />
                  ៣. រក្សាត្រី b3 និង g3 នៅកន្លែង (ការពារចំហៀង)<br />
                  ៤. ត្រៀមរុញត្រី d4/e4 ទៅមុខដើម្បីយកត្រីកើត
                </div>
              </div>

              <div className="p-5 rounded-2xl border border-slate-800 bg-slate-900/30 space-y-3">
                <h3 className="text-base font-black text-amber-400">៤. ក្បួនទូកចម្បាំង (Active Rook Control)</h3>
                <p className="text-xs text-slate-300 leading-relaxed font-sans">
                  បើកផ្លូវឱ្យទូកអភិវឌ្ឍយ៉ាងលឿនតាមជួរឈរចំហ។ ទូកគឺជាកម្លាំងវាយលុកដ៏ខ្លាំងបំផុតក្នុងអុកចត្រង្គ។
                </p>
                <div className="text-xs text-emerald-300/90 font-mono bg-slate-950/80 p-3.5 rounded-xl border border-emerald-500/20 leading-relaxed space-y-1">
                  <strong className="text-amber-400 block border-b border-emerald-500/20 pb-1 mb-1">🐾 របៀបដើរ:</strong>
                  ១. រុញត្រី a3 ➔ a4 ឬ h3 ➔ h4 ដើម្បីបើកផ្លូវទូក<br />
                  ២. វាយសម្រុកទម្លុះត្រីការពាររបស់គូប្រកួត<br />
                  ៣. ដាក់ទូកពីរជាន់គ្នា (Doubled Rooks) នៅលើខ្សែតែមួយ<br />
                  ៤. រំកិលចូលទៅជួរចុងក្រោយរបស់សត្រូវ
                </div>
              </div>
            </div>
          )}
        </div>
      ) : (
        /* Main Grid Area */
        <div className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Control Panels (Status & Counting / Academy Guide) */}
        <div className="lg:col-span-3 flex flex-col gap-4 order-2 lg:order-none">
          
          {/* Main Status Panel */}
          <div className="bg-slate-950/80 border border-amber-500/30 rounded-2xl p-5 shadow-2xl backdrop-blur-md">
            <h2 className="text-lg font-bold text-amber-400 border-b border-amber-500/20 pb-2 mb-3">
              {academyActive ? 'Academy Mode' : 'Game Status'}
            </h2>
            
            {academyActive ? (
              <div className="space-y-4 bg-slate-900/90 p-6 rounded-2xl border-2 border-emerald-400 mt-2 shadow-[0_0_20px_rgba(16,185,129,0.2)]">
                <div className="flex items-center justify-between border-b border-emerald-500/20 pb-2">
                  <span className="bg-emerald-500 text-slate-950 text-xs px-3 py-1 rounded-full font-black uppercase tracking-widest">
                    បេសកកម្មអុកខ្មែរ / MISSION
                  </span>
                  <span className="text-xs text-emerald-400 font-bold font-mono">
                    មេរៀនទី {currentChapterIndex + 1}
                  </span>
                </div>
                <p className="text-amber-300 text-lg md:text-xl lg:text-2xl leading-relaxed font-black">
                  {typeof tutorialChapters[currentChapterIndex].instructions === 'function'
                    ? (tutorialChapters[currentChapterIndex].instructions as any)(history)
                    : tutorialChapters[currentChapterIndex].instructions}
                </p>
                {/* Dynamically show step helper for Lesson 1 */}
                {currentChapterIndex === 1 && (
                  <div className="flex justify-between items-center text-xs text-slate-400 font-semibold pt-1 border-t border-slate-800">
                    <span>ជំហានបច្ចុប្បន្ន:</span>
                    <span className="text-emerald-400 font-black text-sm">
                      {Math.min(history.length + 1, 3)} / 3
                    </span>
                  </div>
                )}
                <button 
                  onClick={() => { setAcademyActive(false); resetGame(); }}
                  className="w-full mt-3 bg-slate-850 hover:bg-slate-800 text-slate-300 hover:text-white text-xs font-bold py-2 rounded-xl transition-all border border-slate-700/50 flex items-center justify-center gap-1.5 shadow-md"
                >
                  ⬅️ ត្រឡប់ទៅបញ្ជីមេរៀន (Back to Lessons)
                </button>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between mb-4">
                  <span className="text-slate-400">Current Turn:</span>
                  <span className={`px-4 py-1.5 rounded-full text-sm font-black tracking-wider uppercase transition-all duration-300 ${
                    turn === 'w' 
                      ? 'bg-amber-400 text-slate-950 shadow-[0_0_15px_rgba(251,191,36,0.4)]' 
                      : 'bg-slate-800 text-white border border-slate-700'
                  }`}>
                    {turn === 'w' ? 'White' : 'Black'}
                  </span>
                </div>

                {/* Clocks */}
                {timeLimit !== null && !academyActive && (
                  <div className="mt-4 pt-4 border-t border-slate-800 space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      {/* White Player Clock */}
                      <div className={`p-3 rounded-xl border transition-all duration-300 text-center ${
                        turn === 'w' && !winner
                          ? 'border-amber-400 bg-amber-400/10 shadow-[0_0_15px_rgba(251,191,36,0.2)]'
                          : 'border-slate-800 bg-slate-900/50'
                      }`}>
                        <div className="text-[9px] text-amber-500/80 font-black tracking-wider uppercase mb-1">White</div>
                        <div className={`font-mono text-xl font-bold tracking-widest ${
                          whiteTime < 30 && turn === 'w' && !winner ? 'text-red-500 animate-pulse' : 'text-amber-300'
                        }`}>
                          {formatTime(whiteTime)}
                        </div>
                      </div>

                      {/* Black Player Clock */}
                      <div className={`p-3 rounded-xl border transition-all duration-300 text-center ${
                        turn === 'b' && !winner
                          ? 'border-slate-400 bg-slate-100/10 shadow-[0_0_15px_rgba(255,255,255,0.15)]'
                          : 'border-slate-800 bg-slate-900/50'
                      }`}>
                        <div className="text-[9px] text-slate-400 font-black tracking-wider uppercase mb-1">Black</div>
                        <div className={`font-mono text-xl font-bold tracking-widest ${
                          blackTime < 30 && turn === 'b' && !winner ? 'text-red-500 animate-pulse' : 'text-slate-300'
                        }`}>
                          {formatTime(blackTime)}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}

            {winner && (
              <div className="mt-4 p-4 rounded-xl text-center font-bold text-lg animate-pulse border border-emerald-500/30 bg-emerald-950/40 text-emerald-400">
                {winner === 'draw' ? (
                  'Game Drawn!'
                ) : (
                  <>
                    <div>{winner === 'w' ? 'White' : 'Black'} Wins!</div>
                    {timeLimit !== null && ((winner === 'w' && blackTime === 0) || (winner === 'b' && whiteTime === 0)) && (
                      <div className="text-xs uppercase tracking-wider mt-1 text-emerald-300">on time ⏱️</div>
                    )}
                  </>
                )}
              </div>
            )}

            {chapterSuccess && (
              <div className="mt-4 p-4 rounded-xl text-center font-bold text-lg border border-emerald-500 bg-emerald-950/80 text-emerald-400 animate-bounce">
                🎉 បេសកកម្មបានសម្រេច!
                <button 
                  onClick={() => {
                    if (currentChapterIndex < tutorialChapters.length - 1) {
                      startAcademyChapter(currentChapterIndex + 1);
                    } else {
                      resetGame();
                      setActiveTab('academy');
                    }
                  }}
                  className="w-full mt-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold py-2 rounded-lg transition-all"
                >
                  {currentChapterIndex < tutorialChapters.length - 1 ? 'មេរៀនបន្ទាប់ ➔' : 'ត្រឡប់ទៅសាលាបណ្តុះបណ្តាល'}
                </button>
              </div>
            )}

            {isCalculatedByEngine && (
              <div className="mt-2.5 text-xs text-amber-300 animate-pulse text-center font-semibold bg-slate-900/60 p-2 rounded-xl border border-slate-850/80 select-none">
                🤖 {engineActiveText || 'Fairy-Stockfish កំពុងគណនាជំហានដើរ...'}
              </div>
            )}
          </div>

          {/* Real-time Coach / Hints strategy card */}
          {!academyActive && activeTab === 'play' && (
            <div className="bg-slate-950/80 border border-slate-850 rounded-2xl p-5 shadow-2xl backdrop-blur-md">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-3">
                <h2 className="text-sm font-bold text-amber-400 flex items-center gap-1.5">
                  🔮 គ្រូបង្វឹកយុទ្ធសាស្ត្រ AI
                </h2>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={coachEnabled} 
                    onChange={(e) => setCoachEnabled(e.target.checked)} 
                    className="sr-only peer" 
                  />
                  <div className="w-8 h-4 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-slate-400 after:border-slate-300 after:border after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-amber-400 peer-checked:after:bg-slate-950"></div>
                </label>
              </div>
              
              {coachEnabled ? (
                coachTip ? (
                  <div className="space-y-2 min-h-[110px] flex flex-col justify-between">
                    <p className="text-xs text-slate-300 leading-relaxed font-sans" dangerouslySetInnerHTML={{ __html: coachTip }}></p>
                    <p className="text-[10px] text-amber-400/70 italic mt-auto pt-2 border-t border-slate-900/60">
                      💡 កូអរដោនេជំហានដើរណែនាំ ត្រូវបានបង្ហាញដោយបន្ទាត់ពណ៌មាសនៅលើក្តារ!
                    </p>
                  </div>
                ) : (
                  <div className="min-h-[110px] flex items-center justify-center">
                    <p className="text-slate-500 text-xs italic">កំពុងវិភាគយុទ្ធសាស្ត្រសម្រាប់វេនរបស់អ្នក...</p>
                  </div>
                )
              ) : (
                <div className="min-h-[110px] flex items-center">
                  <p className="text-slate-500 text-xs leading-relaxed">
                    បើកគ្រូបង្វឹកយុទ្ធសាស្ត្រ ដើម្បីទទួលបានការណែនាំពីរបៀបដើរ និងយុទ្ធសាស្ត្រលម្អិតដើម្បីយកឈ្នះគូប្រកួត។
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Piece's Honor Counting rule ticker */}
          {!academyActive && countingState.isActive && (
            <div className="bg-slate-950/85 border border-amber-500 rounded-2xl p-5 shadow-2xl backdrop-blur-md animate-pulse">
              <div className="flex items-center gap-2 mb-2">
                <span className="relative flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 bg-amber-400"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-500"></span>
                </span>
                <h2 className="text-sm font-bold text-amber-400">Honor Counting</h2>
              </div>
              
              <div className="space-y-3">
                <p className="text-xs text-amber-300/80 italic font-mono leading-relaxed">{countingState.reason}</p>
                <div className="flex justify-between items-end">
                  <span className="text-slate-400 text-[10px] uppercase font-bold tracking-wider">Current Count</span>
                  <span className="text-3xl font-extrabold text-amber-400 tracking-tighter font-mono">
                    {countingState.count} <span className="text-xs font-semibold text-slate-500">/ {countingState.limit}</span>
                  </span>
                </div>
                <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                  <div 
                    className="bg-gradient-to-r from-yellow-500 to-amber-400 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${(countingState.count / countingState.limit) * 100}%` }}
                  ></div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Center: 8x8 Board Container OR Lesson 0 Slideshow */}
        <div className="lg:col-span-6 lg:sticky lg:top-4 self-start flex flex-col items-center lg:items-center justify-center w-full max-w-[850px] mx-auto order-1 lg:order-none">

          {/* ── Lesson 0: History Slideshow ── */}
          {academyActive && currentChapterIndex === 0 ? (() => {
            const slides = [
              {
                img: '/lesson0_angkor_wat.png',
                tag: 'Introduction',
                title: 'What is Ouk Chatrang?',
                titleKh: 'អ្វីទៅជាអុកចត្រង្គ?',
                body: "Ouk Chatrang (អុកចត្រង្គ) is Cambodia's traditional chess game, played for over a thousand years. Like all chess variants, it is a two-player strategy board game of war — each side controls an army of six piece types with the goal of checkmating the enemy King. But Ouk Chatrang has its own unique rules, rhythms, and soul that set it apart from Western chess and make it distinctly Khmer.",
                accent: 'from-amber-600 to-orange-500'
              },
              {
                img: '/lesson0_history_timeline.png',
                tag: 'Origins',
                title: 'From Chaturanga to the Khmer Empire',
                titleKh: 'ចាប់ពីចតុរង្គដល់ចក្រភពខ្មែរ',
                body: "Chess was born in India around 600 AD as Chaturanga (Sanskrit: 'four divisions of an army'). As the Khmer Empire rose to power, this game traveled along trade and cultural routes to reach Cambodia. By the 11th century, evidence of Ouk Chatrang existed in stone carvings on the walls of Angkor Wat — one of the oldest continuous traditions of chess on earth.",
                accent: 'from-yellow-500 to-amber-600'
              },
              {
                img: '/lesson0_southeast_asia_map.png',
                tag: 'The Chess Family',
                title: 'Cousins Across Southeast Asia',
                titleKh: 'ប្អូនជីដូននៃអាស៊ីអាគ្នេយ៍',
                body: "Ouk Chatrang belongs to a family of chess variants that spread from India across Southeast Asia:\n• 🇮🇳 India → Chaturanga (ancestor of all chess)\n• 🇰🇭 Cambodia → Ouk Chatrang (this game)\n• 🇹🇭 Thailand → Makruk (very similar rules)\n• 🇲🇲 Myanmar → Sittuyin\n• 🇱🇦 Laos → Mak Houk\n\nOf these, Ouk Chatrang and Makruk are the closest cousins — sharing similar piece movements and the distinctive 'Met' (Queen) first-move jump.",
                accent: 'from-emerald-500 to-teal-600'
              },
              {
                img: '/lesson0_khmer_chess_pieces.png',
                tag: 'Unique Rules',
                title: "Ouk Chatrang's Special First Moves",
                titleKh: 'ការដើរពិសេសសម្រាប់ការចាប់ផ្តើម',
                body: "What makes Ouk Chatrang unique are two special first-move rules:\n\n♔ King (Sdaach): On its very first move only, the King may leap like a Knight — jumping in an L-shape to a square it could never normally reach. This gives the King an early escape route.\n\n♕ Queen (Met/Neang): On its very first move only, the Queen may leap two squares straight forward, jumping over any piece in its path. This is not a capture — it is a pure leap to accelerate the Queen's development.",
                accent: 'from-violet-500 to-purple-600'
              },
              {
                img: '/lesson0_people_playing.png',
                tag: 'Living Heritage',
                title: 'A Game Kept Alive Through Generations',
                titleKh: 'ល្បែងដែលរស់នៅតាមរយៈជំនាន់',
                body: "Through war, colonization, and the devastation of the Khmer Rouge era, Ouk Chatrang survived because ordinary Cambodians kept playing it — in villages, markets, temples, and family courtyards. Today it is recognized as a national cultural heritage game. Tournaments are held across Cambodia, and efforts are underway to teach younger generations this ancient art.\n\nYou are now part of that living tradition. 🙏",
                accent: 'from-rose-500 to-pink-600'
              }
            ];
            const slide = slides[lesson0Slide];
            const isLast = lesson0Slide === slides.length - 1;
            return (
              <div className="w-full rounded-2xl overflow-hidden border border-slate-800 shadow-2xl bg-slate-950 flex flex-col" style={{ minHeight: '520px' }}>
                {/* Image */}
                <div className="relative w-full flex-shrink-0" style={{ height: '260px' }}>
                  <img
                    key={slide.img}
                    src={slide.img}
                    alt={slide.title}
                    className="w-full h-full object-cover object-center"
                    style={{ transition: 'opacity 0.4s' }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/30 to-transparent" />
                  {/* Tag pill */}
                  <span className={`absolute top-4 left-4 bg-gradient-to-r ${slide.accent} text-white text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full shadow-lg`}>
                    {slide.tag}
                  </span>
                  {/* Slide counter */}
                  <span className="absolute top-4 right-4 bg-slate-950/70 backdrop-blur text-slate-300 text-[10px] font-bold px-2.5 py-1 rounded-full border border-slate-700">
                    {lesson0Slide + 1} / {slides.length}
                  </span>
                </div>

                {/* Text content */}
                <div className="flex-1 p-5 flex flex-col gap-3 overflow-y-auto">
                  <div>
                    <h2 className="text-xl font-black text-white leading-tight">{slide.title}</h2>
                    <p className={`text-sm font-semibold bg-gradient-to-r ${slide.accent} bg-clip-text text-transparent`}>{slide.titleKh}</p>
                  </div>
                  <p className="text-slate-300 text-sm leading-relaxed font-sans whitespace-pre-line flex-1">{slide.body}</p>

                  {/* Navigation */}
                  <div className="flex items-center justify-between pt-2 border-t border-slate-800 mt-auto">
                    <button
                      onClick={() => setLesson0Slide(s => Math.max(0, s - 1))}
                      disabled={lesson0Slide === 0}
                      className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-sm font-bold transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                      ← Previous
                    </button>

                    {/* Dot indicators */}
                    <div className="flex items-center gap-1.5">
                      {slides.map((_, i) => (
                        <button
                          key={i}
                          onClick={() => setLesson0Slide(i)}
                          className={`rounded-full transition-all ${i === lesson0Slide ? 'w-4 h-2 bg-amber-400' : 'w-2 h-2 bg-slate-700 hover:bg-slate-500'}`}
                        />
                      ))}
                    </div>

                    {isLast ? (
                      <button
                        onClick={() => { setChapterSuccess(true); }}
                        className="px-5 py-2 rounded-lg bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 text-sm font-black transition-all shadow-lg shadow-amber-500/30"
                      >
                        Complete Lesson ✓
                      </button>
                    ) : (
                      <button
                        onClick={() => setLesson0Slide(s => Math.min(slides.length - 1, s + 1))}
                        className="px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 text-sm font-black transition-all"
                      >
                        Next →
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })() : academyActive && currentChapterIndex === 1 ? (() => {
            const slides1 = [
              {
                img: '/lesson1_board_coordinates.png',
                tag: 'The Board',
                title: 'Reading the Chess Board',
                titleKh: 'ការអានក្តារអុក',
                body: "The Ouk Chatrang board is an 8×8 grid of 64 squares.\n\n📐 Files (columns) are labeled A to H, left to right.\n📐 Ranks (rows) are labeled 1 to 8, bottom to top.\n\nEvery square has a unique name formed by its file letter + rank number:\n• Bottom-left corner = a1\n• Top-right corner = h8\n• King starts on = d1 (White) / d8 (Black)\n\n💡 Tip: Say the file (letter) first, then the rank (number). So 'e3' means column E, row 3.",
                accent: 'from-sky-500 to-blue-600'
              },
              {
                img: '/lesson1_starting_positions.png',
                tag: 'Starting Setup',
                title: 'Where Each Piece Begins',
                titleKh: 'ទីតាំងចាប់ផ្តើមរបស់កូនអុក',
                body: "Every game of Ouk Chatrang starts from the same fixed position:\n\n🏰 Touk (Rook) — a1 and h1\n🐴 Sesh (Knight) — b1 and g1\n🔷 Koul (Bishop) — c1 and f1\n👑 Sdaach (King) — d1\n👸 Neang (Queen) — e1\n🐟 Trey (Pawn) — a3 through h3 (rank 3, NOT rank 2!)\n\nBlack mirrors the same setup on ranks 6 and 8.\n\n⚠️ Key difference from Western chess: Ouk Chatrang pawns start on rank 3, one row further forward.",
                accent: 'from-amber-500 to-orange-500'
              },
              {
                img: '/lesson1_pawn_trey.png',
                tag: 'The Pawn',
                title: 'Trey (ត្រី) — The Pawn',
                titleKh: 'ត្រី — របៀបដើរ និងចាប់',
                body: "The Trey is your front-line soldier — there are 8 of them.\n\n♟ Movement:\nMoves exactly 1 square straight forward. Unlike Western chess, there is NO two-square first move.\n\n⚔️ Capture:\nCaptures 1 square diagonally forward (left-diagonal or right-diagonal). It CANNOT capture straight ahead.\n\n⭐ Promotion:\nWhen a Trey reaches the opponent's pawn starting rank (rank 6 for White), it immediately becomes a Trey Kaet (ត្រីកើត) — which moves exactly like the Queen.",
                accent: 'from-lime-500 to-green-600'
              },
              {
                img: '/lesson1_major_pieces.png',
                tag: 'Major Pieces',
                title: 'Touk, Sesh & Koul',
                titleKh: 'ទូក — សេះ — គោល',
                body: "🏰 Touk (Rook)\nSlides any number of squares vertically or horizontally. Captures the first enemy piece in its path. Blocked by any piece. Most powerful for endgame control.\n\n🐴 Sesh (Knight)\nMoves in an L-shape: 2 squares in one direction + 1 square perpendicular. Jumps over all other pieces — nothing can block it. The only piece that leaps!\n\n🔷 Koul (Bishop)\nMoves 1 square diagonally in any of 4 directions, OR 1 square straight forward (5 directions total). This forward option is unique to Ouk Chatrang — it makes the Bishop stronger than its Western counterpart.",
                accent: 'from-violet-500 to-indigo-600'
              },
              {
                img: '/lesson1_royal_pieces.png',
                tag: 'Royal Pieces',
                title: 'Sdaach & Neang — The Royals',
                titleKh: 'ស្តេច — នាង — ការដើរពិសេស',
                body: "👑 Sdaach (King)\nNormal move: 1 square in any direction (8 possible squares).\n⭐ First move only: Can leap like a Knight (L-shape) — but only if NOT currently in check. Use this early to position safely!\n⚠️ The King can never move into a square attacked by any enemy piece.\n\n👸 Neang (Queen / Met)\nNormal move: 1 square diagonally in any of 4 directions (short range — NOT like Western chess!).\n⭐ First move only: Can leap 2 squares straight forward, jumping over any piece in its path. This is a pure move — it cannot capture on this leap.",
                accent: 'from-rose-500 to-pink-600'
              },
              {
                img: '/lesson1_lets_play.png',
                tag: "You're Ready!",
                title: "Now Let's Play!",
                titleKh: 'ដល់ពេលហើយ — សូមលេង!',
                body: "You now know everything to start your first game of Ouk Chatrang:\n\n✅ How to read the board (files A-H, ranks 1-8)\n✅ Where all pieces start\n✅ How the Trey (Pawn) moves and promotes\n✅ How Touk (Rook), Sesh (Knight) and Koul (Bishop) move\n✅ The special first-move leaps of the King and Queen\n\n🎯 Next Step:\nClick 'Complete Lesson' to unlock the sandbox — then try clicking any piece on the board to see its moves highlighted in real time. The game will show you exactly where you can go!",
                accent: 'from-amber-500 to-yellow-400'
              }
            ];
            const slide1 = slides1[lesson1Slide];
            const isLast1 = lesson1Slide === slides1.length - 1;
            return (
              <div className="w-full rounded-2xl overflow-hidden border border-slate-800 shadow-2xl bg-slate-950 flex flex-col" style={{ minHeight: '520px' }}>
                <div className="relative w-full flex-shrink-0" style={{ height: '260px' }}>
                  <img key={slide1.img} src={slide1.img} alt={slide1.title} className="w-full h-full object-cover object-center" style={{ transition: 'opacity 0.4s' }} />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/30 to-transparent" />
                  <span className={`absolute top-4 left-4 bg-gradient-to-r ${slide1.accent} text-white text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full shadow-lg`}>{slide1.tag}</span>
                  <span className="absolute top-4 right-4 bg-slate-950/70 backdrop-blur text-slate-300 text-[10px] font-bold px-2.5 py-1 rounded-full border border-slate-700">{lesson1Slide + 1} / {slides1.length}</span>
                </div>
                <div className="flex-1 p-5 flex flex-col gap-3 overflow-y-auto">
                  <div>
                    <h2 className="text-xl font-black text-white leading-tight">{slide1.title}</h2>
                    <p className={`text-sm font-semibold bg-gradient-to-r ${slide1.accent} bg-clip-text text-transparent`}>{slide1.titleKh}</p>
                  </div>
                  <p className="text-slate-300 text-sm leading-relaxed font-sans whitespace-pre-line flex-1">{slide1.body}</p>
                  <div className="flex items-center justify-between pt-2 border-t border-slate-800 mt-auto">
                    <button onClick={() => setLesson1Slide(s => Math.max(0, s - 1))} disabled={lesson1Slide === 0} className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-sm font-bold transition-all disabled:opacity-30 disabled:cursor-not-allowed">← Previous</button>
                    <div className="flex items-center gap-1.5">
                      {slides1.map((_, i) => (
                        <button key={i} onClick={() => setLesson1Slide(i)} className={`rounded-full transition-all ${i === lesson1Slide ? 'w-4 h-2 bg-amber-400' : 'w-2 h-2 bg-slate-700 hover:bg-slate-500'}`} />
                      ))}
                    </div>
                    {isLast1 ? (
                      <button onClick={() => setChapterSuccess(true)} className="px-5 py-2 rounded-lg bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 text-sm font-black transition-all shadow-lg shadow-amber-500/30">Complete Lesson ✓</button>
                    ) : (
                      <button onClick={() => setLesson1Slide(s => Math.min(slides1.length - 1, s + 1))} className="px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 text-sm font-black transition-all">Next →</button>
                    )}
                  </div>
                </div>
              </div>
            );
          })() : (
          <>
          {/* Coordinates Layout Wrapper */}
          <div className="grid grid-cols-[auto_1fr_auto] grid-rows-[auto_1fr_auto] items-center w-full max-w-[min(100%,90vh)] aspect-square select-none">
            {/* Top row */}
            <div></div>
            <div className="grid grid-cols-8 text-center text-[10px] md:text-xs text-amber-500/70 font-bold font-mono pb-1.5 select-none rotate-180">
              {playerColor === 'w' ? (
                <><span>A</span><span>B</span><span>C</span><span>D</span><span>E</span><span>F</span><span>G</span><span>H</span></>
              ) : (
                <><span>H</span><span>G</span><span>F</span><span>E</span><span>D</span><span>C</span><span>B</span><span>A</span></>
              )}
            </div>
            <div></div>

            {/* Middle row */}
            <div className="flex flex-col justify-around h-full text-[10px] md:text-xs text-amber-500/70 font-bold font-mono text-right pr-2 select-none py-2">
              {playerColor === 'w' ? (
                <><span>8</span><span>7</span><span>6</span><span>5</span><span>4</span><span>3</span><span>2</span><span>1</span></>
              ) : (
                <><span>1</span><span>2</span><span>3</span><span>4</span><span>5</span><span>6</span><span>7</span><span>8</span></>
              )}
            </div>
            
            {/* Main Wooden Board */}
            {(() => {
              const isWhiteKingInCheck = board && board.length > 0 ? isKingInCheck(board, 'w') : false;
              const isBlackKingInCheck = board && board.length > 0 ? isKingInCheck(board, 'b') : false;
              
              return (
                <div className="relative w-full h-full aspect-square rounded-xl overflow-hidden border-[12px] border-[#1d120a] shadow-[0_20px_50px_rgba(0,0,0,0.7)] bg-[#e6cb9f] p-1 select-none">
                  {/* Wooden Texture Grid overlay */}
            <div className="absolute inset-0 bg-cover bg-center opacity-[0.15] mix-blend-multiply pointer-events-none" 
                 style={{ backgroundImage: 'radial-gradient(circle, #ffe3bd 0%, #d8b888 100%)' }}>
            </div>
            
            <div className={`relative w-full h-full grid grid-cols-8 grid-rows-8 gap-[1.5px] bg-[#1d120a] overflow-hidden transition-transform duration-500 ${playerColor === 'b' ? 'rotate-180' : ''}`}>
              {board.map((row, r) => 
                row.map((piece, c) => {
                  const selected = isSquareSelected(r, c);
                  const isCheckedKing = piece && piece.type === 'sdaach' && (
                    (piece.color === 'w' && isWhiteKingInCheck) ||
                    (piece.color === 'b' && isBlackKingInCheck)
                  );
                  const highlighted = isSquareHighlighted(r, c);
                  const isLastMove = isLastMoveSquare(r, c);
                  const coachHighlighted = isSquareCoachSuggested(r, c);
                  const isGuideFrom = !chapterSuccess && isSquareAcademyGuidedFrom(r, c);
                  const isGuideTo = !chapterSuccess && isSquareAcademyGuidedTo(r, c);
                  const isEatTarget = isGuideTo && piece && piece.color !== 'w';

                  return (
                    <div
                      key={`${r}-${c}`}
                      onClick={() => handleSquareClick(r, c)}
                      className={`relative flex items-center justify-center cursor-pointer transition-colors duration-200 bg-[#e6cb9f] hover:bg-[#dfc295]
                        ${playerColor === 'b' ? 'rotate-180' : ''}
                        ${selected ? 'bg-[#cdaf82]/80 ring-4 ring-[#5c3a21] ring-inset' : ''}
                        ${isCheckedKing ? 'bg-red-800/40 ring-4 ring-red-500 ring-inset shadow-[0_0_20px_rgba(239,68,68,0.7)] animate-pulse z-30' : ''}
                        ${coachHighlighted && !selected && !isCheckedKing ? 'ring-4 ring-amber-400/60 ring-inset shadow-[0_0_15px_rgba(251,191,36,0.3)]' : ''}
                        ${isLastMove ? 'after:absolute after:inset-0 after:border-2 after:border-[#5c3a21]/50' : ''}
                        ${isGuideFrom && !selected ? 'academy-from-square' : ''}
                        ${isGuideTo && !isEatTarget ? 'academy-to-square' : ''}
                        ${isEatTarget ? 'academy-eat-square' : ''}
                      `}
                    >
                      {/* Highlight indicator for legal moves */}
                      {highlighted && (
                        <div className="absolute z-10 w-4 h-4 rounded-full bg-emerald-500/70 shadow-[0_0_10px_rgba(16,185,129,0.8)] animate-pulse"></div>
                      )}

                      {/* Academy guide "FROM" label */}
                      {isGuideFrom && !selected && (
                        <div className="absolute z-30 top-0.5 right-0.5 w-4 h-4 rounded-full bg-amber-400 flex items-center justify-center shadow-lg pointer-events-none">
                          <span className="text-[7px] font-black text-slate-900">GO</span>
                        </div>
                      )}

                      {/* Academy guide "TO" destination marker */}
                      {isGuideTo && !isEatTarget && !selected && (
                        <div className="absolute z-30 inset-0 flex items-center justify-center pointer-events-none">
                          <div className="w-8 h-8 rounded-full border-[3px] border-emerald-400 bg-emerald-400/20 animate-ping" style={{ animationDuration: '1.4s' }}></div>
                        </div>
                      )}

                      {/* Academy guide "EAT" target marker */}
                      {isEatTarget && !selected && (
                        <div className="absolute z-30 inset-0 flex items-center justify-center pointer-events-none">
                          <div className="w-8 h-8 rounded-full border-[3px] border-red-400 bg-red-400/10 animate-ping" style={{ animationDuration: '1.0s' }}></div>
                        </div>
                      )}

                      {/* Render chess piece */}
                      {piece && (
                        <div className={`w-[85%] h-[85%] z-20 transition-transform duration-300 ${
                          isGuideFrom ? 'guide-arrow-float' : ''
                        } ${
                          piece.color === turn ? 'hover:scale-105 active:scale-95' : ''
                        }`}>
                          <PieceIcon type={piece.type} color={piece.color} theme={pieceTheme} />
                        </div>
                      )}
                    </div>
                  );
                })
              )}

              {/* SVG Arrow Overlay — drawn on top of the grid */}
              {academyActive && academyGuide && !chapterSuccess && (() => {
                const { from, to } = academyGuide;
                const cellPct = 100 / 8;
                // Center of each cell in SVG viewBox (0 0 100 100)
                const x1 = from.col * cellPct + cellPct / 2;
                const y1 = from.row * cellPct + cellPct / 2;
                const x2 = to.col   * cellPct + cellPct / 2;
                const y2 = to.row   * cellPct + cellPct / 2;

                // Shorten line so it doesn't overlap piece icon
                const dx = x2 - x1, dy = y2 - y1;
                const dist = Math.sqrt(dx * dx + dy * dy);
                const shrink = Math.min(4.5, dist * 0.3);
                const sx = x1 + (dx / dist) * shrink;
                const sy = y1 + (dy / dist) * shrink;
                const ex = x2 - (dx / dist) * shrink;
                const ey = y2 - (dy / dist) * shrink;

                const isEat = board[to.row]?.[to.col] && board[to.row][to.col]?.color !== 'w';
                const arrowColor = isEat ? '#f87171' : '#34d399';
                const shadowColor = isEat ? 'rgba(239,68,68,0.9)' : 'rgba(52,211,153,0.9)';

                return (
                  <svg
                    key={`arrow-${from.row}-${from.col}-${to.row}-${to.col}-${history.length}`}
                    viewBox="0 0 100 100"
                    className="absolute inset-0 w-full h-full pointer-events-none z-40"
                    style={{ filter: `drop-shadow(0 0 4px ${shadowColor})` }}
                  >
                    <defs>
                      <marker id="arrowhead" markerWidth="5" markerHeight="5" refX="2.5" refY="1.5" orient="auto">
                        <polygon points="0 3, 5 1.5, 0 0" fill={arrowColor} className="guide-arrow-head" />
                      </marker>
                    </defs>
                    <line
                      x1={sx} y1={sy} x2={ex} y2={ey}
                      stroke={arrowColor}
                      strokeWidth="1.6"
                      strokeLinecap="round"
                      markerEnd="url(#arrowhead)"
                      className="guide-arrow-path"
                    />
                  </svg>
                );
              })()}
            </div>
                </div>
              );
            })()}

            <div className="flex flex-col justify-around h-full text-[10px] md:text-xs text-amber-500/70 font-bold font-mono text-left pl-2 select-none py-2 rotate-180">
              {playerColor === 'w' ? (
                <><span>8</span><span>7</span><span>6</span><span>5</span><span>4</span><span>3</span><span>2</span><span>1</span></>
              ) : (
                <><span>1</span><span>2</span><span>3</span><span>4</span><span>5</span><span>6</span><span>7</span><span>8</span></>
              )}
            </div>

            {/* Bottom row */}
            <div></div>
            <div className="grid grid-cols-8 text-center text-[10px] md:text-xs text-amber-500/70 font-bold font-mono pt-1.5 select-none">
              {playerColor === 'w' ? (
                <><span>A</span><span>B</span><span>C</span><span>D</span><span>E</span><span>F</span><span>G</span><span>H</span></>
              ) : (
                <><span>H</span><span>G</span><span>F</span><span>E</span><span>D</span><span>C</span><span>B</span><span>A</span></>
              )}
            </div>
            <div></div>
          </div>
          </>
          )}
        </div>
        
            {/* Right Side Panels - Stacked */}
            <div className="lg:col-span-3 flex flex-col gap-5 order-3 lg:order-none w-full">
          
          {academyActive ? (
            /* Active Lesson Guide Panel */
            <div className="bg-slate-950/80 border border-emerald-500/20 rounded-2xl p-5 shadow-2xl flex flex-col backdrop-blur-md space-y-4">
              <div className="border-b border-emerald-500/20 pb-3 flex justify-between items-center select-none">
                <div>
                  <span className="bg-emerald-500 text-slate-950 text-[9px] px-2 py-0.5 rounded-full font-black uppercase tracking-wider block w-max mb-1">
                    ACTIVE LESSON / មេរៀនសកម្ម
                  </span>
                  <h2 className="text-sm font-black text-amber-400 leading-tight">
                    {tutorialChapters[currentChapterIndex].title}
                  </h2>
                </div>
                
                <button 
                  onClick={() => { setAcademyActive(false); resetGame(); }}
                  className="px-2.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white rounded-lg text-[10px] font-bold transition-all border border-slate-800/80 cursor-pointer whitespace-nowrap"
                >
                  ⬅️ Lessons
                </button>
              </div>

              {/* Lesson 0 or Lesson 1: Slide Outline in Sidebar */}
              {currentChapterIndex === 0 ? (
                <div className="space-y-3 flex-grow overflow-y-auto pr-1">
                  <div className="bg-slate-900/60 p-2.5 rounded-xl border border-slate-700/50">
                    <h3 className="text-[10px] font-bold text-amber-400 uppercase tracking-wider mb-2">📜 Lesson Overview</h3>
                    <p className="text-[11px] text-slate-400 leading-relaxed">Read each slide on the left. Use Next → to advance through the 5-part history of Ouk Chatrang.</p>
                  </div>
                  {[
                    { n: 1, title: 'What is Ouk Chatrang?', icon: '🏛' },
                    { n: 2, title: 'Origins from Chaturanga', icon: '📜' },
                    { n: 3, title: 'SE Asian Chess Family', icon: '🗺' },
                    { n: 4, title: "Special First-Move Rules", icon: '♔' },
                    { n: 5, title: 'Living Cultural Heritage', icon: '🙏' },
                  ].map((s) => {
                    const done = lesson0Slide + 1 > s.n;
                    const active = lesson0Slide + 1 === s.n;
                    return (
                      <button
                        key={s.n}
                        type="button"
                        onClick={() => setLesson0Slide(s.n - 1)}
                        className={`w-full flex items-center gap-2.5 p-2.5 rounded-xl border text-left transition-all text-xs font-medium ${
                          done ? 'bg-emerald-950/20 border-emerald-500/20 text-emerald-400' :
                          active ? 'bg-amber-400/10 border-amber-500/40 text-amber-300 ring-1 ring-amber-500/20 shadow-md animate-pulse' :
                          'bg-slate-900/20 border-slate-800 text-slate-500 hover:text-slate-300 hover:border-slate-700'
                        }`}
                      >
                        <span className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black flex-shrink-0 border ${
                          done ? 'bg-emerald-500 text-slate-950 border-emerald-500' :
                          active ? 'bg-amber-400 text-slate-950 border-amber-400' :
                          'border-slate-700 text-slate-600'
                        }`}>
                          {done ? '✓' : s.n}
                        </span>
                        <span className="text-base">{s.icon}</span>
                        <span className="flex-1 leading-tight">{s.title}</span>
                      </button>
                    );
                  })}
                  {chapterSuccess && (
                    <div className="bg-emerald-950/30 border border-emerald-500/30 rounded-xl p-3 text-center space-y-1">
                      <div className="text-emerald-400 font-black text-sm">🏆 Lesson Complete!</div>
                      <div className="text-slate-400 text-[11px]">Proceed to Lesson 1 to learn the board, pieces, and moves.</div>
                    </div>
                  )}
                </div>
              ) : currentChapterIndex === 1 ? (
                <div className="space-y-3 flex-grow overflow-y-auto pr-1">
                  <div className="bg-slate-900/60 p-2.5 rounded-xl border border-slate-700/50">
                    <h3 className="text-[10px] font-bold text-amber-400 uppercase tracking-wider mb-2">📖 Lesson Overview</h3>
                    <p className="text-[11px] text-slate-400 leading-relaxed">Learn how each piece moves. Use Next → to go through all 6 slides.</p>
                  </div>
                  {[
                    { n: 1, title: 'Reading the Board', icon: '📐' },
                    { n: 2, title: 'Starting Positions', icon: '♟' },
                    { n: 3, title: 'Trey (Pawn)', icon: '🐟' },
                    { n: 4, title: 'Touk, Sesh & Koul', icon: '🏰' },
                    { n: 5, title: 'King & Queen Special Moves', icon: '👑' },
                    { n: 6, title: "Let's Play!", icon: '🎯' },
                  ].map((s) => {
                    const done = lesson1Slide + 1 > s.n;
                    const active = lesson1Slide + 1 === s.n;
                    return (
                      <button
                        key={s.n}
                        type="button"
                        onClick={() => setLesson1Slide(s.n - 1)}
                        className={`w-full flex items-center gap-2.5 p-2.5 rounded-xl border text-left transition-all text-xs font-medium ${
                          done ? 'bg-emerald-950/20 border-emerald-500/20 text-emerald-400' :
                          active ? 'bg-amber-400/10 border-amber-500/40 text-amber-300 ring-1 ring-amber-500/20 shadow-md animate-pulse' :
                          'bg-slate-900/20 border-slate-800 text-slate-500 hover:text-slate-300 hover:border-slate-700'
                        }`}
                      >
                        <span className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black flex-shrink-0 border ${
                          done ? 'bg-emerald-500 text-slate-950 border-emerald-500' :
                          active ? 'bg-amber-400 text-slate-950 border-amber-400' :
                          'border-slate-700 text-slate-600'
                        }`}>
                          {done ? '✓' : s.n}
                        </span>
                        <span className="text-base">{s.icon}</span>
                        <span className="flex-1 leading-tight">{s.title}</span>
                      </button>
                    );
                  })}
                  {chapterSuccess && (
                    <div className="bg-emerald-950/30 border border-emerald-500/30 rounded-xl p-3 text-center space-y-1">
                      <div className="text-emerald-400 font-black text-sm">🏆 Lesson Complete!</div>
                      <div className="text-slate-400 text-[11px]">You are ready to play! Start a game from the main menu.</div>
                    </div>
                  )}
                </div>
              ) : (
                <>

              {activeGuidePiece && (() => {
                const guideDataTop: Record<string, { khmer: string, title: string, move: string, capture: string, special: string, alert?: string }> = {
                  sdaach: { khmer: 'ស្តេច (Sdaach)', title: 'The King', move: 'Moves 1 square in any direction (8 squares possible).', capture: 'Captures by moving onto any adjacent enemy square. Cannot capture into check.', special: 'On its very first move only (not in check), it can leap like a Knight.', alert: 'Can NEVER step onto a square attacked by an enemy.' },
                  neang: { khmer: 'នាង (Neang)', title: 'The Queen', move: 'Moves 1 square diagonally in any of 4 directions.', capture: 'Captures by stepping diagonally onto an enemy square (adjacent only).', special: 'First move only: can leap 2 squares straight forward.', alert: 'Does NOT sweep across the board like Western chess Queen.' },
                  koul: { khmer: 'គោល (Koul)', title: 'The Bishop', move: 'Moves 1 square diagonally (4 dirs) OR 1 square straight forward — 5 directions total.', capture: 'Captures on any of its 5 movement directions (4 diagonals + 1 forward).', special: 'The forward-move option makes it stronger than a Western Bishop.' },
                  sesh: { khmer: 'សេះ (Sesh)', title: 'The Knight', move: 'L-shape: 2 squares one direction + 1 square perpendicular (8 landing squares).', capture: 'Lands directly on an enemy piece — jumps over everything in between.', special: 'Only piece that can jump over other pieces.' },
                  touk: { khmer: 'ទូក (Touk)', title: 'The Rook', move: 'Slides any number of squares vertically or horizontally (path must be clear).', capture: 'Captures the first enemy piece along its rank or file. Cannot jump over pieces.', special: 'Most powerful piece for endgame control.' },
                  trey: { khmer: 'ត្រី (Trey)', title: 'The Pawn', move: 'Moves 1 square straight forward only. No 2-square push.', capture: 'Captures 1 square diagonally forward only. Cannot capture straight ahead.', special: 'Promotes to Trey Kaet (Queen-like) when reaching opponent pawn starting rank.' },
                  trey_kaet: { khmer: 'ត្រីកើត (Trey Kaet)', title: 'Promoted Pawn', move: 'Moves like the Queen — 1 square diagonally in any of 4 directions.', capture: 'Captures diagonally onto adjacent enemy squares.', special: 'Automatically becomes Trey Kaet upon reaching the promotion rank.' }
                };
                const d = guideDataTop[activeGuidePiece];
                if (!d) return null;
                return (
                  <div className="bg-slate-900 border border-amber-500/40 rounded-xl p-3 space-y-2 shadow-lg shadow-amber-500/5">
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 flex-shrink-0">
                        <PieceIcon type={activeGuidePiece as any} color="w" theme={pieceTheme} />
                      </div>
                      <div className="flex-1">
                        <div className="text-amber-400 font-black text-sm leading-tight">{d.khmer}</div>
                        <div className="text-slate-400 text-[10px]">{d.title}</div>
                      </div>
                      <button type="button" onClick={() => setActiveGuidePiece(null)} className="text-slate-500 hover:text-white font-black px-1.5 py-0.5 rounded hover:bg-slate-800 transition-all text-xs">✕</button>
                    </div>
                    <div className="grid grid-cols-1 gap-1.5 text-[11px] font-sans">
                      <div className="bg-slate-800/60 px-2.5 py-1.5 rounded-lg">
                        <span className="text-amber-400 font-black text-[9px] uppercase tracking-widest">♟ Move — </span>
                        <span className="text-slate-200">{d.move}</span>
                      </div>
                      <div className="bg-rose-950/40 border border-rose-500/20 px-2.5 py-1.5 rounded-lg">
                        <span className="text-rose-400 font-black text-[9px] uppercase tracking-widest">⚔ Capture — </span>
                        <span className="text-slate-200">{d.capture}</span>
                      </div>
                      <div className="bg-emerald-950/40 border border-emerald-500/20 px-2.5 py-1.5 rounded-lg">
                        <span className="text-emerald-400 font-black text-[9px] uppercase tracking-widest">★ Special — </span>
                        <span className="text-slate-200">{d.special}</span>
                      </div>
                      {d.alert && <div className="bg-red-950/30 border border-red-500/30 text-red-300 px-2.5 py-1.5 rounded-lg text-[10px] italic">⚠️ {d.alert}</div>}
                    </div>
                  </div>
                );
              })()}

              {/* Lesson Instructions & Steps List */}
              <div className="space-y-3 flex-grow overflow-y-auto pr-1">
                <div className="bg-slate-900/60 p-2.5 rounded-xl border border-slate-850/80">
                  <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">🎯 Lesson Goal</h3>
                  {!activeGuidePiece && (
                    <p className="text-xs text-slate-300 leading-relaxed font-sans whitespace-pre-line mt-1">
                      {tutorialChapters[currentChapterIndex].description}
                    </p>
                  )}
                </div>

                {/* Steps Checklist */}
                <div className="space-y-2">
                  <h3 className="text-[10px] font-bold text-amber-400 uppercase tracking-wider pl-1">🐾 Steps to Follow:</h3>
                  
                  {currentChapterIndex === 1 ? (
                    /* Lesson 1 sandbox step list */
                    <div className="space-y-1.5 font-sans">
                      {[
                        { step: 0, text: "Step 1: Test first piece movement" },
                        { step: 1, text: "Step 2: Test second piece movement" },
                        { step: 2, text: "Step 3: Test third piece movement" }
                      ].map((s) => {
                        const isDone = history.length > s.step;
                        const isActive = history.length === s.step;
                        return (
                          <div 
                            key={s.step} 
                            className={`flex items-center gap-2.5 p-2 rounded-lg border text-xs font-medium transition-all ${
                              isDone 
                                ? 'bg-emerald-950/20 border-emerald-500/20 text-emerald-400' 
                                : isActive 
                                  ? 'bg-amber-400/10 border-amber-500/40 text-amber-300 ring-1 ring-amber-500/20 shadow-md shadow-amber-500/5 animate-pulse' 
                                  : 'bg-slate-900/20 border-slate-900 text-slate-500'
                            }`}
                          >
                            <span className={`h-4.5 w-4.5 rounded-full flex items-center justify-center font-bold text-[9px] border ${
                              isDone 
                                ? 'bg-emerald-500 text-slate-950 border-emerald-500' 
                                : isActive 
                                  ? 'bg-amber-400 text-slate-950 border-amber-400' 
                                  : 'border-slate-800 text-slate-600'
                            }`}>
                              {isDone ? '✓' : s.step + 1}
                            </span>
                            <span className="flex-1">{s.text}</span>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    /* Simple single instruction checklist */
                    <div className="space-y-1.5 font-sans">
                      <div className={`flex items-center gap-2.5 p-2.5 rounded-lg border text-xs font-medium ${
                        chapterSuccess 
                          ? 'bg-emerald-950/20 border-emerald-500/20 text-emerald-400' 
                          : 'bg-amber-400/10 border-amber-500/40 text-amber-300 ring-1 ring-amber-500/20 shadow-md animate-pulse'
                      }`}>
                        <span className={`h-4.5 w-4.5 rounded-full flex items-center justify-center font-bold text-[9px] border ${
                          chapterSuccess ? 'bg-emerald-500 text-slate-950 border-emerald-500' : 'bg-amber-400 text-slate-950 border-amber-400'
                        }`}>
                          {chapterSuccess ? '✓' : '1'}
                        </span>
                        <span className="flex-1 font-semibold leading-relaxed">
                          {typeof tutorialChapters[currentChapterIndex].instructions === 'function'
                            ? (tutorialChapters[currentChapterIndex].instructions as any)(history)
                            : tutorialChapters[currentChapterIndex].instructions}
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Piece Icon Quick-Select Bar */}
                <div className="border-t border-slate-900 pt-2 space-y-1.5 select-none">
                  <h3 className="text-[10px] font-bold text-amber-400 uppercase tracking-wider pl-1 flex items-center justify-between">
                    <span>📖 Piece Guide</span>
                    <span className="text-[8px] text-slate-500 font-medium">Click a piece on the board or here</span>
                  </h3>
                  <div className="grid grid-cols-6 gap-1 bg-slate-900/60 p-1 rounded-xl border border-slate-850">
                    {[
                      { type: 'sdaach', label: 'King' },
                      { type: 'neang', label: 'Queen' },
                      { type: 'koul', label: 'Bishop' },
                      { type: 'sesh', label: 'Knight' },
                      { type: 'touk', label: 'Rook' },
                      { type: 'trey', label: 'Pawn' }
                    ].map((p) => (
                      <button
                        key={p.type}
                        type="button"
                        onClick={() => setActiveGuidePiece(activeGuidePiece === p.type ? null : (p.type as any))}
                        className={`flex flex-col items-center justify-center p-1 rounded-lg border transition-all cursor-pointer ${
                          activeGuidePiece === p.type
                            ? 'bg-amber-400/20 border-amber-400 shadow-md'
                            : 'bg-slate-950/40 border-slate-800 hover:bg-slate-800/40 hover:border-slate-700'
                        }`}
                      >
                        <div className="w-6 h-6"><PieceIcon type={p.type as any} color="w" theme={pieceTheme} /></div>
                        <span className="text-[8px] font-bold text-slate-400 mt-0.5">{p.label}</span>
                      </button>
                    ))}
                  </div>
                  </div>
                </div>
              </>
              )}
            </div>
          ) : (
            /* Regular Side Panels (Playing info, moves history, or academy lessons catalog) */
            <>
              {/* Sidebar Header with Menu button and Title */}
              <div className="flex items-center justify-between border-b border-slate-850 pb-4 mb-2 select-none">
            <div>
              <h1 className="text-2xl font-bold tracking-wider bg-gradient-to-r from-amber-400 via-yellow-200 to-amber-500 bg-clip-text text-transparent drop-shadow-md">
                {activeTab === 'academy' ? 'សាលាបណ្តុះបណ្តាលអុកចត្រង្គ' : 'អុកចត្រង្គ'}
              </h1>
              <p className={`text-[9px] font-semibold tracking-wider mt-0.5 uppercase transition-colors duration-500 ${
                activeTab === 'academy' ? 'text-emerald-400' : 'text-amber-500/80'
              }`}>
                {activeTab === 'academy' ? 'Chess Academy' : 'OUK CHATRANG • Cambodian Traditional Chess'}
              </p>
            </div>
            
            <button 
              onClick={() => setGameStarted(false)}
              className="px-3 py-1.5 bg-slate-800/85 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg font-bold text-xs transition-all border border-slate-700 flex items-center gap-1.5 cursor-pointer"
            >
              <span className="text-sm">←</span> Menu
            </button>
          </div>

          {/* TAB 1: Playing options */}
          {activeTab === 'play' && (
            <>
              {/* Match Info Panel */}
              <div className="bg-slate-950/80 border border-amber-500/20 rounded-2xl p-4 shadow-xl backdrop-blur-md">
                <h2 className="text-xs font-bold text-amber-400 border-b border-amber-500/10 pb-1.5 mb-2.5 uppercase tracking-wider">Match Info</h2>
                
                <div className="space-y-2.5 text-xs">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400">Opponent:</span>
                    <span className="font-bold text-slate-200">
                      {vsAI ? (aiDifficulty === 'engine' ? 'AI (Fairy-Stockfish)' : 'AI (Local)') : '2 Players (Local)'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400">Time Limit:</span>
                    <span className="font-bold text-slate-200">
                      {timeLimit ? `${timeLimit / 60} min` : 'Unlimited (∞)'}
                    </span>
                  </div>

                  {/* Reset Game Action */}
                  <button 
                    onClick={resetGame}
                    className="w-full mt-2 bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-slate-950 font-bold py-1.5 px-3 rounded-lg text-xs transition-all duration-300 shadow-[0_0_10px_rgba(217,119,6,0.15)] cursor-pointer"
                  >
                    Reset / New Game
                  </button>
                </div>
              </div>

              {/* Move History Logger */}
              <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-5 shadow-2xl flex flex-col h-[200px] backdrop-blur-md">
                <h2 className="text-lg font-bold text-amber-400 border-b border-amber-500/20 pb-2 mb-2 flex justify-between items-center">
                  <span>Moves History</span>
                  <span className="text-xs font-mono text-slate-500">{history.length} moves</span>
                </h2>
                <div className="flex-1 overflow-y-auto pr-1 text-slate-300 text-xs font-mono space-y-1">
                  {[...history].reverse().map((m, revIndex) => {
                    const i = history.length - 1 - revIndex;
                    const turnNum = Math.floor(i / 2) + 1;
                    const isWhite = i % 2 === 0;
                    const pieceName = m.piece.type.replace('_', ' ').toUpperCase();
                    
                    return (
                      <div key={i} className={`p-1.5 rounded ${isWhite ? 'bg-slate-900/40' : 'bg-slate-800/20'}`}>
                        <span className="text-amber-500/70 mr-2">{turnNum}.</span>
                        <span className={isWhite ? 'text-amber-300' : 'text-slate-200'}>
                          {isWhite ? 'White' : 'Black'} {pieceName}: {toAlgebraic(m.from)} → {toAlgebraic(m.to)}
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
            </>
          )}

          {/* TAB 2: Tutorial Academy Panel */}
          {activeTab === 'academy' && (
            <div className="bg-slate-950/80 border border-amber-500/30 rounded-2xl p-5 shadow-2xl flex flex-col backdrop-blur-md space-y-4">
              <h2 className="text-lg font-bold text-amber-400 border-b border-amber-500/20 pb-2">
                សាលាបណ្តុះបណ្តាលអុកចត្រង្គ 🎓
              </h2>
              
              {/* Academy Sub-tabs */}
              <div className="grid grid-cols-2 gap-1 bg-slate-900 p-1 rounded-xl border border-slate-800">
                <button 
                  onClick={() => setAcademySubTab('challenges')}
                  className={`py-1 text-[10px] font-bold rounded-lg transition-all ${
                    academySubTab === 'challenges' ? 'bg-amber-400 text-slate-950' : 'text-slate-405 hover:text-white'
                  }`}
                >
                  របៀបដើរ (Tutorials)
                </button>
                <button 
                  onClick={() => setAcademySubTab('strategies')}
                  className={`py-1 text-[10px] font-bold rounded-lg transition-all ${
                    academySubTab === 'strategies' ? 'bg-amber-400 text-slate-950' : 'text-slate-405 hover:text-white'
                  }`}
                >
                  យុទ្ធសាស្ត្រឈ្នះ (Setups)
                </button>
              </div>

              {academySubTab === 'challenges' ? (
                <>
                  <p className="text-xs text-slate-400 leading-relaxed font-sans">
                    សិក្សាអំពីច្បាប់ និងរបៀបលេងអុកចត្រង្គខ្មែរជំហានម្តងៗ ជាមួយបញ្ហាប្រឈមជាក់ស្តែង។ ចុចលើមេរៀនខាងក្រោមដើម្បីអនុវត្ត!
                  </p>

                  <div className="space-y-2 flex-1 overflow-y-auto pr-1">
                    {tutorialChapters.map((chapter, index) => {
                      const isActive = academyActive && currentChapterIndex === index;
                      return (
                        <div 
                          key={chapter.id} 
                          onClick={() => startAcademyChapter(index)}
                          className={`p-3 rounded-xl border cursor-pointer transition-all ${
                            isActive 
                              ? 'border-amber-400 bg-amber-400/10' 
                              : 'border-slate-800 bg-slate-900/40 hover:bg-slate-900/80'
                          }`}
                        >
                          <h3 className="text-xs font-bold text-amber-400 mb-1">{chapter.title}</h3>
                          <p className="text-[10px] text-slate-400 leading-relaxed font-sans">{chapter.description}</p>
                          
                          {isActive && (
                            <div className="mt-2 text-[10px] text-emerald-400 font-bold flex items-center gap-1">
                              🎯 ស្ថានភាព: កំពុងអនុវត្តប្រកួត
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </>
              ) : (
                <>
                  <p className="text-xs text-slate-400 leading-relaxed font-sans">
                    យុទ្ធសាស្ត្របើកឆាកអុកចត្រង្គខ្មែរល្បីៗ ដើម្បីគ្រប់គ្រងក្តារអុក និងរៀបចំការវាយលុកយកឈ្នះគូប្រកួត៖
                  </p>

                  <div className="space-y-3 flex-1 overflow-y-auto pr-1">
                    {/* Strategy 1: Horns */}
                    <div className="p-3 rounded-xl border border-slate-800 bg-slate-900/40 space-y-1.5">
                      <h3 className="text-xs font-bold text-amber-400">១. ក្បួនស្នែង ឬរបាំងស្នែង (Horn Defense)</h3>
                      <p className="text-[10px] text-slate-400 leading-relaxed font-sans">
                        រុញត្រីនៅ c3 និង f3 ឡើង រួចអភិវឌ្ឍសេះទាំងពីរទៅកាន់ c3 និង f3 ដើម្បីគ្រប់គ្រងកណ្តាលក្តារ និងបង្កើតខែលការពារស្តេច។
                      </p>
                      <div className="text-[9px] text-amber-500/90 font-mono bg-slate-950/50 p-2 rounded-lg border border-amber-500/10 leading-relaxed">
                        <strong className="text-amber-400">🐾 របៀបដើរ:</strong><br />
                        ១. រុញត្រី c3 ➔ c4 (បើកផ្លូវសេះឆ្វេង)<br />
                        ២. រុញត្រី f3 ➔ f4 (បើកផ្លូវសេះស្តាំ)<br />
                        ៣. ឡើងសេះ b1 ➔ c3<br />
                        ៤. ឡើងសេះ g1 ➔ f3
                      </div>
                    </div>

                    {/* Strategy 2: Sleeping Tiger */}
                    <div className="p-3 rounded-xl border border-slate-800 bg-slate-900/40 space-y-1.5">
                      <h3 className="text-xs font-bold text-amber-400">២. ក្បួនខ្លាដេក ឬខ្លាពួន (Sleeping Tiger)</h3>
                      <p className="text-[10px] text-slate-400 leading-relaxed font-sans">
                        រុញត្រីម្ខាងបើកផ្លូវ រួចអភិវឌ្ឍសេះមួយទៅមុខ និងសេះមួយទៀតទៅខាង។ បង្កើតប្រព័ន្ធការពារមិនស៊ីមេទ្រី ងាយស្រួលឆ្មក់វាយប្រហារ។
                      </p>
                      <div className="text-[9px] text-amber-500/90 font-mono bg-slate-950/50 p-2 rounded-lg border border-amber-500/10 leading-relaxed">
                        <strong className="text-amber-400">🐾 របៀបដើរ:</strong><br />
                        ១. រុញត្រី d3 ➔ d4 (បើកផ្លូវគោល និងនាង)<br />
                        ២. រុញត្រី c3 ➔ c4 (បើកផ្លូវសេះ)<br />
                        ៣. ឡើងសេះ b1 ➔ c3<br />
                        ៤. លោតនាង d1 ➔ d2 (ការលោតពិសេស ២ការ៉ូ)<br />
                        ៥. ឡើងសេះ g1 ➔ e2 (សេះម្ខាងពួន)
                      </div>
                    </div>

                    {/* Strategy 3: Flower */}
                    <div className="p-3 rounded-xl border border-slate-800 bg-slate-900/40 space-y-1.5">
                      <h3 className="text-xs font-bold text-amber-400">៣. ក្បួនផ្ការីក (Flower Formation)</h3>
                      <p className="text-[10px] text-slate-400 leading-relaxed font-sans">
                        រៀបចំកូនត្រីជាលក្ខណៈអង្កត់ទ្រូងការពារគ្នាទៅវិញទៅមក។ វាជួយបិទទ្វារមិនឱ្យសេះគូប្រកួតលោតចូលមកជិតស្តេចបានឡើយ។
                      </p>
                      <div className="text-[9px] text-amber-500/90 font-mono bg-slate-950/50 p-2 rounded-lg border border-amber-500/10 leading-relaxed">
                        <strong className="text-amber-400">🐾 របៀបដើរ:</strong><br />
                        ១. រុញត្រី d3 ➔ d4 និង e3 ➔ e4 (កណ្តាល)<br />
                        ២. រុញត្រី c3 ➔ c4 និង f3 ➔ f4 (បន្តពង្រីក)<br />
                        ៣. រក្សាត្រី b3 និង g3 នៅកន្លែង (ការពារចំហៀង)<br />
                        ៤. ត្រៀមរុញត្រី d4/e4 ទៅមុខដើម្បីយកត្រីកើត
                      </div>
                    </div>

                    {/* Strategy 4: Active Rooks */}
                    <div className="p-3 rounded-xl border border-slate-800 bg-slate-900/40 space-y-1.5">
                      <h3 className="text-xs font-bold text-amber-400">៤. ក្បួនទូកចម្បាំង (Active Rook Control)</h3>
                      <p className="text-[10px] text-slate-400 leading-relaxed font-sans">
                        បើកផ្លូវឱ្យទូកអភិវឌ្ឍយ៉ាងលឿនតាមជួរឈរចំហ។ ទូកគឺជាកម្លាំងវាយលុកដ៏ខ្លាំងបំផុតក្នុងអុកចត្រង្គ។
                      </p>
                      <div className="text-[9px] text-amber-500/90 font-mono bg-slate-950/50 p-2 rounded-lg border border-amber-500/10 leading-relaxed">
                        <strong className="text-amber-400">🐾 របៀបដើរ:</strong><br />
                        ១. រុញត្រី a3 ➔ a4 (បើកផ្លូវទូកឆ្វេង)<br />
                        ២. អភិវឌ្ឍទូក a1 ➔ a3 (ទូកឡើងទៅជួរទី៣)<br />
                        ៣. ផ្លាស់ទូកទៅ d3 ឬ e3 (គ្រប់គ្រងកណ្តាល)<br />
                        ៤. ម្ខាងទៀត: រុញត្រី h3 ➔ h4 រួច ទូក h1 ➔ h3
                      </div>
                    </div>
                  </div>
                </>
              )}

            </div>
          )}
        </>
      )}
        </div>
      </div>
      )
      )}
    </div>
  );
}
