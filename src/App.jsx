import React, { useState, useEffect } from 'react';
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
  const [error, setError] = useState('');
  
  const buildingTypes = [
    { type: 'general_store', name: 'General Store', color: '#8B4513' },
    { type: 'saloon', name: 'Saloon', color: '#DC143C' },
    { type: 'jail', name: 'Jail', color: '#4B0082' },
    { type: 'bank', name: 'Bank', color: '#FFD700' },
    { type: 'school', name: 'School', color: '#1E90FF' },
    { type: 'stable', name: 'Stable', color: '#228B22' }
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
      { id: 'ja-1', type: 'yes', votes: 1, used: false },
      { id: 'jaa-1', type: 'yes', votes: 2, used: false },
      { id: 'jaaa-1', type: 'yes', votes: 3, used: false },
      { id: 'ne-1', type: 'no', votes: 1, used: false },
      { id: 'nee-1', type: 'no', votes: 2, used: false },
      { id: 'neee-1', type: 'no', votes: 3, used: false },
      { id: 'jeeiin-1', type: 'joker', votes: 2, used: false },
      { id: 'question-1', type: 'question', votes: 0, used: false }
    ];
  };

  const saveGame = async (code, data) => {
    try {
      const key = `game_${code}`;
      const gameData = {
        ...data,
        lastUpdate: Date.now()
      };
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
      setError('Game not found. Make sure the code is correct and that you\'re on the same device/network as the host.');
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
    if (!worker) {
      setError('No active worker for this tile type');
      setTimeout(() => setError(''), 2000);
      return;
    }
    
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

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const joinParam = params.get('join');
    if (joinParam) {
      setJoinCode(joinParam.toUpperCase());
      setShowJoinInput(true);
    }
  }, []);

  if (!gameState) {
    return (
      <div className="min-h-screen bg-amber-50 p-4 sm:p-8">
        <div className="max-w-2xl mx-auto">
          <div className="bg-white rounded-lg shadow-lg p-6 sm:p-8">
            <h1 className="text-3xl sm:text-4xl font-bold text-amber-900 mb-2">Wacky Wacky West</h1>
            <p className="text-amber-700 mb-8">A wild west tile placement game for 2-4 players</p>
            
            {error && (
              <div className={`${error.includes('✓') ? 'bg-green-100 border-green-400 text-green-700' : 'bg-red-100 border-red-400 text-red-700'} border px-4 py-3 rounded mb-4`}>
                {error}
              </div>
            )}
            
            <div className="space-y-4">
              <input
                type="text"
                placeholder="Your name"
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
                className="w-full px-4 py-2 border border-amber-300 rounded focus:outline-none focus:ring-2 focus:ring-amber-500"
                maxLength={20}
              />
              
              <button
                onClick={createGame}
                disabled={loading}
                className="w-full bg-amber-600 hover:bg-amber-700 disabled:bg-amber-400 text-white font-bold py-3 px-4 rounded flex items-center justify-center gap-2 transition"
              >
                <Play size={20} />
                {loading ? 'Creating...' : 'Create New Game'}
              </button>
              
              <div className="text-center text-amber-700 font-medium">or</div>
              
              {!showJoinInput ? (
                <button
                  onClick={() => setShowJoinInput(true)}
                  className="w-full bg-amber-500 hover:bg-amber-600 text-white font-bold py-3 px-4 rounded flex items-center justify-center gap-2 transition"
                >
                  <Users size={20} />
                  Join Existing Game
                </button>
              ) : (
                <div className="space-y-2">
                  <input
                    type="text"
                    placeholder="Game code (e.g. ABC123)"
                    value={joinCode}
                    onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                    className="w-full px-4 py-2 border border-amber-300 rounded focus:outline-none focus:ring-2 focus:ring-amber-500 uppercase"
                    maxLength={6}
                  />
                  <button
                    onClick={joinGame}
                    disabled={loading}
                    className="w-full bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white font-bold py-3 px-4 rounded transition"
                  >
                    {loading ? 'Joining...' : 'Join Game'}
                  </button>
                </div>
              )}
            </div>
            
            <div className="mt-8 text-sm text-amber-700 space-y-2 bg-amber-50 p-4 rounded">
              <p className="font-bold">How to play:</p>
              <ul className="list-disc list-inside space-y-1">
                <li>Each player protects a secret building type</li>
                <li>Place railroad, river, and street tiles</li>
                <li>Tiles destroy buildings they cover</li>
                <li>Vote when outhouses are threatened</li>
                <li>Highest value of your buildings wins!</li>
              </ul>
            </div>
            
            <div className="mt-4 p-3 bg-yellow-50 border border-yellow-300 rounded text-sm text-yellow-800">
              <p className="font-bold mb-1">⚠️ Same-Device Multiplayer</p>
              <p>Currently, all players must be on the same computer or device. Open this link in multiple browser tabs to play!</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (gameState.phase === 'waiting') {
    return (
      <div className="min-h-screen bg-amber-50 p-4 sm:p-8">
        <div className="max-w-2xl mx-auto">
          <div className="bg-white rounded-lg shadow-lg p-6 sm:p-8">
            <h1 className="text-2xl sm:text-3xl font-bold text-amber-900 mb-4">Game Lobby</h1>
            
            <div className="bg-amber-100 border-2 border-amber-500 rounded-lg p-4 mb-4">
              <p className="text-sm text-amber-700 mb-2 font-medium">Game Code:</p>
              <div className="flex items-center gap-2">
                <div className="flex-1 bg-white px-3 py-2 rounded border border-amber-300">
                  <p className="text-3xl font-bold text-amber-900 tracking-wider">{gameId}</p>
                </div>
                <button
                  onClick={copyGameCode}
                  className="bg-amber-600 hover:bg-amber-700 text-white px-4 py-3 rounded flex items-center gap-2 transition"
                >
                  <Copy size={16} />
                </button>
              </div>
              <p className="text-xs text-amber-600 mt-2">Open this page in another tab and use this code to join</p>
            </div>
            
            {error && (
              <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
                {error}
              </div>
            )}
            
            <div className="mb-6">
              <h2 className="text-xl font-bold text-amber-800 mb-3">
                Players ({gameState.players.length}/4)
              </h2>
              <div className="space-y-2">
                {gameState.players.map(player => (
                  <div
                    key={player.id}
                    className={`p-3 rounded ${
                      player.id === playerId ? 'bg-amber-200 border-2 border-amber-500' : 'bg-gray-100'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Users size={20} className="text-amber-700" />
                      <span className="font-medium">{player.name}</span>
                      {player.id === playerId && (
                        <span className="text-xs bg-amber-600 text-white px-2 py-1 rounded">You</span>
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
                className="w-full bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white font-bold py-3 px-4 rounded flex items-center justify-center gap-2 transition"
              >
                <Play size={20} />
                {loading ? 'Starting...' : `Start Game (${gameState.players.length} Players)`}
              </button>
            )}
            
            {gameState.players.length < 2 && (
              <div className="text-center">
                <p className="text-amber-700 mb-2">Waiting for more players...</p>
                <p className="text-sm text-gray-600">Open a new tab to add another player</p>
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
      <div className="min-h-screen bg-amber-50 p-4 sm:p-8">
        <div className="max-w-2xl mx-auto">
          <div className="bg-white rounded-lg shadow-lg p-6 sm:p-8">
            <h1 className="text-2xl sm:text-3xl font-bold text-amber-900 mb-6 text-center">
              🏆 Game Over! 🏆
            </h1>
            
            <div className="space-y-3">
              {scores.map((player, idx) => {
                const building = buildingTypes.find(b => b.type === player.secretBuilding);
                return (
                  <div
                    key={player.id}
                    className={`p-4 rounded-lg ${
                      idx === 0 ? 'bg-yellow-100 border-2 border-yellow-500' : 'bg-gray-100'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 flex-wrap">
                          <span className="text-2xl sm:text-3xl font-bold">#{idx + 1}</span>
                          <div>
                            <div className="font-bold text-base sm:text-lg">{player.name}</div>
                            <div className="text-xs sm:text-sm text-gray-600">
                              Protected: <span style={{ color: building?.color }} className="font-medium">
                                {building?.name}
                              </span>
                            </div>
                          </div>
                          {idx === 0 && <span className="text-2xl sm:text-3xl">👑</span>}
                        </div>
                      </div>
                      <div className="text-3xl sm:text-4xl font-bold text-amber-900">
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
              className="w-full mt-6 bg-amber-600 hover:bg-amber-700 text-white font-bold py-3 px-4 rounded flex items-center justify-center gap-2 transition"
            >
              <RefreshCw size={20} />
              Play Again
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
    <div className="min-h-screen bg-amber-50 p-2 sm:p-4">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-3 sm:p-4 mb-4">
          <div className="flex items-center justify-between flex-wrap gap-2 sm:gap-4 mb-3 sm:mb-4">
            <h1 className="text-xl sm:text-2xl font-bold text-amber-900">Wacky Wacky West</h1>
            <div className="text-xs sm:text-sm">
              Code: <span className="font-bold text-amber-900">{gameId}</span>
            </div>
          </div>
          
          <div className="flex items-center gap-2 flex-wrap mb-3 sm:mb-4">
            {gameState.players.map((player, idx) => (
              <div
                key={player.id}
                className={`px-2 sm:px-4 py-1 sm:py-2 rounded text-xs sm:text-sm font-medium ${
                  idx === gameState.currentPlayerIndex
                    ? 'bg-amber-500 text-white'
                    : 'bg-gray-200 text-gray-700'
                }`}
              >
                {player.name}{player.id === playerId ? ' (You)' : ''}
              </div>
            ))}
          </div>
          
          {isMyTurn && gameState.phase === 'playing' && (
            <div className="bg-green-100 border border-green-400 text-green-800 px-3 py-2 rounded text-sm font-medium">
              🎮 Your turn! Select a tile and place it on the board
            </div>
          )}
          
          {gameState.phase === 'voting' && (
            <div className="bg-red-50 border-2 border-red-400 p-3 sm:p-4 rounded">
              <div className="font-bold text-red-800 mb-2 flex items-center gap-2 text-sm sm:text-base">
                <Vote size={20} />
                Outhouse Demolition Vote!
              </div>
              <div className="text-xs sm:text-sm text-red-700 mb-3">
                Votes: {gameState.votes.length} of {gameState.players.length}
              </div>
              {!gameState.votes.some(v => v.playerId === playerId) && myPlayer && (
                <div className="flex gap-2 flex-wrap">
                  {myPlayer.voteCards.filter(c => !c.used).map(card => (
                    <button
                      key={card.id}
                      onClick={() => submitVote(card)}
                      className={`px-2 sm:px-4 py-1 sm:py-2 rounded text-xs sm:text-sm font-medium transition ${
                        card.type === 'yes'
                          ? 'bg-green-500 hover:bg-green-600 text-white'
                          : card.type === 'no'
                          ? 'bg-red-500 hover:bg-red-600 text-white'
                          : card.type === 'joker'
                          ? 'bg-yellow-500 hover:bg-yellow-600 text-white'
                          : 'bg-gray-500 hover:bg-gray-600 text-white'
                      }`}
                    >
                      {card.type === 'yes' && <Check className="inline mr-1" size={14} />}
                      {card.type === 'no' && <X className="inline mr-1" size={14} />}
                      {card.type === 'question' && <HelpCircle className="inline mr-1" size={14} />}
                      {card.type === 'joker' ? 'Joker' : card.type.toUpperCase()}
                      {card.votes > 0 && ` (${card.votes})`}
                    </button>
                  ))}
                </div>
              )}
              {gameState.votes.some(v => v.playerId === playerId) && (
                <div className="text-green-700 font-medium text-sm">✓ You voted! Waiting for others...</div>
              )}
            </div>
          )}
          
          {error && (
            <div className="mt-3 bg-red-100 border border-red-400 text-red-700 px-3 py-2 rounded text-sm">
              {error}
            </div>
          )}
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
          <div className="lg:col-span-3">
            <div className="bg-white rounded-lg shadow-lg p-2 sm:p-4">
              <div className="overflow-x-auto">
                <div className="inline-block">
                  {gameState.board.map((row, rowIdx) => (
                    <div key={rowIdx} className="flex">
                      {row.map((cell, colIdx) => {
                        const worker = gameState.workers.find(
                          w => w.position[0] === rowIdx && w.position[1] === colIdx
                        );
                        
                        return (
                          <div
                            key={colIdx}
                            onClick={() => isMyTurn && gameState.phase === 'playing' && selectedTile && placeTile(rowIdx, colIdx)}
                            className={`relative w-8 h-8 sm:w-12 sm:h-12 border border-amber-300 flex items-center justify-center text-xs ${
                              isMyTurn && selectedTile && gameState.phase === 'playing' ? 'cursor-pointer' : ''
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
                                  : 'bg-gray-400'
                                : isMyTurn && selectedTile && gameState.phase === 'playing'
                                ? 'bg-amber-50 hover:bg-amber-200'
                                : 'bg-amber-50'
                            }`}
                          >
                            {cell?.type === 'building' && (
                              <div className="text-center">
                                <div
                                  className="w-5 h-5 sm:w-8 sm:h-8 rounded mx-auto"
                                  style={{
                                    backgroundColor: buildingTypes.find(
                                      b => b.type === cell.buildingType
                                    )?.color
                                  }}
                                />
                                <div className="text-xs font-bold mt-0.5">{cell.value}</div>
                              </div>
                            )}
                            {cell?.type === 'outhouse' && (
                              <div className="text-base sm:text-2xl">🚽</div>
                            )}
                            {worker && (
                              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white border-2 border-black rounded-full w-5 h-5 sm:w-8 sm:h-8 flex items-center justify-center text-sm sm:text-lg">
                                👷
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
          
          <div className="space-y-4">
            {myPlayer && (
              <div className="bg-white rounded-lg shadow-lg p-3 sm:p-4">
                <h3 className="font-bold text-amber-900 mb-2 text-xs sm:text-sm">Your Secret Building</h3>
                <div
                  className="p-2 sm:p-3 rounded text-center text-white font-bold text-sm sm:text-base"
                  style={{
                    backgroundColor: buildingTypes.find(b => b.type === myPlayer.secretBuilding)?.color
                  }}
                >
                  {buildingTypes.find(b => b.type === myPlayer.secretBuilding)?.name}
                </div>
              </div>
            )}
            
            {myPlayer && (
              <div className="bg-white rounded-lg shadow-lg p-3 sm:p-4">
                <h3 className="font-bold text-amber-900 mb-2 text-xs sm:text-sm">
                  Your Tiles ({myPlayer.tiles.length})
                </h3>
                <div className="space-y-2 max-h-64 sm:max-h-96 overflow-y-auto">
                  {myPlayer.tiles.map(tile => (
                    <button
                      key={tile.id}
                      onClick={() => setSelectedTile(selectedTile?.id === tile.id ? null : tile)}
                      disabled={!isMyTurn || gameState.phase !== 'playing'}
                      className={`w-full p-2 rounded text-xs sm:text-sm font-medium transition ${
                        selectedTile?.id === tile.id
                          ? 'ring-2 ring-amber-700 scale-105'
                          : ''
                      } ${
                        tile.type === 'railroad'
                          ? 'bg-gray-700 text-white hover:bg-gray-800'
                          : tile.type === 'river'
                          ? 'bg-blue-500 text-white hover:bg-blue-600'
                          : 'bg-gray-500 text-white hover:bg-gray-600'
                      } ${
                        !isMyTurn || gameState.phase !== 'playing'
                          ? 'opacity-50 cursor-not-allowed'
                          : 'cursor-pointer'
                      }`}
                    >
                      {tile.type.charAt(0).toUpperCase() + tile.type.slice(1)} - Size {tile.size}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default App;
