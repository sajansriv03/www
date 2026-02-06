import React, { useState, useEffect, useRef } from 'react';
import { Users, Vote, X, Check, HelpCircle, Play, Copy, RefreshCw } from 'lucide-react';

const App = () => {
  const [gameState, setGameState] = useState(null);
  const [gameId, setGameId] = useState(null);
  const [playerId, setPlayerId] = useState(null);
  const [playerName, setPlayerName] = useState('');
  const [joinCode, setJoinCode] = useState('');
  const [showJoinInput, setShowJoinInput] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedTile, setSelectedTile] = useState(null);
  const [validMoves, setValidMoves] = useState([]);
  const [draggedTile, setDraggedTile] = useState(null);
  const [error, setError] = useState('');
  const [hoveredCell, setHoveredCell] = useState(null);
  
  const buildingTypes = [
    { type: 'general_store', name: 'General Store', color: '#4B0082', emoji: '🏪' }, // PURPLE
    { type: 'saloon', name: 'Saloon', color: '#228B22', emoji: '🍺' }, // GREEN
    { type: 'jail', name: 'Jail', color: '#708090', emoji: '⛓️' }, // GREY
    { type: 'bank', name: 'Bank', color: '#FF8C00', emoji: '🏦' }, // ORANGE
    { type: 'school', name: 'School', color: '#DC143C', emoji: '🏫' }, // PINK/RED
    { type: 'stable', name: 'Stable', color: '#FFD700', emoji: '🐴' } // YELLOW
  ];

  const initializeBoard = () => {
    const board = Array(10).fill(null).map(() => Array(15).fill(null));
    
    const buildingPositions = {
      general_store: [[1,2,1], [8,3,1], [2,7,2], [7,11,3], [4,7,4], [5,8,5]],
      saloon: [[2,1,1], [1,12,2], [8,13,1], [3,8,3], [6,6,4], [5,7,5]],
      jail: [[8,1,1], [7,2,2], [1,10,1], [2,11,3], [4,9,4], [6,8,5]],
      bank: [[3,2,2], [8,11,1], [1,6,3], [7,8,4], [5,6,5], [4,8,4]],
      school: [[2,13,1], [7,1,2], [8,8,3], [3,6,4], [5,9,5], [6,7,4]],
      stable: [[1,1,1], [8,12,2], [2,9,1], [7,7,3], [4,6,4], [6,9,5]]
    };

    Object.entries(buildingPositions).forEach(([type, positions]) => {
      positions.forEach(([row, col, value]) => {
        if (row < 10 && col < 15) {
          board[row][col] = { type: 'building', buildingType: type, value };
        }
      });
    });

    const outhousePositions = [[3,4], [6,3], [2,8], [7,9], [4,11], [5,5], [1,14], [8,6]];
    outhousePositions.forEach(([row, col]) => {
      if (!board[row][col] && row < 10 && col < 15) {
        board[row][col] = { type: 'outhouse' };
      }
    });

    return board;
  };

  const generateTiles = (numPlayers) => {
    const tilesPerPlayer = {
      2: { triple: 6, double: 12, single: 12 },
      3: { triple: 4, double: 8, single: 8 },
      4: { triple: 3, double: 6, single: 6 }
    };
    
    const counts = tilesPerPlayer[numPlayers];
    const allTiles = [];
    
    ['railroad', 'river', 'street'].forEach(tileType => {
      for (let i = 0; i < counts.triple; i++) {
        allTiles.push({ type: tileType, size: 3, id: `${tileType}-3-${i}` });
      }
      for (let i = 0; i < counts.double; i++) {
        allTiles.push({ type: tileType, size: 2, id: `${tileType}-2-${i}` });
      }
      for (let i = 0; i < counts.single; i++) {
        allTiles.push({ type: tileType, size: 1, id: `${tileType}-1-${i}` });
      }
    });
    
    for (let i = allTiles.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [allTiles[i], allTiles[j]] = [allTiles[j], allTiles[i]];
    }
    
    return allTiles;
  };

  const generateVoteCards = () => {
    return [
      { id: 'ja-1', type: 'yes', votes: 1, used: false, label: 'YES!' },
      { id: 'jaa-1', type: 'yes', votes: 2, used: false, label: 'YES!!' },
      { id: 'jaaa-1', type: 'yes', votes: 3, used: false, label: 'YES!!!' },
      { id: 'ne-1', type: 'no', votes: 1, used: false, label: 'NO!' },
      { id: 'nee-1', type: 'no', votes: 2, used: false, label: 'NO!!' },
      { id: 'neee-1', type: 'no', votes: 3, used: false, label: 'NO!!!' },
      { id: 'jeeiin-1', type: 'joker', votes: 2, used: false, label: 'JOKER' },
      { id: 'question-1', type: 'question', votes: 0, used: false, label: '?' }
    ];
  };

  // Calculate valid moves for selected tile
  const calculateValidMoves = (tile, workers, board) => {
    if (!tile) return [];
    
    const worker = workers.find(w => w.active && w.type === tile.type);
    if (!worker) return [];
    
    const [wRow, wCol] = worker.position;
    const moves = [];
    
    // Check all four adjacent positions
    const adjacent = [
      [wRow - 1, wCol], // up
      [wRow + 1, wCol], // down
      [wRow, wCol - 1], // left
      [wRow, wCol + 1]  // right
    ];
    
    adjacent.forEach(([row, col]) => {
      if (row < 0 || row >= 10 || col < 0 || col >= 15) return;
      if (board[row][col]?.type === 'tile') return;
      
      // Check if tile fits
      let canPlace = true;
      const cells = [];
      
      for (let i = 0; i < tile.size; i++) {
        let checkRow = row;
        let checkCol = col;
        
        if (col > wCol) checkCol = col + i;
        else if (col < wCol) checkCol = col - i;
        else if (row > wRow) checkRow = row + i;
        else if (row < wRow) checkRow = row - i;
        
        if (checkRow < 0 || checkRow >= 10 || checkCol < 0 || checkCol >= 15) {
          canPlace = false;
          break;
        }
        
        if (board[checkRow][checkCol]?.type === 'tile') {
          canPlace = false;
          break;
        }
        
        cells.push([checkRow, checkCol]);
      }
      
      if (canPlace) {
        moves.push({ row, col, cells });
      }
    });
    
    return moves;
  };

  // Update valid moves when tile selected
  useEffect(() => {
    if (selectedTile && gameState) {
      const moves = calculateValidMoves(selectedTile, gameState.workers, gameState.board);
      setValidMoves(moves);
    } else {
      setValidMoves([]);
    }
  }, [selectedTile, gameState]);

  const saveGame = async (code, data) => {
    try {
      const key = `game_${code}`;
      const gameData = { ...data, lastUpdate: Date.now() };
      localStorage.setItem(key, JSON.stringify(gameData));
      return true;
    } catch (err) {
      console.error('Save error:', err);
      return false;
    }
  };

  const loadGame = async (code) => {
    try {
      const key = `game_${code}`;
      const data = localStorage.getItem(key);
      return data ? JSON.parse(data) : null;
    } catch (err) {
      console.error('Load error:', err);
      return null;
    }
  };

  const createGame = async () => {
    if (!playerName.trim()) {
      setError('Please enter your name');
      return;
    }
    
    setLoading(true);
    setError('');
    
    const newGameId = Math.random().toString(36).substring(2, 8).toUpperCase();
    const newPlayerId = Math.random().toString(36).substring(2, 10);
    
    const newGame = {
      id: newGameId,
      players: [{
        id: newPlayerId,
        name: playerName,
        secretBuilding: null,
        tiles: [],
        voteCards: generateVoteCards(),
        ready: false
      }],
      board: initializeBoard(),
      currentPlayerIndex: 0,
      workers: [
        { type: 'railroad', position: [9, 0], active: true },
        { type: 'railroad', position: [0, 14], active: true },
        { type: 'river', position: [0, 0], active: true },
        { type: 'street', position: [9, 14], active: true }
      ],
      placedTiles: [],
      phase: 'waiting',
      votingTile: null,
      votes: [],
      turn: 0,
      lastUpdate: Date.now()
    };
    
    await saveGame(newGameId, newGame);
    setGameId(newGameId);
    setPlayerId(newPlayerId);
    setGameState(newGame);
    setLoading(false);
  };

  const joinGame = async () => {
    if (!playerName.trim() || !joinCode.trim()) {
      setError('Please enter your name and game code');
      return;
    }
    
    setLoading(true);
    setError('');
    
    const game = await loadGame(joinCode.toUpperCase());
    
    if (!game) {
      setError('Game not found. Open this page in another tab to add players.');
      setLoading(false);
      return;
    }
    
    if (game.players.length >= 4) {
      setError('Game is full (4 players max)');
      setLoading(false);
      return;
    }
    
    if (game.phase !== 'waiting') {
      setError('Game already started');
      setLoading(false);
      return;
    }
    
    const newPlayerId = Math.random().toString(36).substring(2, 10);
    game.players.push({
      id: newPlayerId,
      name: playerName,
      secretBuilding: null,
      tiles: [],
      voteCards: generateVoteCards(),
      ready: false
    });
    game.lastUpdate = Date.now();
    
    await saveGame(joinCode.toUpperCase(), game);
    setGameId(joinCode.toUpperCase());
    setPlayerId(newPlayerId);
    setGameState(game);
    setLoading(false);
  };

  useEffect(() => {
    if (!gameId) return;
    
    const interval = setInterval(async () => {
      const updated = await loadGame(gameId);
      if (updated && updated.lastUpdate > (gameState?.lastUpdate || 0)) {
        setGameState(updated);
      }
    }, 1000);
    
    return () => clearInterval(interval);
  }, [gameId, gameState?.lastUpdate]);

  const startGame = async () => {
    if (gameState.players.length < 2) {
      setError('Need at least 2 players to start');
      return;
    }
    
    setLoading(true);
    
    const shuffledBuildings = [...buildingTypes].sort(() => Math.random() - 0.5);
    const tiles = generateTiles(gameState.players.length);
    const tilesPerPlayer = tiles.length / gameState.players.length;
    
    gameState.players.forEach((player, idx) => {
      player.secretBuilding = shuffledBuildings[idx].type;
      player.tiles = tiles.slice(idx * tilesPerPlayer, (idx + 1) * tilesPerPlayer);
      player.ready = true;
    });
    
    gameState.phase = 'playing';
    gameState.lastUpdate = Date.now();
    
    await saveGame(gameId, gameState);
    setGameState({...gameState});
    setLoading(false);
  };

  const placeTile = async (row, col) => {
    if (!selectedTile) return;
    if (gameState.currentPlayerIndex !== gameState.players.findIndex(p => p.id === playerId)) {
      setError('Not your turn!');
      setTimeout(() => setError(''), 2000);
      return;
    }
    
    const tile = selectedTile;
    const worker = gameState.workers.find(w => w.active && w.type === tile.type);
    if (!worker) return;
    
    const [wRow, wCol] = worker.position;
    const isAdjacent = (Math.abs(row - wRow) === 1 && col === wCol) || 
                      (Math.abs(col - wCol) === 1 && row === wRow);
    
    if (!isAdjacent) {
      setError('Must place adjacent to worker');
      setTimeout(() => setError(''), 2000);
      return;
    }
    
    let coversOuthouse = false;
    for (let i = 0; i < tile.size; i++) {
      let checkRow = row;
      let checkCol = col;
      
      if (col > wCol) checkCol = col + i;
      else if (col < wCol) checkCol = col - i;
      else if (row > wRow) checkRow = row + i;
      else if (row < wRow) checkRow = row - i;
      
      if (checkRow >= 0 && checkRow < 10 && checkCol >= 0 && checkCol < 15) {
        if (gameState.board[checkRow][checkCol]?.type === 'outhouse') {
          coversOuthouse = true;
          break;
        }
      }
    }
    
    if (coversOuthouse) {
      gameState.phase = 'voting';
      gameState.votingTile = { tile, row, col, playerId };
      gameState.votes = [];
      gameState.lastUpdate = Date.now();
      await saveGame(gameId, gameState);
      setGameState({...gameState});
      return;
    }
    
    await executePlacement(tile, row, col);
  };

  const executePlacement = async (tile, row, col) => {
    const worker = gameState.workers.find(w => w.active && w.type === tile.type);
    const [wRow, wCol] = worker.position;
    
    let newRow = row;
    let newCol = col;
    
    for (let i = 0; i < tile.size; i++) {
      if (col > wCol) newCol = col + i;
      else if (col < wCol) newCol = col - i;
      else if (row > wRow) newRow = row + i;
      else if (row < wRow) newRow = row - i;
      
      if (newRow >= 0 && newRow < 10 && newCol >= 0 && newCol < 15) {
        gameState.board[newRow][newCol] = { type: 'tile', tileType: tile.type };
      }
    }
    
    worker.position = [newRow, newCol];
    
    const adjacentSquares = [
      [newRow - 1, newCol],
      [newRow + 1, newCol],
      [newRow, newCol - 1],
      [newRow, newCol + 1]
    ];
    
    const allCovered = adjacentSquares.every(([r, c]) => {
      if (r < 0 || r >= 10 || c < 0 || c >= 15) return true;
      return gameState.board[r][c]?.type === 'tile';
    });
    
    if (allCovered) worker.active = false;
    
    const currentPlayer = gameState.players[gameState.currentPlayerIndex];
    currentPlayer.tiles = currentPlayer.tiles.filter(t => t.id !== tile.id);
    
    gameState.currentPlayerIndex = (gameState.currentPlayerIndex + 1) % gameState.players.length;
    gameState.turn++;
    
    const allPlayersOutOfTiles = gameState.players.every(p => p.tiles.length === 0);
    const allWorkersInactive = gameState.workers.every(w => !w.active);
    
    if (allPlayersOutOfTiles || allWorkersInactive) {
      gameState.phase = 'ended';
    }
    
    setSelectedTile(null);
    setValidMoves([]);
    gameState.lastUpdate = Date.now();
    await saveGame(gameId, gameState);
    setGameState({...gameState});
  };

  const submitVote = async (voteCard) => {
    if (gameState.phase !== 'voting') return;
    
    const playerIdx = gameState.players.findIndex(p => p.id === playerId);
    if (gameState.votes.some(v => v.playerId === playerId)) {
      setError('Already voted!');
      setTimeout(() => setError(''), 2000);
      return;
    }
    
    gameState.votes.push({ playerId, card: voteCard });
    
    if (voteCard.type !== 'question') {
      const player = gameState.players[playerIdx];
      const cardIdx = player.voteCards.findIndex(c => c.id === voteCard.id);
      player.voteCards[cardIdx].used = true;
    }
    
    gameState.lastUpdate = Date.now();
    await saveGame(gameId, gameState);
    setGameState({...gameState});
    
    if (gameState.votes.length === gameState.players.length) {
      setTimeout(() => resolveVote(), 1500);
    }
  };

  const resolveVote = async () => {
    let yesVotes = 0;
    let noVotes = 0;
    
    gameState.votes.forEach(vote => {
      if (vote.card.type === 'yes') yesVotes += vote.card.votes;
      else if (vote.card.type === 'no') noVotes += vote.card.votes;
    });
    
    const jokerVotes = gameState.votes.filter(v => v.card.type === 'joker');
    jokerVotes.forEach(() => {
      if (yesVotes > noVotes) noVotes += 2;
      else yesVotes += 2;
    });
    
    const approved = yesVotes > noVotes;
    
    if (approved) {
      const { tile, row, col } = gameState.votingTile;
      await executePlacement(tile, row, col);
    } else {
      gameState.currentPlayerIndex = (gameState.currentPlayerIndex + 1) % gameState.players.length;
    }
    
    gameState.phase = 'playing';
    gameState.votingTile = null;
    gameState.votes = [];
    gameState.lastUpdate = Date.now();
    
    await saveGame(gameId, gameState);
    setGameState({...gameState});
  };

  const calculateScores = () => {
    return gameState.players.map(player => {
      let score = 0;
      const buildingType = player.secretBuilding;
      
      gameState.board.forEach(row => {
        row.forEach(cell => {
          if (cell?.type === 'building' && cell.buildingType === buildingType) {
            score += cell.value;
          }
        });
      });
      
      return { ...player, score };
    }).sort((a, b) => b.score - a.score);
  };

  const copyGameCode = () => {
    navigator.clipboard.writeText(gameId);
    setError('✓ Game code copied!');
    setTimeout(() => setError(''), 2000);
  };

  const handleTileDragStart = (tile) => {
    setDraggedTile(tile);
    setSelectedTile(tile);
  };

  const handleTileDragEnd = () => {
    setDraggedTile(null);
  };

  const handleCellDrop = (row, col) => {
    if (draggedTile) {
      placeTile(row, col);
      setDraggedTile(null);
    }
  };

  // Check if cell is a valid move
  const isValidMove = (row, col) => {
    return validMoves.some(move => move.row === row && move.col === col);
  };

  // Check if cell is part of valid move preview
  const isInMovePreview = (row, col) => {
    if (!hoveredCell) return false;
    const move = validMoves.find(m => m.row === hoveredCell[0] && m.col === hoveredCell[1]);
    return move?.cells.some(([r, c]) => r === row && c === col);
  };

  if (!gameState) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-100 via-orange-50 to-yellow-100 p-4 sm:p-8">
        <div className="max-w-2xl mx-auto">
          <div className="bg-white/90 backdrop-blur rounded-xl shadow-2xl p-6 sm:p-8 border-4 border-amber-600">
            <div className="text-center mb-6">
              <h1 className="text-4xl sm:text-5xl font-black text-amber-900 mb-2 drop-shadow-lg">
                🤠 Wacky Wacky West 🌵
              </h1>
              <p className="text-amber-700 font-semibold">Wild West Tile Placement Game</p>
            </div>
            
            {error && (
              <div className={`${error.includes('✓') ? 'bg-green-100 border-green-400 text-green-700' : 'bg-red-100 border-red-400 text-red-700'} border-2 px-4 py-3 rounded-lg mb-4 font-medium`}>
                {error}
              </div>
            )}
            
            <div className="space-y-4">
              <input
                type="text"
                placeholder="Your name (Sheriff, Outlaw, etc.)"
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
                className="w-full px-4 py-3 border-2 border-amber-400 rounded-lg focus:outline-none focus:ring-4 focus:ring-amber-300 text-lg font-medium"
                maxLength={20}
              />
              
              <button
                onClick={createGame}
                disabled={loading}
                className="w-full bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 disabled:from-gray-400 disabled:to-gray-500 text-white font-bold py-4 px-6 rounded-lg flex items-center justify-center gap-3 transition-all shadow-lg hover:shadow-xl transform hover:scale-105"
              >
                <Play size={24} />
                <span className="text-lg">{loading ? 'Creating Game...' : 'Create New Game'}</span>
              </button>
              
              <div className="text-center">
                <span className="bg-amber-200 px-4 py-2 rounded-full font-bold text-amber-900">OR</span>
              </div>
              
              {!showJoinInput ? (
                <button
                  onClick={() => setShowJoinInput(true)}
                  className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-bold py-4 px-6 rounded-lg flex items-center justify-center gap-3 transition-all shadow-lg hover:shadow-xl transform hover:scale-105"
                >
                  <Users size={24} />
                  <span className="text-lg">Join Existing Game</span>
                </button>
              ) : (
                <div className="space-y-3">
                  <input
                    type="text"
                    placeholder="Game Code (ABC123)"
                    value={joinCode}
                    onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                    className="w-full px-4 py-3 border-2 border-green-400 rounded-lg focus:outline-none focus:ring-4 focus:ring-green-300 text-lg font-bold text-center uppercase tracking-widest"
                    maxLength={6}
                  />
                  <button
                    onClick={joinGame}
                    disabled={loading}
                    className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white font-bold py-3 px-6 rounded-lg transition-all shadow-lg"
                  >
                    {loading ? 'Joining...' : 'Join Game'}
                  </button>
                </div>
              )}
            </div>
            
            <div className="mt-8 p-6 bg-amber-50 rounded-xl border-2 border-amber-300">
              <h3 className="font-bold text-amber-900 mb-3 text-lg">🎯 How to Play:</h3>
              <ul className="space-y-2 text-sm text-amber-800">
                <li className="flex items-start gap-2">
                  <span className="text-lg">🏛️</span>
                  <span>Protect your secret building type</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-lg">🛤️</span>
                  <span>Drag & drop tiles to destroy rival buildings</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-lg">🗳️</span>
                  <span>Vote when someone tries to demolish an outhouse</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-lg">🏆</span>
                  <span>Highest value of your buildings wins!</span>
                </li>
              </ul>
            </div>
            
            <div className="mt-4 p-4 bg-yellow-50 border-2 border-yellow-300 rounded-lg text-sm text-yellow-800">
              <p className="font-bold mb-1">💻 Same-Device Multiplayer</p>
              <p>Open this page in multiple browser tabs to play with friends on the same computer!</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (gameState.phase === 'waiting') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-100 via-orange-50 to-yellow-100 p-4 sm:p-8">
        <div className="max-w-2xl mx-auto">
          <div className="bg-white/90 backdrop-blur rounded-xl shadow-2xl p-6 sm:p-8 border-4 border-amber-600">
            <h1 className="text-3xl font-black text-amber-900 mb-6 text-center">🤠 Game Lobby</h1>
            
            <div className="bg-gradient-to-r from-amber-500 to-orange-500 rounded-xl p-6 mb-6 shadow-lg">
              <p className="text-white font-bold mb-3 text-center text-sm">SHARE THIS CODE:</p>
              <div className="flex items-center gap-3">
                <div className="flex-1 bg-white px-6 py-4 rounded-lg">
                  <p className="text-4xl font-black text-amber-900 tracking-widest text-center">{gameId}</p>
                </div>
                <button
                  onClick={copyGameCode}
                  className="bg-white hover:bg-gray-100 text-amber-900 p-4 rounded-lg transition shadow-lg"
                >
                  <Copy size={24} />
                </button>
              </div>
              <p className="text-white/90 text-xs mt-3 text-center">Open in another tab and use this code to join</p>
            </div>
            
            {error && (
              <div className="bg-green-100 border-2 border-green-400 text-green-700 px-4 py-3 rounded-lg mb-4 font-medium">
                {error}
              </div>
            )}
            
            <div className="mb-6">
              <h2 className="text-xl font-bold text-amber-800 mb-4 flex items-center gap-2">
                <Users className="text-amber-600" />
                Players ({gameState.players.length}/4)
              </h2>
              <div className="space-y-3">
                {gameState.players.map((player, idx) => (
                  <div
                    key={player.id}
                    className={`p-4 rounded-lg transform transition-all ${
                      player.id === playerId 
                        ? 'bg-gradient-to-r from-amber-400 to-orange-400 border-2 border-amber-600 scale-105 shadow-lg' 
                        : 'bg-gray-100 border-2 border-gray-300'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg ${
                        player.id === playerId ? 'bg-white text-amber-900' : 'bg-gray-300 text-gray-700'
                      }`}>
                        {idx + 1}
                      </div>
                      <span className={`font-bold text-lg ${player.id === playerId ? 'text-white' : 'text-gray-800'}`}>
                        {player.name}
                      </span>
                      {player.id === playerId && (
                        <span className="ml-auto bg-white text-amber-900 px-3 py-1 rounded-full text-sm font-bold">
                          YOU
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            {gameState.players.length >= 2 && gameState.players[0].id === playerId && (
              <button
                onClick={startGame}
                disabled={loading}
                className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 disabled:from-gray-400 disabled:to-gray-500 text-white font-bold py-4 px-6 rounded-xl flex items-center justify-center gap-3 transition-all shadow-lg hover:shadow-xl transform hover:scale-105"
              >
                <Play size={24} />
                <span className="text-lg">{loading ? 'Starting...' : `Start Game (${gameState.players.length} Players)`}</span>
              </button>
            )}
            
            {gameState.players.length < 2 && (
              <div className="text-center p-6 bg-amber-50 rounded-xl border-2 border-amber-200">
                <p className="text-amber-800 font-medium mb-2">⏳ Waiting for more players...</p>
                <p className="text-sm text-amber-600">Need at least 2 players to start</p>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (gameState.phase === 'ended') {
    const scores = calculateScores();
    
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-100 via-orange-50 to-yellow-100 p-4 sm:p-8">
        <div className="max-w-2xl mx-auto">
          <div className="bg-white/90 backdrop-blur rounded-xl shadow-2xl p-6 sm:p-8 border-4 border-amber-600">
            <h1 className="text-4xl font-black text-amber-900 mb-8 text-center">
              🏆 GAME OVER! 🏆
            </h1>
            
            <div className="space-y-4">
              {scores.map((player, idx) => {
                const building = buildingTypes.find(b => b.type === player.secretBuilding);
                return (
                  <div
                    key={player.id}
                    className={`p-6 rounded-xl transform transition-all ${
                      idx === 0 
                        ? 'bg-gradient-to-r from-yellow-400 via-yellow-300 to-yellow-400 border-4 border-yellow-600 scale-105 shadow-2xl' 
                        : 'bg-gray-100 border-2 border-gray-300'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className={`w-16 h-16 rounded-full flex items-center justify-center font-black text-3xl ${
                          idx === 0 ? 'bg-white text-yellow-900' : 'bg-gray-300 text-gray-700'
                        }`}>
                          #{idx + 1}
                        </div>
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className={`font-black text-xl ${idx === 0 ? 'text-yellow-900' : 'text-gray-800'}`}>
                              {player.name}
                            </span>
                            {idx === 0 && <span className="text-3xl">👑</span>}
                          </div>
                          <div className="text-sm flex items-center gap-2">
                            <span className={idx === 0 ? 'text-yellow-800' : 'text-gray-600'}>Protected:</span>
                            <span className="font-bold" style={{ color: building?.color }}>
                              {building?.emoji} {building?.name}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className={`text-5xl font-black ${idx === 0 ? 'text-yellow-900' : 'text-gray-700'}`}>
                        {player.score}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            
            <button
              onClick={() => {
                setGameState(null);
                setGameId(null);
                setPlayerId(null);
                setPlayerName('');
              }}
              className="w-full mt-8 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white font-bold py-4 px-6 rounded-xl flex items-center justify-center gap-3 transition-all shadow-lg hover:shadow-xl transform hover:scale-105"
            >
              <RefreshCw size={24} />
              <span className="text-lg">Play Again</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  const currentPlayer = gameState.players[gameState.currentPlayerIndex];
  const myPlayer = gameState.players.find(p => p.id === playerId);
  const isMyTurn = currentPlayer?.id === playerId;
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-100 via-orange-50 to-yellow-100 p-2 sm:p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white/90 backdrop-blur rounded-xl shadow-lg p-3 sm:p-4 mb-4 border-2 border-amber-500">
          <div className="flex items-center justify-between flex-wrap gap-2 sm:gap-4 mb-3">
            <h1 className="text-xl sm:text-2xl font-black text-amber-900">🤠 Wacky Wacky West</h1>
            <div className="text-xs sm:text-sm font-bold">
              Code: <span className="text-amber-900 bg-amber-200 px-2 py-1 rounded">{gameId}</span>
            </div>
          </div>
          
          <div className="flex items-center gap-2 flex-wrap mb-3">
            {gameState.players.map((player, idx) => (
              <div
                key={player.id}
                className={`px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-bold transition-all ${
                  idx === gameState.currentPlayerIndex
                    ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-lg scale-110'
                    : 'bg-gray-200 text-gray-700'
                }`}
              >
                {player.name}{player.id === playerId ? ' (You)' : ''}
                {idx === gameState.currentPlayerIndex && ' 🎯'}
              </div>
            ))}
          </div>
          
          {isMyTurn && gameState.phase === 'playing' && (
            <div className="bg-gradient-to-r from-green-500 to-emerald-500 text-white px-4 py-3 rounded-lg text-sm font-bold flex items-center gap-2 shadow-lg animate-pulse">
              <span className="text-2xl">🎮</span>
              <span>YOUR TURN! {selectedTile ? 'Click a highlighted spot or drag your tile' : 'Select a tile to play'}</span>
            </div>
          )}
          
          {gameState.phase === 'voting' && (
            <div className="bg-gradient-to-r from-red-500 to-rose-500 text-white p-4 rounded-xl shadow-lg border-2 border-red-700">
              <div className="font-black mb-2 flex items-center gap-2 text-base sm:text-lg">
                <Vote size={24} />
                🚽 OUTHOUSE DEMOLITION VOTE! 🚽
              </div>
              <div className="text-sm mb-3 font-medium">
                Votes: {gameState.votes.length} of {gameState.players.length}
              </div>
              {!gameState.votes.some(v => v.playerId === playerId) && myPlayer && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {myPlayer.voteCards.filter(c => !c.used).map(card => (
                    <button
                      key={card.id}
                      onClick={() => submitVote(card)}
                      className={`px-3 py-3 rounded-lg font-black text-sm transition-all transform hover:scale-110 shadow-lg ${
                        card.type === 'yes'
                          ? 'bg-green-500 hover:bg-green-600 text-white'
                          : card.type === 'no'
                          ? 'bg-red-600 hover:bg-red-700 text-white'
                          : card.type === 'joker'
                          ? 'bg-yellow-500 hover:bg-yellow-600 text-white'
                          : 'bg-gray-600 hover:bg-gray-700 text-white'
                      }`}
                    >
                      {card.type === 'yes' && <Check className="inline mr-1" size={16} />}
                      {card.type === 'no' && <X className="inline mr-1" size={16} />}
                      {card.type === 'question' && <HelpCircle className="inline mr-1" size={16} />}
                      {card.label}
                      {card.votes > 0 && <div className="text-xs">({card.votes} votes)</div>}
                    </button>
                  ))}
                </div>
              )}
              {gameState.votes.some(v => v.playerId === playerId) && (
                <div className="text-white font-bold bg-green-600 p-3 rounded-lg">
                  ✓ You voted! Waiting for others...
                </div>
              )}
            </div>
          )}
          
          {error && (
            <div className="mt-3 bg-red-100 border-2 border-red-400 text-red-700 px-4 py-2 rounded-lg font-medium">
              {error}
            </div>
          )}
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
          {/* Game Board */}
          <div className="lg:col-span-3">
            <div className="bg-white/90 backdrop-blur rounded-xl shadow-lg p-2 sm:p-4 border-2 border-amber-500">
              <div className="overflow-x-auto">
                <div className="inline-block">
                  {gameState.board.map((row, rowIdx) => (
                    <div key={rowIdx} className="flex">
                      {row.map((cell, colIdx) => {
                        const worker = gameState.workers.find(
                          w => w.position[0] === rowIdx && w.position[1] === colIdx
                        );
                        const validMove = isValidMove(rowIdx, colIdx);
                        const inPreview = isInMovePreview(rowIdx, colIdx);
                        
                        return (
                          <div
                            key={colIdx}
                            onClick={() => isMyTurn && gameState.phase === 'playing' && selectedTile && placeTile(rowIdx, colIdx)}
                            onDragOver={(e) => {
                              if (draggedTile && validMove) {
                                e.preventDefault();
                                setHoveredCell([rowIdx, colIdx]);
                              }
                            }}
                            onDragLeave={() => setHoveredCell(null)}
                            onDrop={() => handleCellDrop(rowIdx, colIdx)}
                            className={`relative w-10 h-10 sm:w-14 sm:h-14 border-2 flex items-center justify-center text-xs transition-all ${
                              validMove
                                ? 'border-green-400 bg-green-100 cursor-pointer hover:bg-green-200 shadow-lg ring-2 ring-green-500 animate-pulse'
                                : inPreview
                                ? 'border-yellow-400 bg-yellow-100 ring-2 ring-yellow-500'
                                : 'border-amber-300'
                            } ${
                              cell?.type === 'building'
                                ? 'bg-amber-100'
                                : cell?.type === 'outhouse'
                                ? 'bg-purple-200'
                                : cell?.type === 'tile'
                                ? cell.tileType === 'railroad'
                                  ? 'bg-gray-700'
                                  : cell.tileType === 'river'
                                  ? 'bg-blue-400'
                                  : 'bg-gray-500'
                                : 'bg-amber-50'
                            }`}
                          >
                            {cell?.type === 'building' && (
                              <div className="text-center">
                                <div
                                  className="w-6 h-6 sm:w-10 sm:h-10 rounded-lg mx-auto shadow-md flex items-center justify-center text-lg sm:text-2xl"
                                  style={{
                                    backgroundColor: buildingTypes.find(
                                      b => b.type === cell.buildingType
                                    )?.color
                                  }}
                                >
                                  {buildingTypes.find(b => b.type === cell.buildingType)?.emoji}
                                </div>
                                <div className="text-xs font-black mt-1 bg-white rounded px-1">{cell.value}</div>
                              </div>
                            )}
                            {cell?.type === 'outhouse' && (
                              <div className="text-2xl sm:text-3xl drop-shadow-lg">🚽</div>
                            )}
                            {cell?.type === 'tile' && (
                              <div className="text-white text-xs font-bold">
                                {cell.tileType === 'railroad' && '🛤️'}
                                {cell.tileType === 'river' && '🌊'}
                                {cell.tileType === 'street' && '🛣️'}
                              </div>
                            )}
                            {worker && (
                              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white border-3 border-black rounded-full w-8 h-8 sm:w-12 sm:h-12 flex items-center justify-center text-xl sm:text-3xl shadow-xl">
                                👷
                              </div>
                            )}
                            {validMove && (
                              <div className="absolute inset-0 bg-green-400 bg-opacity-30 flex items-center justify-center">
                                <div className="w-4 h-4 bg-green-500 rounded-full shadow-lg"></div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
          
          {/* Sidebar */}
          <div className="space-y-4">
            {/* Secret Building */}
            {myPlayer && (
              <div className="bg-white/90 backdrop-blur rounded-xl shadow-lg p-4 border-2 border-amber-500">
                <h3 className="font-black text-amber-900 mb-2 text-sm">🤫 YOUR SECRET BUILDING</h3>
                <div
                  className="p-4 rounded-lg text-center text-white font-black shadow-lg transform hover:scale-105 transition-all"
                  style={{
                    background: `linear-gradient(135deg, ${buildingTypes.find(b => b.type === myPlayer.secretBuilding)?.color} 0%, ${buildingTypes.find(b => b.type === myPlayer.secretBuilding)?.color}dd 100%)`
                  }}
                >
                  <div className="text-4xl mb-2">
                    {buildingTypes.find(b => b.type === myPlayer.secretBuilding)?.emoji}
                  </div>
                  <div className="text-lg">
                    {buildingTypes.find(b => b.type === myPlayer.secretBuilding)?.name}
                  </div>
                </div>
              </div>
            )}
            
            {/* Player's Tiles */}
            {myPlayer && (
              <div className="bg-white/90 backdrop-blur rounded-xl shadow-lg p-4 border-2 border-amber-500">
                <h3 className="font-black text-amber-900 mb-3 text-sm flex items-center justify-between">
                  <span>🎴 YOUR TILES</span>
                  <span className="bg-amber-200 px-2 py-1 rounded">{myPlayer.tiles.length}</span>
                </h3>
                <div className="space-y-2 max-h-64 sm:max-h-96 overflow-y-auto">
                  {myPlayer.tiles.map(tile => (
                    <div
                      key={tile.id}
                      draggable={isMyTurn && gameState.phase === 'playing'}
                      onDragStart={() => handleTileDragStart(tile)}
                      onDragEnd={handleTileDragEnd}
                      onClick={() => isMyTurn && gameState.phase === 'playing' && setSelectedTile(selectedTile?.id === tile.id ? null : tile)}
                      className={`p-3 rounded-lg text-sm font-bold transition-all cursor-pointer transform ${
                        selectedTile?.id === tile.id
                          ? 'ring-4 ring-yellow-400 scale-105 shadow-2xl'
                          : 'hover:scale-105 shadow-lg'
                      } ${
                        tile.type === 'railroad'
                          ? 'bg-gradient-to-r from-gray-700 to-gray-900 text-white'
                          : tile.type === 'river'
                          ? 'bg-gradient-to-r from-blue-500 to-blue-700 text-white'
                          : 'bg-gradient-to-r from-gray-500 to-gray-700 text-white'
                      } ${
                        !isMyTurn || gameState.phase !== 'playing'
                          ? 'opacity-50 cursor-not-allowed'
                          : ''
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span>
                          {tile.type === 'railroad' && '🛤️'} 
                          {tile.type === 'river' && '🌊'} 
                          {tile.type === 'street' && '🛣️'} 
                          {tile.type.charAt(0).toUpperCase() + tile.type.slice(1)}
                        </span>
                        <span className="bg-white text-gray-900 px-2 py-1 rounded text-xs">
                          Size {tile.size}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
                {selectedTile && validMoves.length > 0 && (
                  <div className="mt-3 p-2 bg-green-100 border-2 border-green-400 rounded-lg text-xs text-green-900 font-bold">
                    ✨ {validMoves.length} valid move{validMoves.length > 1 ? 's' : ''} highlighted!
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default App;
