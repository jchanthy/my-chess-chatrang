const express = require('express');
const cors = require('cors');
const { spawn } = require('child_process');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 8080;

app.use(cors());
app.use(express.json());

// Helper to convert board representation to FEN
function boardToFen(board, turn) {
  let fen = '';
  for (let r = 0; r < 8; r++) {
    let emptyCount = 0;
    for (let c = 0; c < 8; c++) {
      const piece = board[r][c];
      if (!piece) {
        emptyCount++;
      } else {
        if (emptyCount > 0) {
          fen += emptyCount;
          emptyCount = 0;
        }
        let char = '';
        switch (piece.type) {
          case 'sdaach': char = 'k'; break;
          case 'neang': char = 'q'; break;
          case 'koul': char = 'b'; break;
          case 'sesh': char = 'n'; break;
          case 'touk': char = 'r'; break;
          case 'trey': char = 'p'; break;
          case 'trey_kaet': char = 'q'; break;
        }
        fen += piece.color === 'w' ? char.toUpperCase() : char.toLowerCase();
      }
    }
    if (emptyCount > 0) {
      fen += emptyCount;
    }
    if (r < 7) {
      fen += '/';
    }
  }
  return `${fen} ${turn} - - 0 1`;
}

// Convert UCI coordinate back to row/col index (e.g. "e3" -> {row: 5, col: 4})
function fromAlgebraic(coord) {
  if (!coord || coord.length < 2) return null;
  const col = coord.charCodeAt(0) - 97; // a -> 0
  const row = 8 - parseInt(coord.charAt(1), 10);
  return { row, col };
}

// Route to get best move from Fairy-Stockfish
app.post('/api/move', (req, res) => {
  const { board, turn } = req.body;
  if (!board || !turn) {
    return res.status(400).json({ error: 'Missing board or turn data' });
  }

  const fen = boardToFen(board, turn);
  console.log(`Processing state FEN: ${fen}`);

  // Fairy-Stockfish executable path (in container it's in the PATH or same directory)
  const enginePath = process.env.ENGINE_PATH || 'fairy-stockfish';
  
  const engine = spawn(enginePath, []);
  let stdoutData = '';
  let moveFound = false;

  // Set timeout of 5.5 seconds to prevent hung process/memory leaks
  const timeoutId = setTimeout(() => {
    if (!moveFound) {
      console.log('Fairy-Stockfish calculation timed out. Killing process.');
      engine.kill();
      res.status(504).json({ error: 'Fairy-Stockfish calculation timed out' });
    }
  }, 5500);

  engine.stdout.on('data', (data) => {
    stdoutData += data.toString();
    console.log(`[Engine Stdout]: ${data.toString()}`);

    // Check if bestmove has been printed
    const match = stdoutData.match(/bestmove\s+([a-h][1-8])([a-h][1-8])/);
    if (match && !moveFound) {
      moveFound = true;
      clearTimeout(timeoutId);
      engine.kill();

      const from = fromAlgebraic(match[1]);
      const to = fromAlgebraic(match[2]);
      res.json({
        move: { from, to },
        algebraic: `${match[1]}${match[2]}`
      });
    }
  });

  engine.stderr.on('data', (data) => {
    console.error(`[Engine Stderr]: ${data.toString()}`);
  });

  engine.on('error', (err) => {
    console.error('Failed to start Fairy-Stockfish:', err);
    clearTimeout(timeoutId);
    if (!res.headersSent) {
      res.status(500).json({ error: 'Failed to start chess engine executable' });
    }
  });

  // Write UCI commands to engine stream
  engine.stdin.write('uci\n');
  engine.stdin.write('setoption name UCI_Variant value makruk\n');
  engine.stdin.write('isready\n');
  engine.stdin.write(`position fen ${fen}\n`);
  engine.stdin.write('go movetime 3000\n'); // Search for 3 seconds
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`Backend server listening on port ${PORT}`);
});
