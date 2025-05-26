
"use client";

import { useState, useCallback, useEffect } from 'react';
import type { GameState, Coordinate, ShipDefinition, CellState, PlayerBoardState, AttackBoardState, GameBoardArray, Ship } from '@/types/battleship';
import { BOARD_SIZE, SHIP_DEFINITIONS } from '@/config/game-config';
import {
  createInitialBoard,
  isValidPlacement,
  getShipCoordinates,
  processAttack,
  checkWin,
  mapAiPlacedShipsToPlayerBoardState,
  generateRandomPlacement,
} from '@/lib/game-utils';
import { aiOpponentShipPlacement } from '@/ai/flows/ai-opponent-ship-placement';
import type { AiOpponentShipPlacementInput } from '@/ai/flows/ai-opponent-ship-placement';
import { aiOpponentAttackDecision } from '@/ai/flows/ai-opponent-attack-decision';
import type { AiOpponentAttackDecisionInput } from '@/ai/flows/ai-opponent-attack-decision';
import { useToast } from '@/hooks/use-toast';


const initialPlayerBoardState: PlayerBoardState = {
  board: createInitialBoard(),
  ships: [],
};

const initialAttackBoardState: AttackBoardState = {
  board: createInitialBoard(),
  hits: 0,
  misses: 0,
};

const initialGameState: GameState = {
  playerShips: { ...initialPlayerBoardState, ships: [] }, // Deep copy for ships array
  playerAttacks: { ...initialAttackBoardState },
  aiShips: { ...initialPlayerBoardState, ships: [] },
  aiAttacks: { ...initialAttackBoardState },
  currentPlayer: 'player',
  phase: 'setup',
  winner: null,
  statusMessage: 'Place your ships.',
  selectedShipDefId: SHIP_DEFINITIONS[0].id,
  shipOrientation: 'horizontal',
  aiReasoning: null,
  isAiThinking: false,
};

export function useBattleshipGame() {
  const [gameState, setGameState] = useState<GameState>(initialGameState);
  const { toast } = useToast();

  const resetGame = useCallback(() => {
    setGameState({
      ...initialGameState,
      playerShips: { board: createInitialBoard(), ships: [] },
      playerAttacks: { board: createInitialBoard(), hits: 0, misses: 0 },
      aiShips: { board: createInitialBoard(), ships: [] },
      aiAttacks: { board: createInitialBoard(), hits: 0, misses: 0 },
      selectedShipDefId: SHIP_DEFINITIONS[0].id, // Reset selected ship for placement
    });
  }, []);
  
  const selectShipToPlace = useCallback((shipDefId: string) => {
    setGameState(prev => ({ ...prev, selectedShipDefId: shipDefId }));
  }, []);

  const toggleOrientation = useCallback(() => {
    setGameState(prev => ({
      ...prev,
      shipOrientation: prev.shipOrientation === 'horizontal' ? 'vertical' : 'horizontal',
    }));
  }, []);

  const placePlayerShip = useCallback((coord: Coordinate) => {
    if (gameState.phase !== 'setup' || !gameState.selectedShipDefId) return;

    const shipDef = SHIP_DEFINITIONS.find(s => s.id === gameState.selectedShipDefId);
    if (!shipDef || gameState.playerShips.ships.some(s => s.definitionId === shipDef.id)) {
      toast({ title: "Invalid Action", description: "Ship already placed or not selected.", variant: "destructive" });
      return; // Ship already placed or no ship selected
    }
    
    const { board, ships } = gameState.playerShips;
    if (isValidPlacement(board, ships, shipDef, coord, gameState.shipOrientation)) {
      const newBoard = board.map(row => [...row]);
      const shipCoordinates = getShipCoordinates(shipDef, coord, gameState.shipOrientation);
      
      const newShip: Ship = {
        id: `player_${shipDef.id}`,
        definitionId: shipDef.id,
        definition: shipDef,
        coordinates: shipCoordinates,
        hits: [],
        isSunk: false,
        orientation: gameState.shipOrientation,
      };

      shipCoordinates.forEach(c => { newBoard[c.y][c.x] = 'ship'; });
      
      const updatedShips = [...ships, newShip];
      const nextShipToPlace = SHIP_DEFINITIONS.find(sd => !updatedShips.some(us => us.definitionId === sd.id));

      setGameState(prev => ({
        ...prev,
        playerShips: { board: newBoard, ships: updatedShips },
        selectedShipDefId: nextShipToPlace ? nextShipToPlace.id : null,
        statusMessage: nextShipToPlace ? `Place your ${nextShipToPlace.name}.` : "All ships placed. Ready to start!"
      }));
    } else {
      toast({ title: "Invalid Placement", description: "Cannot place ship here. Check bounds or overlap.", variant: "destructive" });
    }
  }, [gameState.phase, gameState.selectedShipDefId, gameState.shipOrientation, gameState.playerShips, toast]);

  const randomizePlayerShips = useCallback(() => {
    let currentBoard = createInitialBoard();
    let placedShips: Ship[] = [];
    let success = true;

    for (const shipDef of SHIP_DEFINITIONS) {
      const placement = generateRandomPlacement(shipDef, placedShips, currentBoard);
      if (placement) {
        const shipCoordinates = getShipCoordinates(shipDef, placement.coord, placement.orientation);
        const newShip: Ship = {
          id: `player_${shipDef.id}`,
          definitionId: shipDef.id,
          definition: shipDef,
          coordinates: shipCoordinates,
          hits: [],
          isSunk: false,
          orientation: placement.orientation,
        };
        placedShips.push(newShip);
        shipCoordinates.forEach(c => { currentBoard[c.y][c.x] = 'ship'; });
      } else {
        success = false; 
        break; 
      }
    }

    if (success) {
      setGameState(prev => ({
        ...prev,
        playerShips: { board: currentBoard, ships: placedShips },
        selectedShipDefId: null,
        statusMessage: "Random placement complete. Ready to start!"
      }));
    } else {
      toast({ title: "Randomization Failed", description: "Could not place all ships randomly. Please try again or place manually.", variant: "destructive"});
      // Optionally reset to empty board or keep partial placement
      setGameState(prev => ({ ...prev, playerShips: { board: createInitialBoard(), ships: [] }, selectedShipDefId: SHIP_DEFINITIONS[0].id }));
    }
  }, [toast]);


  const startGame = useCallback(async () => {
    if (gameState.playerShips.ships.length !== SHIP_DEFINITIONS.length) {
      toast({ title: "Setup Incomplete", description: "Please place all your ships before starting.", variant: "destructive" });
      return;
    }
    
    setGameState(prev => ({ ...prev, isAiThinking: true, statusMessage: "AI is placing its ships..." }));

    try {
      const aiShipSizes = SHIP_DEFINITIONS.map(s => s.size);
      const aiPlacementInput: AiOpponentShipPlacementInput = { gridSize: BOARD_SIZE, shipSizes: aiShipSizes };
      const aiPlacements = await aiOpponentShipPlacement(aiPlacementInput);
      const aiPlayerBoardState = mapAiPlacedShipsToPlayerBoardState(aiPlacements); // Removed the mapping that caused type error
      
      // Add full definition to AI ships for consistency
      const aiShipsWithDefs = aiPlayerBoardState.ships.map(s => {
        const definition = SHIP_DEFINITIONS.find(def => def.id === s.definitionId);
        if (!definition) throw new Error(`Ship definition not found for ID: ${s.definitionId}`);
        return {...s, definition };
      });


      setGameState(prev => ({
        ...prev,
        aiShips: {...aiPlayerBoardState, ships: aiShipsWithDefs},
        phase: 'playing',
        currentPlayer: 'player',
        statusMessage: "Game started! Your turn to attack.",
        isAiThinking: false,
      }));
      toast({ title: "Game On!", description: "AI has placed its ships. Good luck!" });
    } catch (error) {
      console.error("AI ship placement error:", error);
      toast({ title: "AI Error", description: "Failed to get AI ship placements. Try starting again.", variant: "destructive" });
      setGameState(prev => ({ ...prev, isAiThinking: false, statusMessage: "Error with AI setup. Please reset." }));
    }
  }, [gameState.playerShips.ships.length, toast]);

  const handlePlayerAttack = useCallback((coord: Coordinate) => {
    if (gameState.phase !== 'playing' || gameState.currentPlayer !== 'player' || gameState.isAiThinking) return;

    const { updatedBoardState: newAiShipsState, attackResult, hitShipDefId } = processAttack(gameState.aiShips, coord);
    const newPlayerAttacksBoard = gameState.playerAttacks.board.map(row => [...row]);
    newPlayerAttacksBoard[coord.y][coord.x] = attackResult;

    let newPlayerHits = gameState.playerAttacks.hits;
    let newPlayerMisses = gameState.playerAttacks.misses;
    if (attackResult === 'hit' || attackResult === 'sunk') newPlayerHits++;
    else if (attackResult === 'miss') newPlayerMisses++;
    
    const shipDef = SHIP_DEFINITIONS.find(s => s.id === hitShipDefId);
    const hitMsg = shipDef ? `You hit AI's ${shipDef.name}!` : "You hit an AI ship!";
    const sunkMsg = shipDef ? `You sunk AI's ${shipDef.name}!` : "You sunk an AI ship!";

    if (attackResult === 'sunk') toast({ title: "SUNK!", description: sunkMsg, variant: "default" });
    else if (attackResult === 'hit') toast({ title: "HIT!", description: hitMsg, variant: "default" });
    else toast({ title: "MISS!", description: "Your shot missed.", variant: "default" });


    if (checkWin(newAiShipsState.ships)) {
      setGameState(prev => ({
        ...prev,
        aiShips: newAiShipsState,
        playerAttacks: { board: newPlayerAttacksBoard, hits: newPlayerHits, misses: newPlayerMisses },
        phase: 'gameOver',
        winner: 'player',
        statusMessage: "Congratulations! You won!",
      }));
    } else {
      setGameState(prev => ({
        ...prev,
        aiShips: newAiShipsState,
        playerAttacks: { board: newPlayerAttacksBoard, hits: newPlayerHits, misses: newPlayerMisses },
        currentPlayer: 'ai',
        statusMessage: "AI's turn.",
        isAiThinking: true, 
      }));
    }
  }, [gameState, toast]);

  useEffect(() => {
    if (gameState.phase === 'playing' && gameState.currentPlayer === 'ai' && !gameState.winner && gameState.isAiThinking) {
      const performAiAttack = async () => {
        const availableCoordinates: Coordinate[] = [];
        gameState.playerShips.board.forEach((row, y) => {
          row.forEach((cell, x) => {
            // AI should only attack cells not previously attacked by it on player's board.
            // This is represented by gameState.aiAttacks.board.
            if (gameState.aiAttacks.board[y][x] === 'empty') {
              availableCoordinates.push({ x, y });
            }
          });
        });

        const previousAiHits: Coordinate[] = [];
        gameState.aiAttacks.board.forEach((row, y) => {
            row.forEach((cell, x) => {
                if (cell === 'hit' || cell === 'sunk') { // Only actual hits, not just coordinates of sunk ships
                    if (gameState.playerShips.ships.some(ship => ship.coordinates.some(c => c.x === x && c.y === y))) {
                         previousAiHits.push({x, y});
                    }
                }
            });
        });
        
        const opponentBoardStateForAI = gameState.aiAttacks.board.map(row => 
            row.map(cell => cell === 'empty' ? '?' : cell)
        );

        const aiInput: AiOpponentAttackDecisionInput = {
          boardSize: BOARD_SIZE,
          previousHits: previousAiHits,
          opponentBoardState: opponentBoardStateForAI,
          availableCoordinates,
        };

        try {
          const { attackCoordinate, reasoning } = await aiOpponentAttackDecision(aiInput);
          
          const { updatedBoardState: newPlayerShipsState, attackResult, hitShipDefId } = processAttack(gameState.playerShips, attackCoordinate);
          const newAiAttacksBoard = gameState.aiAttacks.board.map(row => [...row]);
          newAiAttacksBoard[attackCoordinate.y][attackCoordinate.x] = attackResult;

          let newAiHits = gameState.aiAttacks.hits;
          let newAiMisses = gameState.aiAttacks.misses;
          if (attackResult === 'hit' || attackResult === 'sunk') newAiHits++;
          else if (attackResult === 'miss') newAiMisses++;

          const shipDef = SHIP_DEFINITIONS.find(s => s.id === hitShipDefId);
          const hitMsg = shipDef ? `AI hit your ${shipDef.name}!` : "AI hit one of your ships!";
          const sunkMsg = shipDef ? `AI sunk your ${shipDef.name}!` : "AI sunk one of your ships!";

          if (attackResult === 'sunk') toast({ title: "AI SUNK!", description: sunkMsg, variant: "destructive" });
          else if (attackResult === 'hit') toast({ title: "AI HIT!", description: hitMsg, variant: "destructive" });
          else toast({ title: "AI MISS!", description: "AI's shot missed.", variant: "default" });


          if (checkWin(newPlayerShipsState.ships)) {
            setGameState(prev => ({
              ...prev,
              playerShips: newPlayerShipsState,
              aiAttacks: { board: newAiAttacksBoard, hits: newAiHits, misses: newAiMisses },
              phase: 'gameOver',
              winner: 'ai',
              statusMessage: "Game Over. AI wins.",
              aiReasoning: reasoning,
              isAiThinking: false,
            }));
          } else {
            setGameState(prev => ({
              ...prev,
              playerShips: newPlayerShipsState,
              aiAttacks: { board: newAiAttacksBoard, hits: newAiHits, misses: newAiMisses },
              currentPlayer: 'player',
              statusMessage: "Your turn.",
              aiReasoning: reasoning,
              isAiThinking: false,
            }));
          }
        } catch (error) {
          console.error("AI attack error:", error);
          toast({ title: "AI Error", description: "AI failed to make a move. Your turn again.", variant: "destructive" });
          setGameState(prev => ({ ...prev, currentPlayer: 'player', statusMessage: "AI error. Your turn.", isAiThinking: false }));
        }
      };

      const timeoutId = setTimeout(performAiAttack, 1500);
      return () => clearTimeout(timeoutId);
    }
  }, [gameState.phase, gameState.currentPlayer, gameState.winner, gameState.isAiThinking, gameState.playerShips, gameState.aiAttacks, toast]);


  return {
    gameState,
    resetGame,
    selectShipToPlace,
    toggleOrientation,
    placePlayerShip,
    randomizePlayerShips,
    startGame,
    handlePlayerAttack,
    canDonePlacement: gameState.playerShips.ships.length === SHIP_DEFINITIONS.length,
  };
}

// Ensure Ship type has definition property, and it is populated where ships are created/processed.
// Initial game state ships are empty arrays. Player ships get definition in placePlayerShip (implicitly, as definition is passed to processAttack etc from SHIP_DEFINITIONS).
// AI ships get definition in mapAiPlacedShipsToPlayerBoardState.
// The processAttack function relies on ship.definition.size.

// Helper to ensure all ships in initial state have definitions if they exist (though they start empty)
// This was problematic and not strictly necessary if definitions are added upon ship creation/processing.
// SHIP_DEFINITIONS.forEach(def => {
//     const playerShipToUpdate = initialGameState.playerShips.ships.find(s => s.definitionId === def.id);
//     if(playerShipToUpdate && !playerShipToUpdate.definition) playerShipToUpdate.definition = def; // This line has type error if Ship expects definition
//     const aiShipToUpdate = initialGameState.aiShips.ships.find(s => s.definitionId === def.id);
//     if(aiShipToUpdate && !aiShipToUpdate.definition) aiShipToUpdate.definition = def; // This line has type error
// });

// Ensure the Ship type in battleship.ts includes the definition property
// export interface Ship {
//   // ... other properties
//   definition: ShipDefinition; // Add this if not present
// }

// In game-utils.ts, when creating ships ensure `definition` is populated:
// Example in placeShipOnBoard or mapAiPlacedShipsToPlayerBoardState:
// const newShip: Ship = {
//   // ...
//   definition: shipDef, // or matchingDef
//   // ...
// };

// In processAttack, ensure targetPlayerBoardState.ships have their definitions
// This is crucial: if (hitShip.hits.length === hitShip.definition.size) {
// This should already be handled if ships are constructed correctly with their definitions.
