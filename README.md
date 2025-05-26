# Schonkenshipv2

A modern Battleship game with an AI opponent that uses strategic reasoning for ship placement and attacks.

## Overview

Schonkenshipv2 is a web-based implementation of the classic Battleship game, featuring an intelligent AI opponent. The game offers an interactive naval combat experience with a clean, modern UI and strategic gameplay.

## Features

- **Interactive Game Grid**: Place ships and select attack coordinates on a responsive 10x10 grid
- **Strategic Ship Placement**: Place ships manually or use the randomize feature during setup
- **Intelligent AI Opponent**: AI strategically places ships and makes attack decisions using reasoning
- **Turn-Based Gameplay**: Alternating turns between player and AI with clear status indicators
- **Game Notifications**: Visual and textual feedback for hits, misses, and sunk ships
- **Ship Status Display**: Track the status of your fleet and your opponent's fleet
- **Game Statistics**: Monitor hits and misses for both players
- **Responsive Design**: Optimized layout for different screen sizes

## Tech Stack

- **Frontend**: Next.js 15, React 18, TypeScript
- **Styling**: Tailwind CSS with custom naval-themed color palette
- **UI Components**: Radix UI primitives with custom styling
- **AI Integration**: Genkit AI for intelligent opponent behavior
- **State Management**: React hooks with custom game state management

## Game Architecture

### Core Components

- **Game Page** (`src/app/page.tsx`): Main game interface and layout
- **Game State Hook** (`src/hooks/useBattleshipGame.ts`): Central game logic and state management
- **Game Board** (`src/components/game/GameBoard.tsx`): Renders the interactive game grid
- **Setup Controls** (`src/components/game/SetupPhaseControls.tsx`): UI for ship placement phase
- **Ship Key** (`src/components/game/ShipKey.tsx`): Displays ship types and status
- **Player Stats** (`src/components/game/PlayerStats.tsx`): Shows hit/miss statistics

### AI Components

- **Ship Placement AI** (`src/ai/flows/ai-opponent-ship-placement.ts`): Handles strategic ship placement for the AI
- **Attack Decision AI** (`src/ai/flows/ai-opponent-attack-decision.ts`): Determines AI's next attack based on previous hits

### Game Flow

1. **Setup Phase**: 
   - Player places ships on their board (manually or randomly)
   - AI strategically places its ships
   
2. **Playing Phase**:
   - Players take turns attacking each other's boards
   - Hits, misses, and sunk ships are tracked and displayed
   - AI uses reasoning to make strategic attack decisions
   
3. **Game Over Phase**:
   - Game ends when all ships of one player are sunk
   - Winner is announced and option to play again is provided

## Game Configuration

The game is configured with standard Battleship rules:

- 10x10 grid
- 5 ships of varying sizes:
  - Carrier (5 cells)
  - Battleship (4 cells)
  - Cruiser (3 cells)
  - Submarine (3 cells)
  - Destroyer (2 cells)

## AI Features

### Strategic Ship Placement

The AI uses strategic reasoning to place ships in a way that makes them difficult to find:
- Places ships near edges but not always directly on the edge
- Varies ship orientation (horizontal and vertical)
- Avoids obvious patterns
- Ensures ships don't overlap and stay within boundaries

### Intelligent Attack Decisions

The AI makes informed attack decisions based on:
- Prioritizing coordinates near previous hits to sink ships efficiently
- Recognizing patterns (horizontal/vertical lines of hits)
- Using intelligent search strategies when no clear pattern exists
- Avoiding attacking the same coordinate twice

## Development

### Prerequisites

- Node.js 18+ and npm/yarn/pnpm
- Genkit AI API access (for AI opponent functionality)

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/SchonkenshipV2.git
cd SchonkenshipV2

# Install dependencies
npm install
# or
yarn
# or
pnpm install
```

### Running the Development Server

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
```

Open [http://localhost:9002](http://localhost:9002) in your browser to see the game.

### Available Scripts

- `dev`: Runs the development server with Turbopack
- `genkit:dev`: Starts the Genkit AI service
- `genkit:watch`: Starts the Genkit AI service in watch mode
- `build`: Builds the production application
- `start`: Starts the production server
- `lint`: Runs ESLint to check code quality
- `typecheck`: Runs TypeScript type checking

## Style Guidelines

The game follows a naval-themed design with:
- Primary color: Deep sea blue (#31859C)
- Background color: Light desaturated blue (#D4E3E8)
- Accent color: Warm orange (#DA6A44) for hits and notifications
- Clean, sans-serif font for readability
- Simple icons for game elements
- Subtle animations for game actions

## License

[MIT](LICENSE)

## Credits

Developed by Bruce Schonk
