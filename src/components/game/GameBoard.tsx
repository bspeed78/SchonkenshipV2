
"use client";

import type { GameBoardArray, Coordinate, Ship } from '@/types/battleship';
import Cell from './Cell';
import { BOARD_SIZE } from '@/config/game-config';
import React from 'react';

interface GameBoardProps {
  boardId: string; // e.g. "player-board" or "ai-board"
  boardData: GameBoardArray;
  ships?: Ship[]; // Optional: to know original ship locations for player's own board display
  onCellClick: (coordinate: Coordinate) => void;
  disabled?: boolean;
  isOpponentBoard?: boolean; // True if this is the board the current player is attacking
  placementPreviewCells?: Coordinate[]; // For highlighting ship placement
}

const GameBoard: React.FC<GameBoardProps> = ({
  boardId,
  boardData,
  ships,
  onCellClick,
  disabled = false,
  isOpponentBoard = false,
  placementPreviewCells = [],
}) => {
  const getIsPlayerShipCell = (coord: Coordinate): boolean => {
    if (isOpponentBoard || !ships) return false;
    return ships.some(ship => ship.coordinates.some(c => c.x === coord.x && c.y === coord.y));
  };

  return (
    <div className="grid grid-cols-10 gap-0.5 bg-primary/20 p-1 rounded-md shadow-lg" role="grid" aria-label={`${isOpponentBoard ? "Opponent's" : "Your"} Battleship Grid`}>
      {boardData.map((row, y) =>
        row.map((cellState, x) => {
          const coord = { x, y };
          const isHighlighted = placementPreviewCells.some(p => p.x === x && p.y === y);
          return (
            <Cell
              key={`${boardId}-cell-${x}-${y}`}
              coordinate={coord}
              state={cellState}
              isPlayerShipCell={!isOpponentBoard && getIsPlayerShipCell(coord)}
              isOpponentBoard={isOpponentBoard}
              onClick={() => onCellClick(coord)}
              disabled={disabled}
              isHighlighted={isHighlighted}
            />
          );
        })
      )}
    </div>
  );
};

export default GameBoard;
