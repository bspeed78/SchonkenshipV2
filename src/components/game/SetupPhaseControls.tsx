
"use client";

import React from 'react';
import { Button } from '@/components/ui/button';
import { RotateCcw, Shuffle, CheckCircle, Ship as ShipIcon } from 'lucide-react'; // CheckCircle for Done
import ShipKey from './ShipKey';
import type { Ship, ShipDefinition } from '@/types/battleship';
import { SHIP_DEFINITIONS } from '@/config/game-config';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface SetupPhaseControlsProps {
  playerShips: Ship[]; // Already placed ships to show status in ShipKey
  onShipSelect: (shipDefId: string) => void;
  selectedShipDefId: string | null;
  orientation: 'horizontal' | 'vertical';
  onToggleOrientation: () => void;
  onRandomizePlacement: () => void;
  onDonePlacement: () => void;
  canDonePlacement: boolean;
}

const SetupPhaseControls: React.FC<SetupPhaseControlsProps> = ({
  playerShips,
  onShipSelect,
  selectedShipDefId,
  orientation,
  onToggleOrientation,
  onRandomizePlacement,
  onDonePlacement,
  canDonePlacement,
}) => {
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-lg">Place Your Fleet</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <ShipKey
          title="Your Ships"
          ships={playerShips}
          onShipSelect={onShipSelect}
          selectedShipDefId={selectedShipDefId}
          isSetupPhase={true}
        />
        <div className="space-y-2">
          <Button onClick={onToggleOrientation} variant="outline" className="w-full">
            <RotateCcw className="mr-2 h-4 w-4" /> Toggle Orientation ({orientation})
          </Button>
          <Button onClick={onRandomizePlacement} variant="outline" className="w-full">
            <Shuffle className="mr-2 h-4 w-4" /> Randomize Placement
          </Button>
        </div>
        <Button onClick={onDonePlacement} disabled={!canDonePlacement} className="w-full">
          <CheckCircle className="mr-2 h-4 w-4" /> Done Placing
        </Button>
        {!canDonePlacement && <p className="text-xs text-muted-foreground text-center">Place all ships to continue.</p>}
      </CardContent>
    </Card>
  );
};

export default SetupPhaseControls;
