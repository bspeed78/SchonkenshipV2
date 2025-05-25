
"use client";

import type { Ship, ShipDefinition } from '@/types/battleship';
import { SHIP_DEFINITIONS } from '@/config/game-config';
import ShipInfoDisplay from './ShipInfoDisplay';
import React from 'react';

interface ShipKeyProps {
  title: string;
  ships: Ship[]; // Actual ship instances with their current state
  onShipSelect?: (shipDefId: string) => void; // For setup phase
  selectedShipDefId?: string | null; // For setup phase
  isSetupPhase?: boolean;
}

const ShipKey: React.FC<ShipKeyProps> = ({ title, ships, onShipSelect, selectedShipDefId, isSetupPhase }) => {
  
  // In setup phase, we show all definitions. Placed status comes from `ships` prop matching definition.
  // In playing phase, `ships` prop directly gives info on sunk status.
  
  const getShipStatus = (shipDef: ShipDefinition) => {
    if (isSetupPhase) {
      return { isPlaced: ships.some(s => s.definitionId === shipDef.id) };
    }
    const gameShip = ships.find(s => s.definitionId === shipDef.id);
    return { isSunk: gameShip?.isSunk || false };
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-lg">{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {SHIP_DEFINITIONS.map((shipDef) => {
          const status = getShipStatus(shipDef);
          return (
            <ShipInfoDisplay
              key={shipDef.id}
              shipDef={shipDef}
              isPlaced={isSetupPhase ? status.isPlaced : undefined}
              isSunk={!isSetupPhase ? status.isSunk : undefined}
              onClick={isSetupPhase && onShipSelect ? () => onShipSelect(shipDef.id) : undefined}
              isSelected={isSetupPhase && selectedShipDefId === shipDef.id}
            />
          );
        })}
      </CardContent>
    </Card>
  );
};

// Need to import Card components from shadcn
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default ShipKey;

