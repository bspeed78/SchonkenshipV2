# Schonkenshipv2 Technical Architecture

This document provides a detailed overview of the technical architecture and implementation details of the Schonkenshipv2 game.

## Directory Structure

```
src/
├── ai/
│   └── flows/
│       ├── ai-opponent-attack-decision.ts  # AI attack logic
│       └── ai-opponent-ship-placement.ts   # AI ship placement logic
├── app/
│   ├── layout.tsx                          # Root layout component
│   └── page.tsx                            # Main game page component
├── components/
│   ├── game/
│   │   ├── Cell.tsx                        # Individual grid cell component
│   │   ├── GameBoard.tsx                   # Game board grid component
│   │   ├── PlayerStats.tsx                 # Player statistics component
│   │   ├── SetupPhaseControls.tsx          # Ship placement controls
│   │   ├── ShipInfoDisplay.tsx             # Ship information display
│   │   └── ShipKey.tsx                     # Ship type and status display
│   └── ui/                                 # Reusable UI components
├── config/
│   └── game-config.ts                      # Game configuration constants
├── hooks/
│   └── useBattleshipGame.ts                # Main game state management hook
├── lib/
│   └── game-utils.ts                       # Game utility functions
└── types/
    └── battleship.ts                       # TypeScript type definitions
```

## Core Components

### Game State Management

The game state is managed through a custom React hook `useBattleshipGame` that centralizes all game logic:

```typescript
// Key parts of the game state
const initialGameState: GameState = {
  playerShips: { board: createInitialBoard(), ships: [] },
  playerAttacks: { board: createInitialBoard(), hits: 0, misses: 0 },
  aiShips: { board: createInitialBoard(), ships: [] },
  aiAttacks: { board: createInitialBoard(), hits: 0, misses: 0 },
  currentPlayer: 'player',
  phase: 'setup',
  winner: null,
  statusMessage: 'Place your ships.',
  selectedShipDefId: SHIP_DEFINITIONS[0].id,
  shipOrientation: 'horizontal',
  aiReasoning: null,
  isAiThinking: false,
};
```

The hook provides functions for:
- Ship placement and orientation
- Game initialization and reset
- Attack handling and turn management
- Win condition checking
- AI interaction

### Game Board Rendering

The `GameBoard` component renders the 10x10 grid and handles cell interactions:

```typescript
const GameBoard: React.FC<GameBoardProps> = ({
  boardId,
  boardData,
  ships,
  onCellClick,
  disabled = false,
  isOpponentBoard = false,
  placementPreviewCells = [],
}) => {
  // Renders a grid of Cell components
  // Handles cell clicks for attacks or ship placement
  // Shows ship positions on player's board
};
```

### Ship Placement

Ship placement is handled through:
1. Manual placement via grid interaction
2. Randomized placement using the `randomizePlayerShips` function
3. AI-driven placement for the opponent

The `SetupPhaseControls` component provides the UI for ship selection and placement options.

## AI Implementation

### Ship Placement AI

The AI ship placement uses a prompt-based approach with strategic considerations:

```typescript
const aiOpponentShipPlacementPrompt = ai.definePrompt({
  // ...
  prompt: `You are an AI that strategically places ships on a grid for a game of Battleship.
    // ...
    Consider these strategies:
      - Place ships near the edges of the grid, but not always directly on the edge.
      - Vary the orientation of the ships (horizontal and vertical).
      - Avoid placing ships in obvious patterns (e.g., all in one line, all clustered together).
      - Ensure ships do not overlap.
      - Ensure ships are entirely within the grid boundaries.
    // ...
  `,
});
```

### Attack Decision AI

The AI attack decision system uses reasoning to make strategic choices:

```typescript
const aiOpponentAttackDecisionPrompt = ai.definePrompt({
  // ...
  prompt: `You are an AI opponent in a battleship game. Your goal is to sink all of the human player's ships.
    // ...
    Given the current state of the game, choose the next coordinate to attack. You should consider the following:
    *   Prioritize attacking coordinates near previous hits to try and sink ships. Consider patterns (horizontal/vertical lines of hits).
    *   If there are no previous hits or no clear pattern, choose a coordinate from availableCoordinates, perhaps using a checkerboard pattern or other intelligent searching strategy.
    // ...
  `,
});
```

The AI provides reasoning for its decisions, which is displayed to the player, enhancing the game experience.

## Game Utilities

The `game-utils.ts` file contains core game logic functions:

- `createInitialBoard()`: Creates an empty game board
- `isValidPlacement()`: Validates ship placement
- `getShipCoordinates()`: Calculates ship coordinates based on position and orientation
- `processAttack()`: Handles attack logic and updates game state
- `checkWin()`: Determines if a player has won
- `generateRandomPlacement()`: Creates random valid ship placements

## Type System

The game uses TypeScript for type safety with key types defined in `battleship.ts`:

```typescript
export interface Coordinate {
  x: number; // Column
  y: number; // Row
}

export type CellState = 'empty' | 'ship' | 'hit' | 'miss' | 'sunk';

export interface Ship {
  id: string;
  definitionId: string;
  coordinates: Coordinate[];
  hits: Coordinate[];
  isSunk: boolean;
  orientation: 'horizontal' | 'vertical';
}

export interface GameState {
  playerShips: PlayerBoardState;
  playerAttacks: AttackBoardState;
  aiShips: PlayerBoardState;
  aiAttacks: AttackBoardState;
  currentPlayer: 'player' | 'ai';
  phase: GamePhase;
  winner: 'player' | 'ai' | null;
  statusMessage: string;
  selectedShipDefId: string | null;
  shipOrientation: 'horizontal' | 'vertical';
  aiReasoning: string | null;
  isAiThinking: boolean;
}
```

## UI Components

The game uses a combination of custom components and Radix UI primitives styled with Tailwind CSS:

- Cards for containing game elements
- Buttons for user interactions
- Custom styled grid cells for the game board
- Toast notifications for game events
- Icons for ships and actions

## Game Flow Implementation

1. **Initialization**:
   - Game starts in 'setup' phase
   - Player places ships manually or randomly
   - AI places ships using strategic reasoning

2. **Gameplay Loop**:
   - Player attacks by clicking on AI's board
   - Attack result is processed and displayed
   - AI makes strategic attack decision with reasoning
   - Turn alternates until win condition is met

3. **Win Condition**:
   - Game checks if all ships of a player are sunk after each attack
   - When win condition is met, game phase changes to 'gameOver'
   - Winner is displayed with option to reset game

## Performance Considerations

- The game uses efficient state updates to minimize re-renders
- AI operations are performed asynchronously to prevent UI blocking
- Ship placement validation is optimized to handle random placement attempts efficiently

## Future Enhancement Opportunities

- Multiplayer support
- Difficulty levels for AI
- Custom board sizes and ship configurations
- Game statistics and leaderboards
- Sound effects and enhanced animations
