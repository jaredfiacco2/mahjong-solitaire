// Main Mahjong Solitaire App with enhanced engagement features
import { useState, useEffect, useRef } from 'react';
import { useGameState } from './hooks/useGameState';
import { useStatistics } from './hooks/useStatistics';
import Board from './components/Board';
import Controls from './components/Controls';
import StatsModal from './components/StatsModal';
import WinCelebration from './components/WinCelebration';
import GameOverModal from './components/GameOverModal';
import ParticleSystem from './components/ParticleSystem';
import ComboDisplay from './components/ComboDisplay';
import { useMobile } from './hooks/useMobile';
import './index.css';

function App() {
  const { isMobile, isLandscape } = useMobile();
  const [initialLayoutSet, setInitialLayoutSet] = useState(false);
  const [theme, setTheme] = useState<'ivory' | 'jade'>(() => {
    return (localStorage.getItem('mahjong-theme') as 'ivory' | 'jade') || 'ivory';
  });

  // Apply theme to body
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('mahjong-theme', theme);
  }, [theme]);

  const toggleTheme = () => setTheme(prev => prev === 'ivory' ? 'jade' : 'ivory');

  const {
    gameState,
    freeTiles,
    selectTile,
    newGame,
    undo,
    shuffle,
    showHint,
    canUndo,
    currentLayout,
    elapsedTime,
    lastMatch,
    zoomLevel, // Used for Board scaling
  } = useGameState('turtle');

  // Auto-switch to mobile layout on first load if on mobile
  useEffect(() => {
    if (isMobile && !initialLayoutSet) {
      newGame('mobile-pyramid'); // Classic pyramid - big tiles, heavily stacked
      setInitialLayoutSet(true);
    }
  }, [isMobile, initialLayoutSet, newGame]);



  const {
    statistics,
    recordGameStart,
    recordGameWin,
    resetStatistics,
  } = useStatistics();

  const [showStats, setShowStats] = useState(false);
  const [showLayoutSelector, setShowLayoutSelector] = useState(false);
  const [gameStarted, setGameStarted] = useState(false);
  const [screenShake, setScreenShake] = useState(false);
  const boardContainerRef = useRef<HTMLDivElement>(null);
  const [particleTrigger, setParticleTrigger] = useState<{ x: number; y: number; combo: number } | null>(null);

  // Record game start
  useEffect(() => {
    if (!gameStarted) {
      recordGameStart(currentLayout.id);
      setGameStarted(true);
    }
  }, [currentLayout.id, gameStarted, recordGameStart]);

  // Record win
  useEffect(() => {
    if (gameState.isComplete) {
      recordGameWin(currentLayout.id, elapsedTime);
    }
  }, [gameState.isComplete, currentLayout.id, elapsedTime, recordGameWin]);

  // Trigger particles and screen shake on match
  useEffect(() => {
    if (lastMatch) {
      // Calculate screen position from board position
      const boardEl = boardContainerRef.current;
      if (boardEl) {
        const rect = boardEl.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;

        // Trigger particles at approximate match location
        setParticleTrigger({
          x: centerX + (lastMatch.x - 300) * zoomLevel,
          y: centerY + (lastMatch.y - 200) * zoomLevel,
          combo: lastMatch.combo,
        });
      }

      // Screen shake for combos
      if (lastMatch.combo >= 2) {
        setScreenShake(true);
        setTimeout(() => setScreenShake(false), 200);
      }
    }
  }, [lastMatch, zoomLevel]);

  const handleNewGame = (layoutId?: string) => {
    newGame(layoutId);
    setGameStarted(false);
    setShowLayoutSelector(false);
  };

  const handlePlayAgain = () => {
    newGame();
    setGameStarted(false);
  };

  const handleChangeLayout = () => {
    setShowLayoutSelector(true);
  };

  return (
    <div
      className={`app min-h-screen flex flex-col pt-safe pb-safe ${screenShake ? 'screen-shake' : ''} ${isMobile ? 'mobile-mode' : ''} ${isLandscape ? 'landscape' : 'portrait'}`}
      style={{
        // Screen shake animation
        animation: screenShake ? 'shake 0.2s ease-in-out' : 'none',
      }}
    >
      <header className="hidden">
        <h1>Mahjong Solitaire</h1>
      </header>

      {/* Combo and Score display */}
      <ComboDisplay
        combo={gameState.combo}
        score={gameState.score}
        lastMatchPoints={lastMatch?.points ?? null}
      />

      {/* Particle effects */}
      <ParticleSystem
        trigger={particleTrigger}
        onComplete={() => setParticleTrigger(null)}
      />


      {/* Native pinch-zoom is enabled via CSS - no custom zoom UI needed */}


      <main
        ref={boardContainerRef}
        className="flex-1 flex flex-col"
        style={{
          // Apply zoom level as CSS variable for board scaling
          ['--user-zoom' as string]: zoomLevel,
        }}
      >
        <Board
          tiles={gameState.board.tiles}
          selectedTileId={gameState.selectedTileId}
          hintPair={gameState.hintPair}
          freeTiles={freeTiles}
          onTileClick={selectTile}
          userZoom={zoomLevel}
        />
      </main>

      <Controls
        onHint={showHint}
        onShuffle={shuffle}
        onUndo={undo}
        onNewGame={handleNewGame}
        onShowStats={() => setShowStats(true)}
        onToggleTheme={toggleTheme}
        canUndo={canUndo}
        currentLayout={currentLayout}
        tilesRemaining={gameState.tilesRemaining}
        matchesMade={gameState.matchesMade}
        elapsedTime={elapsedTime}
        isComplete={gameState.isComplete}
        isStuck={gameState.isStuck}
        score={gameState.score}
      />

      {/* Modals */}
      {gameState.isComplete && (
        <WinCelebration
          elapsedTime={elapsedTime}
          matchesMade={gameState.matchesMade}
          score={gameState.score}
          onPlayAgain={handlePlayAgain}
          onChangeLayout={handleChangeLayout}
        />
      )}

      {gameState.isStuck && !gameState.isComplete && (
        <GameOverModal
          onShuffle={shuffle}
          onNewGame={() => handleNewGame()}
        />
      )}

      {showStats && (
        <StatsModal
          statistics={statistics}
          onClose={() => setShowStats(false)}
          onReset={resetStatistics}
        />
      )}

      {showLayoutSelector && (
        <div
          className="modal-overlay"
          onClick={() => setShowLayoutSelector(false)}
        >
          <div
            className="modal-content max-h-[80vh] overflow-y-auto"
            onClick={e => e.stopPropagation()}
          >
            <h2 className="text-xl font-bold mb-4 text-center">Select Layout</h2>
            <div className="space-y-2">
              {[
                { id: 'mobile-pyramid', name: 'Mobile Pyramid' },
                { id: 'tower', name: 'Imperial Tower (Mobile)' },
                { id: 'flat', name: 'Flat (Mobile)' },
                { id: 'simple', name: 'Simple' },
                { id: 'turtle', name: 'Turtle (Classic)' },
                { id: 'large', name: 'Large (Easy View)' },
                { id: 'pyramid', name: 'Pyramid' },

                { id: 'dragon', name: 'Dragon' },
                { id: 'fortress', name: 'Fortress' },
                { id: 'bridge', name: 'Bridge' },
                { id: 'spiral', name: 'Spiral' },
                { id: 'staircase', name: 'Staircase' },
                { id: 'diamond', name: 'Diamond' },
                { id: 'temple', name: 'Temple' },
                { id: 'scatter', name: 'Scatter' },


              ].map(layout => (
                <button
                  key={layout.id}
                  className={`game-button w-full flex items-center justify-between ${currentLayout.id === layout.id ? 'ring-2 ring-[var(--color-accent-gold)]' : ''}`}
                  onClick={() => handleNewGame(layout.id)}
                >
                  <span>{layout.name}</span>
                  {currentLayout.id === layout.id && (
                    <span className="text-xs text-[var(--color-accent-gold)]">Current</span>
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* CSS for screen shake and landscape */}
      <style>{`
                @keyframes shake {
                    0%, 100% { transform: translateX(0); }
                    25% { transform: translateX(-5px) rotate(-0.5deg); }
                    50% { transform: translateX(5px) rotate(0.5deg); }
                    75% { transform: translateX(-3px) rotate(-0.25deg); }
                }
                
                /* Landscape-specific styles */
                @media (orientation: landscape) and (max-height: 600px) {
                    .app {
                        padding-top: 48px;
                        padding-bottom: 56px;
                    }
                    
                    .stats-bar {
                        padding: 4px 8px;
                    }
                    
                    .control-bar {
                        padding: 6px;
                    }
                    
                    .game-button-icon {
                        width: 44px;
                        height: 44px;
                    }
                }
                
                /* Tablet landscape */
                @media (orientation: landscape) and (min-width: 768px) {
                    .board-container {
                        max-height: calc(100vh - 120px);
                    }
                }
            `}</style>
    </div>
  );
}

export default App;
