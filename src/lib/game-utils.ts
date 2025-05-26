
import type { GameBoardArray, Coordinate, Ship, ShipDefinition, CellState, PlayerBoardState, PlacedShipFromAI } from '@/types/battleship';
import { BOARD_SIZE, SHIP_DEFINITIONS } from '@/config/game-config';

export function createInitialBoard(): GameBoardArray {
  return Array(BOARD_SIZE).fill(null).map(() => Array(BOARD_SIZE).fill('empty'));
}

export function isValidCoordinate(coord: Coordinate): boolean {
  return coord.x >= 0 && coord.x < BOARD_SIZE && coord.y >= 0 && coord.y < BOARD_SIZE;
}

export function getShipCoordinates(shipDef: ShipDefinition, start: Coordinate, orientation: 'horizontal' | 'vertical'): Coordinate[] {
  const coords: Coordinate[] = [];
  for (let i = 0; i < shipDef.size; i++) {
    if (orientation === 'horizontal') {
      coords.push({ x: start.x + i, y: start.y });
    } else {
      coords.push({ x: start.x, y: start.y + i });
    }
  }
  return coords;
}

export function isValidPlacement(
  board: GameBoardArray,
  ships: Ship[],
  shipDef: ShipDefinition,
  start: Coordinate,
  orientation: 'horizontal' | 'vertical'
): boolean {
  const potentialCoords = getShipCoordinates(shipDef, start, orientation);

  // Check bounds and overlap with existing ships
  for (const coord of potentialCoords) {
    if (!isValidCoordinate(coord)) return false;
    // Check if this cell is already occupied by another ship
    if (ships.some(existingShip => existingShip.coordinates.some(c => c.x === coord.x && c.y === coord.y))) {
        return false;
    }
  }
  return true;
}


export function placeShipOnBoard(
  playerBoardState: PlayerBoardState,
  shipDef: ShipDefinition,
  start: Coordinate,
  orientation: 'horizontal' | 'vertical'
): { updatedBoardState: PlayerBoardState; success: boolean } {
  
  if (!isValidPlacement(playerBoardState.board, playerBoardState.ships, shipDef, start, orientation)) {
    return { updatedBoardState: playerBoardState, success: false };
  }

  const newBoard = playerBoardState.board.map(row => [...row]);
  const shipCoordinates = getShipCoordinates(shipDef, start, orientation);

  const newShip: Ship = {
    id: `${shipDef.id}_${Date.now()}`, // Simple unique ID
    definitionId: shipDef.id,
    coordinates: shipCoordinates,
    hits: [],
    isSunk: false,
    orientation,
  };

  shipCoordinates.forEach(coord => {
    newBoard[coord.y][coord.x] = 'ship';
  });
  
  return {
    updatedBoardState: {
      board: newBoard,
      ships: [...playerBoardState.ships, newShip],
    },
    success: true,
  };
}

export function processAttack(
  targetPlayerBoardState: PlayerBoardState,
  attackCoord: Coordinate
): {
  updatedBoardState: PlayerBoardState;
  attackResult: CellState; // 'hit', 'miss', or 'sunk'
  hitShipDefId?: string;
} {
  const { board, ships } = targetPlayerBoardState;
  const cellToAttack = board[attackCoord.y][attackCoord.x];

  if (cellToAttack === 'hit' || cellToAttack === 'miss' || cellToAttack === 'sunk') {
    // Already attacked this cell
    return { updatedBoardState: targetPlayerBoardState, attackResult: cellToAttack };
  }

  const newBoard = board.map(row => [...row]);
  let newShips = ships.map(s => ({ ...s, hits: [...s.hits], coordinates: [...s.coordinates] })); // Deep copy needed for ships
  let attackResult: CellState = 'miss';
  let hitShipDefId: string | undefined = undefined;

  const shipIndex = newShips.findIndex(ship =>
    ship.coordinates.some(c => c.x === attackCoord.x && c.y === attackCoord.y)
  );

  if (shipIndex !== -1) {
    const hitShip = newShips[shipIndex];
    hitShip.hits.push(attackCoord);
    attackResult = 'hit';
    hitShipDefId = hitShip.definitionId;
    newBoard[attackCoord.y][attackCoord.x] = 'hit';

    if (hitShip.hits.length === hitShip.definition.size) {
      hitShip.isSunk = true;
      attackResult = 'sunk';
      hitShip.coordinates.forEach(coord => {
        newBoard[coord.y][coord.x] = 'sunk';
      });
    }
  } else {
    newBoard[attackCoord.y][attackCoord.x] = 'miss';
  }
  
  return {
    updatedBoardState: { board: newBoard, ships: newShips },
    attackResult,
    hitShipDefId,
  };
}

export function checkWin(ships: Ship[]): boolean {
  return ships.every(ship => ship.isSunk);
}


export function mapAiPlacedShipsToPlayerBoardState(aiPlacements: PlacedShipFromAI[]): PlayerBoardState {
  let board = createInitialBoard();
  const ships: Ship[] = [];

  // Ensure SHIP_DEFINITIONS are sorted by size descending if AI relies on specific order, or match by length
  const sortedShipDefs = [...SHIP_DEFINITIONS].sort((a,b) => b.size - a.size);
  
  // This mapping assumes the AI returns ships in some order that can be matched to definitions.
  // A robust way is to match by length, but AI might return multiple ships of same length.
  // For now, assume AI returns them in an order that matches SHIP_DEFINITIONS or by unique lengths.
  // Or that the GenAI flow is instructed to respect the ship sizes strictly.
  
  let defIndex = 0;
  for (const aiShip of aiPlacements) {
    // Find a ship definition that matches the length and hasn't been used yet.
    const matchingDef = SHIP_DEFINITIONS.find(def => def.size === aiShip.length && !ships.some(s => s.definitionId === def.id));
    
    if (!matchingDef) {
      console.error("Could not find matching ship definition for AI placement:", aiShip);
      continue; // Skip this ship or handle error
    }

    const startCoord: Coordinate = { x: aiShip.col, y: aiShip.row };
    const shipCoords = getShipCoordinates(matchingDef, startCoord, aiShip.orientation);

    const newShip: Ship = {
      id: `ai_${matchingDef.id}`,
      definitionId: matchingDef.id,
      coordinates: shipCoords,
      hits: [],
      isSunk: false,
      orientation: aiShip.orientation,
    };
    ships.push(newShip);

    shipCoords.forEach(coord => {
      if(isValidCoordinate(coord)) {
        board[coord.y][coord.x] = 'ship'; // 'ship' state is internal, player won't see it directly
      }
    });
    defIndex++;
  }
  return { board, ships };
}


export function generateRandomPlacement(shipDef: ShipDefinition, existingShips: Ship[], currentBoard: GameBoardArray): { coord: Coordinate, orientation: 'horizontal' | 'vertical'} | null {
  const orientations: ('horizontal' | 'vertical')[] = ['horizontal', 'vertical'];
  const triedPositions: Set<string> = new Set();

  for (let attempts = 0; attempts < 1000; attempts++) { // Try 1000 times
    const orientation = orientations[Math.floor(Math.random() * orientations.length)];
    const randX = Math.floor(Math.random() * BOARD_SIZE);
    const randY = Math.floor(Math.random() * BOARD_SIZE);
    const startCoord = { x: randX, y: randY };
    const posKey = `${randX}-${randY}-${orientation}`;

    if (triedPositions.has(posKey)) continue;
    triedPositions.add(posKey);
    
    if (isValidPlacement(currentBoard, existingShips, shipDef, startCoord, orientation)) {
      return { coord: startCoord, orientation };
    }
  }
  return null; // Could not find a valid placement
}
