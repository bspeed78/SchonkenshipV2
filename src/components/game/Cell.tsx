
"use client";

import type { CellState, Coordinate as CoordinateType } from '@/types/battleship';
import { cn } from '@/lib/utils';
import { Flame, X, Skull } from 'lucide-react'; // Removed Waves, Target as they weren't used for cellContent
import React from 'react';

interface CellProps {
  state: CellState;
  coordinate: CoordinateType;
  isPlayerShipCell?: boolean;
  isOpponentBoard?: boolean;
  onClick: () => void;
  disabled?: boolean;
  isHighlighted?: boolean;
}

const Cell: React.FC<CellProps> = (props) => {
  const { 
    state, 
    isPlayerShipCell = false, 
    isOpponentBoard = false, 
    onClick, 
    disabled = false, 
    isHighlighted = false 
  } = props;

  const currentCoordinate = props.coordinate;

  const baseStyle =
    'w-8 h-8 md:w-10 md:h-10 border border-primary/30 flex items-center justify-center transition-all duration-300 ease-in-out';
  
  let cellContent: React.ReactNode = null;
  let cellStyle = '';

  switch (state) {
    case 'empty':
      cellStyle = 'bg-primary/10 hover:bg-primary/20';
      if (isHighlighted) cellStyle = 'bg-green-400/50';
      break;
    case 'ship':
      if (isPlayerShipCell || isHighlighted) {
        cellStyle = 'bg-primary text-primary-foreground';
      } else if (isOpponentBoard) {
        cellStyle = 'bg-primary/10 hover:bg-primary/20';
      } else {
         cellStyle = 'bg-primary/10 hover:bg-primary/20';
      }
      break;
    case 'hit':
      cellStyle = 'bg-accent text-accent-foreground animate-pulse';
      cellContent = <Flame size={18} />;
      break;
    case 'miss':
      cellStyle = 'bg-secondary/50 text-secondary-foreground/80';
      cellContent = <X size={18} />;
      break;
    case 'sunk':
      cellStyle = 'bg-destructive text-destructive-foreground';
      cellContent = <Skull size={18} />;
      break;
  }

  const canClick = !disabled && (state === 'empty' || (isOpponentBoard && state !== 'hit' && state !== 'miss' && state !== 'sunk'));

  const ariaLabel = currentCoordinate 
    ? `Cell at ${String.fromCharCode(65 + currentCoordinate.y)}${currentCoordinate.x + 1} - ${state}`
    : `Cell - ${state}`;

  return (
    <button
      onClick={canClick ? onClick : undefined}
      disabled={!canClick}
      className={cn(
        baseStyle,
        cellStyle,
        canClick ? 'cursor-pointer' : 'cursor-not-allowed',
        isHighlighted && 'opacity-70 ring-2 ring-green-500'
      )}
      aria-label={ariaLabel}
    >
      {cellContent}
    </button>
  );
};

export default Cell;
