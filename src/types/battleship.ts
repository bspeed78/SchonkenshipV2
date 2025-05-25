
export interface Coordinate {
  x: number; // Column
  y: number; // Row
}

export type CellState = 'empty' | 'ship' | 'hit' | 'miss' | 'sunk';

export interface ShipDefinition {
  id: string; // e.g., 'carrier', 'battleship'
  name: string;
  size: number;
}

export interface Ship {
  id: string; // Unique instance ID, e.g., 'player_carrier'
  definitionId: string; // References ShipDefinition.id
  coordinates: Coordinate[];
  hits: Coordinate[]; // Coordinates that have been hit on this ship
  isSunk: boolean;
  orientation: 'horizontal' | 'vertical';
}

export type GameBoardArray = CellState[][];

export interface PlayerBoardState {
  board: GameBoardArray;
  ships: Ship[];
}

// Represents a player's record of attacks on the opponent
export interface AttackBoardState {
  board: GameBoardArray; // Shows results of attacks (hit, miss, sunk)
  hits: number;
  misses: number;
}

export type GamePhase = 'setup' | 'playing' | 'gameOver';

export interface GameState {
  playerShips: PlayerBoardState; // Player's own ships and board state
  playerAttacks: AttackBoardState; // Player's view of AI's board (their attacks)
  aiShips: PlayerBoardState; // AI's ships and board state (hidden from player)
  aiAttacks: AttackBoardState; // AI's view of Player's board (AI's attacks)
  
  currentPlayer: 'player' | 'ai';
  phase: GamePhase;
  winner: 'player' | 'ai' | null;
  
  statusMessage: string; // For general game messages like "Place your ships", "Your turn"
  
  // For setup phase
  selectedShipDefId: string | null;
  shipOrientation: 'horizontal' | 'vertical';

  // AI specific
  aiReasoning: string | null;
  isAiThinking: boolean;
}

// For AI ship placement output mapping
export interface PlacedShipFromAI {
  row: number;
  col: number;
  length: number;
  orientation: 'horizontal' | 'vertical';
}
