
"use client";

import type { ShipDefinition } from '@/types/battleship';
import { SHIP_ICONS } from '@/config/game-config';
import { cn } from '@/lib/utils';
import React from 'react';
import { CheckSquare, Square } from 'lucide-react';

interface ShipInfoDisplayProps {
  shipDef: ShipDefinition;
  isPlaced?: boolean; // For setup phase
  isSunk?: boolean; // For playing phase
  onClick?: () => void; // For selecting ship in setup
  isSelected?: boolean; // For highlighting selected ship in setup
}

const ShipInfoDisplay: React.FC<ShipInfoDisplayProps> = ({ shipDef, isPlaced, isSunk, onClick, isSelected }) => {
  const IconComponent = SHIP_ICONS[shipDef.id] || Square;
  
  return (
    <div
      className={cn(
        "flex items-center p-2 border rounded-md transition-all",
        onClick ? "cursor-pointer hover:bg-secondary/30" : "",
        isSelected ? "ring-2 ring-primary bg-primary/10" : "bg-card",
        isSunk ? "opacity-50 line-through bg-muted" : ""
      )}
      onClick={onClick}
      role={onClick ? "button" : undefined}
      aria-pressed={onClick ? isSelected : undefined}
      aria-label={`Ship: ${shipDef.name}, Size: ${shipDef.size}${isSunk ? ", Sunk" : ""}${isPlaced ? ", Placed" : ""}`}
    >
      <IconComponent className={cn("w-5 h-5 mr-2", isSunk ? "text-destructive" : "text-primary")} />
      <span className="text-sm font-medium">{shipDef.name} ({shipDef.size})</span>
      {isPlaced !== undefined && (
        isPlaced ? <CheckSquare className="w-4 h-4 ml-auto text-green-500" /> : <Square className="w-4 h-4 ml-auto text-muted-foreground" />
      )}
    </div>
  );
};

export default ShipInfoDisplay;
