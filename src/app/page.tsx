
"use client";

import React, { useState } from 'react';
import { useBattleshipGame } from '@/hooks/useBattleshipGame';
import GameBoard from '@/components/game/GameBoard';
import PlayerStats from '@/components/game/PlayerStats';
import SetupPhaseControls from '@/components/game/SetupPhaseControls';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { SHIP_DEFINITIONS } from '@/config/game-config';
import type { Coordinate } from '@/types/battleship';
import ShipKey from '@/components/game/ShipKey'; // Import ShipKey
import { RefreshCcw } from 'lucide-react';

export default function SchonkenshipGamePage() {
  const {
    gameState,
    resetGame,
    selectShipToPlace,
    toggleOrientation,
    placePlayerShip,
    randomizePlayerShips,
    startGame,
    handlePlayerAttack,
    canDonePlacement,
  } = useBattleshipGame();

  const [hoveredCell, setHoveredCell] = useState<Coordinate | null>(null);

  const getPlacementPreview = (): Coordinate[] => {
    if (gameState.phase !== 'setup' || !gameState.selectedShipDefId || !hoveredCell) {
      return [];
    }
    const shipDef = SHIP_DEFINITIONS.find(s => s.id === gameState.selectedShipDefId);
    if (!shipDef || gameState.playerShips.ships.some(s => s.definitionId === shipDef.id)) {
      return []; // Ship already placed or no ship selected
    }
    // This is a simplified preview. Real validation happens in placePlayerShip.
    const coords: Coordinate[] = [];
    for (let i = 0; i < shipDef.size; i++) {
      if (gameState.shipOrientation === 'horizontal') {
        coords.push({ x: hoveredCell.x + i, y: hoveredCell.y });
      } else {
        coords.push({ x: hoveredCell.x, y: hoveredCell.y + i });
      }
    }
    return coords;
  };
  
  const handlePlayerBoardCellClick = (coord: Coordinate) => {
    if (gameState.phase === 'setup') {
      placePlayerShip(coord);
    }
    // No action during 'playing' or 'gameOver' on player's own board
  };

  const handleAiBoardCellClick = (coord: Coordinate) => {
    if (gameState.phase === 'playing' && gameState.currentPlayer === 'player') {
      handlePlayerAttack(coord);
    }
  };


  return (
    <div className="container mx-auto p-4 min-h-screen flex flex-col items-center bg-background text-foreground">
      <header className="mb-6 text-center">
        <h1 className="text-4xl font-bold text-primary">Schonkenship v2</h1>
        <p className="text-muted-foreground">{gameState.statusMessage}</p>
        {gameState.isAiThinking && <p className="text-sm text-accent animate-pulse">AI is thinking...</p>}
      </header>

      {gameState.phase === 'gameOver' && (
        <Card className="mb-6 w-full max-w-md text-center shadow-xl">
          <CardHeader>
            <CardTitle className="text-2xl">Game Over!</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xl mb-4">
              {gameState.winner === 'player' ? '🎉 You Win! 🎉' : '💀 AI Wins! 💀'}
            </p>
            <Button onClick={resetGame} size="lg">
              <RefreshCcw className="mr-2 h-5 w-5" /> Play Again
            </Button>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full max-w-6xl">
        {/* Left Column: Player's Board and Stats */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Your Waters</CardTitle>
            </CardHeader>
            <CardContent
              onMouseLeave={() => setHoveredCell(null)} // Clear hover when mouse leaves board area
            >
              <GameBoard
                boardId="player-board"
                boardData={gameState.playerShips.board}
                ships={gameState.playerShips.ships} // Pass player ships to show them
                onCellClick={handlePlayerBoardCellClick}
                disabled={gameState.phase !== 'setup'}
                // For placement preview - needs onCellHover on GameBoard/Cell
                // placementPreviewCells={getPlacementPreview()} // This would require GameBoard to handle onMouseOver
              />
            </CardContent>
          </Card>
          <PlayerStats playerName="Your" hits={gameState.playerAttacks.hits} misses={gameState.playerAttacks.misses} />
           <ShipKey title="Your Fleet Status" ships={gameState.playerShips.ships} isSetupPhase={false} />
        </div>

        {/* Middle Column: Controls / AI Info */}
        <div className="space-y-4">
          {gameState.phase === 'setup' && (
            <SetupPhaseControls
              playerShips={gameState.playerShips.ships}
              onShipSelect={selectShipToPlace}
              selectedShipDefId={gameState.selectedShipDefId}
              orientation={gameState.shipOrientation}
              onToggleOrientation={toggleOrientation}
              onRandomizePlacement={randomizePlayerShips}
              onDonePlacement={startGame}
              canDonePlacement={canDonePlacement}
            />
          )}
           {gameState.phase !== 'setup' && (
             <Button onClick={resetGame} variant="outline" className="w-full">
               <RefreshCcw className="mr-2 h-4 w-4" /> Reset Game
             </Button>
           )}
          {gameState.aiReasoning && gameState.phase !== 'setup' && (
            <Card>
              <CardHeader><CardTitle className="text-sm">AI's Last Move Rationale</CardTitle></CardHeader>
              <CardContent><CardDescription className="text-xs">{gameState.aiReasoning}</CardDescription></CardContent>
            </Card>
          )}
        </div>

        {/* Right Column: AI's Board and Stats */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Enemy Waters</CardTitle>
            </CardHeader>
            <CardContent>
              <GameBoard
                boardId="ai-board"
                boardData={gameState.playerAttacks.board} // Show player's attacks on AI's board
                onCellClick={handleAiBoardCellClick}
                disabled={gameState.phase !== 'playing' || gameState.currentPlayer !== 'player' || gameState.isAiThinking}
                isOpponentBoard={true}
              />
            </CardContent>
          </Card>
          <PlayerStats playerName="AI's" hits={gameState.aiAttacks.hits} misses={gameState.aiAttacks.misses} />
          <ShipKey title="Enemy Fleet Status" ships={gameState.aiShips.ships} isSetupPhase={false} />
        </div>
      </div>
    </div>
  );
}
